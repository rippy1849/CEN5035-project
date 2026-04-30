import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GavelIcon from '@mui/icons-material/Gavel';
import LockIcon from '@mui/icons-material/Lock';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import type { Listing } from '../api/listings';
import { useAuth } from '../context/AuthContext';
import BidDialog from './BidDialog';

interface ListingCardProps {
  listing: Listing;
  onEdit: (listing: Listing) => void;
  onViewDetails: (listing: Listing) => void;
  onDelete?: (id: number) => void;
}

export default function ListingCard({ listing, onEdit, onViewDetails, onDelete }: ListingCardProps) {
  const { user } = useAuth();
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Build image list
  const imageId = listing.id ? listing.id : listing.title.length;
  const imageList = listing.images && listing.images.length > 0
    ? listing.images.map(img => `http://localhost:8080${img}`)
    : [`https://picsum.photos/seed/${imageId}/400/300`];

  const hasMultipleImages = imageList.length > 1;
  const isOwner = user && listing.user_id === user.id;

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    if (onDelete && listing.id) {
      onDelete(listing.id);
    }
  };

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Price badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            background: 'linear-gradient(135deg, #FA4616, #C73000)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.95rem',
            px: 1.5,
            py: 0.5,
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(250,70,22,0.45)',
            letterSpacing: '-0.3px',
          }}
        >
          ${listing.price.toLocaleString()}
        </Box>

        {/* Final price badge */}
        {listing.is_final_price && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 2,
            }}
          >
            <Chip
              icon={<LockIcon sx={{ fontSize: '0.85rem !important', color: '#fff !important' }} />}
              label="Price is Final"
              size="small"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          </Box>
        )}

        {/* Image section with carousel */}
        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height="200"
            image={imageList[currentImageIndex]}
            alt={hasMultipleImages ? `${listing.title} - image ${currentImageIndex + 1}` : listing.title}
            sx={{ objectFit: 'cover', height: '100%', width: '100%' }}
          />

          {/* Prev / Next arrows — only if multiple images */}
          {hasMultipleImages && (
            <>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i - 1 + imageList.length) % imageList.length); }}
                sx={{
                  position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                  p: 0.5,
                }}
              >
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i + 1) % imageList.length); }}
                sx={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                  p: 0.5,
                }}
              >
                <NavigateNextIcon fontSize="small" />
              </IconButton>

              {/* Dot indicators */}
              <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 0.75 }}>
                {imageList.map((_, idx) => (
                  <Box
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                    sx={{
                      width: idx === currentImageIndex ? 18 : 7,
                      height: 7,
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

        <CardContent sx={{ flexGrow: 1, px: 2.5, pt: 2.5, pb: 1 }}>
          <Chip
            label={listing.category}
            size="small"
            variant="outlined"
            sx={{
              mb: 1.5,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#0021A5',
              borderColor: 'rgba(0,33,165,0.30)',
              backgroundColor: 'rgba(0,33,165,0.05)',
            }}
          />
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1.3,
              mb: 1,
              color: 'text.primary',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {listing.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6,
            }}
          >
            {listing.description}
          </Typography>
        </CardContent>

        <CardActions sx={{ px: 2.5, pb: 2.5, pt: 1, gap: 1 }}>
          {isOwner && (
            <>
              <Button
                size="small"
                startIcon={<EditIcon sx={{ fontSize: '0.95rem !important' }} />}
                onClick={() => onEdit(listing)}
                variant="outlined"
                color="primary"
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  py: 0.9,
                  flex: 1,
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                startIcon={<DeleteIcon sx={{ fontSize: '0.95rem !important' }} />}
                onClick={handleDeleteClick}
                variant="outlined"
                color="error"
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  py: 0.9,
                  flex: 1,
                }}
              >
                Delete
              </Button>
            </>
          )}
          {!isOwner && (
            <>
              <Button
                size="small"
                startIcon={<InfoOutlinedIcon sx={{ fontSize: '0.95rem !important' }} />}
                onClick={() => onViewDetails(listing)}
                variant="outlined"
                color="primary"
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  py: 0.9,
                  flex: 1,
                }}
              >
                View Details
              </Button>
              {user && !listing.is_final_price && listing.status !== 'sold' && (
                <Button
                  size="small"
                  startIcon={<GavelIcon sx={{ fontSize: '0.95rem !important' }} />}
                  onClick={() => setBidDialogOpen(true)}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    py: 0.9,
                    flex: 1,
                    backgroundColor: '#0021A5',
                    '&:hover': { backgroundColor: '#001480' },
                  }}
                >
                  Place Bid
                </Button>
              )}
            </>
          )}
        </CardActions>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Listing</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{listing.title}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bid dialog */}
      <BidDialog
        open={bidDialogOpen}
        onClose={() => setBidDialogOpen(false)}
        listing={listing}
      />
    </>
  );
}
