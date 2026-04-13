import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadListingImages, deleteListingImage } from '../api/listings';

vi.mock('../api/auth', () => ({
  getAuthHeaders: () => ({ Authorization: 'Bearer test_token' }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Image Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadListingImages', () => {
    it('should upload images with FormData and auth headers', async () => {
      const mockImages = ['/uploads/img1.jpg', '/uploads/img2.jpg'];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ images: mockImages }),
      });

      const files = [
        new File(['data1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['data2'], 'photo2.jpg', { type: 'image/jpeg' }),
      ];

      const result = await uploadListingImages(1, files);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/listings/1/images',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer test_token' }),
          body: expect.any(FormData),
        })
      );
      expect(result).toEqual(mockImages);
    });

    it('should throw on upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      const files = [new File(['data'], 'photo.jpg', { type: 'image/jpeg' })];

      await expect(uploadListingImages(1, files)).rejects.toThrow('Failed to upload images');
    });
  });

  describe('deleteListingImage', () => {
    it('should delete image with auth headers', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await deleteListingImage(1, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/listings/1/images/5',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({ Authorization: 'Bearer test_token' }),
        })
      );
    });

    it('should throw on delete failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(deleteListingImage(1, 5)).rejects.toThrow('Failed to delete image');
    });
  });
});
