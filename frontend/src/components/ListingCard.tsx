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
  // Generate a consistent random image based on listing ID or title length
  const imageId = listing.id ? listing.id : listing.title.length;
  const imageUrl = `https://picsum.photos/seed/${imageId}/400/300`;

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={listing.title}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography gutterBottom variant="h6" component="h2" noWrap sx={{ maxWidth: '70%' }}>
            {listing.title}
          </Typography>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
            ${listing.price}
          </Typography>
        </Box>
        <Chip
          label={listing.category}
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {listing.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => onEdit(listing)}
          fullWidth
          variant="outlined"
        >
          Edit
        </Button>
      </CardActions>
    </Card>
  );
}
