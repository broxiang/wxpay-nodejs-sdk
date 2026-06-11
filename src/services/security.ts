import type { WxPayResponse } from '../types/index.js';
import type { EchoTestRequest, EchoTestResponse } from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 微信支付安全服务
 *
 * 提供微信支付公钥签名验签/加解密测试接口封装。
 * 用于验证商户与微信支付之间的签名验签和加解密能力是否正常。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4014551946
 */
export class SecurityService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 签名验签/加解密测试
   *
   * 用于测试商户的签名、验签、加密、解密能力。
   * 请求中 echo_message 会原样返回，encrypted_echo_message 经加密后返回。
   * 如传入 notify_url，微信支付会在测试成功后向该地址发送回调通知。
   *
   * @param request - 测试请求参数
   * @returns 测试结果，包含回显信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4014551946
   */
  async echoTest(request: EchoTestRequest): Promise<WxPayResponse<EchoTestResponse>> {
    return this.client.post<EchoTestResponse>('/v3/security/echo', request);
  }
}
