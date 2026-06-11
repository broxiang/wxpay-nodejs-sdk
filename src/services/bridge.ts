import crypto from 'node:crypto';
import type {
  AppBridgeConfig,
  JsapiBridgeConfig,
  MiniProgramBridgeConfig,
  PayScoreJsapiBridgeConfig,
  PayScoreMiniProgramBridgeConfig,
  PayScoreAppBridgeConfig,
  PayScoreDetailJsapiBridgeConfig,
  PayScoreDetailMiniProgramBridgeConfig,
  PayScoreDetailAppBridgeConfig,
  MerchantTransferJsapiBridgeConfig,
  MerchantTransferAuthorizationJsapiBridgeConfig,
  PlateColor,
  ParkingMiniProgramBridgeConfig,
  ParkingRepayBridgeConfig,
  MedInsMiniProgramBridgeConfig,
  MedInsJsapiBridgeConfig,
} from '../types/index.js';

/**
 * 调起支付参数生成工具
 *
 * 用于生成各场景下调起微信支付所需的参数，包括签名计算：
 * - APP 支付：生成 PayReq 对象参数（通过 OpenSDK 的 sendReq 调起）
 * - JSAPI 支付：生成 WeixinJSBridge.invoke() 参数
 * - 小程序支付：生成 wx.requestPayment() 参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070351 (APP 调起支付)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012365340 (APP 调起支付签名)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791857 (JSAPI 调起支付)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791898 (小程序调起支付)
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012365341 (小程序调起支付签名)
 */

/**
 * 生成 APP 调起支付的 sign
 *
 * 签名算法：使用商户私钥对签名串进行 RSA-SHA256 签名
 * 签名串格式：appId\ntimeStamp\nnonceStr\nprepay_id\n
 *
 * @param appId - 应用ID
 * @param timeStamp - 时间戳（秒）
 * @param nonceStr - 随机字符串
 * @param prepayId - 预支付ID
 * @param privateKey - 商户私钥
 * @returns Base64 编码的签名
 */
