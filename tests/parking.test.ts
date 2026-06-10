import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParkingService } from '../src/services/parking.js';
import { WxPayClient } from '../src/core/client.js';
import type {
  CreateParkingRequest,
  QueryPlateServiceParams,
  CreateParkingTransactionRequest,
  ApplyParkingRefundRequest,
} from '../src/types/index.js';

// Mock the WxPayClient
vi.mock('../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('ParkingService', () => {
  let service: ParkingService;
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

    service = new ParkingService(mockClient as unknown as WxPayClient);
  });

  describe('createEntry', () => {
    it('should call POST /v3/vehicle/parking/parkings with correct parameters', async () => {
      const request: CreateParkingRequest = {
        out_parking_no: 'parking_20240609_001',
        plate_number: '粤B888888',
        plate_color: 'BLUE',
        notify_url: 'https://api.example.com/parking/notify',
        start_time: '2024-06-09T10:30:00+08:00',
        parking_name: '深圳科技园停车场',
        free_duration: 900,
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          id: '50000000002024060900000000001',
          out_parking_no: 'parking_20240609_001',
          plate_number: '粤B888888',
          plate_color: 'BLUE',
          start_time: '2024-06-09T10:30:00+08:00',
          parking_name: '深圳科技园停车场',
          free_duration: 900,
          state: 'NORMAL',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createEntry(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/vehicle/parking/parkings',
        request,
      );
      expect(result).toEqual(expectedResponse);
      expect(result.data.state).toBe('NORMAL');
      expect(result.data.id).toBe('50000000002024060900000000001');
    });

    it('should return BLOCKED state with block_reason when service is unavailable', async () => {
      const request: CreateParkingRequest = {
        out_parking_no: 'parking_20240609_002',
        plate_number: '粤B999999',
        plate_color: 'GREEN',
        notify_url: 'https://api.example.com/parking/notify',
        start_time: '2024-06-09T11:00:00+08:00',
        parking_name: '深圳南山停车场',
        free_duration: 600,
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          id: '50000000002024060900000000002',
          out_parking_no: 'parking_20240609_002',
          plate_number: '粤B999999',
          plate_color: 'GREEN',
          start_time: '2024-06-09T11:00:00+08:00',
          parking_name: '深圳南山停车场',
          free_duration: 600,
          state: 'BLOCKED',
          block_reason: 'OUT_SERVICE',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createEntry(request);

      expect(result.data.state).toBe('BLOCKED');
      expect(result.data.block_reason).toBe('OUT_SERVICE');
    });
  });

  describe('queryPlateService', () => {
    it('should call GET /v3/vehicle/parking/services/find with correct parameters', async () => {
      const params: QueryPlateServiceParams = {
        appid: 'wxd678efh567hg6787',
        plate_number: '粤B888888',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        plate_color: 'BLUE',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          plate_number: '粤B888888',
          plate_color: 'BLUE',
          service_open_time: '2024-01-15T08:30:00+08:00',
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          service_state: 'NORMAL',
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryPlateService(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/vehicle/parking/services/find',
        {
          appid: 'wxd678efh567hg6787',
          plate_number: '粤B888888',
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          plate_color: 'BLUE',
        },
      );
      expect(result.data.service_state).toBe('NORMAL');
      expect(result.data.plate_number).toBe('粤B888888');
    });

    it('should return OUT_SERVICE state for unregistered plate', async () => {
      const params: QueryPlateServiceParams = {
        appid: 'wxd678efh567hg6787',
        plate_number: '粤B000000',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        plate_color: 'YELLOW',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          plate_number: '粤B000000',
          plate_color: 'YELLOW',
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          service_state: 'OUT_SERVICE',
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryPlateService(params);

      expect(result.data.service_state).toBe('OUT_SERVICE');
      expect(result.data.service_open_time).toBeUndefined();
    });
  });

  describe('createTransaction', () => {
    it('should call POST /v3/vehicle/transactions/parking with correct parameters', async () => {
      const request: CreateParkingTransactionRequest = {
        appid: 'wxd678efh567hg6787',
        description: '深圳科技园停车费',
        out_trade_no: 'PARKING_20240609_001',
        trade_scene: 'PARKING',
        notify_url: 'https://api.example.com/parking/pay_notify',
        amount: {
          total: 1500,
          currency: 'CNY',
        },
        parking_info: {
          parking_id: '50000000002024060900000000001',
          plate_number: '粤B888888',
          plate_color: 'BLUE',
          start_time: '2024-06-09T10:30:00+08:00',
          end_time: '2024-06-09T12:00:00+08:00',
          parking_name: '深圳科技园停车场',
          charging_duration: 5400,
          device_id: 'DEVICE_SHENZHEN_001',
        },
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          appid: 'wxd678efh567hg6787',
          sp_mchid: '1230000109',
          description: '深圳科技园停车费',
          create_time: '2024-06-09T12:00:01+08:00',
          out_trade_no: 'PARKING_20240609_001',
          transaction_id: '4200001234567890',
          trade_state: 'ACCEPTED',
          trade_scene: 'PARKING',
          payer: {
            openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          },
          amount: {
            total: 1500,
            currency: 'CNY',
          },
          parking_info: {
            parking_id: '50000000002024060900000000001',
            plate_number: '粤B888888',
            plate_color: 'BLUE',
            start_time: '2024-06-09T10:30:00+08:00',
            end_time: '2024-06-09T12:00:00+08:00',
            parking_name: '深圳科技园停车场',
            charging_duration: 5400,
            device_id: 'DEVICE_SHENZHEN_001',
          },
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createTransaction(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/vehicle/transactions/parking',
        request,
      );
      expect(result.data.trade_state).toBe('ACCEPTED');
      expect(result.data.transaction_id).toBe('4200001234567890');
      expect(result.data.parking_info?.parking_id).toBe('50000000002024060900000000001');
    });
  });

  describe('queryTransaction', () => {
    it('should call GET /v3/vehicle/transactions/out-trade-no/{out_trade_no}', async () => {
      const outTradeNo = 'PARKING_20240609_001';

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          appid: 'wxd678efh567hg6787',
          sp_mchid: '1230000109',
          description: '深圳科技园停车费',
          create_time: '2024-06-09T12:00:01+08:00',
          out_trade_no: 'PARKING_20240609_001',
          transaction_id: '4200001234567890',
          trade_state: 'SUCCESS',
          trade_scene: 'PARKING',
          success_time: '2024-06-09T12:00:05+08:00',
          payer: {
            openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          },
          amount: {
            total: 1500,
            currency: 'CNY',
            payer_total: 1500,
            discount_total: 0,
          },
          parking_info: {
            parking_id: '50000000002024060900000000001',
            plate_number: '粤B888888',
            plate_color: 'BLUE',
            start_time: '2024-06-09T10:30:00+08:00',
            end_time: '2024-06-09T12:00:00+08:00',
            parking_name: '深圳科技园停车场',
            charging_duration: 5400,
            device_id: 'DEVICE_SHENZHEN_001',
          },
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryTransaction(outTradeNo);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/vehicle/transactions/out-trade-no/PARKING_20240609_001',
      );
      expect(result.data.trade_state).toBe('SUCCESS');
      expect(result.data.out_trade_no).toBe('PARKING_20240609_001');
    });
  });

  describe('applyRefund', () => {
    it('should call POST /v3/refund/domestic/refunds with correct parameters', async () => {
      const request: ApplyParkingRefundRequest = {
        out_trade_no: 'PARKING_20240609_001',
        out_refund_no: 'REFUND_PARKING_20240609_001',
        reason: '用户申请退款',
        notify_url: 'https://api.example.com/parking/refund_notify',
        amount: {
          refund: 1500,
          total: 1500,
          currency: 'CNY',
        },
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '50000000002024060900000000001',
          out_refund_no: 'REFUND_PARKING_20240609_001',
          transaction_id: '4200001234567890',
          out_trade_no: 'PARKING_20240609_001',
          channel: 'ORIGINAL',
          user_received_account: '支付用户零钱',
          create_time: '2024-06-09T13:00:00+08:00',
          status: 'PROCESSING',
          funds_account: 'UNSETTLED',
          amount: {
            total: 1500,
            refund: 1500,
            payer_total: 1500,
            payer_refund: 1500,
            settlement_refund: 1500,
            settlement_total: 1500,
            discount_refund: 0,
            currency: 'CNY',
          },
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.applyRefund(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/refund/domestic/refunds',
        request,
      );
      expect(result.data.status).toBe('PROCESSING');
      expect(result.data.refund_id).toBe('50000000002024060900000000001');
      expect(result.data.amount.refund).toBe(1500);
    });
  });

  describe('queryRefund', () => {
    it('should call GET /v3/refund/domestic/refunds/{out_refund_no}', async () => {
      const outRefundNo = 'REFUND_PARKING_20240609_001';

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '50000000002024060900000000001',
          out_refund_no: 'REFUND_PARKING_20240609_001',
          transaction_id: '4200001234567890',
          out_trade_no: 'PARKING_20240609_001',
          channel: 'ORIGINAL',
          user_received_account: '支付用户零钱',
          success_time: '2024-06-09T13:00:30+08:00',
          create_time: '2024-06-09T13:00:00+08:00',
          status: 'SUCCESS',
          funds_account: 'UNSETTLED',
          amount: {
            total: 1500,
            refund: 1500,
            payer_total: 1500,
            payer_refund: 1500,
            settlement_refund: 1500,
            settlement_total: 1500,
            discount_refund: 0,
            currency: 'CNY',
          },
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryRefund(outRefundNo);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/refund/domestic/refunds/REFUND_PARKING_20240609_001',
      );
      expect(result.data.status).toBe('SUCCESS');
      expect(result.data.success_time).toBe('2024-06-09T13:00:30+08:00');
    });
  });
});
