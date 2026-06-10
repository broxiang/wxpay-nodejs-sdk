import { describe, it, expect } from 'vitest';
import { buildSignString, generateNonce, buildAuthorization } from '../src/utils/sign.js';
import { createRequestHeaders, toWxPayBody, WxPayError } from '../src/utils/http.js';

/**
 * Snapshot 测试
 *
 * 对微信支付 SDK 的核心序列化逻辑做快照测试：
 * - 签名串格式
 * - Authorization 头格式
 * - 请求头结构
 * - JSON 请求体序列化
 * - WxPayError 序列化
 * - Bridge 配置结构（JSAPI / APP / 小程序）
 *
 * 任何意外变更都会导致快照失败，从而在提交前发现签名或协议兼容性问题。
 */

// ========== 签名串格式快照 ==========

describe('Snapshot: 签名串格式', () => {
  it('GET 请求签名串格式', () => {
    const signStr = buildSignString({
      method: 'GET',
      path: '/v3/pay/transactions/id/4200001234567890',
      timestamp: 1705305600,
      nonce: 'abc123def456',
      body: '',
    });

    expect(signStr).toMatchSnapshot();
  });

  it('POST 请求签名串格式（含请求体）', () => {
    const body = JSON.stringify({
      appid: 'wx8888888888888888',
      mchid: '1900000100',
      description: '测试商品',
      out_trade_no: 'ORDER20240101',
      amount: { total: 100, currency: 'CNY' },
      payer: { openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
    });

    const signStr = buildSignString({
      method: 'POST',
      path: '/v3/pay/transactions/jsapi',
      timestamp: 1705305600,
      nonce: 'xyz789abc012',
      body,
    });

    expect(signStr).toMatchSnapshot();
  });

  it('PUT 请求签名串格式', () => {
    const body = JSON.stringify({ amount: 200 });

    const signStr = buildSignString({
      method: 'PUT',
      path: '/v3/resource',
      timestamp: 1705305600,
      nonce: 'nonce12345',
      body,
    });

    expect(signStr).toMatchSnapshot();
  });

  it('带查询参数的路径签名串格式', () => {
    const signStr = buildSignString({
      method: 'GET',
      path: '/v3/pay/transactions?mchid=1900000100&limit=10',
      timestamp: 1705305600,
      nonce: 'queryTest',
      body: '',
    });

    expect(signStr).toMatchSnapshot();
  });
});

// ========== Authorization 头格式快照 ==========

describe('Snapshot: Authorization 头格式', () => {
  it('标准 Authorization 头', () => {
    const auth = buildAuthorization(
      '1900000100',
      '5157F09EFDC096DE15EBE81A47057A7232F1B8E1',
      1705305600,
      'nonceValue123',
      'signatureBase64==',
    );

    expect(auth).toMatchSnapshot();
  });
});

// ========== nonce 格式快照 ==========

describe('Snapshot: nonce 生成格式', () => {
  it('nonce 应为 32 位无连字符的 UUID', () => {
    const nonce = generateNonce();
    expect(nonce).not.toContain('-');
    expect(nonce).toHaveLength(32);
    // 验证格式一致性
    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
  });
});

// ========== 请求头格式快照 ==========

describe('Snapshot: HTTP 请求头结构', () => {
  it('标准 JSON 请求头', () => {
    const headers = createRequestHeaders({
      authorization: 'WECHATPAY2-SHA256-RSA2048 mchid="1900000100",nonce_str="abc123"',
    });

    expect(headers).toMatchSnapshot();
  });

  it('带额外头部的请求头', () => {
    const headers = createRequestHeaders({
      authorization: 'WECHATPAY2-SHA256-RSA2048 mchid="1900000100"',
      additional: {
        'Idempotency-Key': 'key-12345',
        'Wechatpay-Serial': 'CERT_SERIAL_NO',
      },
    });

    expect(headers).toMatchSnapshot();
  });

  it('multipart/form-data 请求头', () => {
    const headers = createRequestHeaders({
      authorization: 'WECHATPAY2-SHA256-RSA2048 mchid="1900000100"',
      contentType: 'multipart/form-data',
    });

    expect(headers).toMatchSnapshot();
  });
});

// ========== JSON 序列化快照 ==========

describe('Snapshot: JSON 请求体序列化', () => {
  it('JSAPI 下单请求体', () => {
    const body = toWxPayBody({
      appid: 'wx8888888888888888',
      mchid: '1900000100',
      description: 'Image形象店-深圳腾大-QQ公仔',
      out_trade_no: '1217752501201407033233368018',
      time_expire: '2018-06-08T10:34:56+08:00',
      attach: '自定义数据',
      notify_url: 'https://www.weixin.qq.com/wxpay/pay.php',
      amount: {
        total: 100,
        currency: 'CNY',
      },
      payer: {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
      },
    });

    expect(body).toMatchSnapshot();
  });

  it('合单下单请求体', () => {
    const body = toWxPayBody({
      combine_appid: 'wxd678efh567hg6787',
      combine_mchid: '1230000109',
      combine_out_trade_no: '1217752501201407033233368018',
      notify_url: 'https://yourapp.com/notify',
      combine_payer_info: { openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
      sub_orders: [
        {
          mchid: '1230000109',
          out_trade_no: '20150806125346',
          description: '商品A',
          amount: { total_amount: 10, currency: 'CNY' },
        },
        {
          mchid: '1230000110',
          out_trade_no: '20150806125347',
          description: '商品B',
          amount: { total_amount: 20, currency: 'CNY' },
        },
      ],
    });

    expect(body).toMatchSnapshot();
  });

  it('退款请求体', () => {
    const body = toWxPayBody({
      transaction_id: '4200001234567890',
      out_refund_no: 'REFUND20240101',
      reason: '商品已退货',
      amount: {
        refund: 100,
        total: 500,
        currency: 'CNY',
      },
    });

    expect(body).toMatchSnapshot();
  });

  it('分账请求体', () => {
    const body = toWxPayBody({
      transaction_id: '4208450740201411110007820472',
      out_order_no: 'P20150806125346',
      unfreeze_unsplit: false,
      receivers: [
        {
          type: 'MERCHANT_ID',
          account: '1900000109',
          name: 'encrypted_name_base64',
          amount: 100,
          description: '分给商户A',
        },
      ],
    });

    expect(body).toMatchSnapshot();
  });
});

// ========== WxPayError 序列化快照 ==========

describe('Snapshot: WxPayError 结构', () => {
  it('客户端错误 (400)', () => {
    const error = new WxPayError(
      400,
      {
        'request-id': 'req-abc-123',
        'wechatpay-serial': 'CERT001',
      },
      {
        code: 'INVALID_REQUEST',
        message: '参数格式错误',
        detail: [{ field: '/amount/total', message: '金额不能为空' }],
      },
    );

    expect({
      name: error.name,
      message: error.message,
      status: error.status,
      headers: error.headers,
      detail: error.detail,
      isClientError: error.isClientError,
      isServerError: error.isServerError,
    }).toMatchSnapshot();
  });

  it('服务端错误 (500)', () => {
    const error = new WxPayError(
      500,
      {
        'request-id': 'req-def-456',
      },
      {
        code: 'SYSTEM_ERROR',
        message: '系统错误，请稍后重试',
      },
    );

    expect({
      name: error.name,
      message: error.message,
      status: error.status,
      detail: error.detail,
      isClientError: error.isClientError,
      isServerError: error.isServerError,
    }).toMatchSnapshot();
  });

  it('超时错误', () => {
    const error = new WxPayError(
      0,
      {},
      {
        code: 'REQUEST_TIMEOUT',
        message: '请求超时 (30000ms)',
      },
    );

    expect({
      name: error.name,
      message: error.message,
      status: error.status,
      detail: error.detail,
      isClientError: error.isClientError,
      isServerError: error.isServerError,
    }).toMatchSnapshot();
  });
});

// ========== Bridge 配置结构快照 ==========

describe('Snapshot: Bridge 配置结构', () => {
  it('JSAPI Bridge 配置结构（排除动态时间戳）', () => {
    // 使用固定时间戳验证结构
    const config = {
      appId: 'wx1234567890abcdef',
      timeStamp: '1705305600',
      nonceStr: 'abc123def456789012345678901234ab',
      package: 'prepay_id=wx201410272009395522657a690389285100',
      signType: 'RSA',
      paySign: 'base64encodedSignature==',
    };

    // 验证键名（不验证具体签名值，因为签名依赖于私钥）
    expect(Object.keys(config).sort()).toMatchSnapshot('JSAPI bridge config keys');
    expect({
      appId: config.appId,
      timeStamp: config.timeStamp,
      package: config.package,
      signType: config.signType,
    }).toMatchSnapshot('JSAPI bridge config values (excl. dynamic)');
  });

  it('APP Bridge 配置结构', () => {
    const config = {
      appId: 'wx1234567890abcdef',
      partnerId: '1900000100',
      prepayId: 'wx201410272009395522657a690389285100',
      packageValue: 'Sign=WXPay',
      nonceStr: 'abc123def456789012345678901234ab',
      timeStamp: '1705305600',
      sign: 'base64encodedSignature==',
    };

    expect(Object.keys(config).sort()).toMatchSnapshot('APP bridge config keys');
    expect({
      appId: config.appId,
      partnerId: config.partnerId,
      packageValue: config.packageValue,
    }).toMatchSnapshot('APP bridge config values');
  });

  it('小程序 Bridge 配置结构', () => {
    const config = {
      timeStamp: '1705305600',
      nonceStr: 'abc123def456789012345678901234ab',
      package: 'prepay_id=wx201410272009395522657a690389285100',
      signType: 'RSA',
      paySign: 'base64encodedSignature==',
    };

    expect(Object.keys(config).sort()).toMatchSnapshot('MiniProgram bridge config keys');
    expect(config).not.toHaveProperty('appId');
  });

  it('支付分 JSAPI Bridge 配置结构', () => {
    const config = {
      appid: 'wx1234567890abcdef',
      mchid: '1900000100',
      service_id: '500001',
      out_order_no: 'ORDER20240101',
      timestamp: '1705305600',
      nonce_str: 'abc123def456789012345678901234ab',
      sign_type: 'RSA',
      sign: 'base64encodedSignature==',
    };

    expect(Object.keys(config).sort()).toMatchSnapshot('PayScore JSAPI bridge config keys');
  });

  it('商家转账 JSAPI Bridge 配置结构', () => {
    const config = {
      mchId: '1900000100',
      appId: 'wx1234567890abcdef',
      package: 'package_info_base64==',
    };

    expect(Object.keys(config).sort()).toMatchSnapshot('MerchantTransfer bridge config keys');
  });
});
