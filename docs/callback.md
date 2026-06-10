# 回调通知处理

本文档详细介绍如何使用 `wxpay-nodejs-sdk` 处理微信支付回调通知，包括签名验证、数据解密、应答处理以及最佳实践。

---

## 目录

- [回调通知机制](#回调通知机制)
- [签名验证](#签名验证)
- [数据解密](#数据解密)
- [完整处理流程](#完整处理流程)
- [Express 完整示例](#express-完整示例)
- [应答处理规范](#应答处理规范)
- [幂等处理](#幂等处理)
- [常见回调类型](#常见回调类型)

---

## 回调通知机制

微信支付系统在以下事件发生时，会向商户的 `notify_url` 发送 POST 请求：

| 事件类型 | event_type | 说明 |
|---------|-----------|------|
| 支付成功 | `TRANSACTION.SUCCESS` | 用户支付成功 |
| 退款成功 | `REFUND.SUCCESS` | 退款处理成功 |
| 退款异常 | `REFUND.ABNORMAL` | 退款处理异常 |

### 通知特性

- **协议**：HTTPS POST
- **内容类型**：`application/json`
- **重试策略**：通知失败后会按 15s/15s/30s/3m/10m/20m/30m/30m/30m/60m/3h/3h/3h/6h/6h 的频率重试，最多 15 次
- **超时时间**：5 秒

### 通知请求头

| 请求头 | 说明 |
|--------|------|
| `Wechatpay-Signature` | 微信支付签名，用于验证通知真实性 |
| `Wechatpay-Timestamp` | 时间戳 |
| `Wechatpay-Nonce` | 随机数 |
| `Wechatpay-Serial` | 平台证书序列号 |
| `Wechatpay-Signature-Type` | 签名类型（固定 `WECHATPAY2-SHA256-RSA2048`） |

### 通知请求体

```json
{
  "id": "EV-2018022511223320873",
  "create_time": "2015-05-20T13:29:35+08:00",
  "event_type": "TRANSACTION.SUCCESS",
  "resource_type": "encrypt-resource",
  "summary": "支付成功",
  "resource": {
    "original_type": "transaction",
    "algorithm": "AEAD_AES_256_GCM",
    "ciphertext": "...",
    "associated_data": "transaction",
    "nonce": "..."
  }
}
```

> **重要**：回调通知中的业务数据（如订单信息）存储在 `resource.ciphertext` 中，使用 **AES-256-GCM** 加密。必须先验证签名、再解密密文。

---

## 签名验证

使用 `CallbackHandler.verifySignature()` 验证回调通知的真实性：

```ts
import { CallbackHandler } from 'wxpay-nodejs-sdk';

// 初始化
const callbackHandler = new CallbackHandler(
  process.env.WXPAY_API_V3_KEY!,
  wxpay.certificates,  // CertificateManager 实例
);

// 验证签名
const isValid = callbackHandler.verifySignature(
  {
    'wechatpay-signature': req.headers['wechatpay-signature'],
    'wechatpay-timestamp': req.headers['wechatpay-timestamp'],
    'wechatpay-nonce': req.headers['wechatpay-nonce'],
    'wechatpay-serial': req.headers['wechatpay-serial'],
  },
  JSON.stringify(req.body),  // 原始请求体（注意：必须使用原始 JSON 字符串）
);

if (!isValid) {
  console.error('签名验证失败，可能为伪造通知');
  return res.status(403).json({ code: 'FAIL', message: '签名验证失败' });
}
```

### 签名验证原理

1. 根据 `Wechatpay-Serial` 找到对应的微信支付平台证书公钥
2. 使用公钥对签名串 `TIMESTAMP\nNONCE\nBODY\n` 进行 RSA-SHA256 验签
3. 签名一致则证明通知来自微信支付，未被篡改

> **⚠️ 注意**：签名验证使用的请求体必须是 **原始的 JSON 字符串**，不能经过任何格式化或字段重排。建议在 Express 等框架中通过 `express.raw({ type: 'application/json' })` 获取原始 body。

---

## 数据解密

使用 `CallbackHandler.decryptNotification()` 解密回调数据：

```ts
const callback = callbackHandler.decryptNotification<TransactionCallbackData>(
  req.body  // 已解析的 JSON 对象
);

console.log(callback.data.out_trade_no);   // 商户订单号
console.log(callback.data.transaction_id); // 微信支付订单号
console.log(callback.data.trade_state);    // 交易状态
```

解密算法为 **AES-256-GCM**，使用商户的 APIv3 密钥作为解密密钥。

---

## 完整处理流程

推荐使用 `CallbackHandler.process()` 方法，它封装了 **验签 + 解密** 的完整流程：

```ts
import { CallbackHandler } from 'wxpay-nodejs-sdk';
import type { TransactionCallbackData, RefundCallbackData } from 'wxpay-nodejs-sdk';

const callbackHandler = new CallbackHandler(apiV3Key, certificates);

// ========== 处理支付成功回调 ==========
function handleTransactionCallback(headers, rawBody: string) {
  const callback = callbackHandler.processTransactionCallback(headers, rawBody);

  const { out_trade_no, transaction_id, trade_state } = callback.data;

  console.log(`收到支付回调: ${out_trade_no}, 状态: ${trade_state}`);

  // 在此处理业务逻辑...
  return callback.data;
}

// ========== 处理退款回调 ==========
function handleRefundCallback(headers, rawBody: string) {
  const callback = callbackHandler.processRefundCallback(headers, rawBody);

  const { out_refund_no, refund_status } = callback.data;

  console.log(`收到退款回调: ${out_refund_no}, 状态: ${refund_status}`);

  // 在此处理业务逻辑...
  return callback.data;
}
```

---

## Express 完整示例

以下是在 Express 框架中处理回调通知的完整示例：

```ts
import express from 'express';
import {
  WxPayClient,
  CallbackHandler,
  JsapiService,
} from 'wxpay-nodejs-sdk';
import fs from 'node:fs';

const app = express();

// ⚠️ 重要：回调接口需要使用 raw body，因为验签需要原始 JSON 字符串
// 单独为回调路由设置 raw body 解析
app.use('/api/wxpay/notify', express.raw({ type: 'application/json' }));
// 其他路由使用标准 JSON 解析
app.use(express.json());

// ========== 初始化 ==========
const wxpay = new WxPayClient({
  mchid: process.env.WXPAY_MCHID!,
  apiV3Key: process.env.WXPAY_API_V3_KEY!,
  serialNo: process.env.WXPAY_SERIAL_NO!,
  privateKey: fs.readFileSync(process.env.WXPAY_PRIVATE_KEY_PATH!),
  platformCertificates: [
    // 微信支付平台证书
    // 可通过微信支付商户平台 → API安全 → 平台证书管理 获取
  ],
});

const jsapi = new JsapiService(wxpay);
const callbackHandler = new CallbackHandler(
  process.env.WXPAY_API_V3_KEY!,
  wxpay.certificates,
);

// ========== 支付回调通知接口 ==========
app.post('/api/wxpay/notify', async (req, res) => {
  // 提取签名相关请求头
  const headers = {
    'wechatpay-signature': req.headers['wechatpay-signature'] as string,
    'wechatpay-timestamp': req.headers['wechatpay-timestamp'] as string,
    'wechatpay-nonce': req.headers['wechatpay-nonce'] as string,
    'wechatpay-serial': req.headers['wechatpay-serial'] as string,
  };

  // 原始请求体（Buffer → 字符串）
  const rawBody = req.body.toString('utf-8');

  try {
    // 一步完成：验签 + 解密
    const callback = callbackHandler.processTransactionCallback(headers, rawBody);

    const { out_trade_no, transaction_id, trade_state } = callback.data;

    console.log(`✅ 支付回调验证成功: ${out_trade_no}`);

    // ========== 业务处理 ==========
    if (trade_state === 'SUCCESS') {
      // 1. 幂等检查：防止重复处理
      const existingOrder = await getOrderByNo(out_trade_no);
      if (existingOrder && existingOrder.status === 'PAID') {
        console.log(`订单 ${out_trade_no} 已处理，跳过`);
        return res.status(200).json({ code: 'SUCCESS', message: '成功' });
      }

      // 2. 更新订单状态
      await updateOrderStatus(out_trade_no, 'PAID', transaction_id);

      // 3. 发放商品/权益
      await deliverGoods(out_trade_no);

      console.log(`✅ 订单处理完成: ${out_trade_no}`);
    }

    // ========== 返回成功应答 ==========
    // ⚠️ 必须返回 200 且包含 code: 'SUCCESS'，否则微信支付会重复通知
    res.status(200).json({ code: 'SUCCESS', message: '成功' });
  } catch (err) {
    console.error('❌ 回调处理失败:', err);

    // 返回失败应答，微信支付会稍后重试
    res.status(500).json({ code: 'FAIL', message: '失败' });
  }
});

// ========== 辅助函数（示例） ==========
async function getOrderByNo(outTradeNo: string) {
  // 从数据库查询订单
  return { status: 'PENDING' };
}

async function updateOrderStatus(
  outTradeNo: string,
  status: string,
  transactionId?: string,
) {
  // 更新数据库中的订单状态
  console.log(`更新订单: ${outTradeNo} → ${status}`);
}

async function deliverGoods(outTradeNo: string) {
  // 发放商品/权益
  console.log(`发放商品: ${outTradeNo}`);
}

app.listen(3000);
```

---

## 应答处理规范

商户收到回调通知后，必须按以下规范返回应答：

### 成功应答（不再重试）

```json
{
  "code": "SUCCESS",
  "message": "成功"
}
```

> HTTP 状态码必须为 **200** 或 **204**。

### 失败应答（会触发重试）

```json
{
  "code": "FAIL",
  "message": "失败"
}
```

> 任何非 200/204 的状态码或 code 不为 `SUCCESS` 的响应，都会触发微信支付的重复通知。

### 处理原则

| 原则 | 说明 |
|------|------|
| **先应答，后处理** | 验签解密成功后立即返回 200，再异步处理业务逻辑 |
| **重复通知处理** | 必须做幂等检查，同一订单只处理一次 |
| **异常返回 FAIL** | 验签失败或系统异常时返回 FAIL，触发微信重试 |
| **5 秒超时** | 微信支付通知的超时时间为 5 秒，请确保在此时间内返回应答 |

---

## 幂等处理

微信支付可能因为网络原因重复发送同一通知，商户必须实现幂等处理：

```ts
// 基于数据库唯一约束的幂等处理
async function handlePaymentCallback(callbackData: TransactionCallbackData) {
  const { out_trade_no, transaction_id } = callbackData;

  // 方案一：使用数据库唯一约束 + INSERT IGNORE / ON CONFLICT
  try {
    await db.execute(
      `INSERT INTO payment_records (out_trade_no, transaction_id, status, created_at)
       VALUES (?, ?, 'PAID', NOW())
       ON CONFLICT (out_trade_no) DO NOTHING`,
      [out_trade_no, transaction_id],
    );
  } catch {
    // 已存在则跳过
  }

  // 方案二：先查询再更新
  const order = await db.query(
    'SELECT status FROM orders WHERE out_trade_no = ?',
    [out_trade_no],
  );

  if (order && order.status === 'PAID') {
    console.log(`订单 ${out_trade_no} 已处理，跳过`);
    return;
  }

  await db.execute(
    'UPDATE orders SET status = ?, transaction_id = ?, paid_at = NOW() WHERE out_trade_no = ?',
    ['PAID', transaction_id, out_trade_no],
  );
}
```

---

## 常见回调类型

### 支付成功回调 (TRANSACTION.SUCCESS)

解密密文后的数据结构：

```ts
interface TransactionCallbackData {
  appid: string;            // 应用ID
  mchid: string;            // 商户号
  out_trade_no: string;     // 商户订单号
  transaction_id: string;   // 微信支付订单号
  trade_type: string;       // 交易类型
  trade_state: string;      // 交易状态
  trade_state_desc: string; // 交易状态描述
  bank_type: string;        // 付款银行
  attach?: string;          // 附加数据（下单时传入）
  success_time: string;     // 支付完成时间
  payer: { openid: string };
  amount: {
    total: number;
    payer_total: number;
    currency: string;
    payer_currency: string;
  };
}
```

### 退款成功回调 (REFUND.SUCCESS)

解密密文后的数据结构：

```ts
interface RefundCallbackData {
  mchid: string;              // 商户号
  out_trade_no: string;       // 商户订单号
  transaction_id: string;     // 微信支付订单号
  out_refund_no: string;      // 商户退款单号
  refund_id: string;          // 微信支付退款单号
  refund_status: string;      // 退款状态
  success_time?: string;      // 退款成功时间
  user_received_account: string; // 退款入账账户
  amount: {
    total: number;
    refund: number;
    payer_total: number;
    payer_refund: number;
  };
}
```

---

## 注意事项

| 事项 | 说明 |
|------|------|
| 🔐 **HTTPS 必须** | `notify_url` 必须为 HTTPS 地址 |
| 📝 **原始 Body** | 验签必须使用原始 JSON 字符串，不能使用框架解析后的对象 |
| ⏱️ **5 秒超时** | 回调处理逻辑必须在 5 秒内完成并返回应答 |
| 🔄 **幂等处理** | 同一通知可能重复发送，必须做幂等检查 |
| 📋 **日志记录** | 建议记录所有回调通知的原始请求，便于问题排查 |
| 🔑 **证书管理** | 平台证书有有效期，需定期更新，否则验签会失败 |
