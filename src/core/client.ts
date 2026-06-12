import fs from 'node:fs';
import os from 'node:os';
import type { WxPayOptions, WxPayResponse, WxPayErrorDetail } from '../types/index.js';
import { SDK_VERSION } from '../version.js';
import { CertificateManager } from './certificate.js';
import {
  WxPayError,
  buildUrl,
  createRequestHeaders,
  parseResponse,
  type ResponseVerifier,
} from '../utils/http.js';
import {
  buildSignString,
  sign,
  generateNonce,
  buildAuthorization,
  verifySignature,
} from '../utils/sign.js';

/**
 * 微信支付 API V3 客户端
 *
 * @example
 * ```ts
 * const wxpay = new WxPayClient({
 *   mchid: '1900000100',
 *   apiV3Key: 'your-api-v3-key',
 *   serialNo: 'your-certificate-serial-number',
 *   privateKey: fs.readFileSync('/path/to/apiclient_key.pem'),
 * });
 * ```
 */
export class WxPayClient {
  /** 生产环境 API 主域名 */
  private static readonly PRODUCTION_BASE = 'https://api.mch.weixin.qq.com';

  /** 生产环境 API 备用域名（跨城容灾） */
  private static readonly PRODUCTION_BACKUP = 'https://api2.mch.weixin.qq.com';

  /** 沙箱环境 API 地址 */
  private static readonly SANDBOX_BASE = 'https://api.mch.weixin.qq.com/sandboxnew';

  /** 动态 User-Agent 字符串 */
  private static readonly USER_AGENT = (() => {
    const platform = os.platform();
    const arch = os.arch();
    const nodeVersion = process.version;
    return `wxpay-nodejs-sdk/${SDK_VERSION} (${platform} ${arch}) Node.js/${nodeVersion}`;
  })();

  /** 商户号 */
  public readonly mchid: string;
  private readonly apiV3Key: string;
  private readonly serialNo: string;
  private readonly privateKey: string | Buffer;
  private readonly timeout: number;
  private readonly baseUrl: string;
  private readonly backupUrl: string | null;
  private readonly enableResponseVerification: boolean;
  private readonly customFetch: typeof fetch;

  /** 平台证书管理器 */
  public readonly certificates: CertificateManager;

  constructor(options: WxPayOptions) {
    this.mchid = options.mchid;
    this.apiV3Key = options.apiV3Key;
    this.serialNo = options.serialNo;
    this.privateKey = this.resolvePrivateKey(options.privateKey);
    this.timeout = options.timeout ?? 30000;
    this.baseUrl = options.sandbox ? WxPayClient.SANDBOX_BASE : WxPayClient.PRODUCTION_BASE;
    this.backupUrl = options.sandbox ? null : WxPayClient.PRODUCTION_BACKUP;
    this.enableResponseVerification = options.enableResponseVerification ?? true;
    this.customFetch = options.customFetch ?? fetch;

    this.certificates = new CertificateManager(this.apiV3Key, options.platformCertificates);

    // 配置微信支付公钥（推荐模式）
    if (options.wxpayPublicKeyId && options.wxpayPublicKey) {
      const publicKey = this.resolvePublicKey(options.wxpayPublicKey);
      this.certificates.setWxPayPublicKey(options.wxpayPublicKeyId, publicKey);
    }
  }

