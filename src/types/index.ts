/** 微信支付 API V3 通用响应结构 */
export interface WxPayResponse<T = unknown> {
  /** HTTP 状态码 */
  status: number;
  /** 响应头 */
  headers: Record<string, string>;
  /** 响应体数据 */
  data: T;
}

/** 微信支付 API 错误信息 */
export interface WxPayErrorDetail {
  /** 错误码 */
  code: string;
  /** 错误描述 */
  message: string;
  /** 详细错误信息 */
  detail?: {
    field: string;
    value: string;
    issue: string;
    location?: string;
  }[];
}

/** 微信支付平台证书信息 */
export interface PlatformCertificate {
  /** 序列号 */
  serialNo: string;
  /** 生效时间 */
  effectiveTime: string;
  /** 失效时间 */
  expireTime: string;
  /** 加密证书内容 */
  encryptCertificate: {
    algorithm: string;
    nonce: string;
    associatedData: string;
    ciphertext: string;
  };
}

/** SDK 配置选项 */
export interface WxPayOptions {
  /** 商户号 */
  mchid: string;
  /** API V3 密钥 */
  apiV3Key: string;
  /** 商户证书序列号 */
  serialNo: string;
  /** 商户 API 私钥（PEM 格式字符串或文件路径） */
  privateKey: string | Buffer;
  /** 微信支付平台证书（可选，不传则自动下载） */
  platformCertificates?: PlatformCertificate[];
  /** 请求超时时间（毫秒），默认 30000 */
  timeout?: number;
  /** 是否使用沙箱环境，默认 false */
  sandbox?: boolean;
  /** 微信支付公钥 ID（推荐使用公钥模式验签） */
  wxpayPublicKeyId?: string;
  /** 微信支付公钥（PEM 格式字符串或文件路径，推荐使用公钥模式验签） */
  wxpayPublicKey?: string | Buffer;
  /** 是否开启应答验签，默认 true */
  enableResponseVerification?: boolean;
  /** 是否启用跨城容灾（主备域名自动切换），默认 true */
  enableFailover?: boolean;
  /** 自定义 fetch 实现，用于注入代理、自定义超时等场景 */
  customFetch?: typeof fetch;
}

/** 请求参数基础类型 */
export type RequestParams = Record<string, string | number | boolean | undefined>;

/** 签名类型 */
export type SignType = 'WECHATPAY2-SHA256-RSA2048';

// ============= JSAPI 下单 =============

/** 订单金额 */
export interface OrderAmount {
  /** 订单总金额，单位：分 */
  total: number;
  /** 货币类型，ISO 4217 三位字母代码，固定 CNY */
  currency?: string;
}

/** 支付者信息 */
export interface OrderPayer {
  /** 用户标识（openid） */
  openid: string;
}

/** 商品详情 */
export interface GoodsDetail {
  /** 商户侧商品编码 */
  merchant_goods_id: string;
  /** 微信支付商品编码 */
  wechatpay_goods_id?: string;
  /** 商品名称 */
  goods_name?: string;
  /** 商品数量 */
  quantity: number;
  /** 商品单价，单位：分 */
  unit_price: number;
}

/** 订单优惠详情 */
export interface OrderDetail {
  /** 订单原价，单位：分 */
  cost_price?: number;
  /** 商品小票ID */
  invoice_id?: string;
  /** 单品列表 */
  goods_detail?: GoodsDetail[];
}

/** 商户门店信息 */
export interface StoreInfo {
  /** 门店编号 */
  id: string;
  /** 门店名称 */
  name?: string;
  /** 地区编码 */
  area_code?: string;
  /** 详细地址 */
  address?: string;
}

/** 场景信息 */
export interface SceneInfo {
  /** 用户终端IP */
  payer_client_ip: string;
  /** 商户端设备号 */
  device_id?: string;
  /** 商户门店信息 */
  store_info?: StoreInfo;
}

/** 结算信息 */
export interface SettleInfo {
  /** 是否指定分账 */
  profit_sharing?: boolean;
}

/** JSAPI/小程序下单请求参数 */
export interface CreateJsapiOrderRequest {
  /** 应用ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商品描述 */
  description: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 支付结束时间，RFC 3339 格式 */
  time_expire?: string;
  /** 附加数据 */
  attach?: string;
  /** 通知地址 */
  notify_url: string;
  /** 订单优惠标记 */
  goods_tag?: string;
  /** 是否支持电子发票 */
  support_fapiao?: boolean;
  /** 订单金额 */
  amount: OrderAmount;
  /** 支付者 */
  payer: OrderPayer;
  /** 优惠功能 */
  detail?: OrderDetail;
  /** 场景信息 */
  scene_info?: SceneInfo;
  /** 结算信息 */
  settle_info?: SettleInfo;
}

/** JSAPI/小程序下单响应 */
export interface CreateJsapiOrderResponse {
  /** 预支付交易会话标识 */
  prepay_id: string;
}

// ============= APP 支付下单 =============

/** APP 支付下单请求参数 */
export interface CreateAppOrderRequest {
  /** 应用ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商品描述 */
  description: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 支付结束时间，RFC 3339 格式 */
  time_expire?: string;
  /** 附加数据 */
  attach?: string;
  /** 通知地址 */
  notify_url: string;
  /** 订单优惠标记 */
  goods_tag?: string;
  /** 是否支持电子发票 */
  support_fapiao?: boolean;
  /** 订单金额 */
  amount: OrderAmount;
  /** 优惠功能 */
  detail?: OrderDetail;
  /** 场景信息 */
  scene_info?: SceneInfo;
  /** 结算信息 */
  settle_info?: SettleInfo;
}

/** APP 支付下单响应 */
export interface CreateAppOrderResponse {
  /** 预支付交易会话标识 */
  prepay_id: string;
}

// ============= APP 调起支付 =============

/** APP 调起支付所需参数 */
export interface AppBridgeConfig {
  /** 应用ID */
  appId: string;
  /** 商户号 */
  partnerId: string;
  /** 预支付交易会话ID */
  prepayId: string;
  /** 扩展字段，固定值 Sign=WXPay */
  packageValue: string;
  /** 随机字符串 */
  nonceStr: string;
  /** 时间戳（秒） */
  timeStamp: string;
  /** RSA 签名 */
  sign: string;
}

// ============= H5 支付下单 =============

/** H5 场景信息 */
export interface H5Info {
  /** 场景类型 */
  type: 'Wap' | 'iOS' | 'Android';
  /** 应用名称 */
  app_name?: string;
  /** 网站URL */
  app_url?: string;
  /** iOS 平台 BundleID */
  bundle_id?: string;
  /** Android 平台 PackageName */
  package_name?: string;
}

/** H5 支付场景信息（包含必填的 h5_info） */
export interface H5SceneInfo {
  /** 用户终端IP */
  payer_client_ip: string;
  /** 商户端设备号 */
  device_id?: string;
  /** 商户门店信息 */
  store_info?: StoreInfo;
  /** H5 场景信息 */
  h5_info: H5Info;
}

/** H5 支付下单请求参数 */
export interface CreateH5OrderRequest {
  /** 应用ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商品描述 */
  description: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 支付结束时间，RFC 3339 格式 */
  time_expire?: string;
  /** 附加数据 */
  attach?: string;
  /** 通知地址 */
  notify_url: string;
  /** 订单优惠标记 */
  goods_tag?: string;
  /** 是否支持电子发票 */
  support_fapiao?: boolean;
  /** 订单金额 */
  amount: OrderAmount;
  /** 优惠功能 */
  detail?: OrderDetail;
  /** 场景信息（包含必填的 h5_info） */
  scene_info: H5SceneInfo;
  /** 结算信息 */
  settle_info?: SettleInfo;
}

/** H5 支付下单响应 */
export interface CreateH5OrderResponse {
  /** 支付跳转链接，有效期为5分钟 */
  h5_url: string;
}

// ============= Native 支付下单 =============

/** Native 支付下单请求参数 */
export interface CreateNativeOrderRequest {
  /** 应用ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商品描述 */
  description: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 支付结束时间，RFC 3339 格式 */
  time_expire?: string;
  /** 附加数据 */
  attach?: string;
  /** 通知地址 */
  notify_url: string;
  /** 订单优惠标记 */
  goods_tag?: string;
  /** 是否支持电子发票 */
  support_fapiao?: boolean;
  /** 订单金额 */
  amount: OrderAmount;
  /** 优惠功能 */
  detail?: OrderDetail;
  /** 场景信息 */
  scene_info?: SceneInfo;
  /** 结算信息 */
  settle_info?: SettleInfo;
}

/** Native 支付下单响应 */
export interface CreateNativeOrderResponse {
  /** 二维码链接，用于生成支付二维码。有效期 2 小时。 */
  code_url: string;
}

// ============= 查询订单 =============

/** 查询订单请求参数 */
export interface QueryOrderParams {
  /** 商户订单号（与微信支付订单号二选一） */
  outTradeNo?: string;
  /** 微信支付订单号（与商户订单号二选一） */
  transactionId?: string;
}

/** 订单金额（返回） */
export interface OrderAmountResponse {
  /** 订单总金额，单位：分 */
  total?: number;
  /** 用户支付金额，单位：分 */
  payer_total?: number;
  /** 货币类型 */
  currency?: string;
  /** 用户支付币种 */
  payer_currency?: string;
}

/** 场景信息（返回） */
export interface SceneInfoResponse {
  /** 商户端设备号 */
  device_id?: string;
}

/** 优惠商品详情 */
export interface PromotionGoodsDetail {
  /** 商品编码 */
  goods_id: string;
  /** 商品数量 */
  quantity: number;
  /** 商品单价，单位：分 */
  unit_price: number;
  /** 商品优惠金额，单位：分 */
  discount_amount: number;
  /** 商品备注 */
  goods_remark?: string;
}

/** 优惠详情 */
export interface PromotionDetail {
  /** 券ID */
  coupon_id: string;
  /** 优惠名称 */
  name?: string;
  /** 优惠范围 */
  scope?: 'GLOBAL' | 'SINGLE';
  /** 优惠类型 */
  type?: 'CASH' | 'NOCASH';
  /** 优惠券面额，单位：分 */
  amount: number;
  /** 活动ID */
  stock_id?: string;
  /** 微信出资，单位：分 */
  wechatpay_contribute?: number;
  /** 商户出资，单位：分 */
  merchant_contribute?: number;
  /** 其他出资，单位：分 */
  other_contribute?: number;
  /** 优惠币种 */
  currency?: string;
  /** 单品列表 */
  goods_detail?: PromotionGoodsDetail[];
}

/** 订单查询响应 */
export interface QueryOrderResponse {
  /** 应用ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 微信支付订单号 */
  transaction_id?: string;
  /** 交易类型 */
  trade_type?: 'JSAPI' | 'NATIVE' | 'APP' | 'MICROPAY' | 'MWEB' | 'FACEPAY';
  /** 交易状态 */
  trade_state: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR';
  /** 交易状态描述 */
  trade_state_desc: string;
  /** 付款银行 */
  bank_type?: string;
  /** 附加数据 */
  attach?: string;
  /** 支付完成时间，RFC 3339 格式 */
  success_time?: string;
  /** 支付者 */
  payer?: {
    openid: string;
  };
  /** 订单金额 */
  amount?: OrderAmountResponse;
  /** 场景信息 */
  scene_info?: SceneInfoResponse;
  /** 优惠功能 */
  promotion_detail?: PromotionDetail[];
}

// ============= 关闭订单 =============

/** 关闭订单请求参数 */
export interface CloseOrderParams {
  /** 商户订单号 */
  outTradeNo: string;
}

/** 关闭订单请求体 */
export interface CloseOrderRequest {
  /** 商户号 */
  mchid: string;
}

// ============= 申请退款 =============

/** 退款资金来源账户 */
export interface RefundFromAccount {
  /** 出资账户类型 */
  account: 'AVAILABLE' | 'UNAVAILABLE';
  /** 出资金额，单位：分 */
  amount: number;
}

/** 退款金额 */
export interface RefundAmount {
  /** 退款金额，单位：分 */
  refund: number;
  /** 原订单金额，单位：分 */
  total: number;
  /** 退款币种 */
  currency?: string;
  /** 退款出资账户及金额 */
  from?: RefundFromAccount[];
}

/** 退款商品详情 */
export interface RefundGoodsDetail {
  /** 商户侧商品编码 */
  merchant_goods_id: string;
  /** 微信侧商品编码 */
  wechatpay_goods_id?: string;
  /** 商品名称 */
  goods_name?: string;
  /** 商品单价，单位：分 */
  unit_price: number;
  /** 商品退款金额，单位：分 */
  refund_amount: number;
  /** 商品退款数量 */
  refund_quantity: number;
}

/** 申请退款请求参数 */
export interface CreateRefundRequest {
  /** 商户订单号（与微信支付订单号二选一） */
  out_trade_no?: string;
  /** 微信支付订单号（与商户订单号二选一） */
  transaction_id?: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 退款原因 */
  reason?: string;
  /** 退款结果回调url */
  notify_url?: string;
  /** 退款资金来源 */
  funds_account?: 'AVAILABLE' | 'UNAVAILABLE';
  /** 退款金额 */
  amount: RefundAmount;
  /** 退款商品 */
  goods_detail?: RefundGoodsDetail[];
}

/** 退款金额（返回） */
export interface RefundAmountResponse {
  /** 订单金额，单位：分 */
  total: number;
  /** 退款金额，单位：分 */
  refund: number;
  /** 退款出资账户及金额 */
  from?: RefundFromAccount[];
  /** 用户支付金额，单位：分 */
  payer_total: number;
  /** 用户退款金额，单位：分 */
  payer_refund: number;
  /** 应结退款金额，单位：分 */
  settlement_refund: number;
  /** 应结订单金额，单位：分 */
  settlement_total: number;
  /** 优惠退款金额，单位：分 */
  discount_refund: number;
  /** 退款币种 */
  currency: string;
  /** 手续费退款金额，单位：分 */
  refund_fee?: number;
  /** 用户支付币种 */
  payer_currency?: string;
  /** 手续费金额，单位：分 */
  advance_fee?: number;
}

/** 退款优惠详情 */
export interface RefundPromotionDetail {
  /** 优惠券ID */
  promotion_id: string;
  /** 优惠范围 */
  scope?: 'GLOBAL' | 'SINGLE';
  /** 优惠类型 */
  type?: 'COUPON' | 'DISCOUNT';
  /** 优惠券面额，单位：分 */
  amount: number;
  /** 优惠退款金额，单位：分 */
  refund_amount: number;
  /** 商品列表 */
  goods_detail?: RefundGoodsDetail[];
}

/** 申请退款响应 */
export interface CreateRefundResponse {
  /** 微信支付退款单号 */
  refund_id: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 退款渠道 */
  channel?: 'ORIGINAL' | 'BALANCE' | 'OTHER_BALANCE' | 'OTHER_BANKCARD';
  /** 退款入账账户 */
  user_received_account: string;
  /** 退款成功时间，RFC 3339 格式 */
  success_time?: string;
  /** 退款创建时间，RFC 3339 格式 */
  create_time: string;
  /** 退款状态 */
  status: 'SUCCESS' | 'CLOSED' | 'PROCESSING' | 'ABNORMAL';
  /** 资金账户 */
  funds_account?: 'AVAILABLE' | 'UNAVAILABLE';
  /** 退款金额 */
  amount: RefundAmountResponse;
  /** 优惠退款详情 */
  promotion_detail?: RefundPromotionDetail[];
}

// ============= 查询退款 =============

/** 查询退款请求参数 */
export interface QueryRefundParams {
  /** 商户退款单号 */
  outRefundNo: string;
}

/** 查询退款响应（复用申请退款响应） */
export type QueryRefundResponse = CreateRefundResponse;

// ============= 申请异常退款 =============

/** 申请异常退款请求参数 */
export interface ApplyAbnormalRefundRequest {
  /** 商户退款单号 */
  out_refund_no: string;
  /** 异常退款处理方式 */
  type: 'USER_BANK_CARD' | 'MERCHANT_BANK_CARD';
  /** 开户银行（退款至用户银行卡时必填） */
  bank_type?: string;
  /** 收款银行卡号（需加密，退款至用户银行卡时必填） */
  bank_account?: string;
  /** 收款用户姓名（需加密，退款至用户银行卡时必填） */
  real_name?: string;
}

/** 申请异常退款响应（与申请退款响应结构一致） */
export type ApplyAbnormalRefundResponse = CreateRefundResponse;

// ============= 下载账单 =============

/** 下载账单请求参数 */
export interface DownloadBillParams {
  /** 账单日期，格式 YYYY-MM-DD */
  bill_date: string;
  /** 账单类型 */
  bill_type?: 'ALL' | 'SUCCESS' | 'REFUND';
  /** 压缩方式 */
  tar_type?: 'GZIP';
}

/** 下载账单响应 */
export interface DownloadBillResponse {
  /** 哈希值 */
  hash_type: string;
  /** 摘要值 */
  hash_value: string;
  /** 账单原始数据（tar/gzip 格式的 Buffer） */
  data: Buffer;
}

// ============= 申请交易账单 =============

/** 申请交易账单请求参数 */
export interface TradeBillParams {
  /** 账单日期，格式 YYYY-MM-DD */
  bill_date: string;
  /** 账单类型 */
  bill_type?: 'ALL' | 'SUCCESS' | 'REFUND';
  /** 压缩方式 */
  tar_type?: 'GZIP';
  [key: string]: unknown;
}

/** 申请交易账单响应 */
export interface TradeBillResponse {
  /** 哈希类型 */
  hash_type: string;
  /** 哈希值 */
  hash_value: string;
  /** 下载地址 */
  download_url: string;
}

// ============= 申请资金账单 =============

/** 申请资金账单请求参数 */
export interface FundFlowBillParams {
  /** 账单日期，格式 YYYY-MM-DD */
  bill_date: string;
  /** 资金账户类型 */
  account_type?: 'BASIC' | 'OPERATION' | 'FEES';
  /** 压缩方式 */
  tar_type?: 'GZIP';
  [key: string]: unknown;
}

/** 申请资金账单响应 */
export interface FundFlowBillResponse {
  /** 哈希类型 */
  hash_type: string;
  /** 哈希值 */
  hash_value: string;
  /** 下载地址 */
  download_url: string;
}

// ============= 申请单个子商户资金账单 =============

