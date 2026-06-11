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
 * @throws 如果 signString 或 privateKey 为空
 */
export function sign(signString: string, privateKey: string | Buffer): string {
  if (!signString) {
    throw new Error('签名串不能为空');
  }
  if (!privateKey) {
    throw new Error('商户私钥不能为空');
  }
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

/** 应答时间戳有效期（秒），超过此时间差的应答将被拒绝 */
const RESPONSE_EXPIRED_SECONDS = 5 * 60;

/**
 * 验证应答时间戳是否在有效期内
 *
 * 微信支付要求应答时间戳与当前时间之差不超过 5 分钟，防止重放攻击。
 *
 * @param timestamp - HTTP 头 Wechatpay-Timestamp 的值（Unix 秒）
 * @returns 时间戳是否有效
 */
export function isTimestampValid(timestamp: string): boolean {
  const responseTime = parseInt(timestamp, 10);
  if (isNaN(responseTime)) return false;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - responseTime) < RESPONSE_EXPIRED_SECONDS;
}

/**
 * 验证微信支付应答或回调通知签名
 *
 * 签名串格式：应答时间戳\n应答随机串\n应答报文主体\n
 *
 * @param body - 应答或回调的请求体
 * @param signature - HTTP 头 Wechatpay-Signature
 * @param timestamp - HTTP 头 Wechatpay-Timestamp
 * @param nonce - HTTP 头 Wechatpay-Nonce
 * @param publicKey - 微信支付公钥或平台证书公钥（PEM 格式）
 * @returns 验签是否通过
 * @throws 如果必填参数缺失
 */
export function verifySignature(
  body: string,
  signature: string,
  timestamp: string,
  nonce: string,
  publicKey: string | Buffer,
): boolean {
  if (!signature) {
    throw new Error('签名值(signature)不能为空');
  }
  if (!timestamp) {
    throw new Error('时间戳(timestamp)不能为空');
  }
  if (!nonce) {
    throw new Error('随机串(nonce)不能为空');
  }
  if (!publicKey) {
    throw new Error('公钥(publicKey)不能为空');
  }
  if (!isTimestampValid(timestamp)) {
    return false;
  }
  const signString = `${timestamp}\n${nonce}\n${body}\n`;
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signString);
  verifier.end();
  return verifier.verify(publicKey, signature, 'base64');
}

/**
 * 使用 RSAES-OAEP（SHA-1）算法加密敏感字段
 *
 * 用于分账接口等需要加密接收方姓名等敏感信息的场景。
 * 注意：微信支付官方要求使用 SHA-1 作为 OAEP 填充的哈希算法，与 SHA-256 不兼容。
 *
 * @param plaintext - 待加密的明文
 * @param publicKey - 微信支付公钥或平台证书公钥（PEM 格式）
 * @returns Base64 编码的密文，空字符串输入返回空字符串
 * @throws 如果 publicKey 为空
 */
export function oaepEncrypt(plaintext: string, publicKey: string | Buffer): string {
  if (!publicKey) {
    throw new Error('加密公钥不能为空');
  }
  if (!plaintext) {
    return '';
  }
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha1',
    },
    Buffer.from(plaintext, 'utf-8'),
  );
  return encrypted.toString('base64');
}

/**
 * 使用 RSAES-OAEP（SHA-1）算法解密敏感字段
 *
 * 用于解密微信支付下行的敏感信息（如用户姓名、银行卡号等）。
 * 微信支付使用商户证书公钥加密下行数据，商户需使用对应的私钥解密。
 *
 * @param ciphertext - Base64 编码的密文
 * @param privateKey - 商户 API 私钥（PEM 格式）
 * @returns 解密后的明文字符串，空字符串输入返回空字符串
 * @throws 如果 privateKey 为空或密文格式无效
 */
export function oaepDecrypt(ciphertext: string, privateKey: string | Buffer): string {
  if (!privateKey) {
    throw new Error('解密私钥不能为空');
  }
  if (!ciphertext) {
    return '';
  }
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha1',
    },
    Buffer.from(ciphertext, 'base64'),
  );
  return decrypted.toString('utf-8');
}
