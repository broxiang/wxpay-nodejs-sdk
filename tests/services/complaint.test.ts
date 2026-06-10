import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplaintService } from '../../src/services/complaint';
import { WxPayClient } from '../../src/core/client';
import type {
  QueryComplaintsParams,
  ReplyComplaintRequest,
  CompleteComplaintRequest,
  UpdateComplaintRefundRequest,
  ReplyImmediateServiceRequest,
  ComplaintCallbackUrlRequest,
} from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('ComplaintService', () => {
  let service: ComplaintService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    upload: ReturnType<typeof vi.fn>;
    downloadRaw: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      upload: vi.fn(),
      downloadRaw: vi.fn(),
    };

    MockWxPayClient.mockImplementation(() => mockClient);
    service = new ComplaintService(mockClient as unknown as WxPayClient);
  });

  // ============= queryComplaints =============

  describe('queryComplaints', () => {
    it('should query complaints with all parameters', async () => {
      const params: QueryComplaintsParams = {
        begin_date: '2024-01-01',
        end_date: '2024-01-31',
        complaint_state: 'PENDING',
        mchid: '1900000100',
        offset: 0,
        limit: 10,
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          total_count: 1,
          offset: 0,
          limit: 10,
          data: [{ complaint_id: '123456' }],
        },
      });

      const result = await service.queryComplaints(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2',
        expect.objectContaining({
          begin_date: '2024-01-01',
          end_date: '2024-01-31',
          complaint_state: 'PENDING',
          mchid: '1900000100',
          offset: 0,
          limit: 10,
        }),
      );
      expect(result.data.total_count).toBe(1);
    });

    it('should query complaints with only required parameters', async () => {
      const params: QueryComplaintsParams = {
        begin_date: '2024-01-01',
        end_date: '2024-01-31',
      };

      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: { total_count: 0, data: [] },
      });

      await service.queryComplaints(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2',
        expect.objectContaining({
          begin_date: '2024-01-01',
          end_date: '2024-01-31',
        }),
      );
    });
  });

  // ============= queryComplaint =============

  describe('queryComplaint', () => {
    it('should query complaint detail by complaint_id', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          complaint_id: '123456',
          complaint_state: 'PENDING',
          complaint_reason: '商品质量问题',
        },
      });

      const result = await service.queryComplaint('123456');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2/123456',
      );
      expect(result.data.complaint_id).toBe('123456');
    });
  });

  // ============= queryNegotiationHistory =============

  describe('queryNegotiationHistory', () => {
    it('should query negotiation history', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          data: [
            { complaint_id: '123456', message: '协商记录' },
          ],
        },
      });

      const result = await service.queryNegotiationHistory('123456');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2/123456/negotiation-historys',
      );
      expect(result.data.data).toHaveLength(1);
    });
  });

  // ============= replyComplaint =============

  describe('replyComplaint', () => {
    it('should reply to complaint', async () => {
      const request: ReplyComplaintRequest = {
        complaint_id: '123456',
        reply_content: '我们会尽快处理',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.replyComplaint(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2/123456/replies',
        { reply_content: '我们会尽快处理' },
      );
      expect(result.status).toBe(204);
    });
  });

  // ============= completeComplaint =============

  describe('completeComplaint', () => {
    it('should complete complaint processing', async () => {
      const request: CompleteComplaintRequest = {
        complaint_id: '123456',
        complaint_state: 'PROCESSED',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.completeComplaint(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2/123456/complete',
        { complaint_state: 'PROCESSED' },
      );
      expect(result.status).toBe(204);
    });
  });

  // ============= updateRefundResult =============

  describe('updateRefundResult', () => {
    it('should update refund result', async () => {
      const request: UpdateComplaintRefundRequest = {
        complaint_id: '123456',
        refund_status: 'REFUNDED',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.updateRefundResult(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2/123456/update-refund',
        { refund_status: 'REFUNDED' },
      );
      expect(result.status).toBe(204);
    });
  });

  // ============= replyImmediateService =============

  describe('replyImmediateService', () => {
    it('should reply immediate service complaint', async () => {
      const request: ReplyImmediateServiceRequest = {
        complaint_id: '123456',
        reply_content: '已处理',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.replyImmediateService(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2/123456/replies',
        { reply_content: '已处理' },
      );
      expect(result.status).toBe(204);
    });
  });

  // ============= uploadImage =============

  describe('uploadImage', () => {
    it('should upload complaint image', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      mockClient.upload.mockResolvedValue({
        status: 200,
        headers: {},
        data: { media_id: 'MEDIA001' },
      });

      const result = await service.uploadImage(imageBuffer, 'evidence.jpg');

      expect(mockClient.upload).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2/images/upload',
        imageBuffer,
        'evidence.jpg',
      );
      expect(result.data.media_id).toBe('MEDIA001');
    });
  });

  // ============= getImage =============

  describe('getImage', () => {
    it('should get complaint image by media_id', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      mockClient.downloadRaw.mockResolvedValue({
        status: 200,
        headers: {},
        data: imageBuffer,
      });

      const result = await service.getImage('MEDIA001');

      expect(mockClient.downloadRaw).toHaveBeenCalledWith(
        '/v3/merchant-service/complaints-v2/images/MEDIA001',
      );
      expect(result.data).toBe(imageBuffer);
    });
  });

  // ============= Callback URL Management =============

  describe('createCallbackUrl', () => {
    it('should create complaint callback URL', async () => {
      const request: ComplaintCallbackUrlRequest = {
        url: 'https://example.com/callback',
      };

      mockClient.post.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.createCallbackUrl(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/merchant-service/complaint-notifications',
        request,
      );
      expect(result.status).toBe(204);
    });
  });

  describe('queryCallbackUrl', () => {
    it('should query complaint callback URL', async () => {
      mockClient.get.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          url: 'https://example.com/callback',
          mchid: '1900000100',
        },
      });

      const result = await service.queryCallbackUrl();

      expect(mockClient.get).toHaveBeenCalledWith(
        '/v3/merchant-service/complaint-notifications',
      );
      expect(result.data.url).toBe('https://example.com/callback');
    });
  });

  describe('updateCallbackUrl', () => {
    it('should update complaint callback URL', async () => {
      const request: ComplaintCallbackUrlRequest = {
        url: 'https://example.com/new-callback',
      };

      mockClient.put.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.updateCallbackUrl(request);

      expect(mockClient.put).toHaveBeenCalledWith(
        '/v3/merchant-service/complaint-notifications',
        request,
      );
      expect(result.status).toBe(204);
    });
  });

  describe('deleteCallbackUrl', () => {
    it('should delete complaint callback URL', async () => {
      mockClient.delete.mockResolvedValue({
        status: 204,
        headers: {},
        data: undefined,
      });

      const result = await service.deleteCallbackUrl();

      expect(mockClient.delete).toHaveBeenCalledWith(
        '/v3/merchant-service/complaint-notifications',
      );
      expect(result.status).toBe(204);
    });
  });
});
