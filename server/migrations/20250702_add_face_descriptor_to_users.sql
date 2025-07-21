-- Add face_descriptor column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_descriptor text;
