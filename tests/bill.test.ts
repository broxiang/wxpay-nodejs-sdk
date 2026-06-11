import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillService } from '../src/services/bill';
import { WxPayClient } from '../src/core/client';
import type { TradeBillParams, FundFlowBillParams, ProfitSharingBillParams } from '../src/types';

// Mock the WxPayClient
vi.mock('../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('BillService', () => {
  let service: BillService;
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

    service = new BillService(mockClient as unknown as WxPayClient);
  });

  // ============= applyTradeBill =============

  describe('applyTradeBill', () => {
    it('should call GET /v3/bill/tradebill with all parameters', async () => {
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

      const result = await service.applyTradeBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/tradebill', params);
      expect(result.status).toBe(200);
      expect(result.data.hash_type).toBe('SHA1');
      expect(result.data.download_url).toBe(
        'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx',
      );
    });

    it('should call GET /v3/bill/tradebill with only required parameters', async () => {
      const params: TradeBillParams = {
        bill_date: '2024-01-15',
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

      const result = await service.applyTradeBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/tradebill', params);
      expect(result.status).toBe(200);
    });

    it('should call GET /v3/bill/tradebill with SUCCESS bill_type', async () => {
      const params: TradeBillParams = {
        bill_date: '2024-01-15',
        bill_type: 'SUCCESS',
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

      await service.applyTradeBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/tradebill', params);
    });

    it('should call GET /v3/bill/tradebill with REFUND bill_type', async () => {
      const params: TradeBillParams = {
        bill_date: '2024-01-15',
        bill_type: 'REFUND',
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

      await service.applyTradeBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/tradebill', params);
    });
  });

  // ============= applyFundFlowBill =============

  describe('applyFundFlowBill', () => {
    it('should call GET /v3/bill/fundflowbill with all parameters', async () => {
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

      const result = await service.applyFundFlowBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/fundflowbill', params);
      expect(result.status).toBe(200);
      expect(result.data.hash_type).toBe('SHA1');
    });

    it('should call GET /v3/bill/fundflowbill with only required parameters', async () => {
      const params: FundFlowBillParams = {
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

      const result = await service.applyFundFlowBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/fundflowbill', params);
      expect(result.status).toBe(200);
    });

    it('should call GET /v3/bill/fundflowbill with OPERATION account_type', async () => {
      const params: FundFlowBillParams = {
        bill_date: '2024-01-15',
        account_type: 'OPERATION',
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

      await service.applyFundFlowBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/fundflowbill', params);
    });

    it('should call GET /v3/bill/fundflowbill with FEES account_type', async () => {
      const params: FundFlowBillParams = {
        bill_date: '2024-01-15',
        account_type: 'FEES',
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

      await service.applyFundFlowBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/fundflowbill', params);
    });
  });

  // ============= applyProfitSharingBill =============

  describe('applyProfitSharingBill', () => {
    it('should call GET /v3/bill/profitsharingbill with all parameters', async () => {
      const params: ProfitSharingBillParams = {
        bill_date: '2024-01-15',
        tar_type: 'GZIP',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: '79bb0f45fc4c42234a918000b2668d689e2bde04',
          download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=zzz',
        },
      });

      const result = await service.applyProfitSharingBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/profitsharingbill', params);
      expect(result.status).toBe(200);
      expect(result.data.hash_type).toBe('SHA1');
    });

    it('should call GET /v3/bill/profitsharingbill with only required parameters', async () => {
      const params: ProfitSharingBillParams = {
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

      const result = await service.applyProfitSharingBill(params);

      expect(mockClient.get).toHaveBeenCalledWith('/v3/bill/profitsharingbill', params);
      expect(result.status).toBe(200);
    });
  });

  // ============= downloadBill =============

  describe('downloadBill', () => {
    it('should download bill file from download_url', async () => {
      const billContent = Buffer.from(
        '交易时间,公众账号ID,商户号,特约商户号,设备号,微信订单号,商户订单号',
        'utf-8',
      );

      mockClient.downloadRaw.mockResolvedValue({
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
        data: billContent,
      });

      const downloadUrl = 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx';

      const result = await service.downloadBill(downloadUrl);

      expect(mockClient.downloadRaw).toHaveBeenCalledWith(downloadUrl);
      expect(result.status).toBe(200);
      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.data.toString()).toContain('交易时间');
    });

    it('should download GZIP compressed bill file', async () => {
      const compressedContent = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00]);

      mockClient.downloadRaw.mockResolvedValue({
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
        data: compressedContent,
      });

      const downloadUrl = 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=yyy';

      const result = await service.downloadBill(downloadUrl);

      expect(mockClient.downloadRaw).toHaveBeenCalledWith(downloadUrl);
      expect(result.status).toBe(200);
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });
  });

  // ============= Integration flow =============

  describe('bill download flow', () => {
    it('should support complete flow: apply then download', async () => {
      const downloadUrl = 'https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx';
      const billContent = Buffer.from('mock bill content', 'utf-8');

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          hash_type: 'SHA1',
          hash_value: '79bb0f45fc4c42234a918000b2668d689e2bde04',
          download_url: downloadUrl,
        },
      });

      mockClient.downloadRaw.mockResolvedValue({
        status: 200,
        headers: {},
        data: billContent,
      });

      // Step 1: Apply for bill
      const applyResult = await service.applyTradeBill({
        bill_date: '2024-01-15',
        tar_type: 'GZIP',
      });

      expect(applyResult.data.download_url).toBe(downloadUrl);
      expect(applyResult.data.hash_value).toBeDefined();

      // Step 2: Download bill
      const downloadResult = await service.downloadBill(applyResult.data.download_url);

      expect(mockClient.downloadRaw).toHaveBeenCalledWith(downloadUrl);
      expect(Buffer.isBuffer(downloadResult.data)).toBe(true);
      expect(downloadResult.status).toBe(200);
    });
  });
});
