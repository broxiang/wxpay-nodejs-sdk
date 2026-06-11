import type { WxPayResponse } from '../types/index.js';
import type { WxPayClient } from '../core/client.js';

/**
 * 商家零钱服务
 *
 * 提供微信支付商家零钱（金盘计划）相关 API 封装，包括：
 * - 查询商户零钱余额
 * - 查询商户零钱流水
 * - 商家零钱状态管理
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012064295
 */
export class GoldPlanService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 查询商户零钱余额
   *
   * @param mchid - 商户号
   * @returns 零钱余额信息
   */
  async queryBalance(mchid: string): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/merchant/fund/balance/${mchid}`);
  }

  /**
   * 查询商户零钱流水
   *
   * @param mchid - 商户号
   * @param params - 查询参数
   * @returns 零钱流水列表
   */
  async queryFlow(
    mchid: string,
    params?: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/merchant/fund/flow`, { mchid, ...params });
  }

  /**
   * 查询商家零钱状态
   *
   * @param mchid - 商户号
   * @returns 零钱状态信息
   */
  async queryStatus(mchid: string): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/merchant/fund/status/${mchid}`);
  }
}
