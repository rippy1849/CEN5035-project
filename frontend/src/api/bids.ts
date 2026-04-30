import { getAuthHeaders } from './auth';

const BASE_URL = 'http://localhost:8080';

export interface Bid {
  id: number;
  listing_id: number;
  buyer_id: number;
  buyer_name?: string;
  amount: number;
  status: 'pending' | 'accepted' | 'countered' | 'rejected';
  counter_amount?: number | null;
  bid_number: number;
  created_at: string;
  updated_at: string;
}

export interface BidWithListing extends Bid {
  listing_title: string;
  listing_price: number;
  listing_image: string;
}

export interface PlaceBidResponse {
  bid: Bid;
  bids_remaining: number;
}

export interface GetBidsResponse {
  bids: Bid[];
  bids_remaining: number;
  is_seller: boolean;
}

export async function placeBid(listingId: number, amount: number): Promise<PlaceBidResponse> {
  const res = await fetch(`${BASE_URL}/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ amount }),
  });
  if (res.status === 403) {
    const data = await res.json();
    throw new Error(data.error || 'You cannot bid on your own listing');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to place bid: ${res.statusText}`);
  }
  return res.json();
}

export async function getBids(listingId: number): Promise<GetBidsResponse> {
  const res = await fetch(`${BASE_URL}/listings/${listingId}/bids`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch bids: ${res.statusText}`);
  return res.json();
}

export async function respondToBid(
  bidId: number,
  action: 'accept' | 'counter' | 'reject',
  counterAmount?: number
): Promise<{ bid: Bid }> {
  const res = await fetch(`${BASE_URL}/bids/${bidId}/respond`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ action, counter_amount: counterAmount }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to respond to bid: ${res.statusText}`);
  }
  return res.json();
}

export async function acceptCounter(bidId: number): Promise<{ bid: Bid; order_id: number }> {
  const res = await fetch(`${BASE_URL}/bids/${bidId}/accept-counter`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to accept counter: ${res.statusText}`);
  }
  return res.json();
}

export async function getMyBids(): Promise<BidWithListing[]> {
  const res = await fetch(`${BASE_URL}/my/bids`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch my bids: ${res.statusText}`);
  return res.json();
}

export async function markFinalPrice(listingId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/listings/${listingId}/final-price`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to mark final price: ${res.statusText}`);
  }
}

export async function unmarkFinalPrice(listingId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/listings/${listingId}/unmark-final-price`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to unmark final price: ${res.statusText}`);
  }
}
