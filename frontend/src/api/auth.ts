const BASE_URL = 'http://localhost:8080';

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  google_id: string;
  created_at?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export async function googleLogin(credential: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  if (res.status === 403) {
    const data = await res.json();
    throw new Error(data.error || 'Only @ufl.edu accounts are allowed');
  }

  if (!res.ok) {
    throw new Error(`Login failed: ${res.statusText}`);
  }

  const data: LoginResponse = await res.json();

  // Store in localStorage
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));

  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const token = getToken();
  if (!token) throw new Error('No token');

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    clearAuth();
    throw new Error('Session expired');
  }

  return res.json();
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  clearAuth();
}

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
