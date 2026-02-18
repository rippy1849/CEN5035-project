import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Listing } from '../api/listings';

interface ListingCardProps {
  listing: Listing;
  onEdit: (listing: Listing) => void;
}

export default function ListingCard({ listing, onEdit }: ListingCardProps) {
  // TODO: Implement the ListingCard component
  // It should display:
  // - Title (Typography variant="h5")
  // - Price (Typography variant="h6", color="primary")
  // - Category (Typography variant="body2", color="text.secondary")
  // - Description (Typography variant="body2")
  // - An "Edit" button (optional for this task, but good to have structure)

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" color="error">
          TODO: Implement ListingCard
        </Typography>
        <Typography variant="body2">
          {listing.title} - ${listing.price}
        </Typography>
      </CardContent>
    </Card>
  );
}
