import type { WxPayResponse } from '../types/index.js';
import type {
  CreateAppCombineOrderRequest,
  CreateAppCombineOrderResponse,
} from '../types/index.js';
import { BaseCombineService } from './base-combine.js';

/**
 * APP 合单支付服务
 *
 * 提供 APP 合单支付全流程相关的 API 封装，包括：
 * - APP 合单下单（获取 prepay_id，用于通过 OpenSDK 调起支付）
 * - 查询合单订单
 * - 关闭合单订单
 * - 申请退款（基于子单）
 * - 查询退款单
 * - 申请异常退款
 * - 申请交易账单
 * - 申请资金账单
 * - 下载账单
 *
 * 合单支付允许一笔支付中包含 2-10 个子单，适用于多商户场景。
 * 各子单商户号需与合单发起方 APPID 绑定。
 *
 * APP 合单支付流程：
 * 1. 调用 createOrder 获取 prepay_id
 * 2. 使用 buildAppBridgeConfig 生成调起支付参数，通过 OpenSDK 的 sendReq 调起微信支付
 * 3. 用户支付完成后，通过回调通知或主动查询确认订单状态
 * 4. 退款时需基于子单进行退款，无法通过合单商户订单号退款
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556944 (APP 合单下单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012557006 (查询合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012577452 (关闭合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556524 (申请退款)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556587 (查询退款单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556692 (下载交易账单)
 */
export class CombineAppService extends BaseCombineService {
  /**
   * APP 合单下单
   *
   * 商户通过此接口生成 APP 合单预付单并获取 prepay_id。
   * 获取 prepay_id 后，配合 buildAppBridgeConfig 生成调起支付参数，
   * 通过微信 OpenSDK 的 sendReq 方法在商户 APP 内调起微信支付收银台。
   *
   * prepay_id 有效期为 2 小时，超过 2 小时需使用原下单参数重新请求。
   *
   * 关键约束：
   * - combine_mchid 需先申请发起合单支付权限
   * - sub_orders 中的 mchid 需先申请接收合单支付权限
   * - 合单发起方和子单参与方需绑定同一个 combine_appid
   * - combine_appid 必须为移动应用 APPID
   * - 子单数量为 2-10 笔
   * - time_expire 不能早于下单时间后 1 分钟，不能超过下单时间后 7 天
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556944
   */
  async createOrder(
    request: CreateAppCombineOrderRequest,
  ): Promise<WxPayResponse<CreateAppCombineOrderResponse>> {
    return this.client.post<CreateAppCombineOrderResponse>('/v3/combine-transactions/app', request);
  }
}
