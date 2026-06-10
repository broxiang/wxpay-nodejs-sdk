import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { CallbackHandler } from '../src/services/callback.js';
import { CertificateManager } from '../src/core/certificate.js';

describe('CallbackHandler - PayScore', () => {
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
    const associatedData = 'payscore';
    const key = Buffer.from(apiV3Key, 'utf-8');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf-8'));
    cipher.setAAD(Buffer.from(associatedData, 'utf-8'));

    const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([encrypted, authTag]).toString('base64');

    return { ciphertext, nonce, associatedData };
  }

  describe('processPayScoreUserConfirmCallback', () => {
    it('should verify and decrypt a pay score user confirm callback', () => {
      const testData = {
        appid: 'wxd678efh567hg6787',
        mchid: '1230000109',
        out_order_no: '1234323JKHDFE1243252',
        service_id: '2002000000000558128851361561536',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        state: 'DOING',
        state_description: 'USER_CONFIRM',
        total_amount: 4000,
        service_introduction: 'XX充电宝',
        post_payments: [
          {
            name: '充电服务费',
            amount: 4000,
            description: '充电2小时',
            count: 1,
          },
        ],
        post_discounts: [
          {
            name: '首单优惠',
            description: '新用户立减',
            amount: 100,
          },
        ],
        risk_fund: {
          name: 'ESTIMATE_ORDER_COST',
          amount: 10000,
          description: '预估服务费',
        },
        time_range: {
          start_time: '20091225091010',
          end_time: '20091225121010',
        },
        location: {
          start_location: '深圳市南山区科技园',
          end_location: '深圳市南山区科技园',
        },
        attach: 'custom_data',
        order_id: '0000300001201908301055157220022',
        need_collection: true,
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
      );

      const notification = {
        id: 'EV-2018022511223320873',
        create_time: '2024-06-09T10:30:01+08:00',
        event_type: 'PAYSCORE.USER_CONFIRM',
        resource_type: 'encrypt-resource',
        summary: '确认订单',
        resource: {
          original_type: 'payscore',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const body = JSON.stringify(notification);
      const { signature, timestamp, nonce: signNonce } = signBody(body);

      const result = handler.processPayScoreUserConfirmCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('PAYSCORE.USER_CONFIRM');
      expect(result.summary).toBe('确认订单');
      expect(result.data).toEqual(testData);
      expect(result.data.appid).toBe('wxd678efh567hg6787');
      expect(result.data.state).toBe('DOING');
      expect(result.data.state_description).toBe('USER_CONFIRM');
      expect(result.data.service_introduction).toBe('XX充电宝');
      expect(result.data.post_payments).toHaveLength(1);
      expect(result.data.post_payments?.[0]?.name).toBe('充电服务费');
      expect(result.data.risk_fund.name).toBe('ESTIMATE_ORDER_COST');
      expect(result.data.risk_fund.amount).toBe(10000);
    });
  });

  describe('processPayScoreUserPaidCallback', () => {
    it('should verify and decrypt a pay score user paid callback', () => {
      const testData = {
        appid: 'wxd678efh567hg6787',
        mchid: '1230000109',
        out_order_no: '1234323JKHDFE1243252',
        service_id: '2002000000000558128851361561536',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        state: 'DONE',
        state_description: 'MCH_COMPLETE',
        total_amount: 4000,
        service_introduction: 'XX充电宝',
        post_payments: [
          {
            name: '充电服务费',
            amount: 4000,
            description: '充电2小时',
            count: 1,
          },
        ],
        risk_fund: {
          name: 'ESTIMATE_ORDER_COST',
          amount: 10000,
          description: '预估服务费',
        },
        time_range: {
          start_time: '20091225091010',
          end_time: '20091225121010',
        },
        location: {
          start_location: '深圳市南山区科技园',
          end_location: '深圳市南山区科技园',
        },
        attach: 'custom_data',
        order_id: '0000300001201908301055157220022',
        need_collection: true,
        collection: {
          state: 'USER_PAID',
          total_amount: 4000,
          paying_amount: 0,
          paid_amount: 4000,
          details: [
            {
              seq: 1,
              amount: 4000,
              paid_type: 'NEWTON',
              paid_time: '20091225091210',
              transaction_id: '4200001234567890',
            },
          ],
        },
        promotion_detail: [
          {
            coupon_id: '123456',
            name: '满10减2',
            scope: 'GLOBAL',
            type: 'CASH',
            amount: 200,
            stock_id: 'STOCK001',
            wechatpay_contribute: 100,
            merchant_contribute: 100,
            other_contribute: 0,
            currency: 'CNY',
          },
        ],
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
      );

      const notification = {
        id: 'EV-2018022511223320874',
        create_time: '2024-06-09T11:00:01+08:00',
        event_type: 'PAYSCORE.USER_PAID',
        resource_type: 'encrypt-resource',
        summary: '支付成功',
        resource: {
          original_type: 'payscore',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const body = JSON.stringify(notification);
      const { signature, timestamp, nonce: signNonce } = signBody(body);

      const result = handler.processPayScoreUserPaidCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('PAYSCORE.USER_PAID');
      expect(result.summary).toBe('支付成功');
      expect(result.data.state).toBe('DONE');
      expect(result.data.collection).toBeDefined();
      expect(result.data.collection?.state).toBe('USER_PAID');
      expect(result.data.collection?.details).toHaveLength(1);
      expect(result.data.collection?.details?.[0]?.paid_type).toBe('NEWTON');
      expect(result.data.collection?.details?.[0]?.amount).toBe(4000);
      expect(result.data.promotion_detail).toHaveLength(1);
      expect(result.data.promotion_detail?.[0]?.coupon_id).toBe('123456');
      expect(result.data.promotion_detail?.[0]?.name).toBe('满10减2');
      expect(result.data.promotion_detail?.[0]?.amount).toBe(200);
    });
  });

  describe('processPayScoreRefundCallback', () => {
    it('should verify and decrypt a pay score refund success callback', () => {
      const testData = {
        mchid: '1230000109',
        out_order_no: '1234323JKHDFE1243252',
        order_id: '0000300001201908301055157220022',
        out_refund_no: 'REFUND20240115001',
        refund_id: '5000001234567890',
        refund_status: 'SUCCESS',
        success_time: '2024-01-15T12:00:00+08:00',
        user_received_account: '招商银行 1234',
        amount: {
          total: 4000,
          refund: 4000,
          payer_total: 4000,
          payer_refund: 4000,
        },
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
      );

      const notification = {
        id: 'EV-2018022511223320875',
        create_time: '2024-01-15T12:00:01+08:00',
        event_type: 'REFUND.SUCCESS',
        resource_type: 'encrypt-resource',
        summary: '退款成功',
        resource: {
          original_type: 'payscore',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const body = JSON.stringify(notification);
      const { signature, timestamp, nonce: signNonce } = signBody(body);

      const result = handler.processPayScoreRefundCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('REFUND.SUCCESS');
      expect(result.data.out_refund_no).toBe('REFUND20240115001');
      expect(result.data.refund_status).toBe('SUCCESS');
      expect(result.data.amount.refund).toBe(4000);
    });

    it('should verify and decrypt a pay score refund abnormal callback', () => {
      const testData = {
        mchid: '1230000109',
        out_order_no: '1234323JKHDFE1243253',
        order_id: '0000300001201908301055157220023',
        out_refund_no: 'REFUND20240115002',
        refund_id: '5000001234567891',
        refund_status: 'ABNORMAL',
        amount: {
          total: 2000,
          refund: 2000,
          payer_total: 2000,
          payer_refund: 2000,
        },
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
      );

      const notification = {
        id: 'EV-2018022511223320876',
        create_time: '2024-01-15T13:00:01+08:00',
        event_type: 'REFUND.ABNORMAL',
        resource_type: 'encrypt-resource',
        summary: '退款异常',
        resource: {
          original_type: 'payscore',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const body = JSON.stringify(notification);
      const { signature, timestamp, nonce: signNonce } = signBody(body);

      const result = handler.processPayScoreRefundCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('REFUND.ABNORMAL');
      expect(result.data.refund_status).toBe('ABNORMAL');
    });

    it('should verify and decrypt a pay score refund closed callback', () => {
      const testData = {
        mchid: '1230000109',
        out_order_no: '1234323JKHDFE1243254',
        order_id: '0000300001201908301055157220024',
        out_refund_no: 'REFUND20240115003',
        refund_id: '5000001234567892',
        refund_status: 'CLOSED',
        amount: {
          total: 3000,
          refund: 3000,
          payer_total: 3000,
          payer_refund: 3000,
        },
      };

      const { ciphertext, nonce, associatedData } = encryptData(
        JSON.stringify(testData),
      );

      const notification = {
        id: 'EV-2018022511223320877',
        create_time: '2024-01-15T14:00:01+08:00',
        event_type: 'REFUND.CLOSED',
        resource_type: 'encrypt-resource',
        summary: '退款关闭',
        resource: {
          original_type: 'payscore',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      };

      const body = JSON.stringify(notification);
      const { signature, timestamp, nonce: signNonce } = signBody(body);

      const result = handler.processPayScoreRefundCallback(
        {
          'wechatpay-signature': signature,
          'wechatpay-timestamp': timestamp,
          'wechatpay-nonce': signNonce,
          'wechatpay-serial': 'TEST_SERIAL_001',
        },
        body,
      );

      expect(result.event_type).toBe('REFUND.CLOSED');
      expect(result.data.refund_status).toBe('CLOSED');
    });
  });
});