/** 申请单个子商户资金账单请求参数 */
export interface SubMerchantFundFlowBillParams {
  /** 子商户号 */
  sub_mchid: string;
  /** 账单日期，格式 YYYY-MM-DD */
  bill_date: string;
  /** 资金账户类型 */
  account_type?: 'BASIC' | 'OPERATION' | 'ALL';
  /** 账单文件加密算法 */
  algorithm?: 'AEAD_AES_256_GCM';
  /** 压缩方式 */
  tar_type?: 'GZIP';
  [key: string]: unknown;
}

/** 加密账单文件信息 */
export interface EncryptBillEntity {
  /** 账单文件序号 */
  bill_sequence: number;
  /** 哈希类型 */
  hash_type: string;
  /** 哈希值 */
  hash_value: string;
  /** 下载地址（5分钟内有效） */
  download_url: string;
  /** 加密密钥（已用商户证书公钥加密） */
  encrypt_key: string;
  /** 随机字符串 */
  nonce: string;
}

/** 加密账单响应 */
export interface EncryptBillResponse {
  /** 下载信息总数 */
  download_bill_count: number;
  /** 下载信息明细 */
  download_bill_list: EncryptBillEntity[];
}

// ============= 申请二级商户资金账单 =============

/** 申请二级商户资金账单请求参数 */
export interface EcommerceFundFlowBillParams {
  /** 账单日期，格式 YYYY-MM-DD */
  bill_date: string;
  /** 资金账户类型（本接口只支持填 ALL） */
  account_type?: 'ALL';
  /** 压缩方式 */
  tar_type?: 'GZIP';
  /** 账单文件加密算法 */
  algorithm?: 'AEAD_AES_256_GCM';
  [key: string]: unknown;
}

// ============= 回调通知 =============

/** 回调通知资源 */
export interface CallbackResource {
  /** 原始回调类型 */
  original_type: string;
  /** 加密算法 */
  algorithm: string;
  /** 密文 */
  ciphertext: string;
  /** 附加数据 */
  associated_data: string;
  /** 随机串 */
  nonce: string;
}

/** 回调通知请求体 */
export interface CallbackNotification {
  /** 通知ID */
  id: string;
  /** 通知创建时间，RFC 3339 格式 */
  create_time: string;
  /** 通知类型 */
  event_type: string;
  /** 通知数据类型 */
  resource_type: string;
  /** 回调摘要 */
  summary: string;
  /** 通知资源 */
  resource: CallbackResource;
}

/** 解密后的支付成功通知数据 */
export interface TransactionCallbackData {
  /** 应用ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 交易类型 */
  trade_type: string;
  /** 交易状态 */
  trade_state: string;
  /** 交易状态描述 */
  trade_state_desc: string;
  /** 付款银行 */
  bank_type?: string;
  /** 附加数据 */
  attach?: string;
  /** 支付完成时间，RFC 3339 格式 */
  success_time: string;
  /** 支付者 */
  payer: {
    openid: string;
  };
  /** 订单金额 */
  amount: {
    total: number;
    payer_total: number;
    currency: string;
    payer_currency: string;
  };
}

/** 解密后的合单支付成功通知数据 */
export interface CombineTransactionCallbackData {
  /** 合单发起方 APPID */
  combine_appid: string;
  /** 合单发起方商户号 */
  combine_mchid: string;
  /** 合单商户订单号 */
  combine_out_trade_no: string;
  /** 合单支付者信息 */
  combine_payer_info?: {
    /** 用户 openid */
    openid: string;
  };
  /** 场景信息 */
  scene_info?: {
    /** 终端设备号 */
    device_id?: string;
  };
  /** 子单列表 */
  sub_orders: CombineTransactionSubOrder[];
}

/** 解密后的合单支付成功子单数据 */
export interface CombineTransactionSubOrder {
  /** 子单商户号 */
  mchid: string;
  /** 交易类型 */
  trade_type: 'JSAPI' | 'NATIVE' | 'APP' | 'MWEB';
  /** 交易状态 */
  trade_state: 'SUCCESS' | 'NOTPAY' | 'CLOSED';
  /** 付款银行 */
  bank_type?: string;
  /** 附加数据 */
  attach?: string;
  /** 支付完成时间，RFC 3339 格式 */
  success_time?: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 子单商户订单号 */
  out_trade_no: string;
  /** 子单金额 */
  amount: {
    /** 标价金额，单位：分 */
    total_amount: number;
    /** 标价币种 */
    currency: string;
    /** 用户支付金额，单位：分 */
    payer_amount: number;
    /** 用户支付币种 */
    payer_currency: string;
    /** 结算汇率，值为汇率 × 10^8 */
    settlement_rate?: number;
  };
  /** 优惠详情 */
  promotion_detail?: CombinePromotionDetail[];
}

/** 解密后的退款通知数据 */
export interface RefundCallbackData {
  /** 商户号 */
  mchid: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 微信支付退款单号 */
  refund_id: string;
  /** 退款状态 */
  refund_status: string;
  /** 退款成功时间，RFC 3339 格式 */
  success_time?: string;
  /** 退款入账账户 */
  user_received_account: string;
  /** 退款金额 */
  amount: {
    total: number;
    refund: number;
    payer_total: number;
    payer_refund: number;
  };
}

/** 回调通知头信息 */
export interface CallbackHeaders {
  /** 微信支付签名 */
  'wechatpay-signature': string;
  /** 微信支付时间戳 */
  'wechatpay-timestamp': string;
  /** 微信支付随机数 */
  'wechatpay-nonce': string;
  /** 微信支付证书序列号 */
  'wechatpay-serial': string;
  /** 签名类型 */
  'wechatpay-signature-type'?: string;
}

// ============= JSAPI 调起支付 =============

/** JSAPI 调起支付所需参数 */
export interface JsapiBridgeConfig {
  /** 应用ID */
  appId: string;
  /** 时间戳（秒） */
  timeStamp: string;
  /** 随机字符串 */
  nonceStr: string;
  /** 订单详情扩展字符串，格式 prepay_id=xxx */
  package: string;
  /** 签名方式 */
  signType: string;
  /** 签名 */
  paySign: string;
}

/** 小程序调起支付所需参数（wx.requestPayment 使用） */
export interface MiniProgramBridgeConfig {
  /** 时间戳（秒） */
  timeStamp: string;
  /** 随机字符串 */
  nonceStr: string;
  /** 订单详情扩展字符串，格式 prepay_id=xxx */
  package: string;
  /** 签名方式 */
  signType: string;
  /** 签名 */
  paySign: string;
}

// ============= 合单支付 =============

/** 合单子单金额 */
export interface CombineSubOrderAmount {
  /** 子单金额，单位：分 */
  total_amount: number;
  /** ISO 4217 三位字母代码，境内固定 CNY */
  currency: string;
}

/** 合单子单结算信息 */
export interface CombineSubOrderSettleInfo {
  /** 分账标识，true 表示支付成功后冻结资金可进行分账 */
  profit_sharing?: boolean;
}

/** 合单子单信息（下单请求） */
export interface CombineSubOrder {
  /** 子单参与方商户号，需与 combine_appid 绑定 */
  mchid: string;
  /** 子单商户订单号，6-32 位数字、大小写字母、_-|* */
  out_trade_no: string;
  /** 商品描述 */
  description: string;
  /** 子单金额 */
  amount: CombineSubOrderAmount;
  /** 附加数据，总长度限制 128 字符以内 */
  attach: string;
  /** 结算信息 */
  settle_info?: CombineSubOrderSettleInfo;
  /** 订单优惠标记，用于代金券核销匹配 */
  goods_tag?: string;
}

/** 合单支付者信息 */
export interface CombinePayerInfo {
  /** 用户 openid，在 combine_appid 下的唯一标识 */
  openid?: string;
}

/** 合单场景信息（JSAPI/Native/APP） */
export interface CombineSceneInfo {
  /** 用户终端 IP，支持 IPv4 和 IPv6 */
  payer_client_ip: string;
  /** 终端设备号（门店号或收银设备 ID） */
  device_id?: string;
}

/** H5 合单场景信息 */
export interface H5CombineSceneInfo {
  /** 用户终端 IP，支持 IPv4 和 IPv6 */
  payer_client_ip: string;
  /** 终端设备号（门店号或收银设备 ID） */
  device_id?: string;
  /** H5 场景信息 */
  h5_info: H5Info;
}

/** JSAPI 合单下单请求参数 */
export interface CreateCombineOrderRequest {
  /** 合单发起方公众号 APPID */
  combine_appid: string;
  /** 合单发起方商户号 */
  combine_mchid: string;
  /** 合单商户订单号，6-32 位数字、大小写字母、_-|* */
  combine_out_trade_no: string;
  /** 支付结束时间，RFC 3339 格式 */
  time_expire?: string;
  /** 通知地址 */
  notify_url: string;
  /** 合单支付者信息 */
  combine_payer_info?: CombinePayerInfo;
  /** 子单列表，2-10 笔 */
  sub_orders: CombineSubOrder[];
  /** 场景信息 */
  scene_info?: CombineSceneInfo;
}

/** JSAPI 合单下单响应 */
export interface CreateCombineOrderResponse {
  /** 预支付交易会话标识，有效期 2 小时 */
  prepay_id: string;
}

// ============= APP 合单下单 =============

/** APP 合单下单请求参数 */
export interface CreateAppCombineOrderRequest {
  /** 合单发起方移动应用 APPID，需与 combine_mchid 绑定 */
  combine_appid: string;
  /** 合单发起方商户号，需先申请发起合单支付权限 */
  combine_mchid: string;
  /** 合单商户订单号，6-32 位数字、大小写字母、_-|* */
  combine_out_trade_no: string;
  /** 支付结束时间，RFC 3339 格式。不传默认 7 天，不能早于下单时间后 1 分钟 */
  time_expire?: string;
  /** 通知地址，接收支付成功回调通知的 URL */
  notify_url: string;
  /** 子单列表，2-10 笔 */
  sub_orders: CombineSubOrder[];
  /** 场景信息 */
  scene_info?: CombineSceneInfo;
}

/** APP 合单下单响应 */
export interface CreateAppCombineOrderResponse {
  /** 预支付交易会话标识，有效期 2 小时 */
  prepay_id: string;
}

// ============= H5 合单下单 =============

/** H5 合单下单请求参数 */
export interface CreateH5CombineOrderRequest {
  /** 合单发起方公众号 APPID */
  combine_appid: string;
  /** 合单发起方商户号 */
  combine_mchid: string;
  /** 合单商户订单号，6-32 位数字、大小写字母、_-|* */
  combine_out_trade_no: string;
  /** 支付结束时间，RFC 3339 格式 */
  time_expire?: string;
  /** 通知地址 */
  notify_url: string;
  /** 子单列表，2-10 笔 */
  sub_orders: CombineSubOrder[];
  /** 场景信息（H5 支付必填 h5_info） */
  scene_info?: H5CombineSceneInfo;
}

/** H5 合单下单响应 */
export interface CreateH5CombineOrderResponse {
  /** 支付跳转链接，有效期为 5 分钟 */
  h5_url: string;
}

// ============= 查询合单订单 =============

/** 查询合单订单请求参数 */
export interface QueryCombineOrderParams {
  /** 合单商户订单号 */
  combineOutTradeNo: string;
}

/** 合单子单金额（查询响应） */
export interface CombineSubOrderAmountResponse {
  /** 标价金额，单位：分 */
  total_amount: number;
  /** 用户实际支付金额，单位：分 */
  payer_amount: number;
  /** 标价币种 */
  currency: string;
  /** 用户支付币种 */
  payer_currency?: string;
  /** 结算汇率，值为汇率 × 10^8 */
  settlement_rate?: number;
}

/** 合单优惠商品详情 */
export interface CombinePromotionGoodsDetail {
  /** 商品编码 */
  goods_id: string;
  /** 购买数量 */
  quantity: number;
  /** 商品单价，单位：分 */
  unit_price: number;
  /** 商品优惠金额，单位：分 */
  discount_amount: number;
  /** 商品备注 */
  goods_remark?: string;
}

/** 合单优惠详情 */
export interface CombinePromotionDetail {
  /** 券 ID */
  coupon_id: string;
  /** 券面额，单位：分 */
  amount: number;
  /** 券名称 */
  name?: string;
  /** 优惠范围：GLOBAL 全场通用，SINGLE 单品优惠 */
  scope?: 'GLOBAL' | 'SINGLE';
  /** 优惠类型：CASH 预充值代金券，NOCASH 免充值代金券 */
  type?: 'CASH' | 'NOCASH';
  /** 批次号 */
  stock_id?: string;
  /** 微信出资 */
  wechatpay_contribute?: number;
  /** 商户出资 */
  merchant_contribute?: number;
  /** 其他出资 */
  other_contribute?: number;
  /** 优惠币种 */
  currency?: string;
  /** 单品列表（scope 为 SINGLE 时返回） */
  goods_detail?: CombinePromotionGoodsDetail[];
}

/** 合单子单信息（查询响应） */
export interface CombineSubOrderResponse {
  /** 子单商户号 */
  mchid: string;
  /** 子单商户订单号 */
  out_trade_no: string;
  /** 交易状态：SUCCESS 支付成功，NOTPAY 未支付，CLOSED 已关闭 */
  trade_state: 'SUCCESS' | 'NOTPAY' | 'CLOSED';
  /** 微信支付子单订单号（支付成功后返回） */
  transaction_id?: string;
  /** 交易类型：JSAPI、NATIVE、APP、MWEB */
  trade_type?: 'JSAPI' | 'NATIVE' | 'APP' | 'MWEB';
  /** 付款银行 */
  bank_type?: string;
  /** 附加数据 */
  attach?: string;
  /** 支付完成时间，RFC 3339 格式 */
  success_time?: string;
  /** 子商户号 */
  sub_mchid?: string;
  /** 子商户 APPID */
  sub_appid?: string;
  /** 用户在子商户 appid 下的 openid */
  sub_openid?: string;
  /** 子单金额 */
  amount?: CombineSubOrderAmountResponse;
  /** 优惠详情 */
  promotion_detail?: CombinePromotionDetail[];
}

/** 合单支付者信息（查询响应） */
export interface CombinePayerInfoResponse {
  /** 用户 openid */
  openid?: string;
}

/** 合单场景信息（查询响应） */
export interface CombineSceneInfoResponse {
  /** 终端设备号 */
  device_id?: string;
}

/** 查询合单订单响应 */
export interface QueryCombineOrderResponse {
  /** 合单发起方 APPID */
  combine_appid: string;
  /** 合单发起方商户号 */
  combine_mchid: string;
  /** 合单商户订单号 */
  combine_out_trade_no: string;
  /** 合单支付者信息（支付成功后返回） */
  combine_payer_info?: CombinePayerInfoResponse;
  /** 场景信息（下单时传入则返回） */
  scene_info?: CombineSceneInfoResponse;
  /** 子单列表 */
  sub_orders?: CombineSubOrderResponse[];
}

// ============= 关闭合单订单 =============

/** 关闭合单订单请求参数 */
export interface CloseCombineOrderParams {
  /** 合单商户订单号 */
  combineOutTradeNo: string;
}

/** 关闭合单子单信息 */
export interface CloseCombineSubOrder {
  /** 子单商户号，必须与下单时一致 */
  mchid: string;
  /** 子单商户订单号，必须与下单时一致 */
  out_trade_no: string;
}

/** 关闭合单订单请求体 */
export interface CloseCombineOrderRequest {
  /** 合单发起方 APPID，必须与下单时一致 */
  combine_appid: string;
  /** 子单列表，必须与下单时的子单完全一致 */
  sub_orders: CloseCombineSubOrder[];
}

// ============= Native 合单下单 =============

/** Native 合单下单请求参数 */
export interface CreateNativeCombineOrderRequest {
  /** 合单发起方公众号 APPID，需与 combine_mchid 绑定 */
  combine_appid: string;
  /** 合单发起方商户号，需先申请发起合单支付权限 */
  combine_mchid: string;
  /** 合单商户订单号，6-32 位数字、大小写字母、_-|* */
  combine_out_trade_no: string;
  /** 支付结束时间，RFC 3339 格式。不传默认 7 天，不能早于下单时间后 1 分钟 */
  time_expire?: string;
  /** 通知地址，接收支付成功回调通知的 URL */
  notify_url: string;
  /** 子单列表，2-10 笔 */
  sub_orders: CombineSubOrder[];
  /** 场景信息 */
  scene_info?: CombineSceneInfo;
}

/** Native 合单下单响应 */
export interface CreateNativeCombineOrderResponse {
  /** 二维码链接，用于生成支付二维码。有效期 2 小时。 */
  code_url: string;
}

// ============= 小程序合单下单 =============

/**
 * 小程序合单下单请求参数
 *
 * 与 JSAPI 合单下单使用同一接口 /v3/combine-transactions/jsapi，
 * 但 combine_appid 需为小程序 AppID，且 combine_payer_info 中的 openid
 * 在小程序场景下由运行环境隐式提供，无需强制传入。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556931
 */
export interface CreateMiniProgramCombineOrderRequest {
  /** 合单发起方小程序 APPID，需与各子单商户号绑定 */
  combine_appid: string;
  /** 合单发起方商户号，需先申请发起合单支付权限 */
  combine_mchid: string;
  /** 合单商户订单号，6-32 位数字、大小写字母、_-|* */
  combine_out_trade_no: string;
  /** 支付结束时间，RFC 3339 格式。不传默认 7 天 */
  time_expire?: string;
  /** 通知地址，接收支付成功回调通知的 URL */
  notify_url: string;
  /** 合单支付者信息（小程序场景下 openid 可选） */
  combine_payer_info?: CombinePayerInfo;
  /** 子单列表，2-10 笔 */
  sub_orders: CombineSubOrder[];
  /** 场景信息 */
  scene_info?: CombineSceneInfo;
}

/** 小程序合单下单响应 */
export interface CreateMiniProgramCombineOrderResponse {
  /** 预支付交易会话标识，有效期 2 小时 */
  prepay_id: string;
}

// ============= 分账 =============

/** 分账接收方类型 */
export type ProfitSharingReceiverType = 'MERCHANT_ID' | 'PERSONAL_OPENID';

/** 分账关系类型 */
export type ProfitSharingRelationType =
  | 'STORE'
  | 'STAFF'
  | 'STORE_OWNER'
  | 'PARTNER'
  | 'HEADQUARTER'
  | 'BRAND'
  | 'DISTRIBUTOR'
  | 'USER'
  | 'SUPPLIER'
  | 'CUSTOM';

