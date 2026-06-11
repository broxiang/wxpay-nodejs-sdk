import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoldPlanService } from '../../src/services/goldplan';
import { LoveFeastService } from '../../src/services/lovefeast';
import { MerchantExclusiveCouponService } from '../../src/services/merchant-exclusive-coupon';
import { PayrollCardService } from '../../src/services/payrollcard';
import { RetailStoreService } from '../../src/services/retailstore';
import { ScanAndRideService } from '../../src/services/scanandride';
import { WxPayClient } from '../../src/core/client';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('GoldPlanService', () => {
  let service: GoldPlanService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    mchid: string;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      mchid: '1900000100',
    };
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new GoldPlanService(mockClient as unknown as WxPayClient);
  });

  it('should query balance', async () => {
    mockClient.get.mockResolvedValue({ data: { available_amount: 100 } });
    const result = await service.queryBalance('1900000100');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/merchant/fund/balance/1900000100');
    expect(result.data.available_amount).toBe(100);
  });

  it('should query flow', async () => {
    mockClient.get.mockResolvedValue({ data: [] });
    const result = await service.queryFlow('1900000100', { limit: 10 });
    expect(mockClient.get).toHaveBeenCalledWith('/v3/merchant/fund/flow', {
      mchid: '1900000100',
      limit: 10,
    });
    expect(result.data).toEqual([]);
  });

  it('should query flow without params', async () => {
    mockClient.get.mockResolvedValue({ data: [] });
    await service.queryFlow('1900000100');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/merchant/fund/flow', {
      mchid: '1900000100',
    });
  });

  it('should query status', async () => {
    mockClient.get.mockResolvedValue({ data: { status: 'NORMAL' } });
    const result = await service.queryStatus('1900000100');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/merchant/fund/status/1900000100');
    expect(result.data.status).toBe('NORMAL');
  });
});

describe('LoveFeastService', () => {
  let service: LoveFeastService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    mchid: string;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      mchid: '1900000100',
    };
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new LoveFeastService(mockClient as unknown as WxPayClient);
  });

  it('should create brand', async () => {
    mockClient.post.mockResolvedValue({ data: { brand_id: 'brand-001' } });
    const result = await service.createBrand({ out_request_no: 'REQ001' });
    expect(mockClient.post).toHaveBeenCalledWith('/v3/lovefeast/brands', {
      out_request_no: 'REQ001',
    });
    expect(result.data.brand_id).toBe('brand-001');
  });

  it('should query brand', async () => {
    mockClient.get.mockResolvedValue({ data: { brand_id: 'brand-001' } });
    const result = await service.queryBrand('brand-001');
    expect(mockClient.get).toHaveBeenCalledWith('/v3/lovefeast/brands/brand-001');
    expect(result.data.brand_id).toBe('brand-001');
  });

  it('should create order', async () => {
    mockClient.post.mockResolvedValue({ data: { order_id: 'order-001' } });
    const result = await service.createOrder({ out_request_no: 'REQ002' });
    expect(mockClient.post).toHaveBeenCalledWith('/v3/lovefeast/orders', {
      out_request_no: 'REQ002',
    });
    expect(result.data.order_id).toBe('order-001');
  });

  it('should query order', async () => {
    mockClient.get.mockResolvedValue({ data: { order_id: 'order-001' } });
    const result = await service.queryOrder('ORDER001');
    expect(mockClient.get).toHaveBeenCalledWith(
      '/v3/lovefeast/orders/out-trade-no/ORDER001',
      undefined,
    );
    expect(result.data.order_id).toBe('order-001');
  });

  it('should query order with params', async () => {
    mockClient.get.mockResolvedValue({ data: { order_id: 'order-001' } });
    await service.queryOrder('ORDER001', { mchid: '1900000100' });
    expect(mockClient.get).toHaveBeenCalledWith('/v3/lovefeast/orders/out-trade-no/ORDER001', {
      mchid: '1900000100',
    });
  });
});

