import { createTheme } from '@mui/material/styles';

export const soberTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Royal Electric Blue
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#64748b',
      light: '#94a3b8',
      dark: '#475569',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      disabled: '#94a3b8'
    },
    divider: '#f1f5f9',
    success: {
      main: '#10b981',
      light: '#ecfdf5',
      dark: '#059669'
    },
    warning: {
      main: '#f59e0b',
      light: '#fffbeb',
      dark: '#d97706'
    },
    error: {
      main: '#ef4444',
      light: '#fef2f2',
      dark: '#dc2626'
    },
    info: {
      main: '#0ea5e9',
      light: '#f0f9ff',
      dark: '#0284c7'
    }
  },
  typography: {
    fontFamily: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'sans-serif'].join(','),
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.015em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontSize: '0.925rem', color: '#64748b' },
    subtitle2: { fontSize: '0.825rem', fontWeight: 600, color: '#334155' },
    body1: { fontSize: '0.9rem', color: '#1e293b' },
    body2: { fontSize: '0.825rem', color: '#64748b' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
            transform: 'translateY(-1px)'
          }
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
          }
        },
        outlined: {
          borderColor: '#e2e8f0',
          color: '#334155',
          '&:hover': {
            borderColor: '#cbd5e1',
            backgroundColor: '#f8fafc'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #eef2f6',
          boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)',
          backgroundImage: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#f1f5f9',
          padding: '13px 18px',
          fontSize: '0.865rem'
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#fafbfc',
          color: '#64748b',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '1px solid #e2e8f0'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          fontSize: '0.75rem'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.12)'
        }
      }
    }
  }
});
