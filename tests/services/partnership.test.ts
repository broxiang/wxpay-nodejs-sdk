import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartnershipService } from '../../src/services/partnership';
import { WxPayClient } from '../../src/core/client';
import type { BuildPartnershipRequest, QueryPartnershipsParams } from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('PartnershipService', () => {
  let service: PartnershipService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
    };

    MockWxPayClient.mockImplementation(() => mockClient);
    service = new PartnershipService(mockClient as unknown as WxPayClient);
  });

  // ============= build =============

  describe('build', () => {
    it('should build partnership with appid', async () => {
      const request: BuildPartnershipRequest = {
        partner: {
          type: 'APPID',
          appid: 'wx8888888888888888',
        },
        authorized_data: {
          business_type: 'COUPON_STOCK',
          stock_id: '1234567890',
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          partner: {
            type: 'APPID',
            appid: 'wx8888888888888888',
          },
          authorized_data: {
            business_type: 'COUPON_STOCK',
            stock_id: '1234567890',
          },
          create_time: '2024-01-15T10:00:00+08:00',
        },
      });

      const result = await service.build(request, 'idempotency-key-001');

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/marketing/partnerships/build',
        request,
        undefined,
        { 'Idempotency-Key': 'idempotency-key-001' },
      );
      expect(result.status).toBe(200);
    });

    it('should build partnership with merchant_id', async () => {
      const request: BuildPartnershipRequest = {
        partner: {
          type: 'MERCHANT',
          merchant_id: '1900000101',
        },
        authorized_data: {
          business_type: 'COUPON_STOCK',
          stock_id: '1234567890',
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          partner: {
            type: 'MERCHANT',
            merchant_id: '1900000101',
          },
          authorized_data: {
            business_type: 'COUPON_STOCK',
            stock_id: '1234567890',
          },
        },
      });

      const result = await service.build(request, 'idempotency-key-002');

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/marketing/partnerships/build',
        request,
        undefined,
        { 'Idempotency-Key': 'idempotency-key-002' },
      );
      expect(result.status).toBe(200);
    });
  });

  // ============= list =============

  describe('list', () => {
    it('should query partnerships with all parameters', async () => {
      const params: QueryPartnershipsParams = {
        authorized_data: {
          business_type: 'COUPON_STOCK',
          stock_id: '1234567890',
        },
        partner: {
          type: 'APPID',
          appid: 'wx8888888888888888',
        },
        limit: 10,
        offset: 0,
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          total_count: 1,
          data: [
            {
              partner: { type: 'APPID', appid: 'wx8888888888888888' },
              authorized_data: { business_type: 'COUPON_STOCK', stock_id: '1234567890' },
            },
          ],
        },
      });

      const result = await service.list(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/marketing/partnerships',
        expect.objectContaining({
          'authorized_data.business_type': 'COUPON_STOCK',
          'authorized_data.stock_id': '1234567890',
          'partner.type': 'APPID',
          'partner.appid': 'wx8888888888888888',
          limit: 10,
          offset: 0,
        }),
      );
      expect(result.data.total_count).toBe(1);
    });

    it('should query partnerships with only required parameters', async () => {
      const params: QueryPartnershipsParams = {
        authorized_data: {
          business_type: 'COUPON_STOCK',
        },
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: { total_count: 0, data: [] },
      });

      await service.list(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/marketing/partnerships',
        expect.objectContaining({
          'authorized_data.business_type': 'COUPON_STOCK',
        }),
      );
    });

    it('should query partnerships with merchant partner', async () => {
      const params: QueryPartnershipsParams = {
        authorized_data: {
          business_type: 'COUPON_STOCK',
        },
        partner: {
          type: 'MERCHANT',
          merchant_id: '1900000101',
        },
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: { total_count: 0, data: [] },
      });

      await service.list(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/marketing/partnerships',
        expect.objectContaining({
          'partner.type': 'MERCHANT',
          'partner.merchant_id': '1900000101',
        }),
      );
    });
  });
});
