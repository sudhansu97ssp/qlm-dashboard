import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  KeyRound,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function AnalyticsView({ analytics, onNavigateToLicenses, onSelectLicense }) {
  if (!analytics) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: '#64748b' }}>Loading analytics telemetry...</Typography>
      </Box>
    );
  }

  const { kpis, statusBreakdown, productDistribution, monthlyTrend, expiringSoonList } = analytics;

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* 1. Top KPI Row */}
      <Grid container spacing={2.5} sx={{ mb: 3, width: '100%' }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Licenses"
            value={kpis.activeLicenses}
            subtitle={`${kpis.totalLicenses} total keys issued`}
            trend="+12% this month"
            trendPositive={true}
            icon={KeyRound}
            accentColor="#2563eb"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Customers"
            value={kpis.totalCustomers}
            subtitle="Registered customer accounts"
            trend="+3 new"
            trendPositive={true}
            icon={Users}
            accentColor="#059669"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Expiring In 30 Days"
            value={kpis.expiringIn30Days}
            subtitle="Action required for renewal"
            trend={kpis.expiringIn30Days > 0 ? "Urgent attention" : "No expirations"}
            trendPositive={kpis.expiringIn30Days === 0}
            icon={AlertTriangle}
            accentColor="#d97706"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="License Activation Rate"
            value={kpis.activationRate || '0%'}
            subtitle={`${kpis.totalActivated ?? kpis.totalSeatsUtilized ?? 0} Activated · ${kpis.totalNotYetActivated ?? (Math.max(0, (kpis.totalActivationsAllowed || kpis.totalSeatsProvisioned || 0) - (kpis.totalActivated || kpis.totalSeatsUtilized || 0)))} Not Yet Activated`}
            trend="Active telemetry"
            trendPositive={true}
            icon={TrendingUp}
            accentColor="#7c3aed"
          />
        </Grid>
      </Grid>

      {/* 2. Charts Row: Trend & Status Distribution */}
      <Grid container spacing={2.5} sx={{ mb: 3, width: '100%' }}>
        {/* Monthly Trend Area Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%', p: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                    License Issuance & Machine Activations
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Monthly telemetry synced from QLM Soraco Web Service
                  </Typography>
                </Box>
                <Chip label="6-Month Horizon" size="small" sx={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }} />
              </Box>

              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActivations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorKeys" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.8rem'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.8rem' }} />
                    <Area
                      type="monotone"
                      dataKey="activations"
                      name="Machine Activations"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorActivations)"
                    />
                    <Area
                      type="monotone"
                      dataKey="newKeys"
                      name="New QLM Keys Issued"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorKeys)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* License Status Donut Chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%', p: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', mb: 0.5 }}>
                License Status Breakdown
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                Current state of all provisioned license records
              </Typography>

              <Box sx={{ width: '100%', height: 210, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.8rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* Status legend list */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                {statusBreakdown.map((item) => (
                  <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                      {item.name}: <strong>{item.value}</strong>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Products Distribution & Expiring Soon Queue */}
      <Grid container spacing={2.5} sx={{ width: '100%' }}>
        {/* Product Distribution Bar Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', p: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', mb: 0.5 }}>
                Product Portfolio Distribution
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                Active vs total licenses across catalog
              </Typography>

              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="code"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.8rem'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Bar dataKey="totalLicenses" name="Total Issued" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="activeLicenses" name="Active Now" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Expiring Soon Action List */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', p: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                    Renewal Attention Queue
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Licenses nearing expiration within 30 days
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={onNavigateToLicenses}
                  endIcon={<ArrowRight size={14} />}
                  sx={{ fontSize: '0.8rem' }}
                >
                  View All
                </Button>
              </Box>

              {expiringSoonList && expiringSoonList.length > 0 ? (
                <TableContainer component={Box} sx={{ mt: 1, overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 440 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>Customer</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>Product</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>Expires</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expiringSoonList.map((item) => (
                        <TableRow key={item.licenseId} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{item.companyName}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{item.productName}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${item.daysLeft} days left`}
                              size="small"
                              sx={{
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => onSelectLicense(item.licenseId)}
                              sx={{ fontSize: '0.725rem', py: 0.2, px: 1, minWidth: 'auto' }}
                            >
                              Inspect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600, mb: 0.5 }}>
                    ✓ All active licenses have healthy validity periods.
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    No licenses expiring in the next 30 days.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
