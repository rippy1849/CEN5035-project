import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert'; // Keep imports for user convenience
import Box from '@mui/material/Box';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { getListings, type Listing } from '../api/listings';
import ListingCard from '../components/ListingCard';

interface ListingsPageProps {
  onEdit: (listing: Listing) => void;
}

export default function ListingsPage({ onEdit }: ListingsPageProps) {
  // TODO: Initialize state for listings, loading, and error
  const [listings, setListings] = useState<Listing[]>([]);

  // TODO: Implement useEffect to fetch listings on mount
  useEffect(() => {
    // Call getListings() export from ../api/listings
    // Handle loading and error states
    console.log("TODO: Fetch listings");
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'center' }}>
          <StorefrontIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" component="h1" color="primary">
            UF Marketplace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Buy & sell around Gainesville
          </Typography>
        </Box>

        {/* TODO: Display Alert if there is an error */}

        <Typography variant="h6" sx={{ pt: 1 }}>
          Recent Listings
        </Typography>

        {/* TODO: Check if listings array is empty. If so, show "No listings yet". */}

        {/* TODO: Map over listings and render ListingCard for each */}
        <Stack spacing={2}>
          {/* Placeholder content until implemented */}
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Listings will appear here...
          </Typography>

          {/* Example usage of ListingCard (remove when implementing loop) */}
          {/* <ListingCard listing={exampleListing} onEdit={onEdit} /> */}
        </Stack>
      </Stack>
    </Container>
  );
}
