import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import {
  Menu,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  LogOut,
  User
} from 'lucide-react';

export default function Navbar({
  activeTab,
  onOpenCreateModal,
  onOpenExportModal,
  onRefresh,
  isRefreshing,
  onToggleSidebar,
  currentUser,
  onLogout
}) {
  const titles = {
    analytics: 'Analytics & Telemetry',
    customers: 'Customer Directory',
    licenses: 'License Manager',
    audit: 'Security Operations & Audit Trail'
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #eef2f6',
        color: '#0f172a',
        zIndex: 5
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 }, minHeight: '68px !important' }}>
        {/* Left: Hamburger & View Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Toggle Navigation Sidebar">
            <IconButton
              size="small"
              onClick={onToggleSidebar}
              sx={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                width: 36,
                height: 36,
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a'
                }
              }}
            >
              <Menu size={18} />
            </IconButton>
          </Tooltip>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1rem', sm: '1.15rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {titles[activeTab] || 'Dashboard'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.725rem', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
              Soraco Quick License Manager (QLM)
            </Typography>
          </Box>
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          {/* Sync Button */}
          <Tooltip title="Synchronize Data">
            <span>
              <IconButton
                size="small"
                onClick={onRefresh}
                disabled={isRefreshing}
                sx={{
                  width: 36,
                  height: 36,
                  border: '1px solid #e2e8f0',
                  borderRadius: '9px',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                    color: '#0f172a'
                  }
                }}
              >
                <RefreshCw size={16} className={isRefreshing ? 'pulse-indicator' : ''} />
              </IconButton>
            </span>
          </Tooltip>

          {/* Export Excel Button */}
          {onOpenExportModal && (
            <Tooltip title="Periodic Excel Export (7d, 15d, 30d, 6m, 1y)">
              <Button
                variant="outlined"
                color="success"
                size="small"
                startIcon={<FileSpreadsheet size={15} />}
                onClick={onOpenExportModal}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  borderRadius: '9px',
                  px: { xs: 1.2, sm: 1.8 },
                  height: 36,
                  borderColor: '#a7f3d0',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: { xs: 'none', md: 'inline-flex' },
                  '&:hover': {
                    backgroundColor: '#d1fae5',
                    borderColor: '#059669'
                  }
                }}
              >
                Export Excel
              </Button>
            </Tooltip>
          )}

          {/* Primary Create Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus size={16} />}
            onClick={onOpenCreateModal}
            sx={{
              fontWeight: 700,
              fontSize: '0.825rem',
              borderRadius: '9px',
              px: { xs: 1.5, sm: 2.2 },
              height: 36,
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)'
              }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Create </Box>License Key
          </Button>

          {/* User Account & Logout */}
          <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto', borderColor: '#e2e8f0', display: { xs: 'none', sm: 'block' } }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<User size={14} color="#0284c7" />}
              label="Admin"
              size="small"
              sx={{
                height: 32,
                fontWeight: 700,
                fontSize: '0.78rem',
                backgroundColor: '#f0f9ff',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            />

            <Tooltip title="Sign Out">
              <IconButton
                size="small"
                onClick={onLogout}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '9px',
                  border: '1px solid #fee2e2',
                  backgroundColor: '#fff5f5',
                  color: '#ef4444',
                  '&:hover': {
                    backgroundColor: '#fee2e2',
                    color: '#dc2626'
                  }
                }}
              >
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
