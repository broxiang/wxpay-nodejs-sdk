import type { WxPayResponse, WxPayErrorDetail } from '../types/index.js';

/**
 * 类型安全的 JSON 解析结果
 */
interface JsonParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 安全地解析 JSON 响应
 *
 * 在运行时验证解析结果的基本结构，避免将 null/undefined 误认为有效数据。
 *
 * @param response - Fetch API 的 Response 对象
 * @returns 解析结果，包含成功状态和数据或错误信息
 */
async function safeParseJson<T>(response: Response): Promise<JsonParseResult<T>> {
  try {
    const data: unknown = await response.json();

    // 基本验证：确保返回的是对象或数组
    if (data === null || data === undefined) {
      return { success: false, error: '响应数据为空' };
    }

    if (typeof data !== 'object') {
      return { success: false, error: `响应数据类型错误: ${typeof data}` };
    }

    return { success: true, data: data as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'JSON 解析失败',
    };
  }
}

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
 * 解析微信支付 API 的 JSON 响应
 */
export async function parseResponse<T>(response: Response): Promise<WxPayResponse<T>> {
  const headers = parseResponseHeaders(response.headers);

  if (!response.ok) {
    let errorDetail: WxPayErrorDetail;
    const errorResult = await safeParseJson<WxPayErrorDetail>(response);

    if (errorResult.success && errorResult.data) {
      errorDetail = errorResult.data;
    } else {
      errorDetail = {
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    throw new WxPayError(response.status, headers, errorDetail);
  }

  const result = await safeParseJson<T>(response);

  if (!result.success || !result.data) {
    throw new WxPayError(response.status, headers, {
      code: 'PARSE_ERROR',
      message: result.error ?? '响应数据解析失败',
    });
  }

  return {
    status: response.status,
    headers,
    data: result.data,
  };
}
