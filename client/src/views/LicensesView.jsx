import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  Stack
} from '@mui/material';
import {
  Search,
  Plus,
  Copy,
  Check,
  PowerOff,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ConfirmActionDialog from '../components/ConfirmActionDialog';
import ExportExcelModal from '../components/ExportExcelModal';
import { deactivateLicense, revokeLicense } from '../services/api';

export default function LicensesView({
  licenses = [],
  products = [],
  filters,
  onFilterChange,
  onResetFilters,
  onOpenCreateModal,
  onSelectLicense,
  onRefresh
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [copiedKey, setCopiedKey] = useState(null);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  // Quick Action Dialog State
  const [dialogState, setDialogState] = useState({
    open: false,
    actionType: 'deactivate',
    activationKey: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenAction = (actionType, activationKey) => {
    setDialogState({
      open: true,
      actionType,
      activationKey
    });
  };

  const handleConfirmAction = async (reason) => {
    setActionLoading(true);
    try {
      if (dialogState.actionType === 'deactivate') {
        await deactivateLicense({ activationKey: dialogState.activationKey, reason });
      } else {
        await revokeLicense({ activationKey: dialogState.activationKey, reason });
      }
      setDialogState({ open: false, actionType: 'deactivate', activationKey: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const exportToCsv = () => {
    if (licenses.length === 0) return;
    const headers = ['LicenseID', 'ActivationKey', 'Company', 'CustomerEmail', 'Product', 'LicenseModel', 'Status', 'NumLicenses_Allowed', 'Activated', 'NotYetActivated', 'ExpiryDate'];
    const rows = licenses.map(l => {
      const allowed = l.NumLicenses || l.SeatsTotal || 1;
      const activated = l.ActivatedCount ?? (l.SeatsUsed || 0);
      const notActivated = l.NotActivatedCount ?? (l.AvailableLicenses ?? Math.max(0, allowed - activated));
      return [
        l.LicenseID,
        l.ActivationKey,
        `"${l.CompanyName || ''}"`,
        l.CustomerEmail || '',
        `"${l.ProductName || ''}"`,
        l.LicenseModel || l.LicenseType,
        l.Status,
        allowed,
        activated,
        notActivated,
        l.ExpiryDate || 'Permanent'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QLM_Licenses_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedLicenses = licenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Status Filter Quick Chips
  const statusOptions = ['All', 'Active', 'Expired', 'Deactivated', 'Revoked'];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header & Filter Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: '20px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
                License Manager & QLM Operations
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Manage, filter, deactivate, and revoke license activation keys
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                color="success"
                size="small"
                startIcon={<FileSpreadsheet size={15} />}
                onClick={() => setExcelModalOpen(true)}
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '7px',
                  borderColor: '#a7f3d0',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  '&:hover': {
                    backgroundColor: '#d1fae5',
                    borderColor: '#059669'
                  }
                }}
              >
                Export Excel (.xlsx)
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Download size={14} />}
                onClick={exportToCsv}
                sx={{ fontSize: '0.8rem', borderRadius: '7px' }}
              >
                CSV
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<Plus size={15} />}
                onClick={onOpenCreateModal}
                sx={{ fontSize: '0.8rem', borderRadius: '7px' }}
              >
                Issue License Key
              </Button>
            </Stack>
          </Box>

          {/* Status Quick Filter Chips */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {statusOptions.map((status) => {
              const isSelected = (filters.status || 'All') === status;
              return (
                <Chip
                  key={status}
                  label={status}
                  clickable
                  onClick={() => onFilterChange('status', status === 'All' ? '' : status)}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    backgroundColor: isSelected ? '#2563eb' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#475569',
                    '&:hover': {
                      backgroundColor: isSelected ? '#1d4ed8' : '#e2e8f0'
                    }
                  }}
                />
              );
            })}
          </Box>

          {/* Filter Inputs Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2.5fr 1.2fr 1.2fr auto' }, gap: 1.5 }}>
            {/* Search */}
            <TextField
              size="small"
              placeholder="Search by activation key, company, or email..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#94a3b8" />
                    </InputAdornment>
                  )
                }
              }}
            />

            {/* Product Filter */}
            <TextField
              select
              size="small"
              label="Product"
              value={filters.productId || 'All'}
              onChange={(e) => onFilterChange('productId', e.target.value === 'All' ? '' : e.target.value)}
            >
              <MenuItem value="All">All Products</MenuItem>
              {products.map((p) => (
                <MenuItem key={p.ProductID} value={p.ProductID}>
                  {p.ProductName}
                </MenuItem>
              ))}
            </TextField>

            {/* License Model Filter */}
            <TextField
              select
              size="small"
              label="License Model"
              value={filters.type || 'All'}
              onChange={(e) => onFilterChange('type', e.target.value === 'All' ? '' : e.target.value)}
            >
              <MenuItem value="All">All Models</MenuItem>
              <MenuItem value="Subscription">Subscription</MenuItem>
              <MenuItem value="Permanent">Permanent</MenuItem>
              <MenuItem value="Trial">Trial</MenuItem>
              <MenuItem value="Floating">Floating</MenuItem>
            </TextField>

            {/* Reset */}
            <Tooltip title="Reset filters">
              <Button
                variant="outlined"
                color="secondary"
                onClick={onResetFilters}
                sx={{ minWidth: 40, px: 1.5 }}
              >
                <RotateCcw size={15} />
              </Button>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Licenses Data Table */}
      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 950 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Activation Key</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Customer / Company</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Product</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>License Model</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Activations (Activated / Allowed)</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Expiration</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedLicenses.length > 0 ? (
                displayedLicenses.map((lic) => {
                  const isCopied = copiedKey === lic.ActivationKey;
                  const allowed = lic.NumLicenses || lic.SeatsTotal || 1;
                  const activated = lic.ActivatedCount ?? (lic.SeatsUsed || 0);
                  const notActivated = lic.NotActivatedCount ?? (lic.AvailableLicenses ?? Math.max(0, allowed - activated));
                  const isFull = activated >= allowed;

                  return (
                    <TableRow key={lic.LicenseID} hover>
                      {/* Key & Copy */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            className="font-mono"
                            onClick={() => onSelectLicense(lic.LicenseID)}
                            sx={{
                              fontWeight: 600,
                              color: '#2563eb',
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {lic.ActivationKey}
                          </Typography>
                          <Tooltip title={isCopied ? 'Copied' : 'Copy Key'}>
                            <IconButton size="small" onClick={() => handleCopy(lic.ActivationKey)} sx={{ p: 0.5 }}>
                              {isCopied ? <Check size={13} color="#059669" /> : <Copy size={13} color="#94a3b8" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                          ID: {lic.LicenseID}
                        </Typography>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                          {lic.CompanyName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {lic.CustomerEmail || lic.Country}
                        </Typography>
                      </TableCell>

                      {/* Product */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {lic.ProductName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {lic.Edition || 'Standard'}
                        </Typography>
                      </TableCell>

                      {/* License Model */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.825rem', color: '#475569', fontWeight: 600 }}>
                          {lic.LicenseModel || lic.LicenseType}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={lic.Status} />
                      </TableCell>

                      {/* Activations: Activated vs Not Yet Activated */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: activated > 0 ? '#0284c7' : '#64748b',
                                fontSize: '0.85rem'
                              }}
                            >
                              {activated} Activated
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>/</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                              {allowed} Allowed
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.72rem',
                              color: isFull ? '#059669' : (notActivated > 0 ? '#d97706' : '#64748b')
                            }}
                          >
                            {isFull ? 'All activated (0 remaining)' : `${notActivated} not yet activated`}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Expiration */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.825rem' }}>
                          {lic.ExpiryDate ? new Date(lic.ExpiryDate).toLocaleDateString() : 'Permanent'}
                        </Typography>
                      </TableCell>

                      {/* Actions: Inspect, Deactivate, Revoke */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onSelectLicense(lic.LicenseID)}
                            sx={{ fontSize: '0.725rem', py: 0.3, px: 1, minWidth: 'auto' }}
                          >
                            Inspect
                          </Button>

                          {lic.Status === 'Active' && (
                            <>
                              <Tooltip title="Deactivate Key via QLM API">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleOpenAction('deactivate', lic.ActivationKey)}
                                  sx={{ border: '1px solid #fde68a', borderRadius: '6px', p: 0.5 }}
                                >
                                  <PowerOff size={14} />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Revoke Key via QLM API">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenAction('revoke', lic.ActivationKey)}
                                  sx={{ border: '1px solid #fecaca', borderRadius: '6px', p: 0.5 }}
                                >
                                  <ShieldAlert size={14} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No licenses found matching the selected filter criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={licenses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Card>

      {/* Confirmation Dialog for Table quick actions */}
      <ConfirmActionDialog
        open={dialogState.open}
        onClose={() => setDialogState({ open: false, actionType: 'deactivate', activationKey: '' })}
        onConfirm={handleConfirmAction}
        actionType={dialogState.actionType}
        activationKey={dialogState.activationKey}
        title={dialogState.actionType === 'revoke' ? 'Revoke QLM License Key' : 'Deactivate QLM License Key'}
        description={
          dialogState.actionType === 'revoke'
            ? 'This action contacts the QLM Soraco Web Service to revoke this key and updates the database.'
            : 'This action contacts the QLM Soraco Web Service to deactivate this key and frees up activations.'
        }
        loading={actionLoading}
      />

      {/* Excel Export Modal for Periodic Exports (7d, 15d, 30d, 6m, 1y) */}
      <ExportExcelModal
        open={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        licenses={licenses}
      />
    </Box>
  );
}
