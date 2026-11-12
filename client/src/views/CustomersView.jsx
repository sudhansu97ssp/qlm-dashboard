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
  TablePagination
} from '@mui/material';
import {
  Search,
  Plus,
  KeyRound,
  Mail,
  MapPin,
  RotateCcw
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const tierColors = {
  Strategic: { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
  Enterprise: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Standard: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
};

export default function CustomersView({
  customers = [],
  onFilterChange,
  filters,
  onResetFilters,
  onGenerateLicenseForCustomer,
  onViewCustomerLicenses
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const countries = ['All', ...new Set(customers.map(c => c.Country))].filter(Boolean);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const displayedCustomers = customers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header & Filter Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: '20px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
                Customer Directory
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Manage customer accounts, organizations, and linked license keys
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={`${customers.length} Customers`} size="small" sx={{ fontWeight: 600, backgroundColor: '#eff6ff', color: '#2563eb' }} />
            </Box>
          </Box>

          {/* Filter Bar */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1.2fr 1.2fr 1.2fr auto' }, gap: 1.5 }}>
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search by company, contact, or email..."
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

            {/* Country Filter */}
            <TextField
              select
              size="small"
              label="Country"
              value={filters.country || 'All'}
              onChange={(e) => onFilterChange('country', e.target.value === 'All' ? '' : e.target.value)}
            >
              {countries.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>

            {/* Tier Filter */}
            <TextField
              select
              size="small"
              label="Tier"
              value={filters.tier || 'All'}
              onChange={(e) => onFilterChange('tier', e.target.value === 'All' ? '' : e.target.value)}
            >
              <MenuItem value="All">All Tiers</MenuItem>
              <MenuItem value="Strategic">Strategic</MenuItem>
              <MenuItem value="Enterprise">Enterprise</MenuItem>
              <MenuItem value="Standard">Standard</MenuItem>
            </TextField>

            {/* Status Filter */}
            <TextField
              select
              size="small"
              label="Status"
              value={filters.status || 'All'}
              onChange={(e) => onFilterChange('status', e.target.value === 'All' ? '' : e.target.value)}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>

            {/* Reset Filter Button */}
            <Tooltip title="Reset all filters">
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

      {/* Customers Data Table */}
      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Company & Contact</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Customer ID</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Location</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Tier</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Licenses (Active/Total)</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedCustomers.length > 0 ? (
                displayedCustomers.map((c) => {
                  const tierStyle = tierColors[c.CustomerTier] || tierColors.Standard;
                  return (
                    <TableRow key={c.CustomerID} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                          {c.CompanyName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            <Mail size={12} /> {c.Email}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>•</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {c.ContactName}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" className="font-mono" sx={{ fontWeight: 600, color: '#475569' }}>
                          {c.CustomerID}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPin size={13} color="#94a3b8" />
                          <Typography variant="body2" sx={{ fontSize: '0.825rem', color: '#475569' }}>
                            {c.City ? `${c.City}, ${c.Country}` : c.Country}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={c.CustomerTier}
                          size="small"
                          sx={{
                            backgroundColor: tierStyle.bg,
                            color: tierStyle.color,
                            border: `1px solid ${tierStyle.border}`,
                            fontWeight: 600,
                            borderRadius: '4px',
                            height: 22,
                            fontSize: '0.725rem'
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={c.Status} />
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`${c.ActiveLicenses || 0} / ${c.TotalLicenses || 0}`}
                            size="small"
                            onClick={() => onViewCustomerLicenses(c.CustomerID)}
                            sx={{
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              backgroundColor: (c.ActiveLicenses || 0) > 0 ? '#ecfdf5' : '#f1f5f9',
                              color: (c.ActiveLicenses || 0) > 0 ? '#059669' : '#64748b',
                              '&:hover': {
                                backgroundColor: '#dcfce7'
                              }
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<KeyRound size={13} />}
                            onClick={() => onGenerateLicenseForCustomer(c)}
                            sx={{ fontSize: '0.75rem', py: 0.4, px: 1.2 }}
                          >
                            Issue Key
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No customers found matching the selected filter criteria.
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
          count={customers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Card>
    </Box>
  );
}
