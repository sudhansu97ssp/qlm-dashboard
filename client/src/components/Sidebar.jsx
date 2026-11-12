import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  Drawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  LayoutDashboard,
  Users,
  KeyRound,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut
} from 'lucide-react';

const navItems = [
  { id: 'analytics', label: 'Analytics Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customer Directory', icon: Users, badgeKey: 'customers' },
  { id: 'licenses', label: 'License Manager', icon: KeyRound, badgeKey: 'licenses' },
  { id: 'audit', label: 'Audit Trail', icon: ShieldCheck }
];

export default function Sidebar({
  activeTab,
  onTabChange,
  counts = {},
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
  currentUser,
  onLogout
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerWidth = isCollapsed && !isMobile ? 78 : 260;

  const sidebarContent = (
    <Box
      sx={{
        width: drawerWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #eef2f6',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          height: 68,
          px: isCollapsed && !isMobile ? 1.5 : 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
          borderBottom: '1px solid #f1f5f9'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer'
          }}
          onClick={() => onTabChange('analytics')}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              flexShrink: 0
            }}
          >
            <KeyRound size={20} />
          </Box>

          {(!isCollapsed || isMobile) && (
            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.975rem',
                  color: '#0f172a',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em'
                }}
              >
                QLM Portal
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#64748b',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                License Manager <Sparkles size={11} color="#f59e0b" />
              </Typography>
            </Box>
          )}
        </Box>

        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <Tooltip title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'} placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                display: isCollapsed ? 'none' : 'flex',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a'
                }
              }}
            >
              <ChevronLeft size={16} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Nav Items List */}
      <Box sx={{ flex: 1, py: 2.5, px: isCollapsed && !isMobile ? 1 : 2, overflowY: 'auto' }}>
        {(!isCollapsed || isMobile) && (
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              mb: 1.5,
              display: 'block',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.675rem',
              color: '#94a3b8'
            }}
          >
            Navigation
          </Typography>
        )}

        <List component="nav" disablePadding>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            const count = item.badgeKey ? counts[item.badgeKey] : null;

            const buttonContent = (
              <ListItemButton
                key={item.id}
                selected={isSelected}
                onClick={() => {
                  onTabChange(item.id);
                  if (isMobile && onMobileClose) onMobileClose();
                }}
                sx={{
                  borderRadius: '10px',
                  mb: 0.8,
                  py: 1.1,
                  px: isCollapsed && !isMobile ? 1.5 : 1.75,
                  justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                  color: isSelected ? '#ffffff' : '#64748b',
                  background: isSelected
                    ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%) !important'
                    : 'transparent',
                  boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
                  '&:hover': {
                    backgroundColor: isSelected ? undefined : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#0f172a'
                  },
                  transition: 'all 0.18s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isCollapsed && !isMobile ? 0 : 34,
                    color: isSelected ? '#ffffff' : '#64748b',
                    justifyContent: 'center'
                  }}
                >
                  <IconComponent size={19} />
                </ListItemIcon>

                {(!isCollapsed || isMobile) && (
                  <>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 700 : 500,
                          letterSpacing: '-0.01em'
                        }
                      }}
                    />
                    {count !== null && count !== undefined && (
                      <Chip
                        label={count}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.22)' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#475569',
                          borderRadius: '6px'
                        }}
                      />
                    )}
                  </>
                )}
              </ListItemButton>
            );

            if (isCollapsed && !isMobile) {
              return (
                <Tooltip key={item.id} title={`${item.label}${count !== null && count !== undefined ? ` (${count})` : ''}`} placement="right">
                  {buttonContent}
                </Tooltip>
              );
            }

            return buttonContent;
          })}
        </List>
      </Box>

      {/* Expand Button for Collapsed State */}
      {isCollapsed && !isMobile && (
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Tooltip title="Expand Sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#2563eb',
                '&:hover': {
                  backgroundColor: '#eff6ff'
                }
              }}
            >
              <ChevronRight size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* User Profile & Sign Out Footer */}
      <Box
        sx={{
          p: isCollapsed && !isMobile ? 1.5 : 2,
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#fafbfc'
        }}
      >
        {isCollapsed && !isMobile ? (
          <Tooltip title={`Sign Out (${currentUser?.email || 'admin'})`} placement="right">
            <IconButton
              size="small"
              onClick={onLogout}
              sx={{
                width: 36,
                height: 36,
                mx: 'auto',
                display: 'flex',
                borderRadius: '9px',
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.16)'
                }
              }}
            >
              <LogOut size={16} />
            </IconButton>
          </Tooltip>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}
              >
                {(currentUser?.email || currentUser?.username || 'A')[0].toUpperCase()}
              </Box>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    lineHeight: 1.2,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {currentUser?.email || currentUser?.username || 'admin@ncircletech.com'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#0284c7',
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                >
                  Administrator
                </Typography>
              </Box>
            </Box>

            <Tooltip title="Sign Out">
              <IconButton
                size="small"
                onClick={onLogout}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  color: '#64748b',
                  '&:hover': {
                    color: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)'
                  }
                }}
              >
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  // If Mobile, render inside MUI Drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            border: 'none',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  // Desktop sticky sidebar
  return (
    <Box
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 10
      }}
    >
      {sidebarContent}
    </Box>
  );
}
