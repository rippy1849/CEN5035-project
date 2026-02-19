import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import ListingForm from '../components/ListingForm';
import { createListing, type Listing } from '../api/listings';

export default function SellPage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (data: Omit<Listing, 'id'>) => {
        try {
            setError(null);
            await createListing(data);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to create listing');
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
                <ListingForm onSubmit={handleCreate} />
            </Container>
        </Box>
    );
}
