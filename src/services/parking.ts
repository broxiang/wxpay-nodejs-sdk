import type { WxPayResponse } from '../types/index.js';
import type {
  CreateParkingRequest,
  CreateParkingResponse,
  QueryPlateServiceParams,
  QueryPlateServiceResponse,
  CreateParkingTransactionRequest,
  CreateParkingTransactionResponse,
  QueryParkingOrderResponse,
  ApplyParkingRefundRequest,
  ApplyParkingRefundResponse,
  QueryParkingRefundResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 微信支付分停车服务
 *
 * 提供微信支付分停车服务全流程相关的 API 封装，包括：
 * - 创建停车入场
 * - 查询车牌服务开通信息
 * - 扣费受理
 * - 查询停车订单
 * - 申请退款
 * - 查询退款
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012077223
 */
export class ParkingService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 创建停车入场
   *
   * 用户入场时调用此接口创建停车入场信息。
   * 根据返回的车牌状态判断用户是否开通支付分停车服务：
   * - state 为 NORMAL：正常，可使用支付分停车服务
   * - state 为 BLOCKED：不可用，通过 block_reason 获取具体原因
   *
   * @param request - 创建停车入场请求参数
   * @returns 停车入场信息，包含入场ID和车牌状态
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012533937
   */
  async createEntry(request: CreateParkingRequest): Promise<WxPayResponse<CreateParkingResponse>> {
    return this.client.post<CreateParkingResponse>('/v3/vehicle/parking/parkings', request);
  }

  /**
   * 查询车牌服务开通信息
   *
   * 查询用户是否开通微信支付分停车服务。
   * 用于在用户未收到入场状态变更通知时，主动确认车牌服务开通状态。
   *
   * @param params - 查询参数，包含appid、车牌号、用户openid和车牌颜色
   * @returns 车牌服务开通信息，包含开通状态和开通时间
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534043
   */
  async queryPlateService(
    params: QueryPlateServiceParams,
  ): Promise<WxPayResponse<QueryPlateServiceResponse>> {
    return this.client.get<QueryPlateServiceResponse>('/v3/vehicle/parking/services/find', {
      appid: params.appid,
      plate_number: params.plate_number,
      openid: params.openid,
      plate_color: params.plate_color,
    });
  }

  /**
   * 扣费受理
   *
   * 用户离场时调用此接口完成订单受理，微信支付进行异步扣款。
   *
   * **重要**：必须确认接口返回的交易状态为 "ACCEPTED" 才能放行车辆。
   * 若未接收到该状态而放行车辆离场，造成的资金损失由商户侧自行承担。
   *
   * @param request - 扣费受理请求参数
   * @returns 扣费受理结果，包含交易状态
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534352
   */
  async createTransaction(
    request: CreateParkingTransactionRequest,
  ): Promise<WxPayResponse<CreateParkingTransactionResponse>> {
    return this.client.post<CreateParkingTransactionResponse>(
      '/v3/vehicle/transactions/parking',
      request,
    );
  }

  /**
   * 查询停车订单
   *
   * 通过商户订单号查询停车扣费订单状态和详情。
   * 如果在所有通知频率后没有收到微信侧回调，商户应调用此接口确认订单状态。
   *
   * @param outTradeNo - 商户系统内部订单号
   * @returns 停车订单信息，包含交易状态和支付详情
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534308
   */
  async queryTransaction(outTradeNo: string): Promise<WxPayResponse<QueryParkingOrderResponse>> {
    return this.client.get<QueryParkingOrderResponse>(
      `/v3/vehicle/transactions/out-trade-no/${outTradeNo}`,
    );
  }

  /**
   * 申请停车退款
   *
   * 交易时间超过一年的订单无法提交退款。
   * 微信支付退款支持单笔交易分多次退款（不超过50次），多次退款需要提交原支付订单的商户订单号和设置不同的退款单号。
   * 申请退款总金额不能超过订单金额。
   * 一笔退款失败后重新提交，请不要更换退款单号，请使用原商户退款单号。
   *
   * **注意**：申请退款接口的返回仅代表业务的受理情况，具体退款是否成功，需要通过查询退款接口获取结果。
   *
   * @param request - 申请退款请求参数
   * @returns 退款受理结果
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012557131
   */
  async applyRefund(
    request: ApplyParkingRefundRequest,
  ): Promise<WxPayResponse<ApplyParkingRefundResponse>> {
    return this.client.post<ApplyParkingRefundResponse>('/v3/refund/domestic/refunds', request);
  }

  /**
   * 查询单笔退款
   *
   * 通过商户退款单号查询退款状态和详情。
   * 提交退款申请后，建议每分钟查询一次退款状态；超过5分钟仍为处理中时，逐步衰减查询频率。
   *
   * @param outRefundNo - 商户退款单号
   * @returns 退款详细信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012557161
   */
  async queryRefund(outRefundNo: string): Promise<WxPayResponse<QueryParkingRefundResponse>> {
    return this.client.get<QueryParkingRefundResponse>(
      `/v3/refund/domestic/refunds/${outRefundNo}`,
    );
  }
}
