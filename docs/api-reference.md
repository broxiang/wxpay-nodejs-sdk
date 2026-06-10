# API 参考文档

本文档列出 `wxpay-nodejs-sdk` 所有公开 API 的详细说明。

---

## 目录

- [WxPayClient](#wxpayclient) — API 客户端
- [JsapiService](#jsapiservice) — JSAPI/小程序支付
- [AppService](#appservice) — APP 支付
- [H5Service](#h5service) — H5 支付
- [NativeService](#nativeservice) — Native 支付
- [CombineService](#combineservice) — 合单支付
- [BillService](#billservice) — 账单服务
- [CallbackHandler](#callbackhandler) — 回调处理
- [Bridge 工具](#bridge-工具) — 调起支付签名
- [签名工具](#签名工具) — API 签名
- [类型定义](#类型定义) — 通用类型

---

## WxPayClient

微信支付 API V3 客户端，所有 API 调用的入口。

```ts
new WxPayClient(options: WxPayOptions)
```

**参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:---:|--------|------|
| `mchid` | `string` | ✅ | - | 商户号 |
| `apiV3Key` | `string` | ✅ | - | APIv3 密钥（32 位） |
| `serialNo` | `string` | ✅ | - | 商户证书序列号 |
| `privateKey` | `string \| Buffer` | ✅ | - | 商户私钥（PEM 字符串、文件路径或 Buffer） |
| `platformCertificates` | `PlatformCertificate[]` | ❌ | `[]` | 平台证书 |
| `timeout` | `number` | ❌ | `30000` | 请求超时（毫秒） |
| `sandbox` | `boolean` | ❌ | `false` | 是否使用沙箱环境 |

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `mchid` | `string` | 商户号 |
| `certificates` | `CertificateManager` | 平台证书管理器 |

**方法：**

| 方法 | 说明 |
|------|------|
| `get<T>(path, params?)` | GET 请求 |
| `post<T>(path, body?, params?)` | POST 请求 |
| `put<T>(path, body?, params?)` | PUT 请求 |
| `delete<T>(path, params?)` | DELETE 请求 |
| `patch<T>(path, body?, params?)` | PATCH 请求 |
| `downloadRaw(url)` | 下载文件（返回 Buffer） |
| `upload<T>(path, file, filename, meta?)` | 上传文件 |

---

## JsapiService

JSAPI 支付 / 小程序支付服务。

```ts
const jsapi = new JsapiService(client: WxPayClient)
```

### createOrder

下单获取预支付 ID。

```ts
createOrder(request: CreateJsapiOrderRequest): Promise<WxPayResponse<CreateJsapiOrderResponse>>
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `appid` | `string(32)` | ✅ | 公众号或小程序 AppID |
| `mchid` | `string(32)` | ✅ | 商户号 |
| `description` | `string(127)` | ✅ | 商品描述 |
| `out_trade_no` | `string(32)` | ✅ | 商户订单号（6-32 字符） |
| `notify_url` | `string(255)` | ✅ | 回调地址（必须 HTTPS） |
| `amount` | `OrderAmount` | ✅ | 订单金额 |
| `amount.total` | `number` | ✅ | 总金额，单位：分 |
| `amount.currency` | `string(16)` | ❌ | 货币类型，固定 `CNY` |
| `payer` | `OrderPayer` | ✅ | 支付者信息 |
| `payer.openid` | `string(128)` | ✅ | 用户 openid |
| `time_expire` | `string(64)` | ❌ | 支付截止时间（RFC 3339） |
| `attach` | `string(128)` | ❌ | 附加数据，回调时原样返回 |
| `scene_info` | `SceneInfo` | ❌ | 场景信息 |

**响应：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `prepay_id` | `string(64)` | 预支付 ID，有效期 2 小时 |

### queryOrderById

查询订单状态。

```ts
queryOrderById(params: QueryOrderParams): Promise<WxPayResponse<QueryOrderResponse>>
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `outTradeNo` | `string` | 二选一 | 商户订单号 |
| `transactionId` | `string` | 二选一 | 微信支付订单号 |

**trade_state 枚举：**

| 值 | 含义 | 终态 |
|----|------|:---:|
| `SUCCESS` | 支付成功 | ✅ |
| `REFUND` | 转入退款 | ✅ |
| `NOTPAY` | 未支付 | ❌ |
| `CLOSED` | 已关闭 | ✅ |
| `REVOKED` | 已撤销 | ✅ |
| `USERPAYING` | 用户支付中 | ❌ |
| `PAYERROR` | 支付失败 | ❌ |

### closeOrder

关闭未支付订单。

```ts
closeOrder(outTradeNo: string, request: CloseOrderRequest): Promise<WxPayResponse<void>>
```

### createRefund

申请退款。

```ts
createRefund(request: CreateRefundRequest): Promise<WxPayResponse<CreateRefundResponse>>
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `out_trade_no` | `string` | 二选一 | 商户订单号 |
| `transaction_id` | `string` | 二选一 | 微信支付订单号 |
| `out_refund_no` | `string` | ✅ | 商户退款单号（唯一） |
| `reason` | `string` | ❌ | 退款原因 |
| `amount` | `RefundAmount` | ✅ | 退款金额 |
| `amount.refund` | `number` | ✅ | 退款金额（分） |
| `amount.total` | `number` | ✅ | 原订单金额（分） |

**status 枚举：**

| 值 | 说明 |
|----|------|
| `SUCCESS` | 退款成功 |
| `CLOSED` | 退款关闭 |
| `PROCESSING` | 退款处理中 |
| `ABNORMAL` | 退款异常 |

### queryRefund

查询退款状态。

```ts
queryRefund(params: QueryRefundParams): Promise<WxPayResponse<QueryRefundResponse>>
```

### tradeBill / fundFlowBill / downloadBill

账单相关方法，详见 [BillService](#billservice)。

---

## AppService / H5Service / NativeService

APP 支付、H5 支付、Native 支付服务，接口与 JsapiService 一致：

```ts
const app = new AppService(client);
const h5 = new H5Service(client);
const native = new NativeService(client);

// 使用方式相同
await app.createOrder({ /* ... */ });
await h5.createOrder({ /* ... */ });
await native.createOrder({ /* ... */ });
```

---

## CombineService

合单支付服务。

```ts
const combine = new CombineService(client);
```

| 方法 | 说明 |
|------|------|
| `createOrder(request)` | 合单下单 |
| `queryOrder(params)` | 查询合单订单 |
| `closeOrder(outTradeNo, subOrders)` | 关闭合单订单 |

---

## BillService

账单下载服务。

```ts
const bill = new BillService(client);
```

| 方法 | 说明 |
|------|------|
| `applyTradeBill(params)` | 申请交易账单 |
| `applyFundFlowBill(params)` | 申请资金账单 |
| `applyProfitSharingBill(params)` | 申请分账账单 |
| `downloadBill(downloadUrl)` | 下载账单（返回 Buffer） |

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `bill_date` | `string` | ✅ | 账单日期（YYYY-MM-DD） |
| `bill_type` | `string` | ❌ | 账单类型：ALL / SUCCESS / REFUND |
| `tar_type` | `string` | ❌ | 压缩方式：GZIP |

> `download_url` 有效期 5 分钟（分账账单 30 秒）。

---

## 其他 Service

| Service | 说明 | 主要方法 |
|---------|------|---------|
| `ProfitSharingService` | 分账 | `createOrder`、`queryOrder`、`createReturnOrder`、`unfreeze`、`addReceiver`、`deleteReceiver` |
| `PayScoreService` | 支付分 | `createOrder`、`queryOrder`、`cancelOrder`、`completeOrder`、`modifyOrder` |
| `ParkingService` | 停车服务 | `createEntry`、`createTransaction`、`queryTransaction`、`applyRefund` |
| `MerchantTransferService` | 商家转账 | `createTransfer`、`queryTransfer`、`cancelTransfer`、`createAuthorization` |
| `CouponService` | 代金券 | `createStock`、`activateStock`、`sendCoupon`、`queryStockDetail` |
| `ComplaintService` | 消费者投诉 | `queryComplaints`、`queryComplaintDetail`、`replyComplaint`、`uploadImage` |
| `PartnershipService` | 委托营销 | `createPartnership`、`queryPartnership`、`terminatePartnership` |
| `MediaService` | 文件上传 | `uploadImage`、`uploadVideo` |

> 详细参数请参考源码中的类型定义。

---

## CallbackHandler

回调通知处理器，用于验签和解密。

```ts
const handler = new CallbackHandler(apiV3Key: string, certificates: CertificateManager)
```

### processTransactionCallback

处理支付成功回调（推荐使用）。

```ts
processTransactionCallback(
  headers: CallbackHeaders,
  body: string
): DecryptedCallback<TransactionCallbackData>
```

### processRefundCallback

处理退款回调。

```ts
processRefundCallback(
  headers: CallbackHeaders,
  body: string
): DecryptedCallback<RefundCallbackData>
```

### 其他回调处理方法

| 方法 | 说明 |
|------|------|
| `process(headers, body)` | 通用回调处理 |
| `verifySignature(headers, body)` | 仅验签 |
| `decryptNotification(notification)` | 仅解密 |
| `processParkingEntryStatusCallback` | 停车入场状态回调 |
| `processParkingTransactionCallback` | 停车扣费结果回调 |
| `processProfitSharingCallback` | 分账动账回调 |
| `processMerchantTransferCallback` | 商家转账状态回调 |
| `processComplaintCallback` | 消费者投诉回调 |

**CallbackHeaders：**

| 请求头 | 说明 |
|--------|------|
| `wechatpay-signature` | 微信支付签名 |
| `wechatpay-timestamp` | 时间戳 |
| `wechatpay-nonce` | 随机数 |
| `wechatpay-serial` | 平台证书序列号 |

---

## Bridge 工具

### buildJsapiBridgeConfig

生成 WeixinJSBridge.invoke() 所需配置（公众号网页支付）。

```ts
buildJsapiBridgeConfig(appId: string, prepayId: string, privateKey: string | Buffer): JsapiBridgeConfig
```

**返回值：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `appId` | `string` | 应用 ID |
| `timeStamp` | `string` | 时间戳（秒） |
| `nonceStr` | `string` | 随机字符串 |
| `package` | `string` | `prepay_id=xxx` |
| `signType` | `string` | 固定 `RSA` |
| `paySign` | `string` | 签名值 |

### buildMiniProgramBridgeConfig

生成 wx.requestPayment() 所需配置（小程序支付）。

```ts
buildMiniProgramBridgeConfig(appId: string, prepayId: string, privateKey: string | Buffer): MiniProgramBridgeConfig
```

> 与 JSAPI 的区别：小程序不需要传递 `appId` 字段，但签名时仍需使用 appId 计算。

---

## 签名工具

| 函数 | 说明 |
|------|------|
| `buildSignString(payload)` | 构建 API V3 签名串 |
| `sign(signString, privateKey)` | RSA-SHA256 签名 |
| `buildAuthorization(mchid, serialNo, timestamp, nonce, signature)` | 构建 Authorization 请求头 |
| `generateNonce()` | 生成随机 nonce |
| `verifySignature(body, signature, timestamp, nonce, publicKey)` | 验证回调签名 |

---

## 类型定义

### WxPayResponse

```ts
interface WxPayResponse<T = unknown> {
  status: number;
  headers: Record<string, string>;
  data: T;
}
```

### WxPayError

```ts
class WxPayError extends Error {
  status: number;
  headers: Record<string, string>;
  detail: WxPayErrorDetail;
  get isClientError(): boolean;  // 4xx
  get isServerError(): boolean;  // 5xx
}
```

### 常用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|:---:|------|
| `APPID_MCHID_NOT_MATCH` | 400 | AppID 与商户号不匹配 |
| `PARAM_ERROR` | 400 | 参数错误 |
| `INVALID_REQUEST` | 400 | 请求不符合规范 |
| `SIGN_ERROR` | 401 | 签名验证失败 |
| `NO_AUTH` | 403 | 无权限 |
| `OUT_TRADE_NO_USED` | 403 | 商户订单号重复 |
| `FREQUENCY_LIMITED` | 429 | 请求频率超限 |
| `SYSTEM_ERROR` | 500 | 系统错误（可重试） |
