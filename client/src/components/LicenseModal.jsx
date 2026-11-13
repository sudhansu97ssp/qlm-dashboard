import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { X, KeyRound, Copy, Check } from 'lucide-react';
import { createLicense } from '../services/api';

export default function LicenseModal({ open, onClose, customers = [], products = [], onSuccess }) {
  const [formData, setFormData] = useState({
    customerId: '',
    productId: 1,
    licenseModel: 'Subscription',
    licenseType: 'Subscription',
    numLicenses: 1,
    seats: 1,
    features: 65535,
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (customers.length > 0 && !formData.customerId) {
      setFormData(prev => ({ ...prev, customerId: customers[0].CustomerID }));
    }
  }, [customers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-adjust expiry for Permanent or Trial
      if (name === 'licenseModel' || name === 'licenseType') {
        updated.licenseModel = value;
        updated.licenseType = value;
        if (value === 'Permanent') {
          updated.expiryDate = '';
        } else if (value === 'Trial') {
          updated.expiryDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
        } else {
          updated.expiryDate = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];
        }
      }
      if (name === 'numLicenses' || name === 'seats') {
        updated.numLicenses = value;
        updated.seats = value;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        licenseModel: formData.licenseModel || formData.licenseType || 'Subscription',
        licenseType: formData.licenseModel || formData.licenseType || 'Subscription',
        numLicenses: parseInt(formData.numLicenses || formData.seats || 1, 10),
        seats: parseInt(formData.numLicenses || formData.seats || 1, 10)
      };
      const response = await createLicense(payload);
      if (response.success) {
        setCreatedResult(response.data);
        if (onSuccess) onSuccess(response.data);
      } else {
        setError(response.error || 'Failed to issue license key');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCreatedResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={18} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              Create QLM Soraco License Key
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Issue via Soraco Web Service & register license key
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      {createdResult ? (
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: '8px' }}>
            License Key successfully generated via <strong>{createdResult.executionSource || 'QLM Web Service'}</strong> and saved to database!
          </Alert>

          <Box sx={{ p: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
              Generated Activation Key
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', p: 1.5, border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <Typography variant="body1" className="font-mono" sx={{ fontWeight: 700, color: '#1e293b', fontSize: { xs: '0.85rem', sm: '0.95rem' }, wordBreak: 'break-all', userSelect: 'all' }}>
                {createdResult.ActivationKey}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleCopy(createdResult.ActivationKey)}
                startIcon={copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                sx={{ ml: 1, minWidth: 90 }}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box sx={{ p: 1.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Customer</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{createdResult.CompanyName || 'Customer'}</Typography>
            </Box>
            <Box sx={{ p: 1.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>License Model</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{createdResult.LicenseModel || createdResult.LicenseType} ({createdResult.NumLicenses || createdResult.SeatsTotal || 1} Allowed Activations)</Typography>
            </Box>
            <Box sx={{ p: 1.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Expiry Date</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{createdResult.ExpiryDate ? new Date(createdResult.ExpiryDate).toLocaleDateString() : 'Permanent'}</Typography>
            </Box>
            <Box sx={{ p: 1.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>License ID</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{createdResult.LicenseID}</Typography>
            </Box>
          </Box>
        </DialogContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}

            <Grid container spacing={2} sx={{ width: '100%' }}>
              {/* Customer Selector */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Select Customer"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  required
                >
                  {customers.map((c) => (
                    <MenuItem key={c.CustomerID} value={c.CustomerID}>
                      {c.CompanyName} — {c.ContactName} ({c.Email})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Product Selector */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Product"
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  required
                >
                  {products.map((p) => (
                    <MenuItem key={p.ProductID} value={p.ProductID}>
                      {p.ProductName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* License Model (Soraco QLM ELicenseModel) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="License Model"
                  name="licenseModel"
                  value={formData.licenseModel}
                  onChange={handleChange}
                >
                  <MenuItem value="Subscription">Subscription</MenuItem>
                  <MenuItem value="Permanent">Permanent (Perpetual)</MenuItem>
                  <MenuItem value="Trial">Trial (Evaluation)</MenuItem>
                  <MenuItem value="Floating">Floating / Concurrent</MenuItem>
                </TextField>
              </Grid>

              {/* Allowed Activations (NumLicenses) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Allowed Activations (NumLicenses)"
                  name="numLicenses"
                  value={formData.numLicenses}
                  onChange={handleChange}
                  inputProps={{ min: 1, max: 1000 }}
                  required
                  helperText="Specifies NumLicenses in Soraco QLM."
                />
              </Grid>

              {/* Expiry Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Expiration Date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={formData.licenseType === 'Permanent'}
                  helperText={formData.licenseType === 'Permanent' ? 'Perpetual licenses do not expire' : ''}
                />
              </Grid>

              {/* Features Mask */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="QLM Features Bitmask"
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  helperText="Default 65535 (All modules enabled)"
                />
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Internal Notes / Reference"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="PO number, contract reference, project name..."
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} color="inherit" />}
            >
              {loading ? 'Calling QLM API...' : 'Generate & Register Key'}
            </Button>
          </DialogActions>
        </form>
      )}

      {createdResult && (
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0' }}>
          <Button variant="contained" onClick={handleClose}>
            Done
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
