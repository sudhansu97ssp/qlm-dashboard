import express from 'express';
import { fetchProducts, insertProduct } from '../database/db.js';

const router = express.Router();

// GET /api/products - Get all software products with licensing metrics
router.get('/', async (req, res) => {
  try {
    const products = await fetchProducts(req.query.refresh === 'true');
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products - Create a new product catalog item
router.post('/', async (req, res) => {
  try {
    const { productName, version, major, minor, description, features } = req.body;
    if (!productName || !productName.trim()) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }
    const newProduct = await insertProduct({
      productName: productName.trim(),
      version: version ? version.trim() : '1.0.0',
      major: major ? String(major).trim() : '1',
      minor: minor ? String(minor).trim() : '0',
      description: description ? description.trim() : '',
      features: features ? features.trim() : ''
    });
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

