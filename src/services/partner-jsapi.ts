import type { WxPayResponse } from '../types/index.js';
import type {
  CreatePartnerJsapiOrderRequest,
  CreatePartnerJsapiOrderResponse,
  PartnerQueryOrderParams,
  PartnerQueryOrderResponse,
  PartnerCloseOrderRequest,
  JsapiBridgeConfig,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';
import { buildJsapiBridgeConfig } from './bridge.js';

/**
 * 服务商 JSAPI 支付服务
 *
 * 服务商模式下，服务商代替特约商户发起 JSAPI 支付请求。
 * 与直连商户模式的区别在于请求中包含 sp_appid、sp_mchid、sub_mchid 等字段。
 *
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012738519 (JSAPI/小程序下单)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012738964 (微信支付订单号查询)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012739008 (商户订单号查询)
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012739019 (关闭订单)
 */
export class PartnerJsapiService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 服务商 JSAPI/小程序下单
   *
   * 服务商通过此接口代特约商户发起 JSAPI 支付下单，获取 prepay_id。
   *
   * @param request - 下单请求参数，需包含 sp_appid、sp_mchid、sub_mchid 等
   * @returns 下单结果，包含 prepay_id
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012738519
   */
  async createOrder(
    request: CreatePartnerJsapiOrderRequest,
  ): Promise<WxPayResponse<CreatePartnerJsapiOrderResponse>> {
    return this.client.post<CreatePartnerJsapiOrderResponse>(
      '/v3/pay/partner/transactions/jsapi',
      request,
    );
  }

  /**
   * 通过商户订单号查询订单
   *
   * @param params - 查询参数，需包含 out_trade_no、sp_mchid、sub_mchid
   * @returns 订单详情
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012739008
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
   * @param params - 查询参数，需包含 transaction_id、sp_mchid、sub_mchid
   * @returns 订单详情
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012738964
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
   * 对于未支付的订单，服务商可通过此接口代特约商户关闭订单。
   *
   * @param outTradeNo - 商户订单号
   * @param request - 关单请求参数，需包含 sp_mchid、sub_mchid
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012739019
   */
  async closeOrder(outTradeNo: string, request: PartnerCloseOrderRequest): Promise<WxPayResponse> {
    return this.client.post(
      `/v3/pay/partner/transactions/out-trade-no/${outTradeNo}/close`,
      request,
    );
  }

  /**
   * 服务商 JSAPI 下单并生成调起支付参数
   *
   * 封装了下单和调起支付参数生成两个步骤，一次调用即可获得
   * prepay_id 和前端 WeixinJSBridge.invoke() 所需的全部参数。
   *
   * @param request - 下单请求参数
   * @param privateKey - 商户私钥，用于生成调起支付签名
   * @returns 下单响应 + 调起支付参数
   */
  async prepayWithRequestPayment(
    request: CreatePartnerJsapiOrderRequest,
    privateKey: string | Buffer,
  ): Promise<WxPayResponse<CreatePartnerJsapiOrderResponse> & { bridgeConfig: JsapiBridgeConfig }> {
    const response = await this.createOrder(request);
    const bridgeConfig = buildJsapiBridgeConfig(
      request.sp_appid,
      response.data.prepay_id,
      privateKey,
    );
    return { ...response, bridgeConfig };
  }
}