/** 分账单状态 */
export type ProfitSharingState = 'PROCESSING' | 'FINISHED';

/** 分账接收方分账结果 */
export type ProfitSharingReceiverResult = 'PENDING' | 'SUCCESS' | 'CLOSED';

/** 分账接收方分账失败原因 */
export type ProfitSharingFailReason =
  | 'ACCOUNT_ABNORMAL'
  | 'NO_RELATION'
  | 'RECEIVER_HIGH_RISK'
  | 'RECEIVER_REAL_NAME_NOT_VERIFIED'
  | 'NO_AUTH'
  | 'RECEIVER_RECEIPT_LIMIT'
  | 'PAYER_ACCOUNT_ABNORMAL'
  | 'INVALID_REQUEST';

/** 分账回退结果 */
export type ProfitSharingReturnResult = 'PROCESSING' | 'SUCCESS' | 'FAILED';

/** 分账回退失败原因 */
export type ProfitSharingReturnFailReason =
  | 'ACCOUNT_ABNORMAL'
  | 'BALANCE_NOT_ENOUGH'
  | 'TIME_OUT_CLOSED'
  | 'PAYER_ACCOUNT_ABNORMAL'
  | 'INVALID_REQUEST';

// ============= 请求分账 =============

/** 分账接收方（请求） */
export interface ProfitSharingReceiver {
  /** 分账接收方类型 */
  type: ProfitSharingReceiverType;
  /** 分账接收方账号 */
  account: string;
  /** 分账接收方全称（需使用微信支付公钥加密），MERCHANT_ID 类型必填 */
  name?: string;
  /** 分账金额，单位：分 */
  amount: number;
  /** 分账描述 */
  description: string;
}

/** 请求分账请求参数 */
export interface CreateProfitSharingOrderRequest {
  /** 公众号 AppID（有 PERSONAL_OPENID 类型接收方时必填） */
  appid?: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户分账单号，商户系统内唯一 */
  out_order_no: string;
  /** 分账接收方列表，最多 50 个 */
  receivers: ProfitSharingReceiver[];
  /** 是否解冻剩余未分金额 */
  unfreeze_unsplit: boolean;
}

/** 分账接收方（响应） */
export interface ProfitSharingReceiverResponse {
  /** 分账金额，单位：分 */
  amount: number;
  /** 分账描述 */
  description: string;
  /** 分账接收方类型 */
  type: ProfitSharingReceiverType;
  /** 分账接收方账号 */
  account: string;
  /** 分账结果 */
  result: ProfitSharingReceiverResult;
  /** 分账失败原因（仅 result 为 CLOSED 时返回） */
  fail_reason?: ProfitSharingFailReason;
  /** 分账创建时间，RFC3339 格式 */
  create_time: string;
  /** 分账完成时间，RFC3339 格式 */
  finish_time: string;
  /** 微信分账明细单号 */
  detail_id: string;
}

/** 请求分账响应 */
export interface CreateProfitSharingOrderResponse {
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户分账单号 */
  out_order_no: string;
  /** 微信分账单号 */
  order_id: string;
  /** 分账单状态 */
  state: ProfitSharingState;
  /** 分账接收方列表 */
  receivers: ProfitSharingReceiverResponse[];
}

// ============= 查询分账结果 =============

/** 查询分账结果请求参数 */
export interface QueryProfitSharingOrderParams {
  /** 商户分账单号 */
  outOrderNo: string;
  /** 微信支付订单号 */
  transactionId: string;
}

/** 查询分账结果响应（复用请求分账响应） */
export type QueryProfitSharingOrderResponse = CreateProfitSharingOrderResponse;

// ============= 请求分账回退 =============

/** 请求分账回退请求参数 */
export interface CreateProfitSharingReturnOrderRequest {
  /** 微信分账单号（与 out_order_no 二选一） */
  order_id?: string;
  /** 商户分账单号（与 order_id 二选一） */
  out_order_no?: string;
  /** 商户回退单号 */
  out_return_no: string;
  /** 回退商户号 */
  return_mchid: string;
  /** 回退金额，单位：分 */
  amount: number;
  /** 回退原因描述 */
  description: string;
}

/** 请求分账回退响应 */
export interface CreateProfitSharingReturnOrderResponse {
  /** 微信分账单号 */
  order_id: string;
  /** 商户分账单号 */
  out_order_no: string;
  /** 商户回退单号 */
  out_return_no: string;
  /** 微信回退单号 */
  return_id: string;
  /** 回退商户号 */
  return_mchid: string;
  /** 回退金额，单位：分 */
  amount: number;
  /** 回退原因描述 */
  description: string;
  /** 回退结果 */
  result: ProfitSharingReturnResult;
  /** 失败原因（仅 result 为 FAILED 时返回） */
  fail_reason?: ProfitSharingReturnFailReason;
  /** 创建时间，RFC3339 格式 */
  create_time: string;
  /** 完成时间，RFC3339 格式 */
  finish_time: string;
}

// ============= 查询分账回退结果 =============

/** 查询分账回退结果请求参数 */
export interface QueryProfitSharingReturnOrderParams {
  /** 商户回退单号 */
  outReturnNo: string;
  /** 商户分账单号 */
  outOrderNo: string;
}

/** 查询分账回退结果响应（复用请求回退响应） */
export type QueryProfitSharingReturnOrderResponse = CreateProfitSharingReturnOrderResponse;

// ============= 解冻剩余资金 =============

/** 解冻剩余资金请求参数 */
export interface UnfreezeProfitSharingRequest {
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户分账单号 */
  out_order_no: string;
  /** 解冻原因描述 */
  description: string;
}

/** 解冻剩余资金响应（复用请求分账响应） */
export type UnfreezeProfitSharingResponse = CreateProfitSharingOrderResponse;

// ============= 查询剩余待分金额 =============

/** 查询剩余待分金额响应 */
export interface QueryProfitSharingAmountResponse {
  /** 微信支付订单号 */
  transaction_id: string;
  /** 订单剩余待分金额，单位：分 */
  unsplit_amount: number;
}

// ============= 添加分账接收方 =============

/** 添加分账接收方请求参数 */
export interface AddProfitSharingReceiverRequest {
  /** 公众号 AppID */
  appid: string;
  /** 分账接收方类型 */
  type: ProfitSharingReceiverType;
  /** 分账接收方账号 */
  account: string;
  /** 分账接收方全称（需使用微信支付公钥加密），MERCHANT_ID 类型必填 */
  name?: string;
  /** 与分账方的关系类型 */
  relation_type: ProfitSharingRelationType;
  /** 自定义关系描述（relation_type 为 CUSTOM 时必填） */
  custom_relation?: string;
}

/** 添加分账接收方响应 */
export interface AddProfitSharingReceiverResponse {
  /** 分账接收方类型 */
  type: ProfitSharingReceiverType;
  /** 分账接收方账号 */
  account: string;
  /** 分账接收方全称（加密） */
  name?: string;
  /** 与分账方的关系类型 */
  relation_type: ProfitSharingRelationType;
  /** 自定义关系描述 */
  custom_relation?: string;
}

// ============= 删除分账接收方 =============

/** 删除分账接收方请求参数 */
export interface DeleteProfitSharingReceiverRequest {
  /** 公众号 AppID */
  appid: string;
  /** 分账接收方类型 */
  type: ProfitSharingReceiverType;
  /** 分账接收方账号 */
  account: string;
}

/** 删除分账接收方响应 */
export interface DeleteProfitSharingReceiverResponse {
  /** 分账接收方类型 */
  type: ProfitSharingReceiverType;
  /** 分账接收方账号 */
  account: string;
}

// ============= 申请分账账单 =============

/** 申请分账账单请求参数 */
export interface ProfitSharingBillParams {
  /** 账单日期，格式 YYYY-MM-DD */
  bill_date: string;
  /** 压缩方式 */
  tar_type?: 'GZIP';
  [key: string]: unknown;
}

/** 申请分账账单响应 */
export interface ProfitSharingBillResponse {
  /** 哈希类型 */
  hash_type: string;
  /** 哈希值 */
  hash_value: string;
  /** 下载地址（30s 内有效） */
  download_url: string;
}

// ============= 分账回调通知 =============

/** 解密后的分账动账通知数据 */
export interface ProfitSharingCallbackData {
  /** 直连模式分账发起和出资商户 */
  mchid: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 微信分账/回退单号 */
  order_id: string;
  /** 商户系统内部的分账/回退单号 */
  out_order_no: string;
  /** 分账接收方 */
  receiver: {
    /** 分账接收方类型 */
    type: ProfitSharingReceiverType;
    /** 分账接收方账号 */
    account: string;
    /** 分账动账金额，单位：分 */
    amount: number;
    /** 分账/回退描述 */
    description: string;
  };
  /** 成功时间，RFC3339 格式 */
  success_time: string;
}

// ============= 支付分 =============

/** 支付分订单状态 */
export type PayScoreOrderState = 'CREATED' | 'DOING' | 'DONE' | 'REVOKED' | 'EXPIRED';

/** 支付分订单状态描述（仅 DOING 状态返回） */
export type PayScoreOrderStateDescription = 'USER_CONFIRM' | 'MCH_COMPLETE';

/** 支付分收款状态 */
export type PayScoreCollectionState = 'USER_PAYING' | 'USER_PAID';

/** 支付分订单风险金 */
export interface PayScoreRiskFund {
  /** 风险名称：先免模式可选 DEPOSIT/ADVANCE/CASH_DEPOSIT，先享模式固定 ESTIMATE_ORDER_COST */
  name: 'DEPOSIT' | 'ADVANCE' | 'CASH_DEPOSIT' | 'ESTIMATE_ORDER_COST';
  /** 风险金额，单位：分 */
  amount: number;
  /** 风险说明 */
  description?: string;
}

/** 支付分订单后付费项目 */
export interface PayScorePayment {
  /** 付费名称 */
  name: string;
  /** 付费金额，单位：分 */
  amount?: number;
  /** 付费说明 */
  description?: string;
  /** 付费数量 */
  count?: number;
}

/** 支付分订单后付费优惠 */
export interface PayScoreDiscount {
  /** 优惠名称 */
  name: string;
  /** 优惠说明 */
  description?: string;
  /** 优惠金额，单位：分 */
  amount?: number;
  /** 优惠数量 */
  count?: number;
}

/** 支付分订单服务时间范围 */
export interface PayScoreTimeRange {
  /** 服务开始时间，格式：yyyyMMddHHmmss / yyyyMMdd / OnAccept */
  start_time: string;
  /** 服务结束时间，格式需与 start_time 一致 */
  end_time?: string;
  /** 服务开始时间备注 */
  start_time_remark?: string;
  /** 服务结束时间备注 */
  end_time_remark?: string;
}

/** 支付分订单服务位置 */
export interface PayScoreLocation {
  /** 服务开始地点 */
  start_location?: string;
  /** 服务结束地点 */
  end_location?: string;
}

/** 支付分订单设备信息 */
export interface PayScoreDevice {
  /** 服务开始的设备ID */
  start_device_id?: string;
  /** 服务结束的设备ID */
  end_device_id?: string;
  /** 物料URL */
  materiel_no?: string;
}

/** 支付分收款明细 */
export interface PayScoreCollectionDetail {
  /** 收款序号，从1递增 */
  seq?: number;
  /** 单笔收款金额，单位：分 */
  amount: number;
  /** 收款渠道：NEWTON（支付分渠道）/ MCH（商户渠道） */
  paid_type?: string;
  /** 收款成功时间，格式：yyyyMMddHHmmss */
  paid_time?: string;
  /** 微信支付交易单号 */
  transaction_id?: string;
}

/** 支付分收款信息 */
export interface PayScoreCollection {
  /** 收款状态 */
  state: PayScoreCollectionState;
  /** 总收款金额，单位：分 */
  total_amount?: number;
  /** 待收金额，单位：分 */
  paying_amount?: number;
  /** 已收金额，单位：分 */
  paid_amount?: number;
  /** 收款明细列表 */
  details?: PayScoreCollectionDetail[];
}

/** 支付分优惠商品详情 */
export interface PayScorePromotionGoodsDetail {
  /** 商品编码 */
  goods_id: string;
  /** 商品数量 */
  quantity?: number;
  /** 商品单价，单位：分 */
  unit_price?: number;
  /** 商品优惠金额 */
  discount_amount?: number;
  /** 商品备注 */
  goods_remark?: string;
}

/** 支付分优惠详情（代金券信息） */
export interface PayScorePromotionDetail {
  /** 券ID */
  coupon_id: string;
  /** 优惠名称 */
  name?: string;
  /** 优惠范围：GLOBAL（全场）/ SINGLE（单品） */
  scope?: 'GLOBAL' | 'SINGLE';
  /** 优惠类型：CASH（预充值）/ NOCASH（免充值） */
  type?: 'CASH' | 'NOCASH';
  /** 优惠券面额 */
  amount: number;
  /** 活动ID */
  stock_id?: string;
  /** 微信出资金额 */
  wechatpay_contribute?: number;
  /** 商户出资金额 */
  merchant_contribute?: number;
  /** 其他出资金额 */
  other_contribute?: number;
  /** 优惠币种 */
  currency?: string;
  /** 单品列表 */
  goods_detail?: PayScorePromotionGoodsDetail[];
}

// ============= 支付分 - 创建订单 =============

/** 创建支付分订单请求参数 */
export interface CreatePayScoreOrderRequest {
  /** 商户服务订单号 */
  out_order_no: string;
  /** 公众账号ID */
  appid: string;
  /** 服务ID */
  service_id: string;
  /** 服务信息 */
  service_introduction: string;
  /** 服务时间段 */
  time_range: PayScoreTimeRange;
  /** 服务风险金 */
  risk_fund: PayScoreRiskFund;
  /** 商户回调地址 */
  notify_url: string;
  /** 后付费项目 */
  post_payments?: PayScorePayment[];
  /** 商户优惠 */
  post_discounts?: PayScoreDiscount[];
  /** 服务位置 */
  location?: PayScoreLocation;
  /** 商户数据包 */
  attach?: string;
  /** 是否需要用户确认 */
  need_user_confirm?: boolean;
  /** 设备信息 */
  device?: PayScoreDevice;
}

/** 创建支付分订单响应 */
export interface CreatePayScoreOrderResponse {
  /** 公众账号ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 服务ID */
  service_id: string;
  /** 服务信息 */
  service_introduction: string;
  /** 订单状态 */
  state: PayScoreOrderState;
  /** 订单状态说明 */
  state_description?: PayScoreOrderStateDescription;
  /** 后付费项目 */
  post_payments?: PayScorePayment[];
  /** 商户优惠 */
  post_discounts?: PayScoreDiscount[];
  /** 服务风险金 */
  risk_fund: PayScoreRiskFund;
  /** 服务时间段 */
  time_range: PayScoreTimeRange;
  /** 服务位置 */
  location?: PayScoreLocation;
  /** 商户数据包 */
  attach?: string;
  /** 商户回调地址 */
  notify_url: string;
  /** 微信支付服务订单号 */
  order_id: string;
  /** 跳转微信侧小程序订单数据 */
  package: string;
}

// ============= 支付分 - 查询订单 =============

/** 查询支付分订单请求参数 */
export interface QueryPayScoreOrderParams {
  /** 商户服务订单号（与 query_id 二选一） */
  out_order_no?: string;
  /** 服务ID */
  service_id: string;
  /** 公众账号ID */
  appid: string;
  /** 回跳查询ID（与 out_order_no 二选一） */
  query_id?: string;
}

/** 查询支付分订单响应 */
export interface QueryPayScoreOrderResponse {
  /** 公众账号ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 服务ID */
  service_id: string;
  /** 服务信息 */
  service_introduction: string;
  /** 订单状态 */
  state: PayScoreOrderState;
  /** 订单状态说明 */
  state_description?: PayScoreOrderStateDescription;
  /** 后付费项目 */
  post_payments?: PayScorePayment[];
  /** 商户优惠 */
  post_discounts?: PayScoreDiscount[];
  /** 服务风险金 */
  risk_fund: PayScoreRiskFund;
  /** 服务时间段 */
  time_range: PayScoreTimeRange;
  /** 服务位置 */
  location?: PayScoreLocation;
  /** 商户数据包 */
  attach?: string;
  /** 商户回调地址 */
  notify_url: string;
  /** 微信支付服务订单号 */
  order_id: string;
  /** 跳转微信侧小程序订单数据 */
  package: string;
  /** 订单最终收款总金额，单位：分 */
  total_amount?: number;
  /** 是否需要收款 */
  need_collection?: boolean;
  /** 收款信息 */
  collection?: PayScoreCollection;
  /** 用户在商户appid下的唯一标识 */
  openid?: string;
  /** 代金券信息 */
  promotion_detail?: PayScorePromotionDetail[];
}

// ============= 支付分 - 取消订单 =============

/** 取消支付分订单请求参数 */
export interface CancelPayScoreOrderRequest {
  /** 公众账号ID */
  appid: string;
  /** 服务ID */
  service_id?: string;
  /** 撤销原因 */
  reason: string;
}

/** 取消支付分订单响应 */
export interface CancelPayScoreOrderResponse {
  /** 公众账号ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 服务ID */
  service_id: string;
  /** 微信支付服务订单号 */
  order_id: string;
}

// ============= 支付分 - 完结订单 =============

/** 完结支付分订单请求参数 */
export interface CompletePayScoreOrderRequest {
  /** 公众账号ID */
  appid: string;
  /** 服务ID */
  service_id: string;
  /** 后付费项目 */
  post_payments: PayScorePayment[];
  /** 商户优惠 */
  post_discounts?: PayScoreDiscount[];
  /** 订单最终收款总金额，单位：分 */
  total_amount: number;
  /** 实际服务时间段 */
  time_range?: PayScoreTimeRange;
  /** 实际服务位置 */
  location?: PayScoreLocation;
  /** 分账标记 */
  profit_sharing?: boolean;
  /** 订单优惠标记 */
  goods_tag?: string;
  /** 设备信息 */
  device?: PayScoreDevice;
}

