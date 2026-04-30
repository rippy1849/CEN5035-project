import { getAuthHeaders } from './auth';

const BASE_URL = 'http://localhost:8080';

export interface Order {
  id: number;
  listing_id: number;
  bid_id: number;
  buyer_id: number;
  seller_id: number;
  agreed_price: number;
  platform_fee: number;
  seller_payout: number;
  status: 'payment_pending' | 'paid' | 'completed';
  stripe_session_id?: string | null;
  buyer_confirmed_at?: string | null;
  seller_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
  listing_title?: string;
  listing_image?: string;
  buyer_name?: string;
  seller_name?: string;
  seller_email?: string;
}

export interface Invoice {
  order_id: number;
  listing_title: string;
  agreed_price: number;
  platform_fee_percent: number;
  platform_fee: number;
  seller_payout: number;
  buyer_total: number;
  status: string;
  created_at: string;
}

export async function getMyOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE_URL}/orders`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
  return res.json();
}

export async function getOrder(id: number): Promise<Order> {
  const res = await fetch(`${BASE_URL}/orders/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch order: ${res.statusText}`);
  return res.json();
}

export async function createPaymentSession(orderId: number): Promise<{ checkout_url?: string; message?: string; mode: string }> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to create payment session: ${res.statusText}`);
  }
  return res.json();
}

export async function confirmBuyerReceipt(orderId: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/confirm-buyer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to confirm receipt: ${res.statusText}`);
  }
  return res.json();
}

export async function confirmSellerHandover(orderId: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/confirm-seller`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to confirm handover: ${res.statusText}`);
  }
  return res.json();
}

export async function getInvoice(orderId: number): Promise<Invoice> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/invoice`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch invoice: ${res.statusText}`);
  return res.json();
}
