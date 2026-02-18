import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import type { Listing } from '../api/listings';

interface ListingFormProps {
  editListing?: Listing | null;
  onSubmit: (data: Omit<Listing, 'id'>) => void;
  onCancel?: () => void;
}

export default function ListingForm({ editListing, onSubmit, onCancel }: ListingFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (editListing) {
      setTitle(editListing.title);
      setDescription(editListing.description);
      setPrice(String(editListing.price));
      setCategory(editListing.category);
    } else {
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
    }
  }, [editListing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      price: parseFloat(price),
      category,
      user_id: 1,
    });
    if (!editListing) {
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
    }
  };

  const isEdit = !!editListing;

  return (
    <Paper elevation={isEdit ? 4 : 1} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {isEdit ? 'Edit Listing' : 'Create New Listing'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            required
          />
          <TextField
            label="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            fullWidth
            required
            inputProps={{ min: 0, step: '0.01' }}
          />
          <TextField
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            required
          />
          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              startIcon={isEdit ? <SaveIcon /> : <AddIcon />}
              fullWidth
            >
              {isEdit ? 'Update Listing' : 'Post Listing'}
            </Button>
            {isEdit && onCancel && (
              <Button
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={onCancel}
                fullWidth
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
}
