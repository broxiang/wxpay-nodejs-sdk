import type { WxPayResponse } from '../types/index.js';
import type {
  ApplyMerchantTransferElecSignResponse,
  QueryMerchantTransferElecSignResponse,
  CreateTransferWithAuthorizationRequest,
  CreateTransferWithAuthorizationResponse,
  CreateMerchantTransferAuthorizationResponse,
  QueryMerchantTransferAuthorizationResponse,
  CreateTransferAfterAuthorizationResponse,
  CloseMerchantTransferAuthorizationResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/** 服务商商家转账请求参数 */
export interface PartnerTransferRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 特约商户 AppID */
  sub_appid?: string;
  /** 免确认收款授权单号 */
  authorization_id?: string;
  /** 商户转账单号 */
  out_bill_no: string;
  /** 转账场景ID */
  transfer_scene_id: string;
  /** 用户 OpenID */
  openid: string;
  /** 收款用户姓名 */
  user_name?: string;
  /** 转账金额（分） */
  transfer_amount: number;
  /** 转账备注 */
  transfer_remark: string;
  /** 回调通知地址 */
  notify_url?: string;
  /** 用户收款感知 */
  user_recv_perception?: string;
  /** 转账场景报备信息 */
  transfer_scene_report_infos: {
    info_type: string;
    info_content: string;
  }[];
}

/** 服务商商家转账响应 */
export interface PartnerTransferResponse {
  /** 商户转账单号 */
  out_bill_no: string;
  /** 微信转账单号 */
  transfer_bill_no: string;
  /** 创建时间 */
  create_time: string;
  /** 转账状态 */
  state: string;
  /** 跳转领取页面的 package 信息 */
  package_info?: string;
}

/** 服务商商家转账查询响应 */
export interface PartnerTransferQueryResponse {
  /** 服务商户号 */
  sp_mchid: string;
  /** 特约商户号 */
  sub_mchid: string;
  /** 商户转账单号 */
  out_bill_no: string;
  /** 微信转账单号 */
  transfer_bill_no: string;
  /** 创建时间 */
  create_time: string;
  /** 转账状态 */
  state: string;
  /** 转账金额（分） */
  transfer_amount: number;
  /** 转账备注 */
  transfer_remark: string;
  /** 失败原因 */
  fail_reason?: string;
  /** 用户 OpenID */
  openid: string;
  /** 收款用户姓名 */
  user_name?: string;
  /** 更新时间 */
  update_time?: string;
}

/** 服务商申请电子回单请求（商户单号） */
export interface ApplyPartnerTransferElecSignByOutBillNoRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 商户单号 */
  out_bill_no: string;
}

/** 服务商申请电子回单请求（微信单号） */
export interface ApplyPartnerTransferElecSignByTransferBillNoRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 微信转账单号 */
  transfer_bill_no: string;
}

/** 服务商发起免确认收款授权请求 */
export interface CreatePartnerTransferAuthorizationRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 商户侧授权单号 */
  out_authorization_no: string;
  /** 商户应用唯一标识 */
  appid: string;
  /** 收款用户在商户appid下的唯一标识 */
  openid: string;
  /** 转账场景ID */
  transfer_scene_id: string;
  /** 用户展示名称 */
  user_display_name: string;
  /** 用户收款时感知到的收款原因 */
  user_recv_perception?: string;
  /** 授权结果异步通知回调地址 */
  authorization_notify_url: string;
  /** 用户端场景信息 */
  scene_info?: {
    /** 用户终端IP */
    client_ip?: string;
    /** 用户设备ID */
    device_id?: string;
    /** 设备类型 */
    device_type?: 'IOS' | 'ANDROID' | 'HARMONY' | 'OTHER';
  };
}

/** 服务商查询授权结果请求 */
export interface QueryPartnerTransferAuthorizationRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 商户侧授权单号 */
  out_authorization_no: string;
  /** 是否显示授权信息 */
  is_display_authorization?: boolean;
}

