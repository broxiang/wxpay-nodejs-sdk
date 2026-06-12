import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { RefundService } from '../../src/services/refund';
import { PartnerJsapiService } from '../../src/services/partner-jsapi';
import { PartnerAppService } from '../../src/services/partner-app';
import { PartnerH5Service } from '../../src/services/partner-h5';
import { PartnerNativeService } from '../../src/services/partner-native';
import { PartnerTransferService } from '../../src/services/partner-transfer';
import { EcommerceProfitSharingService } from '../../src/services/ecommerce-profitsharing';
import { EcommerceRefundService } from '../../src/services/ecommerce-refund';
import { EcommerceSubsidyService } from '../../src/services/ecommerce-subsidy';
import { BrandProfitSharingService } from '../../src/services/brand-profitsharing';
import { WxPayClient } from '../../src/core/client';
import type {
  CreateRefundRequest,
  QueryRefundParams,
  ApplyAbnormalRefundRequest,
  CreatePartnerJsapiOrderRequest,
  PartnerQueryOrderParams,
  PartnerCloseOrderRequest,
  CreatePartnerAppOrderRequest,
  CreatePartnerH5OrderRequest,
  CreatePartnerNativeOrderRequest,
} from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

function createMockClient() {
  return {
    post: vi.fn(),
    get: vi.fn(),
    downloadRaw: vi.fn(),
    mchid: '1900000100',
  };
}

// ============= RefundService =============

describe('RefundService', () => {
  let service: RefundService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new RefundService(mockClient as unknown as WxPayClient);
  });

  it('should create refund', async () => {
    const request: CreateRefundRequest = {
      transaction_id: '4200001234567890',
      out_refund_no: 'RF20240115000001',
      amount: { refund: 100, total: 100, currency: 'CNY' },
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { refund_id: '5000001234567890', out_refund_no: 'RF20240115000001' },
    });

    const result = await service.create(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/refund/domestic/refunds', request);
    expect(result.data.refund_id).toBe('5000001234567890');
  });

  it('should query refund by out refund no', async () => {
    const params: QueryRefundParams = { outRefundNo: 'RF20240115000001' };
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { out_refund_no: 'RF20240115000001', status: 'SUCCESS' },
    });

    const result = await service.queryByOutRefundNo(params);
    expect(mockClient.get).toHaveBeenCalledWith('/v3/refund/domestic/refunds/RF20240115000001');
    expect(result.data.status).toBe('SUCCESS');
  });

  it('should apply abnormal refund', async () => {
    const request: ApplyAbnormalRefundRequest = {
      type: 'USER_BANK_CARD',
      bank_account: 'encrypted_bank_account',
      real_name: 'encrypted_real_name',
    };
    mockClient.post.mockResolvedValue({ status: 200, headers: {}, data: {} });

    await service.applyAbnormalRefund('5000001234567890', request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/refund/domestic/refunds/5000001234567890/apply-abnormal-refund',
      request,
    );
  });
});

// ============= PartnerJsapiService =============

