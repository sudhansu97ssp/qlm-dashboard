import express from 'express';
import {
  fetchLicenses,
  fetchLicenseById,
  insertLicense,
  fetchProducts,
  fetchCustomerById
} from '../database/db.js';
import {
  createQlmLicense,
  deactivateQlmLicense,
  revokeQlmLicense
} from '../services/qlmService.js';

const router = express.Router();

// GET /api/licenses - Query licenses with versatile filtering
router.get('/', async (req, res) => {
  try {
    const { search, status, productId, type, customerId } = req.query;
    const licenses = await fetchLicenses({ search, status, productId, type, customerId });
    res.json({
      success: true,
      count: licenses.length,
      data: licenses
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/licenses/products - List available software products for licensing
router.get('/products', async (req, res) => {
  try {
    const products = await fetchProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/licenses/:id - License details and machine activation history
router.get('/:id', async (req, res) => {
  try {
    const license = await fetchLicenseById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, error: 'License not found' });
    }
    res.json({ success: true, data: license });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/licenses/create - Generate new license via QLM Soraco Web Service & record to MS SQL
router.post('/create', async (req, res) => {
  try {
    const {
      customerId,
      productId,
      licenseType = 'Subscription',
      licenseModel,
      seats = 1,
      numLicenses,
      features = 65535,
      expiryDate,
      notes = ''
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'Customer ID is required' });
    }

    const customer = await fetchCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Selected Customer not found' });
    }

    const effectiveModel = licenseModel || licenseType || 'Subscription';
    const effectiveNumLicenses = parseInt(numLicenses || seats || 1, 10);

    // Call QLM Soraco API
    const qlmResult = await createQlmLicense({
      customerName: customer.ContactName,
      customerEmail: customer.Email,
      customerPhone: customer.Phone,
      companyName: customer.CompanyName,
      productId: productId || 1,
      licenseType: effectiveModel,
      licenseModel: effectiveModel,
      numLicenses: effectiveNumLicenses,
      seats: effectiveNumLicenses,
      features: parseInt(features, 10),
      expiryDate,
      notes
    });

    // Record into MS SQL Database
    const savedRecord = await insertLicense({
      ...qlmResult,
      CustomerID: customer.CustomerID
    });

    res.status(201).json({
      success: true,
      message: 'License Key generated and registered successfully via QLM Soraco API',
      data: {
        ...savedRecord,
        CompanyName: customer.CompanyName,
        ContactName: customer.ContactName,
        CustomerEmail: customer.Email,
        Country: customer.Country
      }
    });
  } catch (error) {
    console.error('Error creating QLM license:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/licenses/deactivate - Deactivate license via QLM Soraco Web Service
router.post('/deactivate', async (req, res) => {
  try {
    const { activationKey, computerKey = '', reason = '' } = req.body;
    if (!activationKey) {
      return res.status(400).json({ success: false, error: 'Activation Key is required' });
    }

    const result = await deactivateQlmLicense({ activationKey, computerKey, reason });
    res.json({
      success: true,
      message: `License ${activationKey} has been deactivated successfully.`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/licenses/revoke - Permanently revoke license key via QLM Soraco Web Service
router.post('/revoke', async (req, res) => {
  try {
    const { activationKey, reason = 'Revoked by administrator' } = req.body;
    if (!activationKey) {
      return res.status(400).json({ success: false, error: 'Activation Key is required' });
    }

    const result = await revokeQlmLicense({ activationKey, reason });
    res.json({
      success: true,
      message: `License ${activationKey} has been revoked successfully.`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
