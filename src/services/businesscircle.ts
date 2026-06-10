import type { WxPayResponse } from '../types/index.js';
import type {
  SyncBusinessCirclePointsRequest,
  QueryBusinessCircleAuthorizationResponse,
  QueryBusinessCirclePendingPointsParams,
  QueryBusinessCirclePendingPointsResponse,
  SyncBusinessCircleParkingStatusRequest,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 智慧商圈服务
 *
 * 提供微信支付智慧商圈相关 API 封装，包括：
 * - 商圈会员积分同步
 * - 商圈会员积分服务授权查询
 * - 商圈会员待积分状态查询
 * - 商圈会员停车状态同步
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534698
 */
export class BusinessCircleService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 商圈会员积分同步
   *
   * 商户完成积分发放或扣除后，通过此接口通知微信支付积分变更情况。
   * 成功返回 204 No Content。
   *
   * @param request - 积分同步请求参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534698
   */
  async syncPoints(request: SyncBusinessCirclePointsRequest): Promise<WxPayResponse> {
    return this.client.post('/v3/businesscircle/points/notify', request);
  }

  /**
   * 商圈会员积分服务授权查询
   *
   * 查询用户是否已授权商圈进行支付即积分。
   *
   * @param openid - 顾客授权时使用的小程序上的OpenID
   * @param appid - 顾客授权积分时使用的小程序的AppID
   * @returns 授权状态信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534848
   */
  async queryAuthorization(
    openid: string,
    appid: string,
  ): Promise<WxPayResponse<QueryBusinessCircleAuthorizationResponse>> {
    return this.client.get<QueryBusinessCircleAuthorizationResponse>(
      `/v3/businesscircle/user-authorizations/${openid}`,
      { appid },
    );
  }

  /**
   * 商圈会员待积分状态查询
   *
   * 查询用户的交易是否有待积分。
   *
   * @param params - 查询参数
   * @returns 待积分状态
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534994
   */
  async queryPendingPoints(
    params: QueryBusinessCirclePendingPointsParams,
  ): Promise<WxPayResponse<QueryBusinessCirclePendingPointsResponse>> {
    return this.client.get<QueryBusinessCirclePendingPointsResponse>(
      '/v3/businesscircle/users/pending-points',
      {
        openid: params.openid,
        appid: params.appid,
        transaction_id: params.transaction_id,
      },
    );
  }

  /**
   * 商圈会员停车状态同步
   *
   * 用户停车入场时，商户通过此接口通知微信支付。
   *
   * @param request - 停车状态同步请求参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535502
   */
  async syncParkingStatus(request: SyncBusinessCircleParkingStatusRequest): Promise<WxPayResponse> {
    return this.client.post('/v3/businesscircle/parkings', request);
  }
}
