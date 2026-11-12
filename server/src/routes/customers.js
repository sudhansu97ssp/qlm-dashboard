import express from 'express';
import { fetchCustomers, fetchCustomerById } from '../database/db.js';

const router = express.Router();

// GET /api/customers - List all customers with filters
router.get('/', async (req, res) => {
  try {
    const { search, country, tier, status } = req.query;
    const customers = await fetchCustomers({ search, country, tier, status });
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customers/:id - Customer details + linked licenses
router.get('/:id', async (req, res) => {
  try {
    const customer = await fetchCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
