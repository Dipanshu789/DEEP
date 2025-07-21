-- Migration: Fix company_code column type and nullability for users table
ALTER TABLE users
  ALTER COLUMN company_code TYPE varchar(255) USING company_code::varchar(255),
  ALTER COLUMN company_code DROP DEFAULT;
-- Optionally, uncomment the next line to enforce NOT NULL if all users have a company_code
-- ALTER TABLE users ALTER COLUMN company_code SET NOT NULL;