/** 完结支付分订单响应 */
export interface CompletePayScoreOrderResponse {
  /** 公众账号ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 服务ID */
  service_id: string;
  /** 服务信息 */
  service_introduction: string;
  /** 订单状态 */
  state: PayScoreOrderState;
  /** 订单状态说明 */
  state_description?: PayScoreOrderStateDescription;
  /** 后付费项目 */
  post_payments?: PayScorePayment[];
  /** 商户优惠 */
  post_discounts?: PayScoreDiscount[];
  /** 服务风险金 */
  risk_fund: PayScoreRiskFund;
  /** 服务时间段 */
  time_range: PayScoreTimeRange;
  /** 服务位置 */
  location?: PayScoreLocation;
  /** 商户数据包 */
  attach?: string;
  /** 商户回调地址 */
  notify_url: string;
  /** 微信支付服务订单号 */
  order_id: string;
  /** 跳转微信侧小程序订单数据 */
  package: string;
  /** 订单最终收款总金额，单位：分 */
  total_amount?: number;
  /** 是否需要收款 */
  need_collection?: boolean;
}

// ============= 支付分 - 修改订单金额 =============

/** 修改支付分订单金额请求参数 */
export interface ModifyPayScoreOrderRequest {
  /** 公众账号ID */
  appid: string;
  /** 服务ID */
  service_id: string;
  /** 后付费项目 */
  post_payments: PayScorePayment[];
  /** 商户优惠 */
  post_discounts?: PayScoreDiscount[];
  /** 订单最终收款总金额，单位：分 */
  total_amount: number;
  /** 修改原因 */
  reason: string;
  /** 设备信息 */
  device?: PayScoreDevice;
}

/** 修改支付分订单金额响应（与查询响应结构相同） */
export type ModifyPayScoreOrderResponse = QueryPayScoreOrderResponse;

// ============= 支付分 - 同步订单状态 =============

/** 同步支付分订单状态请求参数 */
export interface SyncPayScoreOrderRequest {
  /** 公众账号ID */
  appid: string;
  /** 服务ID */
  service_id: string;
  /** 场景类型，固定传 Order_Paid */
  type: 'Order_Paid';
  /** 内容信息详情 */
  detail: {
    /** 收款成功时间，格式：yyyyMMddHHmmss 或 yyyyMMdd */
    paid_time: string;
  };
}

/** 同步支付分订单状态响应（与查询响应结构相同） */
export type SyncPayScoreOrderResponse = QueryPayScoreOrderResponse;

// ============= 支付分 - 回调通知 =============

/** 解密后的支付分用户确认回调通知数据 */
export interface PayScoreUserConfirmCallbackData {
  /** 公众账号ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 服务ID */
  service_id: string;
  /** 用户在商户appid下的唯一标识 */
  openid: string;
  /** 订单状态 */
  state: PayScoreOrderState;
  /** 订单状态说明 */
  state_description: PayScoreOrderStateDescription;
  /** 订单最终收款总金额，单位：分 */
  total_amount?: number;
  /** 服务信息 */
  service_introduction: string;
  /** 后付费项目 */
  post_payments?: PayScorePayment[];
  /** 商户优惠 */
  post_discounts?: PayScoreDiscount[];
  /** 服务风险金 */
  risk_fund: PayScoreRiskFund;
  /** 服务时间段 */
  time_range: PayScoreTimeRange;
  /** 服务位置 */
  location?: PayScoreLocation;
  /** 商户数据包 */
  attach?: string;
  /** 微信支付服务订单号 */
  order_id?: string;
  /** 是否需要收款 */
  need_collection?: boolean;
}

/** 解密后的支付分支付成功回调通知数据 */
export interface PayScoreUserPaidCallbackData {
  /** 公众账号ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 服务ID */
  service_id: string;
  /** 用户在商户appid下的唯一标识 */
  openid: string;
  /** 订单状态 */
  state: PayScoreOrderState;
  /** 订单状态说明 */
  state_description: PayScoreOrderStateDescription;
  /** 订单最终收款总金额，单位：分 */
  total_amount?: number;
  /** 服务信息 */
  service_introduction: string;
  /** 后付费项目 */
  post_payments?: PayScorePayment[];
  /** 商户优惠 */
  post_discounts?: PayScoreDiscount[];
  /** 服务风险金 */
  risk_fund: PayScoreRiskFund;
  /** 服务时间段 */
  time_range: PayScoreTimeRange;
  /** 服务位置 */
  location?: PayScoreLocation;
  /** 商户数据包 */
  attach?: string;
  /** 微信支付服务订单号 */
  order_id?: string;
  /** 是否需要收款 */
  need_collection?: boolean;
  /** 收款信息 */
  collection?: PayScoreCollection;
  /** 代金券信息 */
  promotion_detail?: PayScorePromotionDetail[];
}

/**
 * 支付分退款回调通知解密数据
 *
 * 支付分订单退款完成后，微信支付会向商户发送此回调通知。
 * event_type 为 REFUND.SUCCESS、REFUND.ABNORMAL 或 REFUND.CLOSED。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587976
 */
export interface PayScoreRefundCallbackData {
  /** 微信退款单号 */
  refund_id: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 微信支付分订单号 */
  order_id: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 退款状态 */
  refund_status: 'SUCCESS' | 'CLOSED' | 'ABNORMAL';
  /** 退款成功时间，状态为 SUCCESS 时返回，RFC3339 格式 */
  success_time?: string;
  /** 退款入账账户 */
  user_received_account: string;
  /** 退款金额信息 */
  amount: {
    /** 原订单金额，单位：分 */
    total: number;
    /** 退款金额，单位：分 */
    refund: number;
    /** 用户退款金额，单位：分 */
    payer_refund: number;
    /** 应结退款金额，单位：分 */
    settlement_refund: number;
    /** 应结订单金额 */
    settlement_total: number;
    /** 退款币种 */
    currency: string;
  };
}

// ============= 支付分 - 调起配置 =============

/** 支付分 JSAPI 调起确认订单页所需参数 */
export interface PayScoreJsapiBridgeConfig {
  /** 公众号 AppID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 服务ID */
  service_id: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 时间戳 */
  timestamp: string;
  /** 随机字符串 */
  nonce_str: string;
  /** 签名类型 */
  sign_type: string;
  /** 签名 */
  sign: string;
}

/** 支付分小程序调起确认订单页所需参数 */
export interface PayScoreMiniProgramBridgeConfig {
  /** 商户号 */
  mchid: string;
  /** 服务ID */
  service_id: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 时间戳 */
  timestamp: string;
  /** 随机字符串 */
  nonce_str: string;
  /** 签名类型 */
  sign_type: string;
  /** 签名 */
  sign: string;
}

/** 支付分 APP 调起确认订单页所需参数 */
export interface PayScoreAppBridgeConfig {
  /** 应用 AppID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 服务ID */
  service_id: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 时间戳 */
  timestamp: string;
  /** 随机字符串 */
  nonce_str: string;
  /** 签名类型 */
  sign_type: string;
  /** 签名 */
  sign: string;
}

// ============= 支付分停车服务 =============

/** 车牌颜色 */
export type PlateColor = 'BLUE' | 'GREEN' | 'YELLOW' | 'BLACK' | 'WHITE' | 'LIMEGREEN';

/** 停车入场服务状态 */
export type ParkingState = 'NORMAL' | 'BLOCKED';

/** 停车入场不可用原因（创建停车入场时返回） */
export type ParkingBlockReason = 'PAUSE' | 'OVERDUE' | 'OUT_SERVICE' | 'EVALUATION_FAILED';

/** 车牌服务开通状态 */
export type PlateServiceState = 'NORMAL' | 'PAUSE' | 'OUT_SERVICE';

/** 停车扣费交易状态 */
export type ParkingTradeState = 'SUCCESS' | 'ACCEPTED' | 'PAY_FAIL' | 'REFUND';

// ============= 支付分停车服务 - 创建停车入场 =============

/** 创建停车入场请求 */
export interface CreateParkingRequest {
  /** 商户侧入场标识ID，在同一商户号下需唯一 */
  out_parking_no: string;
  /** 车牌号，仅包含省份+车牌，不包括特殊字符 */
  plate_number: string;
  /** 车牌颜色 */
  plate_color: PlateColor;
  /** 接受入场状态变更回调通知的URL，仅支持HTTPS */
  notify_url: string;
  /** 入场时间，遵循rfc3339标准格式：yyyy-MM-DDTHH:mm:ss+TIMEZONE */
  start_time: string;
  /** 停车场名称 */
  parking_name: string;
  /** 免费停车时长，单位为秒 */
  free_duration: number;
}

/** 创建停车入场响应 */
export interface CreateParkingResponse {
  /** 车主服务为商户分配的停车入场ID */
  id: string;
  /** 商户侧入场标识ID */
  out_parking_no: string;
  /** 车牌号 */
  plate_number: string;
  /** 车牌颜色 */
  plate_color: PlateColor;
  /** 入场时间，rfc3339格式 */
  start_time: string;
  /** 停车场名称 */
  parking_name: string;
  /** 免费停车时长，单位为秒 */
  free_duration: number;
  /** 入场服务状态：NORMAL（正常）/ BLOCKED（不可用） */
  state: ParkingState;
  /** 不可用原因，仅当state为BLOCKED时返回 */
  block_reason?: ParkingBlockReason;
}

// ============= 支付分停车服务 - 查询车牌服务开通信息 =============

/** 查询车牌服务开通信息请求参数 */
export interface QueryPlateServiceParams {
  /** 公众账号ID */
  appid: string;
  /** 车牌号，仅包括省份+车牌，不包括特殊字符 */
  plate_number: string;
  /** 用户在商户对应AppID下的唯一标识 */
  openid: string;
  /** 车牌颜色 */
  plate_color: PlateColor;
}

/** 查询车牌服务开通信息响应 */
export interface QueryPlateServiceResponse {
  /** 车牌号 */
  plate_number: string;
  /** 车牌颜色 */
  plate_color: PlateColor;
  /** 车牌服务开通时间，遵循rfc3339标准格式 */
  service_open_time?: string;
  /** 用户在商户对应AppID下的唯一标识 */
  openid: string;
  /** 车牌服务开通状态 */
  service_state: PlateServiceState;
}

// ============= 支付分停车服务 - 扣费受理 =============

/** 停车场景信息 */
export interface ParkingSceneInfo {
  /** 入场ID，由微信支付分停车服务分配 */
  parking_id: string;
  /** 车牌号，仅包括省份+车牌，不包括特殊字符 */
  plate_number: string;
  /** 车牌颜色 */
  plate_color: PlateColor;
  /** 入场时间，RFC3339格式 */
  start_time: string;
  /** 出场时间，RFC3339格式 */
  end_time: string;
  /** 停车场名称 */
  parking_name: string;
  /** 计费时长，单位为秒 */
  charging_duration: number;
  /** 停车场设备ID */
  device_id: string;
}

/** 停车扣费订单金额 */
export interface ParkingAmount {
  /** 订单总金额，单位为分 */
  total: number;
  /** 货币类型，ISO 4217标准，目前仅支持CNY */
  currency?: string;
}

/** 停车扣费优惠信息 */
export interface ParkingPromotionDetail {
  /** 券或立减优惠ID */
  coupon_id: string;
  /** 优惠名称 */
  name?: string;
  /** 优惠范围：GLOBAL（全场代金券）/ SINGLE（单品优惠） */
  scope?: 'GLOBAL' | 'SINGLE';
  /** 优惠类型：CASH（充值型代金券）/ NOCASH（免充值型代金券） */
  type?: 'CASH' | 'NOCASH';
  /** 活动批次ID */
  stock_id?: string;
  /** 用户享受优惠的金额，单位为分 */
  amount: number;
  /** 微信出资金额，单位为分 */
  wechatpay_contribute?: number;
  /** 商户出资金额，单位为分 */
  merchant_contribute?: number;
  /** 其他出资方出资金额，单位为分 */
  other_contribute?: number;
  /** 优惠币种 */
  currency?: string;
}

/** 扣费受理请求 */
export interface CreateParkingTransactionRequest {
  /** 公众账号ID */
  appid: string;
  /** 服务描述，用于交易账单中对扣费服务的描述 */
  description: string;
  /** 附加数据，在查询API和支付通知中原样返回 */
  attach?: string;
  /** 商户系统内部订单号，同一商户号下唯一 */
  out_trade_no: string;
  /** 交易场景，目前支持：PARKING */
  trade_scene: 'PARKING';
  /** 订单优惠标记 */
  goods_tag?: string;
  /** 接受扣款结果异步回调的URL，仅支持HTTPS */
  notify_url: string;
  /** 分账标识：Y(需分账)、N(不分账)，默认不分账 */
  profit_sharing?: string;
  /** 订单金额信息 */
  amount: ParkingAmount;
  /** 停车场景信息，trade_scene为PARKING时需填写 */
  parking_info: ParkingSceneInfo;
}

/** 停车扣费订单支付者 */
export interface ParkingPayer {
  /** 用户在AppID下的唯一标识 */
  openid: string;
}

/** 扣费受理响应 */
export interface CreateParkingTransactionResponse {
  /** 公众账号ID */
  appid: string;
  /** 微信支付分配的商户号 */
  sp_mchid: string;
  /** 服务描述 */
  description: string;
  /** 订单创建时间，RFC3339格式 */
  create_time: string;
  /** 商户系统内部订单号 */
  out_trade_no: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 交易状态 */
  trade_state: ParkingTradeState;
  /** 当前订单状态的描述和下一步操作指引 */
  trade_state_description?: string;
  /** 支付完成时间，RFC3339格式 */
  success_time?: string;
  /** 付款银行标识，BPA表示微信垫付 */
  bank_type?: string;
  /** 用户是否已还款：Y(已还)/N(未还)，需bank_type为BPA且trade_state为SUCCESS */
  user_repaid?: string;
  /** 附加数据 */
  attach?: string;
  /** 交易场景 */
  trade_scene: string;
  /** 停车场景信息 */
  parking_info?: ParkingSceneInfo;
  /** 支付者信息 */
  payer?: ParkingPayer;
  /** 订单金额信息 */
  amount: ParkingAmount & {
    /** 用户实际支付金额，单位为分 */
    payer_total?: number;
    /** 订单折扣金额 */
    discount_total?: number;
  };
  /** 优惠信息列表 */
  promotion_detail?: ParkingPromotionDetail[];
}

// ============= 支付分停车服务 - 查询订单 =============

/** 查询停车订单响应（与扣费受理响应结构相同） */
export type QueryParkingOrderResponse = CreateParkingTransactionResponse;

// ============= 支付分停车服务 - 退款 =============

/** 退款出资账户及金额 */
export interface ParkingRefundFrom {
  /** 出资账户类型：AVAILABLE（可用余额）/ UNAVAILABLE（不可用余额） */
  account: 'AVAILABLE' | 'UNAVAILABLE';
  /** 对应账户出资金额，单位为分 */
  amount: number;
}

/** 退款金额信息 */
export interface ParkingRefundAmount {
  /** 退款金额，单位为分，不能超过原订单支付金额 */
  refund: number;
  /** 退款出资账户及金额 */
  from?: ParkingRefundFrom[];
  /** 原订单金额，单位为分 */
  total: number;
  /** 退款币种，固定传 CNY */
  currency: string;
}

/** 退款商品详情 */
export interface ParkingRefundGoodsDetail {
  /** 商户侧商品编码 */
  merchant_goods_id: string;
  /** 微信侧商品编码 */
  wechatpay_goods_id?: string;
  /** 商品名称 */
  goods_name?: string;
  /** 商品单价，单位为分 */
  unit_price: number;
  /** 商品退款金额，单位为分 */
  refund_amount: number;
  /** 商品退货数量 */
  refund_quantity: number;
}

/** 申请停车退款请求 */
export interface ApplyParkingRefundRequest {
  /** 微信支付订单号（与 out_trade_no 二选一） */
  transaction_id?: string;
  /** 商户订单号（与 transaction_id 二选一） */
  out_trade_no?: string;
  /** 商户退款单号，同一商户下唯一 */
  out_refund_no: string;
  /** 退款原因 */
  reason?: string;
  /** 退款结果回调url，外网可访问且不携带参数 */
  notify_url?: string;
  /** 退款资金来源 */
  funds_account?: 'AVAILABLE' | 'UNSETTLED';
  /** 金额信息 */
  amount: ParkingRefundAmount;
  /** 退款商品信息 */
  goods_detail?: ParkingRefundGoodsDetail[];
}

/** 退款优惠退款详情 */
export interface ParkingRefundPromotionDetail {
  /** 代金券ID */
  promotion_id: string;
  /** 优惠范围：GLOBAL（全场代金券）/ SINGLE（单品优惠） */
  scope: 'GLOBAL' | 'SINGLE';
  /** 代金券资金类型：CASH（预充值）/ NOCASH（免充值） */
  type: 'CASH' | 'NOCASH';
  /** 代金券面额，单位为分 */
  amount: number;
  /** 代金券退款金额，单位为分 */
  refund_amount: number;
}

/** 申请停车退款响应 */
export interface ApplyParkingRefundResponse {
  /** 微信支付退款单号 */
  refund_id: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 退款渠道 */
  channel: 'ORIGINAL' | 'BALANCE' | 'OTHER_BALANCE' | 'OTHER_BANKCARD';
  /** 退款入账账户 */
  user_received_account: string;
  /** 退款成功时间，rfc3339格式，仅status为SUCCESS时返回 */
  success_time?: string;
  /** 退款创建时间，rfc3339格式 */
  create_time: string;
  /** 退款状态 */
  status: 'SUCCESS' | 'CLOSED' | 'PROCESSING' | 'ABNORMAL';
  /** 资金账户类型 */
  funds_account: string;
  /** 金额信息 */
  amount: {
    /** 订单总金额，单位为分 */
    total: number;
    /** 退款金额，单位为分 */
    refund: number;
    /** 退款出资账户及金额 */
    from?: ParkingRefundFrom[];
    /** 用户实际支付金额，单位为分 */
    payer_total: number;
    /** 用户实际收到的现金退款金额，单位为分 */
    payer_refund: number;
    /** 应结退款金额，单位为分 */
    settlement_refund: number;
    /** 应结订单金额，单位为分 */
    settlement_total: number;
    /** 优惠退款金额，单位为分 */
    discount_refund: number;
    /** 退款币种 */
    currency: string;
    /** 手续费退款金额，单位为分 */
    refund_fee?: number;
  };
  /** 优惠退款详情 */
  promotion_detail?: ParkingRefundPromotionDetail[];
}

/** 查询停车退款响应（与申请退款响应结构相同） */
export type QueryParkingRefundResponse = ApplyParkingRefundResponse;

