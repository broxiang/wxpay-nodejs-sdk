import type { WxPayResponse } from '../types/index.js';
import type {
  CreateMerchantTransferRequest,
  CreateMerchantTransferResponse,
  QueryMerchantTransferResponse,
  CancelMerchantTransferResponse,
  ApplyMerchantTransferElecSignByOutBillNoRequest,
  ApplyMerchantTransferElecSignByTransferBillNoRequest,
  ApplyMerchantTransferElecSignResponse,
  QueryMerchantTransferElecSignResponse,
  CreateTransferWithAuthorizationRequest,
  CreateTransferWithAuthorizationResponse,
  CreateMerchantTransferAuthorizationRequest,
  CreateMerchantTransferAuthorizationResponse,
  QueryMerchantTransferAuthorizationResponse,
  CreateTransferAfterAuthorizationRequest,
  CreateTransferAfterAuthorizationResponse,
  CloseMerchantTransferAuthorizationResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 商家转账服务
 *
 * 提供微信支付商家转账全流程相关的 API 封装，包括：
 * - 用户确认收款模式：发起转账、撤销转账、查询转账单
 * - 电子回单：申请和查询电子回单
 * - 用户授权免确认模式：发起授权、查询授权、授权后转账、解除授权
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716434
 */
export class MerchantTransferService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  // ============= 用户确认收款模式 =============

  /**
   * 发起转账
   *
   * 商户调用此接口发起转账申请，用户需确认收款。
   * 成功时返回 package_info 用于拉起用户确认收款页。
   *
   * 注意：
   * - 转账金额≥2000元时，user_name 必传
   * - 返回 ACCEPTED 时，需检查运营账户资金是否足够
   * - 遇到错误不要换单重试，需先查询原订单结果
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716434
   */
  async createTransfer(
    request: CreateMerchantTransferRequest,
  ): Promise<WxPayResponse<CreateMerchantTransferResponse>> {
    return this.client.post<CreateMerchantTransferResponse>(
      '/v3/fund-app/mch-transfer/transfer-bills',
      request,
    );
  }

  /**
   * 商户单号查询转账单
   *
   * 通过商户单号查询转账单详情，仅支持查询最近30天内的转账单。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716437
   */
  async queryTransferByOutBillNo(
    outBillNo: string,
  ): Promise<WxPayResponse<QueryMerchantTransferResponse>> {
    return this.client.get<QueryMerchantTransferResponse>(
      `/v3/fund-app/mch-transfer/transfer-bills/out-bill-no/${outBillNo}`,
    );
  }

  /**
   * 微信单号查询转账单
   *
   * 通过微信转账单号查询转账单详情，仅支持查询最近30天内的转账单。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716457
   */
  async queryTransferByTransferBillNo(
    transferBillNo: string,
  ): Promise<WxPayResponse<QueryMerchantTransferResponse>> {
    return this.client.get<QueryMerchantTransferResponse>(
      `/v3/fund-app/mch-transfer/transfer-bills/transfer-bill-no/${transferBillNo}`,
    );
  }

  /**
   * 撤销转账
   *
   * 在用户确认收款前，商户可通过此接口撤销转账。
   * 返回成功仅表示撤销请求已受理，系统会异步处理退款等操作，
   * 需以最终查询转账单返回的状态为准。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716458
   */
  async cancelTransfer(
    outBillNo: string,
  ): Promise<WxPayResponse<CancelMerchantTransferResponse>> {
    return this.client.post<CancelMerchantTransferResponse>(
      `/v3/fund-app/mch-transfer/transfer-bills/out-bill-no/${outBillNo}/cancel`,
    );
  }

  // ============= 电子回单 =============

  /**
   * 商户单号申请电子回单
   *
   * 申请条件：
   * - 转账单据状态为 SUCCESS
   * - 传入了收款用户姓名
   * - 六个月内的转账单据
   *
   * 回单有效期为90天，过期需重新申请。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716452
   */
  async applyElecSignByOutBillNo(
    request: ApplyMerchantTransferElecSignByOutBillNoRequest,
  ): Promise<WxPayResponse<ApplyMerchantTransferElecSignResponse>> {
    return this.client.post<ApplyMerchantTransferElecSignResponse>(
      '/v3/fund-app/mch-transfer/elecsign/out-bill-no',
      request,
    );
  }

  /**
   * 商户单号查询电子回单
   *
   * 当申请单状态为 FINISHED 时，返回回单文件的下载地址和摘要信息。
   * 下载地址有效期为10分钟，过期后需重新调用此接口获取。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716436
   */
  async queryElecSignByOutBillNo(
    outBillNo: string,
  ): Promise<WxPayResponse<QueryMerchantTransferElecSignResponse>> {
    return this.client.get<QueryMerchantTransferElecSignResponse>(
      `/v3/fund-app/mch-transfer/elecsign/out-bill-no/${outBillNo}`,
    );
  }

  /**
   * 微信单号申请电子回单
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716456
   */
  async applyElecSignByTransferBillNo(
    request: ApplyMerchantTransferElecSignByTransferBillNoRequest,
  ): Promise<WxPayResponse<ApplyMerchantTransferElecSignResponse>> {
    return this.client.post<ApplyMerchantTransferElecSignResponse>(
      '/v3/fund-app/mch-transfer/elecsign/transfer-bill-no',
      request,
    );
  }

  /**
   * 微信单号查询电子回单
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716455
   */
  async queryElecSignByTransferBillNo(
    transferBillNo: string,
  ): Promise<WxPayResponse<QueryMerchantTransferElecSignResponse>> {
    return this.client.get<QueryMerchantTransferElecSignResponse>(
      `/v3/fund-app/mch-transfer/elecsign/transfer-bill-no/${transferBillNo}`,
    );
  }

  // ============= 用户授权免确认模式 =============

  /**
   * 发起转账并完成免确认收款授权
   *
   * 在发起转账的同时申请免确认收款授权，用户确认收款时可同时完成授权。
   * 授权成功后，后续转账无需用户逐笔确认。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4014399293
   */
  async createTransferWithAuthorization(
    request: CreateTransferWithAuthorizationRequest,
  ): Promise<WxPayResponse<CreateTransferWithAuthorizationResponse>> {
    return this.client.post<CreateTransferWithAuthorizationResponse>(
      '/v3/fund-app/mch-transfer/transfer-bills/pre-transfer-with-authorization',
      request,
    );
  }

  /**
   * 发起免确认收款授权
   *
   * 直接申请免确认收款授权，不发起转账。
   * 用户需在24小时内完成授权，未确认记录保留30天。
   * 同一微信号在同商户下待确认+已授权状态的授权单最多5个。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4015901167
   */
  async createAuthorization(
    request: CreateMerchantTransferAuthorizationRequest,
  ): Promise<WxPayResponse<CreateMerchantTransferAuthorizationResponse>> {
    return this.client.post<CreateMerchantTransferAuthorizationResponse>(
      '/v3/fund-app/mch-transfer/user-confirm-authorization',
      request,
    );
  }

  /**
   * 商户单号查询授权结果
   *
   * @param outAuthorizationNo - 商户侧授权单号
   * @param options - 可选参数，is_display_authorization 控制是否返回 package_info
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4014399423
   */
  async queryAuthorizationByOutAuthorizationNo(
    outAuthorizationNo: string,
    options?: { is_display_authorization?: boolean },
  ): Promise<WxPayResponse<QueryMerchantTransferAuthorizationResponse>> {
    return this.client.get<QueryMerchantTransferAuthorizationResponse>(
      `/v3/fund-app/mch-transfer/user-confirm-authorization/out-authorization-no/${outAuthorizationNo}`,
      options,
    );
  }

  /**
   * 用户授权后转账
   *
   * 用户完成授权后，商户可直接发起转账，无需用户逐笔确认收款。
   * 需要提供 authorization_id 或 out_authorization_no（二选一）。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4014399371
   */
  async createTransferAfterAuthorization(
    request: CreateTransferAfterAuthorizationRequest,
  ): Promise<WxPayResponse<CreateTransferAfterAuthorizationResponse>> {
    return this.client.post<CreateTransferAfterAuthorizationResponse>(
      '/v3/fund-app/mch-transfer/transfer-bills/transfer',
      request,
    );
  }

  /**
   * 解除免确认收款授权
   *
   * 商户可调用此接口帮助用户发起解除授权。
   * 用户也可通过微信支付入账消息的收款设置操作关闭授权。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4015653811
   */
  async closeAuthorization(
    outAuthorizationNo: string,
  ): Promise<WxPayResponse<CloseMerchantTransferAuthorizationResponse>> {
    return this.client.post<CloseMerchantTransferAuthorizationResponse>(
      `/v3/fund-app/mch-transfer/user-confirm-authorization/out-authorization-no/${outAuthorizationNo}/close`,
    );
  }

  // ============= 电子回单下载 =============

  /**
   * 下载电子回单
   *
   * 通过申请电子回单接口返回的 download_url，以 GET 方式下载回单原始文件。
   * 下载地址有效期为 10 分钟，过期后需重新调用查询接口获取。
   * 返回的 data 为 PDF 文件的 Buffer。
   *
   * @param downloadUrl - 查询电子回单返回的 download_url
   * @returns 电子回单文件 Buffer
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013866774
   */
  async downloadElecSign(downloadUrl: string): Promise<WxPayResponse<Buffer>> {
    return this.client.downloadRaw(downloadUrl);
  }
}
