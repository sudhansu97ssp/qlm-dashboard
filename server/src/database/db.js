import sql from 'mssql';
import { config } from '../config/env.js';
import {
  initialCustomers,
  initialLicenses,
  initialProducts,
  initialActivations,
  initialAuditLogs
} from './seedData.js';

// In-memory active stores for fallback mode
let memoryStore = {
  customers: JSON.parse(JSON.stringify(initialCustomers)),
  licenses: JSON.parse(JSON.stringify(initialLicenses)),
  products: JSON.parse(JSON.stringify(initialProducts)),
  activations: JSON.parse(JSON.stringify(initialActivations)),
  auditLogs: JSON.parse(JSON.stringify(initialAuditLogs))
};

// Global pool reference for serverless container reuse
let pool = global._mssqlPool || null;
let isConnectedToEc2 = Boolean(global._mssqlPool && global._mssqlPool.connected);
let lastConnectionAttempt = null;
let lastConnectionError = null;
let isNativeQlmDb = global._isNativeQlmDb || false;
let connectPromise = null;

/**
 * Ensure MS SQL database connection is ready (with serverless connection reuse)
 */
export async function ensureDbConnected() {
  if (pool && pool.connected) {
    return pool;
  }
  if (global._mssqlPool && global._mssqlPool.connected) {
    pool = global._mssqlPool;
    isConnectedToEc2 = true;
    isNativeQlmDb = global._isNativeQlmDb || false;
    return pool;
  }
  if (connectPromise) {
    return connectPromise;
  }
  connectPromise = (async () => {
    try {
      await initDatabase();
      return pool;
    } finally {
      connectPromise = null;
    }
  })();
  return connectPromise;
}

/**
 * Attempt to connect to MS SQL Server on AWS EC2
 */
export async function initDatabase(customConfig = null) {
  const dbConfig = customConfig || config.mssql;
  lastConnectionAttempt = new Date().toISOString();

  if (!dbConfig.server || (dbConfig.server === '127.0.0.1' && !dbConfig.password)) {
    isConnectedToEc2 = false;
    lastConnectionError = 'EC2 MS SQL credentials not configured or default placeholder used. Running in Simulation Mode.';
    console.log(`[EC2 DB] ${lastConnectionError}`);
    return { connected: false, message: lastConnectionError, mode: 'Simulation' };
  }

  try {
    if (pool && !global._mssqlPool) {
      try { await pool.close(); } catch (_) {}
    }
    console.log(`[EC2 DB] Connecting to MS SQL Server at ${dbConfig.server}:${dbConfig.port}, Database: ${dbConfig.database}...`);
    pool = await sql.connect({
      server: dbConfig.server,
      port: dbConfig.port || 1433,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      options: {
        encrypt: dbConfig.options?.encrypt ?? false,
        trustServerCertificate: dbConfig.options?.trustServerCertificate ?? true,
        connectTimeout: 8000,
        requestTimeout: 20000
      },
      pool: {
        min: process.env.VERCEL ? 0 : 2,                  // 0 on serverless to prevent idle socket leaks, 2 for persistent local dev
        max: 20,                                          // Handle up to 20 concurrent queries without queueing
        idleTimeoutMillis: 300000                         // 5-minute idle timeout
      }
    });

    isConnectedToEc2 = true;
    lastConnectionError = null;
    global._mssqlPool = pool;

    // Detect if this is Soraco QLM's native schema (with LicenseKeys table)
    const checkRes = await pool.request().query("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'LicenseKeys'");
    isNativeQlmDb = checkRes.recordset[0].cnt > 0;
    global._isNativeQlmDb = isNativeQlmDb;

    console.log(`[EC2 DB] Successfully connected to MS SQL Database on EC2 instance! Native QLM Schema: ${isNativeQlmDb}`);
    return { connected: true, message: 'Connected to EC2 MS SQL Server successfully', mode: 'Live' };
  } catch (err) {
    isConnectedToEc2 = false;
    lastConnectionError = err.message;
    console.warn(`[EC2 DB] Connection to EC2 MS SQL failed: ${err.message}. Operating in Simulation Mode.`);
    return { connected: false, message: err.message, mode: 'Simulation' };
  }
}


/**
 * Returns current DB status and mode
 */
export function getDbStatus() {
  return {
    isConnectedToEc2,
    mode: isConnectedToEc2 ? `Live EC2 MS SQL (${isNativeQlmDb ? 'Soraco QLM Engine' : 'Standard'})` : 'Local Enterprise Simulator',
    server: config.mssql.server,
    database: config.mssql.database,
    lastAttempt: lastConnectionAttempt,
    lastError: lastConnectionError,
    metrics: {
      totalCustomers: memoryStore.customers.length,
      totalLicenses: memoryStore.licenses.length,
      totalProducts: memoryStore.products.length,
      totalActivations: memoryStore.activations.length
    }
  };
}


// -------------------------------------------------------------
// Database Query Operations (Live SQL with native QLM mapping)
// -------------------------------------------------------------

