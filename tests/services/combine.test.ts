import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombineService } from '../../src/services/combine.js';
import { WxPayClient } from '../../src/core/client.js';
import type {
  CreateCombineOrderRequest,
  CloseCombineOrderRequest,
} from '../../src/types/index.js';

// Mock the WxPayClient
vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('CombineService', () => {
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

  describe('createOrder', () => {
    it('should call POST /v3/combine-transactions/jsapi with correct parameters', async () => {
      const request: CreateCombineOrderRequest = {
        combine_appid: 'wxd678efh567hg6787',
        combine_mchid: '1230000109',
        combine_out_trade_no: '1217752501201407033233368018',
        notify_url: 'https://yourapp.com/notify',
        combine_payer_info: { openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o' },
        sub_orders: [
          {
            mchid: '1230000109',
            out_trade_no: '20150806125346',
            description: '腾讯充值中心-QQ会员充值',
            amount: { total_amount: 10, currency: 'CNY' },
            attach: '深圳分店',
            settle_info: { profit_sharing: false },
            goods_tag: 'WXG',
          },
          {
            mchid: '1230000110',
            out_trade_no: '20150806125347',
            description: '腾讯充值中心-视频会员',
            amount: { total_amount: 20, currency: 'CNY' },
            attach: '广州分店',
          },
        ],
        scene_info: {
          payer_client_ip: '14.17.22.32',
          device_id: 'POS1:1',
        },
        time_expire: '2018-06-08T10:34:56+08:00',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: { prepay_id: 'wx201410272009395522657a690389285100' },
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createOrder(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/combine-transactions/jsapi',
        request,
      );
      expect(result).toEqual(expectedResponse);
      expect(result.data.prepay_id).toBe('wx201410272009395522657a690389285100');
    });
  });

  describe('queryOrderById', () => {
    it('should call GET /v3/combine-transactions/out-trade-no/{combineOutTradeNo}', async () => {
      const params = {
        combineOutTradeNo: '1217752501201407033233368018',
      };

      const expectedResponse = {
        status: 200,
        headers: {},
        data: {
          combine_appid: 'wxd678efh567hg6787',
          combine_mchid: '1230000109',
          combine_out_trade_no: '1217752501201407033233368018',
          sub_orders: [
            {
              mchid: '1230000109',
              out_trade_no: '20150806125346',
              trade_state: 'SUCCESS' as const,
              transaction_id: '4200001234567890',
              trade_type: 'JSAPI' as const,
              bank_type: 'OTHERS',
              amount: {
                total_amount: 10,
                payer_amount: 9,
                currency: 'CNY',
              },
              success_time: '2018-06-08T10:34:56+08:00',
            },
          ],
        },
      };

      mockClient.get.mockResolvedValue(expectedResponse);

      const result = await service.queryOrderById(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/combine-transactions/out-trade-no/1217752501201407033233368018',
      );
      expect(result.data.sub_orders?.[0]?.trade_state).toBe('SUCCESS');
    });
  });

  describe('closeOrder', () => {
    it('should call POST /v3/combine-transactions/out-trade-no/{combineOutTradeNo}/close', async () => {
      const params = {
        combineOutTradeNo: '1217752501201407033233368018',
      };

      const request: CloseCombineOrderRequest = {
        combine_appid: 'wxd678efh567hg6787',
        sub_orders: [
          {
            mchid: '1230000109',
            out_trade_no: '20150806125346',
          },
          {
            mchid: '1230000110',
            out_trade_no: '20150806125347',
          },
        ],
      };

      const expectedResponse = {
        status: 204,
        headers: {},
        data: undefined,
      };

      mockClient.post.mockResolvedValue(expectedResponse);

      const result = await service.closeOrder(params, request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/combine-transactions/out-trade-no/1217752501201407033233368018/close',
        request,
      );
      expect(result.status).toBe(204);
    });
  });
});
