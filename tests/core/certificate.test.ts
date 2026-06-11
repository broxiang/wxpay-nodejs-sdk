import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { CertificateManager } from '../../src/core/certificate';
import type { PlatformCertificate } from '../../src/types';

describe('CertificateManager', () => {
  let manager: CertificateManager;
  const apiV3Key = '0123456789abcdef0123456789abcdef'; // 32字节密钥

  // 生成测试用的 RSA 密钥对
  const { publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // 辅助函数：用 AES-256-GCM 加密证书内容
  let nonceCounter = 0;
  function encryptCertificate(content: string): {
    ciphertext: string;
    nonce: string;
    associatedData: string;
  } {
    // 生成12字节的nonce，使用计数器确保唯一性
    nonceCounter++;
    const nonce = `nonce${String(nonceCounter).padStart(7, '0')}`;
    const associatedData = 'certificate';
    const key = Buffer.from(apiV3Key, 'utf-8');
    const nonceBuffer = Buffer.from(nonce, 'utf-8');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonceBuffer);

    cipher.setAAD(Buffer.from(associatedData, 'utf-8'));

    const encrypted = Buffer.concat([cipher.update(content, 'utf-8'), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return {
      ciphertext: Buffer.concat([encrypted, authTag]).toString('base64'),
      nonce,
      associatedData,
    };
  }

  beforeEach(() => {
    manager = new CertificateManager(apiV3Key);
  });

  // ============= constructor =============

  describe('constructor', () => {
    it('should create empty manager without certificates', () => {
      const emptyManager = new CertificateManager(apiV3Key);
      expect(emptyManager.serialNos).toEqual([]);
    });

    it('should initialize with provided certificates', () => {
      const encrypted = encryptCertificate(publicKey);
      const cert: PlatformCertificate = {
        serialNo: 'CERT001',
        effectiveTime: '2024-01-01T00:00:00+08:00',
        expireTime: '2025-01-01T00:00:00+08:00',
        encryptCertificate: {
          algorithm: 'AEAD_AES_256_GCM',
          nonce: encrypted.nonce,
          associatedData: encrypted.associatedData,
          ciphertext: encrypted.ciphertext,
        },
      };

      const certManager = new CertificateManager(apiV3Key, [cert]);
      expect(certManager.serialNos).toContain('CERT001');
    });
  });

  // ============= serialNos =============

  describe('serialNos', () => {
    it('should return empty array when no certificates', () => {
      expect(manager.serialNos).toEqual([]);
    });

    it('should return all certificate serial numbers', () => {
      const encrypted = encryptCertificate(publicKey);

      const cert1: PlatformCertificate = {
        serialNo: 'CERT001',
        effectiveTime: '2024-01-01T00:00:00+08:00',
        expireTime: '2025-01-01T00:00:00+08:00',
        encryptCertificate: {
          algorithm: 'AEAD_AES_256_GCM',
          nonce: encrypted.nonce,
          associatedData: encrypted.associatedData,
          ciphertext: encrypted.ciphertext,
        },
      };

      const cert2: PlatformCertificate = {
        serialNo: 'CERT002',
        effectiveTime: '2024-01-01T00:00:00+08:00',
        expireTime: '2025-01-01T00:00:00+08:00',
        encryptCertificate: {
          algorithm: 'AEAD_AES_256_GCM',
          nonce: encrypted.nonce,
          associatedData: encrypted.associatedData,
          ciphertext: encrypted.ciphertext,
        },
      };

      manager.updateCertificates([cert1, cert2]);

      expect(manager.serialNos).toContain('CERT001');
      expect(manager.serialNos).toContain('CERT002');
      expect(manager.serialNos).toHaveLength(2);
    });
  });

  // ============= getPublicKey =============

  describe('getPublicKey', () => {
    it('should return null for unknown serial number', () => {
      expect(manager.getPublicKey('UNKNOWN')).toBeNull();
    });

    it('should decrypt and return public key from encrypted certificate', () => {
      const encrypted = encryptCertificate(publicKey);

      const cert: PlatformCertificate = {
        serialNo: 'CERT001',
        effectiveTime: '2024-01-01T00:00:00+08:00',
        expireTime: '2025-01-01T00:00:00+08:00',
        encryptCertificate: {
          algorithm: 'AEAD_AES_256_GCM',
          nonce: encrypted.nonce,
          associatedData: encrypted.associatedData,
          ciphertext: encrypted.ciphertext,
        },
      };

      manager.updateCertificates([cert]);

      const result = manager.getPublicKey('CERT001');
      expect(result).toBe(publicKey);
    });

    it('should return raw public key when algorithm is RAW_PUBLIC_KEY', () => {
      const cert: PlatformCertificate = {
        serialNo: 'CERT_RAW',
        effectiveTime: '2024-01-01T00:00:00+08:00',
        expireTime: '2025-01-01T00:00:00+08:00',
        encryptCertificate: {
          algorithm: 'RAW_PUBLIC_KEY',
          nonce: '',
          associated_data: '',
          ciphertext: Buffer.from(publicKey, 'utf-8').toString('base64'),
        },
      };

      manager.updateCertificates([cert]);

      const result = manager.getPublicKey('CERT_RAW');
      expect(result).toBe(publicKey);
    });

    it('should return null for invalid encrypted data', () => {
      const cert: PlatformCertificate = {
        serialNo: 'CERT_INVALID',
        effectiveTime: '2024-01-01T00:00:00+08:00',
        expireTime: '2025-01-01T00:00:00+08:00',
        encryptCertificate: {
          algorithm: 'AEAD_AES_256_GCM',
          nonce: 'invalidnonce',
          associated_data: 'certificate',
          ciphertext: 'invalidbase64data',
        },
      };

      manager.updateCertificates([cert]);

      const result = manager.getPublicKey('CERT_INVALID');
      expect(result).toBeNull();
    });
  });

  // ============= updateCertificates =============

  describe('updateCertificates', () => {
    it('should add new certificates', () => {
      const encrypted = encryptCertificate(publicKey);

      const cert: PlatformCertificate = {
        serialNo: 'CERT001',
        effectiveTime: '2024-01-01T00:00:00+08:00',
        expireTime: '2025-01-01T00:00:00+08:00',
        encryptCertificate: {
          algorithm: 'AEAD_AES_256_GCM',
          nonce: encrypted.nonce,
          associatedData: encrypted.associatedData,
          ciphertext: encrypted.ciphertext,
        },
      };

      manager.updateCertificates([cert]);

      expect(manager.serialNos).toContain('CERT001');
      expect(manager.getPublicKey('CERT001')).toBe(publicKey);
    });

    it('should update existing certificate', () => {
      // 使用 setPublicKey 测试更新功能
      manager.setPublicKey('CERT001', publicKey);
      expect(manager.serialNos).toHaveLength(1);
      expect(manager.getPublicKey('CERT001')).toBe(publicKey);

      // 更新同一个序列号的证书
      manager.setPublicKey('CERT001', publicKey);
      expect(manager.serialNos).toHaveLength(1);
      expect(manager.getPublicKey('CERT001')).toBe(publicKey);
    });
  });

  // ============= setPublicKey =============

  describe('setPublicKey', () => {
    it('should set public key directly', () => {
      manager.setPublicKey('CERT001', publicKey);

      expect(manager.serialNos).toContain('CERT001');
      expect(manager.getPublicKey('CERT001')).toBe(publicKey);
    });

    it('should overwrite existing public key', () => {
      manager.setPublicKey('CERT001', publicKey);
      manager.setPublicKey('CERT001', publicKey);

      expect(manager.serialNos).toHaveLength(1);
      expect(manager.getPublicKey('CERT001')).toBe(publicKey);
    });
  });

  // ============= clear =============

  describe('clear', () => {
    it('should clear all certificates', () => {
      manager.setPublicKey('CERT001', publicKey);
      manager.setPublicKey('CERT002', publicKey);

      expect(manager.serialNos).toHaveLength(2);

      manager.clear();

      expect(manager.serialNos).toEqual([]);
      expect(manager.getPublicKey('CERT001')).toBeNull();
    });
  });
});
