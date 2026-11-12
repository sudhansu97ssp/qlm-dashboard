import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  Server,
  Activity,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { login } from '../services/api';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(email.trim(), password);
      if (res.success && res.token) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Unable to connect to authorization service.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        backgroundColor: '#f8fafc',
        overflow: 'hidden'
      }}
    >
      {/* ========================================================= */}
      {/* SECTION 1: AUTH FORM (Left Side)                         */}
      {/* ========================================================= */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%', lg: '44%' },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6, md: 6, lg: 8 },
          backgroundColor: '#ffffff',
          borderRight: { md: '1px solid #e2e8f0' },
          overflowY: 'auto'
        }}
      >
        <Box sx={{ maxWidth: 440, width: '100%' }}>
          {/* Brand Logo & Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                color: '#ffffff'
              }}
            >
              <KeyRound size={22} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  fontSize: '1.15rem'
                }}
              >
                QLM Portal
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                License Management Dashboard
              </Typography>
            </Box>
          </Box>

          {/* Header Title */}
          <Box sx={{ mb: 3.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                fontSize: { xs: '1.65rem', sm: '1.9rem' },
                mb: 1
              }}
            >
              Welcome back
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}
            >
              Sign in with your administrative account to access license telemetry and controls.
            </Typography>
          </Box>

          {/* Error Message */}
          {error && (
            <Fade in={Boolean(error)}>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  borderRadius: 2,
                  fontSize: '0.875rem'
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Email Field */}
              <Box>
                <Typography
                  component="label"
                  htmlFor="login-email"
                  sx={{
                    display: 'block',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: '#334155',
                    mb: 0.8
                  }}
                >
                  Email Address
                </Typography>
                <TextField
                  id="login-email"
                  type="email"
                  fullWidth
                  placeholder="admin@ncircletech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={18} color="#94a3b8" />
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      color: '#0f172a',
                      fontSize: '0.925rem',
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#94a3b8' },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                        '& fieldset': {
                          borderColor: '#2563eb',
                          borderWidth: '2px'
                        }
                      }
                    }
                  }}
                />
              </Box>

              {/* Password Field with Hide / Unhide Toggle */}
              <Box>
                <Typography
                  component="label"
                  htmlFor="login-password"
                  sx={{
                    display: 'block',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: '#334155',
                    mb: 0.8
                  }}
                >
                  Password
                </Typography>
                <TextField
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={18} color="#94a3b8" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            edge="end"
                            size="small"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            sx={{
                              color: showPassword ? '#2563eb' : '#64748b',
                              backgroundColor: showPassword ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                              borderRadius: '6px',
                              p: 0.6,
                              mr: 0.5,
                              '&:hover': {
                                color: '#0f172a',
                                backgroundColor: 'rgba(0, 0, 0, 0.06)'
                              }
                            }}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      color: '#0f172a',
                      fontSize: '0.925rem',
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#94a3b8' },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                        '& fieldset': {
                          borderColor: '#2563eb',
                          borderWidth: '2px'
                        }
                      }
                    }
                  }}
                />
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.4,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: '#ffffff' }} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={18} />
                  </Box>
                )}
              </Button>
            </Box>
          </form>

          {/* Secure footer note */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mt: 5,
              pt: 3,
              borderTop: '1px solid #f1f5f9',
              color: '#64748b',
              fontSize: '0.78rem'
            }}
          >
            <Server size={14} color="#64748b" />
            <span>Authenticated AWS EC2 MS SQL & Soraco QLM API</span>
          </Box>
        </Box>
      </Box>

      {/* ========================================================= */}
      {/* SECTION 2: HERO BANNER (Right Side)                       */}
      {/* ========================================================= */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 45%, #0284c7 100%)',
          position: 'relative',
          overflow: 'hidden',
          p: { md: 6, lg: 8 },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#ffffff'
        }}
      >
        {/* Decorative background ambient glows */}
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-15%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none'
          }}
        />

        {/* Hero Middle Content */}
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 580, width: '100%' }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { md: '2.3rem', lg: '2.8rem' },
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              mb: 2.5,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
            }}
          >
            Real-Time License Telemetry & Controls
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.88)',
              mb: 4.5
            }}
          >
            Unified dashboard for Soraco QLM engine. Monitor license activations and availability, manage customer entitlements, inspect activation audit logs, and export periodic compliance reports.
          </Typography>

          {/* Feature Highlights Grid */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: 2,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Activity size={20} color="#38bdf8" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.925rem', color: '#ffffff' }}>
                  Live AWS EC2 SQL Sync
                </Typography>
                <Typography sx={{ fontSize: '0.825rem', color: 'rgba(255, 255, 255, 0.75)', mt: 0.3 }}>
                  Direct low-latency pooling to Microsoft SQL Server on EC2 with native Soraco table support.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: 2,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <KeyRound size={20} color="#38bdf8" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.925rem', color: '#ffffff' }}>
                  Lifecycle & Entitlement Engine
                </Typography>
                <Typography sx={{ fontSize: '0.825rem', color: 'rgba(255, 255, 255, 0.75)', mt: 0.3 }}>
                  Generate and manage permanent, trial, and subscription keys with machine-binding release.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: 2,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <FileSpreadsheet size={20} color="#38bdf8" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.925rem', color: '#ffffff' }}>
                  Periodic Excel Exporting
                </Typography>
                <Typography sx={{ fontSize: '0.825rem', color: 'rgba(255, 255, 255, 0.75)', mt: 0.3 }}>
                  Export filtered license metrics across 7d, 15d, 30d, 6 months, and 1 year cycles.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
