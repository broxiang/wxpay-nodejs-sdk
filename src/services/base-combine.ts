import type { WxPayResponse } from '../types/index.js';
import type {
  QueryCombineOrderParams,
  QueryCombineOrderResponse,
  CloseCombineOrderParams,
  CloseCombineOrderRequest,
  CreateRefundRequest,
  CreateRefundResponse,
  ApplyAbnormalRefundRequest,
  ApplyAbnormalRefundResponse,
  QueryRefundParams,
  QueryRefundResponse,
  TradeBillParams,
  TradeBillResponse,
  FundFlowBillParams,
  FundFlowBillResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 合单支付服务抽象类
 *
 * 提供所有合单支付渠道通用的查询、关闭、退款、账单等方法，避免代码重复。
 * 子类只需实现 createOrder 方法即可获得完整的合单支付服务能力。
 */
export abstract class BaseCombineService {
  protected readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 查询合单订单
   *
   * 通过合单商户订单号查询合单订单的支付状态及各子单详情。
   */
  async queryOrderById(
    params: QueryCombineOrderParams,
  ): Promise<WxPayResponse<QueryCombineOrderResponse>> {
    return this.client.get<QueryCombineOrderResponse>(
      `/v3/combine-transactions/out-trade-no/${params.combineOutTradeNo}`,
    );
  }

  /**
   * 关闭合单订单
   *
   * 对于未支付的合单订单，商户可通过此接口关闭订单。
   */
  async closeOrder(
    params: CloseCombineOrderParams,
    request: CloseCombineOrderRequest,
  ): Promise<WxPayResponse> {
    return this.client.post(
      `/v3/combine-transactions/out-trade-no/${params.combineOutTradeNo}/close`,
      request,
    );
  }

  /**
   * 申请退款
   *
   * 当子单状态为支付成功（SUCCESS）时，商户可通过此接口对子单申请退款。
   */
  async createRefund(request: CreateRefundRequest): Promise<WxPayResponse<CreateRefundResponse>> {
    return this.client.post<CreateRefundResponse>('/v3/refund/domestic/refunds', request);
  }

  /**
   * 查询退款单
   *
   * 通过商户退款单号查询退款状态。
   */
  async queryRefund(params: QueryRefundParams): Promise<WxPayResponse<QueryRefundResponse>> {
    return this.client.get<QueryRefundResponse>(
      `/v3/refund/domestic/refunds/${params.outRefundNo}`,
    );
  }

  /**
   * 申请异常退款
   *
   * 当退款状态为 ABNORMAL 时，可通过此接口发起异常退款处理。
   */
  async applyAbnormalRefund(
    refundId: string,
    request: ApplyAbnormalRefundRequest,
  ): Promise<WxPayResponse<ApplyAbnormalRefundResponse>> {
    return this.client.post<ApplyAbnormalRefundResponse>(
      `/v3/refund/domestic/refunds/${refundId}/apply-abnormal-refund`,
      request,
    );
  }

  /**
   * 申请交易账单
   *
   * 商户可通过此接口获取交易账单的下载链接。
   */
  async tradeBill(params: TradeBillParams): Promise<WxPayResponse<TradeBillResponse>> {
    return this.client.get<TradeBillResponse>('/v3/bill/tradebill', params);
  }

  /**
   * 申请资金账单
   *
   * 商户可通过此接口获取资金账单的下载链接。
   */
  async fundFlowBill(params: FundFlowBillParams): Promise<WxPayResponse<FundFlowBillResponse>> {
    return this.client.get<FundFlowBillResponse>('/v3/bill/fundflowbill', params);
  }

  /**
   * 下载账单
   *
   * 通过申请账单接口返回的 download_url，以 GET 方式下载账单原始文件。
   */
  async downloadBill(downloadUrl: string): Promise<WxPayResponse<Buffer>> {
    return this.client.downloadRaw(downloadUrl);
  }
}