export async function fetchCustomers({ search = '', country = '', tier = '', status = '' }) {
  await ensureDbConnected();
  if (isConnectedToEc2 && pool) {
    try {
      if (isNativeQlmDb) {
        // Live Soraco QLM Database Customers Query
        const request = pool.request();
        let query = `
          SELECT 
            c.ID as CustomerID,
            ISNULL(NULLIF(c.Company, ''), ISNULL(NULLIF(c.FullName, ''), 'Independent Customer')) as CompanyName,
            ISNULL(NULLIF(c.FullName, ''), 'N/A') as ContactName,
            c.Email,
            c.Phone,
            ISNULL(NULLIF(c.Country, ''), 'Global') as Country,
            c.City,
            CASE 
              WHEN COUNT(l.ID) >= 5 THEN 'Strategic'
              WHEN COUNT(l.ID) >= 2 THEN 'Enterprise'
              ELSE 'Standard'
            END as CustomerTier,
            'Active' as Status,
            c.CreationDate as CreatedAt,
            COUNT(l.ID) as TotalLicenses,
            SUM(CASE WHEN l.Disabled = 0 AND (l.SubscriptionExpiryDate IS NULL OR l.SubscriptionExpiryDate > GETUTCDATE()) THEN 1 ELSE 0 END) as ActiveLicenses
          FROM Customers c
          LEFT JOIN LicenseKeys l ON c.ID = l.UserID
          WHERE (c.FullName IS NOT NULL AND c.FullName != '') 
             OR (c.Company IS NOT NULL AND c.Company != '') 
             OR (c.Email IS NOT NULL AND c.Email != 'None')
        `;

        if (search) {
          request.input('search', sql.NVarChar, `%${search}%`);
          query += ` AND (c.Company LIKE @search OR c.FullName LIKE @search OR c.Email LIKE @search)`;
        }
        if (country) {
          request.input('country', sql.NVarChar, country);
          query += ` AND c.Country = @country`;
        }

        query += `
          GROUP BY c.ID, c.Company, c.FullName, c.Email, c.Phone, c.Country, c.City, c.CreationDate
          ORDER BY c.ID DESC
        `;

        const res = await request.query(query);
        return res.recordset;
      } else {
        // Custom schema Customers Query
        const request = pool.request();
        let query = `
          SELECT c.*, 
            COUNT(l.LicenseID) as TotalLicenses,
            SUM(CASE WHEN l.Status = 'Active' THEN 1 ELSE 0 END) as ActiveLicenses
          FROM Customers c
          LEFT JOIN Licenses l ON c.CustomerID = l.CustomerID
          WHERE 1=1
        `;
        if (search) {
          request.input('search', sql.NVarChar, `%${search}%`);
          query += ` AND (c.CompanyName LIKE @search OR c.ContactName LIKE @search OR c.Email LIKE @search)`;
        }
        if (country) {
          request.input('country', sql.NVarChar, country);
          query += ` AND c.Country = @country`;
        }
        if (tier) {
          request.input('tier', sql.NVarChar, tier);
          query += ` AND c.CustomerTier = @tier`;
        }
        if (status) {
          request.input('status', sql.NVarChar, status);
          query += ` AND c.Status = @status`;
        }
        query += ` GROUP BY c.CustomerID, c.CompanyName, c.ContactName, c.Email, c.Phone, c.Country, c.City, c.CustomerTier, c.Status, c.CreatedAt, c.UpdatedAt ORDER BY c.CreatedAt DESC`;
        const res = await request.query(query);
        return res.recordset;
      }
    } catch (err) {
      console.error('[EC2 DB Query Error] fetchCustomers:', err.message);
    }
  }

  // Simulation Fallback
  let list = [...memoryStore.customers];
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(c =>
      c.CompanyName.toLowerCase().includes(s) ||
      c.ContactName.toLowerCase().includes(s) ||
      c.Email.toLowerCase().includes(s)
    );
  }
  if (country) {
    list = list.filter(c => c.Country.toLowerCase() === country.toLowerCase());
  }
  if (tier) {
    list = list.filter(c => c.CustomerTier.toLowerCase() === tier.toLowerCase());
  }
  if (status) {
    list = list.filter(c => c.Status.toLowerCase() === status.toLowerCase());
  }

  return list.map(c => {
    const custLicenses = memoryStore.licenses.filter(l => l.CustomerID === c.CustomerID);
    return {
      ...c,
      TotalLicenses: custLicenses.length,
      ActiveLicenses: custLicenses.filter(l => l.Status === 'Active').length
    };
  });
}

