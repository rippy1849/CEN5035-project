import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #001480 0%, #0021A5 100%)',
        color: '#FFFFFF',
        pt: 6,
        pb: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr' },
            gap: 4,
            mb: 4,
          }}
        >
          {/* Brand column */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #FA4616, #FF6B3D)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  color: '#fff',
                }}
              >
                G
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.3px' }}>
                Gator<Box component="span" sx={{ color: '#FA4616' }}>Marketplace</Box>
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 280, lineHeight: 1.7 }}>
              The trusted peer-to-peer marketplace built exclusively for University of Florida students.
            </Typography>
          </Box>

          {/* Quick Links */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, fontSize: '0.7rem' }}>
              Quick Links
            </Typography>
            {[{ label: 'Browse Listings', to: '/' }, { label: 'Sell an Item', to: '/sell' }].map((link) => (
              <Box key={link.to} sx={{ mb: 1 }}>
                <Link
                  component={RouterLink}
                  to={link.to}
                  underline="hover"
                  sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', fontWeight: 500, '&:hover': { color: '#FA4616' } }}
                >
                  {link.label}
                </Link>
              </Box>
            ))}
          </Box>

          {/* Info */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, fontSize: '0.7rem' }}>
              About
            </Typography>
            {['University of Florida', 'Gainesville, FL 32611', 'Go Gators! 🐊'].map((item) => (
              <Typography key={item} variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 0.75, fontSize: '0.875rem' }}>
                {item}
              </Typography>
            ))}
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.10)', mb: 2.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
            © {new Date().getFullYear()} GatorMarketplace. Built for UF Students.
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
            CEN5035 – Software Engineering
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