describe('PartnerJsapiService', () => {
  let service: PartnerJsapiService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new PartnerJsapiService(mockClient as unknown as WxPayClient);
  });

  it('should create partner JSAPI order', async () => {
    const request: CreatePartnerJsapiOrderRequest = {
      sp_appid: 'wx8888888888888888',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
      description: '测试商品',
      out_trade_no: 'P20240115000001',
      notify_url: 'https://example.com/notify',
      amount: { total: 100 },
      payer: { sp_openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { prepay_id: 'wx201410272009395522657a690389285100' },
    });

    const result = await service.createOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/pay/partner/transactions/jsapi', request);
    expect(result.data.prepay_id).toBe('wx201410272009395522657a690389285100');
  });

  it('should query partner order by out trade no', async () => {
    const params: PartnerQueryOrderParams = {
      out_trade_no: 'P20240115000001',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
    };
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { trade_state: 'SUCCESS' },
    });

    const result = await service.queryOrderByOutTradeNo(params);
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/out-trade-no/P20240115000001',
      { sp_mchid: '1900000100', sub_mchid: '1900000101' },
    );
    expect(result.data.trade_state).toBe('SUCCESS');
  });

  it('should query partner order by transaction id', async () => {
    const params: PartnerQueryOrderParams = {
      transaction_id: '4200001234567890',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
    };
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { trade_state: 'SUCCESS' },
    });

    await service.queryOrderByTransactionId(params);
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/id/4200001234567890',
      { sp_mchid: '1900000100', sub_mchid: '1900000101' },
    );
  });

  it('should close partner order', async () => {
    const request: PartnerCloseOrderRequest = { sp_mchid: '1900000100', sub_mchid: '1900000101' };
    mockClient.post.mockResolvedValue({ status: 204, headers: {}, data: undefined });

    await service.closeOrder('P20240115000001', request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/out-trade-no/P20240115000001/close',
      request,
    );
  });

  it('should prepay with request payment', async () => {
    const request: CreatePartnerJsapiOrderRequest = {
      sp_appid: 'wx8888888888888888',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
      description: '测试商品',
      out_trade_no: 'P20240115000001',
      notify_url: 'https://example.com/notify',
      amount: { total: 100 },
      payer: { sp_openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { prepay_id: 'wx201410272009395522657a690389285100' },
    });

    const { privateKey } = await import('node:crypto').then((c) =>
      c.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      }),
    );

    const result = await service.prepayWithRequestPayment(request, privateKey);
    expect(result.data.prepay_id).toBe('wx201410272009395522657a690389285100');
    expect(result.bridgeConfig).toBeDefined();
    expect(result.bridgeConfig.appId).toBe('wx8888888888888888');
    expect(result.bridgeConfig.package).toContain('prepay_id=');
  });
});

// ============= PartnerAppService =============

describe('PartnerAppService', () => {
  let service: PartnerAppService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new PartnerAppService(mockClient as unknown as WxPayClient);
  });

  it('should create partner APP order', async () => {
    const request: CreatePartnerAppOrderRequest = {
      sp_appid: 'wx8888888888888888',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
      description: '测试商品',
      out_trade_no: 'PA20240115000001',
      notify_url: 'https://example.com/notify',
      amount: { total: 100 },
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { prepay_id: 'wx201410272009395522657a690389285100' },
    });

    const result = await service.createOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/pay/partner/transactions/app', request);
    expect(result.data.prepay_id).toBe('wx201410272009395522657a690389285100');
  });

  it('should query partner APP order by out trade no', async () => {
    const params: PartnerQueryOrderParams = {
      out_trade_no: 'PA20240115000001',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
    };
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { trade_state: 'SUCCESS' },
    });

    await service.queryOrderByOutTradeNo(params);
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/out-trade-no/PA20240115000001',
      { sp_mchid: '1900000100', sub_mchid: '1900000101' },
    );
  });

  it('should close partner APP order', async () => {
    const request: PartnerCloseOrderRequest = { sp_mchid: '1900000100', sub_mchid: '1900000101' };
    mockClient.post.mockResolvedValue({ status: 204, headers: {}, data: undefined });

    await service.closeOrder('PA20240115000001', request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/out-trade-no/PA20240115000001/close',
      request,
    );
  });

  it('should prepay with request payment for APP', async () => {
    const request: CreatePartnerAppOrderRequest = {
      sp_appid: 'wx8888888888888888',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
      description: '测试商品',
      out_trade_no: 'PA20240115000001',
      notify_url: 'https://example.com/notify',
      amount: { total: 100 },
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { prepay_id: 'wx201410272009395522657a690389285100' },
    });

    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const result = await service.prepayWithRequestPayment(request, privateKey);
    expect(result.data.prepay_id).toBe('wx201410272009395522657a690389285100');
    expect(result.bridgeConfig).toBeDefined();
    expect(result.bridgeConfig.appId).toBe('wx8888888888888888');
  });
});

// ============= PartnerH5Service =============

