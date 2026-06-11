/**
 * 微信支付 API 错误信息
 */
export interface WxPayErrorDetail {
  /** 错误码 */
  code: string;
  /** 错误描述 */
  message: string;
  /** 详细错误信息 */
  detail?: {
    field: string;
    value: string;
    issue: string;
    location?: string;
  }[];
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

  /**
   * 判断是否为特定错误码
   *
   * @param code - 错误码
   * @returns 是否匹配
   */
  isApiError(code: string): boolean {
    return this.detail.code === code;
  }
}

/**
 * 服务异常
 *
 * HTTP 状态码非 2xx 时抛出，包含微信支付返回的业务错误码和错误信息。
 */
export class ServiceException extends WxPayError {
  /** 微信支付业务错误码 */
  public readonly errorCode: string;
  /** 微信支付业务错误信息 */
  public readonly errorMessage: string;

  constructor(status: number, headers: Record<string, string>, detail: WxPayErrorDetail) {
    super(status, headers, detail);
    this.name = 'ServiceException';
    this.errorCode = detail.code;
    this.errorMessage = detail.message;
  }
}

/**
 * HTTP 请求异常
 *
 * 网络请求失败、超时等场景抛出。
 */
export class HttpException extends WxPayError {
  constructor(message: string, cause?: Error) {
    super(0, {}, { code: 'NETWORK_ERROR', message });
    this.name = 'HttpException';
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * 验签异常
 *
 * 应答或回调签名验证失败时抛出。
 */
export class ValidationException extends WxPayError {
  constructor(message: string) {
    super(0, {}, { code: 'SIGN_ERROR', message });
    this.name = 'ValidationException';
  }
}

/**
 * 解密异常
 *
 * AES-256-GCM 或 RSA-OAEP 解密失败时抛出。
 */
export class DecryptionException extends WxPayError {
  constructor(message: string) {
    super(0, {}, { code: 'DECRYPT_ERROR', message });
    this.name = 'DecryptionException';
  }
}

/**
 * 报文格式异常
 *
 * 响应 JSON 解析失败、Content-Type 不正确等场景抛出。
 */
export class MalformedMessageException extends WxPayError {
  constructor(message: string) {
    super(0, {}, { code: 'PARSE_ERROR', message });
    this.name = 'MalformedMessageException';
  }
}