export function generateAppPaySign(
  appId: string,
  timeStamp: string,
  nonceStr: string,
  prepayId: string,
  privateKey: string | Buffer,
): string {
  const signString = `${appId}\n${timeStamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signString);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

/**
 * 生成 APP 调起支付所需的完整配置
 *
 * 用于生成 OpenSDK sendReq 方法中 PayReq 对象所需的全部参数。
 * sign 使用商户 API 证书私钥进行 RSA-SHA256 签名。
 *
 * @param appId - 应用ID（下单时传入的 appid）
 * @param partnerId - 商户号（下单时传入的 mchid）
 * @param prepayId - 预支付ID（从 APP 下单接口获取）
 * @param privateKey - 商户私钥
 * @returns PayReq 对象所需的参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4013070351
 */
export function buildAppBridgeConfig(
  appId: string,
  partnerId: string,
  prepayId: string,
  privateKey: string | Buffer,
): AppBridgeConfig {
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const sign = generateAppPaySign(appId, timeStamp, nonceStr, prepayId, privateKey);

  return {
    appId,
    partnerId,
    prepayId,
    packageValue: 'Sign=WXPay',
    nonceStr,
    timeStamp,
    sign,
  };
}

/**
 * 生成 JSAPI 调起支付的 paySign
 *
 * 签名算法：使用商户私钥对签名串进行 RSA-SHA256 签名
 * 签名串格式：appId\ntimeStamp\nnonceStr\nprepay_id\n
 *
 * @param appId - 应用ID
 * @param timeStamp - 时间戳（秒）
 * @param nonceStr - 随机字符串
 * @param prepayId - 预支付ID（package 参数为 prepay_id=xxx）
 * @param privateKey - 商户私钥
 * @returns Base64 编码的签名
 */
export function generatePaySign(
  appId: string,
  timeStamp: string,
  nonceStr: string,
  prepayId: string,
  privateKey: string | Buffer,
): string {
  const signString = `${appId}\n${timeStamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signString);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

/**
 * 生成随机 nonce 字符串（用于 JSAPI 调起支付）
 */
export function generateNonceStr(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * 生成 JSAPI 调起支付所需的完整配置
 *
 * @param appId - 应用ID
 * @param prepayId - 预支付ID（从下单接口获取）
 * @param privateKey - 商户私钥
 * @returns WeixinJSBridge.invoke() 所需的参数对象
 */
export function buildJsapiBridgeConfig(
  appId: string,
  prepayId: string,
  privateKey: string | Buffer,
): JsapiBridgeConfig {
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const paySign = generatePaySign(appId, timeStamp, nonceStr, prepayId, privateKey);

  return {
    appId,
    timeStamp,
    nonceStr,
    package: `prepay_id=${prepayId}`,
    signType: 'RSA',
    paySign,
  };
}

/**
 * 生成小程序调起支付所需的完整配置
 *
 * 与 JSAPI 支付不同的是，小程序通过 wx.requestPayment() 调起支付，
 * 不需要传递 appId 字段（由小程序运行环境隐式提供）。
 * 但签名时仍然需要使用 appId 参与计算。
 *
 * @param appId - 小程序 AppID
 * @param prepayId - 预支付ID（从下单接口获取）
 * @param privateKey - 商户私钥
 * @returns wx.requestPayment() 所需的参数对象
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791898
 */
export function buildMiniProgramBridgeConfig(
  appId: string,
  prepayId: string,
  privateKey: string | Buffer,
): MiniProgramBridgeConfig {
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const paySign = generatePaySign(appId, timeStamp, nonceStr, prepayId, privateKey);

  return {
    timeStamp,
    nonceStr,
    package: `prepay_id=${prepayId}`,
    signType: 'RSA',
    paySign,
  };
}

/**
 * 生成支付分调起确认订单页的签名
 *
 * 签名算法：使用商户私钥对签名串进行 RSA-SHA256 签名
 * 签名串格式：appId\ntimeStamp\nnonceStr\npackage\n
 * 其中 package 为 service_id={service_id}&out_order_no={out_order_no}&need_sign_type=RSA
 *
 * @param appId - 应用ID
 * @param timeStamp - 时间戳（秒）
 * @param nonceStr - 随机字符串
 * @param serviceId - 服务ID
 * @param outOrderNo - 商户服务订单号
 * @param privateKey - 商户私钥
 * @returns Base64 编码的签名
 */
export function generatePayScorePaySign(
  appId: string,
  timeStamp: string,
  nonceStr: string,
  serviceId: string,
  outOrderNo: string,
  privateKey: string | Buffer,
): string {
  const packageStr = `service_id=${serviceId}&out_order_no=${outOrderNo}&need_sign_type=RSA`;
  const signString = `${appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signString);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

/**
 * 生成支付分 JSAPI 调起确认订单页所需参数
 *
 * 用于 WeixinJSBridge.invoke('openBusinessView', config) 调起支付分确认订单页。
 * businessType 需传入 'wxpayScoreUse'，queryString 需传入返回的 config 参数。
 *
 * @param appId - 公众号 AppID
 * @param mchId - 商户号
 * @param serviceId - 服务ID
 * @param outOrderNo - 商户服务订单号
 * @param privateKey - 商户私钥
 * @returns JSAPI 调起支付分确认订单页所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587945
 */
export function buildPayScoreJsapiBridgeConfig(
  appId: string,
  mchId: string,
  serviceId: string,
  outOrderNo: string,
  privateKey: string | Buffer,
): PayScoreJsapiBridgeConfig {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const sign = generatePayScorePaySign(
    appId,
    timestamp,
    nonceStr,
    serviceId,
    outOrderNo,
    privateKey,
  );

  return {
    appid: appId,
    mchid: mchId,
    service_id: serviceId,
    out_order_no: outOrderNo,
    timestamp,
    nonce_str: nonceStr,
    sign_type: 'RSA',
    sign,
  };
}

/**
 * 生成支付分小程序调起确认订单页所需参数
 *
 * 用于 wx.openBusinessView({ businessType: 'wxpayScoreUse' }) 调起支付分确认订单页。
 * 小程序场景下不需要传入 appid 字段（由小程序运行环境隐式提供），
 * 但签名计算时仍需使用 appId。
 *
 * @param mchId - 商户号
 * @param serviceId - 服务ID
 * @param outOrderNo - 商户服务订单号
 * @param appId - 小程序 AppID（仅用于签名计算）
 * @param privateKey - 商户私钥
 * @returns 小程序调起支付分确认订单页所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587949
 */
export function buildPayScoreMiniProgramBridgeConfig(
  mchId: string,
  serviceId: string,
  outOrderNo: string,
  appId: string,
  privateKey: string | Buffer,
): PayScoreMiniProgramBridgeConfig {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const sign = generatePayScorePaySign(
    appId,
    timestamp,
    nonceStr,
    serviceId,
    outOrderNo,
    privateKey,
  );

  return {
    mchid: mchId,
    service_id: serviceId,
    out_order_no: outOrderNo,
    timestamp,
    nonce_str: nonceStr,
    sign_type: 'RSA',
    sign,
  };
}

/**
 * 生成支付分 APP 调起确认订单页所需参数
 *
 * 用于 APP 端通过 OpenSDK 调起支付分确认订单页。
 *
 * @param appId - 应用 AppID
 * @param mchId - 商户号
 * @param serviceId - 服务ID
 * @param outOrderNo - 商户服务订单号
 * @param privateKey - 商户私钥
 * @returns APP 调起支付分确认订单页所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587909
 */
export function buildPayScoreAppBridgeConfig(
  appId: string,
  mchId: string,
  serviceId: string,
  outOrderNo: string,
  privateKey: string | Buffer,
): PayScoreAppBridgeConfig {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const sign = generatePayScorePaySign(
    appId,
    timestamp,
    nonceStr,
    serviceId,
    outOrderNo,
    privateKey,
  );

  return {
    appid: appId,
    mchid: mchId,
    service_id: serviceId,
    out_order_no: outOrderNo,
    timestamp,
    nonce_str: nonceStr,
    sign_type: 'RSA',
    sign,
  };
}

// ============= 商家转账 =============

/**
 * 生成商家转账 JSAPI 调起用户确认收款所需配置
 *
 * 用于 WeixinJSBridge.invoke('requestMerchantTransfer', config) 调起确认收款页。
 * 仅当转账单状态为 WAIT_USER_CONFIRM 时，发起转账接口才会返回 package_info。
 *
 * @param mchId - 商户号
 * @param appId - 商户AppID
 * @param packageInfo - 发起转账接口返回的 package_info
 * @returns JSAPI 调起用户确认收款所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716430
 */
export function buildMerchantTransferJsapiBridgeConfig(
  mchId: string,
  appId: string,
  packageInfo: string,
): MerchantTransferJsapiBridgeConfig {
  return {
    mchId,
    appId,
    package: packageInfo,
  };
}

/**
 * 生成商家转账小程序调起用户确认收款所需配置
 *
 * 用于 wx.requestMerchantTransfer(config) 调起确认收款页。
 *
 * @param mchId - 商户号
 * @param appId - 商户AppID
 * @param packageInfo - 发起转账接口返回的 package_info
 * @returns 小程序调起用户确认收款所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716430
 */
export function buildMerchantTransferMiniProgramBridgeConfig(
  mchId: string,
  appId: string,
  packageInfo: string,
): MerchantTransferJsapiBridgeConfig {
  return {
    mchId,
    appId,
    package: packageInfo,
  };
}

/**
 * 生成 JSAPI 调起免确认收款授权页面所需配置
 *
 * 用于 WeixinJSBridge.invoke('requestMerchantTransfer', config) 调起授权确认页。
 * 仅当授权单状态为 WAIT_USER_CONFIRM 时，发起授权接口才会返回 package_info。
 *
 * @param mchId - 商户号
 * @param appId - 商户AppID
 * @param packageInfo - 发起授权接口返回的 package_info
 * @returns JSAPI 调起授权页面所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4015930512
 */
export function buildMerchantTransferAuthorizationJsapiBridgeConfig(
  mchId: string,
  appId: string,
  packageInfo: string,
): MerchantTransferAuthorizationJsapiBridgeConfig {
  return {
    mchId,
    appId,
    package: packageInfo,
  };
}

// ============= 支付分停车服务 =============

/** 支付分停车服务开通页目标小程序 AppID */
const PARKING_SERVICE_APPID = 'wxbcad394b3d99dac9';

/** 支付分停车服务开通页目标小程序路径 */
const PARKING_SERVICE_PATH = '/pages/auth-creditpay/auth-creditpay';

/** 微信垫资还款小程序 AppID */
const PARKING_REPAY_APPID = 'wx5e73c65404eee268';

/** 微信垫资还款小程序路径 */
const PARKING_REPAY_PATH = 'pages/invest_list/invest_list';

/**
 * 构建停车服务开通页查询参数字符串
 *
 * @param mchid - 商户号
 * @param openid - 用户在商户对应AppID下的唯一标识
 * @param plateNumber - 待开通车牌号
 * @param plateColor - 待开通车牌颜色
 * @returns URL 查询参数字符串（不含 ? 前缀）
 */
function buildParkingQueryString(
  mchid: string,
  openid: string,
  plateNumber: string,
  plateColor: PlateColor,
): string {
  const params = new URLSearchParams({
    mchid,
    openid,
    plate_number: plateNumber,
    plate_color: plateColor,
    trade_scene: 'PARKING',
  });
  return params.toString();
}

/**
 * 生成小程序调起支付分停车服务开通页配置
 *
 * 通过 wx.navigateToMiniProgram 跳转到车主服务小程序，引导用户开通支付分停车服务。
 * 用户完成授权后会跳转回商户小程序，商户需调用查询车牌服务开通信息接口确认最终结果。
 *
 * @param mchid - 商户号
 * @param openid - 用户在商户对应AppID下的唯一标识
 * @param plateNumber - 待开通车牌号
 * @param plateColor - 待开通车牌颜色
 * @returns wx.navigateToMiniProgram 所需的参数对象
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012284186
 */
export function buildParkingMiniProgramBridgeConfig(
  mchid: string,
  openid: string,
  plateNumber: string,
  plateColor: PlateColor,
): ParkingMiniProgramBridgeConfig {
  return {
    appId: PARKING_SERVICE_APPID,
    path: PARKING_SERVICE_PATH,
    extraData: {
      mchid,
      openid,
      plate_number: plateNumber,
      plate_color: plateColor,
      trade_scene: 'PARKING',
    },
  };
}

/**
 * 生成 H5 调起支付分停车服务开通页 URL
 *
 * 通过微信 H5 开放标签（wx-open-launch-weapp）拉起微信支付分停车服务小程序，
 * 引导用户进行服务开通。用户完成授权后跳转回商户 H5 页面，
 * 商户需调用查询车牌服务开通信息接口确认最终结果。
 *
 * @param mchid - 商户号
 * @param openid - 用户在商户对应AppID下的唯一标识
 * @param plateNumber - 待开通车牌号
 * @param plateColor - 待开通车牌颜色
 * @returns H5 开放标签所需的 path 属性值（含查询参数的完整路径）
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012284235
 */
export function buildParkingH5BridgeUrl(
  mchid: string,
  openid: string,
  plateNumber: string,
  plateColor: PlateColor,
): string {
  const queryString = buildParkingQueryString(mchid, openid, plateNumber, plateColor);
  return `${PARKING_SERVICE_PATH}?${queryString}`;
}

/**
 * 生成 App 拉起支付分停车服务开通页路径
 *
 * 通过微信 OpenSDK 的 WXLaunchMiniProgram 拉起微信支付分停车服务小程序，
 * 引导用户进行服务开通。用户完成授权后跳转回商户 App，
 * 商户需调用查询车牌服务开通信息接口确认最终结果。
 *
 * @param mchid - 商户号
 * @param openid - 用户在商户对应AppID下的唯一标识
 * @param plateNumber - 待开通车牌号
 * @param plateColor - 待开通车牌颜色
 * @returns App 拉起小程序所需的 path 参数（含查询参数的完整路径）
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012284257
 */
export function buildParkingAppBridgePath(
  mchid: string,
  openid: string,
  plateNumber: string,
  plateColor: PlateColor,
): string {
  const queryString = buildParkingQueryString(mchid, openid, plateNumber, plateColor);
  return `${PARKING_SERVICE_PATH}?${queryString}`;
}

/**
 * 生成微信垫资还款小程序跳转配置
 *
 * 通过小程序 navigator 组件或 App OpenSDK 拉起还款小程序，
 * 引导用户进行微信垫资还款操作。
 *
 * @param mchid - 商户号
 * @param openid - 用户在商户AppID下的唯一标识（可选）
 * @returns 还款小程序跳转配置
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012284369
 */
export function buildParkingRepayBridgeConfig(
  mchid: string,
  openid?: string,
): ParkingRepayBridgeConfig {
  return {
    appId: PARKING_REPAY_APPID,
    path: PARKING_REPAY_PATH,
    extraData: {
      mchid,
      nonce_str: generateNonceStr(),
      openid,
    },
  };
}

// ============= H5 发券 =============

/** H5 发券目标 URL */
const H5_COUPON_URL = 'https://action.weixin.qq.com/busifavor/getcouponinfo';

/**
 * 生成 H5 发券跳转 URL
 *
 * 通过 URL 重定向方式在 H5 页面向用户发放商家券。
 * 商户将用户重定向至该 URL，用户在页面点击领券完成发券。
 *
 * 签名方式为 HMAC-SHA256（V2 签名规则），
 * 参与签名的字段：stock_id、out_request_no、send_coupon_merchant、open_id，
 * 以及可选的 coupon_code。
 *
 * @param params - H5 发券参数
 * @param signKey - V2 签名密钥（APIv2 signkey）
 * @returns 完整的 H5 发券跳转 URL
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012285783
 */
export function buildH5CouponUrl(
  params: {
    stock_id: string;
    out_request_no: string;
    send_coupon_merchant: string;
    open_id: string;
    coupon_code?: string;
    customize_send_time?: string;
  },
  signKey: string,
): string {
  const signFields: Record<string, string> = {
    stock_id: params.stock_id,
    out_request_no: params.out_request_no,
    send_coupon_merchant: params.send_coupon_merchant,
    open_id: params.open_id,
  };
  if (params.coupon_code) {
    signFields['coupon_code'] = params.coupon_code;
  }

  // 按字典序拼接签名字符串
  const sortedKeys = Object.keys(signFields).sort();
  const signStr = sortedKeys.map((k) => `${k}=${signFields[k]}`).join('&') + `&key=${signKey}`;

  const sign = crypto.createHmac('sha256', signKey).update(signStr).digest('hex').toUpperCase();

  const urlParams = new URLSearchParams({
    stock_id: params.stock_id,
    out_request_no: params.out_request_no,
    sign,
    send_coupon_merchant: params.send_coupon_merchant,
    open_id: params.open_id,
  });
  if (params.coupon_code) {
    urlParams.set('coupon_code', params.coupon_code);
  }
  if (params.customize_send_time) {
    urlParams.set('customize_send_time', params.customize_send_time);
  }

  return `${H5_COUPON_URL}?${urlParams.toString()}#wechat_pay&wechat_redirect`;
}

// ============= 支付分 - 订单详情页 =============

/**
 * 生成支付分 JSAPI 调起订单详情页所需参数
 *
 * 用于 WeixinJSBridge.invoke('openBusinessView', config) 调起支付分订单详情页。
 * businessType 需传入 'wxpayScoreDetail'，queryString 需传入返回的 config 参数。
 *
 * @param appId - 公众号 AppID
 * @param mchId - 商户号
 * @param serviceId - 服务ID
 * @param outOrderNo - 商户服务订单号
 * @param privateKey - 商户私钥
 * @returns JSAPI 调起支付分订单详情页所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587945
 */
export function buildPayScoreDetailJsapiBridgeConfig(
  appId: string,
  mchId: string,
  serviceId: string,
  outOrderNo: string,
  privateKey: string | Buffer,
): PayScoreDetailJsapiBridgeConfig {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const sign = generatePayScorePaySign(
    appId,
    timestamp,
    nonceStr,
    serviceId,
    outOrderNo,
    privateKey,
  );

  return {
    appid: appId,
    mchid: mchId,
    service_id: serviceId,
    out_order_no: outOrderNo,
    timestamp,
    nonce_str: nonceStr,
    sign_type: 'RSA',
    sign,
  };
}

/**
 * 生成支付分小程序调起订单详情页所需参数
 *
 * 用于 wx.openBusinessView({ businessType: 'wxpayScoreDetail' }) 调起支付分订单详情页。
 * 小程序场景下不需要传入 appid 字段（由小程序运行环境隐式提供），
 * 但签名计算时仍需使用 appId。
 *
 * @param mchId - 商户号
 * @param serviceId - 服务ID
 * @param outOrderNo - 商户服务订单号
 * @param appId - 小程序 AppID（仅用于签名计算）
 * @param privateKey - 商户私钥
 * @returns 小程序调起支付分订单详情页所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587949
 */
export function buildPayScoreDetailMiniProgramBridgeConfig(
  mchId: string,
  serviceId: string,
  outOrderNo: string,
  appId: string,
  privateKey: string | Buffer,
): PayScoreDetailMiniProgramBridgeConfig {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const sign = generatePayScorePaySign(
    appId,
    timestamp,
    nonceStr,
    serviceId,
    outOrderNo,
    privateKey,
  );

  return {
    mchid: mchId,
    service_id: serviceId,
    out_order_no: outOrderNo,
    timestamp,
    nonce_str: nonceStr,
    sign_type: 'RSA',
    sign,
  };
}

/**
 * 生成支付分 APP 调起订单详情页所需参数
 *
 * 用于 APP 端通过 OpenSDK 调起支付分订单详情页。
 *
 * @param appId - 应用 AppID
 * @param mchId - 商户号
 * @param serviceId - 服务ID
 * @param outOrderNo - 商户服务订单号
 * @param privateKey - 商户私钥
 * @returns APP 调起支付分订单详情页所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587909
 */
export function buildPayScoreDetailAppBridgeConfig(
  appId: string,
  mchId: string,
  serviceId: string,
  outOrderNo: string,
  privateKey: string | Buffer,
): PayScoreDetailAppBridgeConfig {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const sign = generatePayScorePaySign(
    appId,
    timestamp,
    nonceStr,
    serviceId,
    outOrderNo,
    privateKey,
  );

  return {
    appid: appId,
    mchid: mchId,
    service_id: serviceId,
    out_order_no: outOrderNo,
    timestamp,
    nonce_str: nonceStr,
    sign_type: 'RSA',
    sign,
  };
}

// ============= 医保支付 =============

/** 医保支付小程序目标 AppID */
const MED_INS_APPID = 'wxbcad394b3d99dac9';

/** 医保支付小程序目标路径 */
const MED_INS_PATH = '/pages/med-ins/pay/pay';

/**
 * 生成小程序调起医保支付配置
 *
 * 通过 wx.navigateToMiniProgram 跳转到医保支付小程序，引导用户完成医保自费混合支付。
 * 用户完成支付后会跳转回商户小程序，商户需调用查询订单接口确认最终结果。
 *
 * @param mchid - 商户号
 * @param mixTradeNo - 医保自费混合订单号
 * @returns wx.navigateToMiniProgram 所需的参数对象
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781466
 */
export function buildMedInsMiniProgramBridgeConfig(
  mchid: string,
  mixTradeNo: string,
): MedInsMiniProgramBridgeConfig {
  return {
    appId: MED_INS_APPID,
    path: MED_INS_PATH,
    extraData: {
      mchid,
      mix_trade_no: mixTradeNo,
    },
  };
}

/**
 * 生成医保支付 JSAPI 调起配置
 *
 * 用于 WeixinJSBridge.invoke('openBusinessView', config) 调起医保支付。
 * businessType 需传入 'medInsPay'。
 *
 * @param appId - 公众号 AppID
 * @param mchId - 商户号
 * @param mixTradeNo - 医保自费混合订单号
 * @param privateKey - 商户私钥
 * @returns JSAPI 调起医保支付所需参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781466
 */
export function buildMedInsJsapiBridgeConfig(
  appId: string,
  mchId: string,
  mixTradeNo: string,
  privateKey: string | Buffer,
): MedInsJsapiBridgeConfig {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = generateNonceStr();
  const packageStr = `mchid=${mchId}&mix_trade_no=${mixTradeNo}`;
  const signString = `${appId}\n${timestamp}\n${nonceStr}\n${packageStr}\n`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signString);
  signer.end();
  const sign = signer.sign(privateKey, 'base64');

  return {
    appid: appId,
    mchid: mchId,
    mix_trade_no: mixTradeNo,
    timestamp,
    nonce_str: nonceStr,
    sign_type: 'RSA',
    sign,
  };
}
