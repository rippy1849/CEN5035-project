import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0021A5',        // UF Gator Blue
      light: '#1A3BBF',
      dark: '#001480',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FA4616',        // UF Gator Orange
      light: '#FF6B3D',
      dark: '#C73000',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F0F2F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0D1B4B',
      secondary: '#5A6480',
    },
    divider: 'rgba(0,33,165,0.10)',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: { fontWeight: 600, letterSpacing: '0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: 'smooth',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, #001480 0%, #0021A5 60%, #0A2EC4 100%)',
          boxShadow: '0 2px 16px rgba(0,20,128,0.35)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(0,33,165,0.07)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
          '&:hover': {
            boxShadow: '0 16px 40px rgba(0,33,165,0.13)',
            transform: 'translateY(-5px)',
          },
        },
      },
      defaultProps: { elevation: 0 },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 22px',
          lineHeight: 1.5,
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 2px 10px rgba(0,33,165,0.22)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0,33,165,0.32)',
          },
        },
        containedSecondary: {
          boxShadow: '0 2px 10px rgba(250,70,22,0.30)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(250,70,22,0.40)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: 'rgba(0,33,165,0.20)',
            },
            '&:hover fieldset': {
              borderColor: '#0021A5',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: '#FFFFFF' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '& fieldset': {
            borderColor: 'rgba(0,33,165,0.20)',
          },
          '&:hover fieldset': {
            borderColor: '#0021A5',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8, fontSize: '0.75rem' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 16 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 500 },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
  },
});

export default theme;
