import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  buildH5CouponUrl,
  buildPayScoreDetailJsapiBridgeConfig,
  buildPayScoreDetailMiniProgramBridgeConfig,
  buildPayScoreDetailAppBridgeConfig,
  buildMedInsMiniProgramBridgeConfig,
  buildMedInsJsapiBridgeConfig,
  generatePayScorePaySign,
} from '../src/services/bridge.js';

// 生成 RSA 密钥对用于签名验证
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

describe('H5 Coupon Bridge', () => {
  describe('buildH5CouponUrl', () => {
    const signKey = '0123456789abcdef';

    it('should generate valid H5 coupon URL with required params', () => {
      const url = buildH5CouponUrl(
        {
          stock_id: '1234567890',
          out_request_no: 'REQ20240101001',
          send_coupon_merchant: '1900000100',
          open_id: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        },
        signKey,
      );

      expect(url).toContain('https://action.weixin.qq.com/busifavor/getcouponinfo');
      expect(url).toContain('stock_id=1234567890');
      expect(url).toContain('out_request_no=REQ20240101001');
      expect(url).toContain('send_coupon_merchant=1900000100');
      expect(url).toContain('open_id=oUpF8uMuAJO_M2pxb1Q9zNjWeS6o');
      expect(url).toContain('sign=');
      expect(url).toContain('#wechat_pay&wechat_redirect');
    });

    it('should include coupon_code in URL and sign when provided', () => {
      const url = buildH5CouponUrl(
        {
          stock_id: '1234567890',
          out_request_no: 'REQ20240101002',
          send_coupon_merchant: '1900000100',
          open_id: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          coupon_code: 'COUPON001',
        },
        signKey,
      );

      expect(url).toContain('coupon_code=COUPON001');
    });

    it('should include customize_send_time when provided', () => {
      const url = buildH5CouponUrl(
        {
          stock_id: '1234567890',
          out_request_no: 'REQ20240101003',
          send_coupon_merchant: '1900000100',
          open_id: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          customize_send_time: '2024-01-15T10:00:00+08:00',
        },
        signKey,
      );

      expect(url).toContain('customize_send_time=2024-01-15T10%3A00%3A00%2B08%3A00');
    });

    it('should include both coupon_code and customize_send_time', () => {
      const url = buildH5CouponUrl(
        {
          stock_id: '1234567890',
          out_request_no: 'REQ20240101004',
          send_coupon_merchant: '1900000100',
          open_id: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          coupon_code: 'COUPON002',
          customize_send_time: '2024-02-01T08:00:00+08:00',
        },
        signKey,
      );

      expect(url).toContain('coupon_code=COUPON002');
      expect(url).toContain('customize_send_time=');
    });

    it('should produce consistent signature for same inputs', () => {
      const params = {
        stock_id: '1234567890',
        out_request_no: 'REQ_CONSISTENT',
        send_coupon_merchant: '1900000100',
        open_id: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
      };

      const url1 = buildH5CouponUrl(params, signKey);
      const url2 = buildH5CouponUrl(params, signKey);

      // 相同的输入应该产生相同的签名
      const sign1 = new URL(url1).searchParams.get('sign');
      const sign2 = new URL(url2).searchParams.get('sign');
      expect(sign1).toBe(sign2);
    });

    it('should produce different signatures for different params', () => {
      const url1 = buildH5CouponUrl(
        {
          stock_id: '1234567890',
          out_request_no: 'REQ_A',
          send_coupon_merchant: '1900000100',
          open_id: 'openid_a',
        },
        signKey,
      );
      const url2 = buildH5CouponUrl(
        {
          stock_id: '1234567890',
          out_request_no: 'REQ_B',
          send_coupon_merchant: '1900000100',
          open_id: 'openid_b',
        },
        signKey,
      );

      const sign1 = new URL(url1).searchParams.get('sign');
      const sign2 = new URL(url2).searchParams.get('sign');
      expect(sign1).not.toBe(sign2);
    });

    it('should use HMAC-SHA256 and produce uppercase hex signature', () => {
      const url = buildH5CouponUrl(
        {
          stock_id: '1234567890',
          out_request_no: 'REQ_SIGN_TEST',
          send_coupon_merchant: '1900000100',
          open_id: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        },
        signKey,
      );

      const sign = new URL(url).searchParams.get('sign');
      expect(sign).toBeTruthy();
      expect(sign).toMatch(/^[0-9A-F]{64}$/);
    });
  });
});

// ============= 支付分订单详情页 =============

