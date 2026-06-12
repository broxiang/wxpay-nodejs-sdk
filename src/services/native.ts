import type { WxPayResponse } from '../types/index.js';
import type { CreateNativeOrderRequest, CreateNativeOrderResponse } from '../types/index.js';
import { BasePaymentService } from './base-payment.js';

/**
 * Native 支付服务
 *
 * 提供 Native 支付（二维码支付）全流程相关的 API 封装，包括：
 * - Native 下单（获取 code_url 用于生成二维码）
 * - 查询订单
 * - 关闭订单
 * - 申请退款
 * - 查询退款
 * - 申请异常退款
 * - 申请交易账单
 * - 申请资金账单
 * - 下载账单
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791877
 */
export class NativeService extends BasePaymentService {
  /**
   * Native 支付下单
   *
   * 商户通过此接口生成订单并获取二维码链接（code_url）。
   * code_url 有效期为 2 小时，超过 2 小时需使用原下单参数重新请求。
   *
   * 商户后端获取 code_url 后传递给前端，前端将其转换为二维码图片展示给用户。
   * 用户使用微信扫一扫扫描二维码后，将调起微信收银台完成支付。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791877
   */
  async createOrder(
    request: CreateNativeOrderRequest,
  ): Promise<WxPayResponse<CreateNativeOrderResponse>> {
    return this.client.post<CreateNativeOrderResponse>('/v3/pay/transactions/native', request);
  }
}
