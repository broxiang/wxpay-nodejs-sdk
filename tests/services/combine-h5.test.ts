import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombineH5Service } from '../../src/services/combine-h5.js';
import { WxPayClient } from '../../src/core/client.js';
import type {
  CreateH5CombineOrderRequest,
  CloseCombineOrderRequest,
  CreateRefundRequest,
} from '../../src/types/index.js';

// Mock the WxPayClient
vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('CombineH5Service', () => {
  let service: CombineH5Service;
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

    service = new CombineH5Service(mockClient as unknown as WxPayClient);
  });

  describe('createOrder', () => {
    it('should call POST /v3/combine-transactions/h5 with correct parameters', async () => {
      const request: CreateH5CombineOrderRequest = {
        combine_appid: 'wxd678efh567hg6787',
        combine_mchid: '1230000109',
        combine_out_trade_no: 'H5_COMBINE_20240609_001',
        notify_url: 'https://yourapp.com/notify',
        sub_orders: [
          {
            mchid: '1230000109',
            out_trade_no: 'SUB_ORDER_001',
            description: '腾讯充值中心-QQ会员充值',
            amount: { total_amount: 10, currency: 'CNY' },
            attach: '深圳分店',
            settle_info: { profit_sharing: false },
            goods_tag: 'WXG',
          },
          {
            mchid: '1230000110',
            out_trade_no: 'SUB_ORDER_002',
            description: '腾讯充值中心-视频会员',
            amount: { total_amount: 20, currency: 'CNY' },
            attach: '广州分店',
          },
        ],
        scene_info: {
          payer_client_ip: '14.17.22.32',
          device_id: 'POS1:1',
          h5_info: {
            type: 'Wap',
            app_name: '腾讯充值中心',
            app_url: 'https://pay.qq.com',
          },
        },
        time_expire: '2024-06-09T23:59:59+08:00',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          h5_url:
            'https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=wx2016121516420242444321ca0631331346&package=1405458241',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/combine-transactions/h5', request);
      expect(result).toEqual(expectedResponse);
      expect(result.data.h5_url).toContain('prepay_id=');
    });

    it('should handle H5 order with iOS scene info', async () => {
      const request: CreateH5CombineOrderRequest = {
        combine_appid: 'wxd678efh567hg6787',
        combine_mchid: '1230000109',
        combine_out_trade_no: 'H5_IOS_ORDER_001',
        notify_url: 'https://yourapp.com/notify',
        sub_orders: [
          {
            mchid: '1230000109',
            out_trade_no: 'IOS_SUB_001',
            description: 'iOS 应用内购买',
            amount: { total_amount: 30, currency: 'CNY' },
            attach: 'iOS订单',
          },
          {
            mchid: '1230000110',
            out_trade_no: 'IOS_SUB_002',
            description: 'iOS 应用内购买-附加',
            amount: { total_amount: 15, currency: 'CNY' },
            attach: 'iOS订单附加',
          },
        ],
        scene_info: {
          payer_client_ip: '192.168.1.100',
          h5_info: {
            type: 'iOS',
            bundle_id: 'com.tencent.qq',
          },
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          h5_url: 'https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=wx_ios_001',
        },
      });

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/combine-transactions/h5', request);
      expect(result.data.h5_url).toBeDefined();
    });

    it('should handle H5 order with Android scene info', async () => {
      const request: CreateH5CombineOrderRequest = {
        combine_appid: 'wxd678efh567hg6787',
        combine_mchid: '1230000109',
        combine_out_trade_no: 'H5_ANDROID_ORDER_001',
        notify_url: 'https://yourapp.com/notify',
        sub_orders: [
          {
            mchid: '1230000109',
            out_trade_no: 'ANDROID_SUB_001',
            description: 'Android 应用内购买',
            amount: { total_amount: 50, currency: 'CNY' },
            attach: 'Android订单',
          },
          {
            mchid: '1230000110',
            out_trade_no: 'ANDROID_SUB_002',
            description: 'Android 应用内购买-附加',
            amount: { total_amount: 25, currency: 'CNY' },
            attach: 'Android订单附加',
          },
        ],
        scene_info: {
          payer_client_ip: '10.0.0.1',
          h5_info: {
            type: 'Android',
            package_name: 'com.tencent.qq',
          },
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          h5_url: 'https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=wx_android_001',
        },
      });

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/combine-transactions/h5', request);
      expect(result.data.h5_url).toBeDefined();
    });
  });

  describe('queryOrderById', () => {
    it('should call GET /v3/combine-transactions/out-trade-no/{combineOutTradeNo}', async () => {
      const params = {
        combineOutTradeNo: 'H5_COMBINE_20240609_001',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          combine_appid: 'wxd678efh567hg6787',
          combine_mchid: '1230000109',
          combine_out_trade_no: 'H5_COMBINE_20240609_001',
          combine_payer_info: {
            openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
          },
          scene_info: {
            device_id: 'POS1:1',
          },
          sub_orders: [
            {
              mchid: '1230000109',
              out_trade_no: 'SUB_ORDER_001',
              trade_state: 'SUCCESS' as const,
              transaction_id: '4200001234567890',
              trade_type: 'MWEB' as const,
              bank_type: 'OTHERS',
              attach: '深圳分店',
              success_time: '2024-06-09T12:00:00+08:00',
              amount: {
                total_amount: 10,
                payer_amount: 9,
                currency: 'CNY',
              },
            },
            {
              mchid: '1230000110',
              out_trade_no: 'SUB_ORDER_002',
              trade_state: 'SUCCESS' as const,
              transaction_id: '4200001234567891',
              trade_type: 'MWEB' as const,
              bank_type: 'OTHERS',
              attach: '广州分店',
              success_time: '2024-06-09T12:00:00+08:00',
              amount: {
                total_amount: 20,
                payer_amount: 18,
                currency: 'CNY',
              },
            },
          ],
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryOrderById(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/combine-transactions/out-trade-no/H5_COMBINE_20240609_001',
      );
      expect(result.data.combine_out_trade_no).toBe('H5_COMBINE_20240609_001');
      expect(result.data.sub_orders).toHaveLength(2);
      expect(result.data.sub_orders?.[0]?.trade_state).toBe('SUCCESS');
    });

    it('should return NOTPAY state for unpaid orders', async () => {
      const params = {
        combineOutTradeNo: 'H5_UNPAID_ORDER',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          combine_appid: 'wxd678efh567hg6787',
          combine_mchid: '1230000109',
          combine_out_trade_no: 'H5_UNPAID_ORDER',
          sub_orders: [
            {
              mchid: '1230000109',
              out_trade_no: 'SUB_ORDER_001',
              trade_state: 'NOTPAY' as const,
            },
            {
              mchid: '1230000110',
              out_trade_no: 'SUB_ORDER_002',
              trade_state: 'NOTPAY' as const,
            },
          ],
        },
      });

      const result = await service.queryOrderById(params);

      expect(result.data.sub_orders?.[0]?.trade_state).toBe('NOTPAY');
    });

    it('should return CLOSED state for closed orders', async () => {
      const params = {
        combineOutTradeNo: 'H5_CLOSED_ORDER',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          combine_appid: 'wxd678efh567hg6787',
          combine_mchid: '1230000109',
          combine_out_trade_no: 'H5_CLOSED_ORDER',
          sub_orders: [
            {
              mchid: '1230000109',
              out_trade_no: 'SUB_ORDER_001',
              trade_state: 'CLOSED' as const,
            },
            {
              mchid: '1230000110',
              out_trade_no: 'SUB_ORDER_002',
              trade_state: 'CLOSED' as const,
            },
          ],
        },
      });

      const result = await service.queryOrderById(params);

      expect(result.data.sub_orders?.[0]?.trade_state).toBe('CLOSED');
    });
  });

  describe('closeOrder', () => {
    it('should call POST /v3/combine-transactions/out-trade-no/{combineOutTradeNo}/close', async () => {
      const params = {
        combineOutTradeNo: 'H5_COMBINE_20240609_001',
      };

      const request: CloseCombineOrderRequest = {
        combine_appid: 'wxd678efh567hg6787',
        sub_orders: [
          {
            mchid: '1230000109',
            out_trade_no: 'SUB_ORDER_001',
          },
          {
            mchid: '1230000110',
            out_trade_no: 'SUB_ORDER_002',
          },
        ],
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.closeOrder(params, request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/combine-transactions/out-trade-no/H5_COMBINE_20240609_001/close',
        request,
      );
      expect(result.status).toBe(204);
    });
  });

  describe('createRefund', () => {
    it('should call POST /v3/refund/domestic/refunds with sub-order out_trade_no', async () => {
      const request: CreateRefundRequest = {
        out_trade_no: 'SUB_ORDER_001',
        out_refund_no: 'REFUND_20240609_001',
        reason: '用户申请退款',
        amount: {
          refund: 10,
          total: 10,
          currency: 'CNY',
        },
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '5030000118202406090001234567',
          out_refund_no: 'REFUND_20240609_001',
          transaction_id: '4200001234567890',
          out_trade_no: 'SUB_ORDER_001',
          channel: 'ORIGINAL',
          user_received_account: '招商银行信用卡0403',
          create_time: '2024-06-09T12:30:00+08:00',
          status: 'PROCESSING' as const,
          funds_account: 'AVAILABLE',
          amount: {
            total: 10,
            refund: 10,
            payer_total: 9,
            payer_refund: 9,
            settlement_refund: 9,
            settlement_total: 9,
            discount_refund: 1,
            currency: 'CNY',
          },
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createRefund(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/refund/domestic/refunds', request);
      expect(result.data.out_refund_no).toBe('REFUND_20240609_001');
      expect(result.data.status).toBe('PROCESSING');
    });

    it('should call POST /v3/refund/domestic/refunds with transaction_id', async () => {
      const request: CreateRefundRequest = {
        transaction_id: '4200001234567890',
        out_refund_no: 'REFUND_20240609_002',
        reason: '商品缺货',
        amount: {
          refund: 20,
          total: 20,
          currency: 'CNY',
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: '5030000118202406090001234568',
          out_refund_no: 'REFUND_20240609_002',
          transaction_id: '4200001234567890',
          out_trade_no: 'SUB_ORDER_002',
          channel: 'ORIGINAL',
          user_received_account: '招商银行信用卡0403',
          create_time: '2024-06-09T12:35:00+08:00',
          status: 'SUCCESS' as const,
          funds_account: 'AVAILABLE',
          amount: {
            total: 20,
            refund: 20,
            payer_total: 18,
            payer_refund: 18,
            settlement_refund: 18,
            settlement_total: 18,
            discount_refund: 2,
            currency: 'CNY',
          },
        },
      });

      const result = await service.createRefund(request);

      expect(result.data.status).toBe('SUCCESS');
    });
  });

  describe('queryRefund', () => {
    it('should call GET /v3/refund/domestic/refunds/{outRefundNo}', async () => {
      const params = {
        outRefundNo: 'REFUND_20240609_001',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: '5030000118202406090001234567',
          out_refund_no: 'REFUND_20240609_001',
          transaction_id: '4200001234567890',
          out_trade_no: 'SUB_ORDER_001',
          channel: 'ORIGINAL',
          user_received_account: '招商银行信用卡0403',
          success_time: '2024-06-09T12:35:00+08:00',
          create_time: '2024-06-09T12:30:00+08:00',
          status: 'SUCCESS' as const,
          funds_account: 'AVAILABLE',
          amount: {
            total: 10,
            refund: 10,
            payer_total: 9,
            payer_refund: 9,
            settlement_refund: 9,
            settlement_total: 9,
            discount_refund: 1,
            currency: 'CNY',
          },
        },
      });

      const result = await service.queryRefund(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/refund/domestic/refunds/REFUND_20240609_001',
      );
      expect(result.data.status).toBe('SUCCESS');
      expect(result.data.success_time).toBeDefined();
    });
  });

  // ============= applyAbnormalRefund =============

  describe('applyAbnormalRefund', () => {
    it('should apply abnormal refund', async () => {
      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: { refund_id: '50000000382019052709732678870', status: 'PROCESSING' },
      });

      const result = await service.applyAbnormalRefund('REFUND_001', {
        type: 'USER_BANK_CARD',
        bank_account: '622****8888',
        real_name: '测试用户',
      });
      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/refund/domestic/refunds/REFUND_001/apply-abnormal-refund',
        { type: 'USER_BANK_CARD', bank_account: '622****8888', real_name: '测试用户' },
      );
      expect(result.data.status).toBe('PROCESSING');
    });
  });
});