export async function fetchCustomerById(customerId) {
  await ensureDbConnected();
  if (isConnectedToEc2 && pool) {
    try {
      if (isNativeQlmDb) {
        const req = pool.request();
        req.input('id', sql.Int, parseInt(customerId, 10));
        const res = await req.query(`
          SELECT 
            c.ID as CustomerID,
            ISNULL(NULLIF(c.Company, ''), ISNULL(NULLIF(c.FullName, ''), 'Independent')) as CompanyName,
            ISNULL(NULLIF(c.FullName, ''), 'N/A') as ContactName,
            c.Email,
            c.Phone,
            ISNULL(NULLIF(c.Country, ''), 'Global') as Country,
            c.City,
            'Enterprise' as CustomerTier,
            'Active' as Status,
            c.CreationDate as CreatedAt
          FROM Customers c
          WHERE c.ID = @id
        `);

        if (res.recordset.length > 0) {
          const licRes = await pool.request()
            .input('userId', sql.Int, parseInt(customerId, 10))
            .query(`
              SELECT 
                l.ID as LicenseID,
                l.ActivationKey,
                p.ProductName,
                CASE l.LicenseModel WHEN 1 THEN 'Permanent' WHEN 2 THEN 'Trial' WHEN 3 THEN 'Subscription' WHEN 4 THEN 'Floating' ELSE 'Subscription' END as LicenseModel,
                CASE l.LicenseModel WHEN 1 THEN 'Permanent' WHEN 2 THEN 'Trial' WHEN 3 THEN 'Subscription' WHEN 4 THEN 'Floating' ELSE 'Subscription' END as LicenseType,
                CASE WHEN l.Disabled = 1 THEN 'Revoked' WHEN l.SubscriptionExpiryDate < GETUTCDATE() THEN 'Expired' ELSE 'Active' END as Status,
                ISNULL(l.NumLicenses, 1) as NumLicenses,
                ISNULL(l.AvailableLicenses, 0) as AvailableLicenses,
                CASE WHEN ISNULL(l.NumLicenses, 1) > ISNULL(l.AvailableLicenses, 0) THEN ISNULL(l.NumLicenses, 1) - ISNULL(l.AvailableLicenses, 0) ELSE 0 END as ActivatedCount,
                ISNULL(l.AvailableLicenses, 0) as NotActivatedCount,
                ISNULL(l.NumLicenses, 1) as SeatsTotal,
                CASE WHEN ISNULL(l.NumLicenses, 1) > ISNULL(l.AvailableLicenses, 0) THEN ISNULL(l.NumLicenses, 1) - ISNULL(l.AvailableLicenses, 0) ELSE 0 END as SeatsUsed,
                l.SubscriptionExpiryDate as ExpiryDate
              FROM LicenseKeys l
              LEFT JOIN Products p ON l.ProductID = p.ID
              WHERE l.UserID = @userId
            `);
          return { ...res.recordset[0], licenses: licRes.recordset };
        }
      } else {
        const request = pool.request();
        request.input('customerId', sql.NVarChar, customerId);
        const res = await request.query('SELECT * FROM Customers WHERE CustomerID = @customerId');
        if (res.recordset.length > 0) {
          const licRes = await pool.request()
            .input('customerId', sql.NVarChar, customerId)
            .query('SELECT l.*, p.ProductName FROM Licenses l JOIN Products p ON l.ProductID = p.ProductID WHERE l.CustomerID = @customerId');
          return { ...res.recordset[0], licenses: licRes.recordset };
        }
      }
    } catch (err) {
      console.error('[EC2 DB Query Error] fetchCustomerById:', err.message);
    }
  }

  const cust = memoryStore.customers.find(c => c.CustomerID === customerId);
  if (!cust) return null;
  const licenses = memoryStore.licenses
    .filter(l => l.CustomerID === customerId)
    .map(l => {
      const prod = memoryStore.products.find(p => p.ProductID === l.ProductID);
      return { 
        ...l, 
        ProductName: prod ? prod.ProductName : 'Unknown Product',
        LicenseModel: l.LicenseModel || l.LicenseType || 'Subscription',
        NumLicenses: l.NumLicenses || l.SeatsTotal || 1,
        AvailableLicenses: l.AvailableLicenses ?? Math.max(0, (l.NumLicenses || l.SeatsTotal || 1) - (l.ActivatedCount || l.SeatsUsed || 0)),
        ActivatedCount: l.ActivatedCount ?? (l.SeatsUsed || 0),
        NotActivatedCount: l.NotActivatedCount ?? (l.AvailableLicenses ?? Math.max(0, (l.NumLicenses || l.SeatsTotal || 1) - (l.ActivatedCount || l.SeatsUsed || 0)))
      };
    });
  return { ...cust, licenses };
}