describe('MerchantExclusiveCouponService', () => {
  let service: MerchantExclusiveCouponService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    mchid: string;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      mchid: '1900000100',
    };
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new MerchantExclusiveCouponService(mockClient as unknown as WxPayClient);
  });

  it('should create coupon stock', async () => {
    mockClient.post.mockResolvedValue({ data: { stock_id: 'stock-001' } });
    const result = await service.createCouponStock({ out_request_no: 'REQ001' });
    expect(mockClient.post).toHaveBeenCalled();
    expect(result.data.stock_id).toBe('stock-001');
  });

  it('should query coupon stock', async () => {
    mockClient.get.mockResolvedValue({ data: { stock_id: 'stock-001' } });
    const result = await service.queryCouponStock('stock-001');
    expect(mockClient.get).toHaveBeenCalled();
    expect(result.data.stock_id).toBe('stock-001');
  });

  it('should send coupon', async () => {
    mockClient.post.mockResolvedValue({ data: { coupon_id: 'c-001' } });
    const result = await service.sendCoupon({
      stock_id: 'stock-001',
      out_request_no: 'REQ002',
      openid: 'user-001',
    });
    expect(mockClient.post).toHaveBeenCalled();
    expect(result.data.coupon_id).toBe('c-001');
  });

  it('should query user coupons', async () => {
    mockClient.get.mockResolvedValue({ data: [] });
    const result = await service.queryUserCoupons('user-001');
    expect(mockClient.get).toHaveBeenCalled();
    expect(result.data).toEqual([]);
  });

  it('should query user coupons with params', async () => {
    mockClient.get.mockResolvedValue({ data: [] });
    await service.queryUserCoupons('user-001', { limit: 10 });
    expect(mockClient.get).toHaveBeenCalled();
  });

  it('should query coupon', async () => {
    mockClient.get.mockResolvedValue({ data: { coupon_id: 'c-001' } });
    const result = await service.queryCoupon('c-001');
    expect(mockClient.get).toHaveBeenCalled();
    expect(result.data.coupon_id).toBe('c-001');
  });
});

describe('PayrollCardService', () => {
  let service: PayrollCardService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    mchid: string;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      mchid: '1900000100',
    };
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new PayrollCardService(mockClient as unknown as WxPayClient);
  });

  it('should query authorization', async () => {
    mockClient.get.mockResolvedValue({ data: { authorized: true } });
    const result = await service.queryAuthorization({
      sub_mchid: '1900000100',
      appid: 'wx123456',
      openid: 'user-001',
    });
    expect(mockClient.get).toHaveBeenCalled();
    expect(result.data.authorized).toBe(true);
  });

  it('should create token', async () => {
    mockClient.post.mockResolvedValue({ data: { token: 'token-001' } });
    const result = await service.createToken({
      sub_mchid: '1900000100',
      appid: 'wx123456',
      openid: 'user-001',
      out_request_no: 'REQ001',
    });
    expect(mockClient.post).toHaveBeenCalled();
    expect(result.data.token).toBe('token-001');
  });

  it('should create authentication', async () => {
    mockClient.post.mockResolvedValue({ data: { authentication_id: 'auth-001' } });
    const result = await service.createAuthentication({
      sub_mchid: '1900000100',
      appid: 'wx123456',
      openid: 'user-001',
      out_request_no: 'REQ002',
      token: 'token-001',
      scene: 'PAYMENT',
    });
    expect(mockClient.post).toHaveBeenCalled();
    expect(result.data.authentication_id).toBe('auth-001');
  });

  it('should query authentication', async () => {
    mockClient.get.mockResolvedValue({ data: { status: 'SUCCESS' } });
    const result = await service.queryAuthentication('REQ002', { sub_mchid: '1900000100' });
    expect(mockClient.get).toHaveBeenCalled();
    expect(result.data.status).toBe('SUCCESS');
  });

  it('should create transfer batch', async () => {
    mockClient.post.mockResolvedValue({ data: { batch_id: 'batch-001' } });
    const result = await service.createTransferBatch({
      sub_mchid: '1900000100',
      appid: 'wx123456',
      out_batch_no: 'BATCH001',
      batch_name: '工资发放',
      batch_remark: '2024年1月工资',
      total_amount: 10000,
      total_num: 1,
      transfer_detail_list: [
        {
          out_detail_no: 'DETAIL001',
          transfer_amount: 10000,
          transfer_remark: '工资',
          openid: 'user-001',
        },
      ],
    });
    expect(mockClient.post).toHaveBeenCalled();
    expect(result.data.batch_id).toBe('batch-001');
  });
});