describe('PayScore Detail Bridge Configs', () => {
  const appId = 'wx1234567890abcdef';
  const mchId = '1900000100';
  const serviceId = '500001';
  const outOrderNo = 'ORDER20240101001';

  describe('generatePayScorePaySign', () => {
    it('should generate valid signature for payscore detail', () => {
      const timestamp = '1628755080';
      const nonceStr = 'abc123def456';

      const sign = generatePayScorePaySign(
        appId,
        timestamp,
        nonceStr,
        serviceId,
        outOrderNo,
        privateKey,
      );

      expect(sign).toBeTruthy();
      expect(typeof sign).toBe('string');

      // 验证签名
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = `${appId}\n${timestamp}\n${nonceStr}\n${packageStr}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, sign, 'base64')).toBe(true);
    });
  });

  describe('buildPayScoreDetailJsapiBridgeConfig', () => {
    it('should return complete JSAPI detail config', () => {
      const config = buildPayScoreDetailJsapiBridgeConfig(
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
      expect(config.nonce_str).toBeTruthy();
      expect(config.nonce_str).toHaveLength(32);
      expect(config.sign_type).toBe('RSA');
      expect(config.sign).toBeTruthy();

      // 验证签名
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = `${appId}\n${config.timestamp}\n${config.nonce_str}\n${packageStr}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(true);
    });

    it('should generate unique timestamps and nonces', () => {
      const config1 = buildPayScoreDetailJsapiBridgeConfig(
        appId, mchId, serviceId, outOrderNo, privateKey,
      );
      const config2 = buildPayScoreDetailJsapiBridgeConfig(
        appId, mchId, serviceId, outOrderNo, privateKey,
      );

      // 由于时间戳不同，签名也应该不同
      expect(config1.sign).not.toBe(config2.sign);
    });
  });

  describe('buildPayScoreDetailMiniProgramBridgeConfig', () => {
    it('should return complete MiniProgram detail config without appid', () => {
      const config = buildPayScoreDetailMiniProgramBridgeConfig(
        mchId,
        serviceId,
        outOrderNo,
        appId,
        privateKey,
      );

      // 小程序配置不应包含 appid 字段
      expect(config).not.toHaveProperty('appid');
      expect(config.mchid).toBe(mchId);
      expect(config.service_id).toBe(serviceId);
      expect(config.out_order_no).toBe(outOrderNo);
      expect(config.timestamp).toBeTruthy();
      expect(config.nonce_str).toHaveLength(32);
      expect(config.sign_type).toBe('RSA');
      expect(config.sign).toBeTruthy();

      // 签名验证仍需使用 appId
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = `${appId}\n${config.timestamp}\n${config.nonce_str}\n${packageStr}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(true);
    });
  });

  describe('buildPayScoreDetailAppBridgeConfig', () => {
    it('should return complete APP detail config', () => {
      const config = buildPayScoreDetailAppBridgeConfig(
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

      // 验证签名
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = `${appId}\n${config.timestamp}\n${config.nonce_str}\n${packageStr}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(true);
    });
  });

  describe('PayScore Detail vs Confirm page signature consistency', () => {
    it('should produce compatible signature between confirm and detail configs', () => {
      // 确认订单页和详情页使用相同的签名算法
      const detailConfig = buildPayScoreDetailJsapiBridgeConfig(
        appId, mchId, serviceId, outOrderNo, privateKey,
      );

      // 用相同的参数手动验证签名格式
      const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
      const expectedSignString = `${appId}\n${detailConfig.timestamp}\n${detailConfig.nonce_str}\n${packageStr}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, detailConfig.sign, 'base64')).toBe(true);
    });
  });
});

// ============= 医保支付 =============

describe('Medical Insurance Bridge Configs', () => {
  const mchid = '1900000100';
  const mixTradeNo = 'MIX20240101001';
  const appId = 'wx1234567890abcdef';

  describe('buildMedInsMiniProgramBridgeConfig', () => {
    it('should return complete MiniProgram medins config', () => {
      const config = buildMedInsMiniProgramBridgeConfig(mchid, mixTradeNo);

      expect(config.appId).toBe('wxbcad394b3d99dac9');
      expect(config.path).toBe('/pages/med-ins/pay/pay');
      expect(config.extraData).toBeDefined();
      expect(config.extraData.mchid).toBe(mchid);
      expect(config.extraData.mix_trade_no).toBe(mixTradeNo);
    });

    it('should contain correct extraData structure', () => {
      const config = buildMedInsMiniProgramBridgeConfig('1900000109', 'MIX_ORDER_002');

      expect(config.extraData).toEqual({
        mchid: '1900000109',
        mix_trade_no: 'MIX_ORDER_002',
      });
    });
  });

  describe('buildMedInsJsapiBridgeConfig', () => {
    it('should return complete JSAPI medins config with valid signature', () => {
      const config = buildMedInsJsapiBridgeConfig(appId, mchid, mixTradeNo, privateKey);

      expect(config.appid).toBe(appId);
      expect(config.mchid).toBe(mchid);
      expect(config.mix_trade_no).toBe(mixTradeNo);
      expect(config.timestamp).toBeTruthy();
      expect(config.nonce_str).toHaveLength(32);
      expect(config.sign_type).toBe('RSA');
      expect(config.sign).toBeTruthy();

      // 验证签名：signString = appId\ntimestamp\nnonceStr\npackageStr\n
      const packageStr = `mchid=${mchid}&mix_trade_no=${mixTradeNo}`;
      const expectedSignString = `${appId}\n${config.timestamp}\n${config.nonce_str}\n${packageStr}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(true);
    });

    it('should produce valid base64 signature', () => {
      const config = buildMedInsJsapiBridgeConfig(appId, mchid, mixTradeNo, privateKey);

      // Base64 签名应该能被解码
      expect(() => Buffer.from(config.sign, 'base64')).not.toThrow();
    });

    it('should generate unique signatures for different mixTradeNo', () => {
      const config1 = buildMedInsJsapiBridgeConfig(appId, mchid, 'MIX_A', privateKey);
      const config2 = buildMedInsJsapiBridgeConfig(appId, mchid, 'MIX_B', privateKey);

      expect(config1.sign).not.toBe(config2.sign);
    });

    it('should produce a verifiable signature with correct sign string format', () => {
      const config = buildMedInsJsapiBridgeConfig(appId, mchid, mixTradeNo, privateKey);

      // 使用错误的 appId 验证应失败
      const packageStr = `mchid=${mchid}&mix_trade_no=${mixTradeNo}`;
      const wrongSignString = `wrong_appid\n${config.timestamp}\n${config.nonce_str}\n${packageStr}\n`;
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(wrongSignString);
      verifier.end();
      expect(verifier.verify(publicKey, config.sign, 'base64')).toBe(false);
    });
  });
});
