import type { WxPayResponse } from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/** 电商收付通退款金额 */
export interface EcommerceRefundAmount {
  /** 退款金额（分） */
  refund: number;
  /** 原订单金额（分） */
  total: number;
  /** 货币类型 */
  currency?: string;
}

/** 电商收付通申请退款请求 */
export interface CreateEcommerceRefundRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 电商平台 AppID */
  sp_appid: string;
  /** 特约商户 AppID */
  sub_appid?: string;
  /** 微信支付订单号 */
  transaction_id?: string;
  /** 商户订单号 */
  out_trade_no?: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 退款原因 */
  reason?: string;
  /** 退款金额 */
  amount: EcommerceRefundAmount;
  /** 回调通知地址 */
  notify_url?: string;
  /** 退款资金来源 */
  funds_account?: string;
}

/** 电商收付通申请退款响应 */
export interface CreateEcommerceRefundResponse {
  /** 微信退款单号 */
  refund_id: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 创建时间 */
  create_time: string;
  /** 退款金额 */
  amount: EcommerceRefundAmount;
}

/** 电商收付通查询退款响应 */
export interface QueryEcommerceRefundResponse {
  refund_id: string;
  out_refund_no: string;
  transaction_id: string;
  out_trade_no: string;
  channel?: string;
  user_received_account: string;
  success_time?: string;
  create_time: string;
  /** 退款状态 */
  status: string;
  amount: EcommerceRefundAmount;
  promotion_detail?: {
    promotion_id: string;
    scope: string;
    type: string;
    amount: number;
    refund_amount: number;
  }[];
  /** 退款出资账户 */
  refund_account?: string;
  /** 资金账户 */
  funds_account?: string;
}

/** 电商收付通垫付退款回补请求 */
export interface CreateReturnAdvanceRequest {
  /** 微信退款单号（必须是垫付退款的微信退款单） */
  refund_id: string;
  /** 二级商户号 */
  sub_mchid: string;
}

/** 电商收付通垫付退款回补响应 */
export interface ReturnAdvanceResponse {
  /** 微信退款单号 */
  refund_id: string;
  /** 微信回补单号 */
  advance_return_id: string;
  /** 垫付回补金额（分） */
  return_amount: number;
  /** 出款方商户号 */
  payer_mchid: string;
  /** 出款方账户：BASIC / OPERATION */
  payer_account: string;
  /** 入账方商户号 */
  payee_mchid: string;
  /** 入账方账户：BASIC / OPERATION */
  payee_account: string;
  /** 垫付回补结果：SUCCESS / FAILED / PROCESSING */
  result: string;
  /** 垫付回补完成时间 */
  success_time?: string;
}

/**
 * 电商收付通退款服务
 *
 * 用于电商平台对二级商户的订单进行退款。
 *
 * @see https://pay.weixin.qq.com/doc/v3/partner/4013080625 (申请退款)
 */
export class EcommerceRefundService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 申请退款
   *
   * @param request - 退款请求参数
   * @returns 退款结果
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4013080625
   */
  async create(
    request: CreateEcommerceRefundRequest,
  ): Promise<WxPayResponse<CreateEcommerceRefundResponse>> {
    return this.client.post<CreateEcommerceRefundResponse>('/v3/ecommerce/refunds/apply', request);
  }

  /**
   * 查询单笔退款（通过商户退款单号）
   *
   * @param subMchid - 特约商户号
   * @param outRefundNo - 商户退款单号
   * @returns 退款详情
   */
  async queryByOutRefundNo(
    subMchid: string,
    outRefundNo: string,
  ): Promise<WxPayResponse<QueryEcommerceRefundResponse>> {
    return this.client.get<QueryEcommerceRefundResponse>(
      `/v3/ecommerce/refunds/out-refund-no/${outRefundNo}`,
      { sub_mchid: subMchid },
    );
  }

  /**
   * 查询单笔退款（通过微信支付退款单号）
   *
   * @param subMchid - 特约商户号
   * @param refundId - 微信支付退款单号
   * @returns 退款详情
   */
  async queryByRefundId(
    subMchid: string,
    refundId: string,
  ): Promise<WxPayResponse<QueryEcommerceRefundResponse>> {
    return this.client.get<QueryEcommerceRefundResponse>(`/v3/ecommerce/refunds/id/${refundId}`, {
      sub_mchid: subMchid,
    });
  }

  /**
   * 垫付退款回补
   *
   * 当电商平台已垫付退款给用户，后续从二级商户处回补该笔退款资金。
   *
   * @param request - 垫付回补请求参数
   * @returns 垫付回补结果
   */
  async createReturnAdvance(
    request: CreateReturnAdvanceRequest,
  ): Promise<WxPayResponse<ReturnAdvanceResponse>> {
    return this.client.post<ReturnAdvanceResponse>(
      `/v3/ecommerce/refunds/${request.refund_id}/return-advance`,
      { sub_mchid: request.sub_mchid },
    );
  }

  /**
   * 查询垫付回补结果
   *
   * @param subMchid - 特约商户号
   * @param refundId - 微信退款单号
   * @returns 垫付回补结果
   */
  async queryReturnAdvance(
    subMchid: string,
    refundId: string,
  ): Promise<WxPayResponse<ReturnAdvanceResponse>> {
    return this.client.get<ReturnAdvanceResponse>(
      `/v3/ecommerce/refunds/${refundId}/return-advance`,
      { sub_mchid: subMchid },
    );
  }
}
