import type { WxPayResponse } from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/** 连锁品牌分账接收方 */
export interface BrandProfitSharingReceiver {
  /** 接收方类型 */
  type: string;
  /** 接收方账号 */
  account: string;
  /** 分账金额（分） */
  amount: number;
  /** 分账描述 */
  description: string;
  /** 接收方姓名 */
  name?: string;
}

/** 连锁品牌请求分账请求 */
export interface CreateBrandProfitSharingRequest {
  /** 品牌主商户号 */
  brand_mchid: string;
  /** 特约商户号 */
  sub_mchid: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户分账单号 */
  out_order_no: string;
  /** 分账接收方列表 */
  receivers: BrandProfitSharingReceiver[];
  /** 是否解冻剩余资金 */
  finish: boolean;
}

/** 连锁品牌请求分账响应 */
export interface CreateBrandProfitSharingResponse {
  transaction_id: string;
  out_order_no: string;
  /** 微信分账单号 */
  order_id: string;
}

/** 连锁品牌分账回退请求 */
export interface BrandProfitSharingReturnRequest {
  brand_mchid: string;
  sub_mchid: string;
  order_id: string;
  out_order_no: string;
  out_return_no: string;
  return_mchid: string;
  amount: number;
  description: string;
}

/** 连锁品牌分账回退响应 */
export interface BrandProfitSharingReturnResponse {
  order_id: string;
  out_order_no: string;
  out_return_no: string;
  return_no: string;
  return_mchid: string;
  amount: number;
  result: string;
}

/** 连锁品牌完结分账请求 */
export interface BrandFinishOrderRequest {
  brand_mchid: string;
  sub_mchid: string;
  transaction_id: string;
  out_order_no: string;
  description: string;
}

/** 连锁品牌查询最大分账比例响应 */
export interface QueryBrandMerchantRatioResponse {
  /** 品牌商户号 */
  brand_mchid: string;
  /** 最大分账比例（万分比，如2000表示20%） */
  max_ratio: number;
}

/** 连锁品牌查询订单剩余待分金额响应 */
export interface QueryBrandOrderAmountResponse {
  /** 微信支付订单号 */
  transaction_id: string;
  /** 订单剩余待分金额（分） */
  unsplit_amount: number;
}

/** 连锁品牌添加分账接收方请求 */
export interface AddBrandReceiverRequest {
  /** 品牌主商户号 */
  brand_mchid: string;
  /** 公众账号ID */
  appid: string;
  /** 子商户公众账号ID（PERSONAL_SUB_OPENID 时必填） */
  sub_appid?: string;
  /** 接收方类型：MERCHANT_ID / PERSONAL_OPENID / PERSONAL_SUB_OPENID */
  type: string;
  /** 接收方账号 */
  account: string;
  /** 接收方名称 */
  name?: string;
  /** 与品牌主的关系类型：SUPPLIER / DISTRIBUTOR / SERVICE_PROVIDER / PLATFORM / STAFF / OTHERS */
  relation_type: string;
}

/** 连锁品牌添加分账接收方响应 */
export interface AddBrandReceiverResponse {
  brand_mchid: string;
  type: string;
  account: string;
}

/** 连锁品牌删除分账接收方请求 */
export interface DeleteBrandReceiverRequest {
  /** 品牌主商户号 */
  brand_mchid: string;
  /** 公众账号ID */
  appid: string;
  /** 子商户公众账号ID */
  sub_appid?: string;
  /** 接收方类型：MERCHANT_ID / PERSONAL_OPENID / PERSONAL_SUB_OPENID */
  type: string;
  /** 接收方账号 */
  account: string;
}

/** 连锁品牌删除分账接收方响应 */
export interface DeleteBrandReceiverResponse {
  brand_mchid: string;
  type: string;
  account: string;
}

/**
 * 连锁品牌分账服务
 *
 * 用于连锁品牌对门店的订单进行分账。
 *
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012690683 (连锁品牌分账)
 */
