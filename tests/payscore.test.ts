import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayScoreService } from '../src/services/payscore.js';
import { WxPayClient } from '../src/core/client.js';
import type {
  CreatePayScoreOrderRequest,
  QueryPayScoreOrderParams,
  CancelPayScoreOrderRequest,
  CompletePayScoreOrderRequest,
  ModifyPayScoreOrderRequest,
  SyncPayScoreOrderRequest,
} from '../src/types/index.js';

// Mock the WxPayClient
vi.mock('../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('PayScoreService', () => {
  let service: PayScoreService;
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

    service = new PayScoreService(mockClient as unknown as WxPayClient);
  });

  describe('createOrder', () => {
    it('should call POST /v3/payscore/serviceorder with correct parameters', async () => {
      const request: CreatePayScoreOrderRequest = {
        out_order_no: '1234323JKHDFE1243252',
        appid: 'wxd678efh567hg6787',
        service_id: '2002000000000558128851361561536',
        service_introduction: 'XX充电宝',
        time_range: {
          start_time: '20091225091010',
          end_time: '20091225121010',
        },
        risk_fund: {
          name: 'ESTIMATE_ORDER_COST',
          amount: 10000,
          description: '预估服务费',
        },
        notify_url: 'https://api.test.com',
        post_payments: [
          {
            name: '充电服务费',
            amount: 4000,
            description: '充电2小时',
            count: 1,
          },
        ],
        post_discounts: [
          {
            name: '首单优惠',
            description: '新用户立减',
            amount: 100,
            count: 1,
          },
        ],
        location: {
          start_location: '深圳市南山区科技园',
          end_location: '深圳市南山区科技园',
        },
        attach: 'custom_data',
        need_user_confirm: true,
        device: {
          start_device_id: 'DEVICE001',
          end_device_id: 'DEVICE001',
          materiel_no: 'https://example.com/materiel.jpg',
        },
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          appid: 'wxd678efh567hg6787',
          mchid: '1230000109',
          out_order_no: '1234323JKHDFE1243252',
          service_id: '2002000000000558128851361561536',
          service_introduction: 'XX充电宝',
          state: 'CREATED' as const,
          risk_fund: {
            name: 'ESTIMATE_ORDER_COST' as const,
            amount: 10000,
            description: '预估服务费',
          },
          time_range: {
            start_time: '20091225091010',
            end_time: '20091225121010',
          },
          notify_url: 'https://api.test.com',
          order_id: '0000300001201908301055157220022',
          package: 'xxxxxxxxxxxxxxxx',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/payscore/serviceorder',
        request,
      );
      expect(result).toEqual(expectedResponse);
      expect(result.data.state).toBe('CREATED');
      expect(result.data.package).toBe('xxxxxxxxxxxxxxxx');
    });
  });

  describe('queryOrder', () => {
    it('should call GET with out_order_no', async () => {
      const params: QueryPayScoreOrderParams = {
        out_order_no: '1234323JKHDFE1243252',
        service_id: '2002000000000558128851361561536',
        appid: 'wxd678efh567hg6787',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          appid: 'wxd678efh567hg6787',
          mchid: '1230000109',
          out_order_no: '1234323JKHDFE1243252',
          service_id: '2002000000000558128851361561536',
          service_introduction: 'XX充电宝',
          state: 'DOING' as const,
          state_description: 'MCH_COMPLETE' as const,
          risk_fund: {
            name: 'ESTIMATE_ORDER_COST' as const,
            amount: 10000,
            description: '预估服务费',
          },
          time_range: {
            start_time: '20091225091010',
            end_time: '20091225121010',
          },
          notify_url: 'https://api.test.com',
          order_id: '0000300001201908301055157220022',
          package: 'xxxxxxxxxxxxxxxx',
          total_amount: 4000,
          need_collection: true,
          collection: {
            state: 'USER_PAYING' as const,
            total_amount: 4000,
            paying_amount: 4000,
            paid_amount: 0,
          },
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryOrder(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/payscore/serviceorder',
        {
          service_id: '2002000000000558128851361561536',
          appid: 'wxd678efh567hg6787',
          out_order_no: '1234323JKHDFE1243252',
        },
      );
      expect(result.data.state).toBe('DOING');
    });

    it('should call GET with query_id', async () => {
      const params: QueryPayScoreOrderParams = {
        query_id: '15646546545165651651',
        service_id: '2002000000000558128851361561536',
        appid: 'wxd678efh567hg6787',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {},
      });

      await service.queryOrder(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/payscore/serviceorder',
        {
          service_id: '2002000000000558128851361561536',
          appid: 'wxd678efh567hg6787',
          query_id: '15646546545165651651',
        },
      );
    });
  });

  describe('cancelOrder', () => {
    it('should call POST /v3/payscore/serviceorder/{out_order_no}/cancel', async () => {
      const outOrderNo = '1234323JKHDFE1243252';
      const request: CancelPayScoreOrderRequest = {
        appid: 'wxd678efh567hg6787',
        service_id: '2002000000000558128851361561536',
        reason: '用户取消服务',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          appid: 'wxd678efh567hg6787',
          mchid: '1230000109',
          out_order_no: '1234323JKHDFE1243252',
          service_id: '2002000000000558128851361561536',
          order_id: '0000300001201908301055157220022',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.cancelOrder(outOrderNo, request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/payscore/serviceorder/1234323JKHDFE1243252/cancel',
        request,
      );
      expect(result.data.order_id).toBe('0000300001201908301055157220022');
    });
  });

  describe('completeOrder', () => {
    it('should call POST /v3/payscore/serviceorder/{out_order_no}/complete', async () => {
      const outOrderNo = '1234323JKHDFE1243252';
      const request: CompletePayScoreOrderRequest = {
        appid: 'wxd678efh567hg6787',
        service_id: '2002000000000558128851361561536',
        post_payments: [
          {
            name: '充电服务费',
            amount: 4000,
            description: '充电2小时',
            count: 1,
          },
        ],
        post_discounts: [
          {
            name: '首单优惠',
            description: '新用户立减',
            amount: 100,
            count: 1,
          },
        ],
        total_amount: 3900,
        time_range: {
          start_time: '20091225091010',
          end_time: '20091225121010',
        },
        location: {
          start_location: '深圳市南山区科技园',
          end_location: '深圳市南山区科技园',
        },
        profit_sharing: false,
        goods_tag: 'DISCOUNT',
        device: {
          start_device_id: 'DEVICE001',
          end_device_id: 'DEVICE001',
        },
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          appid: 'wxd678efh567hg6787',
          mchid: '1230000109',
          out_order_no: '1234323JKHDFE1243252',
          service_id: '2002000000000558128851361561536',
          service_introduction: 'XX充电宝',
          state: 'DOING' as const,
          state_description: 'MCH_COMPLETE' as const,
          risk_fund: {
            name: 'ESTIMATE_ORDER_COST' as const,
            amount: 10000,
            description: '预估服务费',
          },
          time_range: {
            start_time: '20091225091010',
            end_time: '20091225121010',
          },
          notify_url: 'https://api.test.com',
          order_id: '0000300001201908301055157220022',
          package: 'xxxxxxxxxxxxxxxx',
          total_amount: 3900,
          need_collection: true,
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.completeOrder(outOrderNo, request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/payscore/serviceorder/1234323JKHDFE1243252/complete',
        request,
      );
      expect(result.data.state).toBe('DOING');
      expect(result.data.total_amount).toBe(3900);
    });
  });

  describe('modifyOrder', () => {
    it('should call POST /v3/payscore/serviceorder/{out_order_no}/modify', async () => {
      const outOrderNo = '1234323JKHDFE1243252';
      const request: ModifyPayScoreOrderRequest = {
        appid: 'wxd678efh567hg6787',
        service_id: '2002000000000558128851361561536',
        post_payments: [
          {
            name: '充电服务费',
            amount: 3000,
            description: '充电1.5小时',
            count: 1,
          },
        ],
        total_amount: 3000,
        reason: '实际服务时间少于预期',
        device: {
          start_device_id: 'DEVICE001',
          end_device_id: 'DEVICE001',
        },
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          appid: 'wxd678efh567hg6787',
          mchid: '1230000109',
          out_order_no: '1234323JKHDFE1243252',
          service_id: '2002000000000558128851361561536',
          service_introduction: 'XX充电宝',
          state: 'DOING' as const,
          state_description: 'MCH_COMPLETE' as const,
          risk_fund: {
            name: 'ESTIMATE_ORDER_COST' as const,
            amount: 10000,
          },
          time_range: {
            start_time: '20091225091010',
            end_time: '20091225121010',
          },
          notify_url: 'https://api.test.com',
          order_id: '0000300001201908301055157220022',
          package: 'xxxxxxxxxxxxxxxx',
          total_amount: 3000,
          need_collection: true,
          collection: {
            state: 'USER_PAYING' as const,
            total_amount: 3000,
            paying_amount: 3000,
            paid_amount: 0,
          },
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.modifyOrder(outOrderNo, request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/payscore/serviceorder/1234323JKHDFE1243252/modify',
        request,
      );
      expect(result.data.total_amount).toBe(3000);
      expect(result.data.collection?.state).toBe('USER_PAYING');
    });
  });

  describe('syncOrder', () => {
    it('should call POST /v3/payscore/serviceorder/{out_order_no}/sync', async () => {
      const outOrderNo = '1234323JKHDFE1243252';
      const request: SyncPayScoreOrderRequest = {
        appid: 'wxd678efh567hg6787',
        service_id: '2002000000000558128851361561536',
        type: 'Order_Paid',
        detail: {
          paid_time: '20091225091210',
        },
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          appid: 'wxd678efh567hg6787',
          mchid: '1230000109',
          out_order_no: '1234323JKHDFE1243252',
          service_id: '2002000000000558128851361561536',
          service_introduction: 'XX充电宝',
          state: 'DONE' as const,
          risk_fund: {
            name: 'ESTIMATE_ORDER_COST' as const,
            amount: 10000,
          },
          time_range: {
            start_time: '20091225091010',
            end_time: '20091225121010',
          },
          notify_url: 'https://api.test.com',
          order_id: '0000300001201908301055157220022',
          package: 'xxxxxxxxxxxxxxxx',
          total_amount: 4000,
          need_collection: true,
          collection: {
            state: 'USER_PAID' as const,
            total_amount: 4000,
            paying_amount: 0,
            paid_amount: 4000,
            details: [
              {
                seq: 1,
                amount: 4000,
                paid_type: 'MCH',
                paid_time: '20091225091210',
                transaction_id: '4200001234567890',
              },
            ],
          },
          openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.syncOrder(outOrderNo, request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/payscore/serviceorder/1234323JKHDFE1243252/sync',
        request,
      );
      expect(result.data.state).toBe('DONE');
      expect(result.data.collection?.state).toBe('USER_PAID');
    });
  });
});
