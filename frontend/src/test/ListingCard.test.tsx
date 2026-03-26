import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ListingCard from '../components/ListingCard';

// Mock useAuth with different user states
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const baseListing = {
  id: 1,
  title: 'Test Textbook',
  description: 'A calculus textbook in great condition',
  price: 45,
  category: 'Books',
  user_id: 10,
};

function renderCard(props = {}) {
  return render(
    <BrowserRouter>
      <ListingCard
        listing={baseListing}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        {...props}
      />
    </BrowserRouter>
  );
}

describe('ListingCard', () => {
  it('should render listing title', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard();
    expect(screen.getByText('Test Textbook')).toBeInTheDocument();
  });

  it('should render listing price', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard();
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  it('should render listing category', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('should render listing description', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard();
    expect(screen.getByText('A calculus textbook in great condition')).toBeInTheDocument();
  });

  it('should show Delete button when user is the owner', () => {
    mockUseAuth.mockReturnValue({ user: { id: 10 }, isLoggedIn: true });
    renderCard();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should show Edit button when user is the owner', () => {
    mockUseAuth.mockReturnValue({ user: { id: 10 }, isLoggedIn: true });
    renderCard();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('should NOT show Delete button when user is not the owner', () => {
    mockUseAuth.mockReturnValue({ user: { id: 99 }, isLoggedIn: true });
    renderCard();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('should show View Details button for non-owners', () => {
    mockUseAuth.mockReturnValue({ user: { id: 99 }, isLoggedIn: true });
    renderCard();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('should show View Details button when not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });
});
