# 完整流程指南

本文档以 **微信公众号网页支付（JSAPI）** 为例，介绍从下单到支付完成的完整流程。

> **前置阅读**：请先完成 [快速开始](./quickstart.md) 中的 SDK 安装和初始化。

---

## 流程概览

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  商户前端  │    │   商户后端     │    │  微信支付系统  │    │   微信客户端   │
└────┬─────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
     │                 │                   │                   │
     │ ① 用户点击支付   │                   │                   │
     │────────────────>│                   │                   │
     │                 │ ② JSAPI 下单       │                   │
     │                 │──────────────────>│                   │
     │                 │ ③ 返回 prepay_id  │                   │
     │                 │<──────────────────│                   │
     │ ④ 返回支付参数   │                   │                   │
     │<────────────────│                   │                   │
     │                 │                   │                   │
     │ ⑤ 调起微信收银台  │                   │                   │
     │─────────────────────────────────────────────────────────>│
     │                 │                   │                   │
     │ ⑥ 用户完成支付   │                   │                   │
     │<─────────────────────────────────────────────────────────│
     │                 │                   │                   │
     │ ⑦ 前端收到回调   │                   │                   │
     │────────────────>│                   │                   │
     │                 │ ⑧ 查询订单状态     │                   │
     │                 │──────────────────>│                   │
     │                 │ ⑨ 返回订单状态     │                   │
     │                 │<──────────────────│                   │
     │ ⑩ 展示支付结果   │                   │                   │
     │<────────────────│                   │                   │
     │                 │                   │                   │
     │                 │ ⑪ 支付成功回调通知  │                   │
     │                 │<──────────────────│                   │
```

---

## 第一步：商户下单

用户点击"立即支付"时，后端调用下单接口获取 `prepay_id`。

```ts
const { data } = await jsapi.createOrder({
  appid: 'wx1234567890abcdef',
  mchid: '1900000100',
  description: '测试商品',
  out_trade_no: `ORDER${Date.now()}`,
  notify_url: 'https://your-domain.com/api/wxpay/notify',
  amount: { total: 100, currency: 'CNY' },
  payer: { openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
  time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟后过期
});

console.log(data.prepay_id); // 预支付 ID，有效期 2 小时
```

**关键参数：**

| 参数 | 说明 |
|------|------|
| `out_trade_no` | 商户订单号，必须唯一（建议：业务前缀 + 时间戳 + 随机数） |
| `notify_url` | 回调地址，必须 HTTPS |
| `amount.total` | 金额，单位：分（100 = 1 元） |
| `payer.openid` | 用户 openid，通过 OAuth 获取 |
| `time_expire` | 订单过期时间，RFC 3339 格式 |

---

## 第二步：前端调起支付

后端生成签名参数，前端调用 `WeixinJSBridge.invoke()` 调起收银台。

### 后端：生成签名参数

```ts
import { buildJsapiBridgeConfig } from 'wxpay-nodejs-sdk';

const config = buildJsapiBridgeConfig(appId, prepayId, privateKey);
// 返回：appId, timeStamp, nonceStr, package, signType, paySign
```

### 前端：调起支付

```ts
WeixinJSBridge.invoke('getBrandWCPayRequest', {
  appId: '...',
  timeStamp: '...',
  nonceStr: '...',
  package: 'prepay_id=...',
  signType: 'RSA',
  paySign: '...',
}, (res) => {
  if (res.err_msg === 'get_brand_wcpay_request:ok') {
    // 用户侧支付成功，需查单确认最终状态
    checkPaymentStatus();
  } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
    // 用户取消
  } else {
    // 支付失败
  }
});
```

> **前端防抖**：支付按钮点击后立即禁用，防止重复支付。

---

## 第三步：支付结果处理

通过两种方式确认支付结果：

| 方式 | 触发时机 | 说明 |
|------|---------|------|
| 前端回调 + 查单 | 用户支付后立即 | 快速展示结果 |
| 回调通知 | 异步，数秒内 | 权威状态，用于更新订单 |

### 查单

```ts
const { data } = await jsapi.queryOrderById({ outTradeNo: 'ORDER123' });

