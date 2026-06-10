import type { WxPayResponse } from '../types/index.js';
import type {
  CreateAppCombineOrderRequest,
  CreateAppCombineOrderResponse,
  QueryCombineOrderParams,
  QueryCombineOrderResponse,
  CloseCombineOrderParams,
  CloseCombineOrderRequest,
  CreateRefundRequest,
  CreateRefundResponse,
  ApplyAbnormalRefundRequest,
  ApplyAbnormalRefundResponse,
  QueryRefundParams,
  QueryRefundResponse,
  TradeBillParams,
  TradeBillResponse,
  FundFlowBillParams,
  FundFlowBillResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * APP 合单支付服务
 *
 * 提供 APP 合单支付全流程相关的 API 封装，包括：
 * - APP 合单下单（获取 prepay_id，用于通过 OpenSDK 调起支付）
 * - 查询合单订单
 * - 关闭合单订单
 * - 申请退款（基于子单）
 * - 查询退款单
 * - 申请异常退款
 * - 申请交易账单
 * - 申请资金账单
 * - 下载账单
 *
 * 合单支付允许一笔支付中包含 2-10 个子单，适用于多商户场景。
 * 各子单商户号需与合单发起方 APPID 绑定。
 *
 * APP 合单支付流程：
 * 1. 调用 createOrder 获取 prepay_id
 * 2. 使用 buildAppBridgeConfig 生成调起支付参数，通过 OpenSDK 的 sendReq 调起微信支付
 * 3. 用户支付完成后，通过回调通知或主动查询确认订单状态
 * 4. 退款时需基于子单进行退款，无法通过合单商户订单号退款
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556944 (APP 合单下单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012557006 (查询合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012577452 (关闭合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556524 (申请退款)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556587 (查询退款单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556692 (下载交易账单)
 */
export class CombineAppService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * APP 合单下单
   *
   * 商户通过此接口生成 APP 合单预付单并获取 prepay_id。
   * 获取 prepay_id 后，配合 buildAppBridgeConfig 生成调起支付参数，
   * 通过微信 OpenSDK 的 sendReq 方法在商户 APP 内调起微信支付收银台。
   *
   * prepay_id 有效期为 2 小时，超过 2 小时需使用原下单参数重新请求。
   *
   * 关键约束：
   * - combine_mchid 需先申请发起合单支付权限
   * - sub_orders 中的 mchid 需先申请接收合单支付权限
   * - 合单发起方和子单参与方需绑定同一个 combine_appid
   * - combine_appid 必须为移动应用 APPID
   * - 子单数量为 2-10 笔
   * - time_expire 不能早于下单时间后 1 分钟，不能超过下单时间后 7 天
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556944
   */
  async createOrder(
    request: CreateAppCombineOrderRequest,
  ): Promise<WxPayResponse<CreateAppCombineOrderResponse>> {
    return this.client.post<CreateAppCombineOrderResponse>('/v3/combine-transactions/app', request);
  }

  /**
   * 查询合单订单
   *
   * 通过合单商户订单号查询合单订单的支付状态及各子单详情。
   * 合单支付订单需使用合单查单接口，不可使用非合单支付的查单接口。
   *
   * 订单状态（sub_orders[].trade_state）：
   * - SUCCESS：支付成功（终态）
   * - NOTPAY：未支付
   * - CLOSED：已关闭（终态）
   *
   * 典型使用场景：
   * - 用户支付后从微信收银台返回商户 APP 时，OpenSDK 回调 onResp 后确认订单支付状态
   * - 未收到支付成功回调通知时，主动查询确认订单状态
   * - 关单前确认订单仍为未支付状态
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012557006
   */
  async queryOrderById(
    params: QueryCombineOrderParams,
  ): Promise<WxPayResponse<QueryCombineOrderResponse>> {
    return this.client.get<QueryCombineOrderResponse>(
      `/v3/combine-transactions/out-trade-no/${params.combineOutTradeNo}`,
    );
  }

  /**
   * 关闭合单订单
   *
   * 对于未支付的合单订单，商户可通过此接口关闭订单。
   * 关单后，所有子单状态从未支付（NOTPAY）流转为已关闭（CLOSED）。
   *
   * 关键约束：
   * - 只能整单关闭，不支持关闭部分子单
   * - combine_appid、sub_orders 中的 mchid 和 out_trade_no 必须与下单时完全一致
   * - 仅支持未支付状态的订单
   * - 关单后订单为失败终态
   *
   * 典型使用场景：
   * - 用户超过商户系统内部规定的支付时间
   * - 超过下单时设置的 time_expire 时间
   * - 因特殊原因需在可支付时间范围内关闭订单
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012577452
   */
  async closeOrder(
    params: CloseCombineOrderParams,
    request: CloseCombineOrderRequest,
  ): Promise<WxPayResponse> {
    return this.client.post(
      `/v3/combine-transactions/out-trade-no/${params.combineOutTradeNo}/close`,
      request,
    );
  }

  /**
   * 申请退款（基于子单）
   *
   * 合单支付的订单退款，无法通过合单商户订单号（combine_out_trade_no）退款，
   * 只能根据单个子单进行退款。传入子单的 out_trade_no 或 transaction_id。
   *
   * 当子单状态为支付成功（SUCCESS）时，商户可通过此接口申请退款。
   * 仅支持支付成功后 1 年内的订单。
   *
   * 注意：
   * - 一笔订单最多支持 50 次部分退款，间隔至少 1 分钟
   * - 重试时必须使用原商户退款单号，避免重复退款
   * - 接口返回成功仅表示受理成功，最终结果以回调通知和查询接口为准
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556524
   */
  async createRefund(request: CreateRefundRequest): Promise<WxPayResponse<CreateRefundResponse>> {
    return this.client.post<CreateRefundResponse>('/v3/refund/domestic/refunds', request);
  }

  /**
   * 查询退款单
   *
   * 通过商户退款单号查询退款状态。
   * 退款申请成功后，可通过此接口确认退款是否到账。
   *
   * 退款状态：
   * - SUCCESS：退款成功
   * - CLOSED：退款关闭
   * - PROCESSING：退款处理中
   * - ABNORMAL：退款异常
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556587
   */
  async queryRefund(params: QueryRefundParams): Promise<WxPayResponse<QueryRefundResponse>> {
    return this.client.get<QueryRefundResponse>(
      `/v3/refund/domestic/refunds/${params.outRefundNo}`,
    );
  }

  /**
   * 申请异常退款
   *
   * 当退款状态为 ABNORMAL 时，可通过此接口发起异常退款处理。
   * 支持退款至用户银行卡或退款至交易商户银行账户两种方式。
   *
   * @param refundId - 微信支付退款单号
   * @param request - 异常退款请求参数
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013420988
   */
  async applyAbnormalRefund(
    refundId: string,
    request: ApplyAbnormalRefundRequest,
  ): Promise<WxPayResponse<ApplyAbnormalRefundResponse>> {
    return this.client.post<ApplyAbnormalRefundResponse>(
      `/v3/refund/domestic/refunds/${refundId}/apply-abnormal-refund`,
      request,
    );
  }

  /**
   * 申请交易账单
   *
   * 合单支付的订单账单是以子单为维度，每笔子单都会记录在各个子单商户账单内，
   * 需要各个子单商户自己进行下载。
   *
   * 商户可通过此接口获取交易账单的下载链接，下载地址 5 分钟内有效。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556692
   */
  async tradeBill(params: TradeBillParams): Promise<WxPayResponse<TradeBillResponse>> {
    return this.client.get<TradeBillResponse>('/v3/bill/tradebill', params);
  }

  /**
   * 申请资金账单
   *
   * 商户可通过此接口获取资金账单的下载链接，下载地址 5 分钟内有效。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556748
   */
  async fundFlowBill(params: FundFlowBillParams): Promise<WxPayResponse<FundFlowBillResponse>> {
    return this.client.get<FundFlowBillResponse>('/v3/bill/fundflowbill', params);
  }

  /**
   * 下载账单
   *
   * 通过申请账单接口返回的 download_url，以 GET 方式下载账单原始文件。
   * 下载地址 5 分钟内有效，请及时下载。
   * 返回的 data 为 Buffer，可能为 GZIP 压缩格式，需要自行解压。
   *
   * @param downloadUrl - 申请账单返回的 download_url
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012085923
   */
  async downloadBill(downloadUrl: string): Promise<WxPayResponse<Buffer>> {
    return this.client.downloadRaw(downloadUrl);
  }
}
