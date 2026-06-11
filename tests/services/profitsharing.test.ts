import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfitSharingService } from '../../src/services/profitsharing.js';
import { WxPayClient } from '../../src/core/client.js';
import type {
  CreateProfitSharingOrderRequest,
  QueryProfitSharingOrderParams,
  CreateProfitSharingReturnOrderRequest,
  QueryProfitSharingReturnOrderParams,
  UnfreezeProfitSharingRequest,
  AddProfitSharingReceiverRequest,
  DeleteProfitSharingReceiverRequest,
  ProfitSharingBillParams,
} from '../src/types/index.js';

// Mock the WxPayClient
vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('ProfitSharingService', () => {
  let service: ProfitSharingService;
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

    service = new ProfitSharingService(mockClient as unknown as WxPayClient);
  });

  // ========== createOrder ==========

  describe('createOrder', () => {
    it('should call POST /v3/profitsharing/orders with correct parameters', async () => {
      const request: CreateProfitSharingOrderRequest = {
        transaction_id: '4208450740201411110007820472',
        out_order_no: 'P20150806125346',
        unfreeze_unsplit: false,
        receivers: [
          {
            type: 'MERCHANT_ID',
            account: '1900000109',
            name: 'encrypted_name_base64',
            amount: 100,
            description: '分给商户A',
          },
        ],
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          transaction_id: '4208450740201411110007820472',
          out_order_no: 'P20150806125346',
          order_id: '1217752501201407033233368018',
          state: 'PROCESSING' as const,
          receivers: [],
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/profitsharing/orders', request);
      expect(result.data.state).toBe('PROCESSING');
      expect(result.data.order_id).toBe('1217752501201407033233368018');
    });
  });

  // ========== queryOrder ==========

  describe('queryOrder', () => {
    it('should call GET /v3/profitsharing/orders/{outOrderNo} with transaction_id param', async () => {
      const params: QueryProfitSharingOrderParams = {
        outOrderNo: 'P20150806125346',
        transactionId: '4208450740201411110007820472',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          transaction_id: '4208450740201411110007820472',
          out_order_no: 'P20150806125346',
          order_id: '1217752501201407033233368018',
          state: 'FINISHED' as const,
          receivers: [
            {
              amount: 100,
              description: '分给商户A',
              type: 'MERCHANT_ID' as const,
              account: '1900000109',
              result: 'SUCCESS' as const,
              create_time: '2015-05-20T13:29:35+08:00',
              finish_time: '2015-05-20T13:29:35+08:00',
              detail_id: '36011111111111111111111',
            },
          ],
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryOrder(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/profitsharing/orders/P20150806125346', {
        transaction_id: '4208450740201411110007820472',
      });
      expect(result.data.state).toBe('FINISHED');
      expect(result.data.receivers).toHaveLength(1);
    });
  });

  // ========== createReturnOrder ==========

  describe('createReturnOrder', () => {
    it('should call POST /v3/profitsharing/return-orders with correct parameters', async () => {
      const request: CreateProfitSharingReturnOrderRequest = {
        order_id: '1217752501201407033233368018',
        out_return_no: 'R20150806125346',
        return_mchid: '1900000109',
        amount: 100,
        description: '用户退款',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          order_id: '1217752501201407033233368018',
          out_order_no: 'P20150806125346',
          out_return_no: 'R20150806125346',
          return_id: '1217752501201407033233368019',
          return_mchid: '1900000109',
          amount: 100,
          description: '用户退款',
          result: 'SUCCESS' as const,
          create_time: '2015-05-20T13:29:35+08:00',
          finish_time: '2015-05-20T13:29:35+08:00',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createReturnOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/profitsharing/return-orders', request);
      expect(result.data.result).toBe('SUCCESS');
      expect(result.data.return_id).toBe('1217752501201407033233368019');
    });

    it('should handle return order with out_order_no instead of order_id', async () => {
      const request: CreateProfitSharingReturnOrderRequest = {
        out_order_no: 'P20150806125346',
        out_return_no: 'R20150806125347',
        return_mchid: '1900000109',
        amount: 50,
        description: '分账回退',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          order_id: '1217752501201407033233368018',
          out_order_no: 'P20150806125346',
          out_return_no: 'R20150806125347',
          return_id: '1217752501201407033233368020',
          return_mchid: '1900000109',
          amount: 50,
          description: '分账回退',
          result: 'PROCESSING' as const,
          create_time: '2015-05-20T13:29:35+08:00',
          finish_time: '2015-05-20T13:29:35+08:00',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createReturnOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/profitsharing/return-orders', request);
      expect(result.data.result).toBe('PROCESSING');
    });
  });

  // ========== queryReturnOrder ==========

  describe('queryReturnOrder', () => {
    it('should call GET /v3/profitsharing/return-orders/{outReturnNo} with out_order_no param', async () => {
      const params: QueryProfitSharingReturnOrderParams = {
        outReturnNo: 'R20150806125346',
        outOrderNo: 'P20150806125346',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          order_id: '1217752501201407033233368018',
          out_order_no: 'P20150806125346',
          out_return_no: 'R20150806125346',
          return_id: '1217752501201407033233368019',
          return_mchid: '1900000109',
          amount: 100,
          description: '用户退款',
          result: 'SUCCESS' as const,
          create_time: '2015-05-20T13:29:35+08:00',
          finish_time: '2015-05-20T13:29:35+08:00',
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryReturnOrder(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/profitsharing/return-orders/R20150806125346',
        { out_order_no: 'P20150806125346' },
      );
      expect(result.data.return_id).toBe('1217752501201407033233368019');
    });
  });

  // ========== unfreeze ==========

  describe('unfreeze', () => {
    it('should call POST /v3/profitsharing/orders/unfreeze with correct parameters', async () => {
      const request: UnfreezeProfitSharingRequest = {
        transaction_id: '4208450740201411110007820472',
        out_order_no: 'P20150806125346',
        description: '解冻全部剩余资金',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          transaction_id: '4208450740201411110007820472',
          out_order_no: 'P20150806125346',
          order_id: '1217752501201407033233368018',
          unfreeze_amount: 500,
          state: 'FINISHED' as const,
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.unfreeze(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/profitsharing/orders/unfreeze', request);
      expect(result.data.state).toBe('FINISHED');
      expect(result.data.unfreeze_amount).toBe(500);
    });
  });

  // ========== queryAmount ==========

  describe('queryAmount', () => {
    it('should call GET /v3/profitsharing/transactions/{transactionId}/amounts', async () => {
      const transactionId = '4208450740201411110007820472';

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          transaction_id: '4208450740201411110007820472',
          unsplit_amount: 1000,
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryAmount(transactionId);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/profitsharing/transactions/4208450740201411110007820472/amounts',
      );
      expect(result.data.unsplit_amount).toBe(1000);
    });
  });

  // ========== addReceiver ==========

  describe('addReceiver', () => {
    it('should call POST /v3/profitsharing/receivers/add with correct parameters', async () => {
      const request: AddProfitSharingReceiverRequest = {
        appid: 'wx1234567890abcdef',
        type: 'MERCHANT_ID',
        account: '1900000109',
        name: 'encrypted_merchant_name',
        relation_type: 'PARTNER',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          type: 'MERCHANT_ID',
          account: '1900000109',
          relation_type: 'PARTNER',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.addReceiver(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/profitsharing/receivers/add', request);
      expect(result.data.type).toBe('MERCHANT_ID');
      expect(result.data.account).toBe('1900000109');
    });
  });

  // ========== deleteReceiver ==========

  describe('deleteReceiver', () => {
    it('should call POST /v3/profitsharing/receivers/delete with correct parameters', async () => {
      const request: DeleteProfitSharingReceiverRequest = {
        appid: 'wx1234567890abcdef',
        type: 'MERCHANT_ID',
        account: '1900000109',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          type: 'MERCHANT_ID',
          account: '1900000109',
        },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.deleteReceiver(request);

      expect(mockClient.post).toHaveBeenCalledWith('/v3/profitsharing/receivers/delete', request);
      expect(result.data.type).toBe('MERCHANT_ID');
      expect(result.data.account).toBe('1900000109');
    });
  });

  // ========== bill ==========

  describe('bill', () => {
    it('should call GET /v3/profitsharing/bills with bill_date param', async () => {
      const params: ProfitSharingBillParams = {
        bill_date: '2024-01-15',
        tar_type: 'GZIP',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: '79bb0f45fc4c42234a918000b2668d689e2bde04',
          download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.bill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/profitsharing/bills', params);
      expect(result.data.hash_type).toBe('SHA1');
      expect(result.data.download_url).toBeTruthy();
    });

    it('should call GET /v3/profitsharing/bills without tar_type', async () => {
      const params: ProfitSharingBillParams = {
        bill_date: '2024-02-01',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: 'abc123',
          download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=yyy',
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.bill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/profitsharing/bills', params);
      expect(result.data.download_url).toBeTruthy();
    });
  });

  // ========== downloadBill ==========

  describe('downloadBill', () => {
    it('should delegate to client.downloadRaw', async () => {
      const downloadUrl = 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx';

      const expectedResponse = {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
        data: Buffer.from('bill-content'),
      };

      mockClient.downloadRaw.mockResolvedValue(expectedResponse);

      const result = await service.downloadBill(downloadUrl);

      expect(mockClient.downloadRaw).toHaveBeenCalledWith(downloadUrl);
      expect(result.data).toEqual(Buffer.from('bill-content'));
    });
  });
});
