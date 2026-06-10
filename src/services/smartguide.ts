import type { WxPayResponse } from '../types/index.js';
import type {
  QuerySmartGuidesParams,
  QuerySmartGuidesResponse,
  RegisterSmartGuideRequest,
  RegisterSmartGuideResponse,
  UpdateSmartGuideRequest,
  AssignSmartGuideRequest,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 支付即服务（服务人员）服务
 *
 * 提供支付即服务相关 API 封装，包括：
 * - 服务人员查询
 * - 服务人员注册
 * - 服务人员更新
 * - 服务人员分配
 *
 * 服务人员信息中的 name、mobile 等敏感字段需使用微信支付公钥或平台证书加密。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535123
 */
export class SmartGuideService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 服务人员查询
   *
   * 查询门店下的服务人员列表。支持按企业微信员工ID、手机号码、工号筛选。
   *
   * @param params - 查询参数
   * @returns 服务人员列表
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535123
   */
  async query(params: QuerySmartGuidesParams): Promise<WxPayResponse<QuerySmartGuidesResponse>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      store_id: params.store_id,
    };
    if (params.userid) {
      queryParams['userid'] = params.userid;
    }
    if (params.mobile) {
      queryParams['mobile'] = params.mobile;
    }
    if (params.work_id) {
      queryParams['work_id'] = params.work_id;
    }
    if (params.limit !== undefined) {
      queryParams['limit'] = params.limit;
    }
    if (params.offset !== undefined) {
      queryParams['offset'] = params.offset;
    }
    return this.client.get<QuerySmartGuidesResponse>('/v3/smartguide/guides', queryParams);
  }

  /**
   * 服务人员注册
   *
   * 注册门店的服务人员。name 和 mobile 字段需使用微信支付公钥加密。
   * 注册成功后返回 guide_id，用于后续更新和分配操作。
   *
   * @param request - 注册请求参数
   * @returns 注册成功后的服务人员ID
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535138
   */
  async register(
    request: RegisterSmartGuideRequest,
  ): Promise<WxPayResponse<RegisterSmartGuideResponse>> {
    return this.client.post<RegisterSmartGuideResponse>('/v3/smartguide/guides', request);
  }

  /**
   * 服务人员更新
   *
   * 更新已注册的服务人员信息。仅需传入需要更新的字段。
   * name 和 mobile 属于敏感字段，需使用微信支付公钥加密。
   *
   * @param guideId - 服务人员ID
   * @param request - 更新请求参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535160
   */
  async update(guideId: string, request: UpdateSmartGuideRequest): Promise<WxPayResponse> {
    return this.client.patch(`/v3/smartguide/guides/${guideId}`, request);
  }

  /**
   * 服务人员分配
   *
   * 将服务人员与订单关联。必须在支付完成之前调用，
   * 否则将无法在支付凭证上出现服务人员名片入口。
   *
   * @param guideId - 服务人员ID
   * @param request - 分配请求参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535161
   */
  async assign(guideId: string, request: AssignSmartGuideRequest): Promise<WxPayResponse> {
    return this.client.post(`/v3/smartguide/guides/${guideId}/assign`, request);
  }
}
