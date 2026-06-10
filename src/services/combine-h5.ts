import type { WxPayResponse } from '../types/index.js';
import type {
  CreateH5CombineOrderRequest,
  CreateH5CombineOrderResponse,
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
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * H5 合单支付服务
 *
 * 提供 H5 合单支付全流程相关的 API 封装，包括：
 * - H5 合单下单（获取 h5_url 用于跳转支付中间页）
 * - 查询合单订单
 * - 关闭合单订单
 * - 申请退款（基于子单）
 * - 查询退款单
 * - 申请异常退款
 *
 * 合单支付允许一笔支付中包含 2-10 个子单，适用于多商户场景。
 * 各子单商户号需与合单发起方 APPID 绑定。
 *
 * H5 合单支付流程：
 * 1. 调用 createOrder 获取 h5_url
 * 2. 在已配置 H5 支付域名的网页中跳转 h5_url 唤起微信支付收银台
 * 3. 用户支付完成后，通过回调通知或主动查询确认订单状态
 * 4. 退款时需基于子单进行退款，无法通过合单商户订单号退款
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556961 (H5 合单下单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421126 (查询合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421130 (关闭合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421148 (合单退款)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421156 (查询退款单)
 */
export class CombineH5Service {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * H5 合单下单
   *
   * 商户通过此接口生成 H5 合单支付链接（h5_url），用于在已配置 H5 支付域名的
   * 网页中跳转并唤起微信支付收银台。h5_url 有效期为 5 分钟，过期后需使用
   * 原下单参数重新请求。
   *
   * 关键约束：
   * - combine_mchid 需先申请发起合单支付权限
   * - sub_orders 中的 mchid 需先申请接收合单支付权限
   * - 合单发起方和子单参与方需绑定同一个 combine_appid
   * - 子单数量为 2-10 笔
   * - scene_info.payer_client_ip 需传真实的用户端 IP
   * - scene_info.h5_info 必填，需指定 type 为 Wap/iOS/Android 之一
   * - time_expire 不能早于下单时间后 1 分钟，不能超过下单时间后 7 天
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556961
   */
  async createOrder(
    request: CreateH5CombineOrderRequest,
  ): Promise<WxPayResponse<CreateH5CombineOrderResponse>> {
    return this.client.post<CreateH5CombineOrderResponse>('/v3/combine-transactions/h5', request);
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
   * - 用户支付后从收银台返回商户页面时，确认订单支付状态
   * - 未收到支付成功回调通知时，主动查询确认订单状态
   * - 关单前确认订单仍为未支付状态
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421126
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
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421130
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
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421148
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
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421156
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
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421164
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
}