switch (data.trade_state) {
  case 'SUCCESS':   // 支付成功
  case 'NOTPAY':    // 未支付
  case 'CLOSED':    // 已关闭
  case 'REFUND':    // 已退款
}
```

### 回调通知

详见 [回调通知处理](./callback.md)。

### 推荐策略

```
前端回调查单 + 后端回调通知 = 双保险
```

两者都需要支持幂等处理（同一订单重复通知不重复处理）。

---

## 第四步：关闭订单

未支付的订单可以关闭，关闭后不可恢复。

```ts
await jsapi.closeOrder('ORDER123', { mchid: '1900000100' });
```

**关单时机：**
- 用户超时未支付
- 用户主动取消
- 超过 7 天未支付（微信自动关单）

---

## 第五步：申请退款

支付成功后 1 年内可申请退款。

```ts
const { data } = await jsapi.createRefund({
  out_trade_no: 'ORDER123',
  out_refund_no: `REFUND${Date.now()}`,
  reason: '用户申请退款',
  amount: {
    refund: 100,    // 退款金额（分）
    total: 100,     // 原订单金额（分）
    currency: 'CNY',
  },
});

// 退款状态
switch (data.status) {
  case 'SUCCESS':     // 退款成功
  case 'PROCESSING':  // 处理中
  case 'ABNORMAL':    // 异常，需人工介入
}
```

---

## 第六步：下载对账单

### 交易账单

```ts
// 1. 申请账单
const { data } = await jsapi.tradeBill({
  bill_date: '2024-06-09',
  bill_type: 'ALL',  // ALL | SUCCESS | REFUND
});

// 2. 下载账单（download_url 有效期 5 分钟）
const bill = await jsapi.downloadBill(data.download_url);
```

### 资金账单

```ts
const { data } = await jsapi.fundFlowBill({
  bill_date: '2024-06-09',
  account_type: 'BASIC',  // BASIC | OPERATION | FEES
});
```

---

## 订单状态流转

```
                     ┌─────────────┐
                     │   NOTPAY    │  ← 下单成功，等待支付
                     └──┬──────┬───┘
                        │      │
           用户支付成功   │      │  关单
                        │      │
                 ┌──────┘      └──────┐
                 ▼                    ▼
          ┌─────────────┐     ┌─────────────┐
          │   SUCCESS   │     │   CLOSED    │  ← 终态
          └──────┬──────┘     └─────────────┘
                 │
       申请退款成功 │
                 │
                 ▼
          ┌─────────────┐
          │   REFUND    │  ← 终态
          └─────────────┘
```

| 状态 | 含义 | 终态 |
|------|------|:---:|
| `NOTPAY` | 未支付 | ❌ |
| `SUCCESS` | 支付成功 | ✅ |
| `CLOSED` | 已关闭 | ✅ |
| `REFUND` | 已退款 | ✅ |
| `USERPAYING` | 支付中 | ❌ |
| `PAYERROR` | 支付失败 | ❌ |

---

## 完整伪代码

```ts
import {
  WxPayClient,
  JsapiService,
  CallbackHandler,
  buildJsapiBridgeConfig,
} from 'wxpay-nodejs-sdk';
import fs from 'node:fs';

// 初始化
const wxpay = new WxPayClient({
  mchid: process.env.WXPAY_MCHID!,
  apiV3Key: process.env.WXPAY_API_V3_KEY!,
  serialNo: process.env.WXPAY_SERIAL_NO!,
  privateKey: fs.readFileSync(process.env.WXPAY_PRIVATE_KEY_PATH!),
});

const jsapi = new JsapiService(wxpay);
const callbackHandler = new CallbackHandler(
  process.env.WXPAY_API_V3_KEY!,
  wxpay.certificates,
);

// 1. 下单
const { data } = await jsapi.createOrder({ /* ... */ });
const prepayId = data.prepay_id;

// 2. 生成调起支付参数
const bridgeConfig = buildJsapiBridgeConfig(appId, prepayId, privateKey);

// 3. 查单
const order = await jsapi.queryOrderById({ outTradeNo: 'ORDER123' });

// 4. 关单
await jsapi.closeOrder('ORDER123', { mchid: '1900000100' });

// 5. 退款
const refund = await jsapi.createRefund({ /* ... */ });

// 6. 回调处理
const callback = callbackHandler.processTransactionCallback(headers, rawBody);
```
