import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { CallbackHandler } from '../src/services/callback.js';
import { CertificateManager } from '../src/core/certificate.js';

describe('CallbackHandler', () => {
  const apiV3Key = '0123456789abcdef0123456789abcdef'; // 32-byte key
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Create a CertificateManager with a test certificate
  const certificates = new CertificateManager(apiV3Key, [
    {
      serialNo: 'TEST_SERIAL_001',
      effectiveTime: '2020-01-01T00:00:00+08:00',
      expireTime: '2030-01-01T00:00:00+08:00',
      encryptCertificate: {
        algorithm: 'AEAD_AES_256_GCM',
        nonce: 'unused',
        associatedData: 'unused',
        ciphertext: 'unused',
      },
    },
  ]);

  // Manually register the public key
  certificates.setPublicKey('TEST_SERIAL_001', publicKey);

  const handler = new CallbackHandler(apiV3Key, certificates);

  /**
   * Helper: sign a body string with the test private key
   */
  function signBody(body: string): {
    signature: string;
    timestamp: string;
    nonce: string;
  } {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const signString = `${timestamp}\n${nonce}\n${body}\n`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signString);
    signer.end();
    const signature = signer.sign(privateKey, 'base64');
    return { signature, timestamp, nonce };
  }

  /**
   * Helper: encrypt data with AES-256-GCM
   */
  function encryptData(data: string): {
    ciphertext: string;
    nonce: string;
    associatedData: string;
  } {
    const nonce = crypto.randomBytes(12).toString('utf-8').slice(0, 12);
    const associatedData = 'transaction';
    const key = Buffer.from(apiV3Key, 'utf-8');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf-8'));
    cipher.setAAD(Buffer.from(associatedData, 'utf-8'));

    const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([encrypted, authTag]).toString('base64');

    return { ciphertext, nonce, associatedData };
  }

  describe('verifySignature', () => {
    it('should verify a valid signature', () => {
      const body = JSON.stringify({ test: 'data' });
      const { signature, timestamp, nonce } = signBody(body);

      const result = handler.verifySignature(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': nonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result).toBe(true);
    });

    it('should return false for an invalid signature', () => {
      const body = JSON.stringify({ test: 'data' });
      const { timestamp, nonce } = signBody(body);

      const result = handler.verifySignature(
        {
          'wechatpay-signature': 'invalid_signature_base64==',
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': nonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result).toBe(false);
    });

    it('should throw if certificate serial number is not found', () => {
      expect(() =>
        handler.verifySignature(
          {
            'wechatpay-signature': 'some_sig',
            'wechatpay-timestamp': '1234567890',
            'wechatpay-nonce': 'abc123',
            'wechatpay-serial': 'UNKNOWN_SERIAL',
          },
          '{}',
        ),
      ).toThrow('未找到序列号为 UNKNOWN_SERIAL 的平台证书');
    });
  });

  describe('decryptNotification', () => {
    it('should decrypt a notification and return the original data', () => {
      const testData = {
        appid: 'wx1234567890',
        mchid: '1900000100',
        out_trade_no: 'ORDER20240609001',
        transaction_id: '4200001234567890',
        trade_type: 'JSAPI',
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        bank_type: 'CMC',
        success_time: '2024-06-09T10:30:00+08:00',
        payer: { openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
        amount: {
          total: 100,
          payer_total: 100,
          currency: 'CNY',
          payer_currency: 'CNY',
        },
      };

      const { ciphertext, nonce, associatedData } = encryptData(JSON.stringify(testData));

      const notification = {
        id: 'EV-2018022511223320873',
        create_time: '2024-06-09T10:30:01+08:00',
        event_type: 'TRANSACTION.SUCCESS',
        resource_type: 'encrypt-resource',
        summary: '支付成功',
        resource: {
          original_type: 'transaction',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const result = handler.decryptNotification(notification);

      expect(result.id).toBe(notification.id);
      expect(result.event_type).toBe('TRANSACTION.SUCCESS');
      expect(result.data).toEqual(testData);
    });
  });

  describe('process', () => {
    it('should verify and decrypt a full callback notification', () => {
      const testData = {
        appid: 'wx1234567890',
        mchid: '1900000100',
        out_trade_no: 'ORDER20240609001',
        transaction_id: '4200001234567890',
        trade_type: 'JSAPI',
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        bank_type: 'CMC',
        success_time: '2024-06-09T10:30:00+08:00',
        payer: { openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
        amount: {
          total: 100,
          payer_total: 100,
          currency: 'CNY',
          payer_currency: 'CNY',
        },
      };

      const { ciphertext, nonce, associatedData } = encryptData(JSON.stringify(testData));

      const notification = {
        id: 'EV-2018022511223320873',
        create_time: '2024-06-09T10:30:01+08:00',
        event_type: 'TRANSACTION.SUCCESS',
        resource_type: 'encrypt-resource',
        summary: '支付成功',
        resource: {
          original_type: 'transaction',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const body = JSON.stringify(notification);
      const { signature, timestamp, nonce: signNonce } = signBody(body);

      const result = handler.processTransactionCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('TRANSACTION.SUCCESS');
      expect(result.data).toEqual(testData);
    });

    it('should throw when signature verification fails', () => {
      const body = JSON.stringify({ test: 'data' });

      expect(() =>
        handler.process(
          {
            'wechatpay-signature': 'bad_signature',
            'wechatpay-timestamp': '1234567890',
            'wechatpay-nonce': 'abc123',
            'wechatpay-serial': 'TEST_SERIAL_001',
          },
          body,
        ),
      ).toThrow('回调通知签名验证失败');
    });
  });

  describe('verifySignature errors', () => {
    it('should throw on missing wechatpay-serial', () => {
      expect(() =>
        handler.verifySignature(
          { 'wechatpay-signature': 'sig', 'wechatpay-timestamp': '123', 'wechatpay-nonce': 'n' },
          '{}',
        ),
      ).toThrow('回调头 wechatpay-serial 不能为空');
    });

    it('should throw on missing wechatpay-signature', () => {
      expect(() =>
        handler.verifySignature(
          { 'wechatpay-serial': 'S', 'wechatpay-timestamp': '123', 'wechatpay-nonce': 'n' },
          '{}',
        ),
      ).toThrow('回调头 wechatpay-signature 不能为空');
    });

    it('should throw on missing wechatpay-timestamp', () => {
      expect(() =>
        handler.verifySignature(
          { 'wechatpay-serial': 'S', 'wechatpay-signature': 'sig', 'wechatpay-nonce': 'n' },
          '{}',
        ),
      ).toThrow('回调头 wechatpay-timestamp 不能为空');
    });

    it('should throw on missing wechatpay-nonce', () => {
      expect(() =>
        handler.verifySignature(
          { 'wechatpay-serial': 'S', 'wechatpay-signature': 'sig', 'wechatpay-timestamp': '123' },
          '{}',
        ),
      ).toThrow('回调头 wechatpay-nonce 不能为空');
    });

    it('should throw on unsupported signature type', () => {
      expect(() =>
        handler.verifySignature(
          {
            'wechatpay-serial': 'S',
            'wechatpay-signature': 'sig',
            'wechatpay-timestamp': '123',
            'wechatpay-nonce': 'n',
            'wechatpay-signature-type': 'UNSUPPORTED',
          },
          '{}',
        ),
      ).toThrow('不支持的签名类型');
    });
  });

  describe('decryptNotification errors', () => {
    it('should throw on missing algorithm', () => {
      expect(() =>
        handler.decryptNotification({
          id: '1',
          create_time: '',
          event_type: '',
          resource_type: '',
          summary: '',
          resource: { algorithm: '', ciphertext: 'c', nonce: 'n' },
        }),
      ).toThrow('回调通知 resource 缺少 algorithm 字段');
    });

    it('should throw on missing ciphertext', () => {
      expect(() =>
        handler.decryptNotification({
          id: '1',
          create_time: '',
          event_type: '',
          resource_type: '',
          summary: '',
          resource: { algorithm: 'AEAD_AES_256_GCM', ciphertext: '', nonce: 'n' },
        }),
      ).toThrow('回调通知 resource 缺少 ciphertext 字段');
    });

    it('should throw on missing nonce', () => {
      expect(() =>
        handler.decryptNotification({
          id: '1',
          create_time: '',
          event_type: '',
          resource_type: '',
          summary: '',
          resource: { algorithm: 'AEAD_AES_256_GCM', ciphertext: 'c', nonce: '' },
        }),
      ).toThrow('回调通知 resource 缺少 nonce 字段');
    });

    it('should throw on unsupported algorithm', () => {
      expect(() =>
        handler.decryptNotification({
          id: '1',
          create_time: '',
          event_type: '',
          resource_type: '',
          summary: '',
          resource: { algorithm: 'UNSUPPORTED', ciphertext: 'c', nonce: 'n' },
        }),
      ).toThrow('不支持的加密算法');
    });

    it('should throw on invalid JSON', () => {
      const { ciphertext, nonce, associatedData } = encryptData('not json');
      expect(() =>
        handler.decryptNotification({
          id: '1',
          create_time: '',
          event_type: '',
          resource_type: '',
          summary: '',
          resource: {
            algorithm: 'AEAD_AES_256_GCM',
            ciphertext,
            nonce,
            associated_data: associatedData,
          },
        }),
      ).toThrow('回调数据 JSON 解析失败');
    });

    it('should throw on null parsed data', () => {
      const { ciphertext, nonce, associatedData } = encryptData('null');
      expect(() =>
        handler.decryptNotification({
          id: '1',
          create_time: '',
          event_type: '',
          resource_type: '',
          summary: '',
          resource: {
            algorithm: 'AEAD_AES_256_GCM',
            ciphertext,
            nonce,
            associated_data: associatedData,
          },
        }),
      ).toThrow('回调数据格式无效');
    });

    it('should throw on short ciphertext', () => {
      expect(() =>
        handler.decryptNotification({
          id: '1',
          create_time: '',
          event_type: '',
          resource_type: '',
          summary: '',
          resource: {
            algorithm: 'AEAD_AES_256_GCM',
            ciphertext: Buffer.from('short').toString('base64'),
            nonce: '123456789012',
          },
        }),
      ).toThrow('密文长度无效');
    });
  });

  describe('processRefundCallback', () => {
    it('should process a refund callback', () => {
      const testData = {
        mchid: '1900000100',
        out_trade_no: 'ORDER20240609001',
        transaction_id: '4200001234567890',
        out_refund_no: 'REFUND20240609001',
        refund_id: '5000001234567890',
        refund_status: 'SUCCESS',
        success_time: '2024-06-09T11:00:00+08:00',
        user_received_account: '招商银行 1234',
        amount: {
          total: 100,
          refund: 100,
          payer_total: 100,
          payer_refund: 100,
        },
      };

      const { ciphertext, nonce, associatedData } = encryptData(JSON.stringify(testData));

      const notification = {
        id: 'EV-2018022511223320874',
        create_time: '2024-06-09T11:00:01+08:00',
        event_type: 'REFUND.SUCCESS',
        resource_type: 'encrypt-resource',
        summary: '退款成功',
        resource: {
          original_type: 'refund',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const body = JSON.stringify(notification);
      const { signature, timestamp, nonce: signNonce } = signBody(body);

      const result = handler.processRefundCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('REFUND.SUCCESS');
      expect(result.data).toEqual(testData);
    });
  });
});
