import { createTheme, responsiveFontSizes } from '@mui/material/styles';

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
      main: '#6B288A',
      light: '#8E3AB0',
      dark: '#4A1964',
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
      default: '#EEF1F6',
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
    // Responsive typography
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:960px)': {
        fontSize: '3rem',
      },
      '@media (min-width:1920px)': {
        fontSize: '3.5rem',
      },
      '@media (min-width:2560px)': {
        fontSize: '4rem',
      },
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
      '@media (min-width:960px)': {
        fontSize: '2.25rem',
      },
      '@media (min-width:1920px)': {
        fontSize: '2.75rem',
      },
      '@media (min-width:2560px)': {
        fontSize: '3.25rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:960px)': {
        fontSize: '2rem',
      },
      '@media (min-width:1920px)': {
        fontSize: '2.25rem',
      },
      '@media (min-width:2560px)': {
        fontSize: '2.75rem',
      },
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      '@media (min-width:600px)': {
        fontSize: '1.5rem',
      },
      '@media (min-width:960px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:1920px)': {
        fontSize: '2rem',
      },
      '@media (min-width:2560px)': {
        fontSize: '2.5rem',
      },
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      '@media (min-width:600px)': {
        fontSize: '1.25rem',
      },
      '@media (min-width:960px)': {
        fontSize: '1.5rem',
      },
      '@media (min-width:1920px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:2560px)': {
        fontSize: '2.25rem',
      },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      '@media (min-width:600px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:960px)': {
        fontSize: '1.25rem',
      },
      '@media (min-width:1920px)': {
        fontSize: '1.5rem',
      },
      '@media (min-width:2560px)': {
        fontSize: '2rem',
      },
    },
    body1: {
      fontSize: '0.875rem',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
      '@media (min-width:1920px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:2560px)': {
        fontSize: '1.5rem',
      },
    },
    body2: {
      fontSize: '0.75rem',
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
      '@media (min-width:1920px)': {
        fontSize: '1rem',
      },
      '@media (min-width:2560px)': {
        fontSize: '1.25rem',
      },
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
      '@media (min-width:1920px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:2560px)': {
        fontSize: '1.5rem',
      },
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
          '&.MuiButton-sizeSmall': {
            padding: '6px 12px',
            fontSize: '0.75rem',
            minHeight: 32,
            '@media (min-width:600px)': {
              padding: '8px 16px',
              fontSize: '0.875rem',
              minHeight: 36,
            },
            '@media (min-width:1920px)': {
              padding: '10px 20px',
              fontSize: '1rem',
              minHeight: 40,
            },
            '@media (min-width:2560px)': {
              padding: '12px 24px',
              fontSize: '1.25rem',
              minHeight: 48,
            },
          },
          '&.MuiButton-sizeLarge': {
            padding: '12px 24px',
            fontSize: '1rem',
            minHeight: 48,
            '@media (min-width:600px)': {
              padding: '14px 28px',
              fontSize: '1.125rem',
              minHeight: 52,
            },
            '@media (min-width:1920px)': {
              padding: '16px 32px',
              fontSize: '1.25rem',
              minHeight: 56,
            },
            '@media (min-width:2560px)': {
              padding: '20px 40px',
              fontSize: '1.75rem',
              minHeight: 72,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          transition: 'box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1)',
            transform: 'translateY(-2px)',
          },
          '@media (min-width:1920px)': {
            borderRadius: 16,
          },
          '@media (min-width:2560px)': {
            borderRadius: 20,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: '0.875rem',
            '@media (min-width:600px)': {
              fontSize: '1rem',
            },
            '@media (min-width:1920px)': {
              fontSize: '1.125rem',
              borderRadius: 10,
            },
            '@media (min-width:2560px)': {
              fontSize: '1.5rem',
              borderRadius: 12,
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            '@media (min-width:600px)': {
              fontSize: '1rem',
            },
            '@media (min-width:1920px)': {
              fontSize: '1.125rem',
            },
            '@media (min-width:2560px)': {
              fontSize: '1.5rem',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '@media (min-width:1920px)': {
            borderRadius: 16,
          },
          '@media (min-width:2560px)': {
            borderRadius: 20,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.85rem',
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          '& .MuiTableSortLabel-root': {
            whiteSpace: 'nowrap',
          },
          '@media (min-width:600px)': {
            fontSize: '0.85rem',
            padding: '4px 8px',
          },
          '@media (min-width:960px)': {
            fontSize: '0.875rem',
            padding: '4px 8px',
          },
          '@media (min-width:1920px)': {
            fontSize: '1rem',
            padding: '6px 10px',
          },
          '@media (min-width:2560px)': {
            fontSize: '1.2rem',
            padding: '8px 12px',
          },
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          padding: '5px 8px',
          '@media (min-width:1920px)': {
            padding: '7px 10px',
          },
          '@media (min-width:2560px)': {
            padding: '9px 12px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          height: 50,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: '8px',
          '@media (min-width:960px)': {
            padding: '10px',
          },
          '@media (min-width:1920px)': {
            padding: '12px',
          },
          '@media (min-width:2560px)': {
            padding: '16px',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          '@media (min-width:1920px)': {
            borderRight: '2px solid rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        container: {
          '@media (min-width:2560px)': {
            maxWidth: '2200px',
            margin: '0 auto',
          },
        },
      },
    },
  },
});

// Apply responsive font sizes
theme = responsiveFontSizes(theme, {
  breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
  factor: 2,
});

export { theme };
export default theme;