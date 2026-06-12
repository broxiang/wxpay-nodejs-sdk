import type { WxPayResponse } from '../types/index.js';
import type {
  CreateAppOrderRequest,
  CreateAppOrderResponse,
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
  AppBridgeConfig,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';
import { buildAppBridgeConfig } from './bridge.js';

/**
 * APP 支付服务
 *
 * 提供 APP 支付全流程相关的 API 封装，包括：
 * - APP 下单
 * - 查询订单
 * - 关闭订单
 * - 申请退款
 * - 查询退款
 * - 申请异常退款
 * - 申请交易账单
 * - 申请资金账单
 * - 下载账单
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070347
 */
export class AppService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * APP 支付下单
   *
   * 商户通过此接口生成预付单并获取 prepay_id。
   * prepay_id 有效期为 2 小时，超过 2 小时需使用原下单参数重新请求。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070347
   */
  async createOrder(
    request: CreateAppOrderRequest,
  ): Promise<WxPayResponse<CreateAppOrderResponse>> {
    return this.client.post<CreateAppOrderResponse>('/v3/pay/transactions/app', request);
  }

  /**
   * 查询订单
   *
   * 支持通过微信支付订单号或商户订单号查询订单状态。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070354 (微信支付订单号查询订单)
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070356 (商户订单号查询订单)
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

  async queryOrderByOutTradeNo(outTradeNo: string): Promise<WxPayResponse<QueryOrderResponse>> {
    return this.client.get<QueryOrderResponse>(`/v3/pay/transactions/out-trade-no/${outTradeNo}`, {
      mchid: this.client.mchid,
    });
  }

  async queryOrderByTransactionId(
    transactionId: string,
  ): Promise<WxPayResponse<QueryOrderResponse>> {
    return this.client.get<QueryOrderResponse>(`/v3/pay/transactions/id/${transactionId}`, {
      mchid: this.client.mchid,
    });
  }

  async prepayWithRequestPayment(
    request: CreateAppOrderRequest,
    privateKey: string | Buffer,
  ): Promise<WxPayResponse<CreateAppOrderResponse> & { bridgeConfig: AppBridgeConfig }> {
    const response = await this.createOrder(request);
    const bridgeConfig = buildAppBridgeConfig(
      request.appid,
      this.client.mchid,
      response.data.prepay_id,
      privateKey,
    );
    return { ...response, bridgeConfig };
  }

  /**
   * 关闭订单
   *
   * 对于未支付的订单，商户可通过此接口关闭订单。
   * 关单后，订单状态从未支付（NOTPAY）流转为已关闭（CLOSED）。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070360
   */
  async closeOrder(outTradeNo: string, request: CloseOrderRequest): Promise<WxPayResponse> {
    return this.client.post(`/v3/pay/transactions/out-trade-no/${outTradeNo}/close`, request);
  }

  /**
   * 申请退款
   *
   * 当订单状态为支付成功（SUCCESS）时，商户可通过此接口申请退款。
   * 仅支持支付成功后 1 年内的订单。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070371
   */
  async createRefund(request: CreateRefundRequest): Promise<WxPayResponse<CreateRefundResponse>> {
    return this.client.post<CreateRefundResponse>('/v3/refund/domestic/refunds', request);
  }

  /**
   * 查询退款单
   *
   * 通过商户退款单号查询退款状态。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070374
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
   * 支持退款至用户银行卡或退款至交易商户银行账户两种方式。
   *
   * @param refundId - 微信支付退款单号
   * @param request - 异常退款请求参数
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070379
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
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070395
   */
  async tradeBill(params: TradeBillParams): Promise<WxPayResponse<TradeBillResponse>> {
    return this.client.get<TradeBillResponse>('/v3/bill/tradebill', params);
  }

  /**
   * 申请资金账单
   *
   * 商户可通过此接口获取资金账单的下载链接。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070400
   */
  async fundFlowBill(params: FundFlowBillParams): Promise<WxPayResponse<FundFlowBillResponse>> {
    return this.client.get<FundFlowBillResponse>('/v3/bill/fundflowbill', params);
  }

  /**
   * 下载账单
   *
   * 通过申请账单接口返回的 download_url，以 GET 方式下载账单原始文件。
   * 下载地址 5 分钟内有效，请及时下载。
   * 返回的 data 为 Buffer，可能为 GZIP 压缩格式，需要自行解压。
   *
   * @param downloadUrl - 申请账单返回的 download_url
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070401
   */
  async downloadBill(downloadUrl: string): Promise<WxPayResponse<Buffer>> {
    return this.client.downloadRaw(downloadUrl);
  }
}
