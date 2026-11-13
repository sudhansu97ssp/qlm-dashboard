import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { LogOut } from 'lucide-react';

export default function LogoutDialog({ open, onClose, onConfirm, currentUser }) {
  const email = currentUser?.email || currentUser?.username || 'admin@ncircletech.com';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.16)'
        }
      }}
    >
      <DialogTitle sx={{ p: 2.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <LogOut size={20} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
            Confirm Sign Out
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            QLM License Dashboard Session
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: 1.5 }}>
        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, mb: 2 }}>
          Are you sure you want to log out? Your active session will be closed, and you will need to sign in again to access license telemetry and controls.
        </Typography>

        <Box
          sx={{
            p: 1.5,
            px: 2,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            Active Account
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.825rem' }}>
            Admin
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1.5, borderTop: '1px solid #f1f5f9', gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{
            borderColor: '#e2e8f0',
            color: '#475569',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px'
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          startIcon={<LogOut size={16} />}
          sx={{
            backgroundColor: '#dc2626',
            '&:hover': { backgroundColor: '#b91c1c' },
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
          }}
        >
          Yes, Sign Out
        </Button>
      </DialogActions>
    </Dialog>
  );
}
