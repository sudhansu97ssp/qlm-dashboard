import React, { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  Autocomplete,
  Chip
} from '@mui/material';
import { X, KeyRound, Copy, Check, User, Package } from 'lucide-react';
import { createLicense } from '../services/api';

export default function LicenseModal({
  open,
  onClose,
  customers = [],
  products = [],
  onSuccess,
  initialCustomer = null,
  initialProduct = null
}) {
  const [formData, setFormData] = useState({
    customerId: '',
    productId: 1,
    licenseModel: 'Subscription',
    licenseType: 'Subscription',
    numLicenses: 1,
    seats: 1,
    features: 65535,
    durationDays: 365,
    customDays: 30,
    expiryMode: 'duration', // 'duration', 'custom_days', or 'fixed_date'
    expiryDate: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialCustomer && initialCustomer.CustomerID) {
        setFormData(prev => ({ ...prev, customerId: initialCustomer.CustomerID }));
      } else if (!formData.customerId && customers.length > 0) {
        setFormData(prev => ({ ...prev, customerId: customers[0].CustomerID }));
      }

      if (initialProduct && initialProduct.ProductID) {
        setFormData(prev => ({ ...prev, productId: initialProduct.ProductID }));
      } else if (!formData.productId && products.length > 0) {
        setFormData(prev => ({ ...prev, productId: products[0].ProductID }));
      }
    }
  }, [open, initialCustomer, initialProduct, customers, products]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => String(c.CustomerID) === String(formData.customerId)) || null;
  }, [customers, formData.customerId]);

  const selectedProduct = useMemo(() => {
    return products.find(p => String(p.ProductID) === String(formData.productId)) || null;
  }, [products, formData.productId]);

  const filterCustomerOptions = (options, { inputValue }) => {
    if (!inputValue || !inputValue.trim()) return options.slice(0, 50);
    const s = inputValue.toLowerCase().trim();
    return options.filter(c =>
      (c.CompanyName && c.CompanyName.toLowerCase().includes(s)) ||
      (c.ContactName && c.ContactName.toLowerCase().includes(s)) ||
      (c.Email && c.Email.toLowerCase().includes(s)) ||
      (c.City && c.City.toLowerCase().includes(s)) ||
      (c.Country && c.Country.toLowerCase().includes(s)) ||
      String(c.CustomerID).includes(s)
    ).slice(0, 50);
  };

  const filterProductOptions = (options, { inputValue }) => {
    if (!inputValue || !inputValue.trim()) return options;
    const s = inputValue.toLowerCase().trim();
    return options.filter(p =>
      (p.ProductName && p.ProductName.toLowerCase().includes(s)) ||
      (p.CurrentVersion && p.CurrentVersion.toLowerCase().includes(s)) ||
      (p.ProductCode && p.ProductCode.toLowerCase().includes(s)) ||
      (p.Description && p.Description.toLowerCase().includes(s)) ||
      String(p.ProductID).includes(s)
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-adjust duration when license model changes
      if (name === 'licenseModel' || name === 'licenseType') {
        updated.licenseModel = value;
        updated.licenseType = value;
        if (value === 'Permanent') {
          updated.durationDays = 0;
          updated.expiryMode = 'duration';
          updated.expiryDate = '';
        } else if (value === 'Trial') {
          updated.durationDays = 30;
          updated.expiryMode = 'duration';
          updated.expiryDate = '';
        } else {
          updated.durationDays = 365;
          updated.expiryMode = 'duration';
          updated.expiryDate = '';
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
      let finalDuration = null;
      let finalExpiryDate = null;

      if (formData.licenseModel !== 'Permanent') {
        if (formData.expiryMode === 'duration') {
          finalDuration = parseInt(formData.durationDays, 10) || 365;
        } else if (formData.expiryMode === 'custom_days') {
          finalDuration = parseInt(formData.customDays, 10) || 30;
        } else if (formData.expiryMode === 'fixed_date') {
          finalExpiryDate = formData.expiryDate || null;
        }
      }

      const payload = {
        ...formData,
        licenseModel: formData.licenseModel || formData.licenseType || 'Subscription',
        licenseType: formData.licenseModel || formData.licenseType || 'Subscription',
        numLicenses: parseInt(formData.numLicenses || formData.seats || 1, 10),
        seats: parseInt(formData.numLicenses || formData.seats || 1, 10),
        durationDays: finalDuration,
        expiryDate: finalExpiryDate
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
              <Typography variant="caption" sx={{ color: '#64748b' }}>License Expiry</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {createdResult.ExpiryDate
                  ? new Date(createdResult.ExpiryDate).toLocaleDateString()
                  : (createdResult.SubscriptionDuration && createdResult.SubscriptionDuration > 0) || (createdResult.DurationDays && createdResult.DurationDays > 0)
                  ? `${createdResult.SubscriptionDuration || createdResult.DurationDays} Days after activation`
                  : 'Permanent (Perpetual)'}
              </Typography>
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
              {/* Searchable Customer Selector */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  id="customer-search-select"
                  options={customers}
                  value={selectedCustomer}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      customerId: newValue ? newValue.CustomerID : ''
                    }));
                    if (error) setError(null);
                  }}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    if (typeof option === 'string') return option;
                    const company = (option.CompanyName || option.Company || '').trim();
                    const email = (option.Email || option.CustomerEmail || '').trim();
                    const contact = (option.ContactName || option.FullName || '').trim();
                    if (company && email) return `${company} (${email})`;
                    if (company && contact && contact !== 'N/A') return `${company} — ${contact}`;
                    return company || contact || email || `Customer #${option.CustomerID}`;
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return false;
                    return String(option.CustomerID) === String(value.CustomerID);
                  }}
                  filterOptions={filterCustomerOptions}
                  noOptionsText="No matching customers found"
                  slotProps={{
                    paper: {
                      sx: {
                        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        mt: 0.5
                      }
                    },
                    listbox: {
                      sx: {
                        p: 0,
                        maxHeight: 280,
                        '& .MuiAutocomplete-option': {
                          display: 'block !important',
                          py: '8px !important',
                          px: '14px !important',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                          '&:last-child': {
                            borderBottom: 'none'
                          },
                          '&[aria-selected="true"]': {
                            backgroundColor: '#eff6ff !important'
                          },
                          '&.Mui-focused': {
                            backgroundColor: '#f8fafc'
                          }
                        }
                      }
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    const company = (option.CompanyName || option.Company || '').trim();
                    const contact = (option.ContactName || option.FullName || '').trim();
                    const email = (option.Email || option.CustomerEmail || '').trim();
                    const location = option.City && option.Country ? `${option.City}, ${option.Country}` : (option.Country || option.City || '');

                    return (
                      <li key={key || option.CustomerID} {...otherProps}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: '#0f172a',
                              fontSize: '0.825rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '75%'
                            }}
                          >
                            {company || contact || 'Independent Customer'}
                          </Typography>
                          {location && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#94a3b8',
                                fontSize: '0.675rem',
                                flexShrink: 0,
                                ml: 1
                              }}
                            >
                              {location}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
                          {contact && contact !== company && contact !== 'N/A' && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#475569',
                                fontWeight: 500,
                                fontSize: '0.725rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {contact}
                            </Typography>
                          )}
                          {contact && contact !== company && contact !== 'N/A' && email && (
                            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>•</Typography>
                          )}
                          {email && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#2563eb',
                                fontFamily: 'monospace',
                                fontSize: '0.725rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {email}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Select Customer"
                      placeholder="Type company name, contact, or email to search..."
                      required={!formData.customerId}
                      error={Boolean(error && !formData.customerId)}
                      helperText={
                        selectedCustomer
                          ? `Selected: ${selectedCustomer.CompanyName || selectedCustomer.Company || 'Customer'} (${selectedCustomer.Email || 'No email'})`
                          : 'Search by company, person name, email, or city'
                      }
                    />
                  )}
                />
              </Grid>

              {/* Searchable Product Selector */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  id="product-search-select"
                  options={products}
                  value={selectedProduct}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      productId: newValue ? newValue.ProductID : ''
                    }));
                    if (error) setError(null);
                  }}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    if (typeof option === 'string') return option;
                    const versionStr = option.CurrentVersion || option.ProductCode || option.LatestVersion || '';
                    const cleanVer = versionStr ? (versionStr.startsWith('v') ? versionStr : `v${versionStr}`) : '';
                    return cleanVer ? `${option.ProductName} (${cleanVer})` : option.ProductName || `Product #${option.ProductID}`;
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return false;
                    return String(option.ProductID) === String(value.ProductID);
                  }}
                  filterOptions={filterProductOptions}
                  noOptionsText="No matching products found"
                  slotProps={{
                    paper: {
                      sx: {
                        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        mt: 0.5
                      }
                    },
                    listbox: {
                      sx: {
                        p: 0,
                        maxHeight: 260,
                        '& .MuiAutocomplete-option': {
                          display: 'block !important',
                          py: '8px !important',
                          px: '14px !important',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                          '&:last-child': {
                            borderBottom: 'none'
                          },
                          '&[aria-selected="true"]': {
                            backgroundColor: '#eff6ff !important'
                          },
                          '&.Mui-focused': {
                            backgroundColor: '#f8fafc'
                          }
                        }
                      }
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    const versionStr = option.CurrentVersion || option.ProductCode || option.LatestVersion || '';
                    const cleanVer = versionStr ? (versionStr.startsWith('v') ? versionStr : `v${versionStr}`) : '';

                    return (
                      <li key={key || option.ProductID} {...otherProps}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: '#0f172a',
                              fontSize: '0.825rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '75%'
                            }}
                          >
                            {option.ProductName}
                          </Typography>
                          {cleanVer && (
                            <Chip
                              label={cleanVer}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.675rem',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe'
                              }}
                            />
                          )}
                        </Box>
                        {option.Description && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#64748b',
                              fontSize: '0.7rem',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              mt: 0.25
                            }}
                          >
                            {option.Description}
                          </Typography>
                        )}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Select Product *"
                      placeholder="Type product name or version to search..."
                      required={!formData.productId}
                      error={Boolean(error && !formData.productId)}
                    />
                  )}
                />
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

              {/* Validity & Expiration */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="License Validity"
                  name="expiryMode"
                  value={formData.licenseModel === 'Permanent' ? 'permanent' : (formData.expiryMode === 'duration' ? formData.durationDays : formData.expiryMode)}
                  disabled={formData.licenseModel === 'Permanent'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom_days') {
                      setFormData(prev => ({ ...prev, expiryMode: 'custom_days' }));
                    } else if (val === 'fixed_date') {
                      setFormData(prev => ({
                        ...prev,
                        expiryMode: 'fixed_date',
                        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        expiryMode: 'duration',
                        durationDays: parseInt(val, 10),
                        expiryDate: ''
                      }));
                    }
                  }}
                  helperText={
                    formData.licenseModel === 'Permanent'
                      ? 'Perpetual licenses never expire'
                      : formData.expiryMode === 'fixed_date'
                      ? 'Expires on this fixed calendar date'
                      : 'Validity begins when customer first activates on computer'
                  }
                >
                  {formData.licenseModel === 'Permanent' ? (
                    <MenuItem value="permanent">Perpetual (Never Expires)</MenuItem>
                  ) : (
                    [
                      <MenuItem key="15" value={15}>15 Days after Activation</MenuItem>,
                      <MenuItem key="30" value={30}>30 Days after Activation</MenuItem>,
                      <MenuItem key="60" value={60}>60 Days after Activation</MenuItem>,
                      <MenuItem key="90" value={90}>90 Days (3 Months) after Activation</MenuItem>,
                      <MenuItem key="180" value={180}>180 Days (6 Months) after Activation</MenuItem>,
                      <MenuItem key="365" value={365}>365 Days (1 Year) after Activation</MenuItem>,
                      <MenuItem key="730" value={730}>2 Years after Activation</MenuItem>,
                      <MenuItem key="custom_days" value="custom_days">Custom Number of Days...</MenuItem>,
                      <MenuItem key="fixed_date" value="fixed_date">Specific Fixed Date...</MenuItem>
                    ]
                  )}
                </TextField>
              </Grid>

              {/* Conditional Input for Custom Days or Fixed Date */}
              {formData.expiryMode === 'custom_days' && formData.licenseModel !== 'Permanent' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Days Valid After Activation"
                    name="customDays"
                    value={formData.customDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, customDays: Math.max(1, parseInt(e.target.value || 1, 10)) }))}
                    inputProps={{ min: 1, max: 3650 }}
                    helperText="Number of days the customer can use software after first activation"
                  />
                </Grid>
              )}

              {formData.expiryMode === 'fixed_date' && formData.licenseModel !== 'Permanent' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Fixed Expiration Date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }}
                    helperText="Fixed calendar date expiration"
                  />
                </Grid>
              )}

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
