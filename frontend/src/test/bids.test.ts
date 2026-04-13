import { describe, it, expect, vi, beforeEach } from 'vitest';
import { placeBid, getBids, respondToBid, markFinalPrice, unmarkFinalPrice } from '../api/bids';

vi.mock('../api/auth', () => ({
  getAuthHeaders: () => ({ Authorization: 'Bearer test_token' }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Bids API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('placeBid', () => {
    it('should place bid with correct payload and auth headers', async () => {
      const mockResponse = {
        bid: { id: 1, listing_id: 5, buyer_id: 2, amount: 80, status: 'pending', bid_number: 1 },
        bids_remaining: 4,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await placeBid(5, 80);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/listings/5/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_token' },
        body: JSON.stringify({ amount: 80 }),
      });
      expect(result.bid.amount).toBe(80);
      expect(result.bids_remaining).toBe(4);
    });

    it('should throw on 403 when bidding on own listing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'You cannot bid on your own listing' }),
      });

      await expect(placeBid(5, 80)).rejects.toThrow('You cannot bid on your own listing');
    });

    it('should throw on other bid errors with error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'You have used all 5 bids for this listing' }),
      });

      await expect(placeBid(5, 80)).rejects.toThrow('You have used all 5 bids for this listing');
    });
  });

  describe('getBids', () => {
    it('should fetch bids with auth headers', async () => {
      const mockResponse = {
        bids: [{ id: 1, listing_id: 5, buyer_id: 2, amount: 80, status: 'pending', bid_number: 1 }],
        bids_remaining: 4,
        is_seller: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getBids(5);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/listings/5/bids', {
        headers: { Authorization: 'Bearer test_token' },
      });
      expect(result.bids).toHaveLength(1);
      expect(result.bids_remaining).toBe(4);
    });

    it('should throw on fetch bids failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(getBids(999)).rejects.toThrow('Failed to fetch bids');
    });
  });

  describe('respondToBid', () => {
    it('should respond to bid with accept action', async () => {
      const mockResponse = {
        bid: { id: 1, status: 'accepted' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await respondToBid(1, 'accept');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/bids/1/respond', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_token' },
        body: JSON.stringify({ action: 'accept', counter_amount: undefined }),
      });
      expect(result.bid.status).toBe('accepted');
    });

    it('should respond to bid with counter action and amount', async () => {
      const mockResponse = {
        bid: { id: 1, status: 'countered', counter_amount: 95 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await respondToBid(1, 'counter', 95);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/bids/1/respond', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_token' },
        body: JSON.stringify({ action: 'counter', counter_amount: 95 }),
      });
      expect(result.bid.counter_amount).toBe(95);
    });

    it('should respond to bid with reject action', async () => {
      const mockResponse = { bid: { id: 1, status: 'rejected' } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await respondToBid(1, 'reject');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/bids/1/respond', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_token' },
        body: JSON.stringify({ action: 'reject', counter_amount: undefined }),
      });
    });

    it('should throw on respond failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Only the listing owner can respond to bids' }),
      });

      await expect(respondToBid(1, 'accept')).rejects.toThrow('Only the listing owner can respond to bids');
    });
  });

  describe('markFinalPrice', () => {
    it('should mark listing as final price', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Price marked as final', is_final_price: true }),
      });

      await markFinalPrice(5);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/listings/5/final-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_token' },
      });
    });

    it('should throw on mark final price failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Only the listing owner can set final price' }),
      });

      await expect(markFinalPrice(5)).rejects.toThrow('Only the listing owner can set final price');
    });
  });

  describe('unmarkFinalPrice', () => {
    it('should call unmark-final-price endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Final price removed', is_final_price: false }),
      });

      await unmarkFinalPrice(5);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/listings/5/unmark-final-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_token' },
      });
    });

    it('should throw on unmark failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Only the listing owner can update final price' }),
      });

      await expect(unmarkFinalPrice(5)).rejects.toThrow('Only the listing owner can update final price');
    });
  });
});
