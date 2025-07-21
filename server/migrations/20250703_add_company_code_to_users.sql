-- Migration: Add company_code column to users table if it does not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_code TEXT;
