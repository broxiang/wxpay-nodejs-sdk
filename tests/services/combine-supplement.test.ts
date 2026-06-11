import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombineService } from '../../src/services/combine.js';
import { WxPayClient } from '../../src/core/client.js';
import type {
  CreateRefundRequest,
  QueryRefundParams,
  ApplyAbnormalRefundRequest,
} from '../../src/types/index.js';

// Mock the WxPayClient
vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('CombineService - 补充测试 (createRefund, queryRefund, applyAbnormalRefund)', () => {
  let service: CombineService;
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

    service = new CombineService(mockClient as unknown as WxPayClient);
  });

  // ========== createRefund ==========

  describe('createRefund', () => {
    it('should call POST /v3/refund/domestic/refunds with correct parameters', async () => {
      const request: CreateRefundRequest = {
        transaction_id: '4200001234567890',
        out_refund_no: 'REFUND20240101001',
        amount: {
          refund: 100,
          total: 500,
          currency: 'CNY',
        },
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '50300500362024010100012345678',
          out_refund_no: 'REFUND20240101001',
          transaction_id: '4200001234567890',
          out_trade_no: '20150806125346',
          channel: 'ORIGINAL' as const,
          user_received_account: '招商银行信用卡0403',
          success_time: '2024-01-15T10:00:00+08:00',
          create_time: '2024-01-15T10:00:00+08:00',
          status: 'SUCCESS' as const,
          amount: {
            total: 500,
            refund: 100,
            payer_total: 500,
            payer_refund: 100,
          },
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createRefund(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/refund/domestic/refunds', request);
      expect(result.data.status).toBe('SUCCESS');
      expect(result.data.refund_id).toBe('50300500362024010100012345678');
      expect(result.data.amount.refund).toBe(100);
    });

    it('should handle refund with out_trade_no instead of transaction_id', async () => {
      const request: CreateRefundRequest = {
        out_trade_no: '20150806125346',
        out_refund_no: 'REFUND20240101002',
        amount: {
          refund: 200,
          total: 1000,
          currency: 'CNY',
        },
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '50300500362024010100012345679',
          out_refund_no: 'REFUND20240101002',
          out_trade_no: '20150806125346',
          channel: 'ORIGINAL' as const,
          user_received_account: '招商银行信用卡0403',
          success_time: '2024-01-15T11:00:00+08:00',
          create_time: '2024-01-15T11:00:00+08:00',
          status: 'SUCCESS' as const,
          amount: {
            total: 1000,
            refund: 200,
            payer_total: 1000,
            payer_refund: 200,
          },
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createRefund(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/refund/domestic/refunds', request);
      expect(result.data.amount.total).toBe(1000);
    });

    it('should handle refund with reason and goods_detail', async () => {
      const request: CreateRefundRequest = {
        transaction_id: '4200001234567890',
        out_refund_no: 'REFUND20240101003',
        reason: '商品已退货',
        funds_account: 'AVAILABLE',
        amount: {
          refund: 50,
          total: 500,
          currency: 'CNY',
        },
        goods_detail: [
          {
            merchant_goods_id: 'GOODS001',
            wechatpay_goods_id: '1001',
            goods_name: '测试商品',
            unit_price: 10,
            refund_amount: 50,
            refund_quantity: 5,
          },
        ],
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '50300500362024010100012345680',
          out_refund_no: 'REFUND20240101003',
          transaction_id: '4200001234567890',
          out_trade_no: '20150806125346',
          channel: 'ORIGINAL' as const,
          user_received_account: '招商银行信用卡0403',
          success_time: '2024-01-15T12:00:00+08:00',
          create_time: '2024-01-15T12:00:00+08:00',
          status: 'SUCCESS' as const,
          amount: {
            total: 500,
            refund: 50,
            payer_total: 500,
            payer_refund: 50,
          },
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createRefund(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/refund/domestic/refunds', request);
      expect(result.data.status).toBe('SUCCESS');
    });
  });

  // ========== queryRefund ==========

  describe('queryRefund', () => {
    it('should call GET /v3/refund/domestic/refunds/{outRefundNo}', async () => {
      const params: QueryRefundParams = {
        outRefundNo: 'REFUND20240101001',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '50300500362024010100012345678',
          out_refund_no: 'REFUND20240101001',
          transaction_id: '4200001234567890',
          out_trade_no: '20150806125346',
          channel: 'ORIGINAL' as const,
          user_received_account: '招商银行信用卡0403',
          success_time: '2024-01-15T10:00:00+08:00',
          create_time: '2024-01-15T10:00:00+08:00',
          status: 'SUCCESS' as const,
          amount: {
            total: 500,
            refund: 100,
            payer_total: 500,
            payer_refund: 100,
          },
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryRefund(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/refund/domestic/refunds/REFUND20240101001');
      expect(result.data.status).toBe('SUCCESS');
      expect(result.data.out_refund_no).toBe('REFUND20240101001');
    });

    it('should handle PROCESSING status refund', async () => {
      const params: QueryRefundParams = {
        outRefundNo: 'REFUND_PROCESSING',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '50300500362024010100012345681',
          out_refund_no: 'REFUND_PROCESSING',
          transaction_id: '4200001234567891',
          out_trade_no: '20150806125347',
          channel: 'ORIGINAL' as const,
          create_time: '2024-01-15T10:00:00+08:00',
          status: 'PROCESSING' as const,
          amount: {
            total: 300,
            refund: 300,
            payer_total: 300,
            payer_refund: 300,
          },
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryRefund(params);

      expect(result.data.status).toBe('PROCESSING');
      expect(result.data.success_time).toBeUndefined();
    });
  });

  // ========== applyAbnormalRefund ==========

  describe('applyAbnormalRefund', () => {
    it('should call POST /v3/refund/domestic/refunds/{refundId}/apply-abnormal-refund', async () => {
      const refundId = '50300500362024010100012345678';
      const request: ApplyAbnormalRefundRequest = {
        type: 'USER_BANK_CARD',
        bank_type: 'ICBC_DEBIT',
        bank_account: 'encrypted_bank_account',
        real_name: 'encrypted_real_name',
        out_refund_no: 'REFUND20240101001',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '50300500362024010100012345678',
          out_refund_no: 'REFUND20240101001',
          transaction_id: '4200001234567890',
          out_trade_no: '20150806125346',
          channel: 'USER_BANK_CARD' as const,
          status: 'PROCESSING' as const,
          amount: {
            total: 500,
            refund: 100,
          },
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.applyAbnormalRefund(refundId, request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/refund/domestic/refunds/50300500362024010100012345678/apply-abnormal-refund',
        request,
      );
      expect(result.data.channel).toBe('USER_BANK_CARD');
      expect(result.data.status).toBe('PROCESSING');
    });

    it('should handle MERCHANT_BANK_CARD type abnormal refund', async () => {
      const refundId = '50300500362024010100012345679';
      const request: ApplyAbnormalRefundRequest = {
        type: 'MERCHANT_BANK_CARD',
        bank_type: 'BOC_DEBIT',
        bank_account: 'encrypted_merchant_bank_account',
        real_name: 'encrypted_merchant_name',
        out_refund_no: 'ABNORMAL_REFUND001',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          refund_id: '50300500362024010100012345679',
          out_refund_no: 'ABNORMAL_REFUND001',
          transaction_id: '4200001234567891',
          out_trade_no: '20150806125347',
          channel: 'MERCHANT_BANK_CARD' as const,
          status: 'SUCCESS' as const,
          amount: {
            total: 1000,
            refund: 1000,
          },
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.applyAbnormalRefund(refundId, request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/refund/domestic/refunds/50300500362024010100012345679/apply-abnormal-refund',
        request,
      );
      expect(result.data.channel).toBe('MERCHANT_BANK_CARD');
    });
  });
});
