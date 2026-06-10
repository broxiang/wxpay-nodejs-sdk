# 快速开始

5 分钟完成第一次微信支付。

---

## 前置条件

| 准备项 | 说明 |
|--------|------|
| 商户号 | 在 [微信支付商户平台](https://pay.weixin.qq.com/) 注册 |
| AppID | 公众号或小程序的 AppID，需与商户号绑定 |
| APIv3 密钥 | 商户平台 → API 安全 → 设置 APIv3 密钥（32 位） |
| 商户证书 | 商户平台 → API 安全 → 申请并下载证书（含序列号和私钥） |
| Node.js | >= 18.0.0 |

> **安全提示**：妥善保管私钥和 APIv3 密钥，切勿泄露或提交到代码仓库。

---

## 安装

```bash
npm install wxpay-nodejs-sdk
```

---

## 初始化

```ts
import { WxPayClient, JsapiService } from 'wxpay-nodejs-sdk';
import fs from 'node:fs';

const wxpay = new WxPayClient({
  mchid: '1900000100',
  apiV3Key: 'your-32-char-api-v3-key',
  serialNo: 'YOUR_CERT_SERIAL_NO',
  privateKey: fs.readFileSync('/path/to/apiclient_key.pem'),
});

const jsapi = new JsapiService(wxpay);
```

**构造函数参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `mchid` | `string` | ✅ | 商户号 |
| `apiV3Key` | `string` | ✅ | APIv3 密钥（32 位） |
| `serialNo` | `string` | ✅ | 商户证书序列号 |
| `privateKey` | `string \| Buffer` | ✅ | 商户私钥（PEM 字符串、文件路径或 Buffer） |
| `platformCertificates` | `PlatformCertificate[]` | ❌ | 平台证书，用于回调验签 |
| `timeout` | `number` | ❌ | 请求超时（毫秒），默认 30000 |

---

## 下单示例

```ts
const { data } = await jsapi.createOrder({
  appid: 'wx1234567890abcdef',
  mchid: '1900000100',
  description: '测试商品',
  out_trade_no: `ORDER${Date.now()}`,
  notify_url: 'https://your-domain.com/api/wxpay/notify',
  amount: { total: 100, currency: 'CNY' },  // 100 分 = 1 元
  payer: { openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
});

console.log(data.prepay_id); // 预支付 ID，用于前端调起支付
```

---

## 下一步

- [完整流程指南](./flow.md) — 调起支付、回调通知、退款等完整流程
- [回调通知处理](./callback.md) — 如何接收和处理支付回调
- [完整示例](./example.md) — 可直接运行的 HTML + Node.js 示例
- [常见问题](./faq.md) — 接入过程中的常见疑问
