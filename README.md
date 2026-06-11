# wxpay-nodejs-sdk

[![Coverage](https://img.shields.io/badge/coverage-94%25-brightgreen)](https://github.com/broxiang/wxpay-nodejs-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

微信支付 API V3 Node.js SDK，基于 TypeScript，提供类型安全的支付接口封装。

> **免责声明：本项目为社区开源项目，非微信支付官方 SDK。使用前请阅读 [微信支付官方文档](https://pay.weixin.qq.com/doc/v3/merchant/4012062524)。**

## 安装

```bash
npm install wxpay-nodejs-sdk
```

要求 Node.js >= 18.0.0。

## 快速开始

```typescript
import { WxPayClient, JsapiService, buildJsapiBridgeConfig } from 'wxpay-nodejs-sdk';
import fs from 'node:fs';

const client = new WxPayClient({
  mchid: '1900000100',
  apiV3Key: 'your-api-v3-key',
  serialNo: 'your-certificate-serial-number',
  privateKey: fs.readFileSync('/path/to/apiclient_key.pem'),
});

const jsapi = new JsapiService(client);

// 下单
const { data } = await jsapi.createOrder({
  appid: 'wx1234567890abcdef',
  mchid: '1900000100',
  description: '商品描述',
  out_trade_no: '订单号',
  amount: { total: 100 },
  payer: { openid: '用户openid' },
  notify_url: 'https://example.com/callback',
});

// 生成前端调起支付参数
const config = buildJsapiBridgeConfig('wx1234567890abcdef', data.prepay_id, privateKey);
```

## 回调通知

```typescript
import { CallbackHandler } from 'wxpay-nodejs-sdk';

const handler = new CallbackHandler(apiV3Key, wxpay.certificates);
const callback = handler.processTransactionCallback(headers, rawBody);
console.log(callback.data.out_trade_no, callback.data.trade_state);
```

## 支持的 API

| Service                                                                                                            | 说明                    |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| `JsapiService`                                                                                                     | JSAPI 支付 / 小程序支付 |
| `AppService`                                                                                                       | APP 支付                |
| `H5Service`                                                                                                        | H5 支付                 |
| `NativeService`                                                                                                    | Native 支付             |
| `CombineService` / `CombineH5Service` / `CombineAppService` / `CombineNativeService` / `CombineMiniProgramService` | 合单支付                |
| `ProfitSharingService`                                                                                             | 分账                    |
| `PayScoreService`                                                                                                  | 微信支付分              |
| `ParkingService`                                                                                                   | 停车服务                |
| `BillService`                                                                                                      | 账单下载                |
| `MerchantTransferService`                                                                                          | 商家转账                |
| `CouponService`                                                                                                    | 代金券                  |
| `ComplaintService`                                                                                                 | 消费者投诉              |
| `PartnershipService`                                                                                               | 委托营销                |
| `SmartGuideService`                                                                                                | 智慧导购                |
| `BusinessCircleService`                                                                                            | 商圈服务                |
| `PayGiftActivityService`                                                                                           | 支付有礼                |
| `MedInsService`                                                                                                    | 医保服务                |
| `MediaService`                                                                                                     | 文件上传                |
| `SecurityService`                                                                                                  | 安全服务                |
| `CallbackHandler`                                                                                                  | 回调通知验签与解密      |

> 各 Service 的方法和参数请参考 [微信支付官方文档](https://pay.weixin.qq.com/doc/v3/merchant/4012062524)，本 SDK 的方法名与官方 API 路径一一对应。

## 文档

- [快速入门](docs/quickstart.md)
- [使用示例](docs/example.md)
- [回调通知](docs/callback.md)
- **[微信支付官方文档](https://pay.weixin.qq.com/doc/v3/merchant/4012062524)**

## 免责声明

1. 本项目为**社区开源项目**，由开发者个人维护，**非微信支付官方 SDK**。
2. 本项目仅提供对微信支付 API 的封装，不保证接口的完整性、准确性和时效性。
3. 使用本 SDK 前，请务必阅读并遵守[微信支付官方文档](https://pay.weixin.qq.com/doc/v3/merchant/4012062524)中的规则和要求。
4. 因使用本 SDK 产生的任何损失，本项目及作者不承担任何责任。
5. 在生产环境使用前，请务必进行充分的测试验证。

## 许可证

MIT
