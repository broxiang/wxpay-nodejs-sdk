import type { WxPayResponse } from '../types/index.js';
import type { WxPayClient } from '../core/client.js';

/**
 * 零售门店服务
 *
 * 提供微信支付零售门店相关 API 封装，包括：
 * - 门店活动管理
 * - 门店资质管理
 * - 零售门店活动操作
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012064295
 */
export class RetailStoreService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 创建门店活动
   *
   * @param request - 活动创建请求参数
   * @returns 创建结果
   */
  async createActivity(
    request: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/marketing/goldplan/retailstore/activities', request);
  }

  /**
   * 查询门店活动详情
   *
   * @param activityId - 活动ID
   * @returns 活动详情
   */
  async queryActivity(activityId: string): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/marketing/goldplan/retailstore/activities/${activityId}`);
  }

  /**
   * 更新门店活动
   *
   * @param activityId - 活动ID
   * @param request - 更新请求参数
   * @returns 更新结果
   */
  async updateActivity(
    activityId: string,
    request: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.patch(
      `/v3/marketing/goldplan/retailstore/activities/${activityId}`,
      request,
    );
  }

  /**
   * 创建门店资质
   *
   * @param request - 资质创建请求参数
   * @returns 创建结果
   */
  async createQualification(
    request: Record<string, unknown>,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/marketing/goldplan/retailstore/qualifications', request);
  }

  /**
   * 查询门店资质
   *
   * @param qualificationId - 资质ID
   * @returns 资质详情
   */
  async queryQualification(
    qualificationId: string,
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(`/v3/marketing/goldplan/retailstore/qualifications/${qualificationId}`);
  }
}
