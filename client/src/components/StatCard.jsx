import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  accentColor = '#2563eb'
}) {
  return (
    <Card
      className="sexy-card"
      sx={{
        height: '100%',
        p: 0,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top subtle micro accent bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}66 100%)`
        }}
      />
      <CardContent sx={{ p: '22px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontSize: '0.725rem'
            }}
          >
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`,
                color: accentColor,
                border: `1px solid ${accentColor}25`
              }}
            >
              <Icon size={20} />
            </Box>
          )}
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#0f172a',
            mb: 0.75,
            letterSpacing: '-0.03em',
            fontSize: '1.85rem',
            lineHeight: 1.1
          }}
        >
          {value}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {trend && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: trendPositive ? '#059669' : '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                px: 1,
                py: 0.3,
                borderRadius: '6px',
                backgroundColor: trendPositive ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${trendPositive ? '#a7f3d0' : '#fecaca'}`,
                fontSize: '0.725rem'
              }}
            >
              {trend}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
