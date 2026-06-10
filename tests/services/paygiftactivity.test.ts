import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayGiftActivityService } from '../../src/services/paygiftactivity';
import { WxPayClient } from '../../src/core/client';
import type {
  CreatePayGiftActivityRequest,
  QueryPayGiftActivitiesParams,
} from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('PayGiftActivityService', () => {
  let service: PayGiftActivityService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };

    MockWxPayClient.mockImplementation(() => mockClient);
    service = new PayGiftActivityService(mockClient as unknown as WxPayClient);
  });

  // ============= create =============

  describe('create', () => {
    it('should create a pay gift activity', async () => {
      const request: CreatePayGiftActivityRequest = {
        out_request_no: 'ACT20240115000001',
        activity_name: '满100送10元券',
        merchant_id: '1900000100',
        begin_time: '2024-01-15T00:00:00+08:00',
        end_time: '2024-02-15T23:59:59+08:00',
        award_type: 'COUPON',
        stock_id: '1234567890',
        payment_minimum: 10000,
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          activity_id: 'ACT001',
          create_time: '2024-01-15T10:00:00+08:00',
        },
      });

      const result = await service.create(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/marketing/paygiftactivity/unique-threshold-activity',
        request,
      );
      expect(result.status).toBe(200);
      expect(result.data.activity_id).toBe('ACT001');
    });
  });

  // ============= get =============

  describe('get', () => {
    it('should get activity detail', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          activity_id: 'ACT001',
          activity_name: '满100送10元券',
          activity_state: 'PENDING',
        },
      });

      const result = await service.get('ACT001');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/marketing/paygiftactivity/activities/ACT001',
      );
      expect(result.data.activity_id).toBe('ACT001');
    });
  });

  // ============= list =============

  describe('list', () => {
    it('should list activities with parameters', async () => {
      const params: QueryPayGiftActivitiesParams = {
        activity_state: 'PENDING',
        limit: 10,
        offset: 0,
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          total_count: 1,
          data: [{ activity_id: 'ACT001' }],
        },
      });

      const result = await service.list(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/marketing/paygiftactivity/activities',
        expect.objectContaining({
          activity_state: 'PENDING',
          limit: 10,
          offset: 0,
        }),
      );
      expect(result.data.total_count).toBe(1);
    });

    it('should list activities without parameters', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: { total_count: 0, data: [] },
      });

      const result = await service.list();

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/marketing/paygiftactivity/activities',
        expect.any(Object),
      );
      expect(result.data.total_count).toBe(0);
    });
  });

  // ============= terminate =============

  describe('terminate', () => {
    it('should terminate an activity', async () => {
      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.terminate('ACT001');

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/marketing/paygiftactivity/activities/ACT001/terminate',
      );
      expect(result.status).toBe(204);
    });
  });

  // ============= getMerchants =============

  describe('getMerchants', () => {
    it('should get activity merchants', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          merchant_id_list: ['1900000100', '1900000101'],
        },
      });

      const result = await service.getMerchants('ACT001');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/marketing/paygiftactivity/activities/ACT001/merchant',
      );
      expect(result.data.merchant_id_list).toHaveLength(2);
    });
  });

  // ============= addMerchant =============

  describe('addMerchant', () => {
    it('should add merchant to activity', async () => {
      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.addMerchant('ACT001', ['1900000102']);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/marketing/paygiftactivity/activities/ACT001/merchant',
        { merchant_id_list: ['1900000102'] },
      );
      expect(result.status).toBe(204);
    });
  });

  // ============= deleteMerchant =============

  describe('deleteMerchant', () => {
    it('should delete merchant from activity', async () => {
      mockClient.delete.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.deleteMerchant('ACT001', '1900000102');

      expect(mockClient.delete).toHaveBeenCalledWith(
        '/v3/marketing/paygiftactivity/activities/ACT001/merchant/1900000102',
      );
      expect(result.status).toBe(204);
    });
  });

  // ============= getGoods =============

  describe('getGoods', () => {
    it('should get activity goods list', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          goods_list: [{ goods_id: 'GOODS001', goods_name: '测试商品' }],
        },
      });

      const result = await service.getGoods('ACT001');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/marketing/paygiftactivity/activities/ACT001/goods',
      );
      expect(result.data.goods_list).toHaveLength(1);
    });
  });
});
