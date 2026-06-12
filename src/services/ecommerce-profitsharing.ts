import type { WxPayResponse } from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/** 电商收付通分账接收方 */
export interface EcommerceProfitSharingReceiver {
  /** 接收方类型：MERCHANT_ID / PERSONAL_OPENID */
  type: string;
  /** 接收方账号 */
  receiver_account: string;
  /** 分账金额（分） */
  amount: number;
  /** 分账描述 */
  description: string;
  /** 接收方姓名（加密） */
  receiver_name?: string;
}

/** 电商收付通请求分账请求 */
export interface CreateEcommerceProfitSharingRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 电商平台 AppID */
  appid: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户分账单号 */
  out_order_no: string;
  /** 分账接收方列表 */
  receivers: EcommerceProfitSharingReceiver[];
  /** 是否解冻剩余资金 */
  finish: boolean;
}

/** 电商收付通请求分账响应 */
export interface CreateEcommerceProfitSharingResponse {
  sub_mchid: string;
  transaction_id: string;
  out_order_no: string;
  /** 微信分账单号 */
  order_id: string;
}

/** 电商收付通查询分账响应 */
export interface QueryEcommerceProfitSharingResponse {
  sub_mchid: string;
  transaction_id: string;
  out_order_no: string;
  order_id: string;
  /** 分账状态 */
  state: string;
  receivers: {
    amount: number;
    description: string;
    type: string;
    receiver_account: string;
    result: string;
    fail_reason?: string;
    detail_id: string;
    create_time: string;
    finish_time: string;
  }[];
}

/** 电商收付通分账回退请求 */
export interface EcommerceProfitSharingReturnRequest {
  sub_mchid: string;
  order_id: string;
  out_order_no: string;
  out_return_no: string;
  return_mchid: string;
  amount: number;
  description: string;
}

/** 电商收付通分账回退响应 */
export interface EcommerceProfitSharingReturnResponse {
  sub_mchid: string;
  order_id: string;
  out_order_no: string;
  out_return_no: string;
  return_no: string;
  return_mchid: string;
  amount: number;
  result: string;
  fail_reason?: string;
}

/** 电商收付通完结分账请求 */
export interface EcommerceFinishOrderRequest {
  sub_mchid: string;
  transaction_id: string;
  out_order_no: string;
  description: string;
}

/** 电商收付通售后服务分账请求 */
export interface CreateAfterSalesOrderRequest {
  /** 子商户号 */
  sub_mchid: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 分账金额（分） */
  amount: number;
  /** 类型：SERVICE_FEE_INCOME */
  type: string;
  /** 场景：REFUND_TICKET / CHANGE_TICKET / RETURN_GOODS */
  scene: string;
  /** 微信退款单号（退票/改签/退货收入分账时必填） */
  refund_id?: string;
}

/** 电商收付通售后服务分账响应 */
export interface CreateAfterSalesOrderResponse {
  sub_mchid: string;
  transaction_id: string;
  /** 分账金额（分） */
  amount: number;
}

/** 电商收付通查询售后服务分账响应 */
export interface QueryAfterSalesOrderResponse {
  sub_mchid: string;
  transaction_id: string;
  /** 分账金额（分） */
  amount: number;
  /** 分账结果：PROCESSING / SUCCESS / FAILED */
  result: string;
  /** 分账完成时间 */
  finish_time?: string;
  /** 分账失败原因 */
  fail_reason?: string;
}

/** 电商收付通查询订单剩余待分金额响应 */
export interface QueryEcommerceOrderAmountResponse {
  /** 微信支付订单号 */
  transaction_id: string;
  /** 订单剩余待分金额（分） */
  unsplit_amount: number;
}

/** 电商收付通添加分账接收方请求 */
export interface AddEcommerceReceiverRequest {
  /** 公众账号ID */
  appid: string;
  /** 接收方类型：MERCHANT_ID / PERSONAL_OPENID */
  type: string;
  /** 接收方账号 */
  account: string;
  /** 接收方名称（商户全称，仅 MERCHANT_ID 时需要） */
  name?: string;
  /** 与分账方的关系类型：SUPPLIER / DISTRIBUTOR / SERVICE_PROVIDER / PLATFORM / OTHERS */
  relation_type: string;
}

/** 电商收付通添加分账接收方响应 */
export interface AddEcommerceReceiverResponse {
  type: string;
  account: string;
}

/** 电商收付通删除分账接收方请求 */
export interface DeleteEcommerceReceiverRequest {
  /** 公众账号ID */
  appid: string;
  /** 接收方类型：MERCHANT_ID / PERSONAL_OPENID */
  type: string;
  /** 接收方账号 */
  account: string;
}

