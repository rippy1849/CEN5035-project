import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BidManagementPanel from '../components/BidManagementPanel';

// Mock bids API
vi.mock('../api/bids', () => ({
  getBids: vi.fn().mockResolvedValue({ bids: [], bids_remaining: 5, is_seller: true }),
  respondToBid: vi.fn().mockResolvedValue({ bid: {} }),
  markFinalPrice: vi.fn().mockResolvedValue(undefined),
  unmarkFinalPrice: vi.fn().mockResolvedValue(undefined),
}));

import { markFinalPrice, unmarkFinalPrice } from '../api/bids';

describe('BidManagementPanel', () => {
  it('should show "Mark Price as Final" button when isFinalPrice is false', async () => {
    render(<BidManagementPanel listingId={1} isFinalPrice={false} />);
    await waitFor(() => {
      expect(screen.getByText('Mark Price as Final')).toBeInTheDocument();
    });
  });

  it('should show "Price Marked as Final ✓" button when isFinalPrice is true', async () => {
    render(<BidManagementPanel listingId={1} isFinalPrice={true} />);
    await waitFor(() => {
      expect(screen.getByText('Price Marked as Final ✓')).toBeInTheDocument();
    });
  });

  it('should show "Mark Price as Final" when isFinalPrice is undefined (defaults false)', async () => {
    render(<BidManagementPanel listingId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Mark Price as Final')).toBeInTheDocument();
    });
  });

  it('should call markFinalPrice when "Mark Price as Final" is clicked', async () => {
    render(<BidManagementPanel listingId={1} isFinalPrice={false} />);
    await waitFor(() => {
      expect(screen.getByText('Mark Price as Final')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Mark Price as Final'));
    await waitFor(() => {
      expect(markFinalPrice).toHaveBeenCalledWith(1);
    });
  });

  it('should call unmarkFinalPrice when "Price Marked as Final ✓" is clicked', async () => {
    render(<BidManagementPanel listingId={1} isFinalPrice={true} />);
    await waitFor(() => {
      expect(screen.getByText('Price Marked as Final ✓')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Price Marked as Final ✓'));
    await waitFor(() => {
      expect(unmarkFinalPrice).toHaveBeenCalledWith(1);
    });
  });

  it('should show "No bids received yet" when bids is empty', async () => {
    render(<BidManagementPanel listingId={1} />);
    await waitFor(() => {
      expect(screen.getByText('No bids received yet.')).toBeInTheDocument();
    });
  });

  it('should show "Bids Received (0)" header', async () => {
    render(<BidManagementPanel listingId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Bids Received (0)')).toBeInTheDocument();
    });
  });
});
