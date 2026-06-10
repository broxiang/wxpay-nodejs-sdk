import { describe, it, expect } from 'vitest';
import { createCallbackTestHelper } from './helpers/callback-helper';

describe('Medical Insurance Callback', () => {
  const { processCallback } = createCallbackTestHelper();

  describe('processMedInsSuccessCallback', () => {
    it('should process a medical insurance payment success callback', () => {
      const testData = {
        appid: 'wx8888888888888888',
        mix_trade_no: 'MED20240115000001',
        out_trade_no: 'MED20240115000001',
        transaction_id: '4200001234567890',
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        bank_type: 'CMC',
        success_time: '2024-01-15T10:30:00+08:00',
        amount: {
          total: 1000,
          payer_total: 300,
          med_ins_total: 700,
          currency: 'CNY',
        },
      };

      const result = processCallback(
        testData,
        'MED_INS.SUCCESS',
        '医保支付成功',
        'processMedInsSuccessCallback',
        'med-ins-transaction',
      );

      expect(result.event_type).toBe('MED_INS.SUCCESS');
      expect(result.data.mix_trade_no).toBe('MED20240115000001');
      expect(result.data.trade_state).toBe('SUCCESS');
      expect(result.data.amount.med_ins_total).toBe(700);
      expect(result.data.amount.payer_total).toBe(300);
    });

    it('should process pure self-pay medical insurance callback', () => {
      const testData = {
        appid: 'wx8888888888888888',
        mix_trade_no: 'MED20240115000002',
        out_trade_no: 'MED20240115000002',
        transaction_id: '4200001234567891',
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        bank_type: 'CMC',
        success_time: '2024-01-15T11:00:00+08:00',
        amount: {
          total: 100,
          payer_total: 100,
          med_ins_total: 0,
          currency: 'CNY',
        },
      };

      const result = processCallback(
        testData,
        'MED_INS.SUCCESS',
        '医保支付成功',
        'processMedInsSuccessCallback',
        'med-ins-transaction',
      );

      expect(result.data.amount.med_ins_total).toBe(0);
      expect(result.data.amount.payer_total).toBe(100);
    });
  });

  describe('processMedInsRefundCallback', () => {
    it('should process a medical insurance refund success callback', () => {
      const testData = {
        mix_trade_no: 'MED20240115000001',
        out_trade_no: 'MED20240115000001',
        out_refund_no: 'REFUND20240115001',
        refund_id: '5000001234567890',
        refund_status: 'SUCCESS',
        success_time: '2024-01-15T12:00:00+08:00',
        amount: {
          total: 1000,
          refund: 1000,
          payer_total: 300,
          payer_refund: 300,
          med_ins_refund: 700,
        },
      };

      const result = processCallback(
        testData,
        'MED_INS.REFUND.SUCCESS',
        '医保退款成功',
        'processMedInsRefundCallback',
        'med-ins-refund',
      );

      expect(result.event_type).toBe('MED_INS.REFUND.SUCCESS');
      expect(result.data.out_refund_no).toBe('REFUND20240115001');
      expect(result.data.refund_status).toBe('SUCCESS');
      expect(result.data.amount.med_ins_refund).toBe(700);
    });

    it('should process a medical insurance refund abnormal callback', () => {
      const testData = {
        mix_trade_no: 'MED20240115000002',
        out_trade_no: 'MED20240115000002',
        out_refund_no: 'REFUND20240115002',
        refund_id: '5000001234567891',
        refund_status: 'ABNORMAL',
        amount: {
          total: 500,
          refund: 500,
          payer_total: 150,
          payer_refund: 150,
          med_ins_refund: 350,
        },
      };

      const result = processCallback(
        testData,
        'MED_INS.REFUND.ABNORMAL',
        '医保退款异常',
        'processMedInsRefundCallback',
        'med-ins-refund',
      );

      expect(result.event_type).toBe('MED_INS.REFUND.ABNORMAL');
      expect(result.data.refund_status).toBe('ABNORMAL');
    });

    it('should process a medical insurance refund closed callback', () => {
      const testData = {
        mix_trade_no: 'MED20240115000003',
        out_trade_no: 'MED20240115000003',
        out_refund_no: 'REFUND20240115003',
        refund_id: '5000001234567892',
        refund_status: 'CLOSED',
        amount: {
          total: 200,
          refund: 200,
          payer_total: 60,
          payer_refund: 60,
          med_ins_refund: 140,
        },
      };

      const result = processCallback(
        testData,
        'MED_INS.REFUND.CLOSED',
        '医保退款关闭',
        'processMedInsRefundCallback',
        'med-ins-refund',
      );

      expect(result.event_type).toBe('MED_INS.REFUND.CLOSED');
      expect(result.data.refund_status).toBe('CLOSED');
    });
  });
});