// ============= 支付分停车服务 - 回调通知 =============

/** 停车入场不可用原因（回调通知中的 blocked_state_description 字段） */
export type ParkingCallbackBlockReason = 'PAUSE' | 'OVERDUE' | 'REMOVE';

/** 解密后的停车入场状态变更通知数据 */
export interface ParkingEntryStatusCallbackData {
  /** 调用接口提交的商户号 */
  sp_mchid: string;
  /** 车主服务为商户分配的入场ID */
  parking_id: string;
  /** 商户侧入场标识ID，同一商户号下唯一 */
  out_parking_no: string;
  /** 车牌号，仅含省份+车牌，不含特殊字符 */
  plate_number: string;
  /** 车牌颜色 */
  plate_color: PlateColor;
  /** 入场时间，RFC3339格式 */
  start_time: string;
  /** 停车场名称 */
  parking_name: string;
  /** 免费停车时长，单位为秒 */
  free_duration: number;
  /** 服务状态：NORMAL（可用）/ BLOCKED（不可用） */
  parking_state: ParkingState;
  /** 不可用原因，仅当parking_state为BLOCKED时返回 */
  blocked_state_description?: ParkingCallbackBlockReason;
  /** 状态变更发生时间，RFC3339格式 */
  state_update_time: string;
}

/** 解密后的停车订单支付结果通知数据 */
export interface ParkingTransactionCallbackData {
  /** 调用接口提交的应用ID */
  appid: string;
  /** 调用接口提交的商户号 */
  sp_mchid: string;
  /** 商户服务订单号 */
  out_trade_no: string;
  /** 微信支付系统生成的订单号 */
  transaction_id?: string;
  /** 商户自定义字段，用户账单中对扣费服务的描述 */
  description: string;
  /** 订单支付完成时间，rfc3339格式 */
  create_time: string;
  /** 交易状态 */
  trade_state: ParkingTradeState;
  /** 当前订单状态描述及下一步操作指引 */
  trade_state_description?: string;
  /** 订单支付完成时间，rfc3339格式 */
  success_time?: string;
  /** 银行类型 */
  bank_type?: string;
  /** 附加数据 */
  attach?: string;
  /** 用户是否已还款：Y（已还）/ N（未还） */
  user_repaid?: string;
  /** 交易场景值，目前支持 PARKING */
  trade_scene: string;
  /** 支付者信息 */
  payer?: ParkingPayer;
  /** 订单金额信息 */
  amount: ParkingAmount & {
    /** 用户实际支付金额，单位为分 */
    payer_total?: number;
    /** 订单折扣金额 */
    discount_total?: number;
  };
  /** 停车场景信息 */
  parking_info?: ParkingSceneInfo;
  /** 优惠信息列表 */
  promotion_detail?: ParkingPromotionDetail[];
}

// ============= 支付分停车服务 - 调起配置 =============

/** 小程序调起支付分停车服务开通页配置 */
export interface ParkingMiniProgramBridgeConfig {
  /** 目标小程序AppID，固定值 wxbcad394b3d99dac9 */
  appId: string;
  /** 目标小程序路径 */
  path: string;
  /** 传递给支付分的业务数据 */
  extraData: {
    /** 商户号 */
    mchid: string;
    /** 用户在商户对应AppID下的唯一标识 */
    openid: string;
    /** 待开通车牌号 */
    plate_number: string;
    /** 待开通车牌颜色 */
    plate_color: PlateColor;
    /** 开通场景信息 */
    trade_scene?: 'PARKING';
  };
}

/** H5调起支付分停车服务开通页配置 */
export interface ParkingH5BridgeConfig {
  /** 目标小程序username */
  username: string;
  /** 目标小程序路径（含查询参数） */
  path: string;
}

/** App拉起支付分停车服务开通页配置 */
export interface ParkingAppBridgeConfig {
  /** 目标小程序username */
  userName: string;
  /** 目标小程序路径（含查询参数） */
  path: string;
}

/** 微信垫资还款小程序跳转配置 */
export interface ParkingRepayBridgeConfig {
  /** 还款小程序AppID */
  appId: string;
  /** 还款小程序路径 */
  path: string;
  /** 传递的业务数据 */
  extraData: {
    /** 商户号 */
    mchid: string;
    /** 随机字符串 */
    nonce_str: string;
    /** 用户在商户AppID下的唯一标识 */
    openid?: string;
  };
}

// ============= 商家转账 =============

/**
 * 商家转账单据状态
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716434
 */
export type MerchantTransferState =
  | 'ACCEPTED' // 转账已受理
  | 'PROCESSING' // 转账锁定资金中
  | 'WAIT_USER_CONFIRM' // 待收款用户确认
  | 'TRANSFERING' // 转账中
  | 'SUCCESS' // 转账成功（终态）
  | 'FAIL' // 转账失败（终态）
  | 'CANCELING' // 转账撤销中
  | 'CANCELLED'; // 转账撤销完成（终态）

/**
 * 电子回单申请状态
 */
export type ElecSignState = 'GENERATING' | 'FINISHED' | 'FAILED';

/**
 * 电子回单摘要类型
 */
export type ElecSignHashType = 'SHA256' | 'SM3';

/**
 * 免确认收款授权状态
 */
export type MerchantTransferAuthorizationState =
  | 'WAIT_USER_CONFIRM' // 待用户确认
  | 'TAKING_EFFECT' // 授权生效中
  | 'CLOSED'; // 已关闭

/**
 * 授权关闭原因
 */
export type AuthorizationCloseReason =
  | 'CLOSE_VIA_MCH_API' // 商户通过API主动关闭
  | 'USER_CLOSE' // 用户主动关闭
  | 'USER_OVERDUE_UNCONFIRMED' // 用户超时未确认
  | 'TRANSFER_RISK' // 转账存在风险
  | 'USER_ACCOUNT_ABNORMAL'; // 用户收款账户异常

/**
 * 转账场景报备信息
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716434
 */
export interface TransferSceneReportInfo {
  /** 信息类型，固定值，按场景报备字段说明传参 */
  info_type: string;
  /** 信息内容，可按实际业务自定义 */
  info_content: string;
}

/**
 * 授权关闭信息
 */
export interface AuthorizationCloseInfo {
  /** 关闭时间，RFC3339格式 */
  close_time: string;
  /** 关闭原因 */
  close_reason: AuthorizationCloseReason;
}

/**
 * 发起转账请求（用户确认收款模式）
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716434
 */
export interface CreateMerchantTransferRequest {
  /** 商户AppID，需与商户号有绑定关系 */
  appid: string;
  /** 商户单号，仅限数字、大小写字母，商户系统内唯一 */
  out_bill_no: string;
  /** 转账场景ID，如1000（现金营销）、1006（企业报销） */
  transfer_scene_id: string;
  /** 收款用户在商户appid下的OpenID */
  openid: string;
  /** 收款用户真实姓名（需加密），转账金额≥2000元时必传 */
  user_name?: string;
  /** 转账金额，单位为分 */
  transfer_amount: number;
  /** 转账备注，用户可见，UTF8编码，最多32字符 */
  transfer_remark: string;
  /** 异步回调地址，必须HTTPS公网可访问，不带参数 */
  notify_url?: string;
  /** 用户收款感知的收款原因 */
  user_recv_perception?: string;
  /** 转账场景报备信息数组 */
  transfer_scene_report_infos?: TransferSceneReportInfo[];
  /** 用户收款样式 */
  user_recv_style?: {
    /** 收款样式类型：CONFIRM_PAGE（收款确认页）或 RED_PACKET（红包样式，单笔≤200元） */
    type: 'CONFIRM_PAGE' | 'RED_PACKET';
  };
}

/**
 * 发起转账响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716434
 */
export interface CreateMerchantTransferResponse {
  /** 商户单号 */
  out_bill_no: string;
  /** 微信转账单号，系统返回的唯一标识 */
  transfer_bill_no: string;
  /** 单据创建时间，RFC3339格式 */
  create_time: string;
  /** 单据状态 */
  state: MerchantTransferState;
  /** 跳转收款页的package信息，仅WAIT_USER_CONFIRM时返回 */
  package_info?: string;
}

/**
 * 查询转账单响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716437
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716457
 */
export interface QueryMerchantTransferResponse {
  /** 商户号 */
  mch_id: string;
  /** 商户单号 */
  out_bill_no: string;
  /** 微信转账单号，唯一标识 */
  transfer_bill_no: string;
  /** 商户AppID */
  appid: string;
  /** 单据状态 */
  state: MerchantTransferState;
  /** 转账金额，单位为分 */
  transfer_amount: number;
  /** 转账备注 */
  transfer_remark: string;
  /** 失败原因，订单失败或已退资金时返回 */
  fail_reason?: string;
  /** 收款用户OpenID */
  openid?: string;
  /** 收款用户姓名（加密） */
  user_name?: string;
  /** 单据创建时间，RFC3339格式 */
  create_time: string;
  /** 最后状态变更时间，RFC3339格式 */
  update_time: string;
}

/**
 * 撤销转账响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716458
 */
export interface CancelMerchantTransferResponse {
  /** 商户单号 */
  out_bill_no: string;
  /** 微信转账单号 */
  transfer_bill_no: string;
  /** 单据状态：CANCELING（撤销中）或 CANCELLED（已撤销） */
  state: 'CANCELING' | 'CANCELLED';
  /** 最后状态变更时间，RFC3339格式 */
  update_time: string;
}

/**
 * 申请电子回单请求（商户单号）
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716452
 */
export interface ApplyMerchantTransferElecSignByOutBillNoRequest {
  /** 商户单号 */
  out_bill_no: string;
}

/**
 * 申请电子回单请求（微信单号）
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716456
 */
export interface ApplyMerchantTransferElecSignByTransferBillNoRequest {
  /** 微信转账单号 */
  transfer_bill_no: string;
}

/**
 * 申请电子回单响应
 */
export interface ApplyMerchantTransferElecSignResponse {
  /** 申请单状态：GENERATING（生成中）、FINISHED（已完成）、FAILED（已失败） */
  state: ElecSignState;
  /** 申请单创建时间，RFC3339格式 */
  create_time: string;
}

/**
 * 查询电子回单响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716436
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716455
 */
export interface QueryMerchantTransferElecSignResponse {
  /** 申请单状态 */
  state: ElecSignState;
  /** 创建时间，RFC3339格式 */
  create_time: string;
  /** 最近更新时间，RFC3339格式 */
  update_time: string;
  /** 回单文件摘要类型，仅FINISHED时返回 */
  hash_type?: ElecSignHashType;
  /** 回单文件摘要值，仅FINISHED时返回 */
  hash_value?: string;
  /** 回单文件下载地址，仅FINISHED时返回，有效期10分钟 */
  download_url?: string;
}

/**
 * 发起转账并完成免确认收款授权请求
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4014399293
 */
export interface CreateTransferWithAuthorizationRequest {
  /** 商户AppID */
  appid: string;
  /** 商户单号 */
  out_bill_no: string;
  /** 转账场景ID */
  transfer_scene_id: string;
  /** 收款用户OpenID */
  openid: string;
  /** 收款用户姓名（需加密），转账≥2000元时必传 */
  user_name?: string;
  /** 转账金额，单位为分 */
  transfer_amount: number;
  /** 转账备注 */
  transfer_remark: string;
  /** 异步回调地址 */
  notify_url?: string;
  /** 用户收款感知 */
  user_recv_perception?: string;
  /** 转账场景报备信息 */
  transfer_scene_report_infos?: TransferSceneReportInfo[];
  /** 免确认收款授权信息 */
  authorization_info?: {
    /** 用户授权详情中展示的昵称 */
    user_display_name: string;
    /** 商户侧授权单号 */
    out_authorization_no: string;
    /** 授权结果异步通知回调地址 */
    authorization_notify_url: string;
  };
  /** 出资商户号，指定已授权资金权限的商户出资 */
  sponsor_mchid?: string;
}

/**
 * 发起转账并完成免确认收款授权响应
 */
export interface CreateTransferWithAuthorizationResponse {
  /** 商户单号 */
  out_bill_no: string;
  /** 微信转账单号 */
  transfer_bill_no: string;
  /** 单据创建时间，RFC3339格式 */
  create_time: string;
  /** 单据状态 */
  state: MerchantTransferState;
  /** 跳转收款页的package信息，仅WAIT_USER_CONFIRM时返回 */
  package_info?: string;
  /** 用户免确认收款授权详情中展示的昵称 */
  user_display_name?: string;
  /** 商户侧授权单号 */
  out_authorization_no?: string;
}

/**
 * 发起免确认收款授权请求
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4015901167
 */
export interface CreateMerchantTransferAuthorizationRequest {
  /** 商户侧授权单号，系统内唯一且一个用户账号对应唯一一个生效授权 */
  out_authorization_no: string;
  /** 商户应用唯一标识 */
  appid: string;
  /** 收款用户在商户appid下的唯一标识 */
  openid: string;
  /** 转账场景ID */
  transfer_scene_id: string;
  /** 用户展示名称，授权详情中展示的"开通账号" */
  user_display_name: string;
  /** 用户收款时感知到的收款原因 */
  user_recv_perception?: string;
  /** 授权结果异步通知回调地址 */
  authorization_notify_url: string;
  /** 用户端场景信息 */
  scene_info?: {
    /** 用户终端IP（支持IPv4/IPv6） */
    client_ip?: string;
    /** 用户设备ID */
    device_id?: string;
    /** 设备类型 */
    device_type?: 'IOS' | 'ANDROID' | 'HARMONY' | 'OTHER';
  };
}

/**
 * 发起免确认收款授权响应
 */
export interface CreateMerchantTransferAuthorizationResponse {
  /** 商户侧授权单号 */
  out_authorization_no: string;
  /** 授权状态，值为WAIT_USER_CONFIRM */
  state: MerchantTransferAuthorizationState;
  /** 单据创建时间，RFC3339格式 */
  create_time: string;
  /** JSAPI调起用户确认授权页面时所需的package参数 */
  package_info: string;
}

/**
 * 查询授权结果响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4014399423
 */
export interface QueryMerchantTransferAuthorizationResponse {
  /** 商户侧授权单号 */
  out_authorization_no: string;
  /** 商户应用唯一标识 */
  appid: string;
  /** 收款用户OpenID */
  openid: string;
  /** 用户展示昵称 */
  user_display_name: string;
  /** 微信免确认收款授权单号 */
  authorization_id?: string;
  /** 授权状态 */
  state: MerchantTransferAuthorizationState;
  /** 用户确认授权时间，RFC3339格式 */
  authorize_time?: string;
  /** 关闭信息，状态为CLOSED时返回 */
  close_info?: AuthorizationCloseInfo;
  /** 转账场景ID */
  transfer_scene_id?: string;
  /** 用户收款感知 */
  user_recv_perception?: string;
  /** 单据创建时间 */
  create_time?: string;
  /** 跳转授权信息页的package信息 */
  package_info?: string;
}

/**
 * 用户授权后转账请求
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4014399371
 */
export interface CreateTransferAfterAuthorizationRequest {
  /** 商户AppID */
  appid: string;
  /** 商户单号 */
  out_bill_no: string;
  /** 转账场景ID */
  transfer_scene_id: string;
  /** 收款用户姓名（需加密） */
  user_name?: string;
  /** 转账金额，单位为分 */
  transfer_amount: number;
  /** 转账备注 */
  transfer_remark: string;
  /** 用户收款感知 */
  user_recv_perception?: string;
  /** 转账场景报备信息 */
  transfer_scene_report_infos?: TransferSceneReportInfo[];
  /** 微信免确认收款授权单号（与out_authorization_no二选一） */
  authorization_id?: string;
  /** 商户侧授权单号（与authorization_id二选一） */
  out_authorization_no?: string;
  /** 出资商户号 */
  sponsor_mchid?: string;
}

/**
 * 用户授权后转账响应
 */
export interface CreateTransferAfterAuthorizationResponse {
  /** 商户号 */
  mch_id: string;
  /** 商户单号 */
  out_bill_no: string;
  /** 微信转账单号 */
  transfer_bill_no: string;
  /** 商户AppID */
  appid: string;
  /** 单据状态 */
  state: MerchantTransferState;
  /** 转账金额，单位为分 */
  transfer_amount: number;
  /** 转账备注 */
  transfer_remark: string;
  /** 失败原因，订单失败或退资金时返回 */
  fail_reason?: string;
  /** 收款用户OpenID */
  openid?: string;
  /** 收款用户姓名（加密） */
  user_name?: string;
  /** 单据创建时间，RFC3339格式 */
  create_time: string;
  /** 最后状态变更时间，RFC3339格式 */
  update_time: string;
}

/**
 * 解除免确认收款授权响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4015653811
 */
export interface CloseMerchantTransferAuthorizationResponse {
  /** 商户侧授权单号 */
  out_authorization_no: string;
  /** 商户应用唯一标识 */
  appid: string;
  /** 收款用户OpenID */
  openid: string;
  /** 用户展示昵称 */
  user_display_name: string;
  /** 微信免确认收款授权单号 */
  authorization_id?: string;
  /** 授权状态，值为CLOSED */
  state: 'CLOSED';
  /** 用户确认授权时间，RFC3339格式 */
  authorize_time?: string;
  /** 关闭信息 */
  close_info?: AuthorizationCloseInfo;
  /** 转账场景ID */
  transfer_scene_id?: string;
  /** 用户收款感知 */
  user_recv_perception?: string;
  /** 单据创建时间 */
  create_time?: string;
}

/**
 * 商家转账回调通知解密数据
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012712115
 */
export interface MerchantTransferCallbackData {
  /** 商户单号 */
  out_bill_no: string;
  /** 微信转账单号 */
  transfer_bill_no: string;
  /** 单据状态：SUCCESS / FAIL / CANCELLED */
  state: 'SUCCESS' | 'FAIL' | 'CANCELLED';
  /** 商户号 */
  mch_id: string;
  /** 转账金额，单位为分 */
  transfer_amount: number;
  /** 收款用户OpenID */
  openid: string;
  /** 失败原因，单据失败或已退资金时返回 */
  fail_reason?: string;
  /** 单据创建时间，RFC3339格式 */
  create_time: string;
  /** 最后状态变更时间，RFC3339格式 */
  update_time: string;
}

/**
 * 免确认收款授权回调通知解密数据
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4014512908
 */
