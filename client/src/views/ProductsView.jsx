import React, { useState, useMemo } from 'react';
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
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  Grid
} from '@mui/material';
import {
  Search,
  Plus,
  Package,
  Layers,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function ProductsView({
  products = [],
  onOpenCreateProduct,
  onIssueLicenseForProduct,
  onRefresh
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtered list
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const s = search.toLowerCase();
    return products.filter(p =>
      (p.ProductName && p.ProductName.toLowerCase().includes(s)) ||
      (p.CurrentVersion && p.CurrentVersion.toLowerCase().includes(s)) ||
      (p.ProductCode && p.ProductCode.toLowerCase().includes(s)) ||
      (p.Description && p.Description.toLowerCase().includes(s))
    );
  }, [products, search]);

  const displayedProducts = filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalLicensesCount = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.TotalLicenses || 0), 0);
  }, [products]);

  const totalActiveLicenses = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.ActiveLicenses || 0), 0);
  }, [products]);

  return (
    <Box sx={{ pb: 4 }}>
      {/* KPI Overview Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ p: 2.2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Package size={22} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Total Catalog Products
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {products.length}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ p: 2.2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CheckCircle2 size={22} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Active Issued Licenses
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
                {totalActiveLicenses}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ p: 2.2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: '#faf5ff',
                color: '#7e22ce',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <KeyRound size={22} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Total Licenses Generated
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#7e22ce' }}>
                {totalLicensesCount}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Header & Filter Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: '20px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
                Product Dashboard
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Manage licensed software modules, version releases, and licensing metrics
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={onOpenCreateProduct}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  backgroundColor: '#2563eb',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#1d4ed8' }
                }}
              >
                Create New Product
              </Button>
            </Box>
          </Box>

          {/* Search & Actions */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search products by title or current version..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
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
            {search && (
              <Tooltip title="Clear search">
                <IconButton onClick={() => setSearch('')} size="small">
                  <RotateCcw size={15} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Product Name</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Current Version</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Licenses (Active / Total)</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>License Breakdown</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedProducts.length > 0 ? (
                displayedProducts.map((p) => {
                  const rawVer = p.CurrentVersion || p.ProductCode || p.LatestVersion || '1.0.0';
                  const versionStr = rawVer.trim().startsWith('v') ? rawVer.trim() : `v${rawVer.trim()}`;
                  return (
                    <TableRow key={p.ProductID} hover>
                      {/* Product Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '8px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Package size={17} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                              {p.ProductName}
                            </Typography>
                            {p.Description && (
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.Description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Current Version */}
                      <TableCell>
                        <Chip
                          label={versionStr}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.775rem',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            px: 0.5
                          }}
                        />
                      </TableCell>

                      {/* Licenses Active/Total */}
                      <TableCell>
                        <Chip
                          label={`${p.ActiveLicenses || 0} Active / ${p.TotalLicenses || 0} Total`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            backgroundColor: (p.ActiveLicenses || 0) > 0 ? '#ecfdf5' : '#f1f5f9',
                            color: (p.ActiveLicenses || 0) > 0 ? '#059669' : '#64748b'
                          }}
                        />
                      </TableCell>

                      {/* Breakdown */}
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                          {(p.TrialLicenses || 0) > 0 && (
                            <Chip
                              label={`${p.TrialLicenses} Trial`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.675rem',
                                fontWeight: 600,
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a'
                              }}
                            />
                          )}
                          {(p.SubscriptionLicenses || 0) > 0 && (
                            <Chip
                              label={`${p.SubscriptionLicenses} Sub`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.675rem',
                                fontWeight: 600,
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe'
                              }}
                            />
                          )}
                          {(p.TotalLicenses || 0) === 0 && (
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              No licenses yet
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<KeyRound size={13} />}
                          onClick={() => onIssueLicenseForProduct(p)}
                          sx={{ fontSize: '0.75rem', py: 0.4, px: 1.2, textTransform: 'none' }}
                        >
                          Issue License
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No software products found matching your search.
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
          count={filteredProducts.length}
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
    </Box>
  );
}

