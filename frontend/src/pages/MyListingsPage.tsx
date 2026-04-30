import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GavelIcon from '@mui/icons-material/Gavel';
import { getMyListings, type ListingWithBidCount } from '../api/listings';
import { useAuth } from '../context/AuthContext';
import BidManagementPanel from '../components/BidManagementPanel';

export default function MyListingsPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<ListingWithBidCount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  if (!authLoading && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyListings();
      setListings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(150deg, #001480 0%, #0021A5 50%, #0A2EC4 100%)',
          py: { xs: 5, md: 7 },
          px: 2,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <StorefrontIcon sx={{ color: '#FA4616', fontSize: '1.5rem' }} />
            <Typography variant="h3" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
              My Listings
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
            Manage your listings, bids, and orders
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
        ) : listings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h3" sx={{ mb: 1, opacity: 0.3 }}>📦</Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No listings yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Go to "Sell" to post your first item!
            </Typography>
          </Box>
        ) : (
          listings.map((listing) => {
            const imgSrc = listing.images && listing.images.length > 0
              ? `http://localhost:8080${listing.images[0]}`
              : `https://picsum.photos/seed/${listing.id}/400/300`;
            const isExpanded = expandedId === listing.id;

            return (
              <Paper
                key={listing.id}
                elevation={0}
                sx={{ mb: 2, borderRadius: 3, border: '1px solid rgba(0,33,165,0.10)', overflow: 'hidden' }}
              >
                <Box
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    '&:hover': { backgroundColor: 'rgba(0,33,165,0.02)' },
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : listing.id!)}
                >
                  <Box
                    component="img"
                    src={imgSrc}
                    alt={listing.title}
                    sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{listing.title}</Typography>
                      <Chip
                        label={listing.status === 'sold' ? 'Sold' : 'Active'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          backgroundColor: listing.status === 'sold' ? '#d32f2f' : '#2e7d32',
                          color: '#fff',
                        }}
                      />
                      {listing.is_final_price && (
                        <Chip
                          label="Final Price"
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.65rem', backgroundColor: '#FA4616', color: '#fff' }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>${listing.price.toFixed(2)}</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GavelIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <IconButton size="small">
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ px: 2.5, pb: 2.5 }}>
                    {listing.id && (
                      <BidManagementPanel
                        listingId={listing.id}
                        isFinalPrice={listing.is_final_price}
                        onUpdate={fetchListings}
                      />
                    )}
                  </Box>
                </Collapse>
              </Paper>
            );
          })
        )}
      </Container>
    </Box>
  );
}