describe('RetailStoreService', () => {
  let service: RetailStoreService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    mchid: string;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      mchid: '1900000100',
    };
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new RetailStoreService(mockClient as unknown as WxPayClient);
  });

  it('should create activity', async () => {
    mockClient.post.mockResolvedValue({ data: { activity_id: 'act-001' } });
    const result = await service.createActivity({ out_request_no: 'REQ001' });
    expect(mockClient.post).toHaveBeenCalled();
    expect(result.data.activity_id).toBe('act-001');
  });

  it('should query activity', async () => {
    mockClient.get.mockResolvedValue({ data: { activity_id: 'act-001' } });
    const result = await service.queryActivity('act-001');
    expect(mockClient.get).toHaveBeenCalled();
    expect(result.data.activity_id).toBe('act-001');
  });

  it('should update activity', async () => {
    mockClient.patch.mockResolvedValue({ data: {} });
    await service.updateActivity('act-001', { activity_name: '新名称' });
    expect(mockClient.patch).toHaveBeenCalled();
  });

  it('should create qualification', async () => {
    mockClient.post.mockResolvedValue({ data: { qualification_id: 'qual-001' } });
    const result = await service.createQualification({ out_request_no: 'REQ002' });
    expect(mockClient.post).toHaveBeenCalled();
    expect(result.data.qualification_id).toBe('qual-001');
  });

  it('should query qualification', async () => {
    mockClient.get.mockResolvedValue({ data: { qualification_id: 'qual-001' } });
    const result = await service.queryQualification('qual-001');
    expect(mockClient.get).toHaveBeenCalled();
    expect(result.data.qualification_id).toBe('qual-001');
  });
});

describe('ScanAndRideService', () => {
  let service: ScanAndRideService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    mchid: string;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      mchid: '1900000100',
    };
    MockWxPayClient.mockImplementation(() => mockClient);
    service = new ScanAndRideService(mockClient as unknown as WxPayClient);
  });

  it('should create user service', async () => {
    mockClient.post.mockResolvedValue({ data: { service_id: 'svc-001' } });
    const result = await service.createUserService({
      appid: 'wx123456',
      sub_mchid: '1900000100',
      out_request_no: 'REQ001',
      openid: 'user-001',
      service_id: 'svc-001',
    });
    expect(mockClient.post).toHaveBeenCalled();
    expect(result.data.service_id).toBe('svc-001');
  });

  it('should query user service', async () => {
    mockClient.get.mockResolvedValue({ data: { status: 'ACTIVE' } });
    const result = await service.queryUserService('REQ001', {
      sub_mchid: '1900000100',
      service_id: 'svc-001',
    });
    expect(mockClient.get).toHaveBeenCalled();
    expect(result.data.status).toBe('ACTIVE');
  });

  it('should create transaction', async () => {
    mockClient.post.mockResolvedValue({ data: { transaction_id: 'tx-001' } });
    const result = await service.createTransaction({
      appid: 'wx123456',
      sub_mchid: '1900000100',
      out_trade_no: 'TRADE001',
      description: '乘车费用',
      notify_url: 'https://example.com/notify',
      amount: { total: 500 },
      openid: 'user-001',
      service_id: 'svc-001',
    });
    expect(mockClient.post).toHaveBeenCalled();
    expect(result.data.transaction_id).toBe('tx-001');
  });

  it('should query transaction', async () => {
    mockClient.get.mockResolvedValue({ data: { transaction_id: 'tx-001' } });
    const result = await service.queryTransaction('TRADE001', { sub_mchid: '1900000100' });
    expect(mockClient.get).toHaveBeenCalled();
    expect(result.data.transaction_id).toBe('tx-001');
  });
});
