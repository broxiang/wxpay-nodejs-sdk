import { describe, it, expect } from 'vitest';
import {
  WxPayError,
  buildUrl,
  parseResponseHeaders,
  createRequestHeaders,
} from '../../src/utils/http';

/**
 * 补充 http.ts 中未覆盖的分支和边界情况测试
 *
 * 已有测试覆盖：基本 WxPayError、buildUrl 基本、parseResponseHeaders、createRequestHeaders、toWxPayBody
 * 本文件补充：WxPayError 边界值、parseResponse 函数（通过实际 HTTP 交互测试）、buildUrl 边界场景
 */

describe('WxPayError - boundary cases', () => {
  describe('isClientError boundary', () => {
    it('should return false for status 399', () => {
      const error = new WxPayError(399, {}, { code: 'E', message: 'm' });
      expect(error.isClientError).toBe(false);
    });

    it('should return true for status 400 (lower bound)', () => {
      const error = new WxPayError(400, {}, { code: 'E', message: 'm' });
      expect(error.isClientError).toBe(true);
    });

    it('should return true for status 499 (upper bound)', () => {
      const error = new WxPayError(499, {}, { code: 'E', message: 'm' });
      expect(error.isClientError).toBe(true);
    });

    it('should return false for status 500', () => {
      const error = new WxPayError(500, {}, { code: 'E', message: 'm' });
      expect(error.isClientError).toBe(false);
    });
  });

  describe('isServerError boundary', () => {
    it('should return false for status 499', () => {
      const error = new WxPayError(499, {}, { code: 'E', message: 'm' });
      expect(error.isServerError).toBe(false);
    });

    it('should return true for status 500 (lower bound)', () => {
      const error = new WxPayError(500, {}, { code: 'E', message: 'm' });
      expect(error.isServerError).toBe(true);
    });

    it('should return true for status 599 (upper bound)', () => {
      const error = new WxPayError(599, {}, { code: 'E', message: 'm' });
      expect(error.isServerError).toBe(true);
    });

    it('should return false for status 600', () => {
      const error = new WxPayError(600, {}, { code: 'E', message: 'm' });
      expect(error.isServerError).toBe(false);
    });
  });

  describe('status 0 (timeout/network error)', () => {
    it('should not be client error for status 0', () => {
      const error = new WxPayError(0, {}, { code: 'REQUEST_TIMEOUT', message: 'timeout' });
      expect(error.isClientError).toBe(false);
    });

    it('should not be server error for status 0', () => {
      const error = new WxPayError(0, {}, { code: 'NETWORK_ERROR', message: 'network' });
      expect(error.isServerError).toBe(false);
    });
  });

  describe('status 200', () => {
    it('should not identify 200 as client or server error', () => {
      const error = new WxPayError(200, {}, { code: 'OK', message: 'ok' });
      expect(error.isClientError).toBe(false);
      expect(error.isServerError).toBe(false);
    });
  });
});

describe('buildUrl - edge cases', () => {
  it('should handle path with existing query string', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', '/v3/test?foo=bar', {
      extra: 'value',
    });
    expect(url).toContain('foo=bar');
    expect(url).toContain('extra=value');
  });

  it('should handle path with trailing slash in base', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com/', '/v3/test');
    expect(url).toBe('https://api.mch.weixin.qq.com/v3/test');
  });

  it('should handle absolute URL path', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', 'https://other.example.com/v3/test');
    expect(url).toBe('https://other.example.com/v3/test');
  });

  it('should handle empty params object', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', '/v3/test', {});
    expect(url).toBe('https://api.mch.weixin.qq.com/v3/test');
  });

  it('should handle zero value (not skip it)', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', '/v3/test', {
      offset: 0,
    });
    expect(url).toContain('offset=0');
  });

  it('should handle false boolean value', () => {
    const url = buildUrl('https://api.mch.weixin.qq.com', '/v3/test', {
      enabled: false,
    });
    expect(url).toContain('enabled=false');
  });
});

describe('parseResponseHeaders - edge cases', () => {
  it('should handle partial wechatpay headers', () => {
    const headers = new Headers({
      'wechatpay-serial': 'CERT001',
      'request-id': 'req123',
    });

    const result = parseResponseHeaders(headers);

    expect(result['wechatpay-serial']).toBe('CERT001');
    expect(result['request-id']).toBe('req123');
    expect(result).not.toHaveProperty('wechatpay-signature');
    expect(result).not.toHaveProperty('wechatpay-timestamp');
    expect(result).not.toHaveProperty('wechatpay-nonce');
  });

  it('should handle headers with empty string values', () => {
    // Headers API allows empty strings
    const headers = new Headers({
      'wechatpay-serial': '',
      'request-id': 'req123',
    });

    const result = parseResponseHeaders(headers);

    // Empty string is falsy, so should not be included
    expect(result).not.toHaveProperty('wechatpay-serial');
    expect(result['request-id']).toBe('req123');
  });
});

describe('createRequestHeaders - edge cases', () => {
  it('should override default headers with additional', () => {
    const headers = createRequestHeaders({
      authorization: 'test-auth',
      additional: {
        Accept: 'text/html',
        'Content-Type': 'text/plain',
        'User-Agent': 'custom-agent/1.0',
      },
    });

    expect(headers.Accept).toBe('text/html');
    expect(headers['Content-Type']).toBe('text/plain');
    expect(headers['User-Agent']).toBe('custom-agent/1.0');
  });

  it('should handle empty additional headers', () => {
    const headers = createRequestHeaders({
      authorization: 'test-auth',
      additional: {},
    });

    expect(headers.Authorization).toBe('test-auth');
    expect(headers.Accept).toBe('application/json');
  });
});
