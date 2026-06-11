import crypto from 'node:crypto';
import { verifySignature } from '../utils/sign.js';
import type {
  CallbackNotification,
  CallbackHeaders,
  TransactionCallbackData,
  CombineTransactionCallbackData,
  RefundCallbackData,
  ProfitSharingCallbackData,
  PayScoreUserConfirmCallbackData,
  PayScoreUserPaidCallbackData,
  PayScoreRefundCallbackData,
  ParkingEntryStatusCallbackData,
  ParkingTransactionCallbackData,
  MerchantTransferCallbackData,
  MerchantTransferAuthorizationCallbackData,
  CouponUseCallbackData,
  ComplaintCallbackData,
  MedInsSuccessCallbackData,
  MedInsRefundCallbackData,
  BusinessCircleAuthorizeCallbackData,
  BusinessCircleTransactionCallbackData,
  BusinessCircleRefundCallbackData,
} from '../types/index.js';
import { CertificateManager } from '../core/certificate.js';

/**
 * 回调通知解密后的结果
 */
export interface DecryptedCallback<T = unknown> {
  /** 通知ID */
  id: string;
  /** 通知创建时间 */
  create_time: string;
  /** 通知类型 */
  event_type: string;
  /** 通知数据类型 */
  resource_type: string;
  /** 回调摘要 */
  summary: string;
  /** 解密后的业务数据 */
  data: T;
}

/**
 * 支持的签名类型
 *
 * 目前微信支付仅支持 WECHATPAY2-SHA256-RSA2048 签名类型，
 * 保留此类型以便未来扩展其他签名算法。
 */
export type SignatureType = string;

/**
 * 已知的签名类型常量
 */
const SUPPORTED_SIGNATURE_TYPES = new Set(['WECHATPAY2-SHA256-RSA2048']);

/**
 * 微信支付回调通知处理器
 *
 * 负责验证回调签名并解密回调通知中的业务数据。
 * 支持通过 Wechatpay-Signature-Type 头识别签名类型。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791861
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012075249
 */
export class CallbackHandler {
  private readonly apiV3Key: string;
  private readonly certificates: CertificateManager;

  constructor(apiV3Key: string, certificates: CertificateManager) {
    this.apiV3Key = apiV3Key;
    this.certificates = certificates;
  }

  /**
   * 验证回调通知签名
   *
   * 使用微信支付平台公钥验证回调通知的签名。
   * 支持读取 Wechatpay-Signature-Type 头识别签名类型。
   *
   * @param headers - 回调请求头
   * @param body - 回调请求体（原始 JSON 字符串）
   * @returns 签名验证是否通过
   * @throws 如果签名类型不支持或找不到对应的证书
   */
  verifySignature(headers: CallbackHeaders, body: string): boolean {
    const signatureType = headers['wechatpay-signature-type'];
    const serialNo = headers['wechatpay-serial'];

    // 目前仅支持 WECHATPAY2-SHA256-RSA2048 签名类型
    if (signatureType && !SUPPORTED_SIGNATURE_TYPES.has(signatureType)) {
      throw new Error(`不支持的签名类型: ${signatureType}`);
    }

    const publicKey = this.certificates.getPublicKey(serialNo);
    if (!publicKey) {
      throw new Error(`未找到序列号为 ${serialNo} 的平台证书，请确保已配置平台证书`);
    }

    return verifySignature(
      body,
      headers['wechatpay-signature'],
      headers['wechatpay-timestamp'],
      headers['wechatpay-nonce'],
      publicKey,
    );
  }

