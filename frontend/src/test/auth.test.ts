import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleLogin, logout, getToken, isLoggedIn, getCurrentUser, clearAuth } from '../api/auth';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
  length: 0,
  key: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  describe('googleLogin', () => {
    it('should store token and user on successful login', async () => {
      const mockResponse = {
        token: 'test_token_123',
        user: { id: 1, email: 'student@ufl.edu', name: 'Test Student', picture: '', google_id: 'g1' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await googleLogin('mock_credential');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'mock_credential' }),
      });
      expect(result.token).toBe('test_token_123');
      expect(result.user.email).toBe('student@ufl.edu');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test_token_123');
    });

    it('should throw error for non-UFL accounts (403)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Only @ufl.edu accounts are allowed' }),
      });

      await expect(googleLogin('bad_credential')).rejects.toThrow('Only @ufl.edu accounts are allowed');
    });

    it('should throw error on network failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });

      await expect(googleLogin('credential')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should call logout endpoint and clear storage', async () => {
      mockStorage['auth_token'] = 'token123';
      mockStorage['auth_user'] = '{"id":1}';

      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      mockStorage['auth_token'] = 'my_token';
      expect(getToken()).toBe('my_token');
    });

    it('should return null when no token', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when token exists', () => {
      mockStorage['auth_token'] = 'token';
      expect(isLoggedIn()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(isLoggedIn()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return parsed user from localStorage', () => {
      mockStorage['auth_user'] = JSON.stringify({ id: 1, email: 'test@ufl.edu' });
      const user = getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.email).toBe('test@ufl.edu');
    });

    it('should return null when no user stored', () => {
      expect(getCurrentUser()).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      mockStorage['auth_user'] = 'not json';
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('should remove token and user from storage', () => {
      mockStorage['auth_token'] = 'tok';
      mockStorage['auth_user'] = '{}';

      clearAuth();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });
});
