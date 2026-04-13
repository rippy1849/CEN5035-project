import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BidDialog from '../components/BidDialog';

// Mock the bids API
vi.mock('../api/bids', () => ({
  getBids: vi.fn().mockResolvedValue({ bids: [], bids_remaining: 5, is_seller: false }),
  placeBid: vi.fn(),
}));

const baseListing = {
  id: 1,
  title: 'Test Laptop',
  description: 'Great laptop',
  price: 500,
  category: 'Electronics',
  user_id: 10,
};

describe('BidDialog', () => {
  it('should render listing title and price', () => {
    render(
      <BidDialog open={true} onClose={vi.fn()} listing={baseListing} />
    );
    expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  it('should show bid input field', () => {
    render(
      <BidDialog open={true} onClose={vi.fn()} listing={baseListing} />
    );
    expect(screen.getByLabelText('Your Bid Amount')).toBeInTheDocument();
  });

  it('should show "X of 5 bids remaining" text', () => {
    render(
      <BidDialog open={true} onClose={vi.fn()} listing={baseListing} />
    );
    expect(screen.getByText('5 of 5 bids remaining')).toBeInTheDocument();
  });

  it('should show Place a Bid title', () => {
    render(
      <BidDialog open={true} onClose={vi.fn()} listing={baseListing} />
    );
    expect(screen.getByText('Place a Bid')).toBeInTheDocument();
  });

  it('should show Submit Bid button', () => {
    render(
      <BidDialog open={true} onClose={vi.fn()} listing={baseListing} />
    );
    expect(screen.getByText('Submit Bid')).toBeInTheDocument();
  });

  it('should show final price warning when listing is final priced', () => {
    const finalListing = { ...baseListing, is_final_price: true };
    render(
      <BidDialog open={true} onClose={vi.fn()} listing={finalListing} />
    );
    expect(screen.getByText('Final Price')).toBeInTheDocument();
  });
});