  /**
   * 发起 GET 请求
   */
  async get<T = unknown>(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<WxPayResponse<T>> {
    return this.request<T>('GET', path, params);
  }

  /**
   * 发起 POST 请求
   */
  async post<T = unknown>(
    path: string,
    body?: object,
    params?: Record<string, unknown>,
    extraHeaders?: Record<string, string>,
  ): Promise<WxPayResponse<T>> {
    return this.request<T>('POST', path, params, body, extraHeaders);
  }

  /**
   * 发起 PUT 请求
   */
  async put<T = unknown>(
    path: string,
    body?: object,
    params?: Record<string, unknown>,
  ): Promise<WxPayResponse<T>> {
    return this.request<T>('PUT', path, params, body);
  }

  /**
   * 发起 PATCH 请求
   */
  async patch<T = unknown>(
    path: string,
    body?: object,
    params?: Record<string, unknown>,
  ): Promise<WxPayResponse<T>> {
    return this.request<T>('PATCH', path, params, body);
  }

  /**
   * 发起 DELETE 请求
   */
  async delete<T = unknown>(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<WxPayResponse<T>> {
    return this.request<T>('DELETE', path, params);
  }

  /**
   * 下载原始二进制文件（账单下载等场景）
   *
   * 直接请求完整的 URL（非 API 路径），返回原始响应体。
   * 用于下载账单等返回非 JSON 格式数据的场景。
   *
   * @param url - 完整的下载 URL（从申请账单接口返回的 download_url）
   * @returns 包含原始 Buffer 数据和响应头的 WxPayResponse
   */
  async downloadRaw(url: string): Promise<WxPayResponse<Buffer>> {
    const method = 'GET';
    const bodyStr = '';
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = generateNonce();

    const urlObj = new URL(url);
    const signPath = urlObj.pathname + urlObj.search;

    const signString = buildSignString({
      method,
      path: signPath,
      timestamp,
      nonce,
      body: bodyStr,
    });

    const signature = sign(signString, this.privateKey);
    const authorization = buildAuthorization(
      this.mchid,
      this.serialNo,
      timestamp,
      nonce,
      signature,
    );

    const headers: Record<string, string> = {
      Authorization: authorization,
      Accept: 'application/json',
      'User-Agent': WxPayClient.USER_AGENT,
    };

    const serial = this.certificates.getNewestSerial();
    if (serial) {
      headers['Wechatpay-Serial'] = serial;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeout);

    try {
      const response = await this.customFetch(url, {
        method,
        headers,
        signal: controller.signal,
      });

      // 下载账单的响应不包含签名，无需验签
      // 但需要处理错误响应
      if (!response.ok) {
        let errorDetail: WxPayErrorDetail;
        try {
          const data: unknown = await response.json();
          if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
            errorDetail = data as WxPayErrorDetail;
          } else {
            errorDetail = {
              code: 'HTTP_ERROR',
              message: `HTTP ${response.status}: ${response.statusText}`,
            };
          }
        } catch {
          errorDetail = {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        throw new WxPayError(response.status, {}, errorDetail);
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = Buffer.from(arrayBuffer);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        headers: responseHeaders,
        data,
      };
    } catch (error) {
      if (error instanceof WxPayError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new WxPayError(
          0,
          {},
          {
            code: 'REQUEST_TIMEOUT',
            message: `请求超时 (${this.timeout}ms)`,
          },
        );
      }
      throw new WxPayError(
        0,
        {},
        {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '网络请求失败',
        },
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 上传文件（multipart/form-data）
   *
   * 用于图片上传等需要提交文件的场景。
   * 微信支付文件上传接口要求将 meta（JSON）和 file 分别作为 form-data 的两个 part 提交，
   * 签名计算基于 meta 部分的 JSON 字符串。
   *
   * @param path - API 路径
   * @param file - 文件内容 Buffer
   * @param filename - 文件名
   * @param meta - 业务参数（作为 meta part 的 JSON 内容）
   */
  async upload<T = unknown>(
    path: string,
    file: Buffer,
    filename: string,
    meta?: Record<string, unknown>,
  ): Promise<WxPayResponse<T>> {
    const url = buildUrl(this.baseUrl, path);
    const metaStr = meta ? JSON.stringify(meta) : '{}';
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = generateNonce();

    const urlObj = new URL(url);
    const signPath = urlObj.pathname + urlObj.search;

    const signString = buildSignString({
      method: 'POST',
      path: signPath,
      timestamp,
      nonce,
      body: metaStr,
    });

    const signature = sign(signString, this.privateKey);
    const authorization = buildAuthorization(
      this.mchid,
      this.serialNo,
      timestamp,
      nonce,
      signature,
    );

    const boundary = `----WxPayNodeJSSDK${Date.now()}`;
    const crlf = '\r\n';

    const parts: Buffer[] = [];

    // meta part
    parts.push(
      Buffer.from(
        `--${boundary}${crlf}Content-Disposition: form-data; name="meta"${crlf}Content-Type: application/json${crlf}${crlf}${metaStr}${crlf}`,
      ),
    );

    // file part
    const fileHeader = Buffer.from(
      `--${boundary}${crlf}Content-Disposition: form-data; name="file"; filename="${filename}"${crlf}Content-Type: application/octet-stream${crlf}${crlf}`,
    );
    parts.push(fileHeader);
    parts.push(file);
    parts.push(Buffer.from(crlf));

    // closing boundary
    parts.push(Buffer.from(`--${boundary}--${crlf}`));

    const body = Buffer.concat(parts);

    const headers: Record<string, string> = {
      Authorization: authorization,
      Accept: 'application/json',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'User-Agent': WxPayClient.USER_AGENT,
    };

    const serial = this.certificates.getNewestSerial();
    if (serial) {
      headers['Wechatpay-Serial'] = serial;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeout);

    try {
      const response = await this.customFetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      return await parseResponse<T>(response, this.createVerifier());
    } catch (error) {
      if (error instanceof WxPayError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new WxPayError(
          0,
          {},
          {
            code: 'REQUEST_TIMEOUT',
            message: `请求超时 (${this.timeout}ms)`,
          },
        );
      }
      throw new WxPayError(
        0,
        {},
        {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '网络请求失败',
        },
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 通用 HTTP 请求方法
   *
   * 支持跨城容灾：当主域名请求失败（网络错误、超时）时，自动切换到备用域名重试。
   */
  private async request<T = unknown>(
    method: string,
    path: string,
    params?: Record<string, unknown>,
    body?: object,
    extraHeaders?: Record<string, string>,
  ): Promise<WxPayResponse<T>> {
    const bodyStr = body ? JSON.stringify(body) : '';
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = generateNonce();

    const headers = createRequestHeaders({
      authorization: '',
      wechatPaySerial: this.certificates.getNewestSerial(),
      additional: extraHeaders,
    });

    const urls = [this.baseUrl];
    if (this.backupUrl) {
      urls.push(this.backupUrl);
    }

    let lastError: unknown;

    for (const baseUrl of urls) {
      const url = buildUrl(baseUrl, path, params);
      const urlObj = new URL(url);
      const signPath = urlObj.pathname + urlObj.search;

      const signString = buildSignString({
        method: method.toUpperCase(),
        path: signPath,
        timestamp,
        nonce,
        body: bodyStr,
      });

      const signature = sign(signString, this.privateKey);
      headers['Authorization'] = buildAuthorization(
        this.mchid,
        this.serialNo,
        timestamp,
        nonce,
        signature,
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeout);

      try {
        const response = await this.customFetch(url, {
          method,
          headers,
          body: bodyStr || undefined,
          signal: controller.signal,
        });

        return await parseResponse<T>(response, this.createVerifier());
      } catch (error) {
        lastError = error;

        const isNetworkError =
          !(error instanceof WxPayError) &&
          !(error instanceof DOMException && error.name === 'AbortError');

        if (!isNetworkError || urls.indexOf(baseUrl) === urls.length - 1) {
          if (error instanceof WxPayError) throw error;
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw new WxPayError(
              0,
              {},
              {
                code: 'REQUEST_TIMEOUT',
                message: `请求超时 (${this.timeout}ms)`,
              },
            );
          }
          throw new WxPayError(
            0,
            {},
            {
              code: 'NETWORK_ERROR',
              message: error instanceof Error ? error.message : '网络请求失败',
            },
          );
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new WxPayError(
      0,
      {},
      {
        code: 'NETWORK_ERROR',
        message: lastError instanceof Error ? lastError.message : '网络请求失败',
      },
    );
  }

  /**
   * 解析私钥：支持直接传入内容或文件路径
   */
  private resolvePrivateKey(key: string | Buffer): string | Buffer {
    if (Buffer.isBuffer(key)) return key;

    // 以 PEM 格式开头，直接返回
    if (key.startsWith('-----BEGIN')) return key;

    // 否则认为是文件路径
    try {
      return fs.readFileSync(key, 'utf-8');
    } catch {
      // 如果读取失败，假定是密钥内容
      return key;
    }
  }

  /**
   * 解析公钥：支持直接传入内容或文件路径
   */
  private resolvePublicKey(key: string | Buffer): string {
    if (Buffer.isBuffer(key)) return key.toString('utf-8');

    // 以 PEM 格式开头，直接返回
    if (key.startsWith('-----BEGIN')) return key;

    // 否则认为是文件路径
    try {
      return fs.readFileSync(key, 'utf-8');
    } catch {
      return key;
    }
  }

  /**
   * 创建应答验签函数
   */
  private createVerifier(): ResponseVerifier | undefined {
    if (!this.enableResponseVerification) return undefined;

    return (
      body: string,
      signature: string,
      timestamp: string,
      nonce: string,
      serial: string,
    ): boolean => {
      const publicKey = this.certificates.getPublicKey(serial);
      if (!publicKey) {
        throw new Error(`未找到序列号为 ${serial} 的平台证书或公钥，请确保已配置`);
      }
      return verifySignature(body, signature, timestamp, nonce, publicKey);
    };
  }
}
