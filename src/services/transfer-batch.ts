import type { WxPayResponse } from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/** 批量转账明细输入 */
export interface TransferDetailInput {
  /** 商家明细单号 */
  out_detail_no: string;
  /** 转账金额（分） */
  transfer_amount: number;
  /** 转账备注（UTF8编码，最多32字符） */
  transfer_remark: string;
  /** 收款用户openid */
  openid: string;
  /** 收款用户姓名（加密，转账金额>=2000元时必填） */
  user_name?: string;
}

/** 发起批量转账请求 */
export interface InitiateBatchTransferRequest {
  /** 商户appid */
  appid: string;
  /** 商家批次单号 */
  out_batch_no: string;
  /** 批次名称 */
  batch_name: string;
  /** 批次备注（UTF8编码，最多32字符） */
  batch_remark: string;
  /** 转账总金额（分），必须与明细金额之和一致 */
  total_amount: number;
  /** 转账总笔数，最多1000笔，必须与明细数一致 */
  total_num: number;
  /** 转账明细列表 */
  transfer_detail_list: TransferDetailInput[];
  /** 转账场景ID（如 1001-现金营销） */
  transfer_scene_id?: string;
  /** 异步通知回调地址 */
  notify_url?: string;
}

/** 发起批量转账响应 */
export interface InitiateBatchTransferResponse {
  /** 商家批次单号 */
  out_batch_no: string;
  /** 微信批次单号 */
  batch_id: string;
  /** 批次创建时间（RFC3339） */
  create_time: string;
  /** 批次状态：ACCEPTED / PROCESSING / FINISHED / CLOSED */
  batch_status: string;
}

/** 批次单信息 */
export interface TransferBatchGet {
  /** 商户号 */
  mchid: string;
  /** 商家批次单号 */
  out_batch_no: string;
  /** 微信批次单号 */
  batch_id: string;
  /** 商户appid */
  appid: string;
  /** 批次状态 */
  batch_status: string;
  /** 批次类型 */
  batch_type?: string;
  /** 批次名称 */
  batch_name: string;
  /** 批次备注 */
  batch_remark: string;
  /** 转账总金额（分） */
  total_amount: number;
  /** 转账总笔数 */
  total_num: number;
  /** 转账成功金额（分） */
  success_amount?: number;
  /** 转账成功笔数 */
  success_num?: number;
  /** 转账失败金额（分） */
  fail_amount?: number;
  /** 转账失败笔数 */
  fail_num?: number;
  /** 批次关闭原因 */
  close_reason?: string;
  /** 批次创建时间 */
  create_time?: string;
  /** 批次更新时间 */
  update_time?: string;
}

/** 转账明细简要信息 */
export interface TransferDetailCompact {
  /** 微信明细单号 */
  detail_id: string;
  /** 商家明细单号 */
  out_detail_no: string;
  /** 明细状态 */
  detail_status: string;
}

/** 查询批次单响应 */
export interface TransferBatchEntity {
  /** 转账批次单基本信息 */
  transfer_batch: TransferBatchGet;
  /** 转账明细单列表（批次完成时返回） */
  transfer_detail_list?: TransferDetailCompact[];
}

/** 转账明细单详情 */
export interface TransferDetailEntity {
  /** 商户号 */
  mchid: string;
  /** 商家批次单号 */
  out_batch_no: string;
  /** 微信批次单号 */
  batch_id: string;
  /** 商户appid */
  appid: string;
  /** 商家明细单号 */
  out_detail_no: string;
  /** 微信明细单号 */
  detail_id: string;
  /** 明细状态：INIT / WAIT_PAY / PROCESSING / SUCCESS / FAIL */
  detail_status: string;
  /** 转账金额（分） */
  transfer_amount: number;
  /** 转账备注 */
  transfer_remark: string;
  /** 明细失败原因 */
  fail_reason?: string;
  /** 收款用户openid */
  openid: string;
  /** 收款用户姓名（加密） */
  user_name?: string;
  /** 转账发起时间 */
  initiate_time?: string;
  /** 明细更新时间 */
  update_time?: string;
}

/** 查询批次单参数 */
export interface GetTransferBatchParams {
  /** 是否查询明细单（默认 false） */
  need_query_detail?: boolean;
  /** 请求资源起始位置（默认 0） */
  offset?: number;
  /** 最大资源条数（20~100，默认 20） */
  limit?: number;
  /** 明细状态筛选：WAIT_PAY / ALL / SUCCESS / FAIL */
  detail_status?: string;
}

/**
 * 批量转账服务
 *
 * 商户可通过该产品实现同时向多个用户微信零钱进行转账的操作。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716434 (商家转账)
 */
export class TransferBatchService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 发起批量转账
   *
   * @param request - 批量转账请求参数
   * @returns 批量转账结果
   */
  async initiateBatchTransfer(
    request: InitiateBatchTransferRequest,
  ): Promise<WxPayResponse<InitiateBatchTransferResponse>> {
    return this.client.post<InitiateBatchTransferResponse>('/v3/transfer/batches', request);
  }

  /**
   * 通过微信批次单号查询批次单
   *
   * @param batchId - 微信批次单号
   * @param params - 可选查询参数
   * @returns 批次单详情
   */
  async getTransferBatchByNo(
    batchId: string,
    params?: GetTransferBatchParams,
  ): Promise<WxPayResponse<TransferBatchEntity>> {
    return this.client.get<TransferBatchEntity>(
      `/v3/transfer/batches/batch-id/${batchId}`,
      params as Record<string, unknown>,
    );
  }

  /**
   * 通过商家批次单号查询批次单
   *
   * @param outBatchNo - 商家批次单号
   * @param params - 可选查询参数
   * @returns 批次单详情
   */
  async getTransferBatchByOutNo(
    outBatchNo: string,
    params?: GetTransferBatchParams,
  ): Promise<WxPayResponse<TransferBatchEntity>> {
    return this.client.get<TransferBatchEntity>(
      `/v3/transfer/batches/out-batch-no/${outBatchNo}`,
      params as Record<string, unknown>,
    );
  }

  /**
   * 通过微信明细单号查询明细单
   *
   * @param batchId - 微信批次单号
   * @param detailId - 微信明细单号
   * @returns 明细单详情
   */
  async getTransferDetailByNo(
    batchId: string,
    detailId: string,
  ): Promise<WxPayResponse<TransferDetailEntity>> {
    return this.client.get<TransferDetailEntity>(
      `/v3/transfer/batches/batch-id/${batchId}/details/detail-id/${detailId}`,
    );
  }

  /**
   * 通过商家明细单号查询明细单
   *
   * @param outBatchNo - 商家批次单号
   * @param outDetailNo - 商家明细单号
   * @returns 明细单详情
   */
  async getTransferDetailByOutNo(
    outBatchNo: string,
    outDetailNo: string,
  ): Promise<WxPayResponse<TransferDetailEntity>> {
    return this.client.get<TransferDetailEntity>(
      `/v3/transfer/batches/out-batch-no/${outBatchNo}/details/out-detail-no/${outDetailNo}`,
    );
  }
}
