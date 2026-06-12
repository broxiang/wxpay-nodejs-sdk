import type { WxPayResponse } from '../types/index.js';
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
}
