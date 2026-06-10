import crypto from 'node:crypto';

/**
 * 微信支付 API V3 签名工具
 *
 * 签名算法: 使用商户私钥对签名串进行 RSA-SHA256 签名
 * 签名串格式: HTTP方法\nURL路径\n时间戳\n随机数\n请求体\n
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012365342
 */

/** 签名串的组成部分 */
export interface SignPayload {
  /** HTTP 请求方法 (GET/POST/PUT/DELETE) */
  method: string;
  /** 请求 URL 路径（含查询参数，不含域名），如 /v3/pay/transactions/jsapi?mchid=123 */
  path: string;
  /** Unix 时间戳（秒） */
  timestamp: number;
  /** 随机字符串 */
  nonce: string;
  /** 请求体（GET 请求为空字符串） */
  body: string;
}

/**
 * 构建签名串
 */
export function buildSignString(payload: SignPayload): string {
  const { method, path, timestamp, nonce, body } = payload;
  return `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`;
}

/**
 * 使用 RSA-SHA256 对签名串进行签名
 *
 * @param signString - 待签名字符串
 * @param privateKey - PEM 格式的商户 API 私钥
 * @returns Base64 编码的签名值
 */
export function sign(signString: string, privateKey: string | Buffer): string {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signString);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

/**
 * 生成 WECHATPAY2-SHA256-RSA2048 格式的 Authorization 头
 *
 * @param mchid - 商户号
 * @param serialNo - 商户证书序列号
 * @param timestamp - Unix 时间戳
 * @param nonce - 随机字符串
 * @param signature - Base64 编码的签名
 */
export function buildAuthorization(
  mchid: string,
  serialNo: string,
  timestamp: number,
  nonce: string,
  signature: string,
): string {
  return (
    `WECHATPAY2-SHA256-RSA2048 ` +
    `mchid="${mchid}",` +
    `nonce_str="${nonce}",` +
    `timestamp="${timestamp}",` +
    `serial_no="${serialNo}",` +
    `signature="${signature}"`
  );
}

/**
 * 生成随机 nonce 字符串
 */
export function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * 验证微信支付回调通知签名
 *
 * @param body - 回调通知的请求体
 * @param signature - 响应头中的 Wechatpay-Signature
 * @param timestamp - 响应头中的 Wechatpay-Timestamp
 * @param nonce - 响应头中的 Wechatpay-Nonce
 * @param publicKey - 微信支付平台公钥
 */
export function verifySignature(
  body: string,
  signature: string,
  timestamp: string,
  nonce: string,
  publicKey: string | Buffer,
): boolean {
  const signString = `${timestamp}\n${nonce}\n${body}\n`;
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signString);
  verifier.end();
  return verifier.verify(publicKey, signature, 'base64');
}
