# wxpay-nodejs-sdk 文档

微信支付 Node.js SDK 官方文档，基于 APIv3 规范，提供完整的微信支付接入能力。

---

## 支持的支付方式

| 支付方式 | 适用场景 | Service 类 |
|---------|---------|-----------|
| JSAPI 支付 | 微信内网页支付 | `JsapiService` |
| 小程序支付 | 微信小程序 | `JsapiService` |
| APP 支付 | 原生 App | `AppService` |
| H5 支付 | 移动端浏览器 | `H5Service` |
| Native 支付 | 扫码支付（二维码） | `NativeService` |
| 合单支付 | 多订单合并支付 | `CombineService` |

---

## 文档导航

### 🚀 快速开始
- [快速开始](./quickstart.md) — 5 分钟上手，完成第一次支付

### 📖 开发指南
- [完整流程指南](./flow.md) — JSAPI 支付全流程详解（下单 → 调起支付 → 回调 → 退款）
- [回调通知处理](./callback.md) — 签名验证、数据解密、幂等处理

### 📚 API 参考
- [API 参考文档](./api-reference.md) — 所有 Service 类、工具函数、类型定义

### 💡 示例与问题
- [完整示例](./example.md) — 可直接运行的 HTML + Node.js 示例
- [常见问题](./faq.md) — 接入过程中的常见疑问

---

## 核心概念

### 服务类模式

SDK 采用服务类模式组织 API，每个服务类封装一个业务领域的接口：

```ts
import { WxPayClient, JsapiService } from 'wxpay-nodejs-sdk';

const wxpay = new WxPayClient({ /* 配置 */ });
const jsapi = new JsapiService(wxpay);

// 调用 API
const { data } = await jsapi.createOrder({ ... });
```

### 统一响应结构

所有 API 返回统一的 `WxPayResponse<T>` 结构：

```ts
interface WxPayResponse<T> {
  status: number;                  // HTTP 状态码
  headers: Record<string, string>; // 响应头
  data: T;                         // 业务数据
}
```

### 错误处理

API 调用失败时抛出 `WxPayError`：

```ts
try {
  await jsapi.createOrder({ ... });
} catch (err) {
  if (err instanceof WxPayError) {
    console.log(err.detail.code);    // 错误码
    console.log(err.detail.message); // 错误描述
  }
}
```

---

## 相关链接

- [微信支付商户平台](https://pay.weixin.qq.com/)
- [微信支付 APIv3 官方文档](https://pay.weixin.qq.com/doc/v3/merchant/4012791856)
- [GitHub 仓库](https://github.com/broxiang/wxpay-nodejs-sdk)
