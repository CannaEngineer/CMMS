import { createTheme } from '@mui/material/styles';

// Professional color palette inspired by industrial design and safety standards
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565C0', // Industrial blue - trustworthy, professional
      light: '#5E92F3',
      dark: '#003C8F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF6F00', // Safety orange - alerts, warnings
      light: '#FFA040',
      dark: '#C43E00',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F', // Safety red - urgent, critical
      light: '#EF5350',
      dark: '#C62828',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F57C00', // Amber - caution, attention needed
      light: '#FFB74D',
      dark: '#E65100',
      contrastText: '#000000',
    },
    success: {
      main: '#388E3C', // Industrial green - operational, safe
      light: '#66BB6A',
      dark: '#2E7D32',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0288D1', // Information blue
      light: '#03A9F4',
      dark: '#01579B',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A202C',
      secondary: '#4A5568',
      disabled: '#A0AEC0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.0075em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'uppercase',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.06),0px 1px 1px 0px rgba(0,0,0,0.042),0px 1px 3px 0px rgba(0,0,0,0.036)',
    '0px 3px 1px -2px rgba(0,0,0,0.06),0px 2px 2px 0px rgba(0,0,0,0.042),0px 1px 5px 0px rgba(0,0,0,0.036)',
    '0px 3px 3px -2px rgba(0,0,0,0.06),0px 3px 4px 0px rgba(0,0,0,0.042),0px 1px 8px 0px rgba(0,0,0,0.036)',
    '0px 2px 4px -1px rgba(0,0,0,0.06),0px 4px 5px 0px rgba(0,0,0,0.042),0px 1px 10px 0px rgba(0,0,0,0.036)',
    '0px 3px 5px -1px rgba(0,0,0,0.06),0px 5px 8px 0px rgba(0,0,0,0.042),0px 1px 14px 0px rgba(0,0,0,0.036)',
    '0px 3px 5px -1px rgba(0,0,0,0.06),0px 6px 10px 0px rgba(0,0,0,0.042),0px 1px 18px 0px rgba(0,0,0,0.036)',
    '0px 4px 5px -2px rgba(0,0,0,0.06),0px 7px 10px 1px rgba(0,0,0,0.042),0px 2px 16px 1px rgba(0,0,0,0.036)',
    '0px 5px 5px -3px rgba(0,0,0,0.06),0px 8px 10px 1px rgba(0,0,0,0.042),0px 3px 14px 2px rgba(0,0,0,0.036)',
    '0px 5px 6px -3px rgba(0,0,0,0.06),0px 9px 12px 1px rgba(0,0,0,0.042),0px 3px 16px 2px rgba(0,0,0,0.036)',
    '0px 6px 6px -3px rgba(0,0,0,0.06),0px 10px 14px 1px rgba(0,0,0,0.042),0px 4px 18px 3px rgba(0,0,0,0.036)',
    '0px 6px 7px -4px rgba(0,0,0,0.06),0px 11px 15px 1px rgba(0,0,0,0.042),0px 4px 20px 3px rgba(0,0,0,0.036)',
    '0px 7px 8px -4px rgba(0,0,0,0.06),0px 12px 17px 2px rgba(0,0,0,0.042),0px 5px 22px 4px rgba(0,0,0,0.036)',
    '0px 7px 8px -4px rgba(0,0,0,0.06),0px 13px 19px 2px rgba(0,0,0,0.042),0px 5px 24px 4px rgba(0,0,0,0.036)',
    '0px 7px 9px -4px rgba(0,0,0,0.06),0px 14px 21px 2px rgba(0,0,0,0.042),0px 5px 26px 4px rgba(0,0,0,0.036)',
    '0px 8px 9px -5px rgba(0,0,0,0.06),0px 15px 22px 2px rgba(0,0,0,0.042),0px 6px 28px 5px rgba(0,0,0,0.036)',
    '0px 8px 10px -5px rgba(0,0,0,0.06),0px 16px 24px 2px rgba(0,0,0,0.042),0px 6px 30px 5px rgba(0,0,0,0.036)',
    '0px 8px 11px -5px rgba(0,0,0,0.06),0px 17px 26px 2px rgba(0,0,0,0.042),0px 6px 32px 5px rgba(0,0,0,0.036)',
    '0px 9px 11px -5px rgba(0,0,0,0.06),0px 18px 28px 2px rgba(0,0,0,0.042),0px 7px 34px 6px rgba(0,0,0,0.036)',
    '0px 9px 12px -6px rgba(0,0,0,0.06),0px 19px 29px 2px rgba(0,0,0,0.042),0px 7px 36px 6px rgba(0,0,0,0.036)',
    '0px 10px 13px -6px rgba(0,0,0,0.06),0px 20px 31px 3px rgba(0,0,0,0.042),0px 8px 38px 7px rgba(0,0,0,0.036)',
    '0px 10px 13px -6px rgba(0,0,0,0.06),0px 21px 33px 3px rgba(0,0,0,0.042),0px 8px 40px 7px rgba(0,0,0,0.036)',
    '0px 10px 14px -6px rgba(0,0,0,0.06),0px 22px 35px 3px rgba(0,0,0,0.042),0px 8px 42px 7px rgba(0,0,0,0.036)',
    '0px 11px 14px -7px rgba(0,0,0,0.06),0px 23px 36px 3px rgba(0,0,0,0.042),0px 9px 44px 8px rgba(0,0,0,0.036)',
    '0px 11px 15px -7px rgba(0,0,0,0.06),0px 24px 38px 3px rgba(0,0,0,0.042),0px 9px 46px 8px rgba(0,0,0,0.036)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
        },
        body: {
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        },
        '#root': {
          width: '100%',
          minHeight: '100vh',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          width: '100%',
          maxWidth: '100% !important',
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width: 600px)': {
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          minHeight: 48, // Touch-friendly size
          '@media (max-width: 600px)': {
            minHeight: 44,
            fontSize: '0.875rem',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          width: '100%',
          '& .MuiInputBase-root': {
            minHeight: 48, // Touch-friendly size
            '@media (max-width: 600px)': {
              minHeight: 44,
            },
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        item: {
          width: '100%',
          maxWidth: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          width: '100%',
          maxWidth: '100%',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          width: '100%',
          overflowX: 'auto',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

// Status color mapping for work orders and assets
export const statusColors = {
  // Work Order Status
  OPEN: theme.palette.info.main,
  IN_PROGRESS: theme.palette.warning.main,
  ON_HOLD: theme.palette.grey[600],
  COMPLETED: theme.palette.success.main,
  CANCELED: theme.palette.error.light,
  
  // Asset Status
  ONLINE: theme.palette.success.main,
  OFFLINE: theme.palette.error.main,
  
  // Priority Levels
  LOW: theme.palette.grey[600],
  MEDIUM: theme.palette.info.main,
  HIGH: theme.palette.warning.main,
  URGENT: theme.palette.error.main,
  CRITICAL: theme.palette.error.dark,
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

export default theme;