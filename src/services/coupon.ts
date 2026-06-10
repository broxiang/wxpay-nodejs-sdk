import type { WxPayResponse } from '../types/index.js';
import type {
  CreateCouponStockRequest,
  CreateCouponStockResponse,
  ActivateCouponStockRequest,
  ActivateCouponStockResponse,
  SendCouponRequest,
  SendCouponResponse,
  PauseCouponStockRequest,
  PauseCouponStockResponse,
  RestartCouponStockRequest,
  RestartCouponStockResponse,
  QueryCouponStocksParams,
  QueryCouponStocksResponse,
  CouponStockItem,
  QueryCouponDetailParams,
  QueryCouponDetailResponse,
  QueryCouponStockMerchantsParams,
  QueryCouponStockMerchantsResponse,
  QueryCouponStockItemsParams,
  QueryCouponStockItemsResponse,
  QueryUserCouponsParams,
  QueryUserCouponsResponse,
  DownloadCouponStockFlowResponse,
  SetCouponCallbackRequest,
  SetCouponCallbackResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 代金券服务
 *
 * 提供微信支付代金券全流程相关的 API 封装，包括：
 * - 批次管理：创建、激活、暂停、重启代金券批次
 * - 发放：发放指定批次的代金券给用户
 * - 查询：批次列表、批次详情、券详情、可用商户、可用单品、用户券列表
 * - 明细下载：核销明细、退款明细
 * - 通知设置：设置代金券消息通知地址
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012081606
 */
export class CouponService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  // ============= 批次管理 =============

  /**
   * 创建代金券批次
   *
   * 通过此接口可创建代金券批次，包括预充值和免充值两种类型。
   * 预充值代金券适用于第三方出资策划的活动，免充值适用于商户策划的活动。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534633
   */
  async createStock(
    request: CreateCouponStockRequest,
  ): Promise<WxPayResponse<CreateCouponStockResponse>> {
    return this.client.post<CreateCouponStockResponse>(
      '/v3/marketing/favor/coupon-stocks',
      request,
    );
  }

  /**
   * 激活代金券批次
   *
   * 制券成功后，通过调用激活接口激活代金券批次。
   * 如果是预充值代金券，激活时从商户账户余额中锁定本批次的营销资金。
   *
   * @param stockId - 微信为每个代金券批次分配的唯一ID
   * @param request - 请求参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460137
   */
  async activateStock(
    stockId: string,
    request: ActivateCouponStockRequest,
  ): Promise<WxPayResponse<ActivateCouponStockResponse>> {
    return this.client.post<ActivateCouponStockResponse>(
      `/v3/marketing/favor/stocks/${stockId}/start`,
      request,
    );
  }

  /**
   * 暂停代金券批次
   *
   * 通过此接口可暂停指定代金券批次。暂停后，该批次暂停发放，
   * 用户无法通过任何渠道再领取该批次的券。前提条件是批次处于激活状态。
   *
   * @param stockId - 微信为每个代金券批次分配的唯一ID
   * @param request - 请求参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460305
   */
  async pauseStock(
    stockId: string,
    request: PauseCouponStockRequest,
  ): Promise<WxPayResponse<PauseCouponStockResponse>> {
    return this.client.post<PauseCouponStockResponse>(
      `/v3/marketing/favor/stocks/${stockId}/pause`,
      request,
    );
  }

  /**
   * 重启代金券批次
   *
   * 通过此接口可重启指定代金券批次。重启后，该批次可以再次发放。
   * 前提条件是批次处于暂停状态。
   *
   * @param stockId - 微信为每个代金券批次分配的唯一ID
   * @param request - 请求参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460411
   */
  async restartStock(
    stockId: string,
    request: RestartCouponStockRequest,
  ): Promise<WxPayResponse<RestartCouponStockResponse>> {
    return this.client.post<RestartCouponStockResponse>(
      `/v3/marketing/favor/stocks/${stockId}/restart`,
      request,
    );
  }

  // ============= 发放 =============

  /**
   * 发放代金券
   *
   * 通过调用此接口可发放指定批次给指定用户，发券场景可以是小程序、H5、App等。
   * 批次状态必须为"运营中"。
   *
   * @param openid - 用户在appid下的唯一标识
   * @param request - 请求参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463767
   */
  async sendCoupon(
    openid: string,
    request: SendCouponRequest,
  ): Promise<WxPayResponse<SendCouponResponse>> {
    return this.client.post<SendCouponResponse>(
      `/v3/marketing/favor/users/${openid}/coupons`,
      request,
    );
  }

  // ============= 查询 =============

  /**
   * 条件查询批次列表
   *
   * 通过此接口可查询多个批次的信息，包括批次的配置信息以及批次概况数据。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460489
   */
  async queryStocks(
    params: QueryCouponStocksParams,
  ): Promise<WxPayResponse<QueryCouponStocksResponse>> {
    return this.client.get<QueryCouponStocksResponse>(
      '/v3/marketing/favor/stocks',
      params,
    );
  }

  /**
   * 查询批次详情
   *
   * 通过此接口可查询单个批次的信息，包括批次的配置信息以及批次概况数据。
   *
   * @param stockId - 微信为每个代金券批次分配的唯一ID
   * @param params - 查询参数，需包含 stock_creator_mchid
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460564
   */
  async queryStockDetail(
    stockId: string,
    params: { stock_creator_mchid: string },
  ): Promise<WxPayResponse<CouponStockItem>> {
    return this.client.get<CouponStockItem>(
      `/v3/marketing/favor/stocks/${stockId}`,
      params,
    );
  }

  /**
   * 查询代金券详情
   *
   * 通过此接口可查询代金券信息，包括代金券的基础信息、状态。
   * 如代金券已核销，会包括代金券核销的订单信息。
   *
   * @param openid - 用户在appid下的唯一标识
   * @param couponId - 微信为代金券唯一分配的ID
   * @param params - 查询参数，需包含 appid
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012486942
   */
  async queryCouponDetail(
    openid: string,
    couponId: string,
    params: QueryCouponDetailParams,
  ): Promise<WxPayResponse<QueryCouponDetailResponse>> {
    return this.client.get<QueryCouponDetailResponse>(
      `/v3/marketing/favor/users/${openid}/coupons/${couponId}`,
      params,
    );
  }

  /**
   * 查询代金券可用商户
   *
   * 通过调用此接口可查询批次的可用商户号，判断券是否在某商户号可用，来决定是否展示。
   *
   * @param stockId - 微信为每个代金券批次分配的唯一ID
   * @param params - 查询参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463358
   */
  async queryStockMerchants(
    stockId: string,
    params: QueryCouponStockMerchantsParams,
  ): Promise<WxPayResponse<QueryCouponStockMerchantsResponse>> {
    return this.client.get<QueryCouponStockMerchantsResponse>(
      `/v3/marketing/favor/stocks/${stockId}/merchants`,
      params,
    );
  }

  /**
   * 查询代金券可用单品
   *
   * 通过此接口可查询批次的可用商品编码，判断券是否可用于某些商品，来决定是否展示。
   *
   * @param stockId - 微信为每个代金券批次分配的唯一ID
   * @param params - 查询参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463442
   */
  async queryStockItems(
    stockId: string,
    params: QueryCouponStockItemsParams,
  ): Promise<WxPayResponse<QueryCouponStockItemsResponse>> {
    return this.client.get<QueryCouponStockItemsResponse>(
      `/v3/marketing/favor/stocks/${stockId}/items`,
      params,
    );
  }

  /**
   * 根据商户号查用户的券
   *
   * 可通过该接口查询用户在某商户号可用的全部券，可用于商户的小程序/H5中，
   * 用户"我的代金券"或"提交订单页"展示优惠信息。
   *
   * 注意：无法查询到微信支付立减金（全平台通用券）。
   *
   * @param openid - 用户在商户appid下的唯一标识
   * @param params - 查询参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534690
   */
  async queryUserCoupons(
    openid: string,
    params: QueryUserCouponsParams,
  ): Promise<WxPayResponse<QueryUserCouponsResponse>> {
    return this.client.get<QueryUserCouponsResponse>(
      `/v3/marketing/favor/users/${openid}/coupons`,
      params,
    );
  }

  // ============= 明细下载 =============

  /**
   * 下载批次核销明细
   *
   * 可获取到某批次的核销明细数据，包括订单号、单品信息、银行流水号等，用于对账/数据分析。
   * 需要活动结束后次日10点才可下载。下载链接30秒内有效。
   *
   * @param stockId - 代金券批次唯一ID
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463585
   */
  async downloadUseFlow(
    stockId: string,
  ): Promise<WxPayResponse<DownloadCouponStockFlowResponse>> {
    return this.client.get<DownloadCouponStockFlowResponse>(
      `/v3/marketing/favor/stocks/${stockId}/use-flow`,
    );
  }

  /**
   * 下载批次退款明细
   *
   * 可获取到某批次的退款明细数据，包括订单号、单品信息、银行流水号等，用于对账/数据分析。
   * 需要活动结束后次日10点才可下载。下载链接30秒内有效。
   *
   * @param stockId - 代金券批次唯一ID
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463523
   */
  async downloadRefundFlow(
    stockId: string,
  ): Promise<WxPayResponse<DownloadCouponStockFlowResponse>> {
    return this.client.get<DownloadCouponStockFlowResponse>(
      `/v3/marketing/favor/stocks/${stockId}/refund-flow`,
    );
  }

  // ============= 通知设置 =============

  /**
   * 设置代金券消息通知地址
   *
   * 用于设置接收营销事件通知的URL，可接收营销相关的事件通知，包括核销、发放、退款等。
   * 通知URL必须为HTTPS协议、可直接访问、不能携带参数。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012464198
   */
  async setCallback(
    request: SetCouponCallbackRequest,
  ): Promise<WxPayResponse<SetCouponCallbackResponse>> {
    return this.client.post<SetCouponCallbackResponse>(
      '/v3/marketing/favor/callbacks',
      request,
    );
  }

  /**
   * 查询代金券消息通知地址
   *
   * 查询已设置的代金券核销事件通知地址。
   *
   * @param mchid - 商户号
   * @returns 通知地址信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012464070
   */
  async queryCallback(
    mchid: string,
  ): Promise<WxPayResponse<SetCouponCallbackResponse>> {
    return this.client.get<SetCouponCallbackResponse>(
      '/v3/marketing/favor/callbacks',
      { mchid },
    );
  }
}
