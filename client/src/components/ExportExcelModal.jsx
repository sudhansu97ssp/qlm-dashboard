import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  IconButton,
  Alert,
  Tooltip,
  Stack
} from '@mui/material';
import {
  X,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  Clock,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Period Options
const PERIOD_OPTIONS = [
  { id: '7d', label: '7 Days', days: 7, desc: 'Last 7 Days' },
  { id: '15d', label: '15 Days', days: 15, desc: 'Last 15 Days' },
  { id: '30d', label: '30 Days', days: 30, desc: 'Last 30 Days' },
  { id: '6m', label: '6 Months', days: 180, desc: 'Last 6 Months (~180 Days)' },
  { id: '1y', label: '1 Year', days: 365, desc: 'Last 1 Year (365 Days)' },
  { id: 'all', label: 'All Time', days: null, desc: 'Complete Historical Archive' }
];

// License Type Filter Options
const TYPE_OPTIONS = [
  { id: 'both', label: 'Trial & Subscription', types: ['Trial', 'Subscription'] },
  { id: 'Trial', label: 'Trial Only', types: ['Trial'] },
  { id: 'Subscription', label: 'Subscription Only', types: ['Subscription'] },
  { id: 'all', label: 'All License Types', types: null }
];

export default function ExportExcelModal({ open, onClose, licenses = [] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedType, setSelectedType] = useState('both');
  const [dateField, setDateField] = useState('IssuedDate'); // 'IssuedDate' or 'ExpiryDate'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Active', 'Expired'
  const [exporting, setExporting] = useState(false);

  // Compute Date Boundaries based on Period
  const dateRange = useMemo(() => {
    const now = new Date();
    const periodObj = PERIOD_OPTIONS.find(p => p.id === selectedPeriod) || PERIOD_OPTIONS[2];
    
    if (periodObj.days === null) {
      return { start: null, end: now, label: 'All Recorded History' };
    }

    const start = new Date(now.getTime() - periodObj.days * 24 * 60 * 60 * 1000);
    return {
      start,
      end: now,
      label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    };
  }, [selectedPeriod]);

  // Filter Matching Licenses
  const filteredLicenses = useMemo(() => {
    const typeConfig = TYPE_OPTIONS.find(t => t.id === selectedType);

    return licenses.filter(lic => {
      // 1. License Type filter
      if (typeConfig && typeConfig.types) {
        if (!typeConfig.types.includes(lic.LicenseType)) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all') {
        if (lic.Status !== statusFilter) return false;
      }

      // 3. Date range filter
      if (dateRange.start) {
        const rawDate = dateField === 'IssuedDate' ? lic.IssuedDate : lic.ExpiryDate;
        if (!rawDate) return false;
        const targetDate = new Date(rawDate);
        if (isNaN(targetDate.getTime())) return false;
        if (targetDate < dateRange.start || targetDate > dateRange.end) return false;
      }

      return true;
    });
  }, [licenses, selectedType, statusFilter, dateRange, dateField]);

  // Metrics on filtered dataset
  const metrics = useMemo(() => {
    const total = filteredLicenses.length;
    const trials = filteredLicenses.filter(l => (l.LicenseModel || l.LicenseType) === 'Trial').length;
    const subscriptions = filteredLicenses.filter(l => (l.LicenseModel || l.LicenseType) === 'Subscription').length;
    const active = filteredLicenses.filter(l => l.Status === 'Active').length;
    const expired = filteredLicenses.filter(l => l.Status === 'Expired').length;
    const totalActivationsAllowed = filteredLicenses.reduce((acc, l) => acc + (l.NumLicenses || l.SeatsTotal || 1), 0);
    const totalActivated = filteredLicenses.reduce((acc, l) => acc + (l.ActivatedCount ?? (l.SeatsUsed || 0)), 0);
    const totalNotYetActivated = Math.max(0, totalActivationsAllowed - totalActivated);

    return { total, trials, subscriptions, active, expired, totalActivationsAllowed, totalActivated, totalNotYetActivated };
  }, [filteredLicenses]);

  // Trigger Excel Generation and Download
  const handleExportExcel = () => {
    setExporting(true);
    try {
      // 1. Prepare Primary Licenses Sheet using Soraco QLM Schema conventions
      const sheetData = filteredLicenses.map(lic => {
        const isPerpetual = !lic.ExpiryDate || lic.ExpiryDate.startsWith('1899') || lic.ExpiryDate.startsWith('1900');
        const formattedExpiry = isPerpetual
          ? 'Perpetual'
          : new Date(lic.ExpiryDate).toLocaleDateString('en-US');
        
        const formattedIssued = lic.IssuedDate
          ? new Date(lic.IssuedDate).toLocaleDateString('en-US')
          : 'N/A';

        const allowed = lic.NumLicenses || lic.SeatsTotal || 1;
        const activated = lic.ActivatedCount ?? (lic.SeatsUsed || 0);
        const notActivated = lic.NotActivatedCount ?? (lic.AvailableLicenses ?? Math.max(0, allowed - activated));
        const isFull = activated >= allowed;

        return {
          'License ID': lic.LicenseID,
          'Activation Key': lic.ActivationKey,
          'Customer Name': lic.ContactName || lic.CustomerName || '—',
          'Company': lic.CompanyName || '—',
          'Customer Email': lic.CustomerEmail || lic.Email || '—',
          'Phone Number': lic.Phone || lic.PhoneNumber || '—',
          'Location': lic.Location || lic.Country || 'Global',
          'Product Name': lic.ProductName || 'QLM Product',
          'Edition': (lic.Edition || 'Standard').trim(),
          'Version': (lic.ProductCode || '1.0').trim(),
          'License Model': lic.LicenseModel || lic.LicenseType,
          'Status': lic.Status,
          'Allowed Activations (NumLicenses)': allowed,
          'Activated Licenses': activated,
          'Not Yet Activated (AvailableLicenses)': notActivated,
          'Activation State': isFull ? 'Fully Activated' : (activated === 0 ? 'Not Yet Activated' : 'Partially Activated'),
          'Issued Date': formattedIssued,
          'Expiry Date': formattedExpiry,
          'Notes': lic.Notes || ''
        };
      });

      // 2. Build XLSX Workbook (Clean single-sheet data export)
      const workbook = XLSX.utils.book_new();

      const wsLicenses = XLSX.utils.json_to_sheet(sheetData.length > 0 ? sheetData : [{ Status: 'No matching records for selected filter criteria' }]);

      // Auto-fit column widths for cleaner readability in Excel
      wsLicenses['!cols'] = [
        { wch: 12 }, // License ID
        { wch: 34 }, // Activation Key
        { wch: 24 }, // Customer Name
        { wch: 28 }, // Company
        { wch: 28 }, // Customer Email
        { wch: 18 }, // Phone Number
        { wch: 18 }, // Location
        { wch: 32 }, // Product Name
        { wch: 14 }, // Edition
        { wch: 10 }, // Version
        { wch: 16 }, // License Model
        { wch: 12 }, // Status
        { wch: 16 }, // Allowed Activations (NumLicenses)
        { wch: 16 }, // Activated Licenses
        { wch: 20 }, // Not Yet Activated (AvailableLicenses)
        { wch: 18 }, // Activation State
        { wch: 14 }, // Issued Date
        { wch: 14 }, // Expiry Date
        { wch: 30 }  // Notes
      ];

      // Append single data worksheet
      XLSX.utils.book_append_sheet(workbook, wsLicenses, 'LicenseKeys');

      // 4. File Naming Convention
      const timestamp = new Date().toISOString().split('T')[0];
      const typeSlug = selectedType === 'both' ? 'Trial_Subscription' : selectedType;
      const fileName = `QLM_Licenses_${selectedPeriod}_${typeSlug}_${timestamp}.xlsx`;

      // Trigger Browser Save
      XLSX.writeFile(workbook, fileName);

      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to export excel:', err);
      alert('Error exporting Excel file: ' + err.message);
      setExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.18)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          py: 2.2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              flexShrink: 0
            }}
          >
            <FileSpreadsheet size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
              Export Licenses to Excel (.xlsx)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.725rem' }}>
              Periodic export for Trial & Subscription licenses
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' }
          }}
        >
          <X size={16} />
        </IconButton>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, backgroundColor: '#f8fafc' }}>
        
        {/* 1. Period Selector (7d, 15d, 30d, 6m, 1y, All) */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Calendar size={15} color="#059669" /> Select Time Period
            </Typography>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, fontSize: '0.725rem' }}>
              {dateRange.label}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' }, gap: 1 }}>
            {PERIOD_OPTIONS.map((opt) => {
              const isSelected = selectedPeriod === opt.id;
              return (
                <Box
                  key={opt.id}
                  onClick={() => setSelectedPeriod(opt.id)}
                  sx={{
                    p: 1.2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                    color: isSelected ? '#059669' : '#475569',
                    boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      borderColor: '#059669',
                      backgroundColor: isSelected ? '#ecfdf5' : '#f8fafc'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                    {opt.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', display: 'block', color: isSelected ? '#047857' : '#94a3b8' }}>
                    {opt.days ? `${opt.days}d` : 'Full'}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* 2. License Type Selection (Trial & Subscription) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', mb: 1.2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Layers size={15} color="#2563eb" /> License Type Target
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
            {TYPE_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.id;
              return (
                <Box
                  key={opt.id}
                  onClick={() => setSelectedType(opt.id)}
                  sx={{
                    p: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    cursor: 'pointer',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    color: isSelected ? '#1d4ed8' : '#334155',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      borderColor: '#2563eb'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: isSelected ? '5px solid #2563eb' : '2px solid #cbd5e1',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.825rem' }}>
                      {opt.label}
                    </Typography>
                    {opt.id === 'both' && (
                      <Typography variant="caption" sx={{ color: '#2563eb', fontSize: '0.675rem', fontWeight: 600 }}>
                        Recommended (Standard periodic audit)
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* 3. Additional Filter Basis: Date criteria & Status */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          {/* Date Basis */}
          <Box sx={{ p: 1.5, backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#64748b', fontSize: '0.675rem', display: 'block', mb: 1 }}>
              Filter Date By
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label="Issued / Order Date"
                clickable
                size="small"
                onClick={() => setDateField('IssuedDate')}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.725rem',
                  backgroundColor: dateField === 'IssuedDate' ? '#2563eb' : '#f1f5f9',
                  color: dateField === 'IssuedDate' ? '#ffffff' : '#475569'
                }}
              />
              <Chip
                label="Expiry Date"
                clickable
                size="small"
                onClick={() => setDateField('ExpiryDate')}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.725rem',
                  backgroundColor: dateField === 'ExpiryDate' ? '#2563eb' : '#f1f5f9',
                  color: dateField === 'ExpiryDate' ? '#ffffff' : '#475569'
                }}
              />
            </Stack>
          </Box>

          {/* Status Filter */}
          <Box sx={{ p: 1.5, backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#64748b', fontSize: '0.675rem', display: 'block', mb: 1 }}>
              License Status
            </Typography>
            <Stack direction="row" spacing={1}>
              {['all', 'Active', 'Expired'].map((st) => (
                <Chip
                  key={st}
                  label={st === 'all' ? 'All' : st}
                  clickable
                  size="small"
                  onClick={() => setStatusFilter(st)}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.725rem',
                    backgroundColor: statusFilter === st ? '#059669' : '#f1f5f9',
                    color: statusFilter === st ? '#ffffff' : '#475569'
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        {/* 4. Live Matching Preview Box */}
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            backgroundColor: metrics.total > 0 ? '#ecfdf5' : '#fffbeb',
            border: metrics.total > 0 ? '1px solid #a7f3d0' : '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle2 size={18} color={metrics.total > 0 ? '#059669' : '#d97706'} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: metrics.total > 0 ? '#065f46' : '#92400e', fontSize: '0.9rem' }}>
                {metrics.total} Matching Licenses Found
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: metrics.total > 0 ? '#047857' : '#b45309', display: 'block', mt: 0.3, fontSize: '0.75rem' }}>
              Includes <strong>{metrics.trials} Trials</strong>, <strong>{metrics.subscriptions} Subscriptions</strong> ({metrics.active} Active, {metrics.expired} Expired)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${metrics.totalActivated} Activated`}
              size="small"
              sx={{
                fontWeight: 700,
                backgroundColor: metrics.total > 0 ? '#eff6ff' : '#fef3c7',
                color: metrics.total > 0 ? '#0284c7' : '#b45309',
                fontSize: '0.75rem'
              }}
            />
            <Chip
              label={`${metrics.totalNotYetActivated} Not Yet Activated`}
              size="small"
              sx={{
                fontWeight: 700,
                backgroundColor: metrics.total > 0 ? '#fffbeb' : '#fef3c7',
                color: metrics.total > 0 ? '#b45309' : '#b45309',
                fontSize: '0.75rem'
              }}
            />
            <Chip
              label={`${metrics.totalActivationsAllowed} Allowed`}
              size="small"
              sx={{
                fontWeight: 600,
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '0.75rem',
                border: '1px solid #e2e8f0'
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions
        sx={{
          py: 2,
          px: 3,
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#ffffff',
          justifyContent: 'space-between'
        }}
      >
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600, fontSize: '0.825rem' }}>
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={exporting || metrics.total === 0}
          onClick={handleExportExcel}
          startIcon={<Download size={16} />}
          sx={{
            fontWeight: 700,
            fontSize: '0.825rem',
            borderRadius: '9px',
            px: 2.8,
            py: 1,
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28)',
            '&:hover': {
              background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.38)'
            }
          }}
        >
          {exporting ? 'Generating Excel...' : `Export ${metrics.total} Licenses to Excel`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
