import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  buildSignString,
  sign,
  generateNonce,
  buildAuthorization,
  verifySignature,
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
});
