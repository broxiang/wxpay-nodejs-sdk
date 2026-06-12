import crypto from 'node:crypto';
import type { PlatformCertificate } from '../types/index.js';

/**
 * 自动更新配置选项
 */
export interface AutoUpdateOptions {
  /** 更新间隔（毫秒），默认 60 分钟 */
  intervalMs?: number;
  /** 更新失败时的回调 */
  onError?: (error: Error) => void;
  /** 更新成功时的回调 */
  onSuccess?: (serialNos: string[]) => void;
}

/**
 * 微信支付平台证书管理器
 *
 * 支持两种验签模式：
 * - 微信支付公钥模式（推荐）：通过 wxpayPublicKey 配置微信支付公钥
 * - 平台证书模式：通过 platformCertificates 配置平台证书
 *
 * 负责平台证书的解密、缓存和获取公钥
 */
export class CertificateManager {
  /** 平台证书缓存 Map<序列号, 证书信息> */
  private certificates = new Map<string, PlatformCertificate>();

  /** 微信支付公钥（PEM 格式），支持公钥模式 */
  private wxpayPublicKey: string | null = null;

  /** 微信支付公钥ID */
  private wxpayPublicKeyId: string | null = null;

  /** API V3 密钥 */
  private readonly apiV3Key: string;

  /** 自动更新定时器 */
  private autoUpdateTimer: ReturnType<typeof setInterval> | null = null;

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
   * 获取最新的证书序列号或公钥ID
   *
   * 优先返回微信支付公钥ID（公钥模式），否则返回第一个平台证书序列号。
   * 用于设置请求头 Wechatpay-Serial，告知微信支付客户端支持验签的证书。
   *
   * @returns 序列号字符串，无配置时返回 undefined
   */
  getNewestSerial(): string | undefined {
    if (this.wxpayPublicKeyId) {
      return this.wxpayPublicKeyId;
    }
    const keys = Array.from(this.certificates.keys());
    return keys.length > 0 ? keys[0] : undefined;
  }

  /**
   * 设置微信支付公钥（公钥模式）
   *
   * @param publicKeyId - 微信支付公钥ID（从商户平台获取）
   * @param publicKey - PEM 格式的微信支付公钥
   */
  setWxPayPublicKey(publicKeyId: string, publicKey: string): void {
    this.wxpayPublicKeyId = publicKeyId;
    this.wxpayPublicKey = publicKey;
  }

  /**
   * 获取用于验签的公钥
   *
   * 优先返回微信支付公钥（公钥模式），否则根据证书序列号查找平台证书。
   * 在组合模式下，如果证书未找到，会回退到微信支付公钥。
   *
   * @param serialNo - 证书序列号或公钥ID
   * @returns PEM 格式的公钥，不存在则返回 null
   */
  getPublicKey(serialNo: string): string | null {
    // 公钥模式：如果配置了微信支付公钥且序列号匹配
    if (this.wxpayPublicKey && this.wxpayPublicKeyId === serialNo) {
      return this.wxpayPublicKey;
    }

    // 公钥模式：如果配置了微信支付公钥且序列号以 PUB_KEY_ID_ 开头
    if (this.wxpayPublicKey && serialNo.startsWith('PUB_KEY_ID_')) {
      return this.wxpayPublicKey;
    }

    const cert = this.certificates.get(serialNo);
    if (!cert) {
      // 组合模式：证书未找到时，尝试用公钥（用于平台证书→公钥迁移期间）
      if (this.wxpayPublicKey) {
        return this.wxpayPublicKey;
      }
      return null;
    }

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
   * 判断当前是否为组合验签模式
   *
   * 当同时配置了微信支付公钥和平台证书时，返回 true。
   * 组合模式用于平台证书→微信支付公钥的灰度迁移期间。
   *
   * @returns 是否为组合模式
   */
  isCombinedMode(): boolean {
    return this.wxpayPublicKey !== null && this.certificates.size > 0;
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
    this.wxpayPublicKey = null;
    this.wxpayPublicKeyId = null;
  }

  /**
   * 启动自动更新
   *
   * 定期调用更新函数刷新平台证书。适用于生产环境的证书自动维护。
   *
   * @param updateFn - 证书更新函数，返回最新的证书 Map
   * @param options - 自动更新配置选项
   * @returns 停止更新的函数
   *
   * @example
   * ```ts
   * const manager = new CertificateManager(apiV3Key);
   * const stop = manager.startAutoUpdate(
   *   async () => {
   *     const certs = await downloadCertificates();
   *     return certs;
   *   },
   *   { intervalMs: 60 * 60 * 1000 }
   * );
   * // 稍后停止
   * stop();
   * ```
   */
  startAutoUpdate(
    updateFn: () => Promise<Map<string, string>>,
    options?: AutoUpdateOptions,
  ): () => void {
    const intervalMs = options?.intervalMs ?? 60 * 60 * 1000;

    this.stopAutoUpdate();

    const doUpdate = async () => {
      try {
        const certs = await updateFn();
        for (const [serialNo, publicKey] of certs) {
          this.setPublicKey(serialNo, publicKey);
        }
        options?.onSuccess?.(Array.from(certs.keys()));
      } catch (error) {
        options?.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    void doUpdate();

    this.autoUpdateTimer = setInterval(() => {
      void doUpdate();
    }, intervalMs);

    return () => {
      this.stopAutoUpdate();
    };
  }

  /**
   * 停止自动更新
   */
  stopAutoUpdate(): void {
    if (this.autoUpdateTimer) {
      clearInterval(this.autoUpdateTimer);
      this.autoUpdateTimer = null;
    }
  }
}
