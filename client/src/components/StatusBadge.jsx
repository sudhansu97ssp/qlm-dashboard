import React from 'react';
import { Chip } from '@mui/material';

const statusStyles = {
  Active: {
    bg: '#ecfdf5',
    color: '#059669',
    border: '#a7f3d0'
  },
  Expired: {
    bg: '#fef2f2',
    color: '#dc2626',
    border: '#fecaca'
  },
  Revoked: {
    bg: '#f3f4f6',
    color: '#4b5563',
    border: '#e5e7eb'
  },
  Deactivated: {
    bg: '#fffbeb',
    color: '#d97706',
    border: '#fde68a'
  },
  Trial: {
    bg: '#eff6ff',
    color: '#2563eb',
    border: '#bfdbfe'
  },
  Suspended: {
    bg: '#faf5ff',
    color: '#7e22ce',
    border: '#e9d5ff'
  }
};

export default function StatusBadge({ status = 'Active', size = 'small' }) {
  const current = statusStyles[status] || statusStyles.Active;

  return (
    <Chip
      label={status}
      size={size}
      sx={{
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.725rem' : '0.8rem',
        height: size === 'small' ? 22 : 26,
        letterSpacing: '0.02em',
        borderRadius: '6px'
      }}
    />
  );
}
