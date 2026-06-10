import type { WxPayResponse } from '../types/index.js';
import type {
  CreatePayGiftActivityRequest,
  CreatePayGiftActivityResponse,
  QueryPayGiftActivitiesParams,
  QueryPayGiftActivitiesResponse,
  QueryPayGiftActivityResponse,
  GetPayGiftActivityMerchantsResponse,
  GetPayGiftActivityGoodsResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 支付有礼服务
 *
 * 提供微信支付支付有礼活动管理的 API 封装，包括：
 * - 创建全场满额送活动
 * - 获取活动详情
 * - 获取活动列表
 * - 终止活动
 * - 活动发券商户号管理
 * - 活动商品列表查询
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012487898
 */
export class PayGiftActivityService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 创建全场满额送活动
   *
   * 创建支付有礼全场满额送活动，用户支付满额后自动发放商家券。
   *
   * @param request - 创建活动请求参数
   * @returns 活动ID和创建时间
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012487898
   */
  async create(
    request: CreatePayGiftActivityRequest,
  ): Promise<WxPayResponse<CreatePayGiftActivityResponse>> {
    return this.client.post<CreatePayGiftActivityResponse>(
      '/v3/marketing/paygiftactivity/unique-threshold-activity',
      request,
    );
  }

  /**
   * 获取活动详情
   *
   * 通过活动ID查询支付有礼活动的详细信息。
   *
   * @param activityId - 活动ID
   * @returns 活动详情
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012487971
   */
  async get(activityId: string): Promise<WxPayResponse<QueryPayGiftActivityResponse>> {
    return this.client.get<QueryPayGiftActivityResponse>(
      `/v3/marketing/paygiftactivity/activities/${activityId}`,
    );
  }

  /**
   * 获取支付有礼活动列表
   *
   * 查询商户的支付有礼活动列表，支持按状态筛选和分页。
   *
   * @param params - 查询参数
   * @returns 活动列表
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012489126
   */
  async list(
    params?: QueryPayGiftActivitiesParams,
  ): Promise<WxPayResponse<QueryPayGiftActivitiesResponse>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (params?.activity_state) {
      queryParams['activity_state'] = params.activity_state;
    }
    if (params?.limit !== undefined) {
      queryParams['limit'] = params.limit;
    }
    if (params?.offset !== undefined) {
      queryParams['offset'] = params.offset;
    }
    return this.client.get<QueryPayGiftActivitiesResponse>(
      '/v3/marketing/paygiftactivity/activities',
      queryParams,
    );
  }

  /**
   * 终止活动
   *
   * 终止进行中的支付有礼活动。
   *
   * @param activityId - 活动ID
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012466523
   */
  async terminate(activityId: string): Promise<WxPayResponse> {
    return this.client.post(`/v3/marketing/paygiftactivity/activities/${activityId}/terminate`);
  }

  /**
   * 获取活动发券商户号
   *
   * 查询活动的发券商户号列表。
   *
   * @param activityId - 活动ID
   * @returns 发券商户号列表
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012466149
   */
  async getMerchants(
    activityId: string,
  ): Promise<WxPayResponse<GetPayGiftActivityMerchantsResponse>> {
    return this.client.get<GetPayGiftActivityMerchantsResponse>(
      `/v3/marketing/paygiftactivity/activities/${activityId}/merchant`,
    );
  }

  /**
   * 新增活动发券商户号
   *
   * 向活动中添加新的发券商户号。
   *
   * @param activityId - 活动ID
   * @param merchantIdList - 商户号列表
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012466671
   */
  async addMerchant(activityId: string, merchantIdList: string[]): Promise<WxPayResponse> {
    return this.client.post(`/v3/marketing/paygiftactivity/activities/${activityId}/merchant`, {
      merchant_id_list: merchantIdList,
    });
  }

  /**
   * 删除活动发券商户号
   *
   * 从活动中删除指定的发券商户号。
   *
   * @param activityId - 活动ID
   * @param merchantId - 商户号
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012466787
   */
  async deleteMerchant(activityId: string, merchantId: string): Promise<WxPayResponse> {
    return this.client.delete(
      `/v3/marketing/paygiftactivity/activities/${activityId}/merchant/${merchantId}`,
    );
  }

  /**
   * 获取活动指定商品列表
   *
   * 查询活动中指定的商品列表。
   *
   * @param activityId - 活动ID
   * @returns 商品列表
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012466448
   */
  async getGoods(activityId: string): Promise<WxPayResponse<GetPayGiftActivityGoodsResponse>> {
    return this.client.get<GetPayGiftActivityGoodsResponse>(
      `/v3/marketing/paygiftactivity/activities/${activityId}/goods`,
    );
  }
}