  /**
   * 解密回调通知中的业务数据
   *
   * 使用 AES-256-GCM 算法和 API V3 密钥解密 resource.ciphertext。
   *
   * @param notification - 回调通知 JSON 对象
   * @returns 解密后的业务数据
   * @throws 如果解密后的数据为空或格式无效
   */
  decryptNotification<T = unknown>(notification: CallbackNotification): DecryptedCallback<T> {
    const { resource } = notification;

    const plaintext = this.aesGcmDecrypt(
      resource.ciphertext,
      resource.associated_data,
      resource.nonce,
    );

    // 安全解析 JSON 并验证结果
    let parsed: unknown;
    try {
      parsed = JSON.parse(plaintext);
    } catch (error) {
      throw new Error(
        `回调数据 JSON 解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }

    if (parsed === null || parsed === undefined || typeof parsed !== 'object') {
      throw new Error(`回调数据格式无效: 期望对象，实际为 ${typeof parsed}`);
    }

    const data = parsed as T;

    return {
      id: notification.id,
      create_time: notification.create_time,
      event_type: notification.event_type,
      resource_type: notification.resource_type,
      summary: notification.summary,
      data,
    };
  }

  /**
   * 处理回调通知（验证签名 + 解密数据）
   *
   * @param headers - 回调请求头
   * @param body - 回调请求体（原始 JSON 字符串）
   * @returns 解密后的回调数据
   */
  process<T = unknown>(headers: CallbackHeaders, body: string): DecryptedCallback<T> {
    // 1. 验证签名
    const valid = this.verifySignature(headers, body);
    if (!valid) {
      throw new Error('回调通知签名验证失败');
    }

    // 2. 解析通知
    const notification = JSON.parse(body) as CallbackNotification;

    // 3. 解密数据
    return this.decryptNotification<T>(notification);
  }

  /**
   * 处理支付成功回调通知
   */
  processTransactionCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<TransactionCallbackData> {
    return this.process<TransactionCallbackData>(headers, body);
  }

  /**
   * 处理退款回调通知
   */
  processRefundCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<RefundCallbackData> {
    return this.process<RefundCallbackData>(headers, body);
  }

  /**
   * 处理分账动账回调通知
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012289679
   */
  processProfitSharingCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<ProfitSharingCallbackData> {
    return this.process<ProfitSharingCallbackData>(headers, body);
  }

  /**
   * 处理支付分用户确认订单回调通知
   *
   * 用户确认支付分订单后，微信支付会向商户发送此回调通知。
   * event_type 为 PAYSCORE.USER_CONFIRM。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587953
   */
  processPayScoreUserConfirmCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<PayScoreUserConfirmCallbackData> {
    return this.process<PayScoreUserConfirmCallbackData>(headers, body);
  }

  /**
   * 处理支付分支付成功回调通知
   *
   * 支付分订单扣款成功后，微信支付会向商户发送此回调通知。
   * event_type 为 PAYSCORE.USER_PAID。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587960
   */
  processPayScoreUserPaidCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<PayScoreUserPaidCallbackData> {
    return this.process<PayScoreUserPaidCallbackData>(headers, body);
  }

  /**
   * 处理停车入场状态变更回调通知
   *
   * 场内车牌状态发生变化后，微信支付通过此回调通知商户。
   * 例如用户开通/暂停支付分停车服务、用户移除车牌等。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012284177
   */
  processParkingEntryStatusCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<ParkingEntryStatusCallbackData> {
    return this.process<ParkingEntryStatusCallbackData>(headers, body);
  }

  /**
   * 处理停车订单支付结果回调通知
   *
   * 扣费受理后，微信支付异步扣款完成时会发送此回调通知。
   * event_type 为 TRANSACTION.SUCCESS（支付成功）、TRANSACTION.FAIL（支付失败）
   * 或 TRANSACTION.PAY_BACK（还款）。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012284311
   */
  processParkingTransactionCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<ParkingTransactionCallbackData> {
    return this.process<ParkingTransactionCallbackData>(headers, body);
  }

  /**
   * 处理停车退款结果回调通知
   *
   * 退款完成后，微信支付会向商户发送此回调通知。
   * event_type 为 REFUND.SUCCESS（退款成功）、REFUND.ABNORMAL（退款异常）
   * 或 REFUND.CLOSED（退款关闭）。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012083103
   */
  processParkingRefundCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<RefundCallbackData> {
    return this.process<RefundCallbackData>(headers, body);
  }

  /**
   * 处理代金券核销事件回调通知
   *
   * 用户使用券后，微信会把相关核销券信息发送给商户。
   * event_type 为 COUPON.USE。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012285250
   */
  processCouponUseCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<CouponUseCallbackData> {
    return this.process<CouponUseCallbackData>(headers, body);
  }

  /**
   * 处理合单支付成功回调通知
   *
   * 合单支付成功后，微信支付会向商户发送此回调通知。
   * event_type 为 TRANSACTION.SUCCESS。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4013421231
   */
  processCombineTransactionCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<CombineTransactionCallbackData> {
    return this.process<CombineTransactionCallbackData>(headers, body);
  }

  /**
   * 处理商家转账状态变更回调通知
   *
   * 转账单据状态变更后，微信支付会向商户发送此回调通知。
   * 包括转账成功、转账失败、已撤销等状态变更。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012712115
   */
  processMerchantTransferCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<MerchantTransferCallbackData> {
    return this.process<MerchantTransferCallbackData>(headers, body);
  }

  /**
   * 处理免确认收款授权变更回调通知
   *
   * 用户确认授权或解除授权后，微信支付会向商户发送此回调通知。
   * 包括授权生效（TAKING_EFFECT）和授权关闭（CLOSED）等状态变更。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4014512908
   */
  processMerchantTransferAuthorizationCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<MerchantTransferAuthorizationCallbackData> {
    return this.process<MerchantTransferAuthorizationCallbackData>(headers, body);
  }

  /**
   * 处理支付分退款结果回调通知
   *
   * 支付分订单退款完成后，微信支付会向商户发送此回调通知。
   * event_type 为 REFUND.SUCCESS（退款成功）、REFUND.ABNORMAL（退款异常）
   * 或 REFUND.CLOSED（退款关闭）。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587976
   */
  processPayScoreRefundCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<PayScoreRefundCallbackData> {
    return this.process<PayScoreRefundCallbackData>(headers, body);
  }

  /**
   * 处理消费者投诉通知回调
   *
   * 用户提交投诉、用户撤诉、用户确认投诉已处理完成时，
   * 微信支付会通过此回调通知商户。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012289719
   */
  processComplaintCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<ComplaintCallbackData> {
    return this.process<ComplaintCallbackData>(headers, body);
  }

  /**
   * 处理医保支付成功回调通知
   *
   * 医保自费混合订单支付成功后，微信支付会向商户发送此回调通知。
   * event_type 为 MED_INS.SUCCESS。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781502
   */
  processMedInsSuccessCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<MedInsSuccessCallbackData> {
    return this.process<MedInsSuccessCallbackData>(headers, body);
  }

  /**
   * 处理医保退款回调通知
   *
   * 医保订单退款完成后，微信支付会向商户发送此回调通知。
   * event_type 为 MED_INS.REFUND.SUCCESS、MED_INS.REFUND.ABNORMAL 或 MED_INS.REFUND.CLOSED。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781502
   */
  processMedInsRefundCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<MedInsRefundCallbackData> {
    return this.process<MedInsRefundCallbackData>(headers, body);
  }

  /**
   * 处理商圈会员积分服务授权结果回调通知
   *
   * 用户在小程序内授权/解除授权商圈积分服务后，微信支付会向商户发送此回调通知。
   * event_type 为 BUSINESS_CIRCLE.USER_AUTHORIZE 或 BUSINESS_CIRCLE.USER_DEAUTHORIZE。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012285836
   */
  processBusinessCircleAuthorizeCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<BusinessCircleAuthorizeCallbackData> {
    return this.process<BusinessCircleAuthorizeCallbackData>(headers, body);
  }

  /**
   * 处理商圈会员场内支付结果回调通知
   *
   * 用户在商圈内支付成功后，微信支付会向商户发送此回调通知。
   * event_type 为 TRANSACTION.SUCCESS。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012285856
   */
  processBusinessCircleTransactionCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<BusinessCircleTransactionCallbackData> {
    return this.process<BusinessCircleTransactionCallbackData>(headers, body);
  }

  /**
   * 处理商圈会员场内退款结果回调通知
   *
   * 商圈内交易退款完成后，微信支付会向商户发送此回调通知。
   * event_type 为 REFUND.SUCCESS、REFUND.ABNORMAL 或 REFUND.CLOSED。
   *
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012285869
   */
  processBusinessCircleRefundCallback(
    headers: CallbackHeaders,
    body: string,
  ): DecryptedCallback<BusinessCircleRefundCallbackData> {
    return this.process<BusinessCircleRefundCallbackData>(headers, body);
  }

  /**
   * AES-256-GCM 解密
   *
   * @param ciphertext - Base64 编码的密文
   * @param associatedData - 附加数据（用于 AEAD 认证）
   * @param nonce - 随机串
   * @returns 解密后的明文字符串
   */
  private aesGcmDecrypt(ciphertext: string, associatedData: string, nonce: string): string {
    const key = Buffer.from(this.apiV3Key, 'utf-8');
    const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
    const authTag = ciphertextBuffer.subarray(-16);
    const encryptedData = ciphertextBuffer.subarray(0, -16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf-8'));

    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from(associatedData, 'utf-8'));

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    return decrypted.toString('utf-8');
  }
}
