import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import * as fc from 'fast-check';
import { buildSignString, sign, generateNonce } from '../src/utils/sign.js';
import { buildUrl, toWxPayBody, WxPayError, createRequestHeaders } from '../src/utils/http.js';
import {
  generateAppPaySign,
  generatePaySign,
  generateNonceStr,
  generatePayScorePaySign,
} from '../src/services/bridge.js';

// 生成固定的 RSA 密钥对
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// fast-check v4 中没有 hexaString，用 stringMatching 替代
const hexArbitrary = (minLen: number, maxLen: number) =>
  fc.stringMatching(new RegExp(`^[0-9a-fA-F]{${minLen},${maxLen}}$`));

/**
 * Property-based 测试
 *
 * 使用 fast-check 对核心函数进行随机化属性测试，覆盖：
 * - 签名验证不变性
 * - nonce 唯一性
 * - URL 构建合法性
 * - JSON 序列化往返
 * - WxPayError 状态分类
 * - 签名确定性 / 唯一性
 * - 签名串格式
 */

// ========== 签名验证不变性 ==========

describe('Property: 签名验证不变性', () => {
  it('任意合法输入签名后验证应始终为 true', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
        hexArbitrary(5, 30).map((s: string) => `/v3/${s}`),
        fc.integer({ min: 1000000000, max: 2000000000 }),
        hexArbitrary(16, 32),
        fc.string({ minLength: 0, maxLength: 100 }),
        (method, path, timestamp, nonce, body) => {
          const signStr = buildSignString({ method, path, timestamp, nonce, body });
          const signature = sign(signStr, privateKey);
          // 用相同的签名串直接验证（sign 使用 buildSignString 格式）
          const verifier = crypto.createVerify('RSA-SHA256');
          verifier.update(signStr);
          verifier.end();
          const isValid = verifier.verify(publicKey, signature, 'base64');
          expect(isValid).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('修改签名串任意部分后验证应失败', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('GET', 'POST'),
        hexArbitrary(5, 30).map((s: string) => `/v3/${s}`),
        fc.integer({ min: 1000000000, max: 2000000000 }),
        hexArbitrary(16, 32),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (method, path, timestamp, nonce, body, tamper) => {
          const signStr = buildSignString({ method, path, timestamp, nonce, body });
          const signature = sign(signStr, privateKey);
          // 篡改 body，签名串变化后验证应失败
          const verifier = crypto.createVerify('RSA-SHA256');
          verifier.update(buildSignString({ method, path, timestamp, nonce, body: body + tamper }));
          verifier.end();
          const isValid = verifier.verify(publicKey, signature, 'base64');
          expect(isValid).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ========== nonce 唯一性 ==========

describe('Property: nonce 唯一性', () => {
  it('generateNonce 应始终生成 32 位十六进制字符串', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), () => {
        const nonce = generateNonce();
        expect(nonce).toMatch(/^[0-9a-f]{32}$/);
        expect(nonce).toHaveLength(32);
        expect(nonce).not.toContain('-');
      }),
      { numRuns: 50 },
    );
  });

  it('generateNonceStr (bridge) 应始终生成 32 位十六进制字符串', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), () => {
        const nonce = generateNonceStr();
        expect(nonce).toMatch(/^[0-9a-f]{32}$/);
        expect(nonce).toHaveLength(32);
      }),
      { numRuns: 50 },
    );
  });
});

// ========== URL 构建合法性 ==========