/** 电商收付通删除分账接收方响应 */
export interface DeleteEcommerceReceiverResponse {
  type: string;
  account: string;
}

/**
 * 电商收付通分账服务
 *
 * 用于电商平台对二级商户的订单进行分账。
 *
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012690683 (分账)
 */
export class EcommerceProfitSharingService {
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
    request: CreateEcommerceProfitSharingRequest,
  ): Promise<WxPayResponse<CreateEcommerceProfitSharingResponse>> {
    return this.client.post<CreateEcommerceProfitSharingResponse>(
      '/v3/ecommerce/profitsharing/orders',
      request,
    );
  }

  /**
   * 查询分账结果
   *
   * @param subMchid - 特约商户号
   * @param transactionId - 微信支付订单号
   * @param outOrderNo - 商户分账单号
   * @returns 分账结果详情
   */
  async queryOrder(
    subMchid: string,
    transactionId: string,
    outOrderNo: string,
  ): Promise<WxPayResponse<QueryEcommerceProfitSharingResponse>> {
    return this.client.get<QueryEcommerceProfitSharingResponse>(
      '/v3/ecommerce/profitsharing/orders',
      { sub_mchid: subMchid, transaction_id: transactionId, out_order_no: outOrderNo },
    );
  }

  /**
   * 请求分账回退
   *
   * @param request - 分账回退请求参数
   * @returns 回退结果
   */
  async createReturnOrder(
    request: EcommerceProfitSharingReturnRequest,
  ): Promise<WxPayResponse<EcommerceProfitSharingReturnResponse>> {
    return this.client.post<EcommerceProfitSharingReturnResponse>(
      '/v3/ecommerce/profitsharing/returnorders',
      request,
    );
  }

  /**
   * 查询分账回退结果
   *
   * @param subMchid - 特约商户号
   * @param orderId - 微信分账单号
   * @param outReturnNo - 商户回退单号
   * @returns 回退结果详情
   */
  async queryReturnOrder(
    subMchid: string,
    orderId: string,
    outReturnNo: string,
  ): Promise<WxPayResponse<EcommerceProfitSharingReturnResponse>> {
    return this.client.get<EcommerceProfitSharingReturnResponse>(
      '/v3/ecommerce/profitsharing/returnorders',
      { sub_mchid: subMchid, order_id: orderId, out_return_no: outReturnNo },
    );
  }

  /**
   * 完结分账
   *
   * @param request - 完结分账请求参数
   */
  async finishOrder(request: EcommerceFinishOrderRequest): Promise<WxPayResponse> {
    return this.client.post('/v3/ecommerce/profitsharing/finish-order', request);
  }

  /**
   * 请求售后服务分账
   *
   * @param request - 售后服务分账请求参数
   * @returns 售后服务分账结果
   */
  async createAfterSalesOrder(
    request: CreateAfterSalesOrderRequest,
  ): Promise<WxPayResponse<CreateAfterSalesOrderResponse>> {
    return this.client.post<CreateAfterSalesOrderResponse>(
      '/v3/ecommerce/profitsharing/after-sales-orders',
      request,
    );
  }

  /**
   * 查询售后服务分账结果
   *
   * @param subMchid - 子商户号
   * @param transactionId - 微信支付订单号
   * @returns 售后服务分账结果详情
   */
  async queryAfterSalesOrder(
    subMchid: string,
    transactionId: string,
  ): Promise<WxPayResponse<QueryAfterSalesOrderResponse>> {
    return this.client.get<QueryAfterSalesOrderResponse>(
      '/v3/ecommerce/profitsharing/after-sales-orders',
      { sub_mchid: subMchid, transaction_id: transactionId },
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
  ): Promise<WxPayResponse<QueryEcommerceOrderAmountResponse>> {
    return this.client.get<QueryEcommerceOrderAmountResponse>(
      `/v3/ecommerce/profitsharing/orders/${transactionId}/amounts`,
    );
  }

  /**
   * 添加分账接收方
   *
   * @param request - 添加接收方请求参数
   * @returns 添加接收方结果
   */
  async addReceiver(
    request: AddEcommerceReceiverRequest,
  ): Promise<WxPayResponse<AddEcommerceReceiverResponse>> {
    return this.client.post<AddEcommerceReceiverResponse>(
      '/v3/ecommerce/profitsharing/receivers/add',
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
    request: DeleteEcommerceReceiverRequest,
  ): Promise<WxPayResponse<DeleteEcommerceReceiverResponse>> {
    return this.client.post<DeleteEcommerceReceiverResponse>(
      '/v3/ecommerce/profitsharing/receivers/delete',
      request,
    );
  }
}
