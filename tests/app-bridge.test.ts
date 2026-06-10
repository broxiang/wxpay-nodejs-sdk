import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  generateAppPaySign,
  generatePaySign,
  generateNonceStr,
  buildAppBridgeConfig,
} from '../src/services/bridge.js';

describe('APP Bridge', () => {
  // Generate a real RSA key pair for testing
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  describe('generateAppPaySign', () => {
    it('should generate a valid base64 RSA-SHA256 signature', () => {
      const appId = 'wx1234567890abcdef';
      const timeStamp = '1628755080';
      const nonceStr = 'abc123def456';
      const prepayId = 'wx201410272009395522657a690389285100';

      const sign = generateAppPaySign(appId, timeStamp, nonceStr, prepayId, privateKey);

      expect(sign).toBeTruthy();
      expect(typeof sign).toBe('string');

      // Verify the signature: appId\ntimeStamp\nnonceStr\nprepay_id=<prepayId>\n
      const expectedSignString = `${appId}\n${timeStamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, sign, 'base64')).toBe(true);
    });

    it('should produce different signatures for different inputs', () => {
      const sign1 = generateAppPaySign('wxapp1', '1628755080', 'nonce1', 'prepay1', privateKey);
      const sign2 = generateAppPaySign('wxapp2', '1628755081', 'nonce2', 'prepay2', privateKey);

      expect(sign1).not.toBe(sign2);
    });

    it('should produce the same signature format as generatePaySign for identical sign string', () => {
      // Both APP and JSAPI use the same sign string format:
      // appId\ntimeStamp\nnonceStr\nprepay_id=<prepayId>\n
      const appId = 'wx1234567890abcdef';
      const timeStamp = '1628755080';
      const nonceStr = 'abc123def456';
      const prepayId = 'wx201410272009395522657a690389285100';

      const appSign = generateAppPaySign(appId, timeStamp, nonceStr, prepayId, privateKey);
      const jsapiSign = generatePaySign(appId, timeStamp, nonceStr, prepayId, privateKey);

      // Same inputs + same sign string = same signature
      expect(appSign).toBe(jsapiSign);
    });
  });

  describe('buildAppBridgeConfig', () => {
    it('should return a complete APP bridge config', () => {
      const appId = 'wx1234567890abcdef';
      const partnerId = '1900000100';
      const prepayId = 'wx201410272009395522657a690389285100';

      const config = buildAppBridgeConfig(appId, partnerId, prepayId, privateKey);

      expect(config.appId).toBe(appId);
      expect(config.partnerId).toBe(partnerId);
      expect(config.prepayId).toBe(prepayId);
      expect(config.packageValue).toBe('Sign=WXPay');
      expect(config.timeStamp).toBeTruthy();
      expect(config.nonceStr).toHaveLength(32);
      expect(config.sign).toBeTruthy();

      // Verify the signature is valid
      const expectedSignString = [
        config.appId,
        config.timeStamp,
        config.nonceStr,
        `prepay_id=${prepayId}`,
        '',
      ].join('\n');
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(true);
    });

    it('should produce timeStamp as a 10-digit string (seconds, not milliseconds)', () => {
      const config = buildAppBridgeConfig(
        'wx1234567890abcdef',
        '1900000100',
        'wx201410272009395522657a690389285100',
        privateKey,
      );

      expect(config.timeStamp).toMatch(/^\d{10}$/);
    });

    it('should produce unique configs on each call', () => {
      const config1 = buildAppBridgeConfig(
        'wx1234567890abcdef',
        '1900000100',
        'prepay1',
        privateKey,
      );
      const config2 = buildAppBridgeConfig(
        'wx1234567890abcdef',
        '1900000100',
        'prepay2',
        privateKey,
      );

      expect(config1.sign).not.toBe(config2.sign);
      expect(config1.prepayId).not.toBe(config2.prepayId);
    });
  });
});
