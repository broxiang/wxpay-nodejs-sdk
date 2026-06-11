import type { WxPayResponse, WxPayErrorDetail } from '../types/index.js';

/**
 * 微信支付 API V3 自定义错误类
 */
export class WxPayError extends Error {
  /** HTTP 状态码 */
  public readonly status: number;
  /** 错误响应头 */
  public readonly headers: Record<string, string>;
  /** 错误详情 */
  public readonly detail: WxPayErrorDetail;

  constructor(status: number, headers: Record<string, string>, detail: WxPayErrorDetail) {
    super(`[${detail.code}] ${detail.message}`);
    this.name = 'WxPayError';
    this.status = status;
    this.headers = headers;
    this.detail = detail;
  }

  /** 是否为客户端错误 (4xx) */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** 是否为服务端错误 (5xx) */
  get isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}

/**
 * 构建完整的请求 URL
 */
export function buildUrl(base: string, path: string, params?: Record<string, unknown>): string {
  const url = new URL(path, base);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // searchParams.append 内部会调用 toString，此处显式转换是安全的
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * 从微信支付响应头中提取关键信息
 */
export function parseResponseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  const keys = [
    'wechatpay-serial',
    'wechatpay-signature',
    'wechatpay-timestamp',
    'wechatpay-nonce',
    'request-id',
  ];

  for (const key of keys) {
    const value = headers.get(key);
    if (value) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * 创建 HTTP 请求头
 */
export function createRequestHeaders(options: {
  authorization: string;
  accept?: string;
  contentType?: string;
  additional?: Record<string, string>;
}): Record<string, string> {
  return {
    Authorization: options.authorization,
    Accept: options.accept ?? 'application/json',
    'Content-Type': options.contentType ?? 'application/json',
    'User-Agent': 'wxpay-nodejs-sdk/0.1.0',
    ...options.additional,
  };
}

/**
 * 将 JSON 对象转换为微信支付 API 所需的格式
 */
export function toWxPayBody(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}

/**
 * 微信支付应答验签函数类型
 *
 * @param body - 原始响应体字符串
 * @param signature - Wechatpay-Signature 头的值
 * @param timestamp - Wechatpay-Timestamp 头的值
 * @param nonce - Wechatpay-Nonce 头的值
 * @param serial - Wechatpay-Serial 头的值（证书序列号或公钥ID）
 * @returns 验签是否通过
 */
export type ResponseVerifier = (
  body: string,
  signature: string,
  timestamp: string,
  nonce: string,
  serial: string,
) => boolean;

/**
 * 解析微信支付 API 的 JSON 响应
 *
 * @param response - Fetch Response 对象
 * @param verify - 可选的验签函数，传入时将验证应答签名
 */
export async function parseResponse<T>(
  response: Response,
  verify?: ResponseVerifier,
): Promise<WxPayResponse<T>> {
  const headers = parseResponseHeaders(response.headers);

  const rawBody = await response.text();

  if (!response.ok) {
    let errorDetail: WxPayErrorDetail;
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (parsed && typeof parsed === 'object' && 'code' in parsed && 'message' in parsed) {
        errorDetail = parsed as WxPayErrorDetail;
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
    throw new WxPayError(response.status, headers, errorDetail);
  }

  if (verify) {
    const signature = headers['wechatpay-signature'];
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const serial = headers['wechatpay-serial'];

    if (signature && timestamp && nonce && serial) {
      const valid = verify(rawBody, signature, timestamp, nonce, serial);
      if (!valid) {
        throw new WxPayError(response.status, headers, {
          code: 'SIGN_ERROR',
          message: '应答签名验证失败',
        });
      }
    }
  }

  let data: T;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (parsed === null || parsed === undefined || typeof parsed !== 'object') {
      throw new Error('响应数据格式错误');
    }
    data = parsed as T;
  } catch (error) {
    throw new WxPayError(response.status, headers, {
      code: 'PARSE_ERROR',
      message: error instanceof Error ? error.message : '响应数据解析失败',
    });
  }

  return {
    status: response.status,
    headers,
    data,
  };
}
