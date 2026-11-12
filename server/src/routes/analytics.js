import express from 'express';
import { getDashboardAnalytics } from '../services/analyticsService.js';
import { fetchAuditLogs } from '../database/db.js';

const router = express.Router();

// GET /api/analytics/dashboard - Comprehensive dashboard summary metrics
router.get('/dashboard', async (req, res) => {
  try {
    const analytics = await getDashboardAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/audit-logs - Operation logs
router.get('/audit-logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = await fetchAuditLogs(limit);
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
