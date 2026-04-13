import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ListingForm from '../components/ListingForm';
import { createListing, uploadListingImages, type Listing } from '../api/listings';
import { useAuth } from '../context/AuthContext';

export default function SellPage() {
    const navigate = useNavigate();
    const { isLoggedIn, loading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Redirect to login if not authenticated
    if (!loading && !isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    const handleCreate = async (data: Omit<Listing, 'id'>, files?: File[]) => {
        try {
            setError(null);
            setUploading(true);
            const newListing = await createListing(data);

            // Upload images if any were selected
            if (files && files.length > 0 && newListing.id) {
                try {
                    await uploadListingImages(newListing.id, files);
                } catch (imgErr: any) {
                    // Listing was created successfully, but image upload failed
                    console.error('Image upload failed:', imgErr);
                    // Still navigate, listing exists
                }
            }

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to create listing');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box>
            {/* Page hero */}
            <Box
                sx={{
                    background: 'linear-gradient(150deg, #001480 0%, #0021A5 50%, #0A2EC4 100%)',
                    py: { xs: 5, md: 7 },
                    px: 2,
                    textAlign: 'center',
                }}
            >
                <Typography
                    variant="h3"
                    sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
                >
                    Sell an Item
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
                    List your item and reach fellow{' '}
                    <Box component="span" sx={{ color: '#FA4616', fontWeight: 700 }}>UF Gators</Box>
                </Typography>
            </Box>

            <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}
                {uploading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, justifyContent: 'center' }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                            Creating listing and uploading images...
                        </Typography>
                    </Box>
                )}
                <ListingForm onSubmit={handleCreate} />
            </Container>
        </Box>
    );
}
