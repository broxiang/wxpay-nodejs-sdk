import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CouponService } from '../src/services/coupon.js';
import type {
  CreateCouponStockRequest,
  ActivateCouponStockRequest,
  SendCouponRequest,
  PauseCouponStockRequest,
  RestartCouponStockRequest,
  QueryCouponStocksParams,
  QueryCouponDetailParams,
  QueryCouponStockMerchantsParams,
  QueryCouponStockItemsParams,
  QueryUserCouponsParams,
  SetCouponCallbackRequest,
} from '../src/types/index.js';

// Mock WxPayClient
const mockPost = vi.fn();
const mockGet = vi.fn();
const mockClient = {
  post: mockPost,
  get: mockGet,
  mchid: '1900000001',
} as unknown as import('../src/core/client.js').WxPayClient;

describe('CouponService', () => {
  let service: CouponService;

  beforeEach(() => {
    service = new CouponService(mockClient);
    vi.clearAllMocks();
  });

  // ============= 批次管理 =============

  describe('createStock', () => {
    it('should call POST /v3/marketing/favor/coupon-stocks', async () => {
      const request: CreateCouponStockRequest = {
        stock_name: '测试批次',
        belong_merchant: '1900000001',
        available_begin_time: '2025-01-01T00:00:00.000+08:00',
        available_end_time: '2025-01-31T23:59:59.000+08:00',
        stock_use_rule: {
          max_coupons: 100,
          max_amount: 10000,
          max_coupons_per_user: 1,
          natural_person_limit: false,
          prevent_api_abuse: false,
        },
        coupon_use_rule: {
          fixed_normal_coupon: {
            coupon_amount: 100,
            transaction_minimum: 200,
          },
          available_merchants: ['1900000001'],
        },
        no_cash: false,
        stock_type: 'NORMAL',
        out_request_no: '190000000120250101001',
      };

      const mockResponse = {
        stock_id: '9856000',
        create_time: '2025-01-01T00:00:00.000+08:00',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.createStock(request);

      expect(mockPost).toHaveBeenCalledWith('/v3/marketing/favor/coupon-stocks', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('activateStock', () => {
    it('should call POST /v3/marketing/favor/stocks/{stock_id}/start', async () => {
      const request: ActivateCouponStockRequest = {
        stock_creator_mchid: '1900000001',
      };

      const mockResponse = {
        start_time: '2025-01-01T00:00:00.000+08:00',
        stock_id: '9856000',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.activateStock('9856000', request);

      expect(mockPost).toHaveBeenCalledWith('/v3/marketing/favor/stocks/9856000/start', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('pauseStock', () => {
    it('should call POST /v3/marketing/favor/stocks/{stock_id}/pause', async () => {
      const request: PauseCouponStockRequest = {
        stock_creator_mchid: '1900000001',
      };

      const mockResponse = {
        pause_time: '2025-01-15T12:00:00.000+08:00',
        stock_id: '9856000',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.pauseStock('9856000', request);

      expect(mockPost).toHaveBeenCalledWith('/v3/marketing/favor/stocks/9856000/pause', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('restartStock', () => {
    it('should call POST /v3/marketing/favor/stocks/{stock_id}/restart', async () => {
      const request: RestartCouponStockRequest = {
        stock_creator_mchid: '1900000001',
      };

      const mockResponse = {
        restart_time: '2025-01-16T00:00:00.000+08:00',
        stock_id: '9856000',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.restartStock('9856000', request);

      expect(mockPost).toHaveBeenCalledWith('/v3/marketing/favor/stocks/9856000/restart', request);
      expect(result).toEqual(mockResponse);
    });
  });

  // ============= 发放 =============

  describe('sendCoupon', () => {
    it('should call POST /v3/marketing/favor/users/{openid}/coupons', async () => {
      const request: SendCouponRequest = {
        stock_id: '9856000',
        out_request_no: '190000000120250101001',
        appid: 'wx233544546545989',
        stock_creator_mchid: '1900000001',
      };

      const mockResponse = {
        coupon_id: '9867041',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.sendCoupon('o4GgauInH_RCEdvrrNGrntXDu6D4', request);

      expect(mockPost).toHaveBeenCalledWith(
        '/v3/marketing/favor/users/o4GgauInH_RCEdvrrNGrntXDu6D4/coupons',
        request,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // ============= 查询 =============

  describe('queryStocks', () => {
    it('should call GET /v3/marketing/favor/stocks', async () => {
      const params: QueryCouponStocksParams = {
        offset: 0,
        limit: 10,
        stock_creator_mchid: '1900000001',
      };

      const mockResponse = {
        total_count: 1,
        data: [
          {
            stock_id: '9856000',
            stock_creator_mchid: '1900000001',
            stock_name: '测试批次',
            status: 'running',
            create_time: '2025-01-01T00:00:00.000+08:00',
            description: '测试活动',
            available_begin_time: '2025-01-01T00:00:00.000+08:00',
            available_end_time: '2025-01-31T23:59:59.000+08:00',
            distributed_coupons: 10,
            no_cash: false,
            singleitem: false,
            stock_type: 'NORMAL',
          },
        ],
        limit: 10,
        offset: 0,
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryStocks(params);

      expect(mockGet).toHaveBeenCalledWith('/v3/marketing/favor/stocks', params);
      expect(result).toEqual(mockResponse);
    });

    it('should pass optional filter params', async () => {
      const params: QueryCouponStocksParams = {
        offset: 0,
        limit: 10,
        stock_creator_mchid: '1900000001',
        status: 'running',
        create_start_time: '2025-01-01T00:00:00+08:00',
        create_end_time: '2025-01-31T23:59:59+08:00',
      };

      mockGet.mockResolvedValue({ total_count: 0, limit: 10, offset: 0 });

      await service.queryStocks(params);

      expect(mockGet).toHaveBeenCalledWith('/v3/marketing/favor/stocks', params);
    });
  });

  describe('queryStockDetail', () => {
    it('should call GET /v3/marketing/favor/stocks/{stock_id}', async () => {
      const mockResponse = {
        stock_id: '9856000',
        stock_creator_mchid: '1900000001',
        stock_name: '测试批次',
        status: 'running',
        create_time: '2025-01-01T00:00:00.000+08:00',
        description: '测试活动',
        available_begin_time: '2025-01-01T00:00:00.000+08:00',
        available_end_time: '2025-01-31T23:59:59.000+08:00',
        distributed_coupons: 10,
        no_cash: false,
        singleitem: false,
        stock_type: 'NORMAL',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryStockDetail('9856000', {
        stock_creator_mchid: '1900000001',
      });

      expect(mockGet).toHaveBeenCalledWith('/v3/marketing/favor/stocks/9856000', {
        stock_creator_mchid: '1900000001',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryCouponDetail', () => {
    it('should call GET /v3/marketing/favor/users/{openid}/coupons/{coupon_id}', async () => {
      const params: QueryCouponDetailParams = {
        appid: 'wx233544546545989',
      };

      const mockResponse = {
        stock_creator_mchid: '1900000001',
        stock_id: '9856000',
        coupon_id: '9867041',
        coupon_name: '测试券',
        status: 'SENDED',
        description: '测试活动',
        create_time: '2025-01-01T00:00:00.000+08:00',
        coupon_type: 'NORMAL',
        no_cash: false,
        available_begin_time: '2025-01-01T00:00:00.000+08:00',
        available_end_time: '2025-01-31T23:59:59.000+08:00',
        singleitem: false,
        normal_coupon_information: {
          coupon_amount: 100,
          transaction_minimum: 200,
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryCouponDetail(
        'o4GgauInH_RCEdvrrNGrntXDu6D4',
        '9867041',
        params,
      );

      expect(mockGet).toHaveBeenCalledWith(
        '/v3/marketing/favor/users/o4GgauInH_RCEdvrrNGrntXDu6D4/coupons/9867041',
        params,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryStockMerchants', () => {
    it('should call GET /v3/marketing/favor/stocks/{stock_id}/merchants', async () => {
      const params: QueryCouponStockMerchantsParams = {
        offset: 0,
        limit: 10,
        stock_creator_mchid: '1900000001',
      };

      const mockResponse = {
        total_count: 2,
        data: ['1900000001', '1900000002'],
        offset: 0,
        limit: 10,
        stock_id: '9856000',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryStockMerchants('9856000', params);

      expect(mockGet).toHaveBeenCalledWith('/v3/marketing/favor/stocks/9856000/merchants', params);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryStockItems', () => {
    it('should call GET /v3/marketing/favor/stocks/{stock_id}/items', async () => {
      const params: QueryCouponStockItemsParams = {
        offset: 0,
        limit: 10,
        stock_creator_mchid: '1900000001',
      };

      const mockResponse = {
        total_count: 2,
        data: ['item001', 'item002'],
        offset: 0,
        limit: 10,
        stock_id: '9856000',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryStockItems('9856000', params);

      expect(mockGet).toHaveBeenCalledWith('/v3/marketing/favor/stocks/9856000/items', params);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryUserCoupons', () => {
    it('should call GET /v3/marketing/favor/users/{openid}/coupons', async () => {
      const params: QueryUserCouponsParams = {
        appid: 'wx233544546545989',
      };

      const mockResponse = {
        total_count: 1,
        data: [
          {
            stock_creator_mchid: '1900000001',
            stock_id: '9856000',
            coupon_id: '9867041',
            coupon_name: '测试券',
            status: 'SENDED',
            description: '测试活动',
            create_time: '2025-01-01T00:00:00.000+08:00',
            coupon_type: 'NORMAL',
            no_cash: false,
            available_begin_time: '2025-01-01T00:00:00.000+08:00',
            available_end_time: '2025-01-31T23:59:59.000+08:00',
            singleitem: false,
            normal_coupon_information: {
              coupon_amount: 100,
              transaction_minimum: 200,
            },
          },
        ],
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryUserCoupons('o4GgauInH_RCEdvrrNGrntXDu6D4', params);

      expect(mockGet).toHaveBeenCalledWith(
        '/v3/marketing/favor/users/o4GgauInH_RCEdvrrNGrntXDu6D4/coupons',
        params,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should pass optional filter params', async () => {
      const params: QueryUserCouponsParams = {
        appid: 'wx233544546545989',
        creator_mchid: '1900000001',
        status: 'SENDED',
        offset: 0,
        limit: 20,
      };

      mockGet.mockResolvedValue({ total_count: 0, data: [] });

      await service.queryUserCoupons('o4GgauInH_RCEdvrrNGrntXDu6D4', params);

      expect(mockGet).toHaveBeenCalledWith(
        '/v3/marketing/favor/users/o4GgauInH_RCEdvrrNGrntXDu6D4/coupons',
        params,
      );
    });
  });

  // ============= 明细下载 =============

  describe('downloadUseFlow', () => {
    it('should call GET /v3/marketing/favor/stocks/{stock_id}/use-flow', async () => {
      const mockResponse = {
        url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
        hash_value: '8ae0eb442c408d2e90d669d6f4ad6b7e6e049d6f',
        hash_type: 'SHA1',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.downloadUseFlow('9856000');

      expect(mockGet).toHaveBeenCalledWith('/v3/marketing/favor/stocks/9856000/use-flow');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('downloadRefundFlow', () => {
    it('should call GET /v3/marketing/favor/stocks/{stock_id}/refund-flow', async () => {
      const mockResponse = {
        url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
        hash_value: '8ae0eb442c408d2e90d669d6f4ad6b7e6e049d6f',
        hash_type: 'SHA1',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.downloadRefundFlow('9856000');

      expect(mockGet).toHaveBeenCalledWith('/v3/marketing/favor/stocks/9856000/refund-flow');
      expect(result).toEqual(mockResponse);
    });
  });

  // ============= 通知设置 =============

  describe('setCallback', () => {
    it('should call POST /v3/marketing/favor/callbacks', async () => {
      const request: SetCouponCallbackRequest = {
        mchid: '1900000001',
        notify_url: 'https://pay.example.com/callback',
      };

      const mockResponse = {
        update_time: '2025-01-01T00:00:00.000+08:00',
        notify_url: 'https://pay.example.com/callback',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.setCallback(request);

      expect(mockPost).toHaveBeenCalledWith('/v3/marketing/favor/callbacks', request);
      expect(result).toEqual(mockResponse);
    });

    it('should pass switch option', async () => {
      const request: SetCouponCallbackRequest = {
        mchid: '1900000001',
        notify_url: 'https://pay.example.com/callback',
        switch: true,
      };

      mockPost.mockResolvedValue({
        update_time: '2025-01-01T00:00:00.000+08:00',
        notify_url: 'https://pay.example.com/callback',
      });

      await service.setCallback(request);

      expect(mockPost).toHaveBeenCalledWith('/v3/marketing/favor/callbacks', request);
    });
  });
});
