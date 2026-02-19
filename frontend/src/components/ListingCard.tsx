import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import type { Listing } from '../api/listings';

interface ListingCardProps {
  listing: Listing;
  onEdit: (listing: Listing) => void;
}

export default function ListingCard({ listing, onEdit }: ListingCardProps) {
  const imageId = listing.id ? listing.id : listing.title.length;
  const imageUrl = `https://picsum.photos/seed/${imageId}/400/300`;

  return (
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

      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={listing.title}
        sx={{ objectFit: 'cover' }}
      />

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

      <CardActions sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
        <Button
          size="small"
          startIcon={<EditIcon sx={{ fontSize: '0.95rem !important' }} />}
          onClick={() => onEdit(listing)}
          fullWidth
          variant="outlined"
          color="primary"
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '0.82rem',
            py: 0.9,
          }}
        >
          Edit Listing
        </Button>
      </CardActions>
    </Card>
  );
}
