import type { WxPayResponse } from '../types/index.js';
import type { WxPayClient } from '../core/client.js';

/**
 * 爱心餐服务
 *
 * 提供微信支付爱心餐相关 API 封装，包括：
 * - 品牌管理
 * - 订单管理
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012064295
 */
export class LoveFeastService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 创建爱心餐品牌
   *
   * @param request - 品牌创建请求参数
   * @returns 创建结果
   */
  async createBrand(
    request: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/lovefeast/brands', request);
  }

  /**
   * 查询爱心餐品牌
   *
   * @param brandId - 品牌ID
   * @returns 品牌详情
   */
  async queryBrand(brandId: string): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/lovefeast/brands/${brandId}`);
  }

  /**
   * 创建爱心餐订单
   *
   * @param request - 订单创建请求参数
   * @returns 订单创建结果
   */
  async createOrder(
    request: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/lovefeast/orders', request);
  }

  /**
   * 查询爱心餐订单
   *
   * @param outTradeNo - 商户订单号
   * @param params - 查询参数
   * @returns 订单详情
   */
  async queryOrder(
    outTradeNo: string,
    params?: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/lovefeast/orders/out-trade-no/${outTradeNo}`, params);
  }
}
