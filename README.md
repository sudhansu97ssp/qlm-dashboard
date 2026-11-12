# QLM Soraco & AWS EC2 MS SQL License Management Dashboard

An enterprise-grade **React** and **Node.js** dashboard featuring modern, sober **Material Design 3**, direct integration with **Soraco Quick License Manager (QLM) Web Service APIs**, and Microsoft SQL Server hosted on an **AWS EC2 instance**.

---

## 🌟 Key Features

### 1. Modern & Sober Material Design
- Built with **Material UI (MUI v6)**, React 19, and Vite.
- Curated sober enterprise palette (Slate Navy, Crisp White, Subtle Borders, Pastel Status Pills).
- Fully responsive navigation with smooth transitions, KPI cards, and data tables.

### 2. AWS EC2 MS SQL Database Integration
- Direct querying via official `mssql` driver to Microsoft SQL Server on AWS EC2 (port 1433).
- Tables managed: `Customers`, `Licenses`, `Products`, `Activations`, and `AuditLogs`.
- Advanced multi-criteria filters:
  - **Customers**: Search (Name/Email/Company), Country, Customer Tier (Strategic/Enterprise/Standard), Status (Active/Suspended).
  - **Licenses**: Search (Key/ID/Customer), Status (Active/Trial/Expired/Deactivated/Revoked), Product catalog, and License Type.
- **Smart Simulation Fallback**: If the EC2 instance is not yet connected or offline, the dashboard seamlessly loads in high-fidelity simulation mode with realistic global enterprise records so you can test immediately.

### 3. QLM Soraco API Lifecycle Controls
- **Create License Key**: Calls QLM Soraco `GetActivationKey` with customer data, product version, seats, expiry date, and features bitmask.
- **Deactivate License Key**: Calls QLM Soraco `ReleaseLicense` / `DeactivateLicense` to free activation slots.
- **Revoke License Key**: Calls QLM Soraco `RevokeLicense` with justification logs.
- **Direct Web Service Inspector**: View raw XML response envelopes and activation machine binding history.
- **QLM & EC2 Setup Hub**: Test server connectivity and socket latency directly from the UI.

### 4. Executive Analytics Telemetry
- **KPI Metrics**: Active Licenses, Total Customers, 30-Day Expiry Alerts, Seat Utilization Rate.
- **Visual Recharts Telemetry**:
  - Area Chart: 6-Month License Issuance & Machine Activations.
  - Donut Chart: Status distribution (Active, Expired, Deactivated, Revoked).
  - Bar Chart: Product portfolio adoption.
  - Renewal Attention Queue with urgent expiry countdowns.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 10+

### 1. Install Dependencies
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 2. Start Both Server & Client
```bash
# Runs Express Backend (Port 5000) and React Vite Frontend (Port 5173) concurrently
npm run dev
```

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## ⚙️ Configuration

### 1. AWS EC2 MS SQL Database Setup
Configure your EC2 connection either in the UI under **"QLM & EC2 Setup"** or in `server/.env`:

```env
# AWS EC2 MS SQL Credentials
MSSQL_HOST=54.210.xx.xx          # Your EC2 Public IP or DNS
MSSQL_PORT=1433
MSSQL_DATABASE=QLM_LicenseManager
MSSQL_USER=sa
MSSQL_PASSWORD=YourStrongPassword!
MSSQL_ENCRYPT=false
MSSQL_TRUST_SERVER_CERT=true
```

To create the tables in your EC2 MS SQL Server, execute the script located in:
`server/src/database/schema.sql`

### 2. QLM Soraco Web Service Configuration
Set your organization's QLM server credentials in `server/.env` or in the dashboard settings:

```env
# Soraco QLM Web Service
QLM_SERVICE_URL=https://qlm3.net/yourorg/qlmLicenseServer/qlmservice.asmx
QLM_ADMIN_ENCRYPTION_KEY={B2967657-CEE5-4C8D-9817-A1734D8A6ED7}
QLM_COMMUNICATION_KEY={3F82C3D1-72A0-4C96-A5DF-0D76F87C5D41}
QLM_VENDOR=Soraco QLM Enterprise
QLM_PRODUCT_ID=1
QLM_MAJOR_VERSION=17
QLM_MINOR_VERSION=0
```

---

## 📁 Project Architecture

```
d:/QLM Dashboard/
├── package.json              # Monorepo root script coordinator (concurrently)
├── README.md                 # Project documentation & configuration guide
│
├── server/                   # Node.js + Express Backend
│   ├── .env                  # Live environment variables
│   ├── .env.example          # Sample environment config
│   ├── package.json          # Express, mssql, axios, xml2js, morgan
│   └── src/
│       ├── index.js          # Server entry & route registration
│       ├── config/
│       │   └── env.js        # Environment and credential loader
│       ├── database/
│       │   ├── schema.sql    # Production MS SQL DDL script for EC2
│       │   ├── seedData.js   # Enterprise seed data
│       │   └── db.js         # Unified mssql pool & simulation fallback
│       ├── services/
│       │   ├── qlmService.js # QLM Soraco SOAP/REST Web Service API client
│       │   └── analyticsService.js # KPI & chart aggregation metrics
│       └── routes/
│           ├── analytics.js  # /api/analytics/dashboard
│           ├── customers.js  # /api/customers (with filtering)
│           ├── licenses.js   # /api/licenses (create, deactivate, revoke)
│           └── config.js     # /api/config (test & save EC2 / QLM settings)
│
└── client/                   # React 19 + Vite Frontend
    ├── package.json          # React 19, @mui/material, recharts, lucide-react
    ├── vite.config.js        # Vite dev server + proxy to backend
    ├── index.html            # HTML entry with Inter & Roboto fonts
    └── src/
        ├── index.css         # Sober Material design tokens & variables
        ├── theme.js          # Sober Material UI theme configuration
        ├── main.jsx          # Entry point with ThemeProvider & CssBaseline
        ├── App.jsx           # Master layout & state management
        ├── services/
        │   └── api.js        # Axios API client functions
        ├── components/
        │   ├── Navbar.jsx    # Top app bar with sync & create CTA
        │   ├── Sidebar.jsx   # Enterprise navigation with system health
        │   ├── StatCard.jsx  # KPI metric cards with trends
        │   ├── StatusBadge.jsx # Sober status pill chips
        │   ├── ConnectionBanner.jsx # Live EC2 / QLM status banner
        │   ├── LicenseModal.jsx # Create QLM License Wizard
        │   ├── LicenseDetailModal.jsx # License Inspector with activations
        │   └── ConfirmActionDialog.jsx # Deactivate/Revoke confirmation
        └── views/
            ├── AnalyticsView.jsx   # KPIs, Recharts area/donut/bar charts
            ├── CustomersView.jsx   # EC2 MS SQL Customers with filters
            ├── LicensesView.jsx    # License Manager, CSV export, filters
            ├── ConfigView.jsx      # EC2 MS SQL & QLM Soraco Setup Hub
            └── AuditLogsView.jsx   # Security & operation audit trail
```
