import { describe, it, expect } from 'vitest';
import { createCallbackTestHelper } from './helpers/callback-helper';

describe('Combine Transaction Callback', () => {
  const { processCallback } = createCallbackTestHelper();

  describe('processCombineTransactionCallback', () => {
    it('should process a combine transaction success callback', () => {
      const testData = {
        appid: 'wx8888888888888888',
        combine_out_trade_no: 'COMBINE20240115001',
        combine_transaction_id: '4200001234567890',
        scene_info: {
          device_id: 'POS1',
        },
        sub_order_info: [
          {
            mchid: '1900000100',
            out_trade_no: 'SUB20240115001',
            transaction_id: '4200001234567891',
            trade_type: 'JSAPI',
            trade_state: 'SUCCESS',
            trade_state_desc: '支付成功',
            bank_type: 'CMC',
            success_time: '2024-01-15T10:30:00+08:00',
            openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
            amount: {
              total: 100,
              payer_total: 100,
              currency: 'CNY',
              payer_currency: 'CNY',
            },
          },
        ],
      };

      const result = processCallback(
        testData,
        'TRANSACTION.SUCCESS',
        '合单支付成功',
        'processCombineTransactionCallback',
        'combine-transaction',
      );

      expect(result.event_type).toBe('TRANSACTION.SUCCESS');
      expect(result.data.combine_out_trade_no).toBe('COMBINE20240115001');
      expect(result.data.sub_order_info).toHaveLength(1);
      expect(result.data.sub_order_info[0].trade_state).toBe('SUCCESS');
    });

    it('should process combine callback with multiple sub orders', () => {
      const testData = {
        appid: 'wx8888888888888888',
        combine_out_trade_no: 'COMBINE20240115002',
        combine_transaction_id: '4200001234567890',
        sub_order_info: [
          {
            mchid: '1900000100',
            out_trade_no: 'SUB20240115001',
            transaction_id: '4200001234567891',
            trade_type: 'JSAPI',
            trade_state: 'SUCCESS',
            trade_state_desc: '支付成功',
            bank_type: 'CMC',
            success_time: '2024-01-15T10:30:00+08:00',
            openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
            amount: {
              total: 100,
              payer_total: 100,
              currency: 'CNY',
              payer_currency: 'CNY',
            },
          },
          {
            mchid: '1900000101',
            out_trade_no: 'SUB20240115002',
            transaction_id: '4200001234567892',
            trade_type: 'JSAPI',
            trade_state: 'SUCCESS',
            trade_state_desc: '支付成功',
            bank_type: 'CMC',
            success_time: '2024-01-15T10:30:00+08:00',
            openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
            amount: {
              total: 200,
              payer_total: 200,
              currency: 'CNY',
              payer_currency: 'CNY',
            },
          },
        ],
      };

      const result = processCallback(
        testData,
        'TRANSACTION.SUCCESS',
        '合单支付成功',
        'processCombineTransactionCallback',
        'combine-transaction',
      );

      expect(result.data.sub_order_info).toHaveLength(2);
      expect(result.data.sub_order_info[0].out_trade_no).toBe('SUB20240115001');
      expect(result.data.sub_order_info[1].out_trade_no).toBe('SUB20240115002');
    });
  });
});
