# 回调通知处理

## 基本用法

```ts
import { CallbackHandler } from 'wxpay-nodejs-sdk';

const handler = new CallbackHandler(apiV3Key, wxpay.certificates);

// 支付成功回调
const callback = handler.processTransactionCallback(headers, rawBody);
console.log(callback.data.out_trade_no, callback.data.trade_state);

// 退款回调
const refund = handler.processRefundCallback(headers, rawBody);
console.log(refund.data.out_refund_no, refund.data.refund_status);
```

## Express 示例

```ts
app.use('/api/wxpay/notify', express.raw({ type: 'application/json' }));

app.post('/api/wxpay/notify', (req, res) => {
  try {
    const headers = {
      'wechatpay-signature': req.headers['wechatpay-signature'] as string,
      'wechatpay-timestamp': req.headers['wechatpay-timestamp'] as string,
      'wechatpay-nonce': req.headers['wechatpay-nonce'] as string,
      'wechatpay-serial': req.headers['wechatpay-serial'] as string,
    };
    const callback = handler.processTransactionCallback(headers, req.body.toString('utf-8'));

    // 处理业务逻辑（注意幂等）...

    res.status(200).json({ code: 'SUCCESS', message: '成功' });
  } catch {
    res.status(500).json({ code: 'FAIL', message: '失败' });
  }
});
```

> 回调通知必须在 5 秒内返回应答，否则微信支付会重复通知。详细说明请参考 [微信支付官方文档](https://pay.weixin.qq.com/doc/v3/merchant/4012062524)。
