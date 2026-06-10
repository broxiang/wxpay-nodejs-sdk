import type { WxPayResponse } from '../types/index.js';
import type {
  CreateCombineOrderRequest,
  CreateCombineOrderResponse,
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
 * 合单支付服务
 *
 * 提供 JSAPI 合单支付全流程相关的 API 封装，包括：
 * - JSAPI 合单下单（获取 prepay_id）
 * - 查询合单订单
 * - 关闭合单订单
 * - 申请退款
 * - 查询退款
 * - 申请异常退款
 *
 * 合单支付允许一笔支付中包含 2-10 个子单，适用于多商户场景。
 * 各子单商户号需与合单发起方 APPID 绑定。
 *
 * 注意：对于合单支付的订单，无法通过合单支付总单号 combine_out_trade_no 退款，
 * 只能根据单个子单的 transaction_id 或 out_trade_no 进行退款。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556926 (合单下单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421222 (查询合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421225 (关闭合单订单)
 */
export class CombineService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * JSAPI 合单下单
   *
   * 商户通过此接口生成合单预付单并获取 prepay_id。
   * prepay_id 有效期为 2 小时，超过 2 小时需使用原下单参数重新请求。
   *
   * 关键约束：
   * - combine_mchid 需先申请发起合单支付权限
   * - sub_orders 中的 mchid 需先申请接收合单支付权限
   * - 合单发起方和子单参与方需绑定同一个 combine_appid
   * - 子单数量为 2-10 笔
   * - time_expire 不能早于下单时间后 1 分钟，不能超过下单时间后 7 天
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556926
   */
  async createOrder(
    request: CreateCombineOrderRequest,
  ): Promise<WxPayResponse<CreateCombineOrderResponse>> {
    return this.client.post<CreateCombineOrderResponse>('/v3/combine-transactions/jsapi', request);
  }

  /**
   * 查询合单订单
   *
   * 通过合单商户订单号查询合单订单的支付状态及各子单详情。
   *
   * 订单状态（sub_orders[].trade_state）：
   * - SUCCESS：支付成功（终态）
   * - NOTPAY：未支付
   * - CLOSED：已关闭（终态）
   *
   * 注意：请勿使用非合单支付的查单接口查询合单订单。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421222
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
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421225
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
   * 申请退款
   *
   * 当子单状态为支付成功（SUCCESS）时，商户可通过此接口对子单申请退款。
   * 仅支持支付成功后 1 年内的订单。
   *
   * 注意：合单支付的订单无法通过合单总单号 combine_out_trade_no 退款，
   * 需要传入子单的 transaction_id 或 out_trade_no。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421249
   */
  async createRefund(request: CreateRefundRequest): Promise<WxPayResponse<CreateRefundResponse>> {
    return this.client.post<CreateRefundResponse>('/v3/refund/domestic/refunds', request);
  }

  /**
   * 查询退款单
   *
   * 通过商户退款单号查询退款状态。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421261
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
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421269
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
