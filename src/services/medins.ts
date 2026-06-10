import type { WxPayResponse } from '../types/index.js';
import type {
  CreateMedInsOrderRequest,
  MedInsOrderResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 医保支付服务
 *
 * 提供医保自费混合支付全流程相关的 API 封装，包括：
 * - 医保自费混合收款下单
 * - 使用混合订单号查看下单结果
 * - 使用商户订单号查看下单结果
 *
 * 注意：payer 和 relative 中的 name、id_digest 字段需使用微信支付公钥加密。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781466
 */
export class MedInsService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 医保自费混合收款下单
   *
   * 创建医保自费混合支付订单。支持纯自费、纯医保、医保+自费混合支付。
   * 支持代亲属支付，需传入 relative 字段。
   *
   * @param request - 下单请求参数
   * @returns 混合订单信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781466
   */
  async createOrder(
    request: CreateMedInsOrderRequest,
  ): Promise<WxPayResponse<MedInsOrderResponse>> {
    return this.client.post<MedInsOrderResponse>(
      '/v3/med-ins/orders',
      request,
    );
  }

  /**
   * 使用医保自费混合订单号查看下单结果
   *
   * 通过混合订单号查询订单状态和详情。
   *
   * @param mixTradeNo - 医保自费混合订单号
   * @returns 订单信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781479
   */
  async queryByMixTradeNo(
    mixTradeNo: string,
  ): Promise<WxPayResponse<MedInsOrderResponse>> {
    return this.client.get<MedInsOrderResponse>(
      `/v3/med-ins/orders/${mixTradeNo}`,
    );
  }

  /**
   * 使用商户订单号查看下单结果
   *
   * 通过商户订单号查询订单状态和详情。
   *
   * @param outTradeNo - 商户订单号
   * @returns 订单信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781490
   */
  async queryByOutTradeNo(
    outTradeNo: string,
  ): Promise<WxPayResponse<MedInsOrderResponse>> {
    return this.client.get<MedInsOrderResponse>(
      `/v3/med-ins/orders/out-trade-no/${outTradeNo}`,
    );
  }
}
