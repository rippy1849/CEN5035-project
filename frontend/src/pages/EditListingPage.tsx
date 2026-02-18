import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" color="primary">
            Edit Listing
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <ListingForm editListing={listing} onSubmit={handleUpdate} onCancel={onBack} />
      </Stack>
    </Container>
  );
}
