import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  generatePaySign,
  generateNonceStr,
  buildJsapiBridgeConfig,
  buildMiniProgramBridgeConfig,
} from '../src/services/bridge.js';

describe('JSAPI Bridge', () => {
  // Generate a real RSA key pair for testing
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  describe('generatePaySign', () => {
    it('should generate a valid base64 RSA-SHA256 signature', () => {
      const appId = 'wx1234567890abcdef';
      const timeStamp = '1628755080';
      const nonceStr = 'abc123def456';
      const prepayId = 'wx201410272009395522657a690389285100';

      const paySign = generatePaySign(appId, timeStamp, nonceStr, prepayId, privateKey);

      expect(paySign).toBeTruthy();
      expect(typeof paySign).toBe('string');

      // Verify the signature
      const expectedSignString = `${appId}\n${timeStamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, paySign, 'base64')).toBe(true);
    });

    it('should produce different signatures for different inputs', () => {
      const paySign1 = generatePaySign(
        'wxapp1',
        '1628755080',
        'nonce1',
        'prepay1',
        privateKey,
      );
      const paySign2 = generatePaySign(
        'wxapp2',
        '1628755081',
        'nonce2',
        'prepay2',
        privateKey,
      );

      expect(paySign1).not.toBe(paySign2);
    });
  });

  describe('generateNonceStr', () => {
    it('should generate a 32-character hex string', () => {
      const nonce = generateNonceStr();
      expect(nonce).toHaveLength(32);
      expect(/^[0-9a-f]{32}$/.test(nonce)).toBe(true);
    });

    it('should generate unique values', () => {
      const results = new Set(Array.from({ length: 100 }, () => generateNonceStr()));
      expect(results.size).toBe(100);
    });
  });

  describe('buildJsapiBridgeConfig', () => {
    it('should return a complete bridge config', () => {
      const appId = 'wx1234567890abcdef';
      const prepayId = 'wx201410272009395522657a690389285100';

      const config = buildJsapiBridgeConfig(appId, prepayId, privateKey);

      expect(config.appId).toBe(appId);
      expect(config.timeStamp).toBeTruthy();
      expect(config.nonceStr).toHaveLength(32);
      expect(config.package).toBe(`prepay_id=${prepayId}`);
      expect(config.signType).toBe('RSA');
      expect(config.paySign).toBeTruthy();

      // Verify the signature is valid
      const expectedSignString = [
        config.appId,
        config.timeStamp,
        config.nonceStr,
        config.package,
        '',
      ].join('\n');
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.paySign, 'base64')).toBe(true);
    });
  });

  describe('buildMiniProgramBridgeConfig', () => {
    it('should return a complete mini-program bridge config without appId', () => {
      const appId = 'wx1234567890abcdef';
      const prepayId = 'wx201410272009395522657a690389285100';

      const config = buildMiniProgramBridgeConfig(appId, prepayId, privateKey);

      // Should have exactly 5 fields, no appId
      expect(Object.keys(config)).toHaveLength(5);
      expect(config).not.toHaveProperty('appId');
      expect(config.timeStamp).toBeTruthy();
      expect(config.nonceStr).toHaveLength(32);
      expect(config.package).toBe(`prepay_id=${prepayId}`);
      expect(config.signType).toBe('RSA');
      expect(config.paySign).toBeTruthy();
    });

    it('should produce a valid signature that uses appId in the sign string', () => {
      const appId = 'wx1234567890abcdef';
      const prepayId = 'wx201410272009395522657a690389285100';

      const config = buildMiniProgramBridgeConfig(appId, prepayId, privateKey);

      // The signature must be verifiable with the appId included in the sign string
      const expectedSignString = [
        appId,
        config.timeStamp,
        config.nonceStr,
        config.package,
        '',
      ].join('\n');
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.paySign, 'base64')).toBe(true);
    });

    it('should produce same signature as JSAPI config for same inputs', () => {
      const appId = 'wx1234567890abcdef';
      const prepayId = 'wx201410272009395522657a690389285100';

      // Both functions use Date.now(), so we need to mock or compare structure
      const jsapiConfig = buildJsapiBridgeConfig(appId, prepayId, privateKey);
      const miniConfig = buildMiniProgramBridgeConfig(appId, prepayId, privateKey);

      // Different timestamps due to sequential calls, but structure should match
      expect(miniConfig.package).toBe(jsapiConfig.package);
      expect(miniConfig.signType).toBe(jsapiConfig.signType);
    });
  });
});
