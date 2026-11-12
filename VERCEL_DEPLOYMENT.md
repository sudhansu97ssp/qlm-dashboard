# Vercel Deployment Guide - QLM Enterprise License Dashboard

This repository is fully configured for zero-configuration, seamless deployment on **Vercel** with full-stack capabilities:
- **Frontend**: Vite + React Single-Page Application (SPA) built to `client/dist`.
- **Backend**: Express REST API running as a serverless function via `api/index.js`.
- **Database**: Global connection pooling to AWS EC2 MS SQL Server with serverless container reuse.
- **Routing**: `vercel.json` rewrites all `/api/*` traffic to the serverless function and falls back all client routes to `index.html`.

---

## 🚀 One-Click Deploy / Git Push Method (Recommended)

### Step 1: Push Repository to GitHub / GitLab / Bitbucket
Ensure all code and configurations are pushed to your remote repository:
```bash
git add .
git commit -m "Configure frontend and backend for Vercel deployment"
git push origin main
```

### Step 2: Import into Vercel
1. Log in to [vercel.com](https://vercel.com) and click **"Add New..."** ➔ **"Project"**.
2. Select your git repository (`QLM Dashboard` or your repo name).
3. Vercel will automatically read `vercel.json`:
   - **Framework Preset**: Other (or Vite)
   - **Build Command**: `npm run build` (Runs `npm --prefix client install && npm --prefix client run build`)
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables
In the Vercel project creation screen (or under **Settings ➔ Environment Variables**), add the following environment variables:

| Variable Name | Value | Purpose |
|---------------|-------|---------|
| `NODE_ENV` | `production` | Production environment mode |
| `MSSQL_HOST` | `65.1.64.25` | AWS EC2 MS SQL Server IP / Host |
| `MSSQL_PORT` | `1433` | MS SQL Server TCP Port |
| `MSSQL_DATABASE` | `qlm_db` | Live database name |
| `MSSQL_USER` | `ncircleadmin` | Database username |
| `MSSQL_PASSWORD` | `XzSaWq@12345` | Database password |
| `MSSQL_ENCRYPT` | `false` | Disable TLS encryption if self-signed |
| `MSSQL_TRUST_SERVER_CERT` | `true` | Trust EC2 self-signed certificate |
| `QLM_SERVICE_URL` | `https://license.ncircletech.com/nCircle/qlmLicenseServer/qlmservice.asmx` | QLM Soraco Web Service |
| `QLM_ADMIN_ENCRYPTION_KEY` | `{B2967657-CEE5-4C8D-9817-A1734D8A6ED7}` | Soraco Admin Encryption Key |
| `QLM_COMMUNICATION_KEY` | `{3F82C3D1-72A0-4C96-A5DF-0D76F87C5D41}` | Soraco Communication Key |
| `QLM_VENDOR` | `ncircletech` | Vendor identifier |
| `QLM_PRODUCT_ID` | `1` | Product ID |
| `QLM_MAJOR_VERSION` | `17` | Major Version |
| `QLM_MINOR_VERSION` | `0` | Minor Version |
| `ADMIN_EMAIL` | `admin@ncircletech.com` | Dashboard Administrator email |
| `ADMIN_PASSWORD` | `Admin@12345` | Dashboard Administrator password |
| `JWT_SECRET` | `qlm-enterprise-dashboard-secret-key-2026` | Secret key for JWT signing & verification |
| `JWT_EXPIRES_IN` | `7d` | Token session validity |

> ⚠️ **Important Security Group Note**: Ensure your AWS EC2 Security Group allows inbound TCP traffic on port `1433` from Vercel's IP ranges (or `0.0.0.0/0` with strong password authentication).

### Step 4: Click "Deploy"
Vercel will:
1. Run `npm install` at root (installing express, mssql, etc.).
2. Execute `npm run build` (installing client deps and compiling Vite assets to `client/dist`).
3. Bundle `api/index.js` as an AWS Lambda serverless function.
4. Assign a production URL: `https://your-project.vercel.app`.

---

## 💻 Alternative: Deploying via Vercel CLI

If you have the Vercel CLI installed:
```bash
# 1. Install Vercel CLI globally (if not installed)
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy preview
vercel

# 4. Deploy to production
vercel --prod
```

---

## 🛠️ How It Works Under the Hood

```
                       User Request
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
      Static Assets / SPA           /api/* Routes
               │                         │
      Served from client/dist     Rewritten by vercel.json
               │                         │
         React 19 App                    ▼
                                  api/index.js
                                         │
                             Express Serverless Function
                             (server/src/app.js)
                                         │
                      ┌──────────────────┴──────────────────┐
                      ▼                                     ▼
             AWS EC2 MS SQL Server                 QLM Soraco ASMX API
         (Pooled TCP / 65.1.64.25:1433)      (https://license.ncircletech.com)
```

1. **Serverless Connection Caching**:
   `server/src/database/db.js` caches the SQL connection pool on `global._mssqlPool`. This avoids reconnecting to MS SQL on every request, keeping query latency under 150ms.
2. **Dual-Route Compatibility**:
   `server/src/app.js` mounts the API router at both `/api` and `/`. Whether Vercel passes the original URI or a rewritten path, all endpoints (`/api/analytics/dashboard`, `/api/licenses`, `/api/customers`, etc.) match automatically.
3. **SPA Catch-All**:
   `vercel.json` routes non-API URLs to `/index.html`, ensuring page reloads on any client view will never 404.
4. **Local Development Untouched**:
   Running `npm run dev` or `npm run server` continues to start the local development server without needing Vercel.