export interface MerchantTransferAuthorizationCallbackData {
  /** 商户侧授权单号 */
  out_authorization_no: string;
  /** 商户AppID */
  appid: string;
  /** 收款用户OpenID */
  openid: string;
  /** 用户展示昵称 */
  user_display_name: string;
  /** 微信免确认收款授权单号 */
  authorization_id: string;
  /** 授权状态：TAKING_EFFECT（生效中） / CLOSED（已关闭） */
  state: 'TAKING_EFFECT' | 'CLOSED';
  /** 用户确认授权时间，RFC3339格式 */
  authorize_time?: string;
  /** 关闭信息，状态为CLOSED时返回 */
  close_info?: AuthorizationCloseInfo;
}

/**
 * 商家转账 JSAPI 调起用户确认收款配置
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012716430
 */
export interface MerchantTransferJsapiBridgeConfig {
  /** 商户号 */
  mchId: string;
  /** 商户AppID */
  appId: string;
  /** 跳转收款页的package信息 */
  package: string;
}

/**
 * 免确认收款授权 JSAPI 配置
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4015930512
 */
export interface MerchantTransferAuthorizationJsapiBridgeConfig {
  /** 商户号 */
  mchId: string;
  /** 商户AppID */
  appId: string;
  /** 授权页面package信息 */
  package: string;
}

// ============= 代金券 =============

/** 代金券批次状态 */
export type CouponStockStatus = 'unactivated' | 'audit' | 'running' | 'stoped' | 'paused';

/** 代金券状态 */
export type CouponStatus = 'SENDED' | 'USED' | 'EXPIRED' | 'RECOVER' | 'REVOKED';

/** 代金券类型 */
export type CouponType = 'NORMAL' | 'CUT_TO';

/** 代金券批次类型 */
export type CouponStockType = 'NORMAL';

/**
 * 固定面额满减券规则
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534633
 */
export interface CouponFixedNormalCoupon {
  /** 面额，单位：分 */
  coupon_amount: number;
  /** 使用门槛，单位：分 */
  transaction_minimum: number;
}

/**
 * 代金券发放规则
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534633
 */
export interface CouponStockUseRule {
  /** 发放总上限，最少5个，最多1000万个 */
  max_coupons: number;
  /** 总预算，单位：分，需等于 coupon_amount × max_coupons */
  max_amount: number;
  /** 单天预算发放上限，单位：分 */
  max_amount_by_day?: number;
  /** 单用户可领个数，最少1个，最多60个 */
  max_coupons_per_user: number;
  /** 是否开启自然人限制 */
  natural_person_limit: boolean;
  /** 是否开启防刷拦截 */
  prevent_api_abuse: boolean;
}

/**
 * 代金券详情页配置
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534633
 */
export interface CouponPatternInfo {
  /** 使用说明，最多1000个UTF8字符 */
  description?: string;
  /** 商户logo，需通过图片上传API获取 */
  merchant_logo?: string;
  /** 品牌名称，最多12个中文汉字或36个英文字符 */
  merchant_name?: string;
  /** 背景颜色，14种可选：COLOR010-COLOR102 */
  background_color?: string;
  /** 券详情图片，需通过图片上传API获取 */
  coupon_image?: string;
  /** 卡包跳转目标 */
  jump_target?: 'PAYMENT_CODE' | 'MINI_PROGRAM' | 'DEFAULT_PAGE';
  /** 小程序appid，跳转小程序时必填 */
  mini_programappid?: string;
  /** 小程序path，跳转小程序时必填 */
  mini_program_path?: string;
}

/**
 * 指定银行卡BIN
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534633
 */
export interface CouponLimitCard {
  /** 银行卡名字，最多4个中文字符 */
  name: string;
  /** 银行卡BIN，单个长度6-9，最多10个 */
  bin: string[];
}

/**
 * 代金券核销规则
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534633
 */
export interface CouponUseRule {
  /** 固定面额满减券规则，stock_type为NORMAL时必填 */
  fixed_normal_coupon?: CouponFixedNormalCoupon;
  /** 订单优惠标记，最多50个 */
  goods_tag?: string[];
  /** 指定支付模式 */
  trade_type?: string[];
  /** 是否可叠加其他优惠 */
  combine_use?: boolean;
  /** 可核销商品编码，最多50个 */
  available_items?: string[];
  /** 不参与优惠商品编码，最多50个 */
  unavailable_items?: string[];
  /** 可核销商户号，最多50个 */
  available_merchants: string[];
  /** 指定银行卡BIN */
  limit_card?: CouponLimitCard;
}

/**
 * 创建代金券批次请求
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534633
 */
export interface CreateCouponStockRequest {
  /** 批次名称，最多9个中文汉字或20个字母 */
  stock_name: string;
  /** 批次备注，仅配置商户可见 */
  comment?: string;
  /** 归属商户号 */
  belong_merchant: string;
  /** 可用开始时间，rfc3339格式 */
  available_begin_time: string;
  /** 可用结束时间，rfc3339格式 */
  available_end_time: string;
  /** 发放规则 */
  stock_use_rule: CouponStockUseRule;
  /** 代金券详情页 */
  pattern_info?: CouponPatternInfo;
  /** 核销规则 */
  coupon_use_rule: CouponUseRule;
  /** 营销经费：true免充值，false预充值 */
  no_cash: boolean;
  /** 批次类型，仅支持 NORMAL */
  stock_type: CouponStockType;
  /** 商户单据号，需全局唯一 */
  out_request_no: string;
  /** 扩展属性 */
  ext_info?: string;
}

/**
 * 创建代金券批次响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534633
 */
export interface CreateCouponStockResponse {
  /** 批次号 */
  stock_id: string;
  /** 创建时间，rfc3339格式 */
  create_time: string;
}

/**
 * 激活代金券批次请求
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460137
 */
export interface ActivateCouponStockRequest {
  /** 创建批次的商户号 */
  stock_creator_mchid: string;
}

/**
 * 激活代金券批次响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460137
 */
export interface ActivateCouponStockResponse {
  /** 生效时间，rfc3339格式 */
  start_time: string;
  /** 批次号 */
  stock_id: string;
}

/**
 * 发放代金券请求
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463767
 */
export interface SendCouponRequest {
  /** 批次号 */
  stock_id: string;
  /** 商户发放凭据号，需保持唯一 */
  out_request_no: string;
  /** 发券方商户的公众账号ID */
  appid: string;
  /** 批次创建方商户号 */
  stock_creator_mchid: string;
}

/**
 * 发放代金券响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463767
 */
export interface SendCouponResponse {
  /** 代金券唯一id */
  coupon_id: string;
}

/**
 * 暂停代金券批次请求
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460305
 */
export interface PauseCouponStockRequest {
  /** 批次创建方商户号 */
  stock_creator_mchid: string;
}

/**
 * 暂停代金券批次响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460305
 */
export interface PauseCouponStockResponse {
  /** 暂停时间，rfc3339格式 */
  pause_time: string;
  /** 批次号 */
  stock_id: string;
}

/**
 * 重启代金券批次请求
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460411
 */
export interface RestartCouponStockRequest {
  /** 批次创建方商户号 */
  stock_creator_mchid: string;
}

/**
 * 重启代金券批次响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460411
 */
export interface RestartCouponStockResponse {
  /** 生效时间，rfc3339格式 */
  restart_time: string;
  /** 批次号 */
  stock_id: string;
}

/**
 * 条件查询批次列表参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460489
 */
export interface QueryCouponStocksParams {
  /** 分页页码，从0开始 */
  offset: number;
  /** 分页大小，最大10 */
  limit: number;
  /** 创建批次的商户号 */
  stock_creator_mchid: string;
  /** 起始创建时间，rfc3339格式 */
  create_start_time?: string;
  /** 终止创建时间，rfc3339格式 */
  create_end_time?: string;
  /** 批次状态 */
  status?: CouponStockStatus;
  [key: string]: unknown;
}

/**
 * 代金券批次详情（列表项）
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460489
 */
export interface CouponStockItem {
  /** 批次号 */
  stock_id: string;
  /** 批次创建方商户号 */
  stock_creator_mchid: string;
  /** 批次名称 */
  stock_name: string;
  /** 批次状态 */
  status: CouponStockStatus;
  /** 批次创建时间，rfc3339格式 */
  create_time: string;
  /** 使用说明 */
  description: string;
  /** 发放规则 */
  stock_use_rule?: CouponStockUseRule;
  /** 可用开始时间 */
  available_begin_time: string;
  /** 可用结束时间 */
  available_end_time: string;
  /** 已发券数量 */
  distributed_coupons: number;
  /** 是否无资金流 */
  no_cash: boolean;
  /** 激活批次的时间 */
  start_time?: string;
  /** 终止批次的时间 */
  stop_time?: string;
  /** 是否单品优惠 */
  singleitem: boolean;
  /** 批次类型 */
  stock_type: string;
  /** 微信卡包ID */
  card_id?: string;
  /** 业务类型 */
  business_type?: string;
}

/**
 * 条件查询批次列表响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012460489
 */
export interface QueryCouponStocksResponse {
  /** 批次总数量 */
  total_count: number;
  /** 批次详情数组 */
  data?: CouponStockItem[];
  /** 分页大小 */
  limit: number;
  /** 分页页码 */
  offset: number;
}

/**
 * 查询代金券详情参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012486942
 */
export interface QueryCouponDetailParams {
  /** 公众账号ID */
  appid: string;
  [key: string]: unknown;
}

/**
 * 满减券面额信息
 */
export interface CouponNormalCouponInformation {
  /** 面额，单位：分 */
  coupon_amount: number;
  /** 使用券金额门槛，单位：分 */
  transaction_minimum: number;
}

/**
 * 减至券信息
 */
export interface CouponCutToMessage {
  /** 可用优惠的商品最高单价，单位：分 */
  single_price_max: number;
  /** 减至后的优惠单价，单位：分 */
  cut_to_price: number;
}

/**
 * 查询代金券详情响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012486942
 */
export interface QueryCouponDetailResponse {
  /** 创建批次的商户号 */
  stock_creator_mchid: string;
  /** 批次号 */
  stock_id: string;
  /** 代金券id */
  coupon_id: string;
  /** 减至券信息 */
  cut_to_message?: CouponCutToMessage;
  /** 券名称 */
  coupon_name: string;
  /** 券状态 */
  status: CouponStatus;
  /** 使用说明 */
  description: string;
  /** 领券时间，rfc3339格式 */
  create_time: string;
  /** 券类型 */
  coupon_type: CouponType;
  /** 是否无资金流 */
  no_cash: boolean;
  /** 可用开始时间 */
  available_begin_time: string;
  /** 可用结束时间 */
  available_end_time: string;
  /** 是否单品优惠 */
  singleitem: boolean;
  /** 满减券信息 */
  normal_coupon_information?: CouponNormalCouponInformation;
  /** 商户发放凭据号 */
  out_request_no?: string;
  /** 剩余金额，单位：分，仅消费金返回 */
  available_balance?: number;
  /** 业务类型，仅消费金返回 */
  business_type?: string;
}

/**
 * 查询代金券可用商户参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463358
 */
export interface QueryCouponStockMerchantsParams {
  /** 分页页码，最大1000 */
  offset: number;
  /** 分页大小，最大50 */
  limit: number;
  /** 批次创建方商户号 */
  stock_creator_mchid: string;
  [key: string]: unknown;
}

/**
 * 查询代金券可用商户响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463358
 */
export interface QueryCouponStockMerchantsResponse {
  /** 可用商户总数量 */
  total_count: number;
  /** 可用商户列表 */
  data?: string[];
  /** 分页页码 */
  offset: number;
  /** 分页大小 */
  limit: number;
  /** 批次号 */
  stock_id: string;
}

/**
 * 查询代金券可用单品参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463442
 */
export interface QueryCouponStockItemsParams {
  /** 分页页码，最大500 */
  offset: number;
  /** 分页大小，最大100 */
  limit: number;
  /** 创建批次的商户号 */
  stock_creator_mchid: string;
  [key: string]: unknown;
}

/**
 * 查询代金券可用单品响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463442
 */
export interface QueryCouponStockItemsResponse {
  /** 可用单品编码总数 */
  total_count: number;
  /** 可用单品编码列表 */
  data?: string[];
  /** 分页页码 */
  offset: number;
  /** 分页大小 */
  limit: number;
  /** 批次号 */
  stock_id: string;
}

/**
 * 根据商户号查用户的券参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534690
 */
export interface QueryUserCouponsParams {
  /** 公众账号ID */
  appid: string;
  /** 批次号 */
  stock_id?: string;
  /** 券状态 */
  status?: CouponStatus;
  /** 业务类型，MULTIUSE仅返回消费金列表 */
  business_type?: string;
  /** 批次创建方商户号 */
  creator_mchid?: string;
  /** 可用商户号 */
  available_mchid?: string;
  /** 分页页码，默认0 */
  offset?: number;
  /** 分页大小，默认20 */
  limit?: number;
  [key: string]: unknown;
}

/**
 * 用户代金券列表项
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534690
 */
export interface UserCouponItem {
  /** 创建批次的商户号 */
  stock_creator_mchid: string;
  /** 批次号 */
  stock_id: string;
  /** 代金券id */
  coupon_id: string;
  /** 减至券信息 */
  cut_to_message?: CouponCutToMessage;
  /** 券名称 */
  coupon_name: string;
  /** 券状态 */
  status: CouponStatus;
  /** 使用说明 */
  description: string;
  /** 领券时间，rfc3339格式 */
  create_time: string;
  /** 券类型 */
  coupon_type: CouponType;
  /** 是否无资金流 */
  no_cash: boolean;
  /** 可用开始时间 */
  available_begin_time: string;
  /** 可用结束时间 */
  available_end_time: string;
  /** 是否单品优惠 */
  singleitem: boolean;
  /** 满减券信息 */
  normal_coupon_information?: CouponNormalCouponInformation;
  /** 商户发放凭据号 */
  out_request_no?: string;
  /** 剩余金额，单位：分，仅消费金返回 */
  available_balance?: number;
  /** 业务类型，仅消费金返回 */
  business_type?: string;
}

/**
 * 根据商户号查用户的券响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534690
 */
export interface QueryUserCouponsResponse {
  /** 结果集 */
  data?: UserCouponItem[];
  /** 查询结果总数 */
  total_count: number;
  /** 分页大小 */
  limit?: number;
  /** 分页页码 */
  offset?: number;
}

/**
 * 下载批次核销/退款明细响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463585
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012463523
 */
export interface DownloadCouponStockFlowResponse {
  /** 流水文件下载链接，30s内有效 */
  url: string;
  /** 文件内容的哈希值 */
  hash_value: string;
  /** 哈希算法类型，目前仅支持SHA1 */
  hash_type: string;
}

/**
 * 设置代金券消息通知地址请求
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012464198
 */
export interface SetCouponCallbackRequest {
  /** 微信支付商户号 */
  mchid: string;
  /** 通知URL地址，必须为https */
  notify_url: string;
  /** 回调开关，true开启推送 */
  switch?: boolean;
}

/**
 * 设置代金券消息通知地址响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012464198
 */
export interface SetCouponCallbackResponse {
  /** 修改时间，rfc3339格式 */
  update_time: string;
  /** 通知地址 */
  notify_url: string;
}

/**
 * 代金券核销单品信息
 */
export interface CouponConsumeGoodsDetail {
  /** 单品编码 */
  goods_id: string;
  /** 单品数量 */
  quantity: number;
  /** 单品单价，单位：分 */
  price: number;
  /** 优惠金额，单位：分 */
  discount_amount: number;
}

/**
 * 代金券核销信息
 */
export interface CouponConsumeInformation {
  /** 核销时间，rfc3339格式 */
  consume_time: string;
  /** 核销商户号 */
  consume_mchid: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 核销金额，单位：分，仅消费金返回 */
  consume_amount?: number;
  /** 单品信息 */
  goods_detail?: CouponConsumeGoodsDetail[];
}

/**
 * 核销事件回调通知解密数据
 *
 * event_type 为 COUPON.USE
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012285250
 */
export interface CouponUseCallbackData {
  /** 批次创建方商户号 */
  stock_creator_mchid: string;
  /** 代金券批次唯一ID */
  stock_id: string;
  /** 代金券唯一ID */
  coupon_id: string;
  /** 券名称 */
  coupon_name: string;
  /** 券状态 */
  status: CouponStatus;
  /** 券描述说明 */
  description: string;
  /** 领券时间，rfc3339格式 */
  create_time: string;
  /** 券类型 */
  coupon_type: CouponType;
  /** 是否无资金流 */
  no_cash: boolean;
  /** 可用开始时间 */
  available_begin_time: string;
  /** 可用结束时间 */
  available_end_time: string;
  /** 是否单品优惠 */
  singleitem: boolean;
  /** 满减券信息 */
  normal_coupon_information?: CouponNormalCouponInformation;
  /** 核销信息 */
  consume_information?: CouponConsumeInformation;
  /** 业务类型，MULTIUSE表示消费金 */
  business_type?: string;
}

// ============= 消费者投诉2.0 =============

/** 投诉处理状态 */
export type ComplaintState = 'PENDING' | 'ACCEPTED' | 'PROCESSING' | 'PROCESSED' | 'CLOSED';

/** 投诉协商状态 */
export type ComplaintNegotiationState = 'PENDING_MERCHANT' | 'PENDING_USER' | 'PENDING_PLATFORM';

/**
 * 查询投诉单列表请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012533431
 */
export interface QueryComplaintsParams {
  /** 投诉开始时间，格式：yyyy-MM-dd HH:mm:ss */
  begin_date: string;
  /** 投诉结束时间，格式：yyyy-MM-dd HH:mm:ss */
  end_date: string;
  /** 投诉状态，不传则查询所有状态 */
  complaint_state?: ComplaintState;
  /** 商户号 */
  mchid?: string;
  /** 分页开始位置 */
  offset?: number;
  /** 分页大小，默认20，最大50 */
  limit?: number;
}

/** 投诉单概要信息 */
export interface ComplaintSummary {
  /** 投诉单号 */
  complaint_id: string;
  /** 投诉时间 */
  complaint_time: string;
  /** 投诉详情 */
  complaint_detail: string;
  /** 投诉单状态 */
  complaint_state: ComplaintState;
  /** 投诉诉求 */
  complaint_type?: string;
  /** 投诉订单号 */
  transaction_id?: string;
  /** 商户订单号 */
  out_trade_no?: string;
  /** 投诉人联系方式 */
  complainant_contact_info?: string;
  /** 商户与用户协商状态 */
  negotiation_state?: ComplaintNegotiationState;
  /** 问题描述 */
  problem_description?: string;
  /** 用户投诉频率 */
  complain_frequency?: number;
}

