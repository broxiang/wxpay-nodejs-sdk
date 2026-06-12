import type { WxPayResponse } from '../types/index.js';
import type { CreateCombineOrderRequest, CreateCombineOrderResponse } from '../types/index.js';
import { BaseCombineService } from './base-combine.js';

/**
 * 合单支付服务
 *
 * 提供 JSAPI 合单支付全流程相关的 API 封装，包括：
 * - JSAPI 合单下单（获取 prepay_id）
 * - 查询合单订单
 * - 关闭合单订单
 * - 申请退款
 * - 查询退款
 * - 申请异常退款
 * - 申请交易账单
 * - 申请资金账单
 * - 下载账单
 *
 * 合单支付允许一笔支付中包含 2-10 个子单，适用于多商户场景。
 * 各子单商户号需与合单发起方 APPID 绑定。
 *
 * 注意：对于合单支付的订单，无法通过合单支付总单号 combine_out_trade_no 退款，
 * 只能根据单个子单的 transaction_id 或 out_trade_no 进行退款。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556926 (合单下单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421222 (查询合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421225 (关闭合单订单)
 */
export class CombineService extends BaseCombineService {
  /**
   * JSAPI 合单下单
   *
   * 商户通过此接口生成合单预付单并获取 prepay_id。
   * prepay_id 有效期为 2 小时，超过 2 小时需使用原下单参数重新请求。
   *
   * 关键约束：
   * - combine_mchid 需先申请发起合单支付权限
   * - sub_orders 中的 mchid 需先申请接收合单支付权限
   * - 合单发起方和子单参与方需绑定同一个 combine_appid
   * - 子单数量为 2-10 笔
   * - time_expire 不能早于下单时间后 1 分钟，不能超过下单时间后 7 天
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556926
   */
  async createOrder(
    request: CreateCombineOrderRequest,
  ): Promise<WxPayResponse<CreateCombineOrderResponse>> {
    return this.client.post<CreateCombineOrderResponse>('/v3/combine-transactions/jsapi', request);
  }
}
