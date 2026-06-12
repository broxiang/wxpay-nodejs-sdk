import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartnerH5Service } from '../../src/services/partner-h5';
import { WxPayClient } from '../../src/core/client';
import type {
  CreatePartnerH5OrderRequest,
  PartnerQueryOrderParams,
  PartnerCloseOrderRequest,
} from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('PartnerH5Service', () => {
  let service: PartnerH5Service;
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

  it('should query order by out trade no', async () => {
    const params: PartnerQueryOrderParams = {
      out_trade_no: 'PH20240115000001',
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
      '/v3/pay/partner/transactions/out-trade-no/PH20240115000001',
      { sp_mchid: '1900000100', sub_mchid: '1900000101' },
    );
    expect(result.data.trade_state).toBe('SUCCESS');
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

    await service.queryOrderByTransactionId(params);
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/id/4200001234567890',
      { sp_mchid: '1900000100', sub_mchid: '1900000101' },
    );
  });

  it('should close order', async () => {
    const request: PartnerCloseOrderRequest = { sp_mchid: '1900000100', sub_mchid: '1900000101' };
    mockClient.post.mockResolvedValue({ status: 204, headers: {}, data: undefined });

    await service.closeOrder('PH20240115000001', request);
    expect(mockClient.post).toHaveBeenCalledWith(
      '/v3/pay/partner/transactions/out-trade-no/PH20240115000001/close',
      request,
    );
  });
});