export async function fetchLicenses({ search = '', status = '', productId = '', type = '', customerId = '' }) {
  await ensureDbConnected();
  if (isConnectedToEc2 && pool) {
    try {
      if (isNativeQlmDb) {
        // Live Soraco QLM Database LicenseKeys Query
        const request = pool.request();
        let query = `
          SELECT 
            l.ID as LicenseID,
            l.ActivationKey,
            l.ComputerKey,
            l.UserID as CustomerID,
            l.ProductID,
            ISNULL(p.ProductName, 'QLM Software') as ProductName,
            ISNULL(p.LatestVersion, 'v1.0') as ProductCode,
            ISNULL(p.Major, 'Standard') as Edition,
            ISNULL(NULLIF(c.Company, ''), ISNULL(NULLIF(c.FullName, ''), 'Independent')) as CompanyName,
            ISNULL(NULLIF(c.FullName, ''), 'N/A') as ContactName,
            c.Email as CustomerEmail,
            ISNULL(NULLIF(c.Country, ''), 'Global') as Country,
            CASE l.LicenseModel 
              WHEN 1 THEN 'Permanent' 
              WHEN 2 THEN 'Trial' 
              WHEN 3 THEN 'Subscription' 
              WHEN 4 THEN 'Floating' 
              ELSE 'Subscription' 
            END as LicenseModel,
            CASE l.LicenseModel 
              WHEN 1 THEN 'Permanent' 
              WHEN 2 THEN 'Trial' 
              WHEN 3 THEN 'Subscription' 
              WHEN 4 THEN 'Floating' 
              ELSE 'Subscription' 
            END as LicenseType,
            CASE 
              WHEN l.Disabled = 1 THEN 'Revoked'
              WHEN l.SubscriptionExpiryDate IS NOT NULL AND l.SubscriptionExpiryDate < GETUTCDATE() THEN 'Expired'
              ELSE 'Active'
            END as Status,
            ISNULL(l.NumLicenses, 1) as NumLicenses,
            ISNULL(l.AvailableLicenses, 0) as AvailableLicenses,
            CASE 
              WHEN ISNULL(l.NumLicenses, 1) > ISNULL(l.AvailableLicenses, 0) 
              THEN ISNULL(l.NumLicenses, 1) - ISNULL(l.AvailableLicenses, 0)
              ELSE 0 
            END as ActivatedCount,
            ISNULL(l.AvailableLicenses, 0) as NotActivatedCount,
            ISNULL(l.NumLicenses, 1) as SeatsTotal,
            CASE 
              WHEN ISNULL(l.NumLicenses, 1) > ISNULL(l.AvailableLicenses, 0) 
              THEN ISNULL(l.NumLicenses, 1) - ISNULL(l.AvailableLicenses, 0)
              ELSE 0 
            END as SeatsUsed,
            ISNULL(l.OrderDate, l.CreationDate) as IssuedDate,
            l.SubscriptionExpiryDate as ExpiryDate,
            l.MaintenanceRenewalDate as MaintenanceExpiryDate,
            l.LastAccessedDate as LastCheckIn,
            l.Comment as Notes
          FROM LicenseKeys l
          LEFT JOIN Customers c ON l.UserID = c.ID
          LEFT JOIN Products p ON l.ProductID = p.ID
          WHERE 1=1
        `;

        if (search) {
          request.input('search', sql.NVarChar, `%${search}%`);
          query += ` AND (l.ActivationKey LIKE @search OR c.Company LIKE @search OR c.Email LIKE @search OR CAST(l.ID AS NVARCHAR) LIKE @search)`;
        }
        if (status) {
          if (status === 'Revoked') {
            query += ` AND l.Disabled = 1`;
          } else if (status === 'Expired') {
            query += ` AND l.Disabled = 0 AND l.SubscriptionExpiryDate < GETUTCDATE()`;
          } else if (status === 'Active') {
            query += ` AND l.Disabled = 0 AND (l.SubscriptionExpiryDate IS NULL OR l.SubscriptionExpiryDate >= GETUTCDATE())`;
          }
        }
        if (productId) {
          request.input('productId', sql.Int, parseInt(productId, 10));
          query += ` AND l.ProductID = @productId`;
        }
        if (type) {
          const typeMap = { 'Permanent': 1, 'Trial': 2, 'Subscription': 3, 'Floating': 4 };
          if (typeMap[type]) {
            request.input('typeModel', sql.BigInt, typeMap[type]);
            query += ` AND l.LicenseModel = @typeModel`;
          }
        }
        if (customerId) {
          request.input('userId', sql.Int, parseInt(customerId, 10));
          query += ` AND l.UserID = @userId`;
        }

        query += ` ORDER BY l.ID DESC`;
        const res = await request.query(query);
        return res.recordset;
      } else {
        // Custom schema Licenses Query
        const request = pool.request();
        let query = `
          SELECT l.*, c.CompanyName, c.ContactName, c.Email as CustomerEmail, c.Country, p.ProductName, p.ProductCode, p.Edition
          FROM Licenses l
          JOIN Customers c ON l.CustomerID = c.CustomerID
          JOIN Products p ON l.ProductID = p.ProductID
          WHERE 1=1
        `;
        if (search) {
          request.input('search', sql.NVarChar, `%${search}%`);
          query += ` AND (l.ActivationKey LIKE @search OR c.CompanyName LIKE @search OR c.Email LIKE @search OR l.LicenseID LIKE @search)`;
        }
        if (status) {
          request.input('status', sql.NVarChar, status);
          query += ` AND l.Status = @status`;
        }
        if (productId) {
          request.input('productId', sql.Int, parseInt(productId, 10));
          query += ` AND l.ProductID = @productId`;
        }
        if (type) {
          request.input('type', sql.NVarChar, type);
          query += ` AND l.LicenseType = @type`;
        }
        if (customerId) {
          request.input('customerId', sql.NVarChar, customerId);
          query += ` AND l.CustomerID = @customerId`;
        }
        query += ` ORDER BY l.IssuedDate DESC`;
        const res = await request.query(query);
        return res.recordset;
      }
    } catch (err) {
      console.error('[EC2 DB Query Error] fetchLicenses:', err.message);
    }
  }

  // Simulation Fallback
  let list = memoryStore.licenses.map(lic => {
    const cust = memoryStore.customers.find(c => c.CustomerID === lic.CustomerID) || {};
    const prod = memoryStore.products.find(p => p.ProductID === lic.ProductID) || {};
    const numLicenses = lic.NumLicenses || lic.SeatsTotal || 1;
    const activatedCount = lic.ActivatedCount ?? (lic.SeatsUsed || 0);
    const notActivatedCount = lic.NotActivatedCount ?? (lic.AvailableLicenses ?? Math.max(0, numLicenses - activatedCount));
    return {
      ...lic,
      CompanyName: cust.CompanyName || 'Unknown Corp',
      ContactName: cust.ContactName || 'Unknown Contact',
      CustomerEmail: cust.Email || '',
      Country: cust.Country || 'Global',
      ProductName: prod.ProductName || 'QLM Product',
      ProductCode: prod.ProductCode || 'QLM',
      Edition: prod.Edition || 'Standard',
      LicenseModel: lic.LicenseModel || lic.LicenseType || 'Subscription',
      NumLicenses: numLicenses,
      AvailableLicenses: notActivatedCount,
      ActivatedCount: activatedCount,
      NotActivatedCount: notActivatedCount,
      SeatsTotal: numLicenses,
      SeatsUsed: activatedCount
    };
  });

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(l =>
      l.ActivationKey.toLowerCase().includes(s) ||
      String(l.LicenseID).toLowerCase().includes(s) ||
      l.CompanyName.toLowerCase().includes(s) ||
      l.CustomerEmail.toLowerCase().includes(s)
    );
  }
  if (status) {
    list = list.filter(l => l.Status.toLowerCase() === status.toLowerCase());
  }
  if (productId) {
    list = list.filter(l => l.ProductID === parseInt(productId, 10));
  }
  if (type) {
    list = list.filter(l => (l.LicenseModel || l.LicenseType).toLowerCase() === type.toLowerCase());
  }
  if (customerId) {
    list = list.filter(l => String(l.CustomerID) === String(customerId));
  }

  return list.sort((a, b) => new Date(b.IssuedDate) - new Date(a.IssuedDate));
}

