import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ListingCard from '../components/ListingCard';

// Mock useAuth with different user states
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock BidDialog to avoid rendering complexity
vi.mock('../components/BidDialog', () => ({
  default: () => null,
}));

// Mock the bids API
vi.mock('../api/bids', () => ({
  getBids: vi.fn().mockResolvedValue({ bids: [], bids_remaining: 5, is_seller: false }),
  placeBid: vi.fn(),
}));

const baseListing = {
  id: 1,
  title: 'Test Textbook',
  description: 'A calculus textbook in great condition',
  price: 45,
  category: 'Books',
  user_id: 10,
};

function renderCard(props: Record<string, any> = {}) {
  const listing = { ...baseListing, ...(props.listing || {}) };
  const onEdit = props.onEdit || vi.fn();
  const onViewDetails = props.onViewDetails || vi.fn();
  const onDelete = props.onDelete || vi.fn();
  return render(
    <BrowserRouter>
      <ListingCard
        listing={listing}
        onEdit={onEdit}
        onViewDetails={onViewDetails}
        onDelete={onDelete}
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

  // --- Image and bidding feature tests ---

  it('should show uploaded image when images array has items', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard({ listing: { ...baseListing, images: ['/uploads/photo1.jpg'] } });
    const img = screen.getByAltText('Test Textbook');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('/uploads/photo1.jpg');
  });

  it('should show placeholder image when images array is empty', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard({ listing: { ...baseListing, images: [] } });
    const img = screen.getByAltText('Test Textbook');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('picsum.photos');
  });

  it('should show Place Bid button for non-owners when logged in', () => {
    mockUseAuth.mockReturnValue({ user: { id: 99 }, isLoggedIn: true });
    renderCard();
    expect(screen.getByText('Place Bid')).toBeInTheDocument();
  });

  it('should NOT show Place Bid button for owners', () => {
    mockUseAuth.mockReturnValue({ user: { id: 10 }, isLoggedIn: true });
    renderCard();
    expect(screen.queryByText('Place Bid')).not.toBeInTheDocument();
  });

  it('should show "Price is Final" badge when is_final_price is true', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard({ listing: { ...baseListing, is_final_price: true } });
    expect(screen.getByText('Price is Final')).toBeInTheDocument();
  });

  // --- New: Image carousel tests ---

  it('should show navigation arrows when listing has multiple images', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard({ listing: { ...baseListing, images: ['/uploads/img1.jpg', '/uploads/img2.jpg', '/uploads/img3.jpg'] } });
    // There should be prev and next buttons (rendered as IconButtons with svg icons)
    const buttons = screen.getAllByRole('button');
    // At minimum the nav arrows should exist — look for the NavigateBefore and NavigateNext icons
    const arrowButtons = buttons.filter(b => b.querySelector('[data-testid="NavigateBeforeIcon"], [data-testid="NavigateNextIcon"]'));
    expect(arrowButtons.length).toBe(2);
  });

  it('should show single image with no arrows when one image', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false });
    renderCard({ listing: { ...baseListing, images: ['/uploads/single.jpg'] } });
    const img = screen.getByAltText('Test Textbook');
    expect(img.getAttribute('src')).toContain('/uploads/single.jpg');
    // No NavigateBefore/Next icons should be present
    const prevIcon = document.querySelector('[data-testid="NavigateBeforeIcon"]');
    const nextIcon = document.querySelector('[data-testid="NavigateNextIcon"]');
    expect(prevIcon).toBeNull();
    expect(nextIcon).toBeNull();
  });

  // --- New: View Details calls onViewDetails, not onEdit ---

  it('should call onViewDetails when non-owner clicks View Details', () => {
    mockUseAuth.mockReturnValue({ user: { id: 99 }, isLoggedIn: true });
    const onViewDetails = vi.fn();
    const onEdit = vi.fn();
    renderCard({ onViewDetails, onEdit });
    screen.getByText('View Details').click();
    expect(onViewDetails).toHaveBeenCalledWith(expect.objectContaining({ id: 1, title: 'Test Textbook' }));
    expect(onEdit).not.toHaveBeenCalled();
  });
});
