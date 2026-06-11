import type { WxPayResponse } from '../types/index.js';
import type {
  CreateProfitSharingOrderRequest,
  CreateProfitSharingOrderResponse,
  QueryProfitSharingOrderParams,
  QueryProfitSharingOrderResponse,
  CreateProfitSharingReturnOrderRequest,
  CreateProfitSharingReturnOrderResponse,
  QueryProfitSharingReturnOrderParams,
  QueryProfitSharingReturnOrderResponse,
  UnfreezeProfitSharingRequest,
  UnfreezeProfitSharingResponse,
  QueryProfitSharingAmountResponse,
  AddProfitSharingReceiverRequest,
  AddProfitSharingReceiverResponse,
  DeleteProfitSharingReceiverRequest,
  DeleteProfitSharingReceiverResponse,
  ProfitSharingBillParams,
  ProfitSharingBillResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 分账服务
 *
 * 提供微信支付分账全流程相关的 API 封装，包括：
 * - 请求分账
 * - 查询分账结果
 * - 请求分账回退
 * - 查询分账回退结果
 * - 解冻剩余资金
 * - 查询剩余待分金额
 * - 添加分账接收方
 * - 删除分账接收方
 * - 申请分账账单
 * - 下载分账账单
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012081606
 */
export class ProfitSharingService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 请求分账
   *
   * 微信订单支付成功后，商户通过此接口发起分账请求，将订单资金分给指定的接收方。
   * 此接口采用异步处理模式，受理请求后返回的结果非最终分账结果，
   * 最终分账结果需要通过查询分账结果接口获取。
   *
   * 单笔订单最多支持 50 次分账请求，每次请求最多支持 50 个接收方。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012524936
   */
  async createOrder(
    request: CreateProfitSharingOrderRequest,
  ): Promise<WxPayResponse<CreateProfitSharingOrderResponse>> {
    return this.client.post<CreateProfitSharingOrderResponse>('/v3/profitsharing/orders', request);
  }

  /**
   * 查询分账结果
   *
   * 通过商户分账单号查询分账结果。
   * 发起分账请求后，可通过此接口主动查询分账的最终处理结果。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012525210
   */
  async queryOrder(
    params: QueryProfitSharingOrderParams,
  ): Promise<WxPayResponse<QueryProfitSharingOrderResponse>> {
    return this.client.get<QueryProfitSharingOrderResponse>(
      `/v3/profitsharing/orders/${params.outOrderNo}`,
      { transaction_id: params.transactionId },
    );
  }

  /**
   * 请求分账回退
   *
   * 对已经分账成功的订单，商户可以通过此接口将分账资金从接收方回退给分账方。
   * 此接口采用同步处理模式，会实时返回处理结果。
   *
   * 注意：
   * - 单笔分账单最多支持 50 次回退
   * - 回退窗口期为 180 天
   * - 仅支持对 MERCHANT_ID 类型且分账结果为 SUCCESS 的接收方进行回退
   * - 不支持对个人接收方的回退
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012525287
   */
  async createReturnOrder(
    request: CreateProfitSharingReturnOrderRequest,
  ): Promise<WxPayResponse<CreateProfitSharingReturnOrderResponse>> {
    return this.client.post<CreateProfitSharingReturnOrderResponse>(
      '/v3/profitsharing/return-orders',
      request,
    );
  }

  /**
   * 查询分账回退结果
   *
   * 通过商户回退单号查询分账回退的处理结果。
   * 如果回退结果为 PROCESSING，请不要更换商户回退单号重复发起回退，
   * 否则会出现资金风险。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012526279
   */
  async queryReturnOrder(
    params: QueryProfitSharingReturnOrderParams,
  ): Promise<WxPayResponse<QueryProfitSharingReturnOrderResponse>> {
    return this.client.get<QueryProfitSharingReturnOrderResponse>(
      `/v3/profitsharing/return-orders/${params.outReturnNo}`,
      { out_order_no: params.outOrderNo },
    );
  }

  /**
   * 解冻剩余资金
   *
   * 将订单的金额全部解冻给本商户。
   * 适用于无需分账或分账完成后需将剩余冻结资金解冻给商户的场景。
   * 此接口采用异步处理模式。
   *
   * 注意：
   * - 当分账已完成（金额全部分完）时，无需再请求此接口
   * - 同一分账单号多次请求视为同一请求（幂等）
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012526374
   */
  async unfreeze(
    request: UnfreezeProfitSharingRequest,
  ): Promise<WxPayResponse<UnfreezeProfitSharingResponse>> {
    return this.client.post<UnfreezeProfitSharingResponse>(
      '/v3/profitsharing/orders/unfreeze',
      request,
    );
  }

  /**
   * 查询剩余待分金额
   *
   * 通过微信支付订单号查询该订单的剩余未分账金额。
   * 可用于判断是否可以继续分账以及剩余可分金额。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012457939
   */
  async queryAmount(
    transactionId: string,
  ): Promise<WxPayResponse<QueryProfitSharingAmountResponse>> {
    return this.client.get<QueryProfitSharingAmountResponse>(
      `/v3/profitsharing/transactions/${transactionId}/amounts`,
    );
  }

  /**
   * 添加分账接收方
   *
   * 商户在发起分账前，需要先通过此接口添加分账接收方。
   * 每个商户号最多添加 2 万个分账接收方。
   * 接收方全称（name 字段）需使用微信支付公钥进行 RSAES-OAEP 加密。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012528995
   */
  async addReceiver(
    request: AddProfitSharingReceiverRequest,
  ): Promise<WxPayResponse<AddProfitSharingReceiverResponse>> {
    return this.client.post<AddProfitSharingReceiverResponse>(
      '/v3/profitsharing/receivers/add',
      request,
    );
  }

  /**
   * 删除分账接收方
   *
   * 商户可以通过此接口删除已添加的分账接收方。
   * 删除后，该接收方将无法参与新的分账。
   *
   * 注意：
   * - 删除接口有频率限制，请勿频繁调用
   * - 已参与分账的接收方仍可被删除，但不会影响已完成的交易
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012529590
   */
  async deleteReceiver(
    request: DeleteProfitSharingReceiverRequest,
  ): Promise<WxPayResponse<DeleteProfitSharingReceiverResponse>> {
    return this.client.post<DeleteProfitSharingReceiverResponse>(
      '/v3/profitsharing/receivers/delete',
      request,
    );
  }

  /**
   * 申请分账账单
   *
   * 商户可通过此接口获取分账账单的下载链接。
   * 仅支持最近三个月的账单。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012529628
   */
  async bill(params: ProfitSharingBillParams): Promise<WxPayResponse<ProfitSharingBillResponse>> {
    return this.client.get<ProfitSharingBillResponse>('/v3/profitsharing/bills', params);
  }

  /**
   * 下载分账账单
   *
   * 通过申请分账账单接口返回的 download_url，以 GET 方式下载账单原始文件。
   * 下载地址 30 秒内有效，请及时下载。
   * 返回的 data 为 Buffer，可能为 GZIP 压缩格式，需要自行解压。
   *
   * @param downloadUrl - 申请分账账单返回的 download_url
   */
  async downloadBill(downloadUrl: string): Promise<WxPayResponse<Buffer>> {
    return this.client.downloadRaw(downloadUrl);
  }
}
