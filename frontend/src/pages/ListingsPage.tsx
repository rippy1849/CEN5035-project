import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ListingCard from '../components/ListingCard';
import { getListings, type Listing } from '../api/listings';

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Other'];

interface ListingsPageProps {
  onEdit?: (listing: Listing) => void;
}

export default function ListingsPage({ onEdit }: ListingsPageProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

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
    let results = listings;
    if (activeCategory !== 'All') {
      results = results.filter(l => l.category === activeCategory);
    }
    if (searchTerm) {
      results = results.filter(l =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredListings(results);
  }, [searchTerm, activeCategory, listings]);

  return (
    <Box>
      {/* Hero section */}
      <Box
        sx={{
          background: 'linear-gradient(150deg, #001480 0%, #0021A5 45%, #0A2EC4 75%, #1238CC 100%)',
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          px: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-30%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,70,22,0.12) 0%, transparent 65%)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-20%',
            left: '-5%',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,70,22,0.08) 0%, transparent 65%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon sx={{ color: '#FA4616', fontSize: '1.2rem' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Student Marketplace
              </Typography>
            </Box>
            <Typography
              variant="h2"
              sx={{
                color: '#FFFFFF',
                fontWeight: 800,
                mb: 1.5,
                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
              }}
            >
              Find Great Deals
              <Box
                component="span"
                sx={{
                  display: 'block',
                  background: 'linear-gradient(90deg, #FA4616, #FF8C5A)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                From Fellow Gators
              </Box>
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', mb: 4, fontWeight: 400, maxWidth: 520, mx: 'auto' }}>
              Buy, sell, and trade with UF students — safe, easy, and on campus.
            </Typography>

            {/* Search bar */}
            <Box sx={{ maxWidth: 580, mx: 'auto' }}>
              <TextField
                fullWidth
                placeholder="Search for laptops, furniture, textbooks…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 3,
                    fontSize: '1rem',
                    boxShadow: '0 8px 32px rgba(0,20,128,0.30)',
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
            </Box>

            {/* Stats row */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 4 }}>
              {[
                { value: `${listings.length}`, label: 'Listings' },
                { value: 'UF', label: 'Campus Only' },
                { value: 'Free', label: 'To Use' },
              ].map((stat) => (
                <Box key={stat.label} sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ color: '#FA4616', fontWeight: 800 }}>{stat.value}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Content section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Category filter */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Filter:
          </Typography>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setActiveCategory(cat)}
              variant={activeCategory === cat ? 'filled' : 'outlined'}
              color={activeCategory === cat ? 'primary' : 'default'}
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.78rem',
                ...(activeCategory !== cat && {
                  borderColor: 'rgba(0,33,165,0.20)',
                  color: 'text.secondary',
                  '&:hover': { borderColor: '#0021A5', color: '#0021A5', backgroundColor: 'rgba(0,33,165,0.04)' },
                }),
              }}
            />
          ))}
          {(searchTerm || activeCategory !== 'All') && (
            <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
              {filteredListings.length} result{filteredListings.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {filteredListings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h3" sx={{ mb: 1, opacity: 0.3 }}>🐊</Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              {listings.length === 0 ? 'No listings yet — be the first to sell!' : 'No listings match your search.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {listings.length === 0 ? 'Click "Sell" in the nav to post your first item.' : 'Try different keywords or clear your filters.'}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 3,
            }}
          >
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onEdit={onEdit || (() => {})}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
