import { describe, it, expect } from 'vitest';
import { createCallbackTestHelper } from './helpers/callback-helper';

describe('Complaint Callback', () => {
  const { processCallback } = createCallbackTestHelper();

  describe('processComplaintCallback', () => {
    it('should process a new complaint callback', () => {
      const testData = {
        complaint_id: '1234567890',
        complaint_state: 'PENDING',
        complaint_time: '2024-01-15T10:00:00+08:00',
        complaint_detail: {
          transaction_id: '4200001234567890',
          out_trade_no: 'ORDER20240115001',
          complaint_reason: '商品质量问题',
        },
      };

      const result = processCallback(
        testData,
        'COMPLAINT.CREATE',
        '用户提交投诉',
        'processComplaintCallback',
        'complaint',
      );

      expect(result.event_type).toBe('COMPLAINT.CREATE');
      expect(result.data.complaint_id).toBe('1234567890');
      expect(result.data.complaint_state).toBe('PENDING');
    });

    it('should process complaint withdrawal callback', () => {
      const testData = {
        complaint_id: '1234567891',
        complaint_state: 'CLOSED',
        complaint_time: '2024-01-15T10:00:00+08:00',
        close_time: '2024-01-15T12:00:00+08:00',
        close_reason: 'USER_WITHDRAW',
      };

      const result = processCallback(
        testData,
        'COMPLAINT.CLOSE',
        '用户撤诉',
        'processComplaintCallback',
        'complaint',
      );

      expect(result.event_type).toBe('COMPLAINT.CLOSE');
      expect(result.data.complaint_state).toBe('CLOSED');
      expect(result.data.close_reason).toBe('USER_WITHDRAW');
    });

    it('should process complaint processed callback', () => {
      const testData = {
        complaint_id: '1234567892',
        complaint_state: 'PROCESSED',
        complaint_time: '2024-01-15T10:00:00+08:00',
        process_time: '2024-01-15T14:00:00+08:00',
      };

      const result = processCallback(
        testData,
        'COMPLAINT.PROCESSED',
        '投诉已处理',
        'processComplaintCallback',
        'complaint',
      );

      expect(result.event_type).toBe('COMPLAINT.PROCESSED');
      expect(result.data.complaint_state).toBe('PROCESSED');
    });
  });
});
