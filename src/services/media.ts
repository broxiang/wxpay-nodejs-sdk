import type { WxPayResponse } from '../types/index.js';
import type { UploadMarketingImageResponse } from '../types/index.js';
import { WxPayClient } from '../core/client.js';

/**
 * 媒体文件上传服务
 *
 * 提供营销专用图片上传 API 封装。
 * 上传的图片可用于支付有礼、代金券等营销活动。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012286130
 */
export class MediaService {
  private readonly client: WxPayClient;

  constructor(client: WxPayClient) {
    this.client = client;
  }

  /**
   * 营销专用图片上传
   *
   * 上传图片文件至微信支付，获取 media_id 用于营销活动（如支付有礼、代金券等）。
   * 图片大小限制：≤ 2MB，格式：JPG、BMP、PNG、JPEG。
   *
   * @param file - 图片文件 Buffer
   * @param filename - 文件名（需包含扩展名，如 image.jpg）
   * @returns 上传成功后的 media_id
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012286130
   */
  async uploadImage(
    file: Buffer,
    filename: string,
  ): Promise<WxPayResponse<UploadMarketingImageResponse>> {
    return this.client.upload<UploadMarketingImageResponse>(
      '/v3/merchant/media/upload',
      file,
      filename,
      { type: 'image' },
    );
  }
}
