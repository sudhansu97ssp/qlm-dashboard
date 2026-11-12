import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { authenticateToken } from '../middleware/auth.js';
import { recordAuditLog } from '../database/db.js';

const router = express.Router();

/**
 * Timing-safe string comparison to protect against timing attacks
 */
function safeCompare(a, b) {
  const strA = String(a || '');
  const strB = String(b || '');
  const bufA = Buffer.from(strA);
  const bufB = Buffer.from(strB);

  if (bufA.length !== bufB.length) {
    // Constant time dummy comparison
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * GET /api/auth/login
 * Informational endpoint when accessed via browser directly
 */
router.get('/login', (req, res) => {
  res.json({
    success: true,
    message: 'QLM Dashboard Authentication Endpoint',
    method: 'POST',
    description: 'Send a POST request with JSON body { email, password } to authenticate.'
  });
});

/**
 * POST /api/auth/login
 * Authenticates the single dashboard admin user via Email
 */
router.post('/login', async (req, res) => {
  const { email, username, password } = req.body || {};
  const inputEmail = (email || username || '').trim().toLowerCase();

  if (!inputEmail || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  const expectedEmail = (config.auth.email || 'admin@ncircletech.com').trim().toLowerCase();
  const expectedPassword = config.auth.password;

  const isEmailValid = safeCompare(inputEmail, expectedEmail);
  const isPasswordValid = safeCompare(password, expectedPassword);

  if (!isEmailValid || !isPasswordValid) {
    try {
      await recordAuditLog({
        action: 'FailedLogin',
        entity: 'AdminAuth',
        entityId: inputEmail,
        performedBy: inputEmail || 'Unknown',
        details: 'Failed dashboard login attempt: invalid email or password',
        status: 'Failed'
      });
    } catch (_) {}

    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }

  // Issue JWT Token
  const tokenPayload = {
    email: expectedEmail,
    username: expectedEmail.split('@')[0],
    role: 'admin',
    loginTime: new Date().toISOString()
  };

  const token = jwt.sign(tokenPayload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn
  });

  try {
    await recordAuditLog({
      action: 'AdminLogin',
      entity: 'AdminAuth',
      entityId: expectedEmail,
      performedBy: expectedEmail,
      details: 'Administrator successfully logged in via email',
      status: 'Success'
    });
  } catch (_) {}

  return res.json({
    success: true,
    message: 'Authentication successful',
    token,
    user: {
      email: expectedEmail,
      username: expectedEmail.split('@')[0],
      role: 'admin'
    }
  });
});

/**
 * GET /api/auth/verify (also alias /me)
 * Verifies current token validity on app reload
 */
const verifyHandler = (req, res) => {
  return res.json({
    success: true,
    user: {
      email: req.user.email,
      username: req.user.username || req.user.email?.split('@')[0] || 'admin',
      role: req.user.role || 'admin',
      loginTime: req.user.loginTime
    }
  });
};

router.get('/verify', authenticateToken, verifyHandler);
router.get('/me', authenticateToken, verifyHandler);

/**
 * POST /api/auth/logout
 * Logs logout event
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await recordAuditLog({
      action: 'AdminLogout',
      entity: 'AdminAuth',
      entityId: req.user?.email || 'admin',
      performedBy: req.user?.email || 'admin',
      details: 'Administrator logged out of QLM Dashboard',
      status: 'Success'
    });
  } catch (_) {}

  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
