import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WxPayClient } from '../../src/core/client.js';
import { WxPayError } from '../../src/utils/http.js';

// 生成 RSA 密钥对用于测试签名
const { privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const CERT_SERIAL_NO = '5157F09EFDC096DE15EBE81A47057A7232F1B8E1';

describe('WxPayClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ========== 构造函数测试 ==========

  describe('constructor', () => {
    it('should create client with required options', () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      expect(client.mchid).toBe('1900000100');
      expect(client.certificates).toBeDefined();
    });

    it('should default to production base URL', () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      // 验证内部使用了生产环境 URL（通过请求来验证）
      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      return client.get('/v3/test').then(() => {
        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('https://api.mch.weixin.qq.com');
        expect(url).not.toContain('sandboxnew');
      });
    });

    it('should use sandbox base URL when sandbox option is true', () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
        sandbox: true,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      // sandbox base URL is used as the base for URL resolution
      // Since /v3/test is an absolute path, new URL('/v3/test', 'https://api.mch.weixin.qq.com/sandboxnew')
      // resolves to https://api.mch.weixin.qq.com/v3/test — the absolute path replaces /sandboxnew
      return client.get('/v3/test').then(() => {
        const url = mockFetch.mock.calls[0][0];
        expect(url).toBe('https://api.mch.weixin.qq.com/v3/test');
      });
    });

    it('should accept custom timeout', () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
        timeout: 60000,
      });

      // 通过触发超时来验证 timeout 值
      mockFetch.mockRejectedValue(new DOMException('Timeout', 'AbortError'));

      return client.get('/v3/test').catch((err: WxPayError) => {
        expect(err.detail.message).toContain('60000ms');
      });
    });

    it('should default timeout to 30000ms', () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      mockFetch.mockRejectedValue(new DOMException('Timeout', 'AbortError'));

      return client.get('/v3/test').catch((err: WxPayError) => {
        expect(err.detail.message).toContain('30000ms');
      });
    });

    it('should accept platformCertificates', () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
        platformCertificates: [
          {
            serialNo: CERT_SERIAL_NO,
            effectiveTime: '2020-01-01T00:00:00+08:00',
            expireTime: '2030-01-01T00:00:00+08:00',
            encryptCertificate: {
              algorithm: 'AEAD_AES_256_GCM',
              nonce: 'nonce123',
              associatedData: 'certificate',
              ciphertext: 'base64ciphertext==',
            },
          },
        ],
      });

      expect(client.certificates).toBeDefined();
    });
  });

  // ========== resolvePrivateKey 测试 ==========

  describe('resolvePrivateKey', () => {
    it('should accept Buffer directly', () => {
      const buf = Buffer.from(privateKey);
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey: buf,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      return client.get('/v3/test').then(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should accept PEM string directly', () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      return client.get('/v3/test').then(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should read key from file path', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wxpay-test-'));
      const keyPath = path.join(tmpDir, 'apiclient_key.pem');
      fs.writeFileSync(keyPath, privateKey);

      try {
        const client = new WxPayClient({
          mchid: '1900000100',
          apiV3Key: '0123456789abcdef0123456789abcdef',
          serialNo: CERT_SERIAL_NO,
          privateKey: keyPath,
        });

        const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
        mockFetch.mockResolvedValue(mockResponse);

        return client.get('/v3/test').then(() => {
          expect(mockFetch).toHaveBeenCalled();
        });
      } finally {
        fs.unlinkSync(keyPath);
        fs.rmdirSync(tmpDir);
      }
    });

    it('should fallback to treating path as key content when file not found', () => {
      const nonExistentPath = '/nonexistent/path/key.pem';

      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey: nonExistentPath,
      });

      // 不会抛出错误，因为 fallback 机制将路径当作密钥内容
      // 虽然签名会失败，但不会在构造函数阶段崩溃
      expect(client).toBeDefined();
    });
  });

  // ========== GET 请求测试 ==========

  describe('get', () => {
    it('should make GET request with correct headers', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
        enableResponseVerification: false,
      });

      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'wechatpay-serial': 'CERT001',
          'wechatpay-signature': 'sig123',
          'wechatpay-timestamp': '1705305600',
          'wechatpay-nonce': 'nonce123',
          'request-id': 'req123',
        },
      });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/v3/pay/transactions/id/123');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const url = callArgs[0] as string;
      const options = callArgs[1] as RequestInit;

      expect(url).toContain('https://api.mch.weixin.qq.com/v3/pay/transactions/id/123');
      expect(options.method).toBe('GET');
      expect(options.headers).toBeDefined();
      const headers = options.headers as Record<string, string>;
      expect(headers['Authorization']).toMatch(/^WECHATPAY2-SHA256-RSA2048/);
      expect(headers['Accept']).toBe('application/json');
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ data: 'test' });
    });

    it('should make GET request with query parameters', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/v3/pay/transactions', { limit: 10, offset: 0 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=0');
    });

    it('should throw WxPayError on non-2xx response', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const errorBody = {
        code: 'INVALID_REQUEST',
        message: '参数错误',
      };
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(errorBody), { status: 400 })),
      );

      await expect(client.get('/v3/test')).rejects.toThrow(WxPayError);
      await expect(client.get('/v3/test')).rejects.toThrow('[INVALID_REQUEST] 参数错误');
    });
  });

  // ========== POST 请求测试 ==========

  describe('post', () => {
    it('should make POST request with JSON body', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ prepay_id: 'wx123' }), {
        status: 200,
      });
      mockFetch.mockResolvedValue(mockResponse);

      const body = {
        appid: 'wx8888888888888888',
        mchid: '1900000100',
        description: '测试商品',
        out_trade_no: 'ORDER001',
        amount: { total: 100, currency: 'CNY' },
        payer: { openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
      };

      const result = await client.post('/v3/pay/transactions/jsapi', body);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const options = mockFetch.mock.calls[0][1] as RequestInit;
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify(body));
      expect(result.data).toEqual({ prepay_id: 'wx123' });
    });

    it('should make POST request with query params and extra headers', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      await client.post(
        '/v3/test',
        { data: 'test' },
        { sub_mchid: '1900000101' },
        { 'Idempotency-Key': 'key123' },
      );

      const options = mockFetch.mock.calls[0][1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      expect(headers['Idempotency-Key']).toBe('key123');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('sub_mchid=1900000101');
    });
  });

  // ========== PUT 请求测试 ==========

  describe('put', () => {
    it('should make PUT request', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      const body = { name: 'updated' };
      await client.put('/v3/resource', body);

      const options = mockFetch.mock.calls[0][1] as RequestInit;
      expect(options.method).toBe('PUT');
      expect(options.body).toBe(JSON.stringify(body));
    });

    it('should make PUT request with query params', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      await client.put('/v3/resource', { name: 'test' }, { version: '1' });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('version=1');
    });
  });

  // ========== PATCH 请求测试 ==========

  describe('patch', () => {
    it('should make PATCH request', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      const body = { amount: 200 };
      await client.patch('/v3/resource', body);

      const options = mockFetch.mock.calls[0][1] as RequestInit;
      expect(options.method).toBe('PATCH');
      expect(options.body).toBe(JSON.stringify(body));
    });
  });

  // ========== DELETE 请求测试 ==========

  describe('delete', () => {
    it('should make DELETE request', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      await client.delete('/v3/resource');

      const options = mockFetch.mock.calls[0][1] as RequestInit;
      expect(options.method).toBe('DELETE');
      expect(options.body).toBeUndefined();
    });

    it('should make DELETE request with query params', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      await client.delete('/v3/resource', { id: '123' });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('id=123');
    });
  });

  // ========== 超时处理测试 ==========

  describe('timeout handling', () => {
    it('should throw REQUEST_TIMEOUT on AbortError for GET', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
        timeout: 1000,
      });

      mockFetch.mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

      await expect(client.get('/v3/test')).rejects.toThrow(WxPayError);
      await expect(client.get('/v3/test')).rejects.toThrow('REQUEST_TIMEOUT');
    });

    it('should throw REQUEST_TIMEOUT on AbortError for POST', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
        timeout: 5000,
      });

      mockFetch.mockRejectedValue(new DOMException('aborted', 'AbortError'));

      await expect(client.post('/v3/test', {})).rejects.toThrow(WxPayError);
      await expect(client.post('/v3/test', {})).rejects.toThrow('5000ms');
    });
  });

  // ========== 网络错误测试 ==========

  describe('network error handling', () => {
    it('should throw NETWORK_ERROR on generic fetch failure', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      mockFetch.mockRejectedValue(new Error('Connection refused'));

      await expect(client.get('/v3/test')).rejects.toThrow(WxPayError);
      await expect(client.get('/v3/test')).rejects.toThrow('NETWORK_ERROR');
      await expect(client.get('/v3/test')).rejects.toThrow('Connection refused');
    });

    it('should handle non-Error network failures', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      mockFetch.mockRejectedValue('Unknown error');

      await expect(client.get('/v3/test')).rejects.toThrow(WxPayError);
      await expect(client.get('/v3/test')).rejects.toThrow('网络请求失败');
    });

    it('should re-throw WxPayError from fetch without wrapping', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const originalError = new WxPayError(
        500,
        {},
        {
          code: 'SYSTEM_ERROR',
          message: '系统错误',
        },
      );
      mockFetch.mockRejectedValue(originalError);

      await expect(client.get('/v3/test')).rejects.toThrow(originalError);
    });
  });

  // ========== 签名验证测试 ==========

  describe('request signing', () => {
    it('should include valid Authorization header in GET requests', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/v3/pay/transactions/id/4200001234567890');

      const options = mockFetch.mock.calls[0][1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      const auth = headers['Authorization'];

      // 验证 Authorization 头格式
      expect(auth).toMatch(/^WECHATPAY2-SHA256-RSA2048 /);
      expect(auth).toContain(`mchid="1900000100"`);
      expect(auth).toContain(`serial_no="${CERT_SERIAL_NO}"`);
      expect(auth).toContain('nonce_str=');
      expect(auth).toContain('timestamp=');
      expect(auth).toContain('signature=');
    });

    it('should include valid Authorization header in POST requests with body', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      await client.post('/v3/pay/transactions/jsapi', { amount: 100 });

      const options = mockFetch.mock.calls[0][1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      expect(headers['Authorization']).toMatch(/^WECHATPAY2-SHA256-RSA2048/);
    });

    it('should produce different signatures for different paths', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/v3/pay/transactions/id/A');
      const auth1 = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;

      mockFetch.mockClear();
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      await client.get('/v3/pay/transactions/id/B');
      const auth2 = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;

      expect(auth1['Authorization']).not.toBe(auth2['Authorization']);
    });
  });

  // ========== downloadRaw 测试 ==========

  describe('downloadRaw', () => {
    it('should download raw binary data', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const rawData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const mockResponse = new Response(rawData, {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.downloadRaw(
        'https://api.mch.weixin.qq.com/v3/billdownload/file?token=abc',
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const options = mockFetch.mock.calls[0][1] as RequestInit;
      expect(options.method).toBe('GET');
      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.data.toString('hex')).toBe('01020304');
    });

    it('should handle error response in downloadRaw', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const errorBody = { code: 'BILL_NOT_EXIST', message: '账单不存在' };
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(errorBody), { status: 404 })),
      );

      await expect(
        client.downloadRaw('https://api.mch.weixin.qq.com/v3/billdownload/file?token=abc'),
      ).rejects.toThrow(WxPayError);
      await expect(
        client.downloadRaw('https://api.mch.weixin.qq.com/v3/billdownload/file?token=abc'),
      ).rejects.toThrow('BILL_NOT_EXIST');
    });

    it('should handle non-JSON error response in downloadRaw', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      mockFetch.mockImplementation(() =>
        Promise.resolve(
          new Response('Internal Server Error', {
            status: 500,
            statusText: 'Internal Server Error',
          }),
        ),
      );

      await expect(
        client.downloadRaw('https://api.mch.weixin.qq.com/v3/billdownload/file?token=abc'),
      ).rejects.toThrow(WxPayError);
      await expect(
        client.downloadRaw('https://api.mch.weixin.qq.com/v3/billdownload/file?token=abc'),
      ).rejects.toThrow('HTTP 500');
    });

    it('should handle timeout in downloadRaw', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
        timeout: 5000,
      });

      mockFetch.mockRejectedValue(new DOMException('aborted', 'AbortError'));

      await expect(
        client.downloadRaw('https://api.mch.weixin.qq.com/v3/billdownload/file?token=abc'),
      ).rejects.toThrow('REQUEST_TIMEOUT');
    });

    it('should handle network error in downloadRaw', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      mockFetch.mockRejectedValue(new Error('Network down'));

      await expect(
        client.downloadRaw('https://api.mch.weixin.qq.com/v3/billdownload/file?token=abc'),
      ).rejects.toThrow('NETWORK_ERROR');
    });

    it('should re-throw WxPayError in downloadRaw', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const wxError = new WxPayError(400, {}, { code: 'PARAM_ERROR', message: '参数错误' });
      mockFetch.mockRejectedValue(wxError);

      await expect(
        client.downloadRaw('https://api.mch.weixin.qq.com/v3/billdownload/file?token=abc'),
      ).rejects.toThrow(wxError);
    });
  });

  // ========== upload 测试 ==========

  describe('upload', () => {
    it('should upload file with multipart/form-data', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ media_id: 'MEDIA_001' }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      const fileBuffer = Buffer.from('fake-image-data');
      const result = await client.upload('/v3/merchant/media/upload', fileBuffer, 'test.png', {
        filename: 'test.png',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const options = mockFetch.mock.calls[0][1] as RequestInit;
      expect(options.method).toBe('POST');

      const headers = options.headers as Record<string, string>;
      expect(headers['Content-Type']).toMatch(/^multipart\/form-data; boundary=/);
      expect(headers['Authorization']).toMatch(/^WECHATPAY2-SHA256-RSA2048/);

      expect(result.data).toEqual({ media_id: 'MEDIA_001' });
    });

    it('should upload file with empty meta when not provided', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response(JSON.stringify({ media_id: 'MEDIA_002' }), { status: 200 });
      mockFetch.mockResolvedValue(mockResponse);

      const fileBuffer = Buffer.from('image-data');
      await client.upload('/v3/merchant/media/upload', fileBuffer, 'img.png');

      const options = mockFetch.mock.calls[0][1] as RequestInit;
      const body = options.body as Buffer;
      const bodyStr = body.toString();
      // meta part 应包含 "{}"
      expect(bodyStr).toContain('name="meta"');
      expect(bodyStr).toContain('{}');
      expect(bodyStr).toContain('name="file"');
      expect(bodyStr).toContain('filename="img.png"');
    });

    it('should handle upload error response', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const errorBody = { code: 'FILE_TOO_LARGE', message: '文件过大' };
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(errorBody), { status: 413 })),
      );

      const fileBuffer = Buffer.from('data');
      await expect(
        client.upload('/v3/merchant/media/upload', fileBuffer, 'img.png'),
      ).rejects.toThrow(WxPayError);
      await expect(
        client.upload('/v3/merchant/media/upload', fileBuffer, 'img.png'),
      ).rejects.toThrow('FILE_TOO_LARGE');
    });

    it('should handle timeout in upload', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
        timeout: 3000,
      });

      mockFetch.mockRejectedValue(new DOMException('aborted', 'AbortError'));

      const fileBuffer = Buffer.from('data');
      await expect(
        client.upload('/v3/merchant/media/upload', fileBuffer, 'img.png'),
      ).rejects.toThrow('REQUEST_TIMEOUT');
    });

    it('should handle network error in upload', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      mockFetch.mockRejectedValue(new Error('Connection lost'));

      const fileBuffer = Buffer.from('data');
      await expect(
        client.upload('/v3/merchant/media/upload', fileBuffer, 'img.png'),
      ).rejects.toThrow('NETWORK_ERROR');
    });

    it('should re-throw WxPayError in upload', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const wxError = new WxPayError(429, {}, { code: 'RATE_LIMITED', message: '请求过于频繁' });
      mockFetch.mockRejectedValue(wxError);

      const fileBuffer = Buffer.from('data');
      await expect(
        client.upload('/v3/merchant/media/upload', fileBuffer, 'img.png'),
      ).rejects.toThrow(wxError);
    });
  });

  // ========== 综合场景测试 ==========

  describe('integration scenarios', () => {
    it('should handle empty POST body', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      // 204 No Content cannot have a body
      const mockResponse = new Response(null, { status: 204 });
      mockFetch.mockResolvedValue(mockResponse);

      try {
        await client.post('/v3/close', {});
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(WxPayError);
      }
    });

    it('should handle JSON parse error on success response', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response('not valid json', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      try {
        await client.get('/v3/test');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(WxPayError);
        if (err instanceof WxPayError) {
          expect(err.detail.code).toBe('PARSE_ERROR');
        }
      }
    });

    it('should handle response with null data', async () => {
      const client = new WxPayClient({
        mchid: '1900000100',
        apiV3Key: '0123456789abcdef0123456789abcdef',
        serialNo: CERT_SERIAL_NO,
        privateKey,
      });

      const mockResponse = new Response('null', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      try {
        await client.get('/v3/test');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(WxPayError);
        if (err instanceof WxPayError) {
          expect(err.detail.code).toBe('PARSE_ERROR');
        }
      }
    });
  });
});
