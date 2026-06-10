import { describe, it, expect } from 'vitest';
import { createCallbackTestHelper } from './helpers/callback-helper';

describe('Business Circle Callback', () => {
  const { processCallback } = createCallbackTestHelper();

  describe('processBusinessCircleAuthorizeCallback', () => {
    it('should process a user authorize callback', () => {
      const testData = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        authorize_time: '2024-01-15T10:00:00+08:00',
      };

      const result = processCallback(
        testData,
        'BUSINESS_CIRCLE.USER_AUTHORIZE',
        '用户授权商圈积分服务',
        'processBusinessCircleAuthorizeCallback',
        'business-circle-authorize',
      );

      expect(result.event_type).toBe('BUSINESS_CIRCLE.USER_AUTHORIZE');
      expect(result.data.openid).toBe('oUpF8uMuAJO_M2pxb1Q9zNjWeS6o');
      expect(result.data.appid).toBe('wx8888888888888888');
    });

    it('should process a user deauthorize callback', () => {
      const testData = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        deauthorize_time: '2024-01-15T12:00:00+08:00',
      };

      const result = processCallback(
        testData,
        'BUSINESS_CIRCLE.USER_DEAUTHORIZE',
        '用户解除商圈积分授权',
        'processBusinessCircleAuthorizeCallback',
        'business-circle-authorize',
      );

      expect(result.event_type).toBe('BUSINESS_CIRCLE.USER_DEAUTHORIZE');
      expect(result.data.openid).toBe('oUpF8uMuAJO_M2pxb1Q9zNjWeS6o');
    });
  });

  describe('processBusinessCircleTransactionCallback', () => {
    it('should process a business circle transaction success callback', () => {
      const testData = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        transaction_id: '4200001234567890',
        out_trade_no: 'BC20240115001',
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        success_time: '2024-01-15T10:30:00+08:00',
        amount: {
          total: 100,
          payer_total: 100,
          currency: 'CNY',
        },
      };

      const result = processCallback(
        testData,
        'TRANSACTION.SUCCESS',
        '商圈支付成功',
        'processBusinessCircleTransactionCallback',
        'business-circle-transaction',
      );

      expect(result.event_type).toBe('TRANSACTION.SUCCESS');
      expect(result.data.transaction_id).toBe('4200001234567890');
      expect(result.data.trade_state).toBe('SUCCESS');
    });

    it('should process business circle transaction with points', () => {
      const testData = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        transaction_id: '4200001234567891',
        out_trade_no: 'BC20240115002',
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        success_time: '2024-01-15T11:00:00+08:00',
        amount: {
          total: 200,
          payer_total: 200,
          currency: 'CNY',
        },
        points: {
          earn: 200,
          redeem: 0,
        },
      };

      const result = processCallback(
        testData,
        'TRANSACTION.SUCCESS',
        '商圈支付成功',
        'processBusinessCircleTransactionCallback',
        'business-circle-transaction',
      );

      expect(result.data.points).toBeDefined();
      expect(result.data.points!.earn).toBe(200);
    });
  });

  describe('processBusinessCircleRefundCallback', () => {
    it('should process a business circle refund success callback', () => {
      const testData = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        transaction_id: '4200001234567890',
        out_trade_no: 'BC20240115001',
        out_refund_no: 'BCREFUND20240115001',
        refund_id: '5000001234567890',
        refund_status: 'SUCCESS',
        success_time: '2024-01-15T12:00:00+08:00',
        amount: {
          total: 100,
          refund: 100,
          payer_total: 100,
          payer_refund: 100,
        },
      };

      const result = processCallback(
        testData,
        'REFUND.SUCCESS',
        '商圈退款成功',
        'processBusinessCircleRefundCallback',
        'business-circle-refund',
      );

      expect(result.event_type).toBe('REFUND.SUCCESS');
      expect(result.data.out_refund_no).toBe('BCREFUND20240115001');
      expect(result.data.refund_status).toBe('SUCCESS');
    });

    it('should process a business circle refund abnormal callback', () => {
      const testData = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        transaction_id: '4200001234567891',
        out_trade_no: 'BC20240115002',
        out_refund_no: 'BCREFUND20240115002',
        refund_id: '5000001234567891',
        refund_status: 'ABNORMAL',
        amount: {
          total: 200,
          refund: 100,
          payer_total: 200,
          payer_refund: 100,
        },
      };

      const result = processCallback(
        testData,
        'REFUND.ABNORMAL',
        '商圈退款异常',
        'processBusinessCircleRefundCallback',
        'business-circle-refund',
      );

      expect(result.event_type).toBe('REFUND.ABNORMAL');
      expect(result.data.refund_status).toBe('ABNORMAL');
    });

    it('should process a business circle refund closed callback', () => {
      const testData = {
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        appid: 'wx8888888888888888',
        transaction_id: '4200001234567892',
        out_trade_no: 'BC20240115003',
        out_refund_no: 'BCREFUND20240115003',
        refund_id: '5000001234567892',
        refund_status: 'CLOSED',
        amount: {
          total: 300,
          refund: 150,
          payer_total: 300,
          payer_refund: 150,
        },
      };

      const result = processCallback(
        testData,
        'REFUND.CLOSED',
        '商圈退款关闭',
        'processBusinessCircleRefundCallback',
        'business-circle-refund',
      );

      expect(result.event_type).toBe('REFUND.CLOSED');
      expect(result.data.refund_status).toBe('CLOSED');
    });
  });
});