export async function fetchLicenseById(licenseId) {
  await ensureDbConnected();
  if (isConnectedToEc2 && pool) {
    try {
      if (isNativeQlmDb) {
        const req = pool.request();
        req.input('idOrKey', sql.NVarChar, String(licenseId));
        const res = await req.query(`
          SELECT 
            l.ID as LicenseID,
            l.ActivationKey,
            l.ComputerKey,
            l.UserID as CustomerID,
            l.ProductID,
            ISNULL(p.ProductName, 'QLM Software') as ProductName,
            ISNULL(p.LatestVersion, 'v1.0') as ProductCode,
            ISNULL(p.Major, 'Standard') as Edition,
            ISNULL(NULLIF(c.Company, ''), ISNULL(NULLIF(c.FullName, ''), 'Independent')) as CompanyName,
            ISNULL(NULLIF(c.FullName, ''), 'N/A') as ContactName,
            c.Email as CustomerEmail,
            ISNULL(NULLIF(c.Country, ''), 'Global') as Country,
            CASE l.LicenseModel WHEN 1 THEN 'Permanent' WHEN 2 THEN 'Trial' WHEN 3 THEN 'Subscription' WHEN 4 THEN 'Floating' ELSE 'Subscription' END as LicenseModel,
            CASE l.LicenseModel WHEN 1 THEN 'Permanent' WHEN 2 THEN 'Trial' WHEN 3 THEN 'Subscription' WHEN 4 THEN 'Floating' ELSE 'Subscription' END as LicenseType,
            CASE WHEN l.Disabled = 1 THEN 'Revoked' WHEN l.SubscriptionExpiryDate < GETUTCDATE() THEN 'Expired' ELSE 'Active' END as Status,
            ISNULL(l.NumLicenses, 1) as NumLicenses,
            ISNULL(l.AvailableLicenses, 0) as AvailableLicenses,
            CASE WHEN ISNULL(l.NumLicenses, 1) > ISNULL(l.AvailableLicenses, 0) THEN ISNULL(l.NumLicenses, 1) - ISNULL(l.AvailableLicenses, 0) ELSE 0 END as ActivatedCount,
            ISNULL(l.AvailableLicenses, 0) as NotActivatedCount,
            ISNULL(l.NumLicenses, 1) as SeatsTotal,
            CASE WHEN ISNULL(l.NumLicenses, 1) > ISNULL(l.AvailableLicenses, 0) THEN ISNULL(l.NumLicenses, 1) - ISNULL(l.AvailableLicenses, 0) ELSE 0 END as SeatsUsed,
            ISNULL(l.OrderDate, l.CreationDate) as IssuedDate,
            l.SubscriptionExpiryDate as ExpiryDate,
            l.MaintenanceRenewalDate as MaintenanceExpiryDate,
            l.LastAccessedDate as LastCheckIn,
            l.Comment as Notes
          FROM LicenseKeys l
          LEFT JOIN Customers c ON l.UserID = c.ID
          LEFT JOIN Products p ON l.ProductID = p.ID
          WHERE l.ActivationKey = @idOrKey OR CAST(l.ID AS NVARCHAR) = @idOrKey
        `);

        if (res.recordset.length > 0) {
          const actRes = await pool.request()
            .input('actKey', sql.NVarChar, res.recordset[0].ActivationKey)
            .query(`
              SELECT 
                ID as ActivationID,
                ActivationKey as LicenseID,
                ISNULL(ComputerID, 'UNKNOWN') as MachineID,
                ISNULL(ComputerName, 'Client Host') as MachineName,
                ISNULL(ClientVersion, 'Windows') as OSVersion,
                IP_Address as IPAddress,
                ActivationDate as ActivatedAt,
                1 as IsActive
              FROM ActivationLog
              WHERE ActivationKey = @actKey
              ORDER BY ActivationDate DESC
            `);
          return { ...res.recordset[0], activations: actRes.recordset };
        }
      } else {
        const request = pool.request();
        request.input('licenseId', sql.NVarChar, licenseId);
        const res = await request.query(`
          SELECT l.*, c.CompanyName, c.ContactName, c.Email as CustomerEmail, c.Country, p.ProductName, p.ProductCode, p.Edition
          FROM Licenses l
          JOIN Customers c ON l.CustomerID = c.CustomerID
          JOIN Products p ON l.ProductID = p.ProductID
          WHERE l.LicenseID = @licenseId OR l.ActivationKey = @licenseId
        `);
        if (res.recordset.length > 0) {
          const actRes = await pool.request()
            .input('licenseId', sql.NVarChar, res.recordset[0].LicenseID)
            .query('SELECT * FROM Activations WHERE LicenseID = @licenseId ORDER BY ActivatedAt DESC');
          return { ...res.recordset[0], activations: actRes.recordset };
        }
      }
    } catch (err) {
      console.error('[EC2 DB Query Error] fetchLicenseById:', err.message);
    }
  }

  const lic = memoryStore.licenses.find(l => String(l.LicenseID) === String(licenseId) || l.ActivationKey === licenseId);
  if (!lic) return null;
  const cust = memoryStore.customers.find(c => c.CustomerID === lic.CustomerID) || {};
  const prod = memoryStore.products.find(p => p.ProductID === lic.ProductID) || {};
  const activations = memoryStore.activations.filter(a => a.LicenseID === lic.LicenseID);
  const numLicenses = lic.NumLicenses || lic.SeatsTotal || 1;
  const activatedCount = lic.ActivatedCount ?? (lic.SeatsUsed || 0);
  const notActivatedCount = lic.NotActivatedCount ?? (lic.AvailableLicenses ?? Math.max(0, numLicenses - activatedCount));

  return {
    ...lic,
    CompanyName: cust.CompanyName,
    ContactName: cust.ContactName,
    CustomerEmail: cust.Email,
    Country: cust.Country,
    ProductName: prod.ProductName,
    ProductCode: prod.ProductCode,
    Edition: prod.Edition,
    LicenseModel: lic.LicenseModel || lic.LicenseType || 'Subscription',
    NumLicenses: numLicenses,
    AvailableLicenses: notActivatedCount,
    ActivatedCount: activatedCount,
    NotActivatedCount: notActivatedCount,
    SeatsTotal: numLicenses,
    SeatsUsed: activatedCount,
    activations
  };
}

