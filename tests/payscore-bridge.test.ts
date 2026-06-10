import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  generatePayScorePaySign,
  buildPayScoreJsapiBridgeConfig,
  buildPayScoreMiniProgramBridgeConfig,
  buildPayScoreAppBridgeConfig,
} from '../src/services/bridge.js';

describe('PayScore Bridge', () => {
  // Generate a real RSA key pair for testing
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const appId = 'wxd678efh567hg6787';
  const mchId = '1230000109';
  const serviceId = '2002000000000558128851361561536';
  const outOrderNo = '1234323JKHDFE1243252';

  describe('generatePayScorePaySign', () => {
    it('should generate a valid base64 RSA-SHA256 signature', () => {
      const timeStamp = '1628755080';
      const nonceStr = 'abc123def456';

      const sign = generatePayScorePaySign(
        appId,
        timeStamp,
        nonceStr,
        serviceId,
        outOrderNo,
        privateKey,
      );

      expect(sign).toBeTruthy();
      expect(typeof sign).toBe('string');

      // Verify the signature against the expected sign string
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = `${appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, sign, 'base64')).toBe(true);
    });

    it('should produce different signatures for different inputs', () => {
      const sign1 = generatePayScorePaySign(
        appId,
        '1628755080',
        'nonce1',
        serviceId,
        outOrderNo,
        privateKey,
      );
      const sign2 = generatePayScorePaySign(
        appId,
        '1628755081',
        'nonce2',
        serviceId,
        'DIFFERENT_ORDER_NO',
        privateKey,
      );

      expect(sign1).not.toBe(sign2);
    });

    it('should include service_id, out_order_no, and need_sign_type=RSA in package', () => {
      const timeStamp = '1628755080';
      const nonceStr = 'testnonce123456';

      const sign = generatePayScorePaySign(
        appId,
        timeStamp,
        nonceStr,
        serviceId,
        outOrderNo,
        privateKey,
      );

      // Verify with the correct package format
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = `${appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, sign, 'base64')).toBe(true);
    });
  });

  describe('buildPayScoreJsapiBridgeConfig', () => {
    it('should return a complete JSAPI bridge config', () => {
      const config = buildPayScoreJsapiBridgeConfig(
        appId,
        mchId,
        serviceId,
        outOrderNo,
        privateKey,
      );

      expect(config.appid).toBe(appId);
      expect(config.mchid).toBe(mchId);
      expect(config.service_id).toBe(serviceId);
      expect(config.out_order_no).toBe(outOrderNo);
      expect(config.timestamp).toBeTruthy();
      expect(config.nonce_str).toHaveLength(32);
      expect(config.sign_type).toBe('RSA');
      expect(config.sign).toBeTruthy();

      // Verify the signature
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = [
        appId,
        config.timestamp,
        config.nonce_str,
        packageStr,
        '',
      ].join('\n');
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(true);
    });
  });

  describe('buildPayScoreMiniProgramBridgeConfig', () => {
    it('should return a complete mini-program bridge config without appid', () => {
      const config = buildPayScoreMiniProgramBridgeConfig(
        mchId,
        serviceId,
        outOrderNo,
        appId,
        privateKey,
      );

      // Should NOT have appid field
      expect(config).not.toHaveProperty('appid');
      expect(config.mchid).toBe(mchId);
      expect(config.service_id).toBe(serviceId);
      expect(config.out_order_no).toBe(outOrderNo);
      expect(config.timestamp).toBeTruthy();
      expect(config.nonce_str).toHaveLength(32);
      expect(config.sign_type).toBe('RSA');
      expect(config.sign).toBeTruthy();

      // Verify the signature still uses appId
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = [
        appId,
        config.timestamp,
        config.nonce_str,
        packageStr,
        '',
      ].join('\n');
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(true);
    });

    it('should produce a valid signature using appId in sign string', () => {
      const config = buildPayScoreMiniProgramBridgeConfig(
        mchId,
        serviceId,
        outOrderNo,
        appId,
        privateKey,
      );

      // Verify with appId included
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = [
        appId,
        config.timestamp,
        config.nonce_str,
        packageStr,
        '',
      ].join('\n');
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(true);
    });
  });

  describe('buildPayScoreAppBridgeConfig', () => {
    it('should return a complete APP bridge config', () => {
      const config = buildPayScoreAppBridgeConfig(
        appId,
        mchId,
        serviceId,
        outOrderNo,
        privateKey,
      );

      expect(config.appid).toBe(appId);
      expect(config.mchid).toBe(mchId);
      expect(config.service_id).toBe(serviceId);
      expect(config.out_order_no).toBe(outOrderNo);
      expect(config.timestamp).toBeTruthy();
      expect(config.nonce_str).toHaveLength(32);
      expect(config.sign_type).toBe('RSA');
      expect(config.sign).toBeTruthy();

      // Verify the signature
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = [
        appId,
        config.timestamp,
        config.nonce_str,
        packageStr,
        '',
      ].join('\n');
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(true);
    });
  });
});
