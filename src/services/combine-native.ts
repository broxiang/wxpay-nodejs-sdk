import type { WxPayResponse } from '../types/index.js';
import type {
  CreateNativeCombineOrderRequest,
  CreateNativeCombineOrderResponse,
} from '../types/index.js';
import { BaseCombineService } from './base-combine.js';

/**
 * Native 合单支付服务
 *
 * 提供 Native 合单支付（二维码支付）全流程相关的 API 封装，包括：
 * - Native 合单下单（获取 code_url 用于生成二维码）
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
 * Native 合单支付流程：
 * 1. 调用 createOrder 获取 code_url
 * 2. 商户前端将 code_url 转换为二维码图片展示给用户
 * 3. 用户使用微信扫一扫扫描二维码，调起微信收银台完成支付
 * 4. 用户支付完成后，通过回调通知或主动查询确认订单状态
 * 5. 退款时需基于子单进行退款，无法通过合单商户订单号退款
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556982 (Native 合单下单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421316 (查询合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421330 (关闭合单订单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421340 (申请退款)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421346 (查询退款单)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421361 (下载交易账单)
 */
export class CombineNativeService extends BaseCombineService {
  /**
   * Native 合单下单
   *
   * 商户通过此接口生成合单订单并获取二维码链接（code_url）。
   * 商户后端获取 code_url 后传递给前端，前端将其转换为二维码图片展示给用户。
   * 用户使用微信扫一扫扫描二维码后，将调起微信收银台完成支付。
   *
   * code_url 有效期为 2 小时，超过 2 小时需使用原下单参数重新请求下单接口，
   * 获取新的 code_url。
   *
   * 关键约束：
   * - combine_mchid 需先申请发起合单支付权限
   * - sub_orders 中的 mchid 需先申请接收合单支付权限
   * - 合单发起方和子单参与方需绑定同一个 combine_appid
   * - 子单数量为 2-10 笔
   * - time_expire 不能早于下单时间后 1 分钟，不能超过下单时间后 7 天
   * - 二维码不支持通过相册识别或长按识别二维码的方式完成支付
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556982
   */
  async createOrder(
    request: CreateNativeCombineOrderRequest,
  ): Promise<WxPayResponse<CreateNativeCombineOrderResponse>> {
    return this.client.post<CreateNativeCombineOrderResponse>(
      '/v3/combine-transactions/native',
      request,
    );
  }
}
