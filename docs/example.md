# 完整示例：微信公众号网页支付

本文档提供一个 **可直接运行的完整示例**，演示从用户点击支付到订单处理的全流程。

示例包含两部分：

- **Node.js 后端服务**（使用 Express + wxpay-nodejs-sdk）
- **HTML 前端页面**（在微信客户端内打开的支付页面）

---

## 目录

- [示例架构](#示例架构)
- [前置准备](#前置准备)
- [Node.js 后端代码](#nodejs-后端代码)
- [HTML 前端页面](#html-前端页面)
- [运行示例](#运行示例)
- [效果展示](#效果展示)

---

## 示例架构

```
┌─────────────────────────────────────────────────────┐
│                    微信客户端                         │
│  ┌───────────────────────────────────────────────┐  │
│  │          HTML 支付页面 (pay.html)              │  │
│  │                                               │  │
│  │  [商品展示] → [点击支付] → [调起微信收银台]    │  │
│  └────────────────────┬──────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────┐
│               商户服务器 (Node.js)                    │
│                                                     │
│  POST /api/pay/create-order    下单获取 prepay_id   │
│  POST /api/pay/bridge-config   生成调起支付参数      │
│  POST /api/pay/query-order     查询订单状态         │
│  POST /api/wxpay/notify        接收支付回调通知      │
│  GET  /pay.html                支付页面             │
└─────────────────────────────────────────────────────┘
```

---

## 前置准备

运行示例前，请确保：

1. 已获取商户号、APIv3 密钥、商户证书序列号和私钥
2. 已配置 JSAPI 支付授权目录为 `https://your-domain.com/`
3. 已安装依赖：`npm install wxpay-nodejs-sdk express`

---

## Node.js 后端代码

创建文件 `server.js`：

```ts
// server.js — 微信公众号网页支付完整后端示例
import express from 'express';
import {
  WxPayClient,
  JsapiService,
  CallbackHandler,
  buildJsapiBridgeConfig,
  WxPayError,
} from 'wxpay-nodejs-sdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置项（请替换为您的真实参数）
// ============================================================
const CONFIG = {
  mchid: '1900000100',                              // 商户号
  appId: 'wx1234567890abcdef',                      // 公众号 AppID
  apiV3Key: process.env.WXPAY_API_V3_KEY || '',     // APIv3 密钥
  serialNo: process.env.WXPAY_SERIAL_NO || '',      // 商户证书序列号
  privateKeyPath: process.env.WXPAY_PRIVATE_KEY_PATH || '/path/to/apiclient_key.pem',
  notifyUrl: 'https://your-domain.com/api/wxpay/notify', // 回调地址（必须 HTTPS）
};

// ============================================================
// 初始化 SDK
// ============================================================
const wxpay = new WxPayClient({
  mchid: CONFIG.mchid,
  apiV3Key: CONFIG.apiV3Key,
  serialNo: CONFIG.serialNo,
  privateKey: fs.readFileSync(CONFIG.privateKeyPath),
  // platformCertificates: [], // 填入您的平台证书（用于回调验签）
});

const jsapi = new JsapiService(wxpay);
const callbackHandler = new CallbackHandler(CONFIG.apiV3Key, wxpay.certificates);
const privateKey = fs.readFileSync(CONFIG.privateKeyPath);

// ============================================================
// 内存模拟数据库（生产环境请替换为真实数据库）
// ============================================================
const orders = new Map<string, {
  outTradeNo: string;
  amount: number;
  description: string;
  status: 'PENDING' | 'PAID' | 'CLOSED' | 'REFUNDED';
  transactionId?: string;
  createTime: string;
  paidTime?: string;
}>();

// ============================================================
// Express 应用
// ============================================================
const app = express();

// 回调接口需要原始 body，单独设置
app.use('/api/wxpay/notify', express.raw({ type: 'application/json' }));
// 其他接口使用 JSON 解析
app.use(express.json());
// 静态文件（前端页面）
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// 1. 下单接口
// ============================================================
app.post('/api/pay/create-order', async (req, res) => {
  try {
    const { openid, amount, description } = req.body;

    // 生成唯一商户订单号
    const outTradeNo = `ORDER${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

    // 调用微信支付下单
    const result = await jsapi.createOrder({
      appid: CONFIG.appId,
      mchid: CONFIG.mchid,
      description: description || '微信支付示例订单',
      out_trade_no: outTradeNo,
      notify_url: CONFIG.notifyUrl,
      amount: {
        total: amount || 1,  // 单位：分，默认 1 分
        currency: 'CNY',
      },
      payer: {
        openid: openid,
      },
      // 30 分钟后过期
      time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      // 附加数据，回调时原样返回
      attach: JSON.stringify({ source: 'demo' }),
      scene_info: {
        payer_client_ip: req.ip || '127.0.0.1',
      },
    });

    const prepayId = result.data.prepay_id;

    // 保存订单到数据库
    orders.set(outTradeNo, {
      outTradeNo,
      amount: amount || 1,
      description: description || '微信支付示例订单',
      status: 'PENDING',
      createTime: new Date().toISOString(),
    });

    console.log(`✅ 下单成功: ${outTradeNo}, prepay_id: ${prepayId}`);

    // 返回 prepay_id 给前端
    res.json({
      success: true,
      outTradeNo,
      prepayId,
    });
  } catch (err) {
    console.error('下单失败:', err);
    const message = err instanceof WxPayError
      ? `[${err.detail.code}] ${err.detail.message}`
      : '下单失败';
    res.status(500).json({ success: false, error: message });
  }
});

// ============================================================
// 2. 获取调起支付参数（前端用）
// ============================================================
app.post('/api/pay/bridge-config', (req, res) => {
  try {
    const { prepayId } = req.body;

    // 生成 WeixinJSBridge.invoke 所需参数
    const config = buildJsapiBridgeConfig(CONFIG.appId, prepayId, privateKey);

    res.json({
      success: true,
      appId: config.appId,
      timeStamp: config.timeStamp,
      nonceStr: config.nonceStr,
      package: config.package,
      signType: config.signType,
      paySign: config.paySign,
    });
  } catch (err) {
    console.error('生成支付参数失败:', err);
    res.status(500).json({ success: false, error: '生成支付参数失败' });
  }
});

// ============================================================
// 3. 查询订单状态
// ============================================================
app.post('/api/pay/query-order', async (req, res) => {
  try {
    const { outTradeNo } = req.body;

    const result = await jsapi.queryOrderById({ outTradeNo });
    const order = result.data;

    // 同步更新本地订单状态
    const localOrder = orders.get(outTradeNo);
    if (localOrder && order.trade_state === 'SUCCESS') {
      localOrder.status = 'PAID';
      localOrder.transactionId = order.transaction_id;
      localOrder.paidTime = order.success_time;
    }

    res.json({
      success: true,
      tradeState: order.trade_state,
      tradeStateDesc: order.trade_state_desc,
      transactionId: order.transaction_id,
      amount: order.amount,
      payer: order.payer,
      successTime: order.success_time,
    });
  } catch (err) {
    console.error('查单失败:', err);
    res.status(500).json({ success: false, error: '查单失败' });
  }
});

// ============================================================
// 4. 关闭订单
// ============================================================
app.post('/api/pay/close-order', async (req, res) => {
  try {
    const { outTradeNo } = req.body;

    await jsapi.closeOrder(outTradeNo, { mchid: CONFIG.mchid });

    // 更新本地订单状态
    const order = orders.get(outTradeNo);
    if (order) {
      order.status = 'CLOSED';
    }

    console.log(`✅ 订单已关闭: ${outTradeNo}`);
    res.json({ success: true, message: '订单已关闭' });
  } catch (err) {
    console.error('关单失败:', err);
    res.status(500).json({ success: false, error: '关单失败' });
  }
});

// ============================================================
// 5. 支付回调通知接口
// ============================================================
app.post('/api/wxpay/notify', async (req, res) => {
  const headers = {
    'wechatpay-signature': req.headers['wechatpay-signature'] as string,
    'wechatpay-timestamp': req.headers['wechatpay-timestamp'] as string,
    'wechatpay-nonce': req.headers['wechatpay-nonce'] as string,
    'wechatpay-serial': req.headers['wechatpay-serial'] as string,
  };

  const rawBody = req.body.toString('utf-8');

  try {
    // 验签 + 解密
    const callback = callbackHandler.processTransactionCallback(headers, rawBody);
    const { out_trade_no, transaction_id, trade_state } = callback.data;

    console.log(`📩 收到支付回调: ${out_trade_no}, 状态: ${trade_state}`);

    if (trade_state === 'SUCCESS') {
      // 幂等检查
      const order = orders.get(out_trade_no);
      if (order && order.status === 'PAID') {
        console.log(`订单 ${out_trade_no} 已处理，跳过`);
        return res.status(200).json({ code: 'SUCCESS', message: '成功' });
      }

      // 更新订单状态
      if (order) {
        order.status = 'PAID';
        order.transactionId = transaction_id;
        order.paidTime = callback.data.success_time;
      } else {
        // 如果本地没有该订单记录，也记录一条
        orders.set(out_trade_no, {
          outTradeNo: out_trade_no,
          amount: callback.data.amount?.total || 0,
          description: '回调通知订单',
          status: 'PAID',
          transactionId: transaction_id,
          createTime: callback.data.success_time,
          paidTime: callback.data.success_time,
        });
      }

      console.log(`✅ 订单处理完成: ${out_trade_no}`);
    }

    // 返回成功应答
    res.status(200).json({ code: 'SUCCESS', message: '成功' });
  } catch (err) {
    console.error('❌ 回调处理失败:', err);
    res.status(500).json({ code: 'FAIL', message: '失败' });
  }
});

// ============================================================
// 6. 订单列表接口（展示用）
// ============================================================
app.get('/api/pay/orders', (_req, res) => {
  const list = Array.from(orders.values())
    .sort((a, b) => b.createTime.localeCompare(a.createTime));

  res.json({ success: true, orders: list });
});

// ============================================================
// 启动服务
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   🚀 微信支付示例服务已启动                        ║
║                                                  ║
║   支付页面:  http://localhost:${PORT}/pay.html      ║
║   订单列表:  http://localhost:${PORT}/api/pay/orders ║
║                                                  ║
║   ⚠️  生产环境请使用 HTTPS 并配置真实参数          ║
╚══════════════════════════════════════════════════╝
  `);
});
```

---

## HTML 前端页面

创建文件 `public/pay.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>微信支付示例</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
        'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 420px;
    }

    /* 页面标题 */
    .header {
      text-align: center;
      padding: 30px 0 20px;
    }

    .header h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 8px;
    }

    .header p {
      font-size: 14px;
      color: #999;
    }

    /* 商品卡片 */
    .product-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .product-card .product-name {
      font-size: 18px;
      color: #333;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .product-card .product-desc {
      font-size: 14px;
      color: #999;
      margin-bottom: 16px;
      line-height: 1.6;
    }

    .product-card .product-price {
      display: flex;
      align-items: baseline;
      justify-content: flex-end;
      border-top: 1px solid #f0f0f0;
      padding-top: 16px;
    }

    .product-card .price-symbol {
      font-size: 16px;
      color: #ee0a24;
      font-weight: 600;
    }

    .product-card .price-value {
      font-size: 32px;
      color: #ee0a24;
      font-weight: 700;
      margin: 0 2px;
    }

    /* 金额选择器 */
    .amount-selector {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .amount-selector .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
    }

    .amount-options {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .amount-btn {
      flex: 1;
      min-width: 60px;
      padding: 10px 0;
      border: 1.5px solid #e5e5e5;
      border-radius: 8px;
      background: #fff;
      font-size: 16px;
      color: #333;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .amount-btn.active {
      border-color: #07c160;
      background: #f0faf3;
      color: #07c160;
      font-weight: 600;
    }

    /* 自定义金额输入 */
    .custom-amount {
      display: flex;
      align-items: center;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }

    .custom-amount span {
      font-size: 14px;
      color: #666;
      margin-right: 8px;
      white-space: nowrap;
    }

    .custom-amount input {
      flex: 1;
      padding: 8px 12px;
      border: 1.5px solid #e5e5e5;
      border-radius: 8px;
      font-size: 16px;
      outline: none;
      transition: border-color 0.2s;
    }

    .custom-amount input:focus {
      border-color: #07c160;
    }

    .custom-amount .unit {
      font-size: 14px;
      color: #999;
      margin-left: 8px;
    }

    /* 支付按钮 */
    .pay-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #07c160, #06ad56);
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
      position: relative;
      overflow: hidden;
    }

    .pay-btn:active {
      transform: scale(0.98);
      opacity: 0.9;
    }

    .pay-btn:disabled {
      background: #ccc;
      box-shadow: none;
      cursor: not-allowed;
    }

    .pay-btn .loading-spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* 提示信息 */
    .toast {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .toast.info {
      background: #323233;
      color: #fff;
    }

    .toast.success {
      background: #07c160;
      color: #fff;
    }

    .toast.error {
      background: #ee0a24;
      color: #fff;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    /* 订单记录 */
    .order-list {
      background: #fff;
      border-radius: 12px;
      margin-top: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .order-list .title {
      padding: 16px 20px;
      font-size: 16px;
      font-weight: 600;
      color: #333;
      border-bottom: 1px solid #f0f0f0;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-bottom: 1px solid #f5f5f5;
    }

    .order-item:last-child {
      border-bottom: none;
    }

    .order-item .order-info {
      flex: 1;
      min-width: 0;
    }

    .order-item .order-no {
      font-size: 13px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .order-item .order-time {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }

    .order-item .order-status {
      font-size: 13px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .status-PENDING {
      background: #fff7e6;
      color: #fa8c16;
    }

    .status-PAID {
      background: #f0faf3;
      color: #07c160;
    }

    .status-CLOSED {
      background: #f5f5f5;
      color: #999;
    }

    .status-REFUNDED {
      background: #e6f7ff;
      color: #1890ff;
    }

    .empty-orders {
      text-align: center;
      padding: 40px 20px;
      color: #999;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 页面标题 -->
    <div class="header">
      <h1>🛒 微信支付示例</h1>
      <p>微信公众号网页支付演示</p>
    </div>

    <!-- 商品信息 -->
    <div class="product-card">
      <div class="product-name">示例商品</div>
      <div class="product-desc">
        这是一个微信支付 JSAPI 支付的完整演示。请在微信客户端中打开此页面，点击下方按钮即可体验完整的支付流程。
      </div>
      <div class="product-price">
        <span class="price-symbol">¥</span>
        <span class="price-value" id="displayPrice">0.01</span>
      </div>
    </div>

    <!-- 金额选择 -->
    <div class="amount-selector">
      <div class="label">选择支付金额（单位：元）</div>
      <div class="amount-options">
        <button class="amount-btn active" data-amount="1" onclick="selectAmount(1, this)">0.01</button>
        <button class="amount-btn" data-amount="10" onclick="selectAmount(10, this)">0.10</button>
        <button class="amount-btn" data-amount="100" onclick="selectAmount(100, this)">1.00</button>
        <button class="amount-btn" data-amount="1000" onclick="selectAmount(1000, this)">10.00</button>
      </div>
      <div class="custom-amount">
        <span>自定义：</span>
        <input type="number" id="customAmount" placeholder="输入金额" step="0.01" min="0.01" />
        <span class="unit">元</span>
      </div>
    </div>

    <!-- 支付按钮 -->
    <button class="pay-btn" id="payBtn" onclick="handlePay()">
      立即支付
    </button>

    <!-- 订单记录 -->
    <div class="order-list">
      <div class="title">📋 订单记录</div>
      <div id="orderList">
        <div class="empty-orders">暂无订单记录</div>
      </div>
    </div>
  </div>

  <!-- Toast 提示 -->
  <div id="toast" style="display:none"></div>

  <script>
    // ============================================================
    // 状态管理
    // ============================================================
    let selectedAmount = 1; // 单位：分，默认 0.01 元
    let isPaying = false; // 防重复点击

    // ============================================================
    // 金额选择
    // ============================================================
    function selectAmount(amountInCents, btn) {
      selectedAmount = amountInCents;

      // 更新按钮状态
      document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 清除自定义输入
      document.getElementById('customAmount').value = '';

      // 更新显示
      updateDisplayPrice();
    }

    // 自定义金额输入
    document.getElementById('customAmount').addEventListener('input', function () {
      const value = parseFloat(this.value);
      if (value > 0) {
        selectedAmount = Math.round(value * 100); // 转换为分
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
        updateDisplayPrice();
      }
    });

    function updateDisplayPrice() {
      document.getElementById('displayPrice').textContent = (selectedAmount / 100).toFixed(2);
    }

    // ============================================================
    // Toast 提示
    // ============================================================
    function showToast(message, type) {
      type = type || 'info';
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = 'toast ' + type;
      toast.style.display = 'block';

      clearTimeout(toast._timeout);
      toast._timeout = setTimeout(function () {
        toast.style.display = 'none';
      }, 2500);
    }

    // ============================================================
    // 支付处理
    // ============================================================
    async function handlePay() {
      // 防重复点击
      if (isPaying) {
        showToast('正在处理中，请勿重复点击', 'info');
        return;
      }

      isPaying = true;
      const payBtn = document.getElementById('payBtn');

      try {
        // 显示加载状态
        payBtn.disabled = true;
        payBtn.innerHTML = '<span class="loading-spinner"></span>正在下单...';

        // ============================================================
        // 第一步：调用后端下单接口
        // ============================================================
        const openid = getOpenid(); // 从 URL 或 Cookie 获取 openid
        if (!openid) {
          showToast('请先通过微信 OAuth 授权获取 openid', 'error');
          return;
        }

        const createRes = await fetch('/api/pay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openid: openid,
            amount: selectedAmount,
            description: '微信支付示例订单',
          }),
        });

        const createData = await createRes.json();

        if (!createData.success) {
          throw new Error(createData.error || '下单失败');
        }

        console.log('下单成功:', createData.outTradeNo, createData.prepayId);

        // ============================================================
        // 第二步：获取调起支付参数
        // ============================================================
        payBtn.innerHTML = '<span class="loading-spinner"></span>准备支付...';

        const bridgeRes = await fetch('/api/pay/bridge-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prepayId: createData.prepayId }),
        });

        const bridgeData = await bridgeRes.json();

        if (!bridgeData.success) {
          throw new Error(bridgeData.error || '获取支付参数失败');
        }

        // ============================================================
        // 第三步：调起微信支付
        // ============================================================
        payBtn.innerHTML = '<span class="loading-spinner"></span>等待支付...';

        invokeWechatPay({
          appId: bridgeData.appId,
          timeStamp: bridgeData.timeStamp,
          nonceStr: bridgeData.nonceStr,
          package: bridgeData.package,
          signType: bridgeData.signType,
          paySign: bridgeData.paySign,
        }, createData.outTradeNo);

      } catch (err) {
        console.error('支付流程出错:', err);
        showToast(err.message || '支付失败，请重试', 'error');
      } finally {
        // 延迟恢复按钮状态
        setTimeout(function () {
          isPaying = false;
          payBtn.disabled = false;
          payBtn.innerHTML = '立即支付';
        }, 3000);
      }
    }

    // ============================================================
    // 调起微信支付
    // ============================================================
    function invokeWechatPay(params, outTradeNo) {
      function onBridgeReady() {
        WeixinJSBridge.invoke('getBrandWCPayRequest', params, function (res) {
          console.log('WeixinJSBridge 回调:', res.err_msg);

          if (res.err_msg === 'get_brand_wcpay_request:ok') {
            // 用户侧支付成功
            showToast('支付成功！正在确认订单状态...', 'success');

            // 查询订单最终状态
            setTimeout(function () {
              queryOrderStatus(outTradeNo);
            }, 1000);

          } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
            showToast('您已取消支付', 'info');
            refreshOrderList();

          } else {
            showToast('支付失败: ' + res.err_msg, 'error');
            refreshOrderList();
          }
        });
      }

      if (typeof WeixinJSBridge === 'undefined') {
        // 微信 JSAPI 未加载完成，监听事件
        if (document.addEventListener) {
          document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
        } else if ((document as any).attachEvent) {
          (document as any).attachEvent('WeixinJSBridgeReady', onBridgeReady);
          (document as any).attachEvent('onWeixinJSBridgeReady', onBridgeReady);
        }
      } else {
        onBridgeReady();
      }
    }

    // ============================================================
    // 查询订单状态
    // ============================================================
    async function queryOrderStatus(outTradeNo) {
      try {
        const res = await fetch('/api/pay/query-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outTradeNo }),
        });

        const data = await res.json();

        if (data.success) {
          if (data.tradeState === 'SUCCESS') {
            showToast('✅ 支付成功！订单号: ' + outTradeNo, 'success');
          } else if (data.tradeState === 'NOTPAY') {
            showToast('订单未支付，请继续完成支付', 'info');
          } else if (data.tradeState === 'CLOSED') {
            showToast('订单已关闭', 'error');
          } else {
            showToast('订单状态: ' + data.tradeStateDesc, 'info');
          }
        }

        refreshOrderList();
      } catch (err) {
        console.error('查询订单失败:', err);
        refreshOrderList();
      }
    }

    // ============================================================
    // 刷新订单列表
    // ============================================================
    async function refreshOrderList() {
      try {
        const res = await fetch('/api/pay/orders');
        const data = await res.json();

        const listEl = document.getElementById('orderList');

        if (!data.orders || data.orders.length === 0) {
          listEl.innerHTML = '<div class="empty-orders">暂无订单记录</div>';
          return;
        }

        listEl.innerHTML = data.orders.map(function (order) {
          const statusText = {
            PENDING: '待支付',
            PAID: '已支付',
            CLOSED: '已关闭',
            REFUNDED: '已退款',
          }[order.status] || order.status;

          return '<div class="order-item">'
            + '<div class="order-info">'
            + '<div class="order-no">' + order.outTradeNo + '</div>'
            + '<div class="order-time">' + formatTime(order.createTime) + '</div>'
            + '</div>'
            + '<span class="order-status status-' + order.status + '">'
            + statusText
            + '</span>'
            + '</div>';
        }).join('');
      } catch (err) {
        console.error('获取订单列表失败:', err);
      }
    }

    // ============================================================
    // 工具函数
    // ============================================================
    function getOpenid() {
      // 从 URL 参数中获取 openid
      // 生产环境中，openid 应通过微信公众号 OAuth 授权获取
      var params = new URLSearchParams(window.location.search);
      return params.get('openid') || 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o';
    }

    function formatTime(isoString) {
      if (!isoString) return '';
      var d = new Date(isoString);
      var pad = function (n) { return n < 10 ? '0' + n : String(n); };
      return d.getFullYear() + '-'
        + pad(d.getMonth() + 1) + '-'
        + pad(d.getDate()) + ' '
        + pad(d.getHours()) + ':'
        + pad(d.getMinutes()) + ':'
        + pad(d.getSeconds());
    }

    // ============================================================
    // 页面初始化
    // ============================================================
    (function init() {
      // 检测是否在微信客户端中
      var ua = navigator.userAgent.toLowerCase();
      var isWechat = ua.indexOf('micromessenger') !== -1;

      if (!isWechat) {
        showToast('⚠️ 请在微信客户端中打开此页面', 'info');
      }

      // 加载订单列表
      refreshOrderList();

      // 定时刷新订单列表
      setInterval(refreshOrderList, 10000);
    })();
  </script>
</body>
</html>
```

---

## 运行示例

### 1. 项目结构

```
wxpay-demo/
├── server.js           # Node.js 后端服务
├── public/
│   └── pay.html        # 前端支付页面
├── package.json
└── apiclient_key.pem   # 商户私钥文件
```

### 2. 安装依赖

```bash
npm install wxpay-nodejs-sdk express
```

### 3. 配置参数

修改 `server.js` 中的配置项为您的真实参数：

```ts
const CONFIG = {
  mchid: '1900000100',        // 替换为您的商户号
  appId: 'wx1234567890abcdef', // 替换为您的公众号 AppID
  apiV3Key: 'your-api-v3-key', // 替换为您的 APIv3 密钥
  serialNo: 'YOUR_SERIAL_NO',  // 替换为您的证书序列号
  privateKeyPath: '/path/to/apiclient_key.pem', // 替换为您的私钥路径
  notifyUrl: 'https://your-domain.com/api/wxpay/notify', // 替换为您的回调地址
};
```

### 4. 启动服务

```bash
# 开发环境
node server.js

# 生产环境（推荐使用 PM2）
pm2 start server.js --name wxpay-demo
```

### 5. 访问页面

在微信客户端中打开：`https://your-domain.com/pay.html?openid=USER_OPENID`

> **注意**：生产环境中，`openid` 应通过微信公众号 OAuth 2.0 授权流程获取，不应从 URL 参数直接传递。

---

## 效果展示

### 支付页面

页面包含以下交互元素：

- **商品信息卡片**：展示商品名称、描述和价格
- **金额选择器**：提供 0.01 / 0.10 / 1.00 / 10.00 元快捷选择，支持自定义金额
- **立即支付按钮**：带加载动画和防重复点击处理
- **订单记录列表**：展示历史订单及其状态（待支付/已支付/已关闭）
- **Toast 提示**：操作反馈（支付成功、取消支付、错误提示等）

### 完整流程

1. 用户在微信客户端打开 `pay.html`
2. 选择支付金额，点击"立即支付"
3. 前端调用 `/api/pay/create-order` 下单，获取 `prepay_id`
4. 前端调用 `/api/pay/bridge-config` 获取调起支付参数
5. 前端调用 `WeixinJSBridge.invoke()` 调起微信收银台
6. 用户输入密码完成支付
7. 前端收到 `WeixinJSBridge` 回调，调用 `/api/pay/query-order` 确认订单状态
8. 微信支付系统异步发送回调通知到 `/api/wxpay/notify`
9. 订单列表自动刷新，展示最新订单状态