export async function insertLicense(licenseData) {
  await ensureDbConnected();
  const totalActivations = licenseData.NumLicenses || licenseData.SeatsTotal || 1;
  const modelStr = licenseData.LicenseModel || licenseData.LicenseType || 'Subscription';
  licenseData.NumLicenses = totalActivations;
  licenseData.AvailableLicenses = totalActivations;
  licenseData.ActivatedCount = 0;
  licenseData.NotActivatedCount = totalActivations;
  licenseData.LicenseModel = modelStr;
  licenseData.SeatsTotal = totalActivations;
  licenseData.SeatsUsed = 0;

  if (isConnectedToEc2 && pool) {
    try {
      if (isNativeQlmDb) {
        // Insert into Soraco QLM LicenseKeys table
        const req = pool.request();
        req.input('ActivationKey', sql.NVarChar, licenseData.ActivationKey);
        req.input('UserID', sql.Int, parseInt(licenseData.CustomerID || '1', 10));
        req.input('ProductID', sql.Int, parseInt(licenseData.ProductID || '1', 10));
        req.input('NumLicenses', sql.Int, totalActivations);
        req.input('AvailableLicenses', sql.Int, totalActivations);
        req.input('ExpiryDate', sql.DateTime, licenseData.ExpiryDate ? new Date(licenseData.ExpiryDate) : null);
        req.input('Comment', sql.NVarChar, licenseData.Notes || '');
        const modelMap = { 'Permanent': 1, 'Trial': 2, 'Subscription': 3, 'Floating': 4 };
        req.input('LicenseModel', sql.BigInt, modelMap[modelStr] || 3);

        const insertRes = await req.query(`
          INSERT INTO LicenseKeys (
            ActivationKey, UserID, ProductID, NumLicenses, AvailableLicenses,
            SubscriptionExpiryDate, Comment, LicenseModel, CreationDate, OrderDate, Disabled
          ) OUTPUT INSERTED.ID VALUES (
            @ActivationKey, @UserID, @ProductID, @NumLicenses, @AvailableLicenses,
            @ExpiryDate, @Comment, @LicenseModel, GETUTCDATE(), GETUTCDATE(), 0
          )
        `);
        licenseData.LicenseID = insertRes.recordset[0]?.ID || licenseData.LicenseID;
      } else {
        const req = pool.request();
        req.input('LicenseID', sql.NVarChar, licenseData.LicenseID);
        req.input('ActivationKey', sql.NVarChar, licenseData.ActivationKey);
        req.input('ComputerKey', sql.NVarChar, licenseData.ComputerKey || null);
        req.input('CustomerID', sql.NVarChar, licenseData.CustomerID);
        req.input('ProductID', sql.Int, licenseData.ProductID);
        req.input('LicenseType', sql.NVarChar, licenseData.LicenseType);
        req.input('Status', sql.NVarChar, licenseData.Status || 'Active');
        req.input('SeatsTotal', sql.Int, licenseData.SeatsTotal || 1);
        req.input('SeatsUsed', sql.Int, licenseData.SeatsUsed || 0);
        req.input('FeaturesMask', sql.BigInt, licenseData.FeaturesMask || 1);
        req.input('IssuedDate', sql.DateTime2, licenseData.IssuedDate || new Date());
        req.input('ExpiryDate', sql.DateTime2, licenseData.ExpiryDate || null);
        req.input('MaintenanceExpiryDate', sql.DateTime2, licenseData.MaintenanceExpiryDate || null);
        req.input('Notes', sql.NVarChar, licenseData.Notes || '');
        req.input('QlmResponseXml', sql.NVarChar, licenseData.QlmResponseXml || null);

        await req.query(`
          INSERT INTO Licenses (
            LicenseID, ActivationKey, ComputerKey, CustomerID, ProductID,
            LicenseType, Status, SeatsTotal, SeatsUsed, FeaturesMask,
            IssuedDate, ExpiryDate, MaintenanceExpiryDate, Notes, QlmResponseXml
          ) VALUES (
            @LicenseID, @ActivationKey, @ComputerKey, @CustomerID, @ProductID,
            @LicenseType, @Status, @SeatsTotal, @SeatsUsed, @FeaturesMask,
            @IssuedDate, @ExpiryDate, @MaintenanceExpiryDate, @Notes, @QlmResponseXml
          )
        `);
      }
    } catch (err) {
      console.error('[EC2 DB Query Error] insertLicense:', err.message);
    }
  }

  memoryStore.licenses.unshift(licenseData);
  return licenseData;
}

