# 快速开始

## 前置条件

- 商户号、AppID、APIv3 密钥、商户证书（[申请指南](https://pay.weixin.qq.com/doc/v3/merchant/4012062524)）
- Node.js >= 18.0.0

## 安装

```bash
npm install wxpay-nodejs-sdk
```

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

## 下单

```ts
const { data } = await jsapi.createOrder({
  appid: 'wx1234567890abcdef',
  mchid: '1900000100',
  description: '测试商品',
  out_trade_no: `ORDER${Date.now()}`,
  notify_url: 'https://your-domain.com/api/wxpay/notify',
  amount: { total: 100 },
  payer: { openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
});

console.log(data.prepay_id);
```

> 参数说明请参考 [微信支付官方文档 - JSAPI下单](https://pay.weixin.qq.com/doc/v3/merchant/4012062524)。

## 下一步

- [使用示例](./example.md) — 完整的前后端示例
- [回调通知](./callback.md) — 处理支付回调
- [微信支付官方文档](https://pay.weixin.qq.com/doc/v3/merchant/4012062524)
