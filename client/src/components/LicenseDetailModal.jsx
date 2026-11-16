import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Chip,
  Tooltip,
  Stack
} from '@mui/material';
import {
  X,
  Copy,
  Check,
  ShieldAlert,
  PowerOff,
  ChevronDown,
  Monitor,
  Calendar,
  Building2,
  Mail,
  User,
  MapPin,
  Package,
  Layers,
  FileCode,
  Clock,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import ConfirmActionDialog from './ConfirmActionDialog';
import { deactivateLicense, revokeLicense } from '../services/api';

export default function LicenseDetailModal({ open, onClose, license, onStatusChange }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, type: 'deactivate' });
  const [actionLoading, setActionLoading] = useState(false);

  if (!license) return null;

  const handleCopy = (text, type = 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2000);
    }
  };

  const handleExecuteAction = async (reason) => {
    setActionLoading(true);
    try {
      if (confirmState.type === 'deactivate') {
        const res = await deactivateLicense({ activationKey: license.ActivationKey, reason });
        if (res.success && onStatusChange) {
          onStatusChange(license.ActivationKey, 'Deactivated');
        }
      } else if (confirmState.type === 'revoke') {
        const res = await revokeLicense({ activationKey: license.ActivationKey, reason });
        if (res.success && onStatusChange) {
          onStatusChange(license.ActivationKey, 'Revoked');
        }
      }
      setConfirmState({ open: false, type: 'deactivate' });
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalActivationsAllowed = Math.max(1, Number(license.NumLicenses || license.SeatsTotal) || 1);
  const activatedCount = Math.max(0, Number(license.ActivatedCount ?? license.SeatsUsed) || 0);
  const notYetActivatedCount = Math.max(0, Number(license.NotActivatedCount ?? license.AvailableLicenses ?? (totalActivationsAllowed - activatedCount)));
  const activationPercent = Math.min(100, Math.round((activatedCount / totalActivationsAllowed) * 100));

  // Clean trailing spaces from fixed SQL char columns
  const cleanEdition = (license.Edition || '').trim();
  const cleanProductCode = (license.ProductCode || '').trim();

  // Expiration label logic
  const duration = license.SubscriptionDuration || license.DurationDays;
  const isPerpetual = (!license.ExpiryDate && (!duration || duration <= 0)) ||
    (license.ExpiryDate && (license.ExpiryDate.startsWith('1899') || license.ExpiryDate.startsWith('1900')));
  
  let formattedExpiry = 'Perpetual (No Expiration)';
  if (license.ExpiryDate && !isPerpetual) {
    formattedExpiry = new Date(license.ExpiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } else if (duration && duration > 0) {
    formattedExpiry = `${duration} Days on activation (Starts upon first install)`;
  }

  const formattedIssued = license.IssuedDate
    ? new Date(license.IssuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Unknown';

  const activationsList = license.activations || [];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.18)',
            border: '1px solid #eef2f6',
            overflow: 'hidden'
          }
        }}
      >
        {/* Sleek Dialog Header */}
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
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                flexShrink: 0
              }}
            >
              <KeyRound size={20} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
                  License Inspector
                </Typography>
                <StatusBadge status={license.Status} />
                <Chip
                  label={`ID: ${license.LicenseID}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    borderRadius: '6px'
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                Complete license entitlement & telemetry overview
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

        {/* Modal Main Content Area */}
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#f8fafc', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
          
          {/* 1. Hero Activation Key Card */}
          <Box
            sx={{
              p: 2.5,
              mb: 2.5,
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                  QLM Soraco Activation Key
                </Typography>
                <Chip
                  label={license.LicenseModel || license.LicenseType || 'Standard'}
                  size="small"
                  sx={{ height: 20, fontSize: '0.675rem', fontWeight: 700, backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '5px' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.725rem' }}>
                Click button to copy key to clipboard
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                p: { xs: 1.25, sm: 1.5 },
                gap: 1.5
              }}
            >
              <Typography
                variant="body1"
                className="font-mono"
                sx={{
                  fontWeight: 700,
                  color: '#0f172a',
                  fontSize: { xs: '0.9rem', sm: '1.05rem' },
                  letterSpacing: '0.04em',
                  wordBreak: 'break-all',
                  userSelect: 'all'
                }}
              >
                {license.ActivationKey}
              </Typography>

              <Button
                size="small"
                variant={copiedKey ? 'contained' : 'outlined'}
                color={copiedKey ? 'success' : 'primary'}
                onClick={() => handleCopy(license.ActivationKey, 'key')}
                startIcon={copiedKey ? <Check size={14} /> : <Copy size={14} />}
                sx={{
                  flexShrink: 0,
                  minWidth: 105,
                  height: 34,
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  borderRadius: '7px'
                }}
              >
                {copiedKey ? 'Copied!' : 'Copy Key'}
              </Button>
            </Box>
          </Box>

          {/* 2. Structured 2-Column Info Grid */}
          <Grid container spacing={2.5} sx={{ mb: 2.5, width: '100%' }}>
            {/* Left Card: Customer & Account */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2.2,
                  height: '100%',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#64748b',
                    mb: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Building2 size={16} color="#2563eb" /> Customer & Account
                </Typography>

                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  {/* Company */}
                  <Box sx={{ p: 1.25, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>
                      Company / Organization
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                      {license.CompanyName || 'Independent Licensee'}
                    </Typography>
                  </Box>

                  {/* Contact & Email */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box sx={{ p: 1.25, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <User size={12} /> Contact Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.825rem' }}>
                        {license.ContactName || '—'}
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1.25, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MapPin size={12} /> Location
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.825rem' }}>
                        {license.Country || 'Unspecified'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Email */}
                  <Box sx={{ p: 1.25, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Mail size={12} /> Registered Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb', fontSize: '0.825rem', wordBreak: 'break-all' }}>
                      {license.CustomerEmail || 'No email registered'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* Right Card: Product & Entitlement */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2.2,
                  height: '100%',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#64748b',
                    mb: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Package size={16} color="#7c3aed" /> Product & Entitlements
                </Typography>

                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  {/* Product Name */}
                  <Box sx={{ p: 1.25, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>
                      Product Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                      {license.ProductName || 'QLM Protected Software'}
                    </Typography>
                  </Box>

                  {/* Current Version */}
                  <Box sx={{ p: 1.25, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>
                      Current Version
                    </Typography>
                    <Typography variant="body2" className="font-mono" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.825rem' }}>
                      {cleanProductCode ? (cleanProductCode.startsWith('v') ? cleanProductCode : `v${cleanProductCode}`) : 'v1.0.0'}
                    </Typography>
                  </Box>

                  {/* Lifecycle Dates */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box sx={{ p: 1.25, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Clock size={12} /> Issued Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                        {formattedIssued}
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1.25, backgroundColor: isPerpetual ? '#f8fafc' : '#fffbeb', borderRadius: '8px', border: isPerpetual ? '1px solid #f1f5f9' : '1px solid #fde68a' }}>
                      <Typography variant="caption" sx={{ color: isPerpetual ? '#94a3b8' : '#b45309', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={12} /> Expiry Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: isPerpetual ? '#059669' : '#b45309', fontSize: '0.8rem' }}>
                        {formattedExpiry}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {/* 3. Soraco QLM License Activation Status Card */}
          <Box
            sx={{
              p: 2.2,
              mb: 2.5,
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Layers size={17} color="#2563eb" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
                  License Activation Status (Soraco QLM)
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CheckCircle2 size={13} color="#0284c7" />}
                  label={`${activatedCount} of ${totalActivationsAllowed} Activated`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    backgroundColor: '#eff6ff',
                    color: '#0284c7',
                    borderRadius: '6px'
                  }}
                />
                <Chip
                  icon={<Clock size={13} color="#d97706" />}
                  label={`${notYetActivatedCount} Not Yet Activated`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    backgroundColor: notYetActivatedCount > 0 ? '#fffbeb' : '#ecfdf5',
                    color: notYetActivatedCount > 0 ? '#b45309' : '#059669',
                    borderRadius: '6px'
                  }}
                />
                <Chip
                  label={`${totalActivationsAllowed} Total Allowed (NumLicenses)`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    borderRadius: '6px'
                  }}
                />
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={activationPercent}
              sx={{
                height: 9,
                borderRadius: 5,
                backgroundColor: '#f1f5f9',
                mb: 1,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: activationPercent >= 100
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)'
                }
              }}
            />
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>
              {activatedCount} active machine(s) registered in Soraco QLM ActivationLog table · {notYetActivatedCount} activation(s) remaining to be activated for this generated license key.
            </Typography>
          </Box>

          {/* 4. Machine Activations Table Card */}
          <Box
            sx={{
              p: 2.2,
              mb: 2.5,
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Monitor size={17} color="#059669" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
                  Client Machine Activations
                </Typography>
              </Box>
              <Chip
                label={`${activationsList.length} Bound Machines`}
                size="small"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '6px' }}
              />
            </Box>

            {activationsList.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 680 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafbfc' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.725rem', color: '#64748b' }}>Machine Hostname</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.725rem', color: '#64748b' }}>Machine ID / GUID</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.725rem', color: '#64748b' }}>Operating System</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.725rem', color: '#64748b' }}>IP Address</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.725rem', color: '#64748b', whiteSpace: 'nowrap' }}>Activated On</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activationsList.map((act) => (
                      <TableRow key={act.ActivationID} hover>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a', whiteSpace: 'nowrap' }}>
                          {act.MachineName || 'Client Workstation'}
                        </TableCell>
                        <TableCell className="font-mono" sx={{ fontSize: '0.725rem', color: '#475569', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Tooltip title={act.MachineID} placement="top">
                            <span>{act.MachineID}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap' }}>
                          {act.OSVersion || 'Windows'}
                        </TableCell>
                        <TableCell className="font-mono" sx={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {act.IPAddress || '—'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.775rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {act.ActivatedAt ? new Date(act.ActivatedAt).toLocaleString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px'
                }}
              >
                <Monitor size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, mb: 0.3 }}>
                  No client machines bound yet
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                  This activation key is provisioned and ready for client activation via Soraco QLM SDK.
                </Typography>
              </Box>
            )}
          </Box>

          {/* 5. Raw XML Envelope Accordion (If available) */}
          {license.QlmResponseXml && (
            <Accordion
              variant="outlined"
              sx={{
                borderRadius: '12px !important',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: 'none',
                overflow: 'hidden',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ChevronDown size={16} />} sx={{ px: 2, minHeight: '44px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileCode size={15} color="#64748b" />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Raw QLM Soraco Web Service XML Envelope
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ backgroundColor: '#0f172a', p: 2, position: 'relative' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleCopy(license.QlmResponseXml, 'xml')}
                  startIcon={copiedXml ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    color: '#94a3b8',
                    borderColor: '#334155',
                    fontSize: '0.7rem',
                    py: 0.2,
                    px: 1,
                    '&:hover': { borderColor: '#64748b', backgroundColor: 'rgba(255,255,255,0.05)' }
                  }}
                >
                  {copiedXml ? 'Copied' : 'Copy XML'}
                </Button>
                <pre
                  style={{
                    margin: 0,
                    color: '#38bdf8',
                    fontSize: '0.725rem',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    maxHeight: 180
                  }}
                >
                  {license.QlmResponseXml}
                </pre>
              </AccordionDetails>
            </Accordion>
          )}
        </DialogContent>

        {/* Consistent Dialog Actions Footer */}
        <DialogActions
          sx={{
            py: 1.8,
            px: 3,
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.2 }}>
            {license.Status === 'Active' && (
              <>
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={<PowerOff size={14} />}
                  onClick={() => setConfirmState({ open: true, type: 'deactivate' })}
                  sx={{ fontWeight: 700, borderRadius: '8px', fontSize: '0.8rem' }}
                >
                  Deactivate Key
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<ShieldAlert size={14} />}
                  onClick={() => setConfirmState({ open: true, type: 'revoke' })}
                  sx={{ fontWeight: 700, borderRadius: '8px', fontSize: '0.8rem' }}
                >
                  Revoke Key
                </Button>
              </>
            )}
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={onClose}
            sx={{
              fontWeight: 700,
              borderRadius: '8px',
              fontSize: '0.825rem',
              px: 2.8,
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
          >
            Close Inspector
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmState.open}
        onClose={() => setConfirmState({ open: false, type: 'deactivate' })}
        onConfirm={handleExecuteAction}
        actionType={confirmState.type}
        activationKey={license.ActivationKey}
        title={confirmState.type === 'revoke' ? 'Revoke QLM License Key' : 'Deactivate QLM License Key'}
        description={
          confirmState.type === 'revoke'
            ? 'This action sends a RevokeLicense request to the QLM Soraco Web Service and flags the license as Revoked.'
            : 'This action sends a ReleaseLicense request to the QLM Soraco Web Service and marks the license as Deactivated.'
        }
        loading={actionLoading}
      />
    </>
  );
}