/** 服务商用户授权后转账请求 */
export interface CreatePartnerTransferAfterAuthorizationRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 商户AppID */
  appid: string;
  /** 商户单号 */
  out_bill_no: string;
  /** 转账场景ID */
  transfer_scene_id: string;
  /** 收款用户姓名（需加密） */
  user_name?: string;
  /** 转账金额，单位为分 */
  transfer_amount: number;
  /** 转账备注 */
  transfer_remark: string;
  /** 用户收款感知 */
  user_recv_perception?: string;
  /** 转账场景报备信息 */
  transfer_scene_report_infos?: {
    info_type: string;
    info_content: string;
  }[];
  /** 微信免确认收款授权单号（与out_authorization_no二选一） */
  authorization_id?: string;
  /** 商户侧授权单号（与authorization_id二选一） */
  out_authorization_no?: string;
}

/** 服务商解除免确认收款授权请求 */
export interface ClosePartnerTransferAuthorizationRequest {
  /** 特约商户号 */
  sub_mchid: string;
  /** 商户侧授权单号 */
  out_authorization_no: string;
}

/**
 * 服务商商家转账服务
 *
 * 服务商模式下，服务商代替特约商户发起商家转账。
 *
 * @see https://pay.weixin.qq.com/doc/v3/partner/4012716434 (商家转账)
 */
