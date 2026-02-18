import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ListingCard from '../components/ListingCard';
import ListingForm from '../components/ListingForm';
import { getListings, createListing, type Listing } from '../api/listings';

interface ListingsPageProps {
  onEdit: (listing: Listing) => void;
}

export default function ListingsPage({ onEdit }: ListingsPageProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setError(null);
      const data = await getListings();
      setListings(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load listings');
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleCreate = async (data: Omit<Listing, 'id'>) => {
    try {
      setError(null);
      await createListing(data);
      await fetchListings();
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    }
  };

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

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <ListingForm onSubmit={handleCreate} />

        <Typography variant="h6" sx={{ pt: 1 }}>
          Recent Listings
        </Typography>

        {listings.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No listings yet. Be the first to post!
          </Typography>
        ) : (
          <Stack spacing={2}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onEdit={onEdit} />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
