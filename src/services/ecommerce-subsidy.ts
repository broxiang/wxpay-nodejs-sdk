import type { WxPayResponse } from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/** 电商收付通请求补差请求 */
export interface CreateEcommerceSubsidyRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 补差金额（分） */
  amount: number;
  /** 补差描述 */
  description: string;
  /** 商户补差单号 */
  out_subsidy_no?: string;
}

/** 电商收付通请求补差响应 */
export interface CreateEcommerceSubsidyResponse {
  sub_mchid: string;
  transaction_id: string;
  /** 微信补差单号 */
  subsidy_id: string;
  amount: number;
  description: string;
  /** 补差结果 */
  result: string;
  success_time?: string;
}

/** 电商收付通补差回退请求 */
export interface EcommerceSubsidyReturnRequest {
  sub_mchid: string;
  transaction_id: string;
  refund_id?: string;
  amount: number;
  description: string;
  /** 商户补差回退单号 */
  out_order_no: string;
}

/** 电商收付通补差回退响应 */
export interface EcommerceSubsidyReturnResponse {
  sub_mchid: string;
  transaction_id: string;
  /** 微信补差回退单号 */
  subsidy_refund_id: string;
  amount: number;
  description: string;
  result: string;
  success_time?: string;
}

/** 电商收付通取消补差请求 */
export interface CancelEcommerceSubsidyRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 取消补差描述 */
  description: string;
}

/** 电商收付通取消补差响应 */
export interface CancelEcommerceSubsidyResponse {
  sub_mchid: string;
  transaction_id: string;
  /** 取消补差结果 */
  result: string;
  description: string;
}

/**
 * 电商收付通补差服务
 *
 * 用于电商平台对二级商户的订单进行补差。
 *
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012690683 (补差)
 */
export class EcommerceSubsidyService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 请求补差
   *
   * @param request - 补差请求参数
   * @returns 补差结果
   */
  async create(
    request: CreateEcommerceSubsidyRequest,
  ): Promise<WxPayResponse<CreateEcommerceSubsidyResponse>> {
    return this.client.post<CreateEcommerceSubsidyResponse>(
      '/v3/ecommerce/subsidies/create',
      request,
    );
  }

  /**
   * 请求补差回退
   *
   * @param request - 补差回退请求参数
   * @returns 回退结果
   */
  async returnSubsidy(
    request: EcommerceSubsidyReturnRequest,
  ): Promise<WxPayResponse<EcommerceSubsidyReturnResponse>> {
    return this.client.post<EcommerceSubsidyReturnResponse>(
      '/v3/ecommerce/subsidies/return',
      request,
    );
  }

  /**
   * 取消补差
   *
   * @param request - 取消补差请求参数
   * @returns 取消补差结果
   */
  async cancelSubsidy(
    request: CancelEcommerceSubsidyRequest,
  ): Promise<WxPayResponse<CancelEcommerceSubsidyResponse>> {
    return this.client.post<CancelEcommerceSubsidyResponse>(
      '/v3/ecommerce/subsidies/cancel',
      request,
    );
  }
}
