import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ListingDetailModal from '../components/ListingDetailModal';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock BidDialog
vi.mock('../components/BidDialog', () => ({
  default: () => null,
}));

// Mock bids API
vi.mock('../api/bids', () => ({
  getBids: vi.fn().mockResolvedValue({ bids: [], bids_remaining: 5, is_seller: false }),
  placeBid: vi.fn(),
}));

const baseListing = {
  id: 1,
  title: 'Vintage Camera',
  description: 'A beautiful vintage film camera in excellent working condition. Comes with original leather case and strap.',
  price: 250,
  category: 'Electronics',
  user_id: 10,
};

describe('ListingDetailModal', () => {
  it('should render listing title', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    render(<ListingDetailModal listing={baseListing} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
  });

  it('should render listing price', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    render(<ListingDetailModal listing={baseListing} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('$250')).toBeInTheDocument();
  });

  it('should render listing description in full', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    render(<ListingDetailModal listing={baseListing} open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/A beautiful vintage film camera/)).toBeInTheDocument();
    expect(screen.getByText(/Comes with original leather case/)).toBeInTheDocument();
  });

  it('should show category chip', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    render(<ListingDetailModal listing={baseListing} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('should show final price badge when is_final_price is true', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    const listing = { ...baseListing, is_final_price: true };
    render(<ListingDetailModal listing={listing} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Price is Final ✓')).toBeInTheDocument();
  });

  it('should show Place Bid button for logged-in non-owner', () => {
    mockUseAuth.mockReturnValue({ user: { id: 99 }, isLoggedIn: true });
    render(<ListingDetailModal listing={baseListing} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Place Bid')).toBeInTheDocument();
  });

  it('should NOT show Place Bid when not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    render(<ListingDetailModal listing={baseListing} open={true} onClose={vi.fn()} />);
    expect(screen.queryByText('Place Bid')).not.toBeInTheDocument();
  });
});