export class BrandProfitSharingService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 请求分账
   *
   * @param request - 分账请求参数
   * @returns 分账结果
   */
  async createOrder(
    request: CreateBrandProfitSharingRequest,
  ): Promise<WxPayResponse<CreateBrandProfitSharingResponse>> {
    return this.client.post<CreateBrandProfitSharingResponse>(
      '/v3/brand/profitsharing/orders',
      request,
    );
  }

  /**
   * 查询分账结果
   *
   * @param brandMchid - 品牌主商户号
   * @param subMchid - 特约商户号
   * @param transactionId - 微信支付订单号
   * @param outOrderNo - 商户分账单号
   * @returns 分账结果详情
   */
  async queryOrder(
    brandMchid: string,
    subMchid: string,
    transactionId: string,
    outOrderNo: string,
  ): Promise<WxPayResponse<CreateBrandProfitSharingResponse>> {
    return this.client.get<CreateBrandProfitSharingResponse>('/v3/brand/profitsharing/orders', {
      brand_mchid: brandMchid,
      sub_mchid: subMchid,
      transaction_id: transactionId,
      out_order_no: outOrderNo,
    });
  }

  /**
   * 请求分账回退
   *
   * @param request - 分账回退请求参数
   * @returns 回退结果
   */
  async createReturnOrder(
    request: BrandProfitSharingReturnRequest,
  ): Promise<WxPayResponse<BrandProfitSharingReturnResponse>> {
    return this.client.post<BrandProfitSharingReturnResponse>(
      '/v3/brand/profitsharing/returnorders',
      request,
    );
  }

  /**
   * 查询分账回退结果
   *
   * @param brandMchid - 品牌主商户号
   * @param subMchid - 特约商户号
   * @param orderId - 微信分账单号
   * @param outReturnNo - 商户回退单号
   * @returns 回退结果详情
   */
  async queryReturnOrder(
    brandMchid: string,
    subMchid: string,
    orderId: string,
    outReturnNo: string,
  ): Promise<WxPayResponse<BrandProfitSharingReturnResponse>> {
    return this.client.get<BrandProfitSharingReturnResponse>(
      '/v3/brand/profitsharing/returnorders',
      {
        brand_mchid: brandMchid,
        sub_mchid: subMchid,
        order_id: orderId,
        out_return_no: outReturnNo,
      },
    );
  }

  /**
   * 完结分账
   *
   * @param request - 完结分账请求参数
   */
  async finishOrder(request: BrandFinishOrderRequest): Promise<WxPayResponse> {
    return this.client.post('/v3/brand/profitsharing/finish-order', request);
  }

  /**
   * 查询最大分账比例
   *
   * @param brandMchid - 品牌主商户号
   * @returns 最大分账比例
   */
  async queryBrandMerchantRatio(
    brandMchid: string,
  ): Promise<WxPayResponse<QueryBrandMerchantRatioResponse>> {
    return this.client.get<QueryBrandMerchantRatioResponse>(
      `/v3/brand/profitsharing/brand-configs/${brandMchid}`,
    );
  }

  /**
   * 查询订单剩余待分金额
   *
   * @param transactionId - 微信支付订单号
   * @returns 订单剩余待分金额
   */
  async queryOrderAmount(
    transactionId: string,
  ): Promise<WxPayResponse<QueryBrandOrderAmountResponse>> {
    return this.client.get<QueryBrandOrderAmountResponse>(
      `/v3/brand/profitsharing/orders/${transactionId}/amounts`,
    );
  }

  /**
   * 添加分账接收方
   *
   * @param request - 添加接收方请求参数
   * @returns 添加接收方结果
   */
  async addReceiver(
    request: AddBrandReceiverRequest,
  ): Promise<WxPayResponse<AddBrandReceiverResponse>> {
    return this.client.post<AddBrandReceiverResponse>(
      '/v3/brand/profitsharing/receivers/add',
      request,
    );
  }

  /**
   * 删除分账接收方
   *
   * @param request - 删除接收方请求参数
   * @returns 删除接收方结果
   */
  async deleteReceiver(
    request: DeleteBrandReceiverRequest,
  ): Promise<WxPayResponse<DeleteBrandReceiverResponse>> {
    return this.client.post<DeleteBrandReceiverResponse>(
      '/v3/brand/profitsharing/receivers/delete',
      request,
    );
  }
}
