# wxpay-nodejs-sdk

微信支付 API V3 Node.js SDK，提供类型安全的支付接口封装，支持所有常用支付和分账接口。

## 特性

- 🚀 **完整的 TypeScript 支持** — 类型定义完善，开发体验友好
- 🔐 **安全可靠** — 内置签名验证、回调通知验签与解密
- 📦 **开箱即用** — 封装所有常用微信支付 API
- 🎯 **统一的接口风格** — 每个 Service 对应一类业务，易于使用

## 环境要求

- Node.js >= 18.0.0

## 安装

```bash
npm install wxpay-nodejs-sdk
```

## 快速开始

```typescript
import { WxPayClient, JsapiService } from 'wxpay-nodejs-sdk';
import fs from 'node:fs';

// 1. 初始化客户端
const client = new WxPayClient({
  mchid: '1900000100',
  apiV3Key: 'your-api-v3-key',
  serialNo: 'your-certificate-serial-number',
  privateKey: fs.readFileSync('/path/to/apiclient_key.pem'),
});

// 2. 创建 JSAPI 支付订单
const jsapi = new JsapiService(client);
const order = await jsapi.createOrder({
  appid: 'wx1234567890abcdef',
  description: '商品描述',
  out_trade_no: '订单号',
  amount: { total: 100, currency: 'CNY' },
  payer: { openid: '用户openid' },
  notify_url: 'https://example.com/callback',
});

console.log(order.data.prepay_id); // 用于前端调起支付
```

## 支持的 API

| Service | 说明 |
|---------|------|
| `JsapiService` | JSAPI 支付 / 小程序支付 |
| `AppService` | APP 支付 |
| `H5Service` | H5 支付 |
| `NativeService` | Native 支付 |
| `CombineService` | 合单支付（JSAPI/H5/APP/Native/小程序） |
| `ProfitSharingService` | 分账 |
| `PayScoreService` | 微信支付分 |
| `ParkingService` | 微信支付分停车服务 |
| `BillService` | 账单下载 |
| `MerchantTransferService` | 商家转账 |
| `CouponService` | 代金券 |
| `ComplaintService` | 消费者投诉 |
| `PartnershipService` | 委托营销 |
| `SmartGuideService` | 智慧导购 |
| `BusinessCircleService` | 商圈服务 |
| `PayGiftActivityService` | 支付有礼 |
| `MedInsService` | 医保服务 |
| `MediaService` | 文件上传 |
| `SecurityService` | 安全服务 |
| `CallbackHandler` | 回调通知验签与解密 |

## 回调通知处理

```typescript
import { CallbackHandler } from 'wxpay-nodejs-sdk';

const handler = new CallbackHandler(apiV3Key, wxpay.certificates);

// 支付成功通知
const payment = handler.processTransactionCallback(headers, body);

// 退款通知
const refund = handler.processRefundCallback(headers, body);

// 分账通知
const profitSharing = handler.processProfitSharingCallback(headers, body);
```

## 错误处理

```typescript
import { WxPayError } from 'wxpay-nodejs-sdk';

try {
  const order = await jsapi.createOrder({ ... });
} catch (error) {
  if (error instanceof WxPayError) {
    console.error(`[${error.detail.code}] ${error.detail.message}`);
    console.error(`HTTP ${error.status}`);
  }
}
```

## 文档

- [快速入门](docs/quickstart.md) — 详细的接入指南
- [API 参考](docs/api-reference.md) — 完整的接口文档
- [使用示例](docs/example.md) — 各类场景的代码示例
- [回调通知](docs/callback.md) — 回调处理详解
- [支付流程](docs/flow.md) — 支付流程说明
- [常见问题](docs/faq.md) — FAQ

## 许可证

MIT
