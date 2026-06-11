import type { WxPayResponse } from '../types/index.js';
import type { WxPayClient } from '../core/client.js';

/**
 * 刷码乘车服务
 *
 * 提供公共出行平台代扣服务 API 封装，包括：
 * - 开通用户服务
 * - 查询用户服务状态
 * - 扣费受理
 * - 查询扣费订单
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012647399
 */
export class ScanAndRideService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 开通用户服务
   *
   * 用户授权开通刷码乘车服务。
   *
   * @param request - 开通服务请求参数
   * @returns 开通结果
   */
  async createUserService(request: {
    appid: string;
    sub_mchid: string;
    out_request_no: string;
    openid: string;
    service_id: string;
  }): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/qrcode/user-services', request);
  }

  /**
   * 查询用户服务状态
   *
   * 查询用户是否已开通刷码乘车服务。
   *
   * @param outRequestNo - 商户请求号
   * @param params - 查询参数
   * @returns 用户服务状态
   */
  async queryUserService(
    outRequestNo: string,
    params: { sub_mchid: string; service_id: string },
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/qrcode/user-services/out-request-no/${outRequestNo}`, params);
  }

  /**
   * 扣费受理
   *
   * 发起刷码乘车扣费请求。
   *
   * @param request - 扣费请求参数
   * @returns 扣费受理结果
   */
  async createTransaction(request: {
    appid: string;
    sub_mchid: string;
    out_trade_no: string;
    description: string;
    notify_url: string;
    amount: { total: number; currency?: string };
    openid: string;
    service_id: string;
  }): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/qrcode/transactions', request);
  }

  /**
   * 查询扣费订单
   *
   * 根据商户订单号查询扣费订单状态。
   *
   * @param outTradeNo - 商户订单号
   * @param params - 查询参数
   * @returns 订单信息
   */
  async queryTransaction(
    outTradeNo: string,
    params: { sub_mchid: string },
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/qrcode/transactions/out-trade-no/${outTradeNo}`, params);
  }
}
