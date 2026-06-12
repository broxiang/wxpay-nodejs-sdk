import type { WxPayResponse } from '../types/index.js';
import type {
  CreateMiniProgramCombineOrderRequest,
  CreateMiniProgramCombineOrderResponse,
} from '../types/index.js';
import { BaseCombineService } from './base-combine.js';

/**
 * 小程序合单支付服务
 *
 * 提供小程序合单支付全流程相关的 API 封装，包括：
 * - 小程序合单下单（获取 prepay_id）
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
 * 小程序合单支付流程：
 * 1. 调用 createOrder 获取 prepay_id
 * 2. 使用 buildMiniProgramBridgeConfig 生成 wx.requestPayment 调起参数
 * 3. 用户支付完成后，通过 requestPayment 回调、支付成功通知或主动查询确认订单状态
 * 4. 退款时需基于子单进行退款，无法通过合单商户订单号退款
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556931 (小程序合单下单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421401 (查询合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421404 (关闭合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421410 (申请退款)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421421 (查询退款单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421450 (下载交易账单)
 */
export class CombineMiniProgramService extends BaseCombineService {
  /**
   * 小程序合单下单
   *
   * 商户通过此接口生成小程序合单预付单并获取 prepay_id。
   * 获取 prepay_id 后，配合 buildMiniProgramBridgeConfig 生成调起支付参数，
   * 通过小程序 wx.requestPayment() 方法唤起微信支付收银台。
   *
   * prepay_id 有效期为 2 小时，超过 2 小时需使用原下单参数重新请求。
   *
   * 关键约束：
   * - combine_mchid 需先申请发起合单支付权限
   * - sub_orders 中的 mchid 需先申请接收合单支付权限
   * - 合单发起方和子单参与方需绑定同一个 combine_appid
   * - combine_appid 必须为小程序 AppID
   * - combine_payer_info.openid 在小程序场景下可选（由运行环境隐式提供）
   * - 子单数量为 2-10 笔
   * - time_expire 不能早于下单时间后 1 分钟，不能超过下单时间后 7 天
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556931
   */
  async createOrder(
    request: CreateMiniProgramCombineOrderRequest,
  ): Promise<WxPayResponse<CreateMiniProgramCombineOrderResponse>> {
    return this.client.post<CreateMiniProgramCombineOrderResponse>(
      '/v3/combine-transactions/jsapi',
      request,
    );
  }
}
