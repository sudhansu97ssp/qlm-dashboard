import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function ConfirmActionDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  actionType = 'deactivate', // 'deactivate' or 'revoke'
  activationKey,
  loading = false
}) {
  const [reason, setReason] = useState('');

  const isRevoke = actionType === 'revoke';

  const handleConfirm = () => {
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ p: 2.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            backgroundColor: isRevoke ? '#fef2f2' : '#fffbeb',
            color: isRevoke ? '#dc2626' : '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isRevoke ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
          {description}
        </Typography>

        <Alert severity={isRevoke ? 'error' : 'warning'} sx={{ mb: 2, borderRadius: '8px', fontSize: '0.8rem' }}>
          {isRevoke
            ? 'Revoking a license key permanently prevents any client application from running or reactivating with this key.'
            : 'Deactivating will free up the activation slot or mark the key as paused.'}
        </Alert>

        <Box sx={{ p: 1.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Target Activation Key</Typography>
          <Typography variant="body2" className="font-mono" sx={{ fontWeight: 700, color: '#0f172a' }}>
            {activationKey}
          </Typography>
        </Box>

        <TextField
          fullWidth
          size="small"
          label="Reason for Action"
          placeholder={isRevoke ? 'E.g., Contract termination, non-payment, compromise' : 'E.g., Hardware migration, customer request'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={isRevoke ? 'error' : 'warning'}
          onClick={handleConfirm}
          disabled={loading}
          startIcon={loading && <CircularProgress size={16} color="inherit" />}
        >
          {loading ? 'Executing...' : isRevoke ? 'Revoke Key Now' : 'Deactivate Key'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
