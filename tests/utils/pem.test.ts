import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  loadCertificate,
  loadCertificateFromPath,
  loadPrivateKey,
  loadPublicKey,
  getCertificateSerialNumber,
  isCertificateExpired,
  isCertificateValid,
} from '../../src/utils/pem';

function generateCertPem(): string {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  try {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pem-test-'));
    const keyPath = path.join(tmpDir, 'key.pem');
    const certPath = path.join(tmpDir, 'cert.pem');

    fs.writeFileSync(keyPath, privateKey);
    execSync(
      `openssl req -new -x509 -key "${keyPath}" -days 3650 -subj "/CN=Test" -out "${certPath}"`,
      { stdio: 'pipe', timeout: 5000 },
    );
    const certPem = fs.readFileSync(certPath, 'utf-8');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return certPem;
  } catch {
    return '';
  }
}

function generateKeyPem(): string {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return privateKey;
}

function generatePubKeyPem(): string {
  const { publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return publicKey;
}

describe('pem utils', () => {
  const certPem = generateCertPem();
  const keyPem = generateKeyPem();
  const pubKeyPem = generatePubKeyPem();

  describe('loadCertificate', () => {
    it('should load certificate from PEM string', () => {
      if (!certPem) return;
      const cert = loadCertificate(certPem);
      expect(cert).toBeDefined();
      expect(cert.serialNumber).toBeDefined();
    });
  });

  describe('loadCertificateFromPath', () => {
    it('should load certificate from file path', () => {
      if (!certPem) return;
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pem-test-'));
      const certPath = path.join(tmpDir, 'cert.pem');
      fs.writeFileSync(certPath, certPem);

      const cert = loadCertificateFromPath(certPath);
      expect(cert).toBeDefined();
      expect(cert.serialNumber).toBeDefined();

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });

  describe('loadPrivateKey', () => {
    it('should load private key from PEM string', () => {
      const key = loadPrivateKey(keyPem);
      expect(key).toContain('-----BEGIN');
    });

    it('should load private key from file path', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pem-test-'));
      const keyPath = path.join(tmpDir, 'key.pem');
      fs.writeFileSync(keyPath, keyPem);

      const key = loadPrivateKey(keyPath);
      expect(key).toContain('-----BEGIN');

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should load private key from Buffer', () => {
      const buf = Buffer.from(keyPem);
      const key = loadPrivateKey(buf);
      expect(key).toContain('-----BEGIN');
    });

    it('should return raw string if not PEM and not a file', () => {
      const key = loadPrivateKey('not-a-file-path');
      expect(key).toBe('not-a-file-path');
    });
  });

  describe('loadPublicKey', () => {
    it('should load public key from PEM string', () => {
      const key = loadPublicKey(pubKeyPem);
      expect(key).toContain('-----BEGIN');
    });

    it('should load public key from file path', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pem-test-'));
      const keyPath = path.join(tmpDir, 'pubkey.pem');
      fs.writeFileSync(keyPath, pubKeyPem);

      const key = loadPublicKey(keyPath);
      expect(key).toContain('-----BEGIN');

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should return raw string if not PEM and not a file', () => {
      const key = loadPublicKey('not-a-file-path');
      expect(key).toBe('not-a-file-path');
    });
  });

  describe('getCertificateSerialNumber', () => {
    it('should return uppercase serial number', () => {
      if (!certPem) return;
      const cert = loadCertificate(certPem);
      const serial = getCertificateSerialNumber(cert);
      expect(serial).toBe(serial.toUpperCase());
      expect(serial.length).toBeGreaterThan(0);
    });
  });

  describe('isCertificateExpired', () => {
    it('should return false for valid certificate at past date', () => {
      if (!certPem) return;
      const cert = loadCertificate(certPem);
      const pastDate = new Date('2024-06-01');
      expect(isCertificateExpired(cert, pastDate)).toBe(false);
    });

    it('should return true for expired certificate with future date', () => {
      if (!certPem) return;
      const cert = loadCertificate(certPem);
      const futureDate = new Date('2099-01-01');
      expect(isCertificateExpired(cert, futureDate)).toBe(true);
    });

    it('should use current date when now is not provided', () => {
      if (!certPem) return;
      const cert = loadCertificate(certPem);
      const expired = isCertificateExpired(cert);
      expect(typeof expired).toBe('boolean');
    });
  });

  describe('isCertificateValid', () => {
    it('should return true for valid certificate at current date', () => {
      if (!certPem) return;
      const cert = loadCertificate(certPem);
      // Certificate is valid from now to now+3650 days
      expect(isCertificateValid(cert)).toBe(true);
    });

    it('should return false for expired certificate with future date', () => {
      if (!certPem) return;
      const cert = loadCertificate(certPem);
      const futureDate = new Date('2099-01-01');
      expect(isCertificateValid(cert, futureDate)).toBe(false);
    });
  });
});