describe('PartnerH5Service', () => {
  let service: PartnerH5Service;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new PartnerH5Service(mockClient as unknown as WxPayClient);
  });

  it('should create partner H5 order', async () => {
    const request: CreatePartnerH5OrderRequest = {
      sp_appid: 'wx8888888888888888',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
      description: '测试商品',
      out_trade_no: 'PH20240115000001',
      notify_url: 'https://example.com/notify',
      amount: { total: 100 },
      scene_info: {
        payer_client_ip: '14.23.150.211',
        h5_info: { type: 'Wap' },
      },
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { h5_url: 'https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb' },
    });

    const result = await service.createOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/pay/partner/transactions/h5', request);
    expect(result.data.h5_url).toBeDefined();
  });

  it('should query partner H5 order by transaction id', async () => {
    const params: PartnerQueryOrderParams = {
      transaction_id: '4200001234567890',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
    };
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { trade_state: 'SUCCESS' },
    });

    await service.queryOrderByTransactionId(params);
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/id/4200001234567890',
      { sp_mchid: '1900000100', sub_mchid: '1900000101' },
    );
  });

  it('should close partner H5 order', async () => {
    const request: PartnerCloseOrderRequest = { sp_mchid: '1900000100', sub_mchid: '1900000101' };
    mockClient.post.mockResolvedValue({ status: 204, headers: {}, data: undefined });
    await service.closeOrder('PH20240115000001', request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/out-trade-no/PH20240115000001/close',
      request,
    );
  });
});

// ============= PartnerNativeService =============

describe('PartnerNativeService', () => {
  let service: PartnerNativeService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new PartnerNativeService(mockClient as unknown as WxPayClient);
  });

  it('should create partner Native order', async () => {
    const request: CreatePartnerNativeOrderRequest = {
      sp_appid: 'wx8888888888888888',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
      description: '测试商品',
      out_trade_no: 'PN20240115000001',
      notify_url: 'https://example.com/notify',
      amount: { total: 100 },
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { code_url: 'weixin://wxpay/bizpayurl?pr=abc123' },
    });

    const result = await service.createOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/pay/partner/transactions/native', request);
    expect(result.data.code_url).toBe('weixin://wxpay/bizpayurl?pr=abc123');
  });

  it('should query partner Native order by out trade no', async () => {
    const params: PartnerQueryOrderParams = {
      out_trade_no: 'PN20240115000001',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
    };
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { trade_state: 'SUCCESS' },
    });

    await service.queryOrderByOutTradeNo(params);
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/out-trade-no/PN20240115000001',
      { sp_mchid: '1900000100', sub_mchid: '1900000101' },
    );
  });

  it('should query partner Native order by transaction id', async () => {
    const params: PartnerQueryOrderParams = {
      transaction_id: '4200001234567890',
      sp_mchid: '1900000100',
      sub_mchid: '1900000101',
    };
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { trade_state: 'SUCCESS' },
    });

    await service.queryOrderByTransactionId(params);
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/id/4200001234567890',
      { sp_mchid: '1900000100', sub_mchid: '1900000101' },
    );
  });

  it('should close partner Native order', async () => {
    const request: PartnerCloseOrderRequest = { sp_mchid: '1900000100', sub_mchid: '1900000101' };
    mockClient.post.mockResolvedValue({ status: 204, headers: {}, data: undefined });
    await service.closeOrder('PN20240115000001', request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/out-trade-no/PN20240115000001/close',
      request,
    );
  });
});

// ============= PartnerTransferService =============

describe('PartnerTransferService', () => {
  let service: PartnerTransferService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new PartnerTransferService(mockClient as unknown as WxPayClient);
  });

  it('should create partner transfer', async () => {
    const request = {
      sub_mchid: '1900000101',
      out_bill_no: 'PT20240115000001',
      transfer_scene_id: '1000',
      openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
      transfer_amount: 100,
      transfer_remark: '佣金',
      transfer_scene_report_infos: [{ info_type: '活动名称', info_content: '测试活动' }],
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        out_bill_no: 'PT20240115000001',
        transfer_bill_no: '1330000071100999991182020050700019480001',
        state: 'ACCEPTED',
      },
    });

    const result = await service.createTransfer(request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/fund-app/mch-transfer/partner/transfer-bills',
      request,
    );
    expect(result.data.state).toBe('ACCEPTED');
  });

  it('should query partner transfer by out bill no', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { out_bill_no: 'PT20240115000001', state: 'SUCCESS' },
    });

    const result = await service.queryTransferByOutBillNo('PT20240115000001', '1900000101');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/fund-app/mch-transfer/partner/transfer-bills/out-bill-no/PT20240115000001',
      { sub_mchid: '1900000101' },
    );
    expect(result.data.state).toBe('SUCCESS');
  });

  it('should cancel partner transfer', async () => {
    mockClient.post.mockResolvedValue({ status: 200, headers: {}, data: {} });

    await service.cancelTransfer('PT20240115000001', '1900000101');
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/fund-app/mch-transfer/partner/transfer-bills/out-bill-no/PT20240115000001/cancel',
      { sub_mchid: '1900000101' },
    );
  });
});

