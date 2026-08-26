import { createTheme, responsiveFontSizes } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xxl: true;
  }
}

// Define custom breakpoints for all device types
const customBreakpoints = {
  values: {
    xs: 0,      // Mobile phones
    sm: 600,    // Large phones / small tablets
    md: 960,    // Tablets
    lg: 1280,   // Laptops / small monitors
    xl: 1920,   // Large monitors
    xxl: 2560,  // TV screens / ultra-wide monitors
  },
};

let theme = createTheme({
  breakpoints: customBreakpoints,
  palette: {
    mode: 'light',
    primary: {
      main: '#80145A',
      light: '#A32276',
      dark: '#5B0C3F',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#D82578',
      light: '#F04C95',
      dark: '#9D1352',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#1E4D92',
      light: '#3B75C4',
      dark: '#133363',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#F0EBF4',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: [
      'Nunito Sans',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      '@media (min-width:600px)': { fontSize: '2.5rem' },
      '@media (min-width:960px)': { fontSize: '3rem' },
      '@media (min-width:1920px)': { fontSize: '3.5rem' },
      '@media (min-width:2560px)': { fontSize: '4rem' },
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      '@media (min-width:600px)': { fontSize: '2rem' },
      '@media (min-width:960px)': { fontSize: '2.25rem' },
      '@media (min-width:1920px)': { fontSize: '2.75rem' },
      '@media (min-width:2560px)': { fontSize: '3.25rem' },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      '@media (min-width:600px)': { fontSize: '1.75rem' },
      '@media (min-width:960px)': { fontSize: '2rem' },
      '@media (min-width:1920px)': { fontSize: '2.25rem' },
      '@media (min-width:2560px)': { fontSize: '2.75rem' },
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      '@media (min-width:600px)': { fontSize: '1.5rem' },
      '@media (min-width:960px)': { fontSize: '1.75rem' },
      '@media (min-width:1920px)': { fontSize: '2rem' },
      '@media (min-width:2560px)': { fontSize: '2.5rem' },
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      '@media (min-width:600px)': { fontSize: '1.25rem' },
      '@media (min-width:960px)': { fontSize: '1.5rem' },
      '@media (min-width:1920px)': { fontSize: '1.75rem' },
      '@media (min-width:2560px)': { fontSize: '2.25rem' },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      '@media (min-width:600px)': { fontSize: '1.125rem' },
      '@media (min-width:960px)': { fontSize: '1.25rem' },
      '@media (min-width:1920px)': { fontSize: '1.5rem' },
      '@media (min-width:2560px)': { fontSize: '2rem' },
    },
    body1: {
      fontSize: '0.875rem',
      '@media (min-width:600px)': { fontSize: '1rem' },
      '@media (min-width:1920px)': { fontSize: '1.125rem' },
      '@media (min-width:2560px)': { fontSize: '1.5rem' },
    },
    body2: {
      fontSize: '0.75rem',
      '@media (min-width:600px)': { fontSize: '0.875rem' },
      '@media (min-width:1920px)': { fontSize: '1rem' },
      '@media (min-width:2560px)': { fontSize: '1.25rem' },
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
      '@media (min-width:600px)': { fontSize: '1rem' },
      '@media (min-width:1920px)': { fontSize: '1.125rem' },
      '@media (min-width:2560px)': { fontSize: '1.5rem' },
    },
  },
  spacing: (factor: number) => `${0.5 * factor}rem`,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          minHeight: 40,
          '@media (min-width:600px)': {
            padding: '10px 20px',
            fontSize: '1rem',
            minHeight: 44,
          },
          '@media (min-width:960px)': {
            padding: '12px 24px',
            fontSize: '1rem',
            minHeight: 48,
          },
          '@media (min-width:1920px)': {
            padding: '14px 28px',
            fontSize: '1.125rem',
            minHeight: 52,
          },
          '@media (min-width:2560px)': {
            padding: '18px 36px',
            fontSize: '1.5rem',
            minHeight: 64,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          transition: 'box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme, {
  breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
  factor: 2,
});

export default theme;
export { theme };