import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ListingsPage from '../pages/ListingsPage';

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 99 }, isLoggedIn: true }),
}));

// Mock listings API
vi.mock('../api/listings', () => ({
  getListings: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: 'Old Bike',
      description: 'A great bicycle for campus use',
      price: 120,
      category: 'Sports',
      user_id: 10,
      images: [],
      is_final_price: false,
    },
  ]),
  deleteListing: vi.fn().mockResolvedValue(undefined),
}));

// Mock BidDialog
vi.mock('../components/BidDialog', () => ({ default: () => null }));

// Mock bids API
vi.mock('../api/bids', () => ({
  getBids: vi.fn().mockResolvedValue({ bids: [], bids_remaining: 5, is_seller: false }),
}));

describe('ListingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the listings page with a listing card', async () => {
    render(
      <BrowserRouter>
        <ListingsPage onEdit={vi.fn()} />
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Old Bike')).toBeInTheDocument();
    });
  });

  it('should show "View Details" button for non-owner listings', async () => {
    render(
      <BrowserRouter>
        <ListingsPage onEdit={vi.fn()} />
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });
  });

  it('should open ListingDetailModal when View Details is clicked', async () => {
    render(
      <BrowserRouter>
        <ListingsPage onEdit={vi.fn()} />
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Old Bike')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Details'));

    await waitFor(() => {
      // The Close button only appears inside the ListingDetailModal
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  it('should show category filter chips', async () => {
    render(
      <BrowserRouter>
        <ListingsPage onEdit={vi.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });
});
