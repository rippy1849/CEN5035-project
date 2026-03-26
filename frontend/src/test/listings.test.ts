import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getListings, createListing, updateListing, deleteListing } from '../api/listings';

// Mock the auth module
vi.mock('../api/auth', () => ({
  getAuthHeaders: () => ({ Authorization: 'Bearer test_token' }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Listings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getListings', () => {
    it('should fetch and return listings array', async () => {
      const mockListings = [
        { id: 1, title: 'Laptop', description: 'Good', price: 500, category: 'Electronics', user_id: 1 },
        { id: 2, title: 'Book', description: 'New', price: 20, category: 'Books', user_id: 1 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListings),
      });

      const result = await getListings();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/listings');
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Laptop');
    });

    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(getListings()).rejects.toThrow('Failed to fetch listings');
    });
  });

  describe('createListing', () => {
    it('should send POST with auth headers', async () => {
      const newListing = { title: 'Chair', description: 'Comfy', price: 50, category: 'Furniture', user_id: 0 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 3, ...newListing }),
      });

      const result = await createListing(newListing);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_token' },
        body: JSON.stringify(newListing),
      });
      expect(result.id).toBe(3);
    });
  });

  describe('updateListing', () => {
    it('should send PUT with auth headers', async () => {
      const update = { title: 'Updated Chair' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 3, ...update }),
      });

      await updateListing(3, update);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/listings/3', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_token' },
        body: JSON.stringify(update),
      });
    });
  });

  describe('deleteListing', () => {
    it('should send DELETE with auth headers', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await deleteListing(5);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/listings/5', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test_token' },
      });
    });

    it('should throw on 403 (not owner)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(deleteListing(5)).rejects.toThrow('You can only delete your own listings');
    });

    it('should throw on other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(deleteListing(5)).rejects.toThrow('Failed to delete listing');
    });
  });
});
