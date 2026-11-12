import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from server/.env and root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  
  // MS SQL EC2 Connection Config
  mssql: {
    server: process.env.MSSQL_HOST || '65.1.64.25',
    port: parseInt(process.env.MSSQL_PORT || '1433', 10),
    database: process.env.MSSQL_DATABASE || 'qlm_db',
    user: process.env.MSSQL_USER || 'ncircleadmin',
    password: process.env.MSSQL_PASSWORD || 'XzSaWq@12345',
    options: {
      encrypt: process.env.MSSQL_ENCRYPT === 'true',
      trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERT !== 'false',
      connectTimeout: 8000,
      requestTimeout: 20000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    }
  },

  // QLM Soraco Web Service API Config
  qlm: {
    serviceUrl: process.env.QLM_SERVICE_URL || 'https://license.ncircletech.com/nCircle/qlmLicenseServer/qlmservice.asmx',
    adminEncryptionKey: process.env.QLM_ADMIN_ENCRYPTION_KEY || '{B2967657-CEE5-4C8D-9817-A1734D8A6ED7}',
    communicationEncryptionKey: process.env.QLM_COMMUNICATION_KEY || '{3F82C3D1-72A0-4C96-A5DF-0D76F87C5D41}',
    vendorName: process.env.QLM_VENDOR || 'ncircletech',
    productId: parseInt(process.env.QLM_PRODUCT_ID || '1', 10),
    majorVersion: parseInt(process.env.QLM_MAJOR_VERSION || '17', 10),
    minorVersion: parseInt(process.env.QLM_MINOR_VERSION || '0', 10)
  },

  // Single User Dashboard Auth Configuration
  auth: {
    email: process.env.ADMIN_EMAIL || 'admin@ncircletech.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    jwtSecret: process.env.JWT_SECRET || 'qlm-enterprise-dashboard-secret-key-2026',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
};
