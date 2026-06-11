import type { WxPayResponse } from '../types/index.js';
import type { WxPayClient } from '../core/client.js';

/**
 * 商户专属优惠券服务
 *
 * 提供微信支付商户专属优惠券相关 API 封装，包括：
 * - 优惠券批次管理
 * - 优惠券发放
 * - 优惠券查询
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012084079
 */
export class MerchantExclusiveCouponService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 创建优惠券批次
   *
   * @param request - 批次创建请求参数
   * @returns 创建结果
   */
  async createCouponStock(
    request: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/marketing/busifavor/stocks', request);
  }

  /**
   * 查询优惠券批次详情
   *
   * @param stockId - 批次ID
   * @returns 批次详情
   */
  async queryCouponStock(stockId: string): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/marketing/busifavor/stocks/${stockId}`);
  }

  /**
   * 发放优惠券
   *
   * @param request - 发放请求参数
   * @returns 发放结果
   */
  async sendCoupon(request: {
    stock_id: string;
    out_request_no: string;
    openid: string;
  }): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/marketing/busifavor/coupons', request);
  }

  /**
   * 查询用户优惠券
   *
   * @param openid - 用户标识
   * @param params - 查询参数
   * @returns 用户优惠券列表
   */
  async queryUserCoupons(
    openid: string,
    params?: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/marketing/busifavor/users/${openid}/coupons`, params);
  }

  /**
   * 查询优惠券详情
   *
   * @param couponId - 优惠券ID
   * @param params - 查询参数
   * @returns 优惠券详情
   */
  async queryCoupon(
    couponId: string,
    params?: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/marketing/busifavor/users/coupons/${couponId}`, params);
  }
}
