import type { WxPayResponse } from '../types/index.js';
import type {
  CreateAppOrderRequest,
  CreateAppOrderResponse,
  AppBridgeConfig,
} from '../types/index.js';
import { buildAppBridgeConfig } from './bridge.js';
import { BasePaymentService } from './base-payment.js';

/**
 * APP 支付服务
 *
 * 提供 APP 支付全流程相关的 API 封装，包括：
 * - APP 下单
 * - 查询订单
 * - 关闭订单
 * - 申请退款
 * - 查询退款
 * - 申请异常退款
 * - 申请交易账单
 * - 申请资金账单
 * - 下载账单
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070347
 */
export class AppService extends BasePaymentService {
  /**
   * APP 支付下单
   *
   * 商户通过此接口生成预付单并获取 prepay_id。
   * prepay_id 有效期为 2 小时，超过 2 小时需使用原下单参数重新请求。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070347
   */
  async createOrder(
    request: CreateAppOrderRequest,
  ): Promise<WxPayResponse<CreateAppOrderResponse>> {
    return this.client.post<CreateAppOrderResponse>('/v3/pay/transactions/app', request);
  }

  /**
   * APP 下单并生成调起支付参数
   *
   * 封装了下单和调起支付参数生成两个步骤，一次调用即可获得
   * prepay_id 和 APP 端调起支付所需的全部参数。
   *
   * @param request - 下单请求参数（需包含 appid）
   * @param privateKey - 商户私钥
   * @returns 下单响应 + 调起支付参数
   */
  async prepayWithRequestPayment(
    request: CreateAppOrderRequest,
    privateKey: string | Buffer,
  ): Promise<WxPayResponse<CreateAppOrderResponse> & { bridgeConfig: AppBridgeConfig }> {
    const response = await this.createOrder(request);
    const bridgeConfig = buildAppBridgeConfig(
      request.appid,
      this.client.mchid,
      response.data.prepay_id,
      privateKey,
    );
    return { ...response, bridgeConfig };
  }
}
