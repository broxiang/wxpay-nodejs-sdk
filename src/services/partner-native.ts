import type { WxPayResponse } from '../types/index.js';
import type {
  CreatePartnerNativeOrderRequest,
  CreatePartnerNativeOrderResponse,
  PartnerQueryOrderParams,
  PartnerQueryOrderResponse,
  PartnerCloseOrderRequest,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 服务商 Native 支付服务
 *
 * 服务商模式下，服务商代替特约商户发起 Native 支付请求。
 *
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012738659 (Native下单)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012738971 (微信支付订单号查询)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012759714 (商户订单号查询)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012759725 (关闭订单)
 */
export class PartnerNativeService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 服务商 Native 下单
   *
   * @param request - 下单请求参数
   * @returns 下单结果，包含 code_url
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012738659
   */
  async createOrder(
    request: CreatePartnerNativeOrderRequest,
  ): Promise<WxPayResponse<CreatePartnerNativeOrderResponse>> {
    return this.client.post<CreatePartnerNativeOrderResponse>(
      '/v3/pay/partner/transactions/native',
      request,
    );
  }

  /**
   * 通过商户订单号查询订单
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012759714
   */
  async queryOrderByOutTradeNo(
    params: PartnerQueryOrderParams,
  ): Promise<WxPayResponse<PartnerQueryOrderResponse>> {
    return this.client.get<PartnerQueryOrderResponse>(
      `/v3/pay/partner/transactions/out-trade-no/${params.out_trade_no}`,
      { sp_mchid: params.sp_mchid, sub_mchid: params.sub_mchid },
    );
  }

  /**
   * 通过微信支付订单号查询订单
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012738971
   */
  async queryOrderByTransactionId(
    params: PartnerQueryOrderParams,
  ): Promise<WxPayResponse<PartnerQueryOrderResponse>> {
    return this.client.get<PartnerQueryOrderResponse>(
      `/v3/pay/partner/transactions/id/${params.transaction_id}`,
      { sp_mchid: params.sp_mchid, sub_mchid: params.sub_mchid },
    );
  }

  /**
   * 关闭订单
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012759725
   */
  async closeOrder(outTradeNo: string, request: PartnerCloseOrderRequest): Promise<WxPayResponse> {
    return this.client.post(
      `/v3/pay/partner/transactions/out-trade-no/${outTradeNo}/close`,
      request,
    );
  }
}
