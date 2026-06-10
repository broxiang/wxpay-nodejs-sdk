import { describe, it, expect } from 'vitest';
import { createCallbackTestHelper } from './helpers/callback-helper';

describe('Merchant Transfer Callback', () => {
  const { processCallback } = createCallbackTestHelper();

  describe('processMerchantTransferCallback', () => {
    it('should process a transfer success callback', () => {
      const testData = {
        mchid: '1900000100',
        out_bill_no: 'TRANSFER20240115001',
        transfer_bill_no: '1234567890',
        transfer_state: 'SUCCESS',
        success_time: '2024-01-15T10:30:00+08:00',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        transfer_amount: 100,
        desc: '测试转账',
      };

      const result = processCallback(
        testData,
        'TRANSFER.SUCCESS',
        '转账成功',
        'processMerchantTransferCallback',
        'mch-transfer',
      );

      expect(result.event_type).toBe('TRANSFER.SUCCESS');
      expect(result.data.out_bill_no).toBe('TRANSFER20240115001');
      expect(result.data.transfer_state).toBe('SUCCESS');
      expect(result.data.transfer_amount).toBe(100);
    });

    it('should process a transfer fail callback', () => {
      const testData = {
        mchid: '1900000100',
        out_bill_no: 'TRANSFER20240115002',
        transfer_bill_no: '1234567891',
        transfer_state: 'FAIL',
        fail_reason: 'NAME_NOT_CORRECT',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        transfer_amount: 200,
        desc: '测试转账失败',
      };

      const result = processCallback(
        testData,
        'TRANSFER.FAIL',
        '转账失败',
        'processMerchantTransferCallback',
        'mch-transfer',
      );

      expect(result.event_type).toBe('TRANSFER.FAIL');
      expect(result.data.transfer_state).toBe('FAIL');
      expect(result.data.fail_reason).toBe('NAME_NOT_CORRECT');
    });

    it('should process a transfer cancel callback', () => {
      const testData = {
        mchid: '1900000100',
        out_bill_no: 'TRANSFER20240115003',
        transfer_bill_no: '1234567892',
        transfer_state: 'CANCEL',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        transfer_amount: 300,
        desc: '测试转账撤销',
      };

      const result = processCallback(
        testData,
        'TRANSFER.CANCEL',
        '转账撤销',
        'processMerchantTransferCallback',
        'mch-transfer',
      );

      expect(result.event_type).toBe('TRANSFER.CANCEL');
      expect(result.data.transfer_state).toBe('CANCEL');
    });
  });

  describe('processMerchantTransferAuthorizationCallback', () => {
    it('should process authorization taking effect callback', () => {
      const testData = {
        mchid: '1900000100',
        out_authorization_no: 'AUTH20240115001',
        authorization_no: 'AUTH_WX_001',
        authorization_state: 'TAKING_EFFECT',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        authorization_code: 'AUTH_CODE_001',
      };

      const result = processCallback(
        testData,
        'USER_AUTHORIZATION.TAKING_EFFECT',
        '授权生效',
        'processMerchantTransferAuthorizationCallback',
        'mch-transfer-authorization',
      );

      expect(result.event_type).toBe('USER_AUTHORIZATION.TAKING_EFFECT');
      expect(result.data.out_authorization_no).toBe('AUTH20240115001');
      expect(result.data.authorization_state).toBe('TAKING_EFFECT');
    });

    it('should process authorization closed callback', () => {
      const testData = {
        mchid: '1900000100',
        out_authorization_no: 'AUTH20240115002',
        authorization_no: 'AUTH_WX_002',
        authorization_state: 'CLOSED',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
      };

      const result = processCallback(
        testData,
        'USER_AUTHORIZATION.CLOSED',
        '授权关闭',
        'processMerchantTransferAuthorizationCallback',
        'mch-transfer-authorization',
      );

      expect(result.event_type).toBe('USER_AUTHORIZATION.CLOSED');
      expect(result.data.authorization_state).toBe('CLOSED');
    });
  });
});
