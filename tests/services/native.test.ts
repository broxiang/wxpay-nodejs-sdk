import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeService } from '../../src/services/native';
import { WxPayClient } from '../../src/core/client';
import type {
  CreateNativeOrderRequest,
  QueryOrderParams,
  CloseOrderRequest,
  CreateRefundRequest,
  QueryRefundParams,
  ApplyAbnormalRefundRequest,
  TradeBillParams,
  FundFlowBillParams,
} from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('NativeService', () => {
  let service: NativeService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    downloadRaw: ReturnType<typeof vi.fn>;
    mchid: string;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      downloadRaw: vi.fn(),
      mchid: '1900000100',
    };

    MockWxPayClient.mockImplementation(() => mockClient);
    service = new NativeService(mockClient as unknown as WxPayClient);
  });

  // ============= createOrder =============

  describe('createOrder', () => {
    it('should create a Native order and return code_url', async () => {
      const request: CreateNativeOrderRequest = {
        appid: 'wx8888888888888888',
        mchid: '1900000100',
        description: '测试商品',
        out_trade_no: '20240115000001',
        notify_url: 'https://example.com/notify',
        amount: { total: 100, currency: 'CNY' },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: { code_url: 'weixin://wxpay/bizpayurl?pr=xxxxx' },
      });

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/pay/transactions/native', request);
      expect(result.status).toBe(200);
      expect(result.data.code_url).toContain('weixin://wxpay/bizpayurl');
    });

    it('should create order with scene_info', async () => {
      const request: CreateNativeOrderRequest = {
        appid: 'wx8888888888888888',
        mchid: '1900000100',
        description: '测试商品',
        out_trade_no: '20240115000002',
        notify_url: 'https://example.com/notify',
        amount: { total: 100, currency: 'CNY' },
        scene_info: {
          payer_client_ip: '14.23.150.211',
          device_id: 'POS1',
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: { code_url: 'weixin://wxpay/bizpayurl?pr=yyyyy' },
      });

      await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/pay/transactions/native', request);
    });

    it('should create order with goods_tag', async () => {
      const request: CreateNativeOrderRequest = {
        appid: 'wx8888888888888888',
        mchid: '1900000100',
        description: '测试商品',
        out_trade_no: '20240115000003',
        notify_url: 'https://example.com/notify',
        amount: { total: 100, currency: 'CNY' },
        goods_tag: 'WXG',
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: { code_url: 'weixin://wxpay/bizpayurl?pr=zzzzz' },
      });

      await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/pay/transactions/native', request);
    });
  });

  // ============= queryOrderById =============

  describe('queryOrderById', () => {
    it('should query order by transaction_id', async () => {
      const params: QueryOrderParams = {
        transactionId: '1217752501201407033233368018',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          transaction_id: '1217752501201407033233368018',
          out_trade_no: '20240115000001',
          trade_state: 'SUCCESS',
        },
      });

      const result = await service.queryOrderById(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/pay/transactions/id/1217752501201407033233368018',
        { mchid: '1900000100' },
      );
      expect(result.data.trade_state).toBe('SUCCESS');
    });

    it('should query order by out_trade_no', async () => {
      const params: QueryOrderParams = {
        outTradeNo: '20240115000001',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          transaction_id: '1217752501201407033233368018',
          out_trade_no: '20240115000001',
          trade_state: 'SUCCESS',
        },
      });

      const result = await service.queryOrderById(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/pay/transactions/out-trade-no/20240115000001',
        { mchid: '1900000100' },
      );
      expect(result.data.trade_state).toBe('SUCCESS');
    });

    it('should throw error when neither transactionId nor outTradeNo provided', async () => {
      const params: QueryOrderParams = {};

      await expect(service.queryOrderById(params)).rejects.toThrow(
        'outTradeNo 或 transactionId 必须提供其中一个',
      );
    });

    it('should query order with NOTPAY state', async () => {
      const params: QueryOrderParams = {
        outTradeNo: '20240115000001',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          out_trade_no: '20240115000001',
          trade_state: 'NOTPAY',
        },
      });

      const result = await service.queryOrderById(params);

      expect(result.data.trade_state).toBe('NOTPAY');
    });

    it('should query order with CLOSED state', async () => {
      const params: QueryOrderParams = {
        outTradeNo: '20240115000001',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          out_trade_no: '20240115000001',
          trade_state: 'CLOSED',
        },
      });

      const result = await service.queryOrderById(params);

      expect(result.data.trade_state).toBe('CLOSED');
    });
  });

  // ============= closeOrder =============

  describe('closeOrder', () => {
    it('should close an unpaid order', async () => {
      const request: CloseOrderRequest = {
        mchid: '1900000100',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.closeOrder('20240115000001', request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/pay/transactions/out-trade-no/20240115000001/close',
        request,
      );
      expect(result.status).toBe(204);
    });
  });

  // ============= createRefund =============

  describe('createRefund', () => {
    it('should create a refund with out_trade_no', async () => {
      const request: CreateRefundRequest = {
        out_trade_no: '20240115000001',
        out_refund_no: 'R20240115000001',
        reason: '用户申请退款',
        amount: {
          refund: 100,
          total: 100,
          currency: 'CNY',
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: '50000000382019052709732678869',
          out_refund_no: 'R20240115000001',
          status: 'PROCESSING',
        },
      });

      const result = await service.createRefund(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/refund/domestic/refunds', request);
      expect(result.data.status).toBe('PROCESSING');
    });

    it('should create a refund with transaction_id', async () => {
      const request: CreateRefundRequest = {
        transaction_id: '1217752501201407033233368018',
        out_refund_no: 'R20240115000002',
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
          refund_id: '50000000382019052709732678870',
          out_refund_no: 'R20240115000002',
          status: 'SUCCESS',
        },
      });

      const result = await service.createRefund(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/refund/domestic/refunds', request);
      expect(result.data.status).toBe('SUCCESS');
    });

    it('should create a partial refund', async () => {
      const request: CreateRefundRequest = {
        out_trade_no: '20240115000001',
        out_refund_no: 'R20240115000003',
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
          refund_id: '50000000382019052709732678871',
          out_refund_no: 'R20240115000003',
          status: 'PROCESSING',
        },
      });

      await service.createRefund(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/refund/domestic/refunds', request);
    });
  });

  // ============= queryRefund =============

  describe('queryRefund', () => {
    it('should query refund by out_refund_no', async () => {
      const params: QueryRefundParams = {
        outRefundNo: 'R20240115000001',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: '50000000382019052709732678869',
          out_refund_no: 'R20240115000001',
          status: 'SUCCESS',
        },
      });

      const result = await service.queryRefund(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/refund/domestic/refunds/R20240115000001');
      expect(result.data.status).toBe('SUCCESS');
    });

    it('should query refund with PROCESSING status', async () => {
      const params: QueryRefundParams = {
        outRefundNo: 'R20240115000002',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: '50000000382019052709732678870',
          out_refund_no: 'R20240115000002',
          status: 'PROCESSING',
        },
      });

      const result = await service.queryRefund(params);

      expect(result.data.status).toBe('PROCESSING');
    });
  });

  // ============= applyAbnormalRefund =============

  describe('applyAbnormalRefund', () => {
    it('should apply abnormal refund to user bank card', async () => {
      const request: ApplyAbnormalRefundRequest = {
        type: 'USER_BANK_CARD',
        bank_type: 'OTHERS',
        bank_account: '622****8888',
        real_name: '测试用户',
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: '50000000382019052709732678869',
          status: 'PROCESSING',
        },
      });

      const result = await service.applyAbnormalRefund('50000000382019052709732678869', request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/refund/domestic/refunds/50000000382019052709732678869/apply-abnormal-refund',
        request,
      );
      expect(result.data.status).toBe('PROCESSING');
    });

    it('should apply abnormal refund to merchant bank card', async () => {
      const request: ApplyAbnormalRefundRequest = {
        type: 'MERCHANT_BANK_CARD',
        bank_type: 'OTHERS',
        bank_account: '622****9999',
        real_name: '测试商户',
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          refund_id: '50000000382019052709732678870',
          status: 'SUCCESS',
        },
      });

      const result = await service.applyAbnormalRefund('50000000382019052709732678870', request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/refund/domestic/refunds/50000000382019052709732678870/apply-abnormal-refund',
        request,
      );
      expect(result.data.status).toBe('SUCCESS');
    });
  });

  // ============= tradeBill =============

  describe('tradeBill', () => {
    it('should apply trade bill with all parameters', async () => {
      const params: TradeBillParams = {
        bill_date: '2024-01-15',
        bill_type: 'ALL',
        tar_type: 'GZIP',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: '79bb0f45fc4c42234a918000b2668d689e2bde04',
          download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
        },
      });

      const result = await service.tradeBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/tradebill', params);
      expect(result.data.download_url).toBeDefined();
    });

    it('should apply trade bill with only required parameters', async () => {
      const params: TradeBillParams = {
        bill_date: '2024-01-15',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: 'abc123',
          download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
        },
      });

      await service.tradeBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/tradebill', params);
    });
  });

  // ============= fundFlowBill =============

  describe('fundFlowBill', () => {
    it('should apply fund flow bill with all parameters', async () => {
      const params: FundFlowBillParams = {
        bill_date: '2024-01-15',
        account_type: 'BASIC',
        tar_type: 'GZIP',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: '79bb0f45fc4c42234a918000b2668d689e2bde04',
          download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=yyy',
        },
      });

      const result = await service.fundFlowBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/fundflowbill', params);
      expect(result.data.download_url).toBeDefined();
    });
  });

  // ============= downloadBill =============

  describe('downloadBill', () => {
    it('should download bill file', async () => {
      const billContent = Buffer.from('交易时间,公众账号ID,商户号', 'utf-8');

      mockClient.downloadRaw.mockResolvedValue({
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
        data: billContent,
      });

      const result = await service.downloadBill(
        'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
      );

      expect(mockClient.downloadRaw).toHaveBeenCalledWith(
        'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
      );
      expect(result.status).toBe(200);
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });
  });
});
