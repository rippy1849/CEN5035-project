import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import type { Listing } from '../api/listings';

const CATEGORIES = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Other'];

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
    onSubmit({ title, description, price: parseFloat(price), category, user_id: 1 });
    if (!editListing) {
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
    }
  };

  const isEdit = !!editListing;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(0,33,165,0.10)',
        overflow: 'hidden',
      }}
    >
      {/* Form header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          background: 'linear-gradient(135deg, #001480 0%, #0021A5 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {isEdit ? (
          <SaveIcon sx={{ color: '#FA4616', fontSize: '1.25rem' }} />
        ) : (
          <AddCircleOutlineIcon sx={{ color: '#FA4616', fontSize: '1.25rem' }} />
        )}
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1rem' }}>
          {isEdit ? 'Edit Your Listing' : 'Post a New Listing'}
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              placeholder="e.g. MacBook Pro 2021, IKEA Desk, Calculus Textbook"
              helperText="Give your item a clear, descriptive title"
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Describe the condition, age, any accessories included…"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
              <TextField
                label="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                fullWidth
                required
                inputProps={{ min: 0, step: '0.01' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                placeholder="0.00"
              />

              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ borderColor: 'rgba(0,33,165,0.08)' }} />

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                color={isEdit ? 'primary' : 'secondary'}
                startIcon={isEdit ? <SaveIcon /> : <AddCircleOutlineIcon />}
                fullWidth
                size="large"
                sx={{ py: 1.4, fontSize: '0.95rem' }}
              >
                {isEdit ? 'Save Changes' : 'Post Listing'}
              </Button>
              {onCancel && (
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={onCancel}
                  size="large"
                  sx={{ py: 1.4, minWidth: 130 }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </form>
      </Box>
    </Paper>
  );
}
