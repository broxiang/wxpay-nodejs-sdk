import type { WxPayResponse } from '../types/index.js';
import type {
  CreateRefundRequest,
  CreateRefundResponse,
  QueryRefundParams,
  QueryRefundResponse,
  ApplyAbnormalRefundRequest,
  ApplyAbnormalRefundResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 境内退款服务
 *
 * 提供独立的退款 API 封装，不绑定特定支付方式。
 * 适用于所有支付方式（JSAPI/APP/H5/Native）的退款场景。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071001 (产品介绍)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071036 (申请退款)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071041 (查询单笔退款)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071193 (发起异常退款)
 */
export class RefundService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 申请退款
   *
   * 当交易发生之后一段时间内，由于买家或者卖家的原因需要退款时，
   * 卖家可以通过退款接口将支付款退还给买家。
   * 支持单笔交易分多次退款，多次退款需要提交原支付订单的商户订单号和设置不同的退款单号。
   * 一笔退款失败后重新提交，要采用原来的退款单号。
   *
   * @param request - 退款请求参数，包含商户订单号、退款单号、退款金额等信息
   * @returns 退款申请结果，包含微信退款单号、退款状态等
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071036
   */
  async create(request: CreateRefundRequest): Promise<WxPayResponse<CreateRefundResponse>> {
    return this.client.post<CreateRefundResponse>('/v3/refund/domestic/refunds', request);
  }

  /**
   * 查询单笔退款（通过商户退款单号）
   *
   * 提交退款申请后，通过调用该接口查询退款状态。
   * 退款有一定延时，建议在提交退款申请后1分钟再查询退款状态。
   *
   * @param params - 查询参数，需包含 outRefundNo（商户退款单号）
   * @returns 退款单详情，包含退款状态、退款金额、退款渠道等
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071041
   */
  async queryByOutRefundNo(params: QueryRefundParams): Promise<WxPayResponse<QueryRefundResponse>> {
    return this.client.get<QueryRefundResponse>(
      `/v3/refund/domestic/refunds/${params.outRefundNo}`,
    );
  }

  /**
   * 发起异常退款
   *
   * 当退款因为用户账户异常而无法原路退回时，可使用此接口将退款资金
   * 退到用户的其他银行卡或商户的银行账户。
   *
   * @param refundId - 微信支付退款单号
   * @param request - 异常退款请求参数，包含退款方式、收款账户信息等
   * @returns 异常退款处理结果
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071193
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
