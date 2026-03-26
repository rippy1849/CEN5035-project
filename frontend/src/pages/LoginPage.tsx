import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (credentialResponse: any) => {
    try {
      setError(null);
      await login(credentialResponse.credential);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(150deg, #001480 0%, #0021A5 50%, #0A2EC4 100%)',
          py: { xs: 8, md: 12 },
          px: 2,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h3"
          sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
        >
          Welcome to{' '}
          <Box component="span" sx={{ color: '#FA4616' }}>
            GatorMarketplace
          </Box>
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
          Sign in with your UF account to start buying and selling
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid rgba(0,33,165,0.10)',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FA4616, #FF6B3D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 4px 16px rgba(250,70,22,0.35)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            G
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use your{' '}
            <Box component="span" sx={{ color: '#0021A5', fontWeight: 600 }}>
              @ufl.edu
            </Box>{' '}
            Google account to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width={300}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Only University of Florida students with @ufl.edu accounts can access this platform.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
