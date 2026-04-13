import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ListingForm from '../components/ListingForm';

describe('ListingForm', () => {
  it('should render image upload section', () => {
    render(<ListingForm onSubmit={vi.fn()} />);
    expect(screen.getByText('Add Photos')).toBeInTheDocument();
  });

  it('should show "Upload up to 5 images" helper text', () => {
    render(<ListingForm onSubmit={vi.fn()} />);
    expect(screen.getByText(/Upload up to 5 images/i)).toBeInTheDocument();
  });

  it('should render title field', () => {
    render(<ListingForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
  });

  it('should render price field', () => {
    render(<ListingForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
  });
});
