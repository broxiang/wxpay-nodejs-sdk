# 常见问题（FAQ）

本文档汇总了微信支付 JSAPI 接入过程中最常见的疑问和解答。

---

## 目录

- [接入准备](#接入准备)
- [下单相关](#下单相关)
- [支付调起](#支付调起)
- [回调通知](#回调通知)
- [订单查询](#订单查询)
- [退款相关](#退款相关)
- [证书与安全](#证书与安全)
- [SDK 使用](#sdk-使用)
- [错误排查](#错误排查)

---

## 接入准备

### Q1: 接入微信支付需要哪些资料？

需要以下资料：

1. **商户号（mchid）**：在 [微信支付商户平台](https://pay.weixin.qq.com/) 注册获取
2. **AppID**：微信公众号或小程序的 AppID
3. **APIv3 密钥**：在商户平台 → API 安全 → APIv3 密钥 设置（32 位）
4. **商户证书**：在商户平台 → API 安全 → API 证书 申请并下载
5. **证书序列号**：下载证书后在证书管理页面可查看
6. **商户私钥**：申请证书时生成的 `apiclient_key.pem` 文件

> 💡 AppID 和商户号需要在商户平台进行绑定，否则会报 `APPID_MCHID_NOT_MATCH` 错误。

---

### Q2: JSAPI 支付和 Native 支付、小程序支付有什么区别？

| 支付方式 | 适用场景 | 调起方式 |
|---------|---------|---------|
| **JSAPI 支付** | 微信客户端内的网页 | `WeixinJSBridge.invoke()` |
| **小程序支付** | 微信小程序 | `wx.requestPayment()` |
| **Native 支付** | PC 端网页 | 扫码支付（二维码） |
| **H5 支付** | 非微信客户端的移动浏览器 | 唤起微信 App |
| **APP 支付** | 原生 App | 微信支付 SDK |

本 SDK 的 `JsapiService` 同时支持 JSAPI 支付和小程序支付（后端接口一致）。

---

### Q3: 如何配置 JSAPI 支付授权目录？

1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 进入「产品中心」→「开发配置」
3. 在「JSAPI 支付」中设置支付授权目录

**规则**：

- 最多可设置 5 个授权目录
- 必须以 `/` 结尾
- 必须为 HTTPS
- 如支付页面为 `https://example.com/pay/index.html`，授权目录应设置为 `https://example.com/pay/`

---

### Q4: 如何获取用户的 openid？

通过微信公众号 OAuth 2.0 授权流程获取：

1. 引导用户访问授权链接：
   ```
   https://open.weixin.qq.com/connect/oauth2/authorize?
     appid=APPID&
     redirect_uri=REDIRECT_URI&
     response_type=code&
     scope=snsapi_base&
     state=STATE#wechat_redirect
   ```

2. 用户授权后，微信会回调 `REDIRECT_URI` 并携带 `code` 参数

3. 使用 `code` 换取 `openid`：
   ```
   GET https://api.weixin.qq.com/sns/oauth2/access_token?
     appid=APPID&
     secret=APPSECRET&
     code=CODE&
     grant_type=authorization_code
   ```

> ⚠️ 注意：`scope=snsapi_base` 静默授权即可获取 openid，无需用户手动确认。

---

## 下单相关

### Q5: prepay_id 的有效期是多久？

`prepay_id` 有效期为 **2 小时**。超过 2 小时后，商户需使用原下单参数重新请求下单接口获取新的 `prepay_id`。

> 💡 建议：下单后立即调起支付，不要提前生成 prepay_id 存储备用。

---

### Q6: out_trade_no 有什么要求？

- 长度：6 ~ 32 个字符
- 字符集：数字、字母、`_`、`-`、`|`、`*`
- **必须在商户号下全局唯一**

推荐格式：`业务前缀 + 时间戳 + 随机数`

```ts
// 推荐做法
const outTradeNo = `ORDER${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
// 示例: ORDER1717939200123abc456
```

> ⚠️ 注意：已使用过的 `out_trade_no` 不能再次使用，否则会报 `OUT_TRADE_NO_USED` 错误。

---

### Q7: 金额单位是什么？

金额单位为**分**（cent），所有金额参数请传递整数。

| 人民币 | 参数值 |
|:---:|:---:|
| 0.01 元 | `1` |
| 1.00 元 | `100` |
| 99.99 元 | `9999` |

```ts
// 将元转换为分
const amountInCents = Math.round(amountInYuan * 100);
```

---

### Q8: notify_url 有什么要求？

- 必须为 **HTTPS** 地址
- 不能携带参数
- 域名必须已配置为 JSAPI 支付授权目录
- 必须为公网可访问的地址（不能是 localhost 或内网 IP）
- 建议使用 `POST` 方法接收

---

### Q9: time_expire 怎么设置？

`time_expire` 使用 RFC 3339 格式，建议设置为 15~30 分钟：

```ts
// 30 分钟后过期
const timeExpire = new Date(Date.now() + 30 * 60 * 1000).toISOString();
// 结果: "2024-06-09T10:30:00.000Z"
```

> ⚠️ 注意：`time_expire` 不能早于当前时间 1 分钟，不能晚于当前时间 15 天。设置过短可能导致用户来不及支付。

---

## 支付调起

### Q10: 调起支付时报"当前页面的 URL 未注册"？

原因：当前页面的 URL 不在 JSAPI 支付授权目录下。

解决：

1. 检查商户平台的支付授权目录配置
2. 确认当前页面 URL 在授权目录范围内
3. 授权目录配置后通常有几分钟的生效延迟

---

### Q11: 调起支付时报"缺少参数"？

检查传递给 `WeixinJSBridge.invoke()` 的参数是否完整：

```ts
{
  appId: '...',       // 必填
  timeStamp: '...',   // 必填，字符串类型
  nonceStr: '...',    // 必填
  package: '...',     // 必填，格式 prepay_id=xxx
  signType: '...',    // 必填
  paySign: '...',     // 必填
}
```

> 💡 使用 `buildJsapiBridgeConfig()` 方法自动生成，可避免参数遗漏或格式错误。

---

### Q12: paySign 签名错误怎么办？

常见原因：

1. **签名串格式错误**：签名串必须为 `appId\ntimeStamp\nnonceStr\nprepay_id=xxx\n`，注意每行以 `\n` 结尾
2. **私钥不匹配**：使用的私钥与商户证书不匹配
3. **参数类型错误**：`timeStamp` 必须是字符串，不能是数字

使用 SDK 的 `buildJsapiBridgeConfig()` 可以避免这些错误。

---

### Q13: 如何防止用户重复支付？

1. **前端防抖**：支付按钮在点击后立即禁用，设置 3 秒后才能再次点击
2. **后端唯一约束**：数据库 `out_trade_no` 字段设置唯一索引
3. **幂等处理**：收到重复的支付成功通知时，检查订单状态，已处理的直接返回成功

```ts
let isPaying = false;

async function handlePay() {
  if (isPaying) {
    showToast('正在处理中，请勿重复点击');
    return;
  }
  isPaying = true;
  try {
    // ... 支付流程
  } finally {
    setTimeout(() => { isPaying = false; }, 3000);
  }
}
```

---

## 回调通知

### Q14: 为什么收不到回调通知？

请逐一排查：

1. **notify_url 是否为 HTTPS**：必须是 HTTPS 地址
2. **notify_url 是否公网可达**：不能是 localhost 或内网地址
3. **接口是否正常返回**：必须返回 `{ "code": "SUCCESS" }`，HTTP 状态码 200
4. **防火墙/安全组**：是否开放了微信支付的 IP 段访问
5. **5 秒超时**：回调接口是否能在 5 秒内返回应答

> 💡 开发测试时，可使用内网穿透工具（如 ngrok）将本地服务暴露到公网。

---

### Q15: 为什么同一个通知收到多次？

这是正常的。微信支付的通知重试机制会在以下情况重发通知：

- 商户未在 5 秒内返回应答
- 商户返回了非 200 的状态码
- 商户返回的 JSON 中 `code` 不为 `SUCCESS`

**应对方案**：实现幂等处理，同一订单号只处理一次。

```ts
// 幂等处理示例
const order = await getOrder(outTradeNo);
if (order && order.status === 'PAID') {
  // 已处理，直接返回成功
  return res.json({ code: 'SUCCESS', message: '成功' });
}
// 处理订单...
```

---

### Q16: 回调签名验证失败？

常见原因：

1. **请求体不是原始 JSON 字符串**：Express 等框架会自动解析 JSON，需要使用 `express.raw()` 获取原始 body
2. **平台证书过期**：平台证书有效期为 1 年，需定期更新
3. **证书序列号不匹配**：请求头中的 `Wechatpay-Serial` 在本地证书列表中找不到

```ts
// 正确做法：回调路由使用 raw body
app.use('/api/wxpay/notify', express.raw({ type: 'application/json' }));
```

---

### Q17: 如何处理支付通知和前端回调的竞争？

推荐策略：

```
先到达者先处理，后者做幂等跳过
```

1. 前端收到 `WeixinJSBridge` 回调后，**立即** 调用查单接口确认
2. 后端查单时同步更新订单状态（带乐观锁或唯一约束）
3. 回调通知到达时，先检查订单状态，已处理则直接返回成功

```ts
// 数据库层面的幂等保证
await db.execute(
  `UPDATE orders SET status = 'PAID', paid_at = NOW()
   WHERE out_trade_no = ? AND status = 'PENDING'`,
  [outTradeNo]
);
// 如果 affected rows = 0，说明已被其他流程处理
```

---

## 订单查询

### Q18: 查单和回调通知，应该以哪个为准？

**以回调通知为准**，查单作为补充：

- 回调通知是微信支付系统的权威状态推送
- 查单用于：前端即时展示、未收到回调时的主动确认、问题排查

建议实现「双保险」策略：前端查单 + 后端回调，两者都支持幂等处理。

---

### Q19: 订单状态 NOTPAY 和 USERPAYING 的区别？

- `NOTPAY`：用户尚未发起支付，或支付流程尚未完成
- `USERPAYING`：用户正在支付中（极少出现，通常只在银行处理延迟时出现）

对商户来说，这两种状态都应视为"未支付成功"，继续等待。

---

## 退款相关

### Q20: 退款支持哪些订单？

- 仅支持 `trade_state = SUCCESS` 的订单
- 仅支持支付成功后 **1 年内** 的订单
- 退款金额不能超过原订单金额

---

### Q21: 退款多久到账？

| 退款方式 | 到账时间 |
|---------|---------|
| 原路退回（零钱） | 即时到账 |
| 原路退回（银行卡） | 0~3 个工作日 |

---

### Q22: 退款状态 PROCESSING 是什么意思？

`PROCESSING` 表示退款正在处理中，尚未完成。此时：

1. 不要重复发起退款
2. 等待退款结果回调通知（`REFUND.SUCCESS` 或 `REFUND.ABNORMAL`）
3. 也可以主动调用查询退款接口确认

---

### Q23: 支持部分退款吗？

支持。退款金额 `amount.refund` 可以小于原订单金额 `amount.total`。

```ts
await jsapi.createRefund({
  out_trade_no: 'ORDER123456',
  out_refund_no: 'REFUND123456',
  amount: {
    refund: 50,   // 退款 0.50 元
    total: 100,   // 原订单 1.00 元
    currency: 'CNY',
  },
});
```

---

## 证书与安全

### Q24: 商户私钥如何安全存储？

**禁止**将私钥硬编码在代码中或提交到代码仓库。

推荐做法：

```ts
// 方案一：环境变量（仅适用于密钥内容较短的情况）
const privateKey = process.env.WXPAY_PRIVATE_KEY;

// 方案二：文件存储（推荐）
const privateKey = fs.readFileSync('/etc/secrets/apiclient_key.pem');

// 方案三：密钥管理服务（生产环境推荐）
const privateKey = await secretsManager.getSecret('wxpay-private-key');
```

---

### Q25: 平台证书需要手动管理吗？

需要。微信支付平台证书用于验证回调通知签名，有效期为 5 年。

**获取方式**：

1. 登录微信支付商户平台
2. API 安全 → 平台证书管理
3. 下载平台证书并配置到 SDK

```ts
const wxpay = new WxPayClient({
  // ...
  platformCertificates: [
    {
      serialNo: 'PLATFORM_CERT_SERIAL_NO',
      effectiveTime: '2024-01-01T00:00:00+08:00',
      expireTime: '2025-01-01T00:00:00+08:00',
      encryptCertificate: {
        algorithm: 'AEAD_AES_256_GCM',
        nonce: '...',
        associatedData: '...',
        ciphertext: '...',
      },
    },
  ],
});
```

> ⚠️ 证书过期会导致回调验签失败，建议在证书到期前 30 天更新。

---

## SDK 使用

### Q26: SDK 支持 TypeScript 吗？

完全支持。SDK 使用 TypeScript 编写，提供完整的类型定义，无需额外安装 `@types/*` 包。

```ts
import type {
  CreateJsapiOrderRequest,
  CreateJsapiOrderResponse,
  QueryOrderResponse,
} from 'wxpay-nodejs-sdk';
```

---

### Q27: 可以在小程序中使用吗？

可以。小程序支付和 JSAPI 支付共用同一套后端接口（`JsapiService`），只是前端调起方式不同：

- **JSAPI**：`WeixinJSBridge.invoke('getBrandWCPayRequest', ...)`
- **小程序**：`wx.requestPayment(...)`

小程序调起支付的签名算法与 JSAPI 一致，可直接使用 `buildJsapiBridgeConfig()` 生成。

---

### Q28: 支持沙箱环境吗？

支持。初始化时设置 `sandbox: true` 即可：

```ts
const wxpay = new WxPayClient({
  // ...
  sandbox: true, // 使用沙箱环境
});
```

> 💡 沙箱环境仅用于测试，不会产生真实资金交易。

---

### Q29: 如何自定义请求超时时间？

```ts
const wxpay = new WxPayClient({
  // ...
  timeout: 10000, // 10 秒超时（默认 30 秒）
});
```

---

## 错误排查

### Q30: APPID_MCHID_NOT_MATCH 错误

**原因**：AppID 和商户号未绑定。

**解决**：登录微信支付商户平台 → 产品中心 → AppID 授权管理 → 绑定 AppID。

---

### Q31: SIGN_ERROR 错误

**原因**：签名验证失败，通常是私钥或证书配置不正确。

**排查步骤**：

1. 确认使用的私钥与商户证书序列号匹配
2. 确认私钥格式正确（PEM 格式，以 `-----BEGIN PRIVATE KEY-----` 开头）
3. 确认请求体序列化格式正确

---

### Q32: OUT_TRADE_NO_USED 错误

**原因**：商户订单号已使用过。

**解决**：每次下单使用不同的 `out_trade_no`，建议包含时间戳和随机数。

---

### Q33: PARAM_ERROR 错误

**原因**：请求参数不符合要求。

**常见原因**：

- `out_trade_no` 包含非法字符（只能使用数字、字母、`_`、`-`、`|`、`*`）
- `amount.total` 不是整数（单位是分，不能有小数）
- `notify_url` 不是 HTTPS 地址
- `openid` 格式不正确

---

### Q34: FREQUENCY_LIMITED 错误

**原因**：请求频率超过限制。

**解决**：

- 降低请求频率
- 实现请求重试机制（指数退避）
- 对于查单接口，不要使用轮询方式高频查询

---

### Q35: SYSTEM_ERROR 错误

**原因**：微信支付系统错误。

**解决**：使用相同参数重试，建议实现自动重试机制：

```ts
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof WxPayError && err.detail.code === 'SYSTEM_ERROR') {
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          continue;
        }
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 更多帮助

- [微信支付 V3 官方文档](https://pay.weixin.qq.com/doc/v3/merchant/4012791856)
- [微信支付技术社区](https://developers.weixin.qq.com/community/pay)
- [SDK 快速开始](./quickstart.md)
- [完整流程指南](./flow.md)
- [API 参考文档](./api-reference.md)
