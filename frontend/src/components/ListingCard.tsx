import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
  return (
    <Card elevation={3}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
            {listing.title}
          </Typography>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700, ml: 2 }}>
            ${listing.price}
          </Typography>
        </Box>
        <Chip
          label={listing.category}
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ mb: 1.5, borderRadius: '8px' }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {listing.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => onEdit(listing)}
        >
          Edit
        </Button>
      </CardActions>
    </Card>
  );
}