// ============= EcommerceProfitSharingService =============

describe('EcommerceProfitSharingService', () => {
  let service: EcommerceProfitSharingService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new EcommerceProfitSharingService(mockClient as unknown as WxPayClient);
  });

  it('should create ecommerce profit sharing order', async () => {
    const request = {
      sub_mchid: '1900000101',
      appid: 'wx8888888888888888',
      transaction_id: '4200001234567890',
      out_order_no: 'EPS20240115000001',
      receivers: [
        { type: 'MERCHANT_ID', receiver_account: '1900000102', amount: 10, description: '分账' },
      ],
      finish: false,
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { order_id: '3000001234567890' },
    });

    const result = await service.createOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/ecommerce/profitsharing/orders', request);
    expect(result.data.order_id).toBe('3000001234567890');
  });

  it('should query ecommerce profit sharing order', async () => {
    mockClient.get.mockResolvedValue({ status: 200, headers: {}, data: { state: 'FINISHED' } });

    const result = await service.queryOrder('1900000101', '4200001234567890', 'EPS20240115000001');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/ecommerce/profitsharing/orders', {
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
      out_order_no: 'EPS20240115000001',
    });
    expect(result.data.state).toBe('FINISHED');
  });

  it('should create ecommerce profit sharing return order', async () => {
    const request = {
      sub_mchid: '1900000101',
      order_id: '3000001234567890',
      out_order_no: 'EPS20240115000001',
      out_return_no: 'EPR20240115000001',
      return_mchid: '1900000100',
      amount: 5,
      description: '回退',
    };
    mockClient.post.mockResolvedValue({ status: 200, headers: {}, data: { result: 'SUCCESS' } });

    const result = await service.createReturnOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/ecommerce/profitsharing/returnorders',
      request,
    );
    expect(result.data.result).toBe('SUCCESS');
  });

  it('should query ecommerce profit sharing return order', async () => {
    mockClient.get.mockResolvedValue({ status: 200, headers: {}, data: { result: 'SUCCESS' } });

    await service.queryReturnOrder('1900000101', '3000001234567890', 'EPR20240115000001');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/ecommerce/profitsharing/returnorders', {
      sub_mchid: '1900000101',
      order_id: '3000001234567890',
      out_return_no: 'EPR20240115000001',
    });
  });

  it('should finish ecommerce profit sharing', async () => {
    const request = {
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
      out_order_no: 'EPS20240115000001',
      description: '完结',
    };
    mockClient.post.mockResolvedValue({ status: 200, headers: {}, data: {} });

    await service.finishOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/ecommerce/profitsharing/finish-order',
      request,
    );
  });

  it('should create after-sales order', async () => {
    const request = {
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
      amount: 50,
      type: 'SERVICE_FEE_INCOME',
      scene: 'RETURN_GOODS',
      refund_id: '5000001234567890',
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { sub_mchid: '1900000101', transaction_id: '4200001234567890', amount: 50 },
    });

    const result = await service.createAfterSalesOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/ecommerce/profitsharing/after-sales-orders',
      request,
    );
    expect(result.data.amount).toBe(50);
  });

  it('should query after-sales order', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { sub_mchid: '1900000101', transaction_id: '4200001234567890', result: 'SUCCESS' },
    });

    const result = await service.queryAfterSalesOrder('1900000101', '4200001234567890');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/ecommerce/profitsharing/after-sales-orders', {
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
    });
    expect(result.data.result).toBe('SUCCESS');
  });

  it('should query order amount', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { transaction_id: '4200001234567890', unsplit_amount: 50 },
    });

    const result = await service.queryOrderAmount('4200001234567890');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/ecommerce/profitsharing/orders/4200001234567890/amounts',
    );
    expect(result.data.unsplit_amount).toBe(50);
  });

  it('should add receiver', async () => {
    const request = {
      appid: 'wx8888888888888888',
      type: 'MERCHANT_ID',
      account: '1900000102',
      name: '测试商户',
      relation_type: 'SUPPLIER',
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { type: 'MERCHANT_ID', account: '1900000102' },
    });

    const result = await service.addReceiver(request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/ecommerce/profitsharing/receivers/add',
      request,
    );
    expect(result.data.type).toBe('MERCHANT_ID');
  });

  it('should delete receiver', async () => {
    const request = {
      appid: 'wx8888888888888888',
      type: 'MERCHANT_ID',
      account: '1900000102',
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { type: 'MERCHANT_ID', account: '1900000102' },
    });

    const result = await service.deleteReceiver(request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/ecommerce/profitsharing/receivers/delete',
      request,
    );
    expect(result.data.account).toBe('1900000102');
  });
});

