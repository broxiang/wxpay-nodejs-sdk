import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { CertificateService } from '../../src/services/certificate';
import { CertificateManager } from '../../src/core/certificate';
import { WxPayClient } from '../../src/core/client';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

function createMockClient() {
  return {
    post: vi.fn(),
    get: vi.fn(),
    downloadRaw: vi.fn(),
    mchid: '1900000100',
  };
}

function encryptCertificate(pem: string, apiV3Key: string) {
  const key = Buffer.from(apiV3Key, 'utf-8');
  const nonce = Buffer.from('testnonce123', 'utf-8'); // 12 bytes for GCM
  const aad = 'certificate';
  const plaintext = Buffer.from(pem, 'utf-8');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(Buffer.from(aad, 'utf-8'));

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: 'AEAD_AES_256_GCM',
    nonce: 'testnonce123',
    associatedData: aad,
    ciphertext: Buffer.concat([encrypted, authTag]).toString('base64'),
  };
}

describe('CertificateService', () => {
  let service: CertificateService;
  let mockClient: ReturnType<typeof createMockClient>;
  let certManager: CertificateManager;
  const apiV3Key = '0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    certManager = new CertificateManager(apiV3Key);
    service = new CertificateService(mockClient as unknown as WxPayClient, apiV3Key, certManager);
  });

  describe('downloadCertificates', () => {
    it('should download and decrypt certificates', async () => {
      const fakePem = '-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJAL...\n-----END CERTIFICATE-----';
      const encrypted = encryptCertificate(fakePem, apiV3Key);

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          data: [
            {
              serialNo: 'CERT_SERIAL_001',
              effectiveTime: '2024-01-01T00:00:00+08:00',
              expireTime: '2029-01-01T00:00:00+08:00',
              encryptCertificate: encrypted,
            },
          ],
        },
      });

      const result = await service.downloadCertificates();
      expect(mockClient.get).toHaveBeenCalledWith('/v3/certificates');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].serialNo).toBe('CERT_SERIAL_001');
      expect(result.data[0].certificatePem).toBe(fakePem);
      expect(result.data[0].effectiveTime).toBe('2024-01-01T00:00:00+08:00');
      expect(result.data[0].expireTime).toBe('2029-01-01T00:00:00+08:00');
    });

    it('should download multiple certificates', async () => {
      const pem1 = '-----BEGIN CERTIFICATE-----\nCERT1\n-----END CERTIFICATE-----';
      const pem2 = '-----BEGIN CERTIFICATE-----\nCERT2\n-----END CERTIFICATE-----';
      const enc1 = encryptCertificate(pem1, apiV3Key);
      const enc2 = encryptCertificate(pem2, apiV3Key);

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          data: [
            {
              serialNo: 'S1',
              effectiveTime: '2024-01-01',
              expireTime: '2029-01-01',
              encryptCertificate: enc1,
            },
            {
              serialNo: 'S2',
              effectiveTime: '2024-06-01',
              expireTime: '2029-06-01',
              encryptCertificate: enc2,
            },
          ],
        },
      });

      const result = await service.downloadCertificates();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].certificatePem).toBe(pem1);
      expect(result.data[1].certificatePem).toBe(pem2);
    });
  });

  describe('downloadAndUpdate', () => {
    it('should download and update certificate manager', async () => {
      const fakePem = '-----BEGIN CERTIFICATE-----\nUPDATE_TEST\n-----END CERTIFICATE-----';
      const encrypted = encryptCertificate(fakePem, apiV3Key);

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          data: [
            {
              serialNo: 'CERT_UPDATE_001',
              effectiveTime: '2024-01-01',
              expireTime: '2029-01-01',
              encryptCertificate: encrypted,
            },
          ],
        },
      });

      const result = await service.downloadAndUpdate();
      expect(result).toHaveLength(1);
      expect(result[0].serialNo).toBe('CERT_UPDATE_001');

      const storedKey = certManager.getPublicKey('CERT_UPDATE_001');
      expect(storedKey).toBe(fakePem);
    });

    it('should update multiple certificates in manager', async () => {
      const pem1 = '-----BEGIN CERTIFICATE-----\nMULTI1\n-----END CERTIFICATE-----';
      const pem2 = '-----BEGIN CERTIFICATE-----\nMULTI2\n-----END CERTIFICATE-----';

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          data: [
            {
              serialNo: 'S1',
              effectiveTime: '2024-01-01',
              expireTime: '2029-01-01',
              encryptCertificate: encryptCertificate(pem1, apiV3Key),
            },
            {
              serialNo: 'S2',
              effectiveTime: '2024-06-01',
              expireTime: '2029-06-01',
              encryptCertificate: encryptCertificate(pem2, apiV3Key),
            },
          ],
        },
      });

      await service.downloadAndUpdate();
      expect(certManager.getPublicKey('S1')).toBe(pem1);
      expect(certManager.getPublicKey('S2')).toBe(pem2);
    });
  });
});
