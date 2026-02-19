import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ListingForm from '../components/ListingForm';
import { createListing, type Listing } from '../api/listings';
import Alert from '@mui/material/Alert';

export default function SellPage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (data: Omit<Listing, 'id'>) => {
        try {
            setError(null);
            await createListing(data);
            // On success, redirect to home
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to create listing');
        }
    };

    return (
        <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
                Create a New Listing
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <ListingForm onSubmit={handleCreate} />
        </Container>
    );
}