// ============= EcommerceRefundService =============

describe('EcommerceRefundService', () => {
  let service: EcommerceRefundService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new EcommerceRefundService(mockClient as unknown as WxPayClient);
  });

  it('should create ecommerce refund', async () => {
    const request = {
      sub_mchid: '1900000101',
      sp_appid: 'wx8888888888888888',
      transaction_id: '4200001234567890',
      out_refund_no: 'ERF20240115000001',
      amount: { refund: 100, total: 100 },
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { refund_id: '5000001234567890', out_refund_no: 'ERF20240115000001' },
    });

    const result = await service.create(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/ecommerce/refunds/apply', request);
    expect(result.data.refund_id).toBe('5000001234567890');
  });

  it('should query ecommerce refund by out refund no', async () => {
    mockClient.get.mockResolvedValue({ status: 200, headers: {}, data: { status: 'SUCCESS' } });

    const result = await service.queryByOutRefundNo('1900000101', 'ERF20240115000001');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/ecommerce/refunds/out-refund-no/ERF20240115000001',
      { sub_mchid: '1900000101' },
    );
    expect(result.data.status).toBe('SUCCESS');
  });

  it('should query ecommerce refund by refund id', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { status: 'SUCCESS', refund_id: '5000001234567890' },
    });

    const result = await service.queryByRefundId('1900000101', '5000001234567890');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/ecommerce/refunds/id/5000001234567890', {
      sub_mchid: '1900000101',
    });
    expect(result.data.status).toBe('SUCCESS');
  });

  it('should create return advance', async () => {
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        refund_id: '5000001234567890',
        advance_return_id: 'AR20240115001',
        result: 'SUCCESS',
        return_amount: 100,
      },
    });

    const result = await service.createReturnAdvance({
      refund_id: '5000001234567890',
      sub_mchid: '1900000101',
    });
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/ecommerce/refunds/5000001234567890/return-advance',
      { sub_mchid: '1900000101' },
    );
    expect(result.data.result).toBe('SUCCESS');
  });

  it('should query return advance', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        refund_id: '5000001234567890',
        advance_return_id: 'AR20240115001',
        result: 'SUCCESS',
      },
    });

    const result = await service.queryReturnAdvance('1900000101', '5000001234567890');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/ecommerce/refunds/5000001234567890/return-advance',
      { sub_mchid: '1900000101' },
    );
    expect(result.data.result).toBe('SUCCESS');
  });
});

// ============= EcommerceSubsidyService =============

describe('EcommerceSubsidyService', () => {
  let service: EcommerceSubsidyService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new EcommerceSubsidyService(mockClient as unknown as WxPayClient);
  });

  it('should create ecommerce subsidy', async () => {
    const request = {
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
      amount: 10,
      description: '补差',
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { subsidy_id: '3000001234567890', result: 'SUCCESS' },
    });

    const result = await service.create(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/ecommerce/subsidies/create', request);
    expect(result.data.result).toBe('SUCCESS');
  });

  it('should return ecommerce subsidy', async () => {
    const request = {
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
      amount: 5,
      description: '补差回退',
      out_order_no: 'ESR20240115000001',
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { subsidy_refund_id: '4000001234567890', result: 'SUCCESS' },
    });

    const result = await service.returnSubsidy(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/ecommerce/subsidies/return', request);
    expect(result.data.result).toBe('SUCCESS');
  });

  it('should cancel ecommerce subsidy', async () => {
    const request = {
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
      description: '取消补差',
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: {
        sub_mchid: '1900000101',
        transaction_id: '4200001234567890',
        result: 'SUCCESS',
        description: '取消补差',
      },
    });

    const result = await service.cancelSubsidy(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/ecommerce/subsidies/cancel', request);
    expect(result.data.result).toBe('SUCCESS');
  });
});

// ============= BrandProfitSharingService =============