export async function updateLicenseStatus(licenseIdOrKey, newStatus, reason = '') {
  await ensureDbConnected();
  if (isConnectedToEc2 && pool) {
    try {
      if (isNativeQlmDb) {
        const req = pool.request();
        req.input('key', sql.NVarChar, String(licenseIdOrKey));
        req.input('reason', sql.NVarChar, reason || `Status changed to ${newStatus}`);

        if (newStatus === 'Revoked') {
          await req.query(`
            UPDATE LicenseKeys 
            SET Disabled = 1, Comment = CONCAT(ISNULL(Comment, ''), ' | Revoked: ', @reason)
            WHERE ActivationKey = @key OR CAST(ID AS NVARCHAR) = @key
          `);
        } else if (newStatus === 'Deactivated') {
          await req.query(`
            UPDATE LicenseKeys 
            SET AvailableLicenses = CASE WHEN AvailableLicenses < NumLicenses THEN AvailableLicenses + 1 ELSE AvailableLicenses END,
                Comment = CONCAT(ISNULL(Comment, ''), ' | Deactivated: ', @reason)
            WHERE ActivationKey = @key OR CAST(ID AS NVARCHAR) = @key
          `);
        }
      } else {
        const req = pool.request();
        req.input('idOrKey', sql.NVarChar, licenseIdOrKey);
        req.input('status', sql.NVarChar, newStatus);
        req.input('notes', sql.NVarChar, reason ? `Status changed to ${newStatus}: ${reason}` : `Status changed to ${newStatus}`);
        await req.query(`
          UPDATE Licenses
          SET Status = @status,
              Notes = CONCAT(ISNULL(Notes, ''), ' | ', @notes),
              UpdatedAt = GETUTCDATE()
          WHERE LicenseID = @idOrKey OR ActivationKey = @idOrKey
        `);
      }
    } catch (err) {
      console.error('[EC2 DB Query Error] updateLicenseStatus:', err.message);
    }
  }

  const idx = memoryStore.licenses.findIndex(l => String(l.LicenseID) === String(licenseIdOrKey) || l.ActivationKey === licenseIdOrKey);
  if (idx !== -1) {
    memoryStore.licenses[idx].Status = newStatus;
    return memoryStore.licenses[idx];
  }
  return null;
}

