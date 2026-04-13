import { useState, useEffect, useRef } from 'react';
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
import IconButton from '@mui/material/IconButton';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import type { Listing } from '../api/listings';

const CATEGORIES = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Other'];

interface ListingFormProps {
  editListing?: Listing | null;
  onSubmit: (data: Omit<Listing, 'id'>, files?: File[]) => void;
  onCancel?: () => void;
}

export default function ListingForm({ editListing, onSubmit, onCancel }: ListingFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setSelectedFiles([]);
    setPreviewUrls([]);
  }, [editListing]);

  // Generate preview URLs for selected files
  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const existingCount = editListing?.images?.length || 0;
    const maxNew = 5 - existingCount;
    const combined = [...selectedFiles, ...files].slice(0, maxNew);
    setSelectedFiles(combined);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      { title, description, price: parseFloat(price), category, user_id: 0 },
      selectedFiles.length > 0 ? selectedFiles : undefined
    );
    if (!editListing) {
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setSelectedFiles([]);
    }
  };

  const isEdit = !!editListing;
  const existingImageCount = editListing?.images?.length || 0;
  const maxNewImages = 5 - existingImageCount;

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

            {/* Image Upload Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                Photos (optional)
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'text.secondary' }}>
                Upload up to 5 images. {isEdit && existingImageCount > 0 ? `${existingImageCount} already uploaded. ` : ''}
                {maxNewImages > 0 ? `You can add ${maxNewImages - selectedFiles.length} more.` : 'Maximum reached.'}
              </Typography>

              {/* Existing images (edit mode) */}
              {isEdit && editListing?.images && editListing.images.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                  {editListing.images.map((img, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '2px solid rgba(0,33,165,0.15)',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={`http://localhost:8080${img}`}
                        alt={`Existing ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {/* New file previews */}
              {previewUrls.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                  {previewUrls.map((url, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '2px solid #0021A5',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeFile(idx)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          p: 0.25,
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: '0.8rem' }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              {maxNewImages - selectedFiles.length > 0 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="image-upload-input"
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AddPhotoAlternateIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      borderColor: 'rgba(0,33,165,0.25)',
                      color: '#0021A5',
                      fontWeight: 600,
                      borderRadius: 2,
                      py: 1,
                      '&:hover': { borderColor: '#0021A5', backgroundColor: 'rgba(0,33,165,0.04)' },
                    }}
                  >
                    Add Photos
                  </Button>
                </>
              )}
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
