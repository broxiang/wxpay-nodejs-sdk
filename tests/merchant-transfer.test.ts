import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MerchantTransferService } from '../src/services/merchant-transfer.js';
import {
  buildMerchantTransferJsapiBridgeConfig,
  buildMerchantTransferMiniProgramBridgeConfig,
  buildMerchantTransferAuthorizationJsapiBridgeConfig,
} from '../src/services/bridge.js';
import type {
  CreateMerchantTransferRequest,
  CreateTransferWithAuthorizationRequest,
  CreateMerchantTransferAuthorizationRequest,
  CreateTransferAfterAuthorizationRequest,
  ApplyMerchantTransferElecSignByOutBillNoRequest,
  ApplyMerchantTransferElecSignByTransferBillNoRequest,
} from '../src/types/index.js';

// Mock WxPayClient
const mockPost = vi.fn();
const mockGet = vi.fn();
const mockClient = {
  post: mockPost,
  get: mockGet,
  mchid: '1900000001',
} as unknown as import('../src/core/client.js').WxPayClient;

describe('MerchantTransferService', () => {
  let service: MerchantTransferService;

  beforeEach(() => {
    service = new MerchantTransferService(mockClient);
    vi.clearAllMocks();
  });

  describe('createTransfer', () => {
    it('should call POST /v3/fund-app/mch-transfer/transfer-bills', async () => {
      const request: CreateMerchantTransferRequest = {
        appid: 'wxf636efh567hg4356',
        out_bill_no: 'plfk2020042013',
        transfer_scene_id: '1000',
        openid: 'o-MYE42l80oelYMDE34nYD456Xoy',
        transfer_amount: 400000,
        transfer_remark: '新会员开通有礼',
        transfer_scene_report_infos: [{ info_type: '活动名称', info_content: '新会员有礼' }],
      };

      const mockResponse = {
        out_bill_no: 'plfk2020042013',
        transfer_bill_no: '1330000071100999991182020050700019480001',
        create_time: '2015-05-20T13:29:35.120+08:00',
        state: 'ACCEPTED',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.createTransfer(request);

      expect(mockPost).toHaveBeenCalledWith('/v3/fund-app/mch-transfer/transfer-bills', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryTransferByOutBillNo', () => {
    it('should call GET /v3/fund-app/mch-transfer/transfer-bills/out-bill-no/{out_bill_no}', async () => {
      const mockResponse = {
        mch_id: '1900000001',
        out_bill_no: 'plfk2020042013',
        transfer_bill_no: '1330000071100999991182020050700019480001',
        appid: 'wxf636efh567hg4356',
        state: 'SUCCESS',
        transfer_amount: 400000,
        transfer_remark: '新会员开通有礼',
        openid: 'o-MYE42l80oelYMDE34nYD456Xoy',
        create_time: '2015-05-20T13:29:35.120+08:00',
        update_time: '2015-05-20T13:29:35.120+08:00',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryTransferByOutBillNo('plfk2020042013');

      expect(mockGet).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/transfer-bills/out-bill-no/plfk2020042013',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryTransferByTransferBillNo', () => {
    it('should call GET /v3/fund-app/mch-transfer/transfer-bills/transfer-bill-no/{transfer_bill_no}', async () => {
      const mockResponse = {
        mch_id: '1900000001',
        out_bill_no: 'plfk2020042013',
        transfer_bill_no: '1330000071100999991182020050700019480001',
        appid: 'wxf636efh567hg4356',
        state: 'SUCCESS',
        transfer_amount: 400000,
        transfer_remark: '新会员开通有礼',
        openid: 'o-MYE42l80oelYMDE34nYD456Xoy',
        create_time: '2015-05-20T13:29:35.120+08:00',
        update_time: '2015-05-20T13:29:35.120+08:00',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryTransferByTransferBillNo(
        '1330000071100999991182020050700019480001',
      );

      expect(mockGet).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/transfer-bills/transfer-bill-no/1330000071100999991182020050700019480001',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelTransfer', () => {
    it('should call POST /v3/fund-app/mch-transfer/transfer-bills/out-bill-no/{out_bill_no}/cancel', async () => {
      const mockResponse = {
        out_bill_no: 'plfk2020042013',
        transfer_bill_no: '1330000071100999991182020050700019480001',
        state: 'CANCELING',
        update_time: '2015-05-20T13:29:35.120+08:00',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.cancelTransfer('plfk2020042013');

      expect(mockPost).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/transfer-bills/out-bill-no/plfk2020042013/cancel',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('applyElecSignByOutBillNo', () => {
    it('should call POST /v3/fund-app/mch-transfer/elecsign/out-bill-no', async () => {
      const request: ApplyMerchantTransferElecSignByOutBillNoRequest = {
        out_bill_no: 'plfk2020042013',
      };

      const mockResponse = {
        state: 'FINISHED',
        create_time: '2015-05-20T13:29:35.120+08:00',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.applyElecSignByOutBillNo(request);

      expect(mockPost).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/elecsign/out-bill-no',
        request,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryElecSignByOutBillNo', () => {
    it('should call GET /v3/fund-app/mch-transfer/elecsign/out-bill-no/{out_bill_no}', async () => {
      const mockResponse = {
        state: 'FINISHED',
        create_time: '2015-05-20T13:29:35.120+08:00',
        update_time: '2015-05-20T13:29:35.120+08:00',
        hash_type: 'SHA256',
        hash_value: 'DE731F35146A0BEFADE5DB9D1E468D96C01CA8898119C674FEE9F11F4DBE5529',
        download_url: 'https://api.mch.weixin.qq.com/v3/transferbilldownload/file?token=xxx',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryElecSignByOutBillNo('plfk2020042013');

      expect(mockGet).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/elecsign/out-bill-no/plfk2020042013',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('applyElecSignByTransferBillNo', () => {
    it('should call POST /v3/fund-app/mch-transfer/elecsign/transfer-bill-no', async () => {
      const request: ApplyMerchantTransferElecSignByTransferBillNoRequest = {
        transfer_bill_no: '1330000071100999991182020050700019480001',
      };

      const mockResponse = {
        state: 'GENERATING',
        create_time: '2015-05-20T13:29:35.120+08:00',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.applyElecSignByTransferBillNo(request);

      expect(mockPost).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/elecsign/transfer-bill-no',
        request,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryElecSignByTransferBillNo', () => {
    it('should call GET /v3/fund-app/mch-transfer/elecsign/transfer-bill-no/{transfer_bill_no}', async () => {
      const mockResponse = {
        state: 'FINISHED',
        create_time: '2015-05-20T13:29:35.120+08:00',
        update_time: '2015-05-20T13:29:35.120+08:00',
        hash_type: 'SHA256',
        hash_value: 'DE731F35146A0BEFADE5DB9D1E468D96C01CA8898119C674FEE9F11F4DBE5529',
        download_url: 'https://api.mch.weixin.qq.com/v3/transferbilldownload/file?token=xxx',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryElecSignByTransferBillNo(
        '1330000071100999991182020050700019480001',
      );

      expect(mockGet).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/elecsign/transfer-bill-no/1330000071100999991182020050700019480001',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createTransferWithAuthorization', () => {
    it('should call POST /v3/fund-app/mch-transfer/transfer-bills/pre-transfer-with-authorization', async () => {
      const request: CreateTransferWithAuthorizationRequest = {
        appid: 'wxf636efh567hg4356',
        out_bill_no: 'plfk2020042013',
        transfer_scene_id: '1000',
        openid: 'o-MYE42l80oelYMDE34nYD456Xoy',
        transfer_amount: 400000,
        transfer_remark: '新会员开通有礼',
        authorization_info: {
          user_display_name: '用户昵称',
          out_authorization_no: 'auth_2020042013',
          authorization_notify_url: 'https://www.weixin.qq.com/wxpay/callback',
        },
      };

      const mockResponse = {
        out_bill_no: 'plfk2020042013',
        transfer_bill_no: '1330000071100999991182020050700019480001',
        create_time: '2015-05-20T13:29:35.120+08:00',
        state: 'WAIT_USER_CONFIRM',
        package_info: 'affffddafdfafddffda==',
        user_display_name: '用户昵称',
        out_authorization_no: 'auth_2020042013',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.createTransferWithAuthorization(request);

      expect(mockPost).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/transfer-bills/pre-transfer-with-authorization',
        request,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createAuthorization', () => {
    it('should call POST /v3/fund-app/mch-transfer/user-confirm-authorization', async () => {
      const request: CreateMerchantTransferAuthorizationRequest = {
        out_authorization_no: 'auth_2020042013',
        appid: 'wxf636efh567hg4356',
        openid: 'o-MYE42l80oelYMDE34nYD456Xoy',
        transfer_scene_id: '1000',
        user_display_name: '用户昵称',
        authorization_notify_url: 'https://www.weixin.qq.com/wxpay/callback',
      };

      const mockResponse = {
        out_authorization_no: 'auth_2020042013',
        state: 'WAIT_USER_CONFIRM',
        create_time: '2015-05-20T13:29:35.120+08:00',
        package_info: '0002-affffddafdfafddffda==',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.createAuthorization(request);

      expect(mockPost).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/user-confirm-authorization',
        request,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryAuthorizationByOutAuthorizationNo', () => {
    it('should call GET /v3/fund-app/mch-transfer/user-confirm-authorization/out-authorization-no/{out_authorization_no}', async () => {
      const mockResponse = {
        out_authorization_no: 'auth_2020042013',
        appid: 'wxf636efh567hg4356',
        openid: 'o-MYE42l80oelYMDE34nYD456Xoy',
        user_display_name: '用户昵称',
        authorization_id: '1230000000',
        state: 'TAKING_EFFECT',
        authorize_time: '2015-05-20T13:29:35.120+08:00',
        transfer_scene_id: '1000',
        user_recv_perception: '现金奖励',
        create_time: '2015-05-20T13:29:35.120+08:00',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryAuthorizationByOutAuthorizationNo('auth_2020042013');

      expect(mockGet).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/user-confirm-authorization/out-authorization-no/auth_2020042013',
        undefined,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should pass is_display_authorization option', async () => {
      const mockResponse = {
        out_authorization_no: 'auth_2020042013',
        appid: 'wxf636efh567hg4356',
        openid: 'o-MYE42l80oelYMDE34nYD456Xoy',
        user_display_name: '用户昵称',
        state: 'TAKING_EFFECT',
        package_info: '0002-affffddafdfafddffda==',
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await service.queryAuthorizationByOutAuthorizationNo('auth_2020042013', {
        is_display_authorization: true,
      });

      expect(mockGet).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/user-confirm-authorization/out-authorization-no/auth_2020042013',
        { is_display_authorization: true },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createTransferAfterAuthorization', () => {
    it('should call POST /v3/fund-app/mch-transfer/transfer-bills/transfer', async () => {
      const request: CreateTransferAfterAuthorizationRequest = {
        appid: 'wxf636efh567hg4356',
        out_bill_no: 'plfk2020042013',
        transfer_scene_id: '1000',
        transfer_amount: 400000,
        transfer_remark: '新会员开通有礼',
        out_authorization_no: 'auth_2020042013',
      };

      const mockResponse = {
        mch_id: '1900000001',
        out_bill_no: 'plfk2020042013',
        transfer_bill_no: '1330000071100999991182020050700019480001',
        appid: 'wxf636efh567hg4356',
        state: 'SUCCESS',
        transfer_amount: 400000,
        transfer_remark: '新会员开通有礼',
        openid: 'o-MYE42l80oelYMDE34nYD456Xoy',
        create_time: '2015-05-20T13:29:35.120+08:00',
        update_time: '2015-05-20T13:29:35.120+08:00',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.createTransferAfterAuthorization(request);

      expect(mockPost).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/transfer-bills/transfer',
        request,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('closeAuthorization', () => {
    it('should call POST /v3/fund-app/mch-transfer/user-confirm-authorization/out-authorization-no/{out_authorization_no}/close', async () => {
      const mockResponse = {
        out_authorization_no: 'auth_2020042013',
        appid: 'wxf636efh567hg4356',
        openid: 'o-MYE42l80oelYMDE34nYD456Xoy',
        user_display_name: '用户昵称',
        authorization_id: '1230000000',
        state: 'CLOSED',
        close_info: {
          close_time: '2015-05-20T13:29:35.120+08:00',
          close_reason: 'CLOSE_VIA_MCH_API',
        },
        transfer_scene_id: '1000',
        user_recv_perception: '现金奖励',
        create_time: '2015-05-20T13:29:35.120+08:00',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.closeAuthorization('auth_2020042013');

      expect(mockPost).toHaveBeenCalledWith(
        '/v3/fund-app/mch-transfer/user-confirm-authorization/out-authorization-no/auth_2020042013/close',
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

describe('Bridge Functions', () => {
  describe('buildMerchantTransferJsapiBridgeConfig', () => {
    it('should return correct config for JSAPI', () => {
      const config = buildMerchantTransferJsapiBridgeConfig(
        '1230000000',
        'wx8888888888888888',
        'affffddafdfafddffda==',
      );

      expect(config).toEqual({
        mchId: '1230000000',
        appId: 'wx8888888888888888',
        package: 'affffddafdfafddffda==',
      });
    });
  });

  describe('buildMerchantTransferMiniProgramBridgeConfig', () => {
    it('should return correct config for MiniProgram', () => {
      const config = buildMerchantTransferMiniProgramBridgeConfig(
        '1230000000',
        'wx8888888888888888',
        'affffddafdfafddffda==',
      );

      expect(config).toEqual({
        mchId: '1230000000',
        appId: 'wx8888888888888888',
        package: 'affffddafdfafddffda==',
      });
    });
  });

  describe('buildMerchantTransferAuthorizationJsapiBridgeConfig', () => {
    it('should return correct config for authorization JSAPI', () => {
      const config = buildMerchantTransferAuthorizationJsapiBridgeConfig(
        '1230000000',
        'wx8888888888888888',
        '0002-affffddafdfafddffda==',
      );

      expect(config).toEqual({
        mchId: '1230000000',
        appId: 'wx8888888888888888',
        package: '0002-affffddafdfafddffda==',
      });
    });
  });
});