describe('Property: URL 构建', () => {
  it('buildUrl 的结果应为合法 URL', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('https://api.mch.weixin.qq.com'),
        hexArbitrary(1, 20).map((s: string) => `/v3/${s}`),
        fc.dictionary(
          fc.string({ minLength: 3, maxLength: 10 }),
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.integer({ min: 0, max: 1000 }).map(String),
          ),
          { minKeys: 0, maxKeys: 5 },
        ),
        (base, path, params) => {
          const url = buildUrl(base, path, params);
          expect(() => new URL(url)).not.toThrow();
          expect(url.startsWith(base)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('buildUrl 应正确处理 null 和 undefined 参数', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9_]{3,10}$/),
        fc.stringMatching(/^[a-zA-Z0-9_]{1,10}$/),
        (key, value) => {
          const urlWithNull = buildUrl('https://api.mch.weixin.qq.com', '/v3/test', {
            [key]: null,
          });
          expect(urlWithNull).not.toContain(`${key}=`);

          const urlWithUndefined = buildUrl('https://api.mch.weixin.qq.com', '/v3/test', {
            [key]: undefined,
          });
          expect(urlWithUndefined).not.toContain(`${key}=`);

          const urlWithValue = buildUrl('https://api.mch.weixin.qq.com', '/v3/test', {
            [key]: value,
          });
          expect(urlWithValue).toContain(`${key}=`);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ========== JSON 序列化往返 ==========

describe('Property: JSON 序列化', () => {
  it('toWxPayBody 的结果应能解析回等价对象', () => {
    fc.assert(
      fc.property(
        fc.record({
          appid: fc.string({ minLength: 1, maxLength: 32 }),
          mchid: fc.string({ minLength: 1, maxLength: 16 }),
          description: fc.string({ minLength: 1, maxLength: 50 }),
          out_trade_no: fc.string({ minLength: 1, maxLength: 32 }),
          amount: fc.record({
            total: fc.integer({ min: 1, max: 999999 }),
            currency: fc.constant('CNY'),
          }),
        }),
        (data) => {
          const serialized = toWxPayBody(data);
          const parsed = JSON.parse(serialized);
          expect(parsed.appid).toBe(data.appid);
          expect(parsed.mchid).toBe(data.mchid);
          expect(parsed.amount.total).toBe(data.amount.total);
          expect(parsed.amount.currency).toBe('CNY');
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ========== WxPayError 状态分类 ==========

describe('Property: WxPayError 状态分类', () => {
  it('4xx 状态码应始终识别为客户端错误', () => {
    fc.assert(
      fc.property(fc.integer({ min: 400, max: 499 }), (status) => {
        const error = new WxPayError(status, {}, { code: 'ERR', message: 'error' });
        expect(error.isClientError).toBe(true);
        expect(error.isServerError).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('5xx 状态码应始终识别为服务端错误', () => {
    fc.assert(
      fc.property(fc.integer({ min: 500, max: 599 }), (status) => {
        const error = new WxPayError(status, {}, { code: 'ERR', message: 'error' });
        expect(error.isServerError).toBe(true);
        expect(error.isClientError).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('200-399 状态码不应是客户端或服务端错误', () => {
    fc.assert(
      fc.property(fc.integer({ min: 200, max: 399 }), (status) => {
        const error = new WxPayError(status, {}, { code: 'OK', message: 'ok' });
        expect(error.isClientError).toBe(false);
        expect(error.isServerError).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('WxPayError.message 格式始终为 [code] message', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 200, max: 599 }),
        (code, message, status) => {
          const error = new WxPayError(status, {}, { code, message });
          expect(error.message).toBe(`[${code}] ${message}`);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ========== 签名确定性 ==========

describe('Property: 签名确定性', () => {
  it('相同输入应始终产生相同的签名', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 200 }), (message) => {
        const sig1 = sign(message, privateKey);
        const sig2 = sign(message, privateKey);
        expect(sig1).toBe(sig2);
      }),
      { numRuns: 50 },
    );
  });

  it('generatePaySign 相同输入应产生相同签名', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 20 }).map((s: string) => `wx${s}`),
        fc.string({ minLength: 10, maxLength: 10 }).map(String),
        hexArbitrary(16, 32),
        fc.string({ minLength: 10, maxLength: 30 }).map((s: string) => `prepay_id=${s}`),
        (appId, timeStamp, nonceStr, prepayId) => {
          const sig1 = generatePaySign(appId, timeStamp, nonceStr, prepayId, privateKey);
          const sig2 = generatePaySign(appId, timeStamp, nonceStr, prepayId, privateKey);
          expect(sig1).toBe(sig2);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ========== 签名唯一性 ==========

describe('Property: 签名唯一性', () => {
  it('不同 nonce 应产生不同的签名', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 20 }).map((s: string) => `wx${s}`),
        fc.string({ minLength: 10, maxLength: 10 }).map(String),
        hexArbitrary(16, 32),
        hexArbitrary(16, 32),
        fc.string({ minLength: 10, maxLength: 30 }).map((s: string) => `prepay_id=${s}`),
        (appId, timeStamp, nonce1, nonce2, prepayId) => {
          fc.pre(nonce1 !== nonce2);
          const sig1 = generatePaySign(appId, timeStamp, nonce1, prepayId, privateKey);
          const sig2 = generatePaySign(appId, timeStamp, nonce2, prepayId, privateKey);
          expect(sig1).not.toBe(sig2);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('不同 prepay_id 应产生不同的签名', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 20 }).map((s: string) => `wx${s}`),
        fc.string({ minLength: 10, maxLength: 10 }).map(String),
        hexArbitrary(16, 32),
        fc.string({ minLength: 10, maxLength: 20 }).map((s: string) => `prepay_id=${s}`),
        fc.string({ minLength: 10, maxLength: 20 }).map((s: string) => `prepay_id=${s}`),
        (appId, timeStamp, nonce, prepayId1, prepayId2) => {
          fc.pre(prepayId1 !== prepayId2);
          const sig1 = generatePaySign(appId, timeStamp, nonce, prepayId1, privateKey);
          const sig2 = generatePaySign(appId, timeStamp, nonce, prepayId2, privateKey);
          expect(sig1).not.toBe(sig2);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ========== buildSignString 格式不变性 ==========

describe('Property: 签名串格式', () => {
  it('签名串应始终为 method\\npath\\ntimestamp\\nnonce\\nbody\\n 格式', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
        hexArbitrary(5, 30).map((s: string) => `/v3/${s}`),
        fc.integer({ min: 1000000000, max: 2000000000 }),
        hexArbitrary(16, 32),
        fc.string({ minLength: 0, maxLength: 100 }),
        (method, path, timestamp, nonce, body) => {
          const signStr = buildSignString({ method, path, timestamp, nonce, body });
          const parts = signStr.split('\n');
          expect(parts[0]).toBe(method);
          expect(parts[1]).toBe(path);
          expect(parts[2]).toBe(String(timestamp));
          expect(parts[3]).toBe(nonce);
          expect(parts[4]).toBe(body);
          expect(parts).toHaveLength(6);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ========== 支付分签名 ==========

describe('Property: 支付分签名', () => {
  it('generatePayScorePaySign 相同输入应产生相同签名', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 20 }).map((s: string) => `wx${s}`),
        fc.string({ minLength: 10, maxLength: 10 }).map(String),
        hexArbitrary(16, 32),
        hexArbitrary(4, 10),
        fc.string({ minLength: 8, maxLength: 20 }).map((s: string) => `ORDER_${s}`),
        (appId, timestamp, nonceStr, serviceId, outOrderNo) => {
          const sig1 = generatePayScorePaySign(
            appId,
            timestamp,
            nonceStr,
            serviceId,
            outOrderNo,
            privateKey,
          );
          const sig2 = generatePayScorePaySign(
            appId,
            timestamp,
            nonceStr,
            serviceId,
            outOrderNo,
            privateKey,
          );
          expect(sig1).toBe(sig2);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ========== APP 支付签名 ==========

describe('Property: APP 支付签名', () => {
  it('generateAppPaySign 相同输入应产生相同签名', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 20 }).map((s: string) => `wx${s}`),
        fc.string({ minLength: 10, maxLength: 10 }).map(String),
        hexArbitrary(16, 32),
        fc.string({ minLength: 10, maxLength: 30 }).map((s: string) => `prepay_id=${s}`),
        (appId, timeStamp, nonceStr, prepayId) => {
          const sig1 = generateAppPaySign(appId, timeStamp, nonceStr, prepayId, privateKey);
          const sig2 = generateAppPaySign(appId, timeStamp, nonceStr, prepayId, privateKey);
          expect(sig1).toBe(sig2);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ========== createRequestHeaders 不变性 ==========

describe('Property: HTTP 请求头', () => {
  it('createRequestHeaders 应始终包含必需的默认头部', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 10, maxLength: 200 }), (auth) => {
        const headers = createRequestHeaders({ authorization: auth });
        expect(headers.Authorization).toBe(auth);
        expect(headers.Accept).toBe('application/json');
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['User-Agent']).toBeDefined();
      }),
      { numRuns: 50 },
    );
  });
});
