import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ListingCard from '../components/ListingCard';
import { getListings, type Listing } from '../api/listings';

interface ListingsPageProps {
  onEdit?: (listing: Listing) => void;
}

export default function ListingsPage({ onEdit }: ListingsPageProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchListings = async () => {
    try {
      setError(null);
      const data = await getListings();
      setListings(data || []);
      setFilteredListings(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load listings');
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    const results = listings.filter(listing =>
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredListings(results);
  }, [searchTerm, listings]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
          Marketplace Listings
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Find great deals from fellow students
        </Typography>

        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
          <TextField
            fullWidth
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: 'background.paper' }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filteredListings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {listings.length === 0 ? 'No listings found. Be the first to sell something!' : 'No listings match your search.'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr'
            },
            gap: 3
          }}
        >
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onEdit={onEdit || (() => { })}
            />
          ))}
        </Box>
      )}
    </Container>
  );
}
