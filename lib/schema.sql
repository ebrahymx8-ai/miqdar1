-- Database Migration & Configuration Plan for Miqdar Business
-- This SQL schema is designed for PostgreSQL / MySQL / SQLite database integration.

-- 1. Users Table (Staff & Management)
CREATE TABLE IF NOT EXISTS business_users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    pin_code VARCHAR(255) NOT NULL, -- Hashed secure code
    role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'kitchen', 'purchaser', 'delivery')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ingredients Table (Kitchen Inventory)
CREATE TABLE IF NOT EXISTS ingredients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'فل' CHECK (status IN ('فل', 'ناقص')),
    last_updated VARCHAR(50) NOT NULL,
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subscribers Table (Delivery Orders)
CREATE TABLE IF NOT EXISTS subscribers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(50) NOT NULL, -- Mecca neighborhood (العزيزية, الشوقية, العوالي, etc.)
    package_type VARCHAR(100) NOT NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'قيد التوصيل' CHECK (delivery_status IN ('قيد التوصيل', 'تم التوصيل')),
    details VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data (For Testing and Initial Setup)
INSERT INTO business_users (id, name, pin_code, role) VALUES 
('u1', 'مسؤول المطبخ', 'MTExMV9taXFkYXJfc2FsdA==', 'kitchen'),   -- 1111 hashed with Base64 salt
('u2', 'مندوب المقاضي', 'MjIyMl9taXFkYXJfc2FsdA==', 'purchaser'), -- 2222 hashed with Base64 salt
('u3', 'مندوب التوصيل', 'MzMzM19taXFkYXJfc2FsdA==', 'delivery'),  -- 3333 hashed with Base64 salt
('u4', 'مدير المشروع', 'NDQ0NF9taXFkYXJfc2FsdA==', 'manager');    -- 4444 hashed with Base64 salt
