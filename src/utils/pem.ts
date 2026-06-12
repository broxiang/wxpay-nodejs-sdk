import crypto from 'node:crypto';
import fs from 'node:fs';

/**
 * 从 PEM 字符串加载 X.509 证书
 */
export function loadCertificate(certificate: string): crypto.X509Certificate {
  return new crypto.X509Certificate(certificate);
}

/**
 * 从文件路径加载 X.509 证书
 */
export function loadCertificateFromPath(path: string): crypto.X509Certificate {
  return new crypto.X509Certificate(fs.readFileSync(path, 'utf-8'));
}

/**
 * 加载私钥内容（支持 PEM 字符串、文件路径、Buffer）
 */
export function loadPrivateKey(key: string | Buffer): string {
  if (Buffer.isBuffer(key)) return key.toString('utf-8');
  if (key.startsWith('-----BEGIN')) return key;
  try {
    return fs.readFileSync(key, 'utf-8');
  } catch {
    return key;
  }
}

/**
 * 加载公钥内容（支持 PEM 字符串、文件路径、Buffer）
 */
export function loadPublicKey(key: string | Buffer): string {
  if (Buffer.isBuffer(key)) return key.toString('utf-8');
  if (key.startsWith('-----BEGIN')) return key;
  try {
    return fs.readFileSync(key, 'utf-8');
  } catch {
    return key;
  }
}

/**
 * 获取 X.509 证书序列号（大写十六进制）
 */
export function getCertificateSerialNumber(cert: crypto.X509Certificate): string {
  return cert.serialNumber.toUpperCase();
}

/**
 * 判断证书是否已过期
 *
 * @param cert - X.509 证书
 * @param now - 检查时间点，默认为当前时间
 */
export function isCertificateExpired(cert: crypto.X509Certificate, now?: Date): boolean {
  const checkTime = now ?? new Date();
  const validTo = new Date(cert.validTo);
  return checkTime > validTo;
}

/**
 * 判断证书是否在有效期内
 *
 * @param cert - X.509 证书
 * @param now - 检查时间点，默认为当前时间
 */
export function isCertificateValid(cert: crypto.X509Certificate, now?: Date): boolean {
  const checkTime = now ?? new Date();
  const validFrom = new Date(cert.validFrom);
  const validTo = new Date(cert.validTo);
  return checkTime >= validFrom && checkTime <= validTo;
}
