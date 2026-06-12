import type { WxPayResponse } from '../types/index.js';
import type {
  CreatePartnerH5OrderRequest,
  CreatePartnerH5OrderResponse,
  PartnerQueryOrderParams,
  PartnerQueryOrderResponse,
  PartnerCloseOrderRequest,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 服务商 H5 支付服务
 *
 * 服务商模式下，服务商代替特约商户发起 H5 支付请求。
 *
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012738604 (H5下单)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012738969 (微信支付订单号查询)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012759661 (商户订单号查询)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012759669 (关闭订单)
 */
export class PartnerH5Service {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 服务商 H5 下单
   *
   * @param request - 下单请求参数，需包含 scene_info.h5_info
   * @returns 下单结果，包含 h5_url
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012738604
   */
  async createOrder(
    request: CreatePartnerH5OrderRequest,
  ): Promise<WxPayResponse<CreatePartnerH5OrderResponse>> {
    return this.client.post<CreatePartnerH5OrderResponse>(
      '/v3/pay/partner/transactions/h5',
      request,
    );
  }

  /**
   * 通过商户订单号查询订单
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012759661
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
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012738969
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
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012759669
   */
  async closeOrder(outTradeNo: string, request: PartnerCloseOrderRequest): Promise<WxPayResponse> {
    return this.client.post(
      `/v3/pay/partner/transactions/out-trade-no/${outTradeNo}/close`,
      request,
    );
  }
}
