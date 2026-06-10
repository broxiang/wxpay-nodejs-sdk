import { describe, it, expect } from 'vitest';
import {
  WxPayError,
  buildUrl,
  parseResponseHeaders,
  createRequestHeaders,
  toWxPayBody,
} from '../../src/utils/http';

describe('WxPayError', () => {
  it('should create error with status and detail', () => {
    const error = new WxPayError(400, {}, {
      code: 'INVALID_REQUEST',
      message: '参数错误',
    });

    expect(error.name).toBe('WxPayError');
    expect(error.status).toBe(400);
    expect(error.message).toBe('[INVALID_REQUEST] 参数错误');
    expect(error.detail.code).toBe('INVALID_REQUEST');
    expect(error.detail.message).toBe('参数错误');
  });

  it('should identify client error (4xx)', () => {
    const error400 = new WxPayError(400, {}, { code: 'ERR', message: 'err' });
    const error404 = new WxPayError(404, {}, { code: 'ERR', message: 'err' });
    const error499 = new WxPayError(499, {}, { code: 'ERR', message: 'err' });

    expect(error400.isClientError).toBe(true);
    expect(error404.isClientError).toBe(true);
    expect(error499.isClientError).toBe(true);
  });

  it('should identify server error (5xx)', () => {
    const error500 = new WxPayError(500, {}, { code: 'ERR', message: 'err' });
    const error502 = new WxPayError(502, {}, { code: 'ERR', message: 'err' });
    const error599 = new WxPayError(599, {}, { code: 'ERR', message: 'err' });

    expect(error500.isServerError).toBe(true);
    expect(error502.isServerError).toBe(true);
    expect(error599.isServerError).toBe(true);
  });

  it('should not identify non-client error as client error', () => {
    const error200 = new WxPayError(200, {}, { code: 'OK', message: 'ok' });
    const error500 = new WxPayError(500, {}, { code: 'ERR', message: 'err' });

    expect(error200.isClientError).toBe(false);
    expect(error500.isClientError).toBe(false);
  });

  it('should not identify non-server error as server error', () => {
    const error200 = new WxPayError(200, {}, { code: 'OK', message: 'ok' });
    const error400 = new WxPayError(400, {}, { code: 'ERR', message: 'err' });

    expect(error200.isServerError).toBe(false);
    expect(error400.isServerError).toBe(false);
  });

  it('should store headers', () => {
    const headers = { 'x-request-id': '123' };
    const error = new WxPayError(400, headers, { code: 'ERR', message: 'err' });

    expect(error.headers).toEqual(headers);
  });

  it('should include detail array if present', () => {
    const error = new WxPayError(400, {}, {
      code: 'INVALID_REQUEST',
      message: '参数错误',
      detail: [
        { field: 'amount', message: '金额不能为空' },
      ],
    });

    expect(error.detail.detail).toHaveLength(1);
    expect(error.detail.detail![0].field).toBe('amount');
  });
});

describe('buildUrl', () => {
  it('should build URL with base and path', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', '/v3/pay/transactions/jsapi');
    expect(url).toBe('https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi');
  });

  it('should build URL with query parameters', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', '/v3/bill/tradebill', {
      bill_date: '2024-01-15',
      bill_type: 'ALL',
    });

    expect(url).toContain('bill_date=2024-01-15');
    expect(url).toContain('bill_type=ALL');
  });

  it('should skip undefined and null parameters', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', '/v3/bill/tradebill', {
      bill_date: '2024-01-15',
      bill_type: undefined,
      tar_type: null as unknown as undefined,
    });

    expect(url).toContain('bill_date=2024-01-15');
    expect(url).not.toContain('bill_type');
    expect(url).not.toContain('tar_type');
  });

  it('should handle numeric parameters', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', '/v3/test', {
      limit: 10,
      offset: 0,
    });

    expect(url).toContain('limit=10');
    expect(url).toContain('offset=0');
  });

  it('should handle boolean parameters', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', '/v3/test', {
      active: true,
    });

    expect(url).toContain('active=true');
  });
});

describe('parseResponseHeaders', () => {
  it('should extract wechatpay headers', () => {
    const headers = new Headers({
      'wechatpay-serial': 'CERT001',
      'wechatpay-signature': 'abc123',
      'wechatpay-timestamp': '1705305600',
      'wechatpay-nonce': 'nonce123',
      'request-id': 'req123',
    });

    const result = parseResponseHeaders(headers);

    expect(result['wechatpay-serial']).toBe('CERT001');
    expect(result['wechatpay-signature']).toBe('abc123');
    expect(result['wechatpay-timestamp']).toBe('1705305600');
    expect(result['wechatpay-nonce']).toBe('nonce123');
    expect(result['request-id']).toBe('req123');
  });

  it('should return empty object when no wechatpay headers', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    const result = parseResponseHeaders(headers);

    expect(result).toEqual({});
  });
});

describe('createRequestHeaders', () => {
  it('should create headers with authorization', () => {
    const headers = createRequestHeaders({
      authorization: 'WECHATPAY2-SHA256-RSA2048 mchid="1900000100"',
    });

    expect(headers.Authorization).toBe('WECHATPAY2-SHA256-RSA2048 mchid="1900000100"');
    expect(headers.Accept).toBe('application/json');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toBe('wxpay-nodejs-sdk/0.1.0');
  });

  it('should create headers with additional headers', () => {
    const headers = createRequestHeaders({
      authorization: 'test',
      additional: {
        'Idempotency-Key': 'key123',
      },
    });

    expect(headers['Idempotency-Key']).toBe('key123');
  });

  it('should allow custom accept and content-type', () => {
    const headers = createRequestHeaders({
      authorization: 'test',
      accept: 'text/plain',
      contentType: 'multipart/form-data',
    });

    expect(headers.Accept).toBe('text/plain');
    expect(headers['Content-Type']).toBe('multipart/form-data');
  });
});

describe('toWxPayBody', () => {
  it('should serialize object to JSON string', () => {
    const body = toWxPayBody({
      appid: 'wx8888888888888888',
      mchid: '1900000100',
      amount: { total: 100 },
    });

    const parsed = JSON.parse(body);
    expect(parsed.appid).toBe('wx8888888888888888');
    expect(parsed.mchid).toBe('1900000100');
    expect(parsed.amount.total).toBe(100);
  });

  it('should handle empty object', () => {
    const body = toWxPayBody({});
    expect(body).toBe('{}');
  });
});