let cachedProducts = null;
let lastProductsFetchTime = 0;
const PRODUCTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchProducts() {
  if (cachedProducts && (Date.now() - lastProductsFetchTime < PRODUCTS_CACHE_TTL)) {
    return cachedProducts;
  }

  await ensureDbConnected();
  if (isConnectedToEc2 && pool) {
    try {
      if (isNativeQlmDb) {
        const res = await pool.request().query(`
          SELECT 
            ID as ProductID,
            ProductName,
            ISNULL(LatestVersion, 'v1.0') as ProductCode,
            1 as MajorVersion,
            0 as MinorVersion,
            'Standard' as Edition,
            ISNULL(Features, '') as Description,
            1 as IsActive
          FROM Products
          ORDER BY ID ASC
        `);
        cachedProducts = res.recordset;
        lastProductsFetchTime = Date.now();
        return res.recordset;
      } else {
        const res = await pool.request().query('SELECT * FROM Products ORDER BY ProductID ASC');
        cachedProducts = res.recordset;
        lastProductsFetchTime = Date.now();
        return res.recordset;
      }
    } catch (err) {
      console.error('[EC2 DB Query Error] fetchProducts:', err.message);
    }
  }
  return memoryStore.products;
}

export async function fetchAuditLogs(limit = 50) {
  await ensureDbConnected();
  if (isConnectedToEc2 && pool) {
    try {
      if (isNativeQlmDb) {
        const req = pool.request();
        req.input('limit', sql.Int, limit);
        const res = await req.query(`
          SELECT TOP (@limit)
            CAST(ID AS NVARCHAR) as LogID,
            CASE 
              WHEN EventCategory LIKE '%Activation%' THEN 'Activation'
              WHEN EventCategory LIKE '%Revoke%' THEN 'RevokeKey'
              WHEN EventCategory LIKE '%Release%' OR EventCategory LIKE '%Deactivate%' THEN 'DeactivateKey'
              ELSE 'CreateKey'
            END as Action,
            'License' as Entity,
            EventCategory as EntityID,
            ISNULL(EventOwner, 'System') as PerformedBy,
            EventDescription as Details,
            CASE WHEN EventCategory LIKE '%Failed%' THEN 'Failed' ELSE 'Success' END as Status,
            EventDate as Timestamp
          FROM AuditTrail
          ORDER BY ID DESC
        `);
        return res.recordset;
      } else {
        const res = await pool.request()
          .input('limit', sql.Int, limit)
          .query('SELECT TOP (@limit) * FROM AuditLogs ORDER BY Timestamp DESC');
        return res.recordset;
      }
    } catch (err) {
      console.error('[EC2 DB Query Error] fetchAuditLogs:', err.message);
    }
  }
  return memoryStore.auditLogs.slice(0, limit);
}

export async function recordAuditLog({ action, entity, entityId, performedBy = 'Dashboard Admin', details, status = 'Success' }) {
  const logItem = {
    LogID: `LOG-${Date.now().toString().slice(-6)}`,
    Action: action,
    Entity: entity,
    EntityID: entityId,
    PerformedBy: performedBy,
    Details: details,
    Status: status,
    Timestamp: new Date().toISOString()
  };

  if (isConnectedToEc2 && pool && !isNativeQlmDb) {
    try {
      const req = pool.request();
      req.input('LogID', sql.NVarChar, logItem.LogID);
      req.input('Action', sql.NVarChar, logItem.Action);
      req.input('Entity', sql.NVarChar, logItem.Entity);
      req.input('EntityID', sql.NVarChar, logItem.EntityID);
      req.input('PerformedBy', sql.NVarChar, logItem.PerformedBy);
      req.input('Details', sql.NVarChar, logItem.Details);
      req.input('Status', sql.NVarChar, logItem.Status);
      await req.query(`
        INSERT INTO AuditLogs (LogID, Action, Entity, EntityID, PerformedBy, Details, Status, Timestamp)
        VALUES (@LogID, @Action, @Entity, @EntityID, @PerformedBy, @Details, @Status, GETUTCDATE())
      `);
    } catch (err) {
      console.error('[EC2 DB Query Error] recordAuditLog:', err.message);
    }
  }

  memoryStore.auditLogs.unshift(logItem);
  return logItem;
}
