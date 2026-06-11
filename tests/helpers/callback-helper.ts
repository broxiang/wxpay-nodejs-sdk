import crypto from 'node:crypto';
import { CallbackHandler } from '../../src/services/callback.js';
import { CertificateManager } from '../../src/core/certificate.js';

/**
 * 回调通知测试辅助工具
 */
export function createCallbackTestHelper(apiV3Key = '0123456789abcdef0123456789abcdef') {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

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

  certificates.setPublicKey('TEST_SERIAL_001', publicKey);
  const handler = new CallbackHandler(apiV3Key, certificates);

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

  function encryptData(
    data: string,
    associatedData = 'transaction',
  ): {
    ciphertext: string;
    nonce: string;
    associatedData: string;
  } {
    const nonce = crypto.randomBytes(12).toString('utf-8').slice(0, 12);
    const key = Buffer.from(apiV3Key, 'utf-8');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf-8'));
    cipher.setAAD(Buffer.from(associatedData, 'utf-8'));

    const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([encrypted, authTag]).toString('base64');

    return { ciphertext, nonce, associatedData };
  }

  function createNotification<T>(
    data: T,
    eventType: string,
    summary: string,
    associatedData = 'transaction',
  ) {
    const { ciphertext, nonce } = encryptData(JSON.stringify(data), associatedData);

    return {
      notification: {
        id: `EV-${Date.now()}`,
        create_time: new Date().toISOString(),
        event_type: eventType,
        resource_type: 'encrypt-resource',
        summary,
        resource: {
          original_type: 'transaction',
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext,
          associated_data: associatedData,
          nonce,
        },
      },
      ciphertext,
      nonce,
      associatedData,
    };
  }

  function processCallback<T>(
    data: T,
    eventType: string,
    summary: string,
    methodName: keyof CallbackHandler,
    associatedData = 'transaction',
  ) {
    const { notification } = createNotification(data, eventType, summary, associatedData);

    const body = JSON.stringify(notification);
    const { signature, timestamp, nonce: signNonce } = signBody(body);

    const method = handler[methodName] as (...args: unknown[]) => unknown;
    return method.call(
      handler,
      {
        'wechatpay-signature': signature,
        'wechatpay-timestamp': timestamp,
        'wechatpay-nonce': signNonce,
        'wechatpay-serial': 'TEST_SERIAL_001',
      },
      body,
    );
  }

  return {
    handler,
    certificates,
    signBody,
    encryptData,
    createNotification,
    processCallback,
  };
}
