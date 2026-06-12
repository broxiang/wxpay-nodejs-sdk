import type { WxPayResponse } from '../types/index.js';
import type {
  CreateJsapiOrderRequest,
  CreateJsapiOrderResponse,
  JsapiBridgeConfig,
} from '../types/index.js';
import { buildJsapiBridgeConfig } from './bridge.js';
import { BasePaymentService } from './base-payment.js';

/**
 * JSAPI 支付 / 小程序支付 服务
 *
 * 提供 JSAPI 支付全流程相关的 API 封装，包括：
 * - JSAPI/小程序下单
 * - 查询订单
 * - 关闭订单
 * - 申请退款
 * - 查询退款
 * - 申请异常退款
 * - 申请交易账单
 * - 申请资金账单
 * - 下载账单
 */
export class JsapiService extends BasePaymentService {
  /**
   * JSAPI/小程序下单
   *
   * 商户通过此接口生成预付单并获取 prepay_id。
   * prepay_id 有效期为 2 小时，超过 2 小时需重新请求。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791856
   */
  async createOrder(
    request: CreateJsapiOrderRequest,
  ): Promise<WxPayResponse<CreateJsapiOrderResponse>> {
    return this.client.post<CreateJsapiOrderResponse>('/v3/pay/transactions/jsapi', request);
  }

  /**
   * JSAPI 下单并生成调起支付参数
   *
   * 封装了下单和调起支付参数生成两个步骤，一次调用即可获得
   * prepay_id 和前端 WeixinJSBridge.invoke() 所需的全部参数。
   *
   * @param request - 下单请求参数（需包含 appid）
   * @param privateKey - 商户私钥
   * @returns 下单响应 + 调起支付参数
   */
  async prepayWithRequestPayment(
    request: CreateJsapiOrderRequest,
    privateKey: string | Buffer,
  ): Promise<WxPayResponse<CreateJsapiOrderResponse> & { bridgeConfig: JsapiBridgeConfig }> {
    const response = await this.createOrder(request);
    const bridgeConfig = buildJsapiBridgeConfig(request.appid, response.data.prepay_id, privateKey);
    return { ...response, bridgeConfig };
  }
}
