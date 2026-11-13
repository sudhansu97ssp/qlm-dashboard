import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getDbStatus, ensureDbConnected } from './database/db.js';
import authRouter from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';
import customersRouter from './routes/customers.js';
import licensesRouter from './routes/licenses.js';
import analyticsRouter from './routes/analytics.js';
import productsRouter from './routes/products.js';

const app = express();

// Middlewares
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Warm up / ensure database pool connection is active
// Non-blocking database pool warmup on cold start (does not block auth or health endpoints)
ensureDbConnected().catch((err) => {
  console.warn('[DB Connection Warmup]:', err.message);
});

// Health & Status endpoint (available at /health and /api/health)
const handleHealth = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: getDbStatus()
  });
};
app.get('/health', handleHealth);
app.get('/api/health', handleHealth);

// Subrouter for API
const apiRouter = express.Router();

// Public Authentication endpoints (/api/auth/login, etc.)
apiRouter.use('/auth', authRouter);

// Protected Data endpoints (Requires valid JWT Bearer token)
apiRouter.use('/analytics', authenticateToken, analyticsRouter);
apiRouter.use('/customers', authenticateToken, customersRouter);
apiRouter.use('/licenses', authenticateToken, licensesRouter);
apiRouter.use('/products', authenticateToken, productsRouter);

// Mount on both /api and root / so any Vercel rewrite or direct hit resolves correctly
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

export default app;
