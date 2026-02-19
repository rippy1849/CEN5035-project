import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useState } from 'react';
import ListingForm from '../components/ListingForm';
import { updateListing, type Listing } from '../api/listings';

interface EditListingPageProps {
  listing: Listing;
  onBack: () => void;
}

export default function EditListingPage({ listing, onBack }: EditListingPageProps) {
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (data: Omit<Listing, 'id'>) => {
    try {
      setError(null);
      await updateListing(listing.id!, data);
      onBack();
    } catch (err: any) {
      setError(err.message || 'Failed to update listing');
    }
  };

  return (
    <Box>
      {/* Page hero */}
      <Box
        sx={{
          background: 'linear-gradient(150deg, #001480 0%, #0021A5 50%, #0A2EC4 100%)',
          py: { xs: 5, md: 7 },
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{
              color: 'rgba(255,255,255,0.75)',
              mb: 2,
              fontWeight: 600,
              '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.10)' },
            }}
          >
            Back to listings
          </Button>
          <Typography
            variant="h3"
            sx={{ color: '#FFFFFF', fontWeight: 800, mb: 0.5, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
          >
            Edit Listing
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.60)', fontWeight: 400, fontSize: '1rem' }}>
            Updating: <Box component="span" sx={{ color: '#FA4616', fontWeight: 600 }}>{listing.title}</Box>
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <ListingForm editListing={listing} onSubmit={handleUpdate} onCancel={onBack} />
      </Container>
    </Box>
  );
}
