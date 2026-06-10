import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedInsService } from '../../src/services/medins';
import { WxPayClient } from '../../src/core/client';
import type { CreateMedInsOrderRequest } from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('MedInsService', () => {
  let service: MedInsService;
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
    service = new MedInsService(mockClient as unknown as WxPayClient);
  });

  // ============= createOrder =============

  describe('createOrder', () => {
    it('should create a medical insurance order', async () => {
      const request: CreateMedInsOrderRequest = {
        appid: 'wx8888888888888888',
        sub_mchid: '1900000101',
        out_trade_no: 'MED20240115000001',
        description: '医保支付',
        transaction_mchid: '1900000100',
        amount: {
          total: 1000,
          currency: 'CNY',
          payer_total: 300,
          med_ins_total: 700,
        },
        goods_tag: 'WXG',
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          mix_trade_no: 'MED20240115000001',
          out_trade_no: 'MED20240115000001',
          transaction_id: '1217752501201407033233368018',
          trade_state: 'SUCCESS',
        },
      });

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/med-ins/orders',
        request,
      );
      expect(result.status).toBe(200);
      expect(result.data.trade_state).toBe('SUCCESS');
    });

    it('should create order with relative (family member) payment', async () => {
      const request: CreateMedInsOrderRequest = {
        appid: 'wx8888888888888888',
        sub_mchid: '1900000101',
        out_trade_no: 'MED20240115000002',
        description: '医保代亲属支付',
        transaction_mchid: '1900000100',
        amount: {
          total: 500,
          currency: 'CNY',
          payer_total: 150,
          med_ins_total: 350,
        },
        payer: {
          name: '加密后的姓名',
          id_digest: '加密后的身份证摘要',
        },
        relative: {
          name: '加密后的亲属姓名',
          id_digest: '加密后的亲属身份证摘要',
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          mix_trade_no: 'MED20240115000002',
          out_trade_no: 'MED20240115000002',
          trade_state: 'SUCCESS',
        },
      });

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/med-ins/orders',
        request,
      );
      expect(result.data.trade_state).toBe('SUCCESS');
    });

    it('should create pure self-pay order (no med_ins)', async () => {
      const request: CreateMedInsOrderRequest = {
        appid: 'wx8888888888888888',
        sub_mchid: '1900000101',
        out_trade_no: 'MED20240115000003',
        description: '纯自费支付',
        transaction_mchid: '1900000100',
        amount: {
          total: 100,
          currency: 'CNY',
          payer_total: 100,
          med_ins_total: 0,
        },
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          mix_trade_no: 'MED20240115000003',
          out_trade_no: 'MED20240115000003',
          trade_state: 'SUCCESS',
        },
      });

      await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/med-ins/orders',
        request,
      );
    });
  });

  // ============= queryByMixTradeNo =============

  describe('queryByMixTradeNo', () => {
    it('should query order by mix_trade_no', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          mix_trade_no: 'MED20240115000001',
          out_trade_no: 'MED20240115000001',
          trade_state: 'SUCCESS',
        },
      });

      const result = await service.queryByMixTradeNo('MED20240115000001');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/med-ins/orders/MED20240115000001',
      );
      expect(result.data.trade_state).toBe('SUCCESS');
    });

    it('should query order with NOTPAY state', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          mix_trade_no: 'MED20240115000002',
          out_trade_no: 'MED20240115000002',
          trade_state: 'NOTPAY',
        },
      });

      const result = await service.queryByMixTradeNo('MED20240115000002');

      expect(result.data.trade_state).toBe('NOTPAY');
    });
  });

  // ============= queryByOutTradeNo =============

  describe('queryByOutTradeNo', () => {
    it('should query order by out_trade_no', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          mix_trade_no: 'MED20240115000001',
          out_trade_no: 'MED20240115000001',
          trade_state: 'SUCCESS',
        },
      });

      const result = await service.queryByOutTradeNo('MED20240115000001');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/med-ins/orders/out-trade-no/MED20240115000001',
      );
      expect(result.data.trade_state).toBe('SUCCESS');
    });

    it('should query order with CLOSED state', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          mix_trade_no: 'MED20240115000003',
          out_trade_no: 'MED20240115000003',
          trade_state: 'CLOSED',
        },
      });

      const result = await service.queryByOutTradeNo('MED20240115000003');

      expect(result.data.trade_state).toBe('CLOSED');
    });
  });
});