describe('BrandProfitSharingService', () => {
  let service: BrandProfitSharingService;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new BrandProfitSharingService(mockClient as unknown as WxPayClient);
  });

  it('should create brand profit sharing order', async () => {
    const request = {
      brand_mchid: '1900000100',
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
      out_order_no: 'BPS20240115000001',
      receivers: [{ type: 'MERCHANT_ID', account: '1900000102', amount: 10, description: '分账' }],
      finish: false,
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { order_id: '3000001234567890' },
    });

    const result = await service.createOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/brand/profitsharing/orders', request);
    expect(result.data.order_id).toBe('3000001234567890');
  });

  it('should query brand profit sharing order', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { order_id: '3000001234567890' },
    });

    await service.queryOrder('1900000100', '1900000101', '4200001234567890', 'BPS20240115000001');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/brand/profitsharing/orders', {
      brand_mchid: '1900000100',
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
      out_order_no: 'BPS20240115000001',
    });
  });

  it('should create brand profit sharing return order', async () => {
    const request = {
      brand_mchid: '1900000100',
      sub_mchid: '1900000101',
      order_id: '3000001234567890',
      out_order_no: 'BPS20240115000001',
      out_return_no: 'BPR20240115000001',
      return_mchid: '1900000100',
      amount: 5,
      description: '回退',
    };
    mockClient.post.mockResolvedValue({ status: 200, headers: {}, data: { result: 'SUCCESS' } });

    const result = await service.createReturnOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/brand/profitsharing/returnorders', request);
    expect(result.data.result).toBe('SUCCESS');
  });

  it('should query brand profit sharing return order', async () => {
    mockClient.get.mockResolvedValue({ status: 200, headers: {}, data: { result: 'SUCCESS' } });

    await service.queryReturnOrder(
      '1900000100',
      '1900000101',
      '3000001234567890',
      'BPR20240115000001',
    );
    expect(mockClient.get).toHaveBeenCalledWith('/v3/brand/profitsharing/returnorders', {
      brand_mchid: '1900000100',
      sub_mchid: '1900000101',
      order_id: '3000001234567890',
      out_return_no: 'BPR20240115000001',
    });
  });

  it('should finish brand profit sharing', async () => {
    const request = {
      brand_mchid: '1900000100',
      sub_mchid: '1900000101',
      transaction_id: '4200001234567890',
      out_order_no: 'BPS20240115000001',
      description: '完结',
    };
    mockClient.post.mockResolvedValue({ status: 200, headers: {}, data: {} });

    await service.finishOrder(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/brand/profitsharing/finish-order', request);
  });

  it('should query brand merchant ratio', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { brand_mchid: '1900000100', max_ratio: 2000 },
    });

    const result = await service.queryBrandMerchantRatio('1900000100');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/brand/profitsharing/brand-configs/1900000100');
    expect(result.data.max_ratio).toBe(2000);
  });

  it('should query brand order amount', async () => {
    mockClient.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { transaction_id: '4200001234567890', unsplit_amount: 100 },
    });

    const result = await service.queryOrderAmount('4200001234567890');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/brand/profitsharing/orders/4200001234567890/amounts',
    );
    expect(result.data.unsplit_amount).toBe(100);
  });

  it('should add brand receiver', async () => {
    const request = {
      brand_mchid: '1900000100',
      appid: 'wx8888888888888888',
      type: 'MERCHANT_ID',
      account: '1900000102',
      name: '门店商户',
      relation_type: 'SUPPLIER',
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { brand_mchid: '1900000100', type: 'MERCHANT_ID', account: '1900000102' },
    });

    const result = await service.addReceiver(request);
    expect(mockClient.post).toHaveBeenCalledWith('/v3/brand/profitsharing/receivers/add', request);
    expect(result.data.brand_mchid).toBe('1900000100');
  });

  it('should delete brand receiver', async () => {
    const request = {
      brand_mchid: '1900000100',
      appid: 'wx8888888888888888',
      type: 'MERCHANT_ID',
      account: '1900000102',
    };
    mockClient.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { brand_mchid: '1900000100', type: 'MERCHANT_ID', account: '1900000102' },
    });

    const result = await service.deleteReceiver(request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/brand/profitsharing/receivers/delete',
      request,
    );
    expect(result.data.account).toBe('1900000102');
  });
});
