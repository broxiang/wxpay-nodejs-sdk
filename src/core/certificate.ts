import crypto from 'node:crypto';
import type { PlatformCertificate } from '../types/index.js';

/**
 * 微信支付平台证书管理器
 *
 * 负责平台证书的解密、缓存和获取公钥
 */
export class CertificateManager {
  /** 平台证书缓存 Map<序列号, 证书信息> */
  private certificates = new Map<string, PlatformCertificate>();

  /** API V3 密钥 */
  private readonly apiV3Key: string;

  constructor(apiV3Key: string, certificates?: PlatformCertificate[]) {
    this.apiV3Key = apiV3Key;
    if (certificates) {
      for (const cert of certificates) {
        this.certificates.set(cert.serialNo, cert);
      }
    }
  }

  /**
   * 获取证书序列号列表
   */
  get serialNos(): string[] {
    return Array.from(this.certificates.keys());
  }

  /**
   * 根据序列号获取证书公钥
   *
   * @param serialNo - 证书序列号
   * @returns PEM 格式的公钥，不存在则返回 null
   */
  getPublicKey(serialNo: string): string | null {
    const cert = this.certificates.get(serialNo);
    if (!cert) return null;

    const { ciphertext, nonce, associatedData, algorithm } = cert.encryptCertificate;

    // 如果直接传入了公钥（非加密格式），直接返回
    if (algorithm === 'RAW_PUBLIC_KEY') {
      return Buffer.from(ciphertext, 'base64').toString('utf-8');
    }

    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(this.apiV3Key, 'utf-8'),
        Buffer.from(nonce, 'utf-8'),
      );

      decipher.setAAD(Buffer.from(associatedData, 'utf-8'));
      decipher.setAuthTag(Buffer.from(ciphertext, 'base64').subarray(-16));

      const encryptedData = Buffer.from(ciphertext, 'base64').subarray(0, -16);
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf-8');
    } catch {
      return null;
    }
  }

  /**
   * 更新平台证书
   */
  updateCertificates(certificates: PlatformCertificate[]): void {
    for (const cert of certificates) {
      this.certificates.set(cert.serialNo, cert);
    }
  }

  /**
   * 直接设置证书公钥（用于已解密后的证书）
   *
   * @param serialNo - 证书序列号
   * @param publicKey - PEM 格式的公钥
   */
  setPublicKey(serialNo: string, publicKey: string): void {
    // 将公钥以加密证书的形式存储，解密时直接返回
    // 这里使用一个特殊的标记，让 getPublicKey 识别
    const cert: PlatformCertificate = {
      serialNo,
      effectiveTime: new Date().toISOString(),
      expireTime: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      encryptCertificate: {
        algorithm: 'RAW_PUBLIC_KEY',
        nonce: '',
        associatedData: '',
        ciphertext: Buffer.from(publicKey, 'utf-8').toString('base64'),
      },
    };
    this.certificates.set(serialNo, cert);
  }

  /**
   * 清空证书缓存
   */
  clear(): void {
    this.certificates.clear();
  }
}
