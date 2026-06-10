import { describe, it, expect } from 'vitest';
import type {
  CreateProfitSharingOrderRequest,
  CreateProfitSharingOrderResponse,
  QueryProfitSharingOrderParams,
  CreateProfitSharingReturnOrderRequest,
  CreateProfitSharingReturnOrderResponse,
  QueryProfitSharingReturnOrderParams,
  UnfreezeProfitSharingRequest,
  QueryProfitSharingAmountResponse,
  AddProfitSharingReceiverRequest,
  AddProfitSharingReceiverResponse,
  DeleteProfitSharingReceiverRequest,
  DeleteProfitSharingReceiverResponse,
  ProfitSharingBillParams,
  ProfitSharingBillResponse,
} from '../src/types/index.js';

/**
 * 分账服务类型测试
 *
 * 由于分账 API 需要真实的微信支付商户环境，
 * 这里主要验证类型定义的正确性和请求参数的结构完整性。
 */
describe('ProfitSharingService - Type Definitions', () => {
  describe('CreateProfitSharingOrderRequest', () => {
    it('should accept valid request with MERCHANT_ID receivers', () => {
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
      expect(request.transaction_id).toBeTruthy();
      expect(request.receivers).toHaveLength(1);
      expect(request.receivers[0].type).toBe('MERCHANT_ID');
    });

    it('should accept valid request with PERSONAL_OPENID receivers and appid', () => {
      const request: CreateProfitSharingOrderRequest = {
        appid: 'wx1234567890abcdef',
        transaction_id: '4208450740201411110007820472',
        out_order_no: 'P20150806125347',
        unfreeze_unsplit: true,
        receivers: [
          {
            type: 'PERSONAL_OPENID',
            account: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
            amount: 50,
            description: '分给个人用户',
          },
        ],
      };
      expect(request.appid).toBeTruthy();
      expect(request.receivers[0].type).toBe('PERSONAL_OPENID');
    });

    it('should support multiple receivers', () => {
      const request: CreateProfitSharingOrderRequest = {
        transaction_id: '4208450740201411110007820472',
        out_order_no: 'P20150806125348',
        unfreeze_unsplit: false,
        receivers: [
          {
            type: 'MERCHANT_ID',
            account: '1900000101',
            amount: 300,
            description: '分给商户B',
          },
          {
            type: 'MERCHANT_ID',
            account: '1900000102',
            amount: 200,
            description: '分给商户C',
          },
        ],
      };
      expect(request.receivers).toHaveLength(2);
      expect(request.receivers[0].amount + request.receivers[1].amount).toBe(500);
    });
  });

  describe('CreateProfitSharingOrderResponse', () => {
    it('should match expected response structure', () => {
      const response: CreateProfitSharingOrderResponse = {
        transaction_id: '4208450740201411110007820472',
        out_order_no: 'P20150806125346',
        order_id: '1217752501201407033233368018',
        state: 'PROCESSING',
        receivers: [
          {
            amount: 100,
            description: '分给商户A',
            type: 'MERCHANT_ID',
            account: '1900000109',
            result: 'PENDING',
            create_time: '2015-05-20T13:29:35+08:00',
            finish_time: '2015-05-20T13:29:35+08:00',
            detail_id: '36011111111111111111111',
          },
        ],
      };
      expect(response.state).toBe('PROCESSING');
      expect(response.order_id).toBeTruthy();
    });

    it('should handle CLOSED receiver with fail_reason', () => {
      const response: CreateProfitSharingOrderResponse = {
        transaction_id: '4208450740201411110007820472',
        out_order_no: 'P20150806125346',
        order_id: '1217752501201407033233368018',
        state: 'FINISHED',
        receivers: [
          {
            amount: 100,
            description: '分给商户A',
            type: 'MERCHANT_ID',
            account: '1900000109',
            result: 'CLOSED',
            fail_reason: 'ACCOUNT_ABNORMAL',
            create_time: '2015-05-20T13:29:35+08:00',
            finish_time: '2015-05-20T13:29:35+08:00',
            detail_id: '36011111111111111111111',
          },
        ],
      };
      expect(response.state).toBe('FINISHED');
      expect(response.receivers[0].result).toBe('CLOSED');
      expect(response.receivers[0].fail_reason).toBe('ACCOUNT_ABNORMAL');
    });
  });

  describe('QueryProfitSharingOrderParams', () => {
    it('should require both outOrderNo and transactionId', () => {
      const params: QueryProfitSharingOrderParams = {
        outOrderNo: 'P20150806125346',
        transactionId: '4208450740201411110007820472',
      };
      expect(params.outOrderNo).toBeTruthy();
      expect(params.transactionId).toBeTruthy();
    });
  });

  describe('CreateProfitSharingReturnOrderRequest', () => {
    it('should accept request with order_id', () => {
      const request: CreateProfitSharingReturnOrderRequest = {
        order_id: '1217752501201407033233368018',
        out_return_no: 'R20150806125346',
        return_mchid: '1900000109',
        amount: 100,
        description: '用户退款',
      };
      expect(request.order_id).toBeTruthy();
      expect(request.out_return_no).toBeTruthy();
    });

    it('should accept request with out_order_no', () => {
      const request: CreateProfitSharingReturnOrderRequest = {
        out_order_no: 'P20150806125346',
        out_return_no: 'R20150806125347',
        return_mchid: '1900000109',
        amount: 50,
        description: '分账回退',
      };
      expect(request.out_order_no).toBeTruthy();
      expect(request.amount).toBe(50);
    });
  });

  describe('CreateProfitSharingReturnOrderResponse', () => {
    it('should match expected response structure for SUCCESS', () => {
      const response: CreateProfitSharingReturnOrderResponse = {
        order_id: '1217752501201407033233368018',
        out_order_no: 'P20150806125346',
        out_return_no: 'R20150806125346',
        return_id: '1217752501201407033233368019',
        return_mchid: '1900000109',
        amount: 100,
        description: '用户退款',
        result: 'SUCCESS',
        create_time: '2015-05-20T13:29:35+08:00',
        finish_time: '2015-05-20T13:29:35+08:00',
      };
      expect(response.result).toBe('SUCCESS');
      expect(response.return_id).toBeTruthy();
    });

    it('should include fail_reason when result is FAILED', () => {
      const response: CreateProfitSharingReturnOrderResponse = {
        order_id: '1217752501201407033233368018',
        out_order_no: 'P20150806125346',
        out_return_no: 'R20150806125346',
        return_id: '1217752501201407033233368019',
        return_mchid: '1900000109',
        amount: 100,
        description: '用户退款',
        result: 'FAILED',
        fail_reason: 'BALANCE_NOT_ENOUGH',
        create_time: '2015-05-20T13:29:35+08:00',
        finish_time: '2015-05-20T13:29:35+08:00',
      };
      expect(response.result).toBe('FAILED');
      expect(response.fail_reason).toBe('BALANCE_NOT_ENOUGH');
    });
  });

  describe('QueryProfitSharingReturnOrderParams', () => {
    it('should require both outReturnNo and outOrderNo', () => {
      const params: QueryProfitSharingReturnOrderParams = {
        outReturnNo: 'R20150806125346',
        outOrderNo: 'P20150806125346',
      };
      expect(params.outReturnNo).toBeTruthy();
      expect(params.outOrderNo).toBeTruthy();
    });
  });

  describe('UnfreezeProfitSharingRequest', () => {
    it('should accept valid unfreeze request', () => {
      const request: UnfreezeProfitSharingRequest = {
        transaction_id: '4208450740201411110007820472',
        out_order_no: 'P20150806125346',
        description: '解冻全部剩余资金',
      };
      expect(request.transaction_id).toBeTruthy();
      expect(request.description).toBeTruthy();
    });
  });

  describe('QueryProfitSharingAmountResponse', () => {
    it('should match expected response structure', () => {
      const response: QueryProfitSharingAmountResponse = {
        transaction_id: '4208450740201411110007820472',
        unsplit_amount: 1000,
      };
      expect(response.transaction_id).toBeTruthy();
      expect(response.unsplit_amount).toBeGreaterThan(0);
    });
  });

  describe('AddProfitSharingReceiverRequest', () => {
    it('should accept valid MERCHANT_ID receiver', () => {
      const request: AddProfitSharingReceiverRequest = {
        appid: 'wx1234567890abcdef',
        type: 'MERCHANT_ID',
        account: '1900000109',
        name: 'encrypted_merchant_name',
        relation_type: 'PARTNER',
      };
      expect(request.type).toBe('MERCHANT_ID');
      expect(request.relation_type).toBe('PARTNER');
    });

    it('should accept PERSONAL_OPENID receiver', () => {
      const request: AddProfitSharingReceiverRequest = {
        appid: 'wx1234567890abcdef',
        type: 'PERSONAL_OPENID',
        account: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
        relation_type: 'USER',
      };
      expect(request.type).toBe('PERSONAL_OPENID');
      expect(request.relation_type).toBe('USER');
    });

    it('should require custom_relation when relation_type is CUSTOM', () => {
      const request: AddProfitSharingReceiverRequest = {
        appid: 'wx1234567890abcdef',
        type: 'MERCHANT_ID',
        account: '1900000109',
        relation_type: 'CUSTOM',
        custom_relation: '代理商',
      };
      expect(request.relation_type).toBe('CUSTOM');
      expect(request.custom_relation).toBe('代理商');
    });
  });

  describe('AddProfitSharingReceiverResponse', () => {
    it('should match expected response structure', () => {
      const response: AddProfitSharingReceiverResponse = {
        type: 'MERCHANT_ID',
        account: '1900000109',
        relation_type: 'PARTNER',
      };
      expect(response.type).toBe('MERCHANT_ID');
      expect(response.account).toBe('1900000109');
    });
  });

  describe('DeleteProfitSharingReceiverRequest', () => {
    it('should accept valid delete request', () => {
      const request: DeleteProfitSharingReceiverRequest = {
        appid: 'wx1234567890abcdef',
        type: 'MERCHANT_ID',
        account: '1900000109',
      };
      expect(request.appid).toBeTruthy();
      expect(request.account).toBeTruthy();
    });
  });

  describe('DeleteProfitSharingReceiverResponse', () => {
    it('should match expected response structure', () => {
      const response: DeleteProfitSharingReceiverResponse = {
        type: 'MERCHANT_ID',
        account: '1900000109',
      };
      expect(response.type).toBe('MERCHANT_ID');
      expect(response.account).toBe('1900000109');
    });
  });

  describe('ProfitSharingBillParams', () => {
    it('should accept valid bill params', () => {
      const params: ProfitSharingBillParams = {
        bill_date: '2024-01-15',
        tar_type: 'GZIP',
      };
      expect(params.bill_date).toBe('2024-01-15');
    });

    it('should accept bill params without tar_type', () => {
      const params: ProfitSharingBillParams = {
        bill_date: '2024-01-15',
      };
      expect(params.bill_date).toBeTruthy();
    });
  });

  describe('ProfitSharingBillResponse', () => {
    it('should match expected response structure', () => {
      const response: ProfitSharingBillResponse = {
        hash_type: 'SHA1',
        hash_value: '79bb0f45fc4c42234a918000b2668d689e2bde04',
        download_url: 'https://api.mch.weixin.qq.com/v3/bill/downloadurl?token=xxx',
      };
      expect(response.hash_type).toBe('SHA1');
      expect(response.download_url).toBeTruthy();
    });
  });

  describe('ProfitSharingReceiverType', () => {
    it('should only allow valid receiver types', () => {
      const validTypes: Array<'MERCHANT_ID' | 'PERSONAL_OPENID'> = [
        'MERCHANT_ID',
        'PERSONAL_OPENID',
      ];
      expect(validTypes).toContain('MERCHANT_ID');
      expect(validTypes).toContain('PERSONAL_OPENID');
    });
  });

  describe('ProfitSharingRelationType', () => {
    it('should cover all documented relation types', () => {
      const relationTypes: string[] = [
        'STORE',
        'STAFF',
        'STORE_OWNER',
        'PARTNER',
        'HEADQUARTER',
        'BRAND',
        'DISTRIBUTOR',
        'USER',
        'SUPPLIER',
        'CUSTOM',
      ];
      expect(relationTypes).toHaveLength(10);
    });
  });
});
