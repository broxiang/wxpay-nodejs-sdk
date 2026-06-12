import type { WxPayResponse } from '../types/index.js';
import type { CreateH5OrderRequest, CreateH5OrderResponse } from '../types/index.js';
import { BasePaymentService } from './base-payment.js';

/**
 * H5 支付服务
 *
 * 提供 H5 支付全流程相关的 API 封装，包括：
 * - H5 下单
 * - 查询订单
 * - 关闭订单
 * - 申请退款
 * - 查询退款
 * - 申请异常退款
 * - 申请交易账单
 * - 申请资金账单
 * - 下载账单
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791834
 */
export class H5Service extends BasePaymentService {
  /**
   * H5 支付下单
   *
   * 商户通过此接口生成 H5 支付链接（h5_url），用于在已配置 H5 支付域名的网页中
   * 跳转并调起微信支付收银台。h5_url 有效期为 5 分钟，过期后需重新请求。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791834
   */
  async createOrder(request: CreateH5OrderRequest): Promise<WxPayResponse<CreateH5OrderResponse>> {
    return this.client.post<CreateH5OrderResponse>('/v3/pay/transactions/h5', request);
  }
}
