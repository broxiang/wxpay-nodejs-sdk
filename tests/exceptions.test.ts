import { describe, it, expect } from 'vitest';
import {
  WxPayError,
  ServiceException,
  HttpException,
  ValidationException,
  DecryptionException,
  MalformedMessageException,
} from '../src/utils/exceptions.js';

describe('exceptions', () => {
  describe('WxPayError', () => {
    it('should create error with correct properties', () => {
      const error = new WxPayError(
        400,
        { 'request-id': 'req-1' },
        {
          code: 'INVALID_REQUEST',
          message: '参数错误',
        },
      );

      expect(error.name).toBe('WxPayError');
      expect(error.status).toBe(400);
      expect(error.headers).toEqual({ 'request-id': 'req-1' });
      expect(error.detail.code).toBe('INVALID_REQUEST');
      expect(error.message).toBe('[INVALID_REQUEST] 参数错误');
    });

    it('should identify client error (4xx)', () => {
      const error = new WxPayError(400, {}, { code: 'ERR', message: 'msg' });
      expect(error.isClientError).toBe(true);
      expect(error.isServerError).toBe(false);
    });

    it('should identify server error (5xx)', () => {
      const error = new WxPayError(500, {}, { code: 'ERR', message: 'msg' });
      expect(error.isClientError).toBe(false);
      expect(error.isServerError).toBe(true);
    });

    it('should match specific API error code', () => {
      const error = new WxPayError(400, {}, { code: 'INVALID_REQUEST', message: 'msg' });
      expect(error.isApiError('INVALID_REQUEST')).toBe(true);
      expect(error.isApiError('OTHER_ERROR')).toBe(false);
    });
  });

  describe('ServiceException', () => {
    it('should create with correct properties', () => {
      const error = new ServiceException(
        400,
        {},
        {
          code: 'PARAM_ERROR',
          message: '参数错误',
        },
      );

      expect(error.name).toBe('ServiceException');
      expect(error.errorCode).toBe('PARAM_ERROR');
      expect(error.errorMessage).toBe('参数错误');
    });
  });

  describe('HttpException', () => {
    it('should create network error', () => {
      const error = new HttpException('请求超时');
      expect(error.name).toBe('HttpException');
      expect(error.status).toBe(0);
      expect(error.detail.code).toBe('NETWORK_ERROR');
    });

    it('should create with cause', () => {
      const cause = new Error('ECONNREFUSED');
      const error = new HttpException('连接失败', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('ValidationException', () => {
    it('should create signature error', () => {
      const error = new ValidationException('签名验证失败');
      expect(error.name).toBe('ValidationException');
      expect(error.detail.code).toBe('SIGN_ERROR');
    });
  });

  describe('DecryptionException', () => {
    it('should create decrypt error', () => {
      const error = new DecryptionException('解密失败');
      expect(error.name).toBe('DecryptionException');
      expect(error.detail.code).toBe('DECRYPT_ERROR');
    });
  });

  describe('MalformedMessageException', () => {
    it('should create parse error', () => {
      const error = new MalformedMessageException('报文格式错误');
      expect(error.name).toBe('MalformedMessageException');
      expect(error.detail.code).toBe('PARSE_ERROR');
    });
  });
});
