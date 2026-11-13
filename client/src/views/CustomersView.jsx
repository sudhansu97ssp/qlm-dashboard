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
  RotateCcw,
  Phone,
  User,
  Building2
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

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
              placeholder="Search by name, company, email, phone, location..."
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

            {/* License Model Filter */}
            <TextField
              select
              size="small"
              label="License Model"
              value={filters.tier || 'All'}
              onChange={(e) => onFilterChange('tier', e.target.value === 'All' ? '' : e.target.value)}
            >
              <MenuItem value="All">All Models</MenuItem>
              <MenuItem value="Trial">Trial</MenuItem>
              <MenuItem value="Subscription">Subscription</MenuItem>
              <MenuItem value="Trial & Subscription">Trial & Subscription</MenuItem>
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
          <Table sx={{ minWidth: 1050 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Customer Name</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Company</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Email</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Location</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Phone Number</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>License Model</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Licenses (Active/Total)</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedCustomers.length > 0 ? (
                displayedCustomers.map((c) => {
                  return (
                    <TableRow key={c.CustomerID} hover>
                      {/* Customer Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.775rem',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            {(c.CustomerName || c.ContactName || 'C').charAt(0).toUpperCase()}
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                            {c.CustomerName || c.ContactName || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Company */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                          {c.Company || c.CompanyName || '—'}
                        </Typography>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <Typography
                          component="a"
                          href={`mailto:${c.Email}`}
                          variant="body2"
                          sx={{
                            color: '#2563eb',
                            fontSize: '0.825rem',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {c.Email || '—'}
                        </Typography>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPin size={13} color="#94a3b8" />
                          <Typography variant="body2" sx={{ fontSize: '0.825rem', color: '#475569' }}>
                            {c.Location || (c.City ? `${c.City}, ${c.Country}` : c.Country || 'Global')}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Phone Number */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {c.Phone && c.Phone !== '—' ? (
                            <>
                              <Phone size={13} color="#94a3b8" />
                              <Typography variant="body2" sx={{ fontSize: '0.825rem', color: '#475569' }}>
                                {c.Phone}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" sx={{ fontSize: '0.825rem', color: '#94a3b8' }}>
                              —
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* License Model */}
                      <TableCell>
                        <Chip
                          label={c.LicenseModel || 'Standard'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.725rem',
                            height: 22,
                            backgroundColor:
                              c.LicenseModel === 'Trial' ? '#fffbeb' :
                              c.LicenseModel === 'Subscription' ? '#eff6ff' :
                              c.LicenseModel === 'Trial & Subscription' ? '#faf5ff' : '#f1f5f9',
                            color:
                              c.LicenseModel === 'Trial' ? '#b45309' :
                              c.LicenseModel === 'Subscription' ? '#1d4ed8' :
                              c.LicenseModel === 'Trial & Subscription' ? '#7e22ce' : '#475569',
                            border:
                              c.LicenseModel === 'Trial' ? '1px solid #fde68a' :
                              c.LicenseModel === 'Subscription' ? '1px solid #bfdbfe' :
                              c.LicenseModel === 'Trial & Subscription' ? '1px solid #e9d5ff' : '1px solid #cbd5e1'
                          }}
                        />
                      </TableCell>

                      {/* Licenses */}
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

                      {/* Actions */}
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
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5 }}>
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
