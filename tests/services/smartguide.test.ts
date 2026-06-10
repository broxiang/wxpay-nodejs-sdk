import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartGuideService } from '../../src/services/smartguide';
import { WxPayClient } from '../../src/core/client';
import type {
  QuerySmartGuidesParams,
  RegisterSmartGuideRequest,
  UpdateSmartGuideRequest,
  AssignSmartGuideRequest,
} from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('SmartGuideService', () => {
  let service: SmartGuideService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      patch: vi.fn(),
    };

    MockWxPayClient.mockImplementation(() => mockClient);
    service = new SmartGuideService(mockClient as unknown as WxPayClient);
  });

  // ============= query =============

  describe('query', () => {
    it('should query smart guides with all parameters', async () => {
      const params: QuerySmartGuidesParams = {
        store_id: 1001,
        userid: 'zhangsan',
        mobile: '13800138000',
        work_id: 'W001',
        limit: 10,
        offset: 0,
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          total_count: 1,
          data: [{ guide_id: 'GUIDE001', name: '张三' }],
        },
      });

      const result = await service.query(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/smartguide/guides',
        expect.objectContaining({
          store_id: 1001,
          userid: 'zhangsan',
          mobile: '13800138000',
          work_id: 'W001',
          limit: 10,
          offset: 0,
        }),
      );
      expect(result.data.total_count).toBe(1);
    });

    it('should query smart guides with only required parameters', async () => {
      const params: QuerySmartGuidesParams = {
        store_id: 1001,
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: { total_count: 0, data: [] },
      });

      await service.query(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/smartguide/guides',
        expect.objectContaining({
          store_id: 1001,
        }),
      );
    });
  });

  // ============= register =============

  describe('register', () => {
    it('should register a new smart guide', async () => {
      const request: RegisterSmartGuideRequest = {
        store_id: 1001,
        userid: 'zhangsan',
        name: '加密后的姓名',
        mobile: '加密后的手机号',
        work_id: 'W001',
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: { guide_id: 'GUIDE001' },
      });

      const result = await service.register(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/smartguide/guides',
        request,
      );
      expect(result.data.guide_id).toBe('GUIDE001');
    });
  });

  // ============= update =============

  describe('update', () => {
    it('should update smart guide', async () => {
      const request: UpdateSmartGuideRequest = {
        name: '加密后的新姓名',
        work_id: 'W002',
      };

      mockClient.patch.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.update('GUIDE001', request);

      expect(mockClient.patch).toHaveBeenCalledWith(
        '/v3/smartguide/guides/GUIDE001',
        request,
      );
      expect(result.status).toBe(204);
    });
  });

  // ============= assign =============

  describe('assign', () => {
    it('should assign smart guide to order', async () => {
      const request: AssignSmartGuideRequest = {
        out_trade_no: '20240115000001',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.assign('GUIDE001', request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/smartguide/guides/GUIDE001/assign',
        request,
      );
      expect(result.status).toBe(204);
    });
  });
});
