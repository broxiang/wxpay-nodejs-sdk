import crypto from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerSensitiveFields,
  getSensitiveFields,
  encryptSensitiveFields,
  decryptSensitiveFields,
  encryptSensitiveFieldsInArray,
  decryptSensitiveFieldsInArray,
} from '../src/utils/sensitive.js';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

describe('sensitive', () => {
  beforeEach(() => {
    // 清理注册表
    registerSensitiveFields('TestType', []);
  });

  it('should register and get sensitive fields', () => {
    registerSensitiveFields('Receiver', ['name', 'id_card']);
    const fields = getSensitiveFields('Receiver');
    expect(fields.has('name')).toBe(true);
    expect(fields.has('id_card')).toBe(true);
    expect(fields.size).toBe(2);
  });

  it('should return empty set for unregistered type', () => {
    const fields = getSensitiveFields('UnknownType');
    expect(fields.size).toBe(0);
  });

  it('should encrypt and decrypt sensitive fields', () => {
    registerSensitiveFields('Person', ['name']);
    const obj = { name: '张三', type: 'PERSONAL' };

    const encrypted = encryptSensitiveFields(obj, 'Person', publicKey);
    expect(encrypted.name).not.toBe('张三');
    expect(typeof encrypted.name).toBe('string');
    expect(encrypted.type).toBe('PERSONAL');

    const decrypted = decryptSensitiveFields(encrypted, 'Person', privateKey);
    expect(decrypted.name).toBe('张三');
  });

  it('should return obj unchanged when no fields registered', () => {
    const obj = { name: '张三' };
    const result = encryptSensitiveFields(obj, 'EmptyType', publicKey);
    expect(result).toBe(obj);
  });

  it('should skip non-string or empty fields', () => {
    registerSensitiveFields('Mixed', ['name', 'age', 'empty']);
    const obj = { name: '张三', age: 25, empty: '' };
    const encrypted = encryptSensitiveFields(obj, 'Mixed', publicKey);
    expect(encrypted.name).not.toBe('张三');
    expect(encrypted.age).toBe(25);
    expect(encrypted.empty).toBe('');
  });

  it('should encrypt and decrypt arrays', () => {
    registerSensitiveFields('Item', ['name']);
    const arr = [
      { name: '张三', id: '1' },
      { name: '李四', id: '2' },
    ];

    const encrypted = encryptSensitiveFieldsInArray(arr, 'Item', publicKey);
    expect(encrypted[0]?.name).not.toBe('张三');
    expect(encrypted[1]?.name).not.toBe('李四');

    const decrypted = decryptSensitiveFieldsInArray(encrypted, 'Item', privateKey);
    expect(decrypted[0]?.name).toBe('张三');
    expect(decrypted[1]?.name).toBe('李四');
  });
});
