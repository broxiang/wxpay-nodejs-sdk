import type { WxPayResponse } from '../types/index.js';
import type {
  CreatePartnerAppOrderRequest,
  CreatePartnerAppOrderResponse,
  PartnerQueryOrderParams,
  PartnerQueryOrderResponse,
  PartnerCloseOrderRequest,
  AppBridgeConfig,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';
import { buildAppBridgeConfig } from './bridge.js';

/**
 * 服务商 APP 支付服务
 *
 * 服务商模式下，服务商代替特约商户发起 APP 支付请求。
 *
 * @see https://pay.weixin.qq.com/doc/v3/partner/4013080231 (APP下单)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4013080234 (微信支付订单号查询)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4013080235 (商户订单号查询)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4013080236 (关闭订单)
 */
export class PartnerAppService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 服务商 APP 下单
   *
   * @param request - 下单请求参数
   * @returns 下单结果，包含 prepay_id
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4013080231
   */
  async createOrder(
    request: CreatePartnerAppOrderRequest,
  ): Promise<WxPayResponse<CreatePartnerAppOrderResponse>> {
    return this.client.post<CreatePartnerAppOrderResponse>(
      '/v3/pay/partner/transactions/app',
      request,
    );
  }

  /**
   * 通过商户订单号查询订单
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4013080235
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
   * @see https://pay.weixin.qq.com/doc/v3/partner/4013080234
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
   * @see https://pay.weixin.qq.com/doc/v3/partner/4013080236
   */
  async closeOrder(outTradeNo: string, request: PartnerCloseOrderRequest): Promise<WxPayResponse> {
    return this.client.post(
      `/v3/pay/partner/transactions/out-trade-no/${outTradeNo}/close`,
      request,
    );
  }

  /**
   * 服务商 APP 下单并生成调起支付参数
   *
   * @param request - 下单请求参数
   * @param privateKey - 商户私钥
   * @returns 下单响应 + 调起支付参数
   */
  async prepayWithRequestPayment(
    request: CreatePartnerAppOrderRequest,
    privateKey: string | Buffer,
  ): Promise<WxPayResponse<CreatePartnerAppOrderResponse> & { bridgeConfig: AppBridgeConfig }> {
    const response = await this.createOrder(request);
    const bridgeConfig = buildAppBridgeConfig(
      request.sp_appid,
      this.client.mchid,
      response.data.prepay_id,
      privateKey,
    );
    return { ...response, bridgeConfig };
  }
}
