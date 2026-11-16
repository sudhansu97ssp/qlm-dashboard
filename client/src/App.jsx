import React, { useState, useEffect, useCallback } from 'react';
import { Box, Snackbar, Alert, CircularProgress, Typography, useMediaQuery, useTheme } from '@mui/material';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LicenseModal from './components/LicenseModal';
import LicenseDetailModal from './components/LicenseDetailModal';
import ExportExcelModal from './components/ExportExcelModal';
import LogoutDialog from './components/LogoutDialog';

import LoginView from './views/LoginView';
import AnalyticsView from './views/AnalyticsView';
import CustomersView from './views/CustomersView';
import LicensesView from './views/LicensesView';
import ProductsView from './views/ProductsView';
import AuditLogsView from './views/AuditLogsView';
import CreateProductModal from './components/CreateProductModal';
import { KeyRound } from 'lucide-react';

import {
  fetchAnalytics,
  fetchCustomers,
  fetchLicenses,
  fetchLicenseById,
  fetchProducts,
  createProduct,
  fetchAuditLogs,
  verifyToken,
  logout
} from './services/api';

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Drawer / Sidebar Collapse & Expand State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Core Data States
  const [analytics, setAnalytics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters State
  const [customerFilters, setCustomerFilters] = useState({ search: '', country: '', tier: '', status: '' });
  const [licenseFilters, setLicenseFilters] = useState({ search: '', status: '', productId: '', type: '', customerId: '' });

  // Modals & Inspection State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false);
  const [selectedCustomerForCreate, setSelectedCustomerForCreate] = useState(null);
  const [selectedProductForCreate, setSelectedProductForCreate] = useState(null);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Primary Data Fetcher (Initial Load & Sync)
  const loadDashboardData = useCallback(async (isSync = false) => {
    if (isSync) setRefreshing(true);
    try {
      const [analyticsData, custList, licList, prodList, logs] = await Promise.all([
        fetchAnalytics().catch(() => null),
        fetchCustomers({}).catch(() => []),
        fetchLicenses({}).catch(() => []),
        fetchProducts().catch(() => []),
        fetchAuditLogs().catch(() => [])
      ]);

      if (analyticsData) setAnalytics(analyticsData);
      setCustomers(custList || []);
      setLicenses(licList || []);
      setProducts(prodList || []);
      setAuditLogs(logs || []);

      if (isSync) {
        showToast('Dashboard data updated successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast('Error syncing data with server', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Authentication check & 401 listener on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('qlm_auth_token');
      if (!token) {
        setIsAuthChecking(false);
        setIsAuthenticated(false);
        return;
      }
      try {
        const res = await verifyToken();
        if (res.success && res.user) {
          setCurrentUser(res.user);
          setIsAuthenticated(true);
          loadDashboardData();
        } else {
          localStorage.removeItem('qlm_auth_token');
          localStorage.removeItem('qlm_auth_user');
          setIsAuthenticated(false);
        }
      } catch (err) {
        localStorage.removeItem('qlm_auth_token');
        localStorage.removeItem('qlm_auth_user');
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();

    const handleUnauthorized = (e) => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      showToast(e.detail?.message || 'Session expired. Please sign in again.', 'warning');
    };

    window.addEventListener('qlm-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('qlm-unauthorized', handleUnauthorized);
    };
  }, [loadDashboardData]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    showToast(`Welcome back, ${user.username || 'Administrator'}!`, 'success');
    loadDashboardData();
  };

  const handleRequestLogout = () => {
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('You have been signed out successfully.', 'info');
  };

  const handleCancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  // Debounced Customer Filter effect (only updates customers table when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(async () => {
      try {
        const custList = await fetchCustomers(customerFilters);
        setCustomers(custList || []);
      } catch (err) {
        console.error('Failed to filter customers:', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerFilters, isAuthenticated]);

  // Debounced License Filter effect (only updates licenses table when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(async () => {
      try {
        const licList = await fetchLicenses(licenseFilters);
        setLicenses(licList || []);
      } catch (err) {
        console.error('Failed to filter licenses:', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [licenseFilters, isAuthenticated]);

  // Sidebar Toggle Handler
  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileDrawerOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  // Handlers for Customer Filters
  const handleCustomerFilterChange = (key, value) => {
    setCustomerFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetCustomerFilters = () => {
    setCustomerFilters({ search: '', country: '', tier: '', status: '' });
  };

  // Handlers for License Filters
  const handleLicenseFilterChange = (key, value) => {
    setLicenseFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetLicenseFilters = () => {
    setLicenseFilters({ search: '', status: '', productId: '', type: '', customerId: '' });
  };

  // Navigation Shortcut from Customers to Licenses
  const handleViewCustomerLicenses = (customerId) => {
    setLicenseFilters(prev => ({ ...prev, customerId }));
    setActiveTab('licenses');
  };

  // Generate License Shortcut for specific Customer
  const handleGenerateLicenseForCustomer = (customer) => {
    setSelectedCustomerForCreate(customer);
    setCreateModalOpen(true);
  };

  // Inspect License Detail
  const handleSelectLicense = async (licenseId) => {
    try {
      const detail = await fetchLicenseById(licenseId);
      if (detail) {
        setSelectedLicense(detail);
        setDetailModalOpen(true);
      }
    } catch (err) {
      showToast('Could not load license details', 'error');
    }
  };

  const handleLicenseStatusChanged = (key, newStatus) => {
    showToast(`License ${key} marked as ${newStatus}`, 'info');
    loadDashboardData(true);
  };

  const handleLicenseCreatedSuccess = (newLic) => {
    showToast(`License ${newLic.ActivationKey} generated successfully!`, 'success');
    loadDashboardData(true);
  };

  const handleCreateProductSuccess = async (productData) => {
    const res = await createProduct(productData);
    showToast(`Product "${productData.productName}" created successfully!`, 'success');
    loadDashboardData(true);
    return res;
  };

  // 1. Initial Authentication Checking Screen
  if (isAuthChecking) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.05) 0%, transparent 60%), #f8fafc',
          color: '#0f172a',
          gap: 2.5
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.35)',
            color: '#ffffff'
          }}
        >
          <KeyRound size={28} />
        </Box>
        <CircularProgress size={28} sx={{ color: '#2563eb' }} />
        <Typography sx={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
          Authenticating QLM Enterprise Portal...
        </Typography>
      </Box>
    );
  }

  // 2. Unauthenticated: Render Login View
  if (!isAuthenticated) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setToast(prev => ({ ...prev, open: false }))}
            severity={toast.severity}
            sx={{ width: '100%', borderRadius: '10px' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // 3. Authenticated: Render Main Dashboard
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* 1. Slick Drawer-Like Expandable / Closable Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        counts={{
          customers: customers.length,
          licenses: licenses.length,
          products: products.length
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
        currentUser={currentUser}
        onLogout={handleRequestLogout}
      />

      {/* 2. Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Top App Navbar */}
        <Navbar
          activeTab={activeTab}
          onOpenCreateModal={() => {
            setSelectedCustomerForCreate(null);
            setSelectedProductForCreate(null);
            setCreateModalOpen(true);
          }}
          onOpenExportModal={() => setExportModalOpen(true)}
          onRefresh={() => loadDashboardData(true)}
          isRefreshing={refreshing}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
          onLogout={handleRequestLogout}
        />

        {/* Content Body - Full Screen Width */}
        <Box sx={{ flex: 1, py: { xs: 2.5, sm: 3.5 }, px: { xs: 2, sm: 3, md: 4 }, width: '100%', boxSizing: 'border-box' }}>
          {/* Tab 1: Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <AnalyticsView
              analytics={analytics}
              onNavigateToLicenses={() => setActiveTab('licenses')}
              onSelectLicense={handleSelectLicense}
            />
          )}

          {/* Tab 2: Customer Directory */}
          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              filters={customerFilters}
              onFilterChange={handleCustomerFilterChange}
              onResetFilters={handleResetCustomerFilters}
              onGenerateLicenseForCustomer={handleGenerateLicenseForCustomer}
              onViewCustomerLicenses={handleViewCustomerLicenses}
            />
          )}

          {/* Tab 3: License Manager */}
          {activeTab === 'licenses' && (
            <LicensesView
              licenses={licenses}
              products={products}
              filters={licenseFilters}
              onFilterChange={handleLicenseFilterChange}
              onResetFilters={handleResetLicenseFilters}
              onOpenCreateModal={() => {
                setSelectedCustomerForCreate(null);
                setSelectedProductForCreate(null);
                setCreateModalOpen(true);
              }}
              onSelectLicense={handleSelectLicense}
              onRefresh={() => loadDashboardData(true)}
            />
          )}

          {/* Tab 4: Security Operations Audit Trail */}
          {activeTab === 'audit' && (
            <AuditLogsView auditLogs={auditLogs} />
          )}

          {/* Tab 5: Created Products Catalog */}
          {activeTab === 'products' && (
            <ProductsView
              products={products}
              onOpenCreateProduct={() => setCreateProductModalOpen(true)}
              onIssueLicenseForProduct={(product) => {
                setSelectedCustomerForCreate(null);
                setSelectedProductForCreate(product);
                setCreateModalOpen(true);
              }}
              onRefresh={() => loadDashboardData(true)}
            />
          )}
        </Box>
      </Box>

      {/* License Creation Wizard Modal */}
      <LicenseModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        customers={customers}
        products={products}
        onSuccess={handleLicenseCreatedSuccess}
        initialCustomer={selectedCustomerForCreate}
        initialProduct={selectedProductForCreate}
      />

      {/* Product Creation Wizard Modal */}
      <CreateProductModal
        open={createProductModalOpen}
        onClose={() => setCreateProductModalOpen(false)}
        onCreateSuccess={handleCreateProductSuccess}
      />

      {/* License Detail Inspector Modal */}
      <LicenseDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        license={selectedLicense}
        onStatusChange={handleLicenseStatusChanged}
      />

      {/* Global Periodic Excel Export Modal (7d, 15d, 30d, 6m, 1y for Trial & Subscription) */}
      <ExportExcelModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        licenses={licenses}
      />

      {/* Logout Confirmation Dialog */}
      <LogoutDialog
        open={logoutDialogOpen}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        currentUser={currentUser}
      />

      {/* Global Notification Snackbar */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
