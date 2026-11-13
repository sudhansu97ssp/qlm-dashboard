import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  IconButton,
  CircularProgress
} from '@mui/material';
import { X, Package, Plus } from 'lucide-react';

export default function CreateProductModal({ open, onClose, onCreateSuccess }) {
  const [formData, setFormData] = useState({
    productName: '',
    version: '1.0.0',
    major: '1',
    minor: '0',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName.trim()) {
      setError('Product Name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onCreateSuccess(formData);
      setFormData({
        productName: '',
        version: '1.0.0',
        major: '1',
        minor: '0',
        description: ''
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? null : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Package size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
                Create New Product
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Add a new software product to the QLM licensing catalog
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} disabled={loading} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: '24px !important' }}>
          {error && (
            <Box sx={{ mb: 2.5, p: 1.5, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
              <Typography variant="body2" sx={{ color: '#dc2626', fontSize: '0.825rem' }}>
                {error}
              </Typography>
            </Box>
          )}

          <Grid container spacing={2}>
            {/* Product Name */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Product Name"
                name="productName"
                placeholder="e.g. Deviation nSpector, Point Cloud Importer"
                value={formData.productName}
                onChange={handleChange}
                required
                autoFocus
              />
            </Grid>

            {/* Version */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Version (e.g. 1.0.0)"
                name="version"
                value={formData.version}
                onChange={handleChange}
              />
            </Grid>

            {/* Major & Minor */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Major Version"
                name="major"
                type="number"
                value={formData.major}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Minor Version"
                name="minor"
                type="number"
                value={formData.minor}
                onChange={handleChange}
              />
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="Description & Features (Optional)"
                name="description"
                placeholder="Brief description of the software product or module..."
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={onClose} disabled={loading} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Plus size={16} />}
            sx={{
              fontWeight: 700,
              backgroundColor: '#2563eb',
              '&:hover': { backgroundColor: '#1d4ed8' }
            }}
          >
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

