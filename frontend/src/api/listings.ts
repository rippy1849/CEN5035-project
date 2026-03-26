import { getAuthHeaders } from './auth';

const BASE_URL = 'http://localhost:8080';

export interface Listing {
  id?: number;
  title: string;
  description: string;
  price: number;
  category: string;
  user_id: number;
}

export async function getListings(): Promise<Listing[]> {
  const res = await fetch(`${BASE_URL}/listings`);
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.statusText}`);
  return res.json();
}

export async function createListing(data: Omit<Listing, 'id'>): Promise<Listing> {
  const res = await fetch(`${BASE_URL}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create listing: ${res.statusText}`);
  return res.json();
}

export async function updateListing(id: number, data: Partial<Listing>): Promise<Listing> {
  const res = await fetch(`${BASE_URL}/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update listing: ${res.statusText}`);
  return res.json();
}

export async function deleteListing(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/listings/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (res.status === 403) {
    throw new Error('You can only delete your own listings');
  }
  if (!res.ok) throw new Error(`Failed to delete listing: ${res.statusText}`);
}
