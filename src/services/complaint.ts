import type { WxPayResponse } from '../types/index.js';
import type {
  QueryComplaintsParams,
  QueryComplaintsResponse,
  QueryComplaintResponse,
  ComplaintNegotiationHistoryResponse,
  ReplyComplaintRequest,
  CompleteComplaintRequest,
  UpdateComplaintRefundRequest,
  ReplyImmediateServiceRequest,
  UploadComplaintImageResponse,
  ComplaintCallbackUrlRequest,
  ComplaintCallbackUrlResponse,
} from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 消费者投诉2.0 服务
 *
 * 提供微信支付消费者投诉处理全流程相关的 API 封装，包括：
 * - 主动查询：投诉单列表、投诉单详情、协商历史
 * - 商户处理：回复用户、处理完成、更新退款审批结果、即时服务回复
 * - 图片上传：上传反馈图片、获取投诉图片
 * - 回调管理：创建、查询、更新、删除投诉通知回调地址
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012533431
 */
export class ComplaintService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  // ============= 主动查询投诉信息 =============

  /**
   * 查询投诉单列表
   *
   * 商户可通过此接口查询近期的用户投诉单列表。
   * 支持按投诉时间、投诉状态筛选，支持分页查询。
   *
   * @param params - 查询参数
   * @returns 投诉单列表及分页信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012533431
   */
  async queryComplaints(
    params: QueryComplaintsParams,
  ): Promise<WxPayResponse<QueryComplaintsResponse>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      begin_date: params.begin_date,
      end_date: params.end_date,
    };
    if (params.complaint_state) {
      queryParams['complaint_state'] = params.complaint_state;
    }
    if (params.mchid) {
      queryParams['mchid'] = params.mchid;
    }
    if (params.offset !== undefined) {
      queryParams['offset'] = params.offset;
    }
    if (params.limit !== undefined) {
      queryParams['limit'] = params.limit;
    }
    return this.client.get<QueryComplaintsResponse>(
      '/v3/merchant-service/complaints-v2',
      queryParams,
    );
  }

  /**
   * 查询投诉单详情
   *
   * 通过投诉单号查询投诉单的详细信息，包括投诉人信息、
   * 投诉订单信息、投诉图片等。
   *
   * @param complaintId - 投诉单号
   * @returns 投诉单详细信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012533436
   */
  async queryComplaint(complaintId: string): Promise<WxPayResponse<QueryComplaintResponse>> {
    return this.client.get<QueryComplaintResponse>(
      `/v3/merchant-service/complaints-v2/${complaintId}`,
    );
  }

  /**
   * 查询投诉单协商历史
   *
   * 查询指定投诉单的协商历史记录，包括商户回复和用户反馈。
   *
   * @param complaintId - 投诉单号
   * @returns 协商历史记录列表
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012533439
   */
  async queryNegotiationHistory(
    complaintId: string,
  ): Promise<WxPayResponse<ComplaintNegotiationHistoryResponse>> {
    return this.client.get<ComplaintNegotiationHistoryResponse>(
      `/v3/merchant-service/complaints-v2/${complaintId}/negotiation-historys`,
    );
  }

  // ============= 商户处理用户投诉 =============

  /**
   * 回复用户
   *
   * 商户可通过此接口回复用户的投诉，回复内容会展示在协商历史中。
   *
   * @param request - 回复请求参数
   * @returns 空响应表示成功
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012467254
   */
  async replyComplaint(request: ReplyComplaintRequest): Promise<WxPayResponse> {
    const { complaint_id, ...body } = request;
    return this.client.post(`/v3/merchant-service/complaints-v2/${complaint_id}/replies`, body);
  }

  /**
   * 反馈处理完成
   *
   * 商户处理完投诉后，可通过此接口通知微信支付处理结果。
   * 调用成功后，投诉单状态变为 PROCESSED。
   *
   * @param request - 处理完成请求参数
   * @returns 空响应表示成功
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012467255
   */
  async completeComplaint(request: CompleteComplaintRequest): Promise<WxPayResponse> {
    const { complaint_id, ...body } = request;
    return this.client.post(`/v3/merchant-service/complaints-v2/${complaint_id}/complete`, body);
  }

  /**
   * 更新退款审批结果
   *
   * 当用户投诉涉及退款时，商户可通过此接口通知微信支付退款审批结果。
   * 退款审批通过后，微信支付会自动发起退款。
   *
   * @param request - 更新退款审批结果请求参数
   * @returns 空响应表示成功
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012467256
   */
  async updateRefundResult(request: UpdateComplaintRefundRequest): Promise<WxPayResponse> {
    const { complaint_id, ...body } = request;
    return this.client.post(
      `/v3/merchant-service/complaints-v2/${complaint_id}/update-refund`,
      body,
    );
  }

  /**
   * 回复需要即时服务的投诉单
   *
   * 对于需要即时服务的投诉（如投诉涉及订单退款），
   * 商户需在 2 小时内回复用户，否则平台可能介入。
   *
   * @param request - 即时服务回复请求参数
   * @returns 空响应表示成功
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4017151596
   */
  async replyImmediateService(request: ReplyImmediateServiceRequest): Promise<WxPayResponse> {
    const { complaint_id, ...body } = request;
    return this.client.post(`/v3/merchant-service/complaints-v2/${complaint_id}/replies`, body);
  }

  // ============= 商户反馈图片 =============

  /**
   * 图片上传接口
   *
   * 上传投诉处理相关的图片文件，获取 media_id 用于回复投诉。
   * 图片大小限制：≤ 2MB，格式：JPG、BMP、PNG。
   * 上传时需提供图片文件的 SHA256 哈希值。
   *
   * @param file - 图片文件 Buffer
   * @param filename - 文件名
   * @returns 上传成功后的 media_id
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012467250
   */
  async uploadImage(
    file: Buffer,
    filename: string,
  ): Promise<WxPayResponse<UploadComplaintImageResponse>> {
    return this.client.upload<UploadComplaintImageResponse>(
      '/v3/merchant-service/complaints-v2/images/upload',
      file,
      filename,
    );
  }

  /**
   * 图片请求接口
   *
   * 通过 media_id 获取投诉相关的图片文件。
   * 返回的 data 为图片文件的 Buffer。
   *
   * @param mediaId - 图片媒体文件标识
   * @returns 图片文件 Buffer
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012467251
   */
  async getImage(mediaId: string): Promise<WxPayResponse<Buffer>> {
    return this.client.downloadRaw(`/v3/merchant-service/complaints-v2/images/${mediaId}`);
  }

  // ============= 投诉通知回调地址管理 =============

  /**
   * 创建投诉通知回调地址
   *
   * 设置接收投诉通知的回调 URL。用户提交投诉、撤诉、确认处理完成时，
   * 微信支付会向此 URL 发送通知。
   *
   * @param request - 创建回调地址请求参数
   * @returns 空响应表示成功
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012458679
   */
  async createCallbackUrl(request: ComplaintCallbackUrlRequest): Promise<WxPayResponse> {
    return this.client.post('/v3/merchant-service/complaint-notifications', request);
  }

  /**
   * 查询投诉通知回调地址
   *
   * 查询当前设置的投诉通知回调 URL。
   *
   * @returns 回调地址信息
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012459014
   */
  async queryCallbackUrl(): Promise<WxPayResponse<ComplaintCallbackUrlResponse>> {
    return this.client.get<ComplaintCallbackUrlResponse>(
      '/v3/merchant-service/complaint-notifications',
    );
  }

  /**
   * 更新投诉通知回调地址
   *
   * 更新已设置的投诉通知回调 URL。
   *
   * @param request - 更新回调地址请求参数
   * @returns 空响应表示成功
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012459282
   */
  async updateCallbackUrl(request: ComplaintCallbackUrlRequest): Promise<WxPayResponse> {
    return this.client.put('/v3/merchant-service/complaint-notifications', request);
  }

  /**
   * 删除投诉通知回调地址
   *
   * 删除已设置的投诉通知回调 URL。删除后将不再接收投诉通知。
   *
   * @returns 空响应表示成功
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460452
   */
  async deleteCallbackUrl(): Promise<WxPayResponse> {
    return this.client.delete('/v3/merchant-service/complaint-notifications');
  }
}
