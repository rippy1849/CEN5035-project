import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from '../pages/LoginPage';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoggedIn: false,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}));

function renderLoginPage() {
  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

describe('LoginPage', () => {
  it('should render the sign in heading', () => {
    renderLoginPage();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should show UFL account hint', () => {
    renderLoginPage();
    expect(screen.getByText('@ufl.edu')).toBeInTheDocument();
  });

  it('should show GatorMarketplace branding', () => {
    renderLoginPage();
    expect(screen.getByText('GatorMarketplace')).toBeInTheDocument();
  });

  it('should show UFL-only notice', () => {
    renderLoginPage();
    expect(screen.getByText(/University of Florida students/)).toBeInTheDocument();
  });
});
