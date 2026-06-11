import { oaepEncrypt, oaepDecrypt } from './sign.js';

/**
 * 敏感信息加密标记
 *
 * 在 TypeScript 接口中，使用此标记的字段会被自动加密。
 * 对应 Go SDK 的 `encryption:"EM_APIV3"` 结构体标签。
 */

/** 敏感字段注册表 */
const sensitiveFields = new Map<string, Set<string>>();

/**
 * 注册敏感字段
 *
 * 标记某个类型的哪些字段是敏感信息，需要自动加解密。
 *
 * @param typeName - 类型名称（通常是接口名）
 * @param fields - 敏感字段名列表
 *
 * @example
 * ```ts
 * interface AddReceiverRequest {
 *   name?: string;
 *   type: string;
 * }
 * registerSensitiveFields('AddReceiverRequest', ['name']);
 * ```
 */
export function registerSensitiveFields(typeName: string, fields: string[]): void {
  sensitiveFields.set(typeName, new Set(fields));
}

/**
 * 获取已注册的敏感字段
 *
 * @param typeName - 类型名称
 * @returns 敏感字段集合，未注册则返回空集合
 */
export function getSensitiveFields(typeName: string): Set<string> {
  return sensitiveFields.get(typeName) ?? new Set();
}

/**
 * 自动加密对象中的敏感字段
 *
 * 根据注册的敏感字段信息，使用微信支付公钥加密指定字段。
 * 加密后的字段值为 Base64 编码的密文。
 *
 * @param obj - 待加密的对象
 * @param typeName - 类型名称
 * @param publicKey - 微信支付公钥（PEM 格式）
 * @returns 加密后的对象副本
 *
 * @example
 * ```ts
 * const request = { name: '张三', type: 'PERSONAL_OPENID' };
 * const encrypted = encryptSensitiveFields(request, 'AddReceiverRequest', publicKey);
 * // encrypted.name 为加密后的 Base64 密文
 * ```
 */
export function encryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  typeName: string,
  publicKey: string | Buffer,
): T {
  const fields = getSensitiveFields(typeName);
  if (fields.size === 0) return obj;

  const result = { ...obj };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0) {
      (result as Record<string, unknown>)[field] = oaepEncrypt(value, publicKey);
    }
  }
  return result;
}

/**
 * 自动解密对象中的敏感字段
 *
 * 根据注册的敏感字段信息，使用商户私钥解密指定字段。
 *
 * @param obj - 待解密的对象
 * @param typeName - 类型名称
 * @param privateKey - 商户私钥（PEM 格式）
 * @returns 解密后的对象副本
 *
 * @example
 * ```ts
 * const response = { name: 'Base64密文...', type: 'PERSONAL_OPENID' };
 * const decrypted = decryptSensitiveFields(response, 'ReceiverInfo', privateKey);
 * // decrypted.name 为解密后的明文
 * ```
 */
export function decryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  typeName: string,
  privateKey: string | Buffer,
): T {
  const fields = getSensitiveFields(typeName);
  if (fields.size === 0) return obj;

  const result = { ...obj };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0) {
      try {
        (result as Record<string, unknown>)[field] = oaepDecrypt(value, privateKey);
      } catch {
        // 解密失败保留原值（可能是未加密的明文）
      }
    }
  }
  return result;
}

/**
 * 批量加密数组中每个对象的敏感字段
 *
 * @param arr - 待加密的对象数组
 * @param typeName - 类型名称
 * @param publicKey - 微信支付公钥（PEM 格式）
 * @returns 加密后的数组副本
 */
export function encryptSensitiveFieldsInArray<T extends Record<string, unknown>>(
  arr: T[],
  typeName: string,
  publicKey: string | Buffer,
): T[] {
  return arr.map((item) => encryptSensitiveFields(item, typeName, publicKey));
}

/**
 * 批量解密数组中每个对象的敏感字段
 *
 * @param arr - 待解密的对象数组
 * @param typeName - 类型名称
 * @param privateKey - 商户私钥（PEM 格式）
 * @returns 解密后的数组副本
 */
export function decryptSensitiveFieldsInArray<T extends Record<string, unknown>>(
  arr: T[],
  typeName: string,
  privateKey: string | Buffer,
): T[] {
  return arr.map((item) => decryptSensitiveFields(item, typeName, privateKey));
}
