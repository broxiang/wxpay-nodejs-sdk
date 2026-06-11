import type { WxPayClient } from '../core/client.js';
import type {
  WxPayResponse,
  TradeBillParams,
  TradeBillResponse,
  FundFlowBillParams,
  FundFlowBillResponse,
  ProfitSharingBillParams,
  ProfitSharingBillResponse,
} from '../types/index.js';

/**
 * 账单下载服务
 *
 * 提供交易账单、资金账单和分账账单的申请与下载功能。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071227 申请交易账单
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071235 申请资金账单
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013071238 下载账单
 */
export class BillService {
  constructor(private readonly client: WxPayClient) {}

  /**
   * 申请交易账单
   *
   * 商户调用该接口获取交易账单的下载链接。次日 10:00 后获取前一天账单，
   * 支持三个月内的账单查询。
   *
   * @param params - 账单请求参数
   * @returns 包含 hash_type、hash_value 和 download_url 的响应
   *
   * @example
   * ```ts
   * const result = await billService.applyTradeBill({
   *   bill_date: '2024-01-15',
   *   bill_type: 'ALL',
   *   tar_type: 'GZIP',
   * });
   * console.log(result.data.download_url);
   * ```
   */
  async applyTradeBill(params: TradeBillParams): Promise<WxPayResponse<TradeBillResponse>> {
    return this.client.get<TradeBillResponse>('/v3/bill/tradebill', {
      bill_date: params.bill_date,
      bill_type: params.bill_type,
      tar_type: params.tar_type,
    });
  }

  /**
   * 申请资金账单
   *
   * 商户调用该接口获取资金账单的下载链接。次日 10:00 后获取前一天账单，
   * 支持三个月内的账单查询。
   *
   * @param params - 账单请求参数
   * @returns 包含 hash_type、hash_value 和 download_url 的响应
   *
   * @example
   * ```ts
   * const result = await billService.applyFundFlowBill({
   *   bill_date: '2024-01-15',
   *   account_type: 'BASIC',
   *   tar_type: 'GZIP',
   * });
   * console.log(result.data.download_url);
   * ```
   */
  async applyFundFlowBill(
    params: FundFlowBillParams,
  ): Promise<WxPayResponse<FundFlowBillResponse>> {
    return this.client.get<FundFlowBillResponse>('/v3/bill/fundflowbill', {
      bill_date: params.bill_date,
      account_type: params.account_type,
      tar_type: params.tar_type,
    });
  }

  /**
   * 申请分账账单
   *
   * 商户调用该接口获取分账账单的下载链接。次日 10:00 后获取前一天账单，
   * 支持三个月内的账单查询。
   *
   * @param params - 账单请求参数
   * @returns 包含 hash_type、hash_value 和 download_url 的响应
   *
   * @example
   * ```ts
   * const result = await billService.applyProfitSharingBill({
   *   bill_date: '2024-01-15',
   *   tar_type: 'GZIP',
   * });
   * console.log(result.data.download_url);
   * ```
   */
  async applyProfitSharingBill(
    params: ProfitSharingBillParams,
  ): Promise<WxPayResponse<ProfitSharingBillResponse>> {
    return this.client.get<ProfitSharingBillResponse>('/v3/bill/profitsharingbill', {
      bill_date: params.bill_date,
      tar_type: params.tar_type,
    });
  }

  /**
   * 下载账单文件
   *
   * 使用申请账单接口返回的 download_url 下载账单文件。
   * download_url 有效期为 5 分钟（分账账单为 30 秒），需及时下载。
   *
   * 下载完成后建议计算文件的 SHA1 哈希值，与申请账单接口返回的 hash_value
   * 进行比对，确保账单文件完整性。
   *
   * @param downloadUrl - 申请账单接口返回的 download_url
   * @returns 包含原始账单文件 Buffer 的响应
   *
   * @example
   * ```ts
   * // 先申请账单获取 download_url
   * const applyResult = await billService.applyTradeBill({
   *   bill_date: '2024-01-15',
   *   tar_type: 'GZIP',
   * });
   *
   * // 下载账单文件
   * const downloadResult = await billService.downloadBill(
   *   applyResult.data.download_url,
   * );
   *
   * // 验证哈希值
   * const crypto = require('crypto');
   * const fileHash = crypto
   *   .createHash('sha1')
   *   .update(downloadResult.data)
   *   .digest('hex');
   * console.log(fileHash === applyResult.data.hash_value); // true
   * ```
   */
  async downloadBill(downloadUrl: string): Promise<WxPayResponse<Buffer>> {
    return this.client.downloadRaw(downloadUrl);
  }
}
