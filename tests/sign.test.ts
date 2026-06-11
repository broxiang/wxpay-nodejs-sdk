import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  buildSignString,
  sign,
  generateNonce,
  buildAuthorization,
  verifySignature,
  isTimestampValid,
  oaepEncrypt,
  oaepDecrypt,
} from '../src/utils/sign.js';

describe('sign', () => {
  it('should build correct sign string', () => {
    const signString = buildSignString({
      method: 'POST',
      path: '/v3/pay/transactions/jsapi',
      timestamp: 1680000000,
      nonce: 'abc123',
      body: '{"amount":{"total":1}}',
    });

    expect(signString).toBe(
      'POST\n/v3/pay/transactions/jsapi\n1680000000\nabc123\n{"amount":{"total":1}}\n',
    );
  });

  it('should generate nonce without dashes', () => {
    const nonce = generateNonce();
    expect(nonce).not.toContain('-');
    expect(nonce.length).toBe(32);
  });

  it('should build authorization header', () => {
    const auth = buildAuthorization(
      '1900000100',
      'ABC123',
      1680000000,
      'noncestr',
      'signature_value',
    );

    expect(auth).toBe(
      'WECHATPAY2-SHA256-RSA2048 mchid="1900000100",nonce_str="noncestr",timestamp="1680000000",serial_no="ABC123",signature="signature_value"',
    );
  });

  it('should sign and verify with a real RSA key', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const currentTimestamp = Math.floor(Date.now() / 1000).toString();

    const signString = buildSignString({
      method: 'GET',
      path: '/v3/pay/transactions/id/123',
      timestamp: parseInt(currentTimestamp, 10),
      nonce: 'testnonce',
      body: '',
    });

    const signature = sign(signString, privateKey);

    expect(signature).toBeTruthy();
    expect(typeof signature).toBe('string');

    // Verify callback-style signature (timestamp\nnonce\nbody\n)
    const callbackBody = '{"id":"ev-001"}';
    const callbackSign = sign(`${currentTimestamp}\ntestnonce\n${callbackBody}\n`, privateKey);
    const isValid = verifySignature(
      callbackBody,
      callbackSign,
      currentTimestamp,
      'testnonce',
      publicKey,
    );
    expect(isValid).toBe(true);
  });

  it('should throw on empty sign string', () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    expect(() => sign('', privateKey)).toThrow('签名串不能为空');
  });

  it('should throw on empty private key', () => {
    expect(() => sign('test', '')).toThrow('商户私钥不能为空');
  });

  it('should validate timestamp within 5 minutes', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isTimestampValid(now.toString())).toBe(true);
    expect(isTimestampValid((now - 100).toString())).toBe(true);
    expect(isTimestampValid((now - 400).toString())).toBe(false);
    expect(isTimestampValid('invalid')).toBe(false);
  });

  it('should throw on missing signature in verifySignature', () => {
    const { publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const now = Math.floor(Date.now() / 1000).toString();
    expect(() => verifySignature('body', '', now, 'nonce', publicKey)).toThrow(
      '签名值(signature)不能为空',
    );
  });

  it('should throw on missing timestamp in verifySignature', () => {
    const { publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    expect(() => verifySignature('body', 'sig', '', 'nonce', publicKey)).toThrow(
      '时间戳(timestamp)不能为空',
    );
  });

  it('should throw on missing nonce in verifySignature', () => {
    const { publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const now = Math.floor(Date.now() / 1000).toString();
    expect(() => verifySignature('body', 'sig', now, '', publicKey)).toThrow(
      '随机串(nonce)不能为空',
    );
  });

  it('should throw on missing publicKey in verifySignature', () => {
    const now = Math.floor(Date.now() / 1000).toString();
    expect(() => verifySignature('body', 'sig', now, 'nonce', '')).toThrow(
      '公钥(publicKey)不能为空',
    );
  });

  it('should encrypt and decrypt with OAEP', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const plaintext = '敏感信息';
    const encrypted = oaepEncrypt(plaintext, publicKey);
    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe('string');

    const decrypted = oaepDecrypt(encrypted, privateKey);
    expect(decrypted).toBe(plaintext);
  });

  it('should return empty string for empty plaintext in oaepEncrypt', () => {
    const { publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    expect(oaepEncrypt('', publicKey)).toBe('');
  });

  it('should return empty string for empty ciphertext in oaepDecrypt', () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    expect(oaepDecrypt('', privateKey)).toBe('');
  });

  it('should throw on empty publicKey in oaepEncrypt', () => {
    expect(() => oaepEncrypt('test', '')).toThrow('加密公钥不能为空');
  });

  it('should throw on empty privateKey in oaepDecrypt', () => {
    expect(() => oaepDecrypt('test', '')).toThrow('解密私钥不能为空');
  });
});
