import crypto from 'node:crypto';
import type { WxPayResponse, PlatformCertificate } from '../types/index.js';
import type { WxPayClient } from '../core/client.js';
import { CertificateManager } from '../core/certificate.js';

/**
 * 平台证书下载响应（原始 API 返回格式）
 */
interface DownloadCertificatesApiResponse {
  data: PlatformCertificate[];
}

/**
 * 解密后的平台证书信息
 */
export interface DecryptedCertificate {
  /** 证书序列号 */
  serialNo: string;
  /** 证书生效时间 */
  effectiveTime: string;
  /** 证书过期时间 */
  expireTime: string;
  /** PEM 格式的证书内容 */
  certificatePem: string;
}

/**
 * 微信支付平台证书服务
 *
 * 提供平台证书的下载和管理功能，支持：
 * - 调用 /v3/certificates 接口下载平台证书列表
 * - 使用 APIv3 密钥解密证书内容
 * - 与 CertificateManager 集成更新本地证书缓存
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012551764
 */
export class CertificateService {
  private readonly client: WxPayClient;
  private readonly apiV3Key: string;
  private readonly certificateManager: CertificateManager;

  constructor(client: WxPayClient, apiV3Key: string, certificateManager: CertificateManager) {
    this.client = client;
    this.apiV3Key = apiV3Key;
    this.certificateManager = certificateManager;
  }

  /**
   * 下载平台证书列表
   *
   * 调用微信支付 /v3/certificates 接口获取当前可用的平台证书。
   * 返回的证书内容已解密为 PEM 格式。
   *
   * @returns 解密后的平台证书列表
   */
  async downloadCertificates(): Promise<WxPayResponse<DecryptedCertificate[]>> {
    const response = await this.client.get<DownloadCertificatesApiResponse>('/v3/certificates');

    const decryptedCerts: DecryptedCertificate[] = response.data.data.map((cert) => {
      const pem = this.decryptCertificate(cert.encryptCertificate);
      return {
        serialNo: cert.serialNo,
        effectiveTime: cert.effectiveTime,
        expireTime: cert.expireTime,
        certificatePem: pem,
      };
    });

    return {
      status: response.status,
      headers: response.headers,
      data: decryptedCerts,
    };
  }

  /**
   * 下载并更新本地平台证书缓存
   *
   * 下载最新的平台证书列表，解密后自动更新 CertificateManager 中的缓存。
   * 适用于定时更新证书的场景。
   *
   * @returns 更新后的证书列表
   */
  async downloadAndUpdate(): Promise<DecryptedCertificate[]> {
    const response = await this.downloadCertificates();

    for (const cert of response.data) {
      this.certificateManager.setPublicKey(cert.serialNo, cert.certificatePem);
    }

    return response.data;
  }

  /**
   * 使用 AES-256-GCM 解密证书内容
   *
   * @param encrypted - 加密的证书信息
   * @returns PEM 格式的证书内容
   */
  private decryptCertificate(encrypted: PlatformCertificate['encryptCertificate']): string {
    const key = Buffer.from(this.apiV3Key, 'utf-8');
    const nonce = Buffer.from(encrypted.nonce, 'utf-8');
    const aad = Buffer.from(encrypted.associatedData, 'utf-8');
    const ciphertextBuffer = Buffer.from(encrypted.ciphertext, 'base64');

    const authTag = ciphertextBuffer.subarray(-16);
    const encryptedData = ciphertextBuffer.subarray(0, -16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(authTag);
    decipher.setAAD(aad);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString('utf-8');
  }
}