export class PartnerTransferService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 服务商发起商家转账
   *
   * @param request - 转账请求参数
   * @returns 转账结果
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012716434
   */
  async createTransfer(
    request: PartnerTransferRequest,
  ): Promise<WxPayResponse<PartnerTransferResponse>> {
    return this.client.post<PartnerTransferResponse>(
      '/v3/fund-app/mch-transfer/partner/transfer-bills',
      request,
    );
  }

  /**
   * 通过商户单号查询转账单
   *
   * @param outBillNo - 商户转账单号
   * @param subMchid - 特约商户号
   * @returns 转账单详情
   */
  async queryTransferByOutBillNo(
    outBillNo: string,
    subMchid: string,
  ): Promise<WxPayResponse<PartnerTransferQueryResponse>> {
    return this.client.get<PartnerTransferQueryResponse>(
      `/v3/fund-app/mch-transfer/partner/transfer-bills/out-bill-no/${outBillNo}`,
      { sub_mchid: subMchid },
    );
  }

  /**
   * 通过微信单号查询转账单
   *
   * @param transferBillNo - 微信转账单号
   * @param subMchid - 特约商户号
   * @returns 转账单详情
   */
  async queryTransferByTransferBillNo(
    transferBillNo: string,
    subMchid: string,
  ): Promise<WxPayResponse<PartnerTransferQueryResponse>> {
    return this.client.get<PartnerTransferQueryResponse>(
      `/v3/fund-app/mch-transfer/partner/transfer-bills/transfer-bill-no/${transferBillNo}`,
      { sub_mchid: subMchid },
    );
  }

  /**
   * 撤销转账
   *
   * @param outBillNo - 商户转账单号
   * @param subMchid - 特约商户号
   */
  async cancelTransfer(outBillNo: string, subMchid: string): Promise<WxPayResponse> {
    return this.client.post(
      `/v3/fund-app/mch-transfer/partner/transfer-bills/out-bill-no/${outBillNo}/cancel`,
      { sub_mchid: subMchid },
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
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012716452
   */
  async applyElecSignByOutBillNo(
    request: ApplyPartnerTransferElecSignByOutBillNoRequest,
  ): Promise<WxPayResponse<ApplyMerchantTransferElecSignResponse>> {
    return this.client.post<ApplyMerchantTransferElecSignResponse>(
      '/v3/fund-app/mch-transfer/partner/elecsign/out-bill-no',
      request,
    );
  }

  /**
   * 商户单号查询电子回单
   *
   * 当申请单状态为 FINISHED 时，返回回单文件的下载地址和摘要信息。
   * 下载地址有效期为10分钟，过期后需重新调用此接口获取。
   *
   * @param outBillNo - 商户单号
   * @param subMchid - 特约商户号
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012716436
   */
  async queryElecSignByOutBillNo(
    outBillNo: string,
    subMchid: string,
  ): Promise<WxPayResponse<QueryMerchantTransferElecSignResponse>> {
    return this.client.get<QueryMerchantTransferElecSignResponse>(
      `/v3/fund-app/mch-transfer/partner/elecsign/out-bill-no/${outBillNo}`,
      { sub_mchid: subMchid },
    );
  }

  /**
   * 微信单号申请电子回单
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012716456
   */
  async applyElecSignByTransferBillNo(
    request: ApplyPartnerTransferElecSignByTransferBillNoRequest,
  ): Promise<WxPayResponse<ApplyMerchantTransferElecSignResponse>> {
    return this.client.post<ApplyMerchantTransferElecSignResponse>(
      '/v3/fund-app/mch-transfer/partner/elecsign/transfer-bill-no',
      request,
    );
  }

  /**
   * 微信单号查询电子回单
   *
   * @param transferBillNo - 微信转账单号
   * @param subMchid - 特约商户号
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4012716455
   */
  async queryElecSignByTransferBillNo(
    transferBillNo: string,
    subMchid: string,
  ): Promise<WxPayResponse<QueryMerchantTransferElecSignResponse>> {
    return this.client.get<QueryMerchantTransferElecSignResponse>(
      `/v3/fund-app/mch-transfer/partner/elecsign/transfer-bill-no/${transferBillNo}`,
      { sub_mchid: subMchid },
    );
  }

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
   * @see https://pay.weixin.qq.com/doc/v3/partner/4013866774
   */
  async downloadElecSign(downloadUrl: string): Promise<WxPayResponse<Buffer>> {
    return this.client.downloadRaw(downloadUrl);
  }

  // ============= 用户授权免确认模式 =============

  /**
   * 发起转账并完成免确认收款授权
   *
   * 在发起转账的同时申请免确认收款授权，用户确认收款时可同时完成授权。
   * 授权成功后，后续转账无需用户逐笔确认。
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4014399293
   */
  async createTransferWithAuthorization(
    request: CreateTransferWithAuthorizationRequest & { sub_mchid: string },
  ): Promise<WxPayResponse<CreateTransferWithAuthorizationResponse>> {
    return this.client.post<CreateTransferWithAuthorizationResponse>(
      '/v3/fund-app/mch-transfer/partner/transfer-bills/pre-transfer-with-authorization',
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
   * @see https://pay.weixin.qq.com/doc/v3/partner/4015901167
   */
  async createAuthorization(
    request: CreatePartnerTransferAuthorizationRequest,
  ): Promise<WxPayResponse<CreateMerchantTransferAuthorizationResponse>> {
    return this.client.post<CreateMerchantTransferAuthorizationResponse>(
      '/v3/fund-app/mch-transfer/partner/user-confirm-authorization',
      request,
    );
  }

  /**
   * 商户单号查询授权结果
   *
   * @param request - 查询请求参数
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4014399423
   */
  async queryAuthorizationByOutAuthorizationNo(
    request: QueryPartnerTransferAuthorizationRequest,
  ): Promise<WxPayResponse<QueryMerchantTransferAuthorizationResponse>> {
    const { sub_mchid, out_authorization_no, is_display_authorization } = request;
    return this.client.get<QueryMerchantTransferAuthorizationResponse>(
      `/v3/fund-app/mch-transfer/partner/user-confirm-authorization/out-authorization-no/${out_authorization_no}`,
      { sub_mchid, is_display_authorization },
    );
  }

  /**
   * 用户授权后转账
   *
   * 用户完成授权后，商户可直接发起转账，无需用户逐笔确认收款。
   * 需要提供 authorization_id 或 out_authorization_no（二选一）。
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4014399371
   */
  async createTransferAfterAuthorization(
    request: CreatePartnerTransferAfterAuthorizationRequest,
  ): Promise<WxPayResponse<CreateTransferAfterAuthorizationResponse>> {
    return this.client.post<CreateTransferAfterAuthorizationResponse>(
      '/v3/fund-app/mch-transfer/partner/transfer-bills/transfer',
      request,
    );
  }

  /**
   * 解除免确认收款授权
   *
   * 商户可调用此接口帮助用户发起解除授权。
   * 用户也可通过微信支付入账消息的收款设置操作关闭授权。
   *
   * @see https://pay.weixin.qq.com/doc/v3/partner/4015653811
   */
  async closeAuthorization(
    request: ClosePartnerTransferAuthorizationRequest,
  ): Promise<WxPayResponse<CloseMerchantTransferAuthorizationResponse>> {
    const { sub_mchid, out_authorization_no } = request;
    return this.client.post<CloseMerchantTransferAuthorizationResponse>(
      `/v3/fund-app/mch-transfer/partner/user-confirm-authorization/out-authorization-no/${out_authorization_no}/close`,
      { sub_mchid },
    );
  }
}
