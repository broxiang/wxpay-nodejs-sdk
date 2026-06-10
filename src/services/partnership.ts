import type { WxPayResponse } from '../types/index.js';
import type {
  BuildPartnershipRequest,
  BuildPartnershipResponse,
  QueryPartnershipsParams,
  QueryPartnershipsResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 委托营销服务
 *
 * 提供商户间委托营销合作关系管理的 API 封装，包括：
 * - 建立合作关系
 * - 查询合作关系列表
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012380498
 */
export class PartnershipService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 建立合作关系
   *
   * 商户可通过此接口与合作方建立委托营销合作关系。
   * 支持与 AppID 或商户号建立合作关系，授权代金券批次或商家券批次。
   *
   * @param request - 建立合作关系请求参数
   * @param idempotencyKey - 幂等键，需保持唯一性
   * @returns 合作关系详情
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012380498
   */
  async build(
    request: BuildPartnershipRequest,
    idempotencyKey: string,
  ): Promise<WxPayResponse<BuildPartnershipResponse>> {
    return this.client.post<BuildPartnershipResponse>(
      '/v3/marketing/partnerships/build',
      request,
      undefined,
      { 'Idempotency-Key': idempotencyKey },
    );
  }

  /**
   * 查询合作关系列表
   *
   * 查询已建立的委托营销合作关系列表，支持分页。
   *
   * @param params - 查询参数
   * @returns 合作关系列表
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012380536
   */
  async list(
    params: QueryPartnershipsParams,
  ): Promise<WxPayResponse<QueryPartnershipsResponse>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'authorized_data.business_type': params.authorized_data.business_type,
    };
    if (params.authorized_data.stock_id) {
      queryParams['authorized_data.stock_id'] = params.authorized_data.stock_id;
    }
    if (params.partner) {
      queryParams['partner.type'] = params.partner.type;
      if (params.partner.appid) {
        queryParams['partner.appid'] = params.partner.appid;
      }
      if (params.partner.merchant_id) {
        queryParams['partner.merchant_id'] = params.partner.merchant_id;
      }
    }
    if (params.limit !== undefined) {
      queryParams['limit'] = params.limit;
    }
    if (params.offset !== undefined) {
      queryParams['offset'] = params.offset;
    }
    return this.client.get<QueryPartnershipsResponse>(
      '/v3/marketing/partnerships',
      queryParams,
    );
  }
}
