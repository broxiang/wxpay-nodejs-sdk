# 使用示例

一个最简单的微信支付后端示例（Express + wxpay-nodejs-sdk）。

> 完整的前后端集成示例请参考 [微信支付官方文档](https://pay.weixin.qq.com/doc/v3/merchant/4012062524)。

## 后端代码

```ts
import express from 'express';
import {
  WxPayClient,
  JsapiService,
  CallbackHandler,
  buildJsapiBridgeConfig,
} from 'wxpay-nodejs-sdk';
import fs from 'node:fs';

const wxpay = new WxPayClient({
  mchid: process.env.WXPAY_MCHID!,
  apiV3Key: process.env.WXPAY_API_V3_KEY!,
  serialNo: process.env.WXPAY_SERIAL_NO!,
  privateKey: fs.readFileSync(process.env.WXPAY_PRIVATE_KEY_PATH!),
});

const jsapi = new JsapiService(wxpay);
const callbackHandler = new CallbackHandler(process.env.WXPAY_API_V3_KEY!, wxpay.certificates);
const privateKey = fs.readFileSync(process.env.WXPAY_PRIVATE_KEY_PATH!);

const app = express();
app.use('/api/wxpay/notify', express.raw({ type: 'application/json' }));
app.use(express.json());

// 下单
app.post('/api/pay/create-order', async (req, res) => {
  const { data } = await jsapi.createOrder({
    appid: process.env.WXPAY_APPID!,
    mchid: process.env.WXPAY_MCHID!,
    description: '商品描述',
    out_trade_no: `ORDER${Date.now()}`,
    notify_url: 'https://your-domain.com/api/wxpay/notify',
    amount: { total: req.body.amount || 100 },
    payer: { openid: req.body.openid },
  });
  res.json({ prepayId: data.prepay_id });
});

// 生成调起支付参数
app.post('/api/pay/bridge-config', (req, res) => {
  const config = buildJsapiBridgeConfig(process.env.WXPAY_APPID!, req.body.prepayId, privateKey);
  res.json(config);
});

// 支付回调
app.post('/api/wxpay/notify', (req, res) => {
  try {
    const headers = {
      'wechatpay-signature': req.headers['wechatpay-signature'] as string,
      'wechatpay-timestamp': req.headers['wechatpay-timestamp'] as string,
      'wechatpay-nonce': req.headers['wechatpay-nonce'] as string,
      'wechatpay-serial': req.headers['wechatpay-serial'] as string,
    };
    const callback = callbackHandler.processTransactionCallback(
      headers,
      req.body.toString('utf-8'),
    );
    // 处理业务逻辑...
    res.status(200).json({ code: 'SUCCESS', message: '成功' });
  } catch {
    res.status(500).json({ code: 'FAIL', message: '失败' });
  }
});

app.listen(3000);
```
