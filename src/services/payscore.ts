import type { WxPayResponse } from '../types/index.js';
import type {
  CreatePayScoreOrderRequest,
  CreatePayScoreOrderResponse,
  QueryPayScoreOrderParams,
  QueryPayScoreOrderResponse,
  CancelPayScoreOrderRequest,
  CancelPayScoreOrderResponse,
  CompletePayScoreOrderRequest,
  CompletePayScoreOrderResponse,
  ModifyPayScoreOrderRequest,
  ModifyPayScoreOrderResponse,
  SyncPayScoreOrderRequest,
  SyncPayScoreOrderResponse,
  CreateRefundRequest,
  CreateRefundResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 微信支付分 服务
 *
 * 提供微信支付分全流程相关的 API 封装，包括：
 * - 创建支付分订单
 * - 查询支付分订单
 * - 取消支付分订单
 * - 完结支付分订单
 * - 修改订单金额
 * - 同步订单状态
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587900
 */
export class PayScoreService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 创建支付分订单
   *
   * 当用户申请使用服务时，商户需调用此接口创建支付分订单。
   * 创单成功后订单状态 state 为 CREATED（已创建），返回的 package
   * 参数用于拉起支付分小程序确认订单页面。
   *
   * - 需确认模式下，need_user_confirm 必须固定传 true
   * - risk_fund.name：先免模式可选 DEPOSIT/ADVANCE/CASH_DEPOSIT，先享模式固定 ESTIMATE_ORDER_COST
   * - risk_fund.amount 不可超过服务ID风险金额上限
   * - 该接口支持原参重入，相同参数重复调用可以返回成功
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587900
   */
  async createOrder(
    request: CreatePayScoreOrderRequest,
  ): Promise<WxPayResponse<CreatePayScoreOrderResponse>> {
    return this.client.post<CreatePayScoreOrderResponse>('/v3/payscore/serviceorder', request);
  }

  /**
   * 查询支付分订单
   *
   * 通过商户服务订单号或回跳查询ID查询支付分订单状态和详情。
   * out_order_no 和 query_id 必须提供其中一个，不可同时提供。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587902
   */
  async queryOrder(
    params: QueryPayScoreOrderParams,
  ): Promise<WxPayResponse<QueryPayScoreOrderResponse>> {
    const queryParams: Record<string, string> = {
      service_id: params.service_id,
      appid: params.appid,
    };
    if (params.out_order_no) {
      queryParams['out_order_no'] = params.out_order_no;
    }
    if (params.query_id) {
      queryParams['query_id'] = params.query_id;
    }
    return this.client.get<QueryPayScoreOrderResponse>('/v3/payscore/serviceorder', queryParams);
  }

  /**
   * 取消支付分订单
   *
   * 取消已创建、用户已确认或待支付状态的支付分订单。
   * 可在订单状态为 CREATED、USER_CONFIRM（用户已确认）和 USER_PAYING（待支付）时调用。
   *
   * - 若因网络原因未获取到接口返回内容，可使用相同参数重试，该接口支持原参重入
   * - 待支付订单若用户正主动支付或系统正自动扣款时调用，可能报错，建议等待 3 分钟后重试
   *
   * @param outOrderNo - 商户服务订单号
   * @param request - 取消订单请求参数
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587905
   */
  async cancelOrder(
    outOrderNo: string,
    request: CancelPayScoreOrderRequest,
  ): Promise<WxPayResponse<CancelPayScoreOrderResponse>> {
    return this.client.post<CancelPayScoreOrderResponse>(
      `/v3/payscore/serviceorder/${outOrderNo}/cancel`,
      request,
    );
  }

  /**
   * 完结支付分订单
   *
   * 服务完成后，商户需调用此接口通知微信支付服务已结束。
   * 订单完结后，支付分会持续自动扣款，无需重复调用完结接口。
   *
   * - total_amount = 后付费项目金额总和 - 优惠项目金额总和
   * - 先免模式：订单收款总金额 ≤ 创单传的服务风险金额 ≤ 服务ID风险金额上限
   * - 先享模式：订单收款总金额 ≤ 服务ID风险金额上限
   * - 调用完结接口后 collection.state 变为 USER_PAYING（待支付状态）
   *
   * @param outOrderNo - 商户服务订单号
   * @param request - 完结订单请求参数
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587955
   */
  async completeOrder(
    outOrderNo: string,
    request: CompletePayScoreOrderRequest,
  ): Promise<WxPayResponse<CompletePayScoreOrderResponse>> {
    return this.client.post<CompletePayScoreOrderResponse>(
      `/v3/payscore/serviceorder/${outOrderNo}/complete`,
      request,
    );
  }

  /**
   * 修改订单金额
   *
   * 当订单处于 USER_PAYING（待支付）状态时，商户可调用此接口下调收款金额。
   * 修改成功后微信侧将按新金额发起扣款。
   *
   * - 只能下调扣款金额，不能上调
   * - total_amount = post_payments.amount 总和 - post_discounts.amount 总和
   *
   * @param outOrderNo - 商户服务订单号
   * @param request - 修改订单金额请求参数
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587957
   */
  async modifyOrder(
    outOrderNo: string,
    request: ModifyPayScoreOrderRequest,
  ): Promise<WxPayResponse<ModifyPayScoreOrderResponse>> {
    return this.client.post<ModifyPayScoreOrderResponse>(
      `/v3/payscore/serviceorder/${outOrderNo}/modify`,
      request,
    );
  }

  /**
   * 同步订单状态
   *
   * 当支付分订单处于 USER_PAYING（待支付）状态，用户通过其他渠道支付后，
   * 商户可调用此接口将订单改为已完成状态，微信支付将不再发起扣款。
   *
   * - type 固定传 Order_Paid
   * - paid_time 需满足：完结接口时间 < paid_time ≤ 同步接口时间 + 60 秒
   * - 若用户正在通过支付分收银台支付或自动扣款中，调用可能报错，可等 3 分钟后重试
   *
   * @param outOrderNo - 商户服务订单号
   * @param request - 同步订单状态请求参数
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587962
   */
  async syncOrder(
    outOrderNo: string,
    request: SyncPayScoreOrderRequest,
  ): Promise<WxPayResponse<SyncPayScoreOrderResponse>> {
    return this.client.post<SyncPayScoreOrderResponse>(
      `/v3/payscore/serviceorder/${outOrderNo}/sync`,
      request,
    );
  }

  /**
   * 申请退款
   *
   * 支付分订单完结扣款后，如需退款可通过此接口发起。
   * transaction_id 来源于支付成功回调或查询支付分订单中的 collection.details。
   *
   * @param request - 退款请求参数
   * @returns 退款结果
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587971
   */
  async applyRefund(request: CreateRefundRequest): Promise<WxPayResponse<CreateRefundResponse>> {
    return this.client.post<CreateRefundResponse>('/v3/refund/domestic/refunds', request);
  }

  /**
   * 查询单笔退款
   *
   * 通过商户退款单号查询退款状态和详情。
   *
   * @param outRefundNo - 商户退款单号
   * @returns 退款详情
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587973
   */
  async queryRefund(outRefundNo: string): Promise<WxPayResponse<CreateRefundResponse>> {
    return this.client.get<CreateRefundResponse>(`/v3/refund/domestic/refunds/${outRefundNo}`);
  }
}
