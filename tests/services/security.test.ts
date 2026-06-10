import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityService } from '../../src/services/security';
import { WxPayClient } from '../../src/core/client';
import type { EchoTestRequest } from '../../src/types';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('SecurityService', () => {
  let service: SecurityService;
  let mockClient: {
    post: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
    };

    MockWxPayClient.mockImplementation(() => mockClient);
    service = new SecurityService(mockClient as unknown as WxPayClient);
  });

  // ============= echoTest =============

  describe('echoTest', () => {
    it('should perform echo test', async () => {
      const request: EchoTestRequest = {
        echo_message: 'Hello WeChat Pay',
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          echo_message: 'Hello WeChat Pay',
          encrypted_echo_message: 'encrypted_data_base64',
        },
      });

      const result = await service.echoTest(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/security/echo',
        request,
      );
      expect(result.status).toBe(200);
      expect(result.data.echo_message).toBe('Hello WeChat Pay');
      expect(result.data.encrypted_echo_message).toBeDefined();
    });

    it('should perform echo test with notify_url', async () => {
      const request: EchoTestRequest = {
        echo_message: 'Test with callback',
        notify_url: 'https://example.com/notify',
      };

      mockClient.post.mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          echo_message: 'Test with callback',
          encrypted_echo_message: 'encrypted_data_base64',
        },
      });

      const result = await service.echoTest(request);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v3/security/echo',
        request,
      );
      expect(result.data.echo_message).toBe('Test with callback');
    });
  });
});
