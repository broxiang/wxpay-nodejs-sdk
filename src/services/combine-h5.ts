import type { WxPayResponse } from '../types/index.js';
import type { CreateH5CombineOrderRequest, CreateH5CombineOrderResponse } from '../types/index.js';
import { BaseCombineService } from './base-combine.js';

/**
 * H5 合单支付服务
 *
 * 提供 H5 合单支付全流程相关的 API 封装，包括：
 * - H5 合单下单（获取 h5_url 用于跳转支付中间页）
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
 * H5 合单支付流程：
 * 1. 调用 createOrder 获取 h5_url
 * 2. 在已配置 H5 支付域名的网页中跳转 h5_url 唤起微信支付收银台
 * 3. 用户支付完成后，通过回调通知或主动查询确认订单状态
 * 4. 退款时需基于子单进行退款，无法通过合单商户订单号退款
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556961 (H5 合单下单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421126 (查询合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421130 (关闭合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421148 (合单退款)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421156 (查询退款单)
 */
export class CombineH5Service extends BaseCombineService {
  /**
   * H5 合单下单
   *
   * 商户通过此接口生成 H5 合单支付链接（h5_url），用于在已配置 H5 支付域名的
   * 网页中跳转并唤起微信支付收银台。h5_url 有效期为 5 分钟，过期后需使用
   * 原下单参数重新请求。
   *
   * 关键约束：
   * - combine_mchid 需先申请发起合单支付权限
   * - sub_orders 中的 mchid 需先申请接收合单支付权限
   * - 合单发起方和子单参与方需绑定同一个 combine_appid
   * - 子单数量为 2-10 笔
   * - scene_info.payer_client_ip 需传真实的用户端 IP
   * - scene_info.h5_info 必填，需指定 type 为 Wap/iOS/Android 之一
   * - time_expire 不能早于下单时间后 1 分钟，不能超过下单时间后 7 天
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556961
   */
  async createOrder(
    request: CreateH5CombineOrderRequest,
  ): Promise<WxPayResponse<CreateH5CombineOrderResponse>> {
    return this.client.post<CreateH5CombineOrderResponse>('/v3/combine-transactions/h5', request);
  }
}
