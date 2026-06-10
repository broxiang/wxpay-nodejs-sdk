import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaService } from '../../src/services/media';
import { WxPayClient } from '../../src/core/client';

vi.mock('../../src/core/client.js', () => ({
  WxPayClient: vi.fn(),
}));

const MockWxPayClient = WxPayClient as unknown as ReturnType<typeof vi.fn>;

describe('MediaService', () => {
  let service: MediaService;
  let mockClient: {
    upload: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      upload: vi.fn(),
    };

    MockWxPayClient.mockImplementation(() => mockClient);
    service = new MediaService(mockClient as unknown as WxPayClient);
  });

  // ============= uploadImage =============

  describe('uploadImage', () => {
    it('should upload image file', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      mockClient.upload.mockResolvedValue({
        status: 200,
        headers: {},
        data: { media_id: 'jCMCSgF2kieJ3BrB1GGNJnOkxbweMKZJkbsLH' },
      });

      const result = await service.uploadImage(imageBuffer, 'logo.jpg');

      expect(mockClient.upload).toHaveBeenCalledWith(
        '/v3/merchant/media/upload',
        imageBuffer,
        'logo.jpg',
        { type: 'image' },
      );
      expect(result.status).toBe(200);
      expect(result.data.media_id).toBeDefined();
    });

    it('should upload PNG image', async () => {
      const imageBuffer = Buffer.from('fake-png-data');

      mockClient.upload.mockResolvedValue({
        status: 200,
        headers: {},
        data: { media_id: 'media_png_001' },
      });

      const result = await service.uploadImage(imageBuffer, 'banner.png');

      expect(mockClient.upload).toHaveBeenCalledWith(
        '/v3/merchant/media/upload',
        imageBuffer,
        'banner.png',
        { type: 'image' },
      );
      expect(result.data.media_id).toBe('media_png_001');
    });

    it('should upload BMP image', async () => {
      const imageBuffer = Buffer.from('fake-bmp-data');

      mockClient.upload.mockResolvedValue({
        status: 200,
        headers: {},
        data: { media_id: 'media_bmp_001' },
      });

      const result = await service.uploadImage(imageBuffer, 'photo.bmp');

      expect(mockClient.upload).toHaveBeenCalledWith(
        '/v3/merchant/media/upload',
        imageBuffer,
        'photo.bmp',
        { type: 'image' },
      );
      expect(result.data.media_id).toBe('media_bmp_001');
    });
  });
});
