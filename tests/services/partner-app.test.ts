import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { PartnerAppService } from '../../src/services/partner-app';
import { WxPayClient } from '../../src/core/client';
import type {
  CreatePartnerAppOrderRequest,
  PartnerQueryOrderParams,
  PartnerCloseOrderRequest,
} from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('PartnerAppService', () => {
  let service: PartnerAppService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    downloadRaw: ReturnType<typeof vi.fn>;
    mchid: string;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      downloadRaw: vi.fn(),
      mchid: '1900000100',
    };
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

  it('should query order by out trade no', async () => {
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

  it('should query order by transaction id', async () => {
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

    const result = await service.queryOrderByTransactionId(params);
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/id/4200001234567890',
      { sp_mchid: '1900000100', sub_mchid: '1900000101' },
    );
    expect(result.data.trade_state).toBe('SUCCESS');
  });

  it('should close order', async () => {
    const request: PartnerCloseOrderRequest = { sp_mchid: '1900000100', sub_mchid: '1900000101' };
    mockClient.post.mockResolvedValue({ status: 204, headers: {}, data: undefined });

    await service.closeOrder('PA20240115000001', request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/out-trade-no/PA20240115000001/close',
      request,
    );
  });

  it('should prepay with request payment', async () => {
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
    expect(result.bridgeConfig).toBeDefined();
    expect(result.bridgeConfig.appId).toBe('wx8888888888888888');
    expect(result.bridgeConfig.partnerId).toBe('1900000100');
  });
});
