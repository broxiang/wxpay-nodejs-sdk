import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { CallbackHandler } from '../src/services/callback.js';
import { CertificateManager } from '../src/core/certificate.js';

describe('CallbackHandler - Parking', () => {
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
  function encryptData(
    data: string,
    associatedData: string,
  ): {
    ciphertext: string;
    nonce: string;
    associatedData: string;
  } {
    const nonce = crypto.randomBytes(12).toString('utf-8').slice(0, 12);
    const key = Buffer.from(apiV3Key, 'utf-8');

    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(nonce, 'utf-8'),
    );
    cipher.setAAD(Buffer.from(associatedData, 'utf-8'));

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf-8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([encrypted, authTag]).toString('base64');

    return { ciphertext, nonce, associatedData };
  }

  describe('processParkingEntryStatusCallback', () => {
    it('should verify and decrypt a parking entry status callback', () => {
      const testData = {
        sp_mchid: '1230000109',
        parking_id: '50000000002024060900000000001',
        out_parking_no: 'parking_20240609_001',
        plate_number: '粤B888888',
        plate_color: 'BLUE',
        start_time: '2024-06-09T10:30:00+08:00',
        parking_name: '深圳科技园停车场',
        free_duration: 900,
        parking_state: 'NORMAL',
        state_update_time: '2024-06-09T10:30:05+08:00',
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
        'parking',
      );

      const notification = {
        id: 'EV-20240609103005001',
        create_time: '2024-06-09T10:30:05+08:00',
        event_type: 'PARKING_ENTRY_STATUS_CHANGE',
        resource_type: 'encrypt-resource',
        summary: '停车入场状态变更',
        resource: {
          original_type: 'parking',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const body = JSON.stringify(notification);
      const { signature, timestamp, nonce: signNonce } = signBody(body);

      const result = handler.processParkingEntryStatusCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('PARKING_ENTRY_STATUS_CHANGE');
      expect(result.summary).toBe('停车入场状态变更');
      expect(result.data).toEqual(testData);
      expect(result.data.sp_mchid).toBe('1230000109');
      expect(result.data.parking_id).toBe('50000000002024060900000000001');
      expect(result.data.plate_number).toBe('粤B888888');
      expect(result.data.plate_color).toBe('BLUE');
      expect(result.data.parking_state).toBe('NORMAL');
    });

    it('should handle BLOCKED state with blocked_state_description', () => {
      const testData = {
        sp_mchid: '1230000109',
        parking_id: '50000000002024060900000000002',
        out_parking_no: 'parking_20240609_002',
        plate_number: '粤B999999',
        plate_color: 'GREEN',
        start_time: '2024-06-09T11:00:00+08:00',
        parking_name: '深圳南山停车场',
        free_duration: 600,
        parking_state: 'BLOCKED',
        blocked_state_description: 'PAUSE',
        state_update_time: '2024-06-09T11:05:00+08:00',
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
        'parking',
      );

      const notification = {
        id: 'EV-20240609110500001',
        create_time: '2024-06-09T11:05:00+08:00',
        event_type: 'PARKING_ENTRY_STATUS_CHANGE',
        resource_type: 'encrypt-resource',
        summary: '停车入场状态变更',
        resource: {
          original_type: 'parking',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const body = JSON.stringify(notification);
      const { signature, timestamp, nonce: signNonce } = signBody(body);

      const result = handler.processParkingEntryStatusCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.data.parking_state).toBe('BLOCKED');
      expect(result.data.blocked_state_description).toBe('PAUSE');
    });
  });

  describe('processParkingTransactionCallback', () => {
    it('should verify and decrypt a parking transaction success callback', () => {
      const testData = {
        appid: 'wxd678efh567hg6787',
        sp_mchid: '1230000109',
        out_trade_no: 'PARKING_20240609_001',
        transaction_id: '4200001234567890',
        description: '深圳科技园停车费',
        create_time: '2024-06-09T12:00:05+08:00',
        trade_state: 'SUCCESS',
        success_time: '2024-06-09T12:00:05+08:00',
        bank_type: 'BPA',
        user_repaid: 'N',
        trade_scene: 'PARKING',
        payer: {
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        },
        amount: {
          total: 1500,
          currency: 'CNY',
          payer_total: 1500,
          discount_total: 0,
        },
        parking_info: {
          parking_id: '50000000002024060900000000001',
          plate_number: '粤B888888',
          plate_color: 'BLUE',
          start_time: '2024-06-09T10:30:00+08:00',
          end_time: '2024-06-09T12:00:00+08:00',
          parking_name: '深圳科技园停车场',
          charging_duration: 5400,
          device_id: 'DEVICE_SHENZHEN_001',
        },
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
        'transaction',
      );

      const notification = {
        id: 'EV-20240609120005001',
        create_time: '2024-06-09T12:00:05+08:00',
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

      const result = handler.processParkingTransactionCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('TRANSACTION.SUCCESS');
      expect(result.summary).toBe('支付成功');
      expect(result.data.trade_state).toBe('SUCCESS');
      expect(result.data.trade_scene).toBe('PARKING');
      expect(result.data.parking_info?.parking_id).toBe(
        '50000000002024060900000000001',
      );
      expect(result.data.parking_info?.plate_number).toBe('粤B888888');
      expect(result.data.bank_type).toBe('BPA');
      expect(result.data.user_repaid).toBe('N');
    });

    it('should handle TRANSACTION.FAIL callback', () => {
      const testData = {
        appid: 'wxd678efh567hg6787',
        sp_mchid: '1230000109',
        out_trade_no: 'PARKING_20240609_002',
        description: '深圳南山停车费',
        create_time: '2024-06-09T13:00:00+08:00',
        trade_state: 'PAY_FAIL',
        trade_state_description: '用户余额不足',
        trade_scene: 'PARKING',
        amount: {
          total: 2000,
          currency: 'CNY',
        },
        parking_info: {
          parking_id: '50000000002024060900000000002',
          plate_number: '粤B999999',
          plate_color: 'GREEN',
          start_time: '2024-06-09T11:00:00+08:00',
          end_time: '2024-06-09T13:00:00+08:00',
          parking_name: '深圳南山停车场',
          charging_duration: 7200,
          device_id: 'DEVICE_SHENZHEN_002',
        },
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
        'transaction',
      );

      const notification = {
        id: 'EV-20240609130000001',
        create_time: '2024-06-09T13:00:00+08:00',
        event_type: 'TRANSACTION.FAIL',
        resource_type: 'encrypt-resource',
        summary: '支付失败',
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

      const result = handler.processParkingTransactionCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('TRANSACTION.FAIL');
      expect(result.data.trade_state).toBe('PAY_FAIL');
      expect(result.data.trade_state_description).toBe('用户余额不足');
    });
  });

  describe('processParkingRefundCallback', () => {
    it('should verify and decrypt a parking refund success callback', () => {
      const testData = {
        mchid: '1230000109',
        out_trade_no: 'PARKING_20240609_001',
        transaction_id: '4200001234567890',
        out_refund_no: 'REFUND_PARKING_20240609_001',
        refund_id: '50000000002024060900000000001',
        refund_status: 'SUCCESS',
        success_time: '2024-06-09T13:00:30+08:00',
        user_received_account: '支付用户零钱',
        amount: {
          total: 1500,
          refund: 1500,
          payer_total: 1500,
          payer_refund: 1500,
        },
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
        'refund',
      );

      const notification = {
        id: 'EV-20240609130030001',
        create_time: '2024-06-09T13:00:30+08:00',
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

      const result = handler.processParkingRefundCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('REFUND.SUCCESS');
      expect(result.summary).toBe('退款成功');
      expect(result.data.refund_status).toBe('SUCCESS');
      expect(result.data.refund_id).toBe('50000000002024060900000000001');
      expect(result.data.amount.refund).toBe(1500);
      expect(result.data.user_received_account).toBe('支付用户零钱');
    });
  });
});
