-- ============================================================================
-- QLM SORACO & EC2 MS SQL DATABASE SCHEMA
-- Compatible with Microsoft SQL Server 2017, 2019, 2022 on AWS EC2 Windows/Linux
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'QLM_LicenseManager')
BEGIN
    CREATE DATABASE QLM_LicenseManager;
END
GO

USE QLM_LicenseManager;
GO

-- 1. Customers Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
BEGIN
    CREATE TABLE Customers (
        CustomerID NVARCHAR(50) PRIMARY KEY,
        CompanyName NVARCHAR(150) NOT NULL,
        ContactName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(120) NOT NULL UNIQUE,
        Phone NVARCHAR(50),
        Country NVARCHAR(80) NOT NULL,
        City NVARCHAR(80),
        CustomerTier NVARCHAR(30) DEFAULT 'Standard', -- Standard, Enterprise, Strategic, VIP
        Status NVARCHAR(20) DEFAULT 'Active',         -- Active, Inactive, Suspended
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
END
GO

-- 2. Products Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE Products (
        ProductID INT PRIMARY KEY,
        ProductName NVARCHAR(100) NOT NULL,
        ProductCode NVARCHAR(50) NOT NULL,
        MajorVersion INT DEFAULT 1,
        MinorVersion INT DEFAULT 0,
        Edition NVARCHAR(50) DEFAULT 'Standard',
        Description NVARCHAR(255),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
END
GO

-- 3. Licenses Table (Synchronized with QLM Soraco License Keys)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Licenses')
BEGIN
    CREATE TABLE Licenses (
        LicenseID NVARCHAR(50) PRIMARY KEY,
        ActivationKey NVARCHAR(100) NOT NULL UNIQUE,
        ComputerKey NVARCHAR(100),
        CustomerID NVARCHAR(50) NOT NULL,
        ProductID INT NOT NULL,
        LicenseType NVARCHAR(40) DEFAULT 'Subscription', -- Permanent, Subscription, Trial, Floating
        Status NVARCHAR(30) DEFAULT 'Active',           -- Active, Expired, Revoked, Deactivated, Pending
        SeatsTotal INT DEFAULT 1,
        SeatsUsed INT DEFAULT 0,
        FeaturesMask BIGINT DEFAULT 1,
        IssuedDate DATETIME2 DEFAULT GETUTCDATE(),
        ExpiryDate DATETIME2,
        LastCheckIn DATETIME2,
        MaintenanceExpiryDate DATETIME2,
        Notes NVARCHAR(500),
        QlmResponseXml NVARCHAR(MAX),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Licenses_Customer FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
        CONSTRAINT FK_Licenses_Product FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
    );
END
GO

-- 4. Activations History Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Activations')
BEGIN
    CREATE TABLE Activations (
        ActivationID NVARCHAR(50) PRIMARY KEY,
        LicenseID NVARCHAR(50) NOT NULL,
        MachineID NVARCHAR(100) NOT NULL,
        MachineName NVARCHAR(100),
        OSVersion NVARCHAR(100),
        IPAddress NVARCHAR(50),
        ActivatedAt DATETIME2 DEFAULT GETUTCDATE(),
        DeactivatedAt DATETIME2 NULL,
        IsActive BIT DEFAULT 1,
        CONSTRAINT FK_Activations_License FOREIGN KEY (LicenseID) REFERENCES Licenses(LicenseID)
    );
END
GO

-- 5. Audit & Operation Logs Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    CREATE TABLE AuditLogs (
        LogID NVARCHAR(50) PRIMARY KEY,
        Action NVARCHAR(50) NOT NULL,          -- CreateKey, RevokeKey, DeactivateKey, RenewKey, EditCustomer
        Entity NVARCHAR(30) NOT NULL,          -- License, Customer, QLM_API
        EntityID NVARCHAR(100),
        PerformedBy NVARCHAR(100) DEFAULT 'Admin',
        Details NVARCHAR(MAX),
        Status NVARCHAR(20) DEFAULT 'Success', -- Success, Failed
        Timestamp DATETIME2 DEFAULT GETUTCDATE()
    );
END
GO

-- Indexes for lightning fast filtering in the Dashboard
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Licenses_Status')
    CREATE INDEX IX_Licenses_Status ON Licenses(Status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Licenses_CustomerID')
    CREATE INDEX IX_Licenses_CustomerID ON Licenses(CustomerID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Email')
    CREATE INDEX IX_Customers_Email ON Customers(Email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Licenses_ExpiryDate')
    CREATE INDEX IX_Licenses_ExpiryDate ON Licenses(ExpiryDate);
GO
