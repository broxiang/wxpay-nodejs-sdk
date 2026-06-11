import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessCircleService } from '../../src/services/businesscircle';
import { WxPayClient } from '../../src/core/client';
import type {
  SyncBusinessCirclePointsRequest,
  QueryBusinessCirclePendingPointsParams,
  SyncBusinessCircleParkingStatusRequest,
} from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('BusinessCircleService', () => {
  let service: BusinessCircleService;
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
    service = new BusinessCircleService(mockClient as unknown as WxPayClient);
  });

  // ============= syncPoints =============

  describe('syncPoints', () => {
    it('should sync points successfully', async () => {
      const request: SyncBusinessCirclePointsRequest = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        points: 100,
        remark: '消费积分',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.syncPoints(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/businesscircle/points/notify', request);
      expect(result.status).toBe(204);
    });

    it('should sync negative points (deduction)', async () => {
      const request: SyncBusinessCirclePointsRequest = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        points: -50,
        remark: '积分抵扣',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.syncPoints(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/businesscircle/points/notify', request);
      expect(result.status).toBe(204);
    });
  });

  // ============= queryAuthorization =============

  describe('queryAuthorization', () => {
    it('should query authorization status', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          appid: 'wx8888888888888888',
          authorization: true,
        },
      });

      const result = await service.queryAuthorization(
        'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        'wx8888888888888888',
      );

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/businesscircle/user-authorizations/oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        { appid: 'wx8888888888888888' },
      );
      expect(result.data.authorization).toBe(true);
    });

    it('should query unauthorized status', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          appid: 'wx8888888888888888',
          authorization: false,
        },
      });

      const result = await service.queryAuthorization(
        'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        'wx8888888888888888',
      );

      expect(result.data.authorization).toBe(false);
    });
  });

  // ============= queryPendingPoints =============

  describe('queryPendingPoints', () => {
    it('should query pending points', async () => {
      const params: QueryBusinessCirclePendingPointsParams = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        transaction_id: '1217752501201407033233368018',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          appid: 'wx8888888888888888',
          transaction_id: '1217752501201407033233368018',
          total: 100,
        },
      });

      const result = await service.queryPendingPoints(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/businesscircle/users/pending-points', {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        transaction_id: '1217752501201407033233368018',
      });
      expect(result.data.total).toBe(100);
    });
  });

  // ============= syncParkingStatus =============

  describe('syncParkingStatus', () => {
    it('should sync parking entry status', async () => {
      const request: SyncBusinessCircleParkingStatusRequest = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        plate_number: '粤B12345',
        plate_color: 'BLUE',
        start_time: '2024-01-15T10:00:00+08:00',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.syncParkingStatus(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/businesscircle/parkings', request);
      expect(result.status).toBe(204);
    });

    it('should sync parking exit status', async () => {
      const request: SyncBusinessCircleParkingStatusRequest = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        plate_number: '粤B12345',
        plate_color: 'BLUE',
        start_time: '2024-01-15T10:00:00+08:00',
        end_time: '2024-01-15T12:00:00+08:00',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.syncParkingStatus(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/businesscircle/parkings', request);
      expect(result.status).toBe(204);
    });
  });
});
