import type { WxPayResponse } from '../types/index.js';
import type {
  QueryOrderParams,
  QueryOrderResponse,
  CloseOrderRequest,
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
 * 基础支付服务抽象类
 *
 * 提供所有支付渠道通用的查询、退款、账单等方法，避免代码重复。
 * 子类只需实现 createOrder 方法即可获得完整的支付服务能力。
 */
export abstract class BasePaymentService {
  protected readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 查询订单
   *
   * 支持通过微信支付订单号或商户订单号查询订单状态。
   */
  async queryOrderById(params: QueryOrderParams): Promise<WxPayResponse<QueryOrderResponse>> {
    if (params.transactionId) {
      return this.queryOrderByTransactionId(params.transactionId);
    }
    if (params.outTradeNo) {
      return this.queryOrderByOutTradeNo(params.outTradeNo);
    }
    throw new Error('outTradeNo 或 transactionId 必须提供其中一个');
  }

  /**
   * 通过商户订单号查询订单
   */
  async queryOrderByOutTradeNo(outTradeNo: string): Promise<WxPayResponse<QueryOrderResponse>> {
    return this.client.get<QueryOrderResponse>(`/v3/pay/transactions/out-trade-no/${outTradeNo}`, {
      mchid: this.client.mchid,
    });
  }

  /**
   * 通过微信支付订单号查询订单
   */
  async queryOrderByTransactionId(
    transactionId: string,
  ): Promise<WxPayResponse<QueryOrderResponse>> {
    return this.client.get<QueryOrderResponse>(`/v3/pay/transactions/id/${transactionId}`, {
      mchid: this.client.mchid,
    });
  }

  /**
   * 关闭订单
   *
   * 对于未支付的订单，商户可通过此接口关闭订单。
   */
  async closeOrder(outTradeNo: string, request: CloseOrderRequest): Promise<WxPayResponse> {
    return this.client.post(`/v3/pay/transactions/out-trade-no/${outTradeNo}/close`, request);
  }

  /**
   * 申请退款
   *
   * 当订单状态为支付成功（SUCCESS）时，商户可通过此接口申请退款。
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