/**
 * 查询投诉单列表响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012533431
 */
export interface QueryComplaintsResponse {
  /** 投诉总笔数 */
  total_count: number;
  /** 分页大小 */
  limit: number;
  /** 分页开始位置 */
  offset: number;
  /** 投诉单列表 */
  data: ComplaintSummary[];
}

/**
 * 查询投诉单详情响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012533436
 */
export interface QueryComplaintResponse {
  /** 投诉单号 */
  complaint_id: string;
  /** 投诉时间 */
  complaint_time: string;
  /** 投诉详情 */
  complaint_detail: string;
  /** 投诉单状态 */
  complaint_state: ComplaintState;
  /** 投诉诉求 */
  complaint_type?: string;
  /** 投诉订单号 */
  transaction_id?: string;
  /** 商户订单号 */
  out_trade_no?: string;
  /** 投诉人信息 */
  complainant_contact_info?: string;
  /** 商户与用户协商状态 */
  negotiation_state?: ComplaintNegotiationState;
  /** 问题描述 */
  problem_description?: string;
  /** 用户投诉频率 */
  complain_frequency?: number;
  /** 用户上传的投诉图片 media_id 列表 */
  complaint_media_list?: string[];
  /** 商户反馈图片列表 */
  response_media_list?: string[];
  /** 投诉相关订单信息 */
  order_info?: {
    /** 微信支付订单号 */
    transaction_id?: string;
    /** 商户订单号 */
    out_trade_no?: string;
    /** 订单金额，单位：分 */
    amount?: number;
    /** 订单时间 */
    order_time?: string;
  };
  /** 商户信息 */
  merchant_info?: {
    /** 商户号 */
    merchant_id: string;
    /** 商户简称 */
    merchant_name?: string;
    /** 商户类型 */
    merchant_type?: string;
  };
}

/**
 * 查询投诉协商历史响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012533439
 */
export interface ComplaintNegotiationHistoryResponse {
  /** 协商历史列表 */
  data: ComplaintNegotiationRecord[];
}

/** 投诉协商记录 */
export interface ComplaintNegotiationRecord {
  /** 协商时间 */
  negotiate_time: string;
  /** 协商内容 */
  negotiate_content: string;
  /** 协商人员 */
  negotiate_person?: string;
  /** 协商状态 */
  complaint_state?: ComplaintNegotiationState;
  /** 协商图片 media_id 列表 */
  media_list?: string[];
}

/**
 * 回复用户请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012467254
 */
export interface ReplyComplaintRequest {
  /** 投诉单号 */
  complaint_id: string;
  /** 回复内容 */
  content: string;
  /** 反馈图片 media_id 列表，最多5张 */
  media_list?: string[];
}

/**
 * 反馈处理完成请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012467255
 */
export interface CompleteComplaintRequest {
  /** 投诉单号 */
  complaint_id: string;
  /** 投诉单关联的微信支付订单号 */
  transaction_id?: string;
  /** 处理完成备注 */
  solution?: string;
  /** 反馈图片 media_id 列表，最多5张 */
  media_list?: string[];
}

/**
 * 更新退款审批结果请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012467256
 */
export interface UpdateComplaintRefundRequest {
  /** 投诉单号 */
  complaint_id: string;
  /** 投诉单关联的微信支付订单号 */
  transaction_id: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 退款金额，单位：分 */
  refund_amount: number;
  /** 反馈图片 media_id 列表，最多5张 */
  media_list?: string[];
}

/**
 * 回复需要即时服务的投诉单请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4017151596
 */
export interface ReplyImmediateServiceRequest {
  /** 投诉单号 */
  complaint_id: string;
  /** 回复内容 */
  content: string;
  /** 反馈图片 media_id 列表，最多5张 */
  media_list?: string[];
}

/**
 * 图片上传响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012467250
 */
export interface UploadComplaintImageResponse {
  /** 微信返回的媒体文件标识 */
  media_id: string;
}

/**
 * 创建/更新投诉通知回调地址请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012458679
 */
export interface ComplaintCallbackUrlRequest {
  /** 回调通知地址 */
  url: string;
  /** 商户号 */
  mchid: string;
}

/**
 * 查询投诉通知回调地址响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012459014
 */
export interface ComplaintCallbackUrlResponse {
  /** 回调通知地址 */
  url: string;
  /** 创建时间 */
  create_time?: string;
  /** 更新时间 */
  update_time?: string;
}

/**
 * 消费者投诉通知回调解密数据
 *
 * 用户提交投诉、用户撤诉、用户确认投诉已处理完成时，
 * 微信支付会通过此回调通知商户。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012289719
 */
export interface ComplaintCallbackData {
  /** 投诉单号 */
  complaint_id: string;
  /** 投诉时间 */
  complaint_time: string;
  /** 投诉类型：COMPLAINT_USER_CREATE / COMPLAINT_USER_CANCEL / COMPLAINT_USER_CONFIRM */
  complaint_type: string;
  /** 投诉详情 */
  complaint_detail?: string;
  /** 投诉订单号 */
  transaction_id?: string;
  /** 商户订单号 */
  out_trade_no?: string;
  /** 商户号 */
  merchant_id?: string;
  /** 投诉人联系方式 */
  complainant_contact_info?: string;
  /** 投诉图片列表 */
  complaint_media_list?: string[];
}

// ============= 委托营销 =============

/** 委托营销合作方类型 */
export type PartnershipPartnerType = 'APPID' | 'MERCHANT';

/** 委托营销业务类型 */
export type PartnershipBusinessType = 'FAVOR_STOCK' | 'BUSIFAVOR_STOCK';

/** 委托营销合作状态 */
export type PartnershipState = 'ESTABLISHED' | 'TERMINATED';

/** 合作方信息 */
export interface PartnershipPartner {
  /** 合作方类别 */
  type: PartnershipPartnerType;
  /** 合作方Appid，type为APPID时必填 */
  appid?: string;
  /** 合作方商户ID，type为MERCHANT时必填 */
  merchant_id?: string;
}

/** 被授权数据 */
export interface PartnershipAuthorizedData {
  /** 授权业务类别 */
  business_type: PartnershipBusinessType;
  /** 授权批次ID */
  stock_id?: string;
}

/**
 * 建立合作关系请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012380498
 */
export interface BuildPartnershipRequest {
  /** 合作方信息 */
  partner: PartnershipPartner;
  /** 被授权数据 */
  authorized_data: PartnershipAuthorizedData;
}

/**
 * 建立合作关系响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012380498
 */
export interface BuildPartnershipResponse {
  /** 合作方信息 */
  partner: PartnershipPartner;
  /** 被授权数据 */
  authorized_data: PartnershipAuthorizedData;
  /** 合作状态 */
  state: PartnershipState;
  /** 建立合作关系时间 */
  build_time: string;
  /** 创建时间 */
  create_time: string;
  /** 更新时间 */
  update_time: string;
}

/**
 * 查询合作关系列表请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012380536
 */
export interface QueryPartnershipsParams {
  /** 分页大小，最大50，默认20 */
  limit?: number;
  /** 分页页码，从0开始 */
  offset?: number;
  /** 合作方信息 */
  partner?: PartnershipPartner;
  /** 被授权数据 */
  authorized_data: PartnershipAuthorizedData;
}

/** 合作关系记录 */
export interface PartnershipRecord {
  /** 合作方信息 */
  partner: PartnershipPartner;
  /** 被授权数据 */
  authorized_data: PartnershipAuthorizedData;
  /** 建立合作关系时间 */
  build_time: string;
  /** 终止合作关系时间 */
  terminate_time?: string;
  /** 创建时间 */
  create_time: string;
  /** 更新时间 */
  update_time: string;
}

/**
 * 查询合作关系列表响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012380536
 */
export interface QueryPartnershipsResponse {
  /** 合作关系结果集 */
  data: PartnershipRecord[];
  /** 分页页码 */
  offset: number;
  /** 分页大小 */
  limit: number;
  /** 总数量 */
  total_count?: number;
}

// ============= 支付即服务 =============

/**
 * 服务人员查询请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535123
 */
export interface QuerySmartGuidesParams {
  /** 门店ID */
  store_id: number;
  /** 企业微信员工ID */
  userid?: string;
  /** 手机号码（需加密） */
  mobile?: string;
  /** 工号 */
  work_id?: string;
  /** 最大资源条数，不大于10 */
  limit?: number;
  /** 请求资源起始位置 */
  offset?: number;
}

/** 服务人员信息 */
export interface SmartGuide {
  /** 服务人员ID */
  guide_id: string;
  /** 门店ID */
  store_id: number;
  /** 服务人员姓名 */
  name?: string;
  /** 手机号码 */
  mobile?: string;
  /** 企业微信员工ID */
  userid?: string;
  /** 工号 */
  work_id?: string;
}

/**
 * 服务人员查询响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535123
 */
export interface QuerySmartGuidesResponse {
  /** 服务人员列表 */
  data: SmartGuide[];
  /** 符合条件的服务人员数量 */
  total_count: number;
  /** 该次请求返回的最大资源条数 */
  limit: number;
  /** 请求资源起始位置 */
  offset: number;
}

/**
 * 服务人员注册请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535138
 */
export interface RegisterSmartGuideRequest {
  /** 企业ID */
  corpid: string;
  /** 门店ID */
  store_id: number;
  /** 企业微信员工ID */
  userid: string;
  /** 企业微信员工姓名（需加密） */
  name: string;
  /** 手机号码（需加密） */
  mobile: string;
  /** 员工个人二维码URL */
  qr_code: string;
  /** 头像URL */
  avatar: string;
  /** 群二维码URL */
  group_qrcode?: string;
}

/**
 * 服务人员注册响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535138
 */
export interface RegisterSmartGuideResponse {
  /** 服务人员ID */
  guide_id: string;
}

/**
 * 服务人员更新请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535160
 */
export interface UpdateSmartGuideRequest {
  /** 服务人员姓名（需加密） */
  name?: string;
  /** 手机号码（需加密） */
  mobile?: string;
  /** 服务人员二维码URL */
  qr_code?: string;
  /** 头像URL */
  avatar?: string;
  /** 群二维码URL */
  group_qrcode?: string;
}

/**
 * 服务人员分配请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535161
 */
export interface AssignSmartGuideRequest {
  /** 商户系统内部订单号 */
  out_trade_no: string;
}

// ============= 智慧商圈 =============

/**
 * 商圈会员积分同步请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534698
 */
export interface SyncBusinessCirclePointsRequest {
  /** 商圈商户ID，服务商模式时需填写 */
  sub_mchid?: string;
  /** 微信支付推送的商圈内交易通知中的微信订单号 */
  transaction_id: string;
  /** 顾客授权积分时使用的小程序AppID */
  appid: string;
  /** 顾客授权时使用的小程序上的OpenID */
  openid: string;
  /** 是否获得积分 */
  earn_points: boolean;
  /** 顾客此笔交易新增的积分值 */
  increased_points: number;
  /** 积分更新时间 */
  points_update_time: string;
  /** 未获得积分时的备注信息 */
  no_points_remarks?: string;
  /** 当前顾客积分总额 */
  total_points?: number;
}

/**
 * 商圈会员积分服务授权查询响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534848
 */
export interface QueryBusinessCircleAuthorizationResponse {
  /** 顾客OpenID */
  openid: string;
  /** 授权状态 */
  authorize_state: 'UNAUTHORIZED' | 'AUTHORIZED' | 'DEAUTHORIZED';
  /** 顾客成功授权商圈积分的时间 */
  authorize_time?: string;
  /** 顾客关闭授权商圈积分的时间 */
  deauthorize_time?: string;
}

/**
 * 商圈会员待积分状态查询请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534994
 */
export interface QueryBusinessCirclePendingPointsParams {
  /** 顾客OpenID */
  openid: string;
  /** 顾客授权积分时使用的小程序AppID */
  appid: string;
  /** 微信订单号 */
  transaction_id: string;
}

/**
 * 商圈会员待积分状态查询响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534994
 */
export interface QueryBusinessCirclePendingPointsResponse {
  /** 是否有待积分 */
  pending_points: boolean;
  /** 待积分值 */
  increased_points?: number;
}

/**
 * 商圈会员停车状态同步请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012535502
 */
export interface SyncBusinessCircleParkingStatusRequest {
  /** 顾客OpenID */
  openid: string;
  /** 顾客授权时使用的小程序AppID */
  appid: string;
  /** 停车入场时间 */
  in_parking_time: string;
  /** 停车场名称 */
  parking_name?: string;
}

// ============= 支付有礼 =============

/** 活动状态 */
export type PayGiftActivityState =
  | 'ACTIVITY_STATE_UNKNOWN'
  | 'NOT_START'
  | 'RUNNING'
  | 'PAUSED'
  | 'OVER';

/**
 * 创建全场满额送活动请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012487898
 */
export interface CreatePayGiftActivityRequest {
  /** 活动基本信息 */
  activity_base_info: {
    /** 活动名称 */
    activity_name: string;
    /** 活动副标题 */
    activity_second_title: string;
    /** 商户logo */
    merchant_logo_url: string;
    /** 背景颜色 */
    background_color?: string;
    /** 活动开始时间 */
    begin_time: string;
    /** 活动结束时间 */
    end_time: string;
    /** 可用时间段 */
    available_periods?: {
      /** 可用时间 */
      available_time?: { begin_time: string; end_time: string }[];
      /** 每日可用时间 */
      available_day_time?: { begin_day_time: string; end_day_time: string }[];
    };
    /** 商户请求单号 */
    out_request_no: string;
    /** 投放目的 */
    delivery_purpose: 'OFF_LINE_PAY' | 'JUMP_MINI_APP';
    /** 小程序appid */
    mini_programs_appid?: string;
    /** 小程序path */
    mini_programs_path?: string;
  };
  /** 奖品发放规则 */
  award_send_rule: {
    /** 消费金额门槛，单位分 */
    transaction_amount_minimum: number;
    /** 发送内容 */
    send_content: 'SINGLE_COUPON' | 'GIFT_PACKAGE';
    /** 奖品类型 */
    award_type: 'BUSIFAVOR';
    /** 奖品列表 */
    award_list: {
      /** 代金券批次Id */
      stock_id: string;
      /** 奖品大图 */
      original_image_url: string;
      /** 奖品小图 */
      thumbnail_url?: string;
    }[];
    /** 商户选项 */
    merchant_option: 'IN_SEVICE_COUPON_MERCHANT' | 'MANUAL_INPUT_MERCHANT';
    /** 发券商户号列表 */
    merchant_id_list?: string[];
  };
  /** 高级设置 */
  advanced_setting?: {
    /** 投放用户类别 */
    delivery_user_category?: 'DELIVERY_ALL_PERSON' | 'DELIVERY_MEMBER_PERSON';
    /** 商家会员appid */
    merchant_member_appid?: string;
    /** 订单优惠标记 */
    goods_tags?: string[];
  };
}

/**
 * 创建全场满额送活动响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012487898
 */
export interface CreatePayGiftActivityResponse {
  /** 活动id */
  activity_id: string;
  /** 创建时间 */
  create_time: string;
}

/**
 * 查询支付有礼活动列表请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012489126
 */
export interface QueryPayGiftActivitiesParams {
  /** 活动状态 */
  activity_state?: PayGiftActivityState;
  /** 分页大小 */
  limit?: number;
  /** 分页起始位置 */
  offset?: number;
}

/** 支付有礼活动概要 */
export interface PayGiftActivitySummary {
  /** 活动id */
  activity_id: string;
  /** 活动状态 */
  activity_state: PayGiftActivityState;
  /** 活动名称 */
  activity_name?: string;
  /** 活动开始时间 */
  begin_time?: string;
  /** 活动结束时间 */
  end_time?: string;
}

/**
 * 查询支付有礼活动列表响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012489126
 */
export interface QueryPayGiftActivitiesResponse {
  /** 活动列表 */
  data: PayGiftActivitySummary[];
  /** 总数量 */
  total_count: number;
}

/**
 * 查询活动详情响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012487971
 */
export interface QueryPayGiftActivityResponse {
  /** 活动id */
  activity_id: string;
  /** 活动状态 */
  activity_state: PayGiftActivityState;
  /** 活动创建时间 */
  create_time: string;
  /** 活动信息 */
  activity_base_info: Record<string, unknown>;
  /** 奖品发放规则 */
  award_send_rule: Record<string, unknown>;
  /** 高级设置 */
  advanced_setting?: Record<string, unknown>;
}

/**
 * 获取活动发券商户号响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012466149
 */
export interface GetPayGiftActivityMerchantsResponse {
  /** 发券商户号列表 */
  merchant_id_list: string[];
}

/**
 * 获取活动指定商品列表响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012466448
 */
export interface GetPayGiftActivityGoodsResponse {
  /** 商品列表 */
  goods_tag_list: string[];
}

// ============= 医保支付 =============

/** 医保混合支付类型 */
export type MedInsMixPayType =
  | 'UNKNOWN_MIX_PAY_TYPE'
  | 'CASH_ONLY'
  | 'INSURANCE_ONLY'
  | 'CASH_AND_INSURANCE';

/** 医保订单类型 */
export type MedInsOrderType =
  | 'UNKNOWN_ORDER_TYPE'
  | 'REG_PAY'
  | 'DIAG_PAY'
  | 'COVID_EXAM_PAY'
  | 'IN_HOSP_PAY'
  | 'PHARMACY_PAY'
  | 'INSURANCE_PAY'
  | 'INT_REG_PAY'
  | 'INT_RE_DIAG_PAY'
  | 'INT_RX_PAY'
  | 'COVID_ANTIGEN_PAY'
  | 'MED_PAY';

/** 医保混合订单支付状态 */
export type MedInsMixPayStatus =
  | 'UNKNOWN_MIX_PAY_STATUS'
  | 'MIX_PAY_CREATED'
  | 'MIX_PAY_SUCCESS'
  | 'MIX_PAY_REFUND'
  | 'MIX_PAY_FAIL';

