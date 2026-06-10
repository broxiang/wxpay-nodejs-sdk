import { describe, it, expect } from 'vitest';
import { createCallbackTestHelper } from './helpers/callback-helper';

describe('Coupon Use Callback', () => {
  const { processCallback } = createCallbackTestHelper();

  describe('processCouponUseCallback', () => {
    it('should process a coupon use callback', () => {
      const testData = {
        stock_id: '1234567890',
        coupon_id: 'COUPON001',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        transaction_id: '4200001234567890',
        use_time: '2024-01-15T10:30:00+08:00',
        single_payment: {
          single_price: 100,
          quantity: 1,
        },
      };

      const result = processCallback(
        testData,
        'COUPON.USE',
        '代金券核销',
        'processCouponUseCallback',
        'coupon-use',
      );

      expect(result.event_type).toBe('COUPON.USE');
      expect(result.data.stock_id).toBe('1234567890');
      expect(result.data.coupon_id).toBe('COUPON001');
      expect(result.data.openid).toBe('oUpF8uMuAJO_M2pxb1Q9zNjWeS6o');
    });

    it('should process coupon use callback with multiple quantity', () => {
      const testData = {
        stock_id: '1234567890',
        coupon_id: 'COUPON002',
        openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        transaction_id: '4200001234567891',
        use_time: '2024-01-15T11:00:00+08:00',
        single_payment: {
          single_price: 50,
          quantity: 3,
        },
      };

      const result = processCallback(
        testData,
        'COUPON.USE',
        '代金券核销',
        'processCouponUseCallback',
        'coupon-use',
      );

      expect(result.data.single_payment.quantity).toBe(3);
    });
  });
});
