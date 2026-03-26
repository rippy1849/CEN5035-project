import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const navItems = [
    { label: 'Browse', to: '/' },
    { label: 'Sell', to: '/sell' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ minHeight: { xs: 60, sm: 68 }, px: { xs: 2, sm: 4, md: 6 } }}>
        {/* Logo */}
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            textDecoration: 'none',
            mr: 4,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FA4616, #FF6B3D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(250,70,22,0.45)',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            G
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: '#FFFFFF',
              fontWeight: 700,
              letterSpacing: '-0.3px',
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            Gator
            <Box component="span" sx={{ color: '#FA4616' }}>Marketplace</Box>
          </Typography>
        </Box>

        {/* Nav links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                sx={{
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.72)',
                  fontWeight: active ? 700 : 500,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  position: 'relative',
                  backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255,255,255,0.10)',
                  },
                  '&::after': active ? {
                    content: '""',
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '2px',
                    borderRadius: 2,
                    backgroundColor: '#FA4616',
                  } : {},
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        {/* Right side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label="UF Students Only"
            size="small"
            sx={{
              backgroundColor: 'rgba(250,70,22,0.18)',
              color: '#FFB49A',
              fontWeight: 600,
              fontSize: '0.7rem',
              border: '1px solid rgba(250,70,22,0.30)',
              display: { xs: 'none', md: 'flex' },
            }}
          />

          {isLoggedIn && user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={user.picture}
                alt={user.name}
                sx={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.3)' }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  display: { xs: 'none', sm: 'block' },
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name}
              </Typography>
              <Button
                size="small"
                startIcon={<LogoutIcon sx={{ fontSize: '0.9rem !important' }} />}
                onClick={handleLogout}
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255,255,255,0.10)',
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          ) : (
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="small"
              sx={{
                color: '#FFFFFF',
                borderColor: 'rgba(255,255,255,0.45)',
                fontWeight: 600,
                px: 2,
                '&:hover': {
                  borderColor: '#FFFFFF',
                  backgroundColor: 'rgba(255,255,255,0.10)',
                },
              }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