/** 医保自费部分支付状态 */
export type MedInsSelfPayStatus =
  | 'UNKNOWN_SELF_PAY_STATUS'
  | 'SELF_PAY_CREATED'
  | 'SELF_PAY_SUCCESS'
  | 'SELF_PAY_REFUND'
  | 'SELF_PAY_FAIL'
  | 'NO_SELF_PAY';

/** 医保部分支付状态 */
export type MedInsMedInsPayStatus =
  | 'UNKNOWN_MED_INS_PAY_STATUS'
  | 'MED_INS_PAY_CREATED'
  | 'MED_INS_PAY_SUCCESS'
  | 'MED_INS_PAY_REFUND'
  | 'MED_INS_PAY_FAIL'
  | 'NO_MED_INS_PAY';

/** 医保身份识别信息 */
export interface MedInsPersonIdentification {
  /** 真实姓名（需加密） */
  name: string;
  /** 身份证MD5摘要（需加密） */
  id_digest: string;
  /** 证件类型 */
  card_type: string;
}

/** 现金补充明细 */
export interface MedInsCashAddEntity {
  /** 现金补充金额，单位：分 */
  cash_add_fee: number;
  /** 类型 */
  cash_add_type: 'DEFAULT_ADD_TYPE' | 'FREIGHT' | 'OTHER_MEDICAL_EXPENSES';
}

/** 现金减免明细 */
export interface MedInsCashReduceEntity {
  /** 现金减免金额，单位：分 */
  cash_reduce_fee: number;
  /** 类型 */
  cash_reduce_type:
    | 'DEFAULT_REDUCE_TYPE'
    | 'HOSPITAL_REDUCE'
    | 'PHARMACY_DISCOUNT'
    | 'DISCOUNT'
    | 'PRE_PAYMENT'
    | 'DEPOSIT_DEDUCTION';
}

/**
 * 医保自费混合收款下单请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781466
 */
export interface CreateMedInsOrderRequest {
  /** 混合支付类型 */
  mix_pay_type: MedInsMixPayType;
  /** 订单类型 */
  order_type: MedInsOrderType;
  /** 医疗机构的公众号ID */
  appid: string;
  /** 用户在appid下的唯一标识 */
  openid: string;
  /** 支付人身份信息 */
  payer: MedInsPersonIdentification;
  /** 是否代亲属支付 */
  pay_for_relatives?: boolean;
  /** 亲属身份信息 */
  relative?: MedInsPersonIdentification;
  /** 商户订单号 */
  out_trade_no: string;
  /** 医疗机构订单号 */
  serial_no: string;
  /** 医保局返回的支付单ID */
  pay_order_id?: string;
  /** 医保局返回的支付授权码 */
  pay_auth_no?: string;
  /** 用户定位信息，格式：经度,纬度 */
  geo_location?: string;
  /** 城市ID */
  city_id: string;
  /** 医疗机构名称 */
  med_inst_name: string;
  /** 医疗机构编码 */
  med_inst_no: string;
  /** 医保下单时间，rfc3339格式 */
  med_ins_order_create_time?: string;
  /** 下单总金额，单位：分 */
  total_fee: number;
  /** 医保统筹支付金额，单位：分 */
  med_ins_gov_fee?: number;
  /** 医保个账支付金额，单位：分 */
  med_ins_self_fee?: number;
  /** 医保其他支付金额，单位：分 */
  med_ins_other_fee?: number;
  /** 需自费的金额，单位：分 */
  med_ins_cash_fee?: number;
  /** 实际需要用户微信支付的金额，单位：分 */
  wechat_pay_cash_fee?: number;
  /** 现金补充列表 */
  cash_add_detail?: MedInsCashAddEntity[];
  /** 现金减免列表 */
  cash_reduce_detail?: MedInsCashReduceEntity[];
  /** 回调通知URL */
  callback_url: string;
  /** 自费预下单ID */
  prepay_id?: string;
  /** 医疗机构透传给医保的数据 */
  passthrough_request_content?: string;
  /** 扩展字段 */
  extends?: string;
  /** 附加数据 */
  attach?: string;
  /** 渠道号 */
  channel_no?: string;
  /** 是否到医保局测试环境下单 */
  med_ins_test_env?: boolean;
}

/**
 * 医保订单响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781466
 */
export interface MedInsOrderResponse {
  /** 医保自费混合订单号 */
  mix_trade_no: string;
  /** 混合订单支付状态 */
  mix_pay_status: MedInsMixPayStatus;
  /** 自费部分支付状态 */
  self_pay_status: MedInsSelfPayStatus;
  /** 医保部分支付状态 */
  med_ins_pay_status: MedInsMedInsPayStatus;
  /** 订单支付时间 */
  paid_time?: string;
  /** 医保局返回内容 */
  passthrough_response_content?: string;
  /** 医保支付失败原因 */
  med_ins_fail_reason?: string;
  /** 混合支付类型 */
  mix_pay_type: MedInsMixPayType;
  /** 订单类型 */
  order_type: MedInsOrderType;
  /** 公众号ID */
  appid: string;
  /** 用户OpenID */
  openid: string;
  /** 是否代亲属支付 */
  pay_for_relatives?: boolean;
  /** 商户订单号 */
  out_trade_no: string;
  /** 医疗机构订单号 */
  serial_no: string;
  /** 支付单ID */
  pay_order_id?: string;
  /** 支付授权码 */
  pay_auth_no?: string;
  /** 用户定位信息 */
  geo_location?: string;
  /** 城市ID */
  city_id: string;
  /** 医疗机构名称 */
  med_inst_name: string;
  /** 医疗机构编码 */
  med_inst_no: string;
  /** 下单总金额，单位：分 */
  total_fee: number;
  /** 医保统筹支付金额 */
  med_ins_gov_fee?: number;
  /** 医保个账支付金额 */
  med_ins_self_fee?: number;
  /** 医保其他支付金额 */
  med_ins_other_fee?: number;
  /** 需自费的金额 */
  med_ins_cash_fee?: number;
  /** 实际需要用户微信支付的金额 */
  wechat_pay_cash_fee?: number;
  /** 回调通知URL */
  callback_url: string;
  /** 自费预下单ID */
  prepay_id?: string;
  /** 扩展字段 */
  extends?: string;
  /** 附加数据 */
  attach?: string;
  /** 渠道号 */
  channel_no?: string;
}

// ============= 微信支付公钥 =============

/**
 * 签名验签测试请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4014551946
 */
export interface EchoTestRequest {
  /** 商户回调地址 */
  notify_url?: string;
  /** 回显信息字段，无需加密 */
  echo_message: string;
  /** 用平台证书或微信支付公钥加密后的字段 */
  encrypted_echo_message?: string;
}

/**
 * 签名验签测试响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4014551946
 */
export interface EchoTestResponse {
  /** 回显信息，内容与请求中的 echo_message 一致 */
  echo_message: string;
  /** 商户证书加密回显信息 */
  encrypted_echo_message?: string;
}

// ============= 医保支付 - 回调通知 =============

/**
 * 医保支付成功回调通知解密数据
 *
 * 医保自费混合订单支付成功后，微信支付会向商户发送此回调通知。
 * event_type 为 MED_INS.SUCCESS。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781502
 */
export interface MedInsSuccessCallbackData {
  /** 医保自费混合订单号 */
  mix_trade_no: string;
  /** 混合订单支付状态 */
  mix_pay_status: MedInsMixPayStatus;
  /** 自费部分支付状态 */
  self_pay_status: MedInsSelfPayStatus;
  /** 医保部分支付状态 */
  med_ins_pay_status: MedInsMedInsPayStatus;
  /** 订单支付时间 */
  paid_time?: string;
  /** 医保局返回内容 */
  passthrough_response_content?: string;
  /** 医保支付失败原因 */
  med_ins_fail_reason?: string;
  /** 混合支付类型 */
  mix_pay_type: MedInsMixPayType;
  /** 订单类型 */
  order_type: MedInsOrderType;
  /** 公众号ID */
  appid: string;
  /** 用户OpenID */
  openid: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 医疗机构订单号 */
  serial_no: string;
  /** 医疗机构名称 */
  med_inst_name: string;
  /** 医疗机构编码 */
  med_inst_no: string;
  /** 下单总金额，单位：分 */
  total_fee: number;
  /** 医保统筹支付金额，单位：分 */
  med_ins_gov_fee?: number;
  /** 医保个账支付金额，单位：分 */
  med_ins_self_fee?: number;
  /** 医保其他支付金额，单位：分 */
  med_ins_other_fee?: number;
  /** 需自费的金额，单位：分 */
  med_ins_cash_fee?: number;
  /** 实际需要用户微信支付的金额，单位：分 */
  wechat_pay_cash_fee?: number;
  /** 附加数据 */
  attach?: string;
}

/**
 * 医保退款回调通知解密数据
 *
 * 医保订单退款完成后，微信支付会向商户发送此回调通知。
 * event_type 为 MED_INS.REFUND.SUCCESS、MED_INS.REFUND.ABNORMAL 或 MED_INS.REFUND.CLOSED。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781502
 */
export interface MedInsRefundCallbackData {
  /** 医保自费混合订单号 */
  mix_trade_no: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 微信退款单号 */
  refund_id: string;
  /** 退款状态 */
  refund_status: 'SUCCESS' | 'CLOSED' | 'ABNORMAL';
  /** 退款成功时间，状态为 SUCCESS 时返回，RFC3339 格式 */
  success_time?: string;
  /** 退款入账账户 */
  user_received_account: string;
  /** 退款金额信息 */
  amount: {
    /** 原订单金额，单位：分 */
    total: number;
    /** 退款金额，单位：分 */
    refund: number;
    /** 用户退款金额，单位：分 */
    payer_refund: number;
  };
  /** 商户订单号 */
  out_trade_no: string;
}

// ============= 智慧商圈 - 回调通知 =============

/**
 * 商圈会员积分服务授权结果回调通知解密数据
 *
 * 用户在小程序内授权/解除授权商圈积分服务后，微信支付会向商户发送此回调通知。
 * event_type 为 BUSINESS_CIRCLE.USER_AUTHORIZE 或 BUSINESS_CIRCLE.USER_DEAUTHORIZE。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534698
 */
export interface BusinessCircleAuthorizeCallbackData {
  /** 顾客OpenID */
  openid: string;
  /** 顾客授权积分时使用的小程序AppID */
  appid: string;
  /** 授权状态 */
  authorize_state: 'AUTHORIZED' | 'DEAUTHORIZED';
  /** 授权时间 */
  authorize_time: string;
}

/**
 * 商圈会员场内支付结果回调通知解密数据
 *
 * 用户在商圈内支付成功后，微信支付会向商户发送此回调通知。
 * event_type 为 TRANSACTION.SUCCESS。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534698
 */
export interface BusinessCircleTransactionCallbackData {
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 顾客OpenID */
  openid: string;
  /** 顾客授权积分时使用的小程序AppID */
  appid: string;
  /** 交易状态 */
  trade_state: string;
  /** 交易状态描述 */
  trade_state_desc: string;
  /** 支付完成时间 */
  success_time?: string;
  /** 订单金额信息 */
  amount: {
    /** 订单总金额，单位：分 */
    total: number;
    /** 用户支付金额，单位：分 */
    payer_total: number;
  };
}

/**
 * 商圈会员场内退款结果回调通知解密数据
 *
 * 商圈内交易退款完成后，微信支付会向商户发送此回调通知。
 * event_type 为 REFUND.SUCCESS、REFUND.ABNORMAL 或 REFUND.CLOSED。
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012534698
 */
export interface BusinessCircleRefundCallbackData {
  /** 微信退款单号 */
  refund_id: string;
  /** 商户退款单号 */
  out_refund_no: string;
  /** 微信支付订单号 */
  transaction_id: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 退款状态 */
  refund_status: 'SUCCESS' | 'CLOSED' | 'ABNORMAL';
  /** 退款成功时间，状态为 SUCCESS 时返回，RFC3339 格式 */
  success_time?: string;
  /** 退款入账账户 */
  user_received_account: string;
  /** 退款金额信息 */
  amount: {
    /** 原订单金额，单位：分 */
    total: number;
    /** 退款金额，单位：分 */
    refund: number;
    /** 用户退款金额，单位：分 */
    payer_refund: number;
  };
}

// ============= 支付分 - 订单详情页 =============

/**
 * 支付分 JSAPI 调起订单详情页配置
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587945
 */
export interface PayScoreDetailJsapiBridgeConfig {
  /** 公众账号ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 服务ID */
  service_id: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 时间戳（秒） */
  timestamp: string;
  /** 随机字符串 */
  nonce_str: string;
  /** 签名方式 */
  sign_type: 'RSA';
  /** 签名 */
  sign: string;
}

/**
 * 支付分小程序调起订单详情页配置
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587949
 */
export interface PayScoreDetailMiniProgramBridgeConfig {
  /** 商户号 */
  mchid: string;
  /** 服务ID */
  service_id: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 时间戳（秒） */
  timestamp: string;
  /** 随机字符串 */
  nonce_str: string;
  /** 签名方式 */
  sign_type: 'RSA';
  /** 签名 */
  sign: string;
}

/**
 * 支付分 APP 调起订单详情页配置
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012587909
 */
export interface PayScoreDetailAppBridgeConfig {
  /** 公众账号ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 服务ID */
  service_id: string;
  /** 商户服务订单号 */
  out_order_no: string;
  /** 时间戳（秒） */
  timestamp: string;
  /** 随机字符串 */
  nonce_str: string;
  /** 签名方式 */
  sign_type: 'RSA';
  /** 签名 */
  sign: string;
}

// ============= 营销专用图片上传 =============

/**
 * 营销专用图片上传请求参数
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012286130
 */
export interface UploadMarketingImageRequest {
  /** 图片文件 */
  file: Buffer;
  /** 图片文件名 */
  filename: string;
  /** 图片类型 */
  content_type?: string;
}

/**
 * 营销专用图片上传响应
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012286130
 */
export interface UploadMarketingImageResponse {
  /** 媒体文件标识 */
  media_id: string;
}

// ============= 医保支付 - Bridge 配置 =============

/**
 * 医保支付小程序调起配置
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781466
 */
export interface MedInsMiniProgramBridgeConfig {
  /** 跳转小程序的 appId */
  appId: string;
  /** 跳转小程序的路径 */
  path: string;
  /** 传递给目标小程序的数据 */
  extraData: {
    /** 商户号 */
    mchid: string;
    /** 医保自费混合订单号 */
    mix_trade_no: string;
  };
}

/**
 * 医保支付 JSAPI 调起配置
 *
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4016781466
 */
export interface MedInsJsapiBridgeConfig {
  /** 公众账号ID */
  appid: string;
  /** 商户号 */
  mchid: string;
  /** 医保自费混合订单号 */
  mix_trade_no: string;
  /** 时间戳（秒） */
  timestamp: string;
  /** 随机字符串 */
  nonce_str: string;
  /** 签名方式 */
  sign_type: 'RSA';
  /** 签名 */
  sign: string;
}

// ============= 服务商 JSAPI 支付 =============

export interface PartnerJsapiPayer {
  sp_openid?: string;
  sub_openid?: string;
}

export interface CreatePartnerJsapiOrderRequest {
  sp_appid: string;
  sp_mchid: string;
  sub_appid?: string;
  sub_mchid: string;
  description: string;
  out_trade_no: string;
  time_expire?: string;
  attach?: string;
  notify_url: string;
  goods_tag?: string;
  support_fapiao?: boolean;
  amount: OrderAmount;
  payer: PartnerJsapiPayer;
  detail?: OrderDetail;
  scene_info?: SceneInfo;
  settle_info?: SettleInfo;
}

export interface CreatePartnerJsapiOrderResponse {
  prepay_id: string;
}

// ============= 服务商 APP 支付 =============

export interface CreatePartnerAppOrderRequest {
  sp_appid: string;
  sp_mchid: string;
  sub_appid?: string;
  sub_mchid: string;
  description: string;
  out_trade_no: string;
  time_expire?: string;
  attach?: string;
  notify_url: string;
  goods_tag?: string;
  support_fapiao?: boolean;
  amount: OrderAmount;
  detail?: OrderDetail;
  scene_info?: SceneInfo;
  settle_info?: SettleInfo;
}

export interface CreatePartnerAppOrderResponse {
  prepay_id: string;
}

// ============= 服务商 H5 支付 =============

export interface PartnerH5SceneInfo {
  payer_client_ip: string;
  device_id?: string;
  store_info?: StoreInfo;
  h5_info: H5Info;
}

export interface CreatePartnerH5OrderRequest {
  sp_appid: string;
  sp_mchid: string;
  sub_appid?: string;
  sub_mchid: string;
  description: string;
  out_trade_no: string;
  time_expire?: string;
  attach?: string;
  notify_url: string;
  goods_tag?: string;
  support_fapiao?: boolean;
  amount: OrderAmount;
  detail?: OrderDetail;
  scene_info: PartnerH5SceneInfo;
  settle_info?: SettleInfo;
}

export interface CreatePartnerH5OrderResponse {
  h5_url: string;
}

// ============= 服务商 Native 支付 =============

export interface CreatePartnerNativeOrderRequest {
  sp_appid: string;
  sp_mchid: string;
  sub_appid?: string;
  sub_mchid: string;
  description: string;
  out_trade_no: string;
  time_expire?: string;
  attach?: string;
  notify_url: string;
  goods_tag?: string;
  support_fapiao?: boolean;
  amount: OrderAmount;
  detail?: OrderDetail;
  scene_info?: SceneInfo;
  settle_info?: SettleInfo;
}

export interface CreatePartnerNativeOrderResponse {
  code_url: string;
}

// ============= 服务商订单查询 =============

export interface PartnerQueryOrderParams {
  out_trade_no?: string;
  transaction_id?: string;
  sp_mchid: string;
  sub_mchid: string;
}

export interface PartnerQueryOrderResponse {
  sp_appid: string;
  sp_mchid: string;
  sub_appid?: string;
  sub_mchid: string;
  out_trade_no: string;
  transaction_id?: string;
  trade_type?: string;
  trade_state: string;
  trade_state_desc: string;
  bank_type?: string;
  attach?: string;
  success_time?: string;
  payer: PartnerJsapiPayer;
  amount: OrderAmountResponse;
  scene_info?: SceneInfoResponse;
  promotion_detail?: PromotionDetail[];
}

// ============= 服务商关闭订单 =============

export interface PartnerCloseOrderRequest {
  sp_mchid: string;
  sub_mchid: string;
}
