import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import type { Listing } from '../api/listings';
import { useAuth } from '../context/AuthContext';
import BidDialog from './BidDialog';

interface ListingDetailModalProps {
  listing: Listing | null;
  open: boolean;
  onClose: () => void;
}

export default function ListingDetailModal({ listing, open, onClose }: ListingDetailModalProps) {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);

  if (!listing) return null;

  const imageId = listing.id ? listing.id : listing.title.length;
  const imageList = listing.images && listing.images.length > 0
    ? listing.images.map(img => `http://localhost:8080${img}`)
    : [`https://picsum.photos/seed/${imageId}/400/300`];

  const hasMultipleImages = imageList.length > 1;
  const isOwner = user && listing.user_id === user.id;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        keepMounted={false}
      >
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: '#fff',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Image section with carousel */}
        <Box sx={{ position: 'relative', height: 300, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
          <Box
            component="img"
            src={imageList[currentImageIndex]}
            alt={listing.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {hasMultipleImages && (
            <>
              <IconButton
                size="small"
                onClick={() => setCurrentImageIndex(i => (i - 1 + imageList.length) % imageList.length)}
                sx={{
                  position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                  p: 0.75,
                }}
              >
                <NavigateBeforeIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setCurrentImageIndex(i => (i + 1) % imageList.length)}
                sx={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                  p: 0.75,
                }}
              >
                <NavigateNextIcon />
              </IconButton>

              {/* Dot indicators */}
              <Box sx={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 0.75 }}>
                {imageList.map((_, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    sx={{
                      width: idx === currentImageIndex ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: idx === currentImageIndex ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                  />
                ))}
              </Box>
            </>
          )}
        </Box>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {/* Price and badges row */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #FA4616, #C73000)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1.25rem',
                px: 2,
                py: 0.75,
                borderRadius: 2,
                boxShadow: '0 2px 10px rgba(250,70,22,0.35)',
              }}
            >
              ${listing.price.toLocaleString()}
            </Box>

            {listing.is_final_price && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '0.9rem !important', color: '#fff !important' }} />}
                label="Price is Final ✓"
                size="small"
                sx={{
                  backgroundColor: '#2e7d32',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            )}

            <Chip
              label={listing.category}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#0021A5',
                borderColor: 'rgba(0,33,165,0.30)',
                backgroundColor: 'rgba(0,33,165,0.05)',
              }}
            />
          </Box>

          {/* Title */}
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: '#1a1a2e' }}>
            {listing.title}
          </Typography>

          <Divider sx={{ mb: 2, borderColor: 'rgba(0,33,165,0.08)' }} />

          {/* Full description */}
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {listing.description}
          </Typography>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" sx={{ fontWeight: 600 }}>
            Close
          </Button>
          {user && !isOwner && (
            <Button
              variant="contained"
              startIcon={<GavelIcon />}
              onClick={() => setBidDialogOpen(true)}
              sx={{
                backgroundColor: '#0021A5',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#001480' },
              }}
            >
              Place Bid
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Nested BidDialog */}
      {listing && (
        <BidDialog
          open={bidDialogOpen}
          onClose={() => setBidDialogOpen(false)}
          listing={listing}
        />
      )}
    </>
  );
}
