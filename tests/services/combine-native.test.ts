import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombineNativeService } from '../../src/services/combine-native.js';
import { WxPayClient } from '../../src/core/client.js';
import type {
  CreateNativeCombineOrderRequest,
  CloseCombineOrderRequest,
  CreateRefundRequest,
} from '../../src/types/index.js';

// Mock the WxPayClient
vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('CombineNativeService', () => {
  let service: CombineNativeService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    downloadRaw: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      downloadRaw: vi.fn(),
    };

    MockWxPayClient.mockImplementation(() => mockClient);

    service = new CombineNativeService(mockClient as unknown as WxPayClient);
  });

  describe('createOrder', () => {
    it('should call POST /v3/combine-transactions/native with correct parameters', async () => {
      const request: CreateNativeCombineOrderRequest = {
        combine_appid: 'wxd678efh567hg6787',
        combine_mchid: '1230000109',
        combine_out_trade_no: 'NATIVE_COMBINE_20240609_001',
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
        },
        time_expire: '2024-06-09T23:59:59+08:00',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          code_url: 'weixin://wxpay/bizpayurl/up?pr=NwY5Mz9&groupid=00',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/combine-transactions/native',
        request,
      );
      expect(result).toEqual(expectedResponse);
      expect(result.data.code_url).toContain('weixin://wxpay/bizpayurl');
    });

    it('should handle minimal request with 2 sub-orders', async () => {
      const request: CreateNativeCombineOrderRequest = {
        combine_appid: 'wx1234567890abcdef',
        combine_mchid: '1230000109',
        combine_out_trade_no: 'MIN_NATIVE_ORDER_001',
        notify_url: 'https://example.com/notify',
        sub_orders: [
          {
            mchid: '1230000109',
            out_trade_no: 'SUB_MIN_001',
            description: '商品A',
            amount: { total_amount: 100, currency: 'CNY' },
            attach: '订单A',
          },
          {
            mchid: '1230000110',
            out_trade_no: 'SUB_MIN_002',
            description: '商品B',
            amount: { total_amount: 200, currency: 'CNY' },
            attach: '订单B',
          },
        ],
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          code_url: 'weixin://wxpay/bizpayurl/up?pr=abc123',
        },
      });

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/combine-transactions/native',
        request,
      );
      expect(result.data.code_url).toBeDefined();
    });

    it('should handle request with scene_info and profit_sharing', async () => {
      const request: CreateNativeCombineOrderRequest = {
        combine_appid: 'wxd678efh567hg6787',
        combine_mchid: '1230000109',
        combine_out_trade_no: 'PROFIT_SHARING_ORDER_001',
        notify_url: 'https://example.com/notify',
        sub_orders: [
          {
            mchid: '1230000109',
            out_trade_no: 'SUB_PROFIT_001',
            description: '分账商品',
            amount: { total_amount: 50, currency: 'CNY' },
            attach: '分账订单',
            settle_info: { profit_sharing: true },
          },
          {
            mchid: '1230000110',
            out_trade_no: 'SUB_PROFIT_002',
            description: '分账商品2',
            amount: { total_amount: 30, currency: 'CNY' },
            attach: '分账订单2',
            settle_info: { profit_sharing: true },
          },
        ],
        scene_info: {
          payer_client_ip: '192.168.1.100',
          device_id: 'DEVICE001',
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          code_url: 'weixin://wxpay/bizpayurl/up?pr=profit123',
        },
      });

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/combine-transactions/native',
        request,
      );
      expect(result.data.code_url).toContain('weixin://wxpay/');
    });
  });

  describe('queryOrderById', () => {
    it('should call GET /v3/combine-transactions/out-trade-no/{combineOutTradeNo}', async () => {
      const params = {
        combineOutTradeNo: 'NATIVE_COMBINE_20240609_001',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          combine_appid: 'wxd678efh567hg6787',
          combine_mchid: '1230000109',
          combine_out_trade_no: 'NATIVE_COMBINE_20240609_001',
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
              trade_type: 'NATIVE' as const,
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
              trade_type: 'NATIVE' as const,
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
        '/v3/combine-transactions/out-trade-no/NATIVE_COMBINE_20240609_001',
      );
      expect(result.data.combine_out_trade_no).toBe('NATIVE_COMBINE_20240609_001');
      expect(result.data.sub_orders).toHaveLength(2);
      expect(result.data.sub_orders?.[0]?.trade_state).toBe('SUCCESS');
      expect(result.data.sub_orders?.[0]?.trade_type).toBe('NATIVE');
    });

    it('should return NOTPAY state for unpaid orders', async () => {
      const params = {
        combineOutTradeNo: 'NATIVE_UNPAID_ORDER',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          combine_appid: 'wxd678efh567hg6787',
          combine_mchid: '1230000109',
          combine_out_trade_no: 'NATIVE_UNPAID_ORDER',
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
        combineOutTradeNo: 'NATIVE_CLOSED_ORDER',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          combine_appid: 'wxd678efh567hg6787',
          combine_mchid: '1230000109',
          combine_out_trade_no: 'NATIVE_CLOSED_ORDER',
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

    it('should return order with promotion_detail', async () => {
      const params = {
        combineOutTradeNo: 'NATIVE_PROMOTION_ORDER',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          combine_appid: 'wxd678efh567hg6787',
          combine_mchid: '1230000109',
          combine_out_trade_no: 'NATIVE_PROMOTION_ORDER',
          sub_orders: [
            {
              mchid: '1230000109',
              out_trade_no: 'SUB_ORDER_001',
              trade_state: 'SUCCESS' as const,
              transaction_id: '4200001234567890',
              trade_type: 'NATIVE' as const,
              amount: {
                total_amount: 100,
                payer_amount: 80,
                currency: 'CNY',
              },
              promotion_detail: [
                {
                  coupon_id: 'coupon_001',
                  amount: 20,
                  name: '满100减20',
                  scope: 'GLOBAL' as const,
                  type: 'CASH' as const,
                  stock_id: 'stock_001',
                  wechatpay_contribute: 10,
                  merchant_contribute: 10,
                  currency: 'CNY',
                },
              ],
            },
          ],
        },
      });

      const result = await service.queryOrderById(params);

      expect(result.data.sub_orders?.[0]?.promotion_detail).toHaveLength(1);
      expect(result.data.sub_orders?.[0]?.promotion_detail?.[0]?.coupon_id).toBe('coupon_001');
    });
  });

  describe('closeOrder', () => {
    it('should call POST /v3/combine-transactions/out-trade-no/{combineOutTradeNo}/close', async () => {
      const params = {
        combineOutTradeNo: 'NATIVE_COMBINE_20240609_001',
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
        '/v3/combine-transactions/out-trade-no/NATIVE_COMBINE_20240609_001/close',
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
          channel: 'ORIGINAL' as const,
          user_received_account: '招商银行信用卡0403',
          create_time: '2024-06-09T12:30:00+08:00',
          status: 'PROCESSING' as const,
          funds_account: 'AVAILABLE' as const,
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

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/refund/domestic/refunds',
        request,
      );
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
          channel: 'ORIGINAL' as const,
          user_received_account: '招商银行信用卡0403',
          create_time: '2024-06-09T12:35:00+08:00',
          status: 'SUCCESS' as const,
          funds_account: 'AVAILABLE' as const,
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

    it('should handle refund with funds_account specified', async () => {
      const request: CreateRefundRequest = {
        out_trade_no: 'SUB_ORDER_001',
        out_refund_no: 'REFUND_FUNDS_001',
        funds_account: 'AVAILABLE',
        amount: {
          refund: 50,
          total: 100,
          currency: 'CNY',
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: '5030000118202406090001234569',
          out_refund_no: 'REFUND_FUNDS_001',
          transaction_id: '4200001234567890',
          out_trade_no: 'SUB_ORDER_001',
          channel: 'ORIGINAL' as const,
          user_received_account: '支付用户零钱',
          create_time: '2024-06-09T12:40:00+08:00',
          status: 'PROCESSING' as const,
          funds_account: 'AVAILABLE' as const,
          amount: {
            total: 100,
            refund: 50,
            payer_total: 80,
            payer_refund: 40,
            settlement_refund: 40,
            settlement_total: 80,
            discount_refund: 10,
            currency: 'CNY',
          },
        },
      });

      const result = await service.createRefund(request);

      expect(result.data.amount.refund).toBe(50);
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
          channel: 'ORIGINAL' as const,
          user_received_account: '招商银行信用卡0403',
          success_time: '2024-06-09T12:35:00+08:00',
          create_time: '2024-06-09T12:30:00+08:00',
          status: 'SUCCESS' as const,
          funds_account: 'AVAILABLE' as const,
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

    it('should return PROCESSING status for in-progress refunds', async () => {
      const params = {
        outRefundNo: 'REFUND_PROCESSING',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: '5030000118202406090001234570',
          out_refund_no: 'REFUND_PROCESSING',
          transaction_id: '4200001234567890',
          out_trade_no: 'SUB_ORDER_001',
          channel: 'ORIGINAL' as const,
          user_received_account: '招商银行信用卡0403',
          create_time: '2024-06-09T12:45:00+08:00',
          status: 'PROCESSING' as const,
          funds_account: 'AVAILABLE' as const,
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

      expect(result.data.status).toBe('PROCESSING');
      expect(result.data.success_time).toBeUndefined();
    });
  });

  describe('applyAbnormalRefund', () => {
    it('should call POST /v3/refund/domestic/refunds/{refundId}/apply-abnormal-refund', async () => {
      const refundId = '5030000118202406090001234567';
      const request = {
        out_refund_no: 'REFUND_20240609_001',
        type: 'USER_BANK_CARD' as const,
        bank_type: 'ICBC_DEBIT',
        bank_account: 'encrypted_bank_account',
        real_name: 'encrypted_real_name',
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: refundId,
          out_refund_no: 'REFUND_20240609_001',
          transaction_id: '4200001234567890',
          out_trade_no: 'SUB_ORDER_001',
          channel: 'ORIGINAL' as const,
          user_received_account: '工商银行储蓄卡1234',
          create_time: '2024-06-09T13:00:00+08:00',
          status: 'PROCESSING' as const,
          funds_account: 'AVAILABLE' as const,
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

      const result = await service.applyAbnormalRefund(refundId, request);

      expect(mockClient.post).toHaveBeenCalledWith(
        `/v3/refund/domestic/refunds/${refundId}/apply-abnormal-refund`,
        request,
      );
      expect(result.data.refund_id).toBe(refundId);
    });
  });

  describe('tradeBill', () => {
    it('should call GET /v3/bill/tradebill with correct parameters', async () => {
      const params = {
        bill_date: '2024-06-09',
        bill_type: 'ALL' as const,
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: '79bb0f45fc4c42234a918000b2668d6893c3e5c1',
          download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
        },
      });

      const result = await service.tradeBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/tradebill', params);
      expect(result.data.download_url).toContain('billdownload');
    });

    it('should call GET /v3/bill/tradebill with GZIP tar_type', async () => {
      const params = {
        bill_date: '2024-06-09',
        bill_type: 'SUCCESS' as const,
        tar_type: 'GZIP' as const,
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: 'abc123',
          download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=yyy',
        },
      });

      await service.tradeBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/tradebill', params);
    });
  });

  describe('fundFlowBill', () => {
    it('should call GET /v3/bill/fundflowbill with correct parameters', async () => {
      const params = {
        bill_date: '2024-06-09',
        account_type: 'BASIC' as const,
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: '79bb0f45fc4c42234a918000b2668d6893c3e5c1',
          download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
        },
      });

      const result = await service.fundFlowBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/fundflowbill', params);
      expect(result.data.hash_type).toBe('SHA1');
    });
  });

  describe('downloadBill', () => {
    it('should call downloadRaw with the download URL', async () => {
      const downloadUrl = 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx';
      const billData = Buffer.from('交易时间,商户订单号,微信支付订单号\n2024-06-09,ORDER001,4200001234567890\n');

      mockClient.downloadRaw.mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'text/csv' },
        data: billData,
      });

      const result = await service.downloadBill(downloadUrl);

      expect(mockClient.downloadRaw).toHaveBeenCalledWith(downloadUrl);
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.data.toString()).toContain('交易时间');
    });
  });
});
