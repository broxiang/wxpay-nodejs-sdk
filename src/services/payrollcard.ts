import type { WxPayResponse } from '../types/index.js';
import type { WxPayClient } from '../core/client.js';

/**
 * 微工卡服务
 *
 * 提供微工卡（工资卡）相关 API 封装，包括：
 * - 查询授权关系
 * - 生成预授权 token
 * - 核身预下单
 * - 查询核身结果
 * - 发起批量转账
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012711988
 */
export class PayrollCardService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 查询授权关系
   *
   * 查询商户与用户之间的微工卡授权关系。
   *
   * @param params - 查询参数
   * @returns 授权关系信息
   */
  async queryAuthorization(params: {
    sub_mchid: string;
    appid: string;
    openid: string;
  }): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get('/v3/payroll-card/relations', params);
  }

  /**
   * 生成预授权 token
   *
   * 生成微工卡预授权 token，用于后续核身操作。
   *
   * @param request - 预授权请求参数
   * @returns 预授权 token 信息
   */
  async createToken(request: {
    sub_mchid: string;
    appid: string;
    openid: string;
    out_request_no: string;
  }): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/payroll-card/tokens', request);
  }

  /**
   * 核身预下单
   *
   * 创建核身预下单，获取核身参数。
   *
   * @param request - 核身预下单请求参数
   * @returns 核身参数信息
   */
  async createAuthentication(request: {
    sub_mchid: string;
    appid: string;
    openid: string;
    out_request_no: string;
    token: string;
    scene: string;
  }): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/payroll-card/authentications', request);
  }

  /**
   * 查询核身结果
   *
   * 根据商户请求号查询核身结果。
   *
   * @param outRequestNo - 商户请求号
   * @param params - 查询参数
   * @returns 核身结果信息
   */
  async queryAuthentication(
    outRequestNo: string,
    params: { sub_mchid: string },
  ): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.get(
      `/v3/payroll-card/authentications/out-request-no/${outRequestNo}`,
      params,
    );
  }

  /**
   * 发起批量转账
   *
   * 通过工资卡渠道发起批量转账。
   *
   * @param request - 批量转账请求参数
   * @returns 批量转账结果
   */
  async createTransferBatch(request: {
    sub_mchid: string;
    appid: string;
    out_batch_no: string;
    batch_name: string;
    batch_remark: string;
    total_amount: number;
    total_num: number;
    transfer_detail_list: {
      out_detail_no: string;
      transfer_amount: number;
      transfer_remark: string;
      openid: string;
      user_name?: string;
    }[];
  }): Promise<WxPayResponse<Record<string, unknown>>> {
    return this.client.post('/v3/payroll-card/transfer-batches', request);
  }
}
