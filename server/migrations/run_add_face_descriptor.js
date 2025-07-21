// Node.js script to add face_descriptor column to users table
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_tlkR5IO8KZiq@ep-shiny-hall-a8klpxcz-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    // Ensure face_descriptor column exists
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS face_descriptor text;');
    // Ensure company_code column exists and is varchar(255)
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS company_code varchar(255);');
    await client.query('ALTER TABLE users ALTER COLUMN company_code TYPE varchar(255) USING company_code::varchar(255);');
    await client.query('ALTER TABLE users ALTER COLUMN company_code DROP DEFAULT;');

    // Create messages table for chat functionality
    await client.query(`CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR PRIMARY KEY NOT NULL,
      sender_id VARCHAR NOT NULL,
      sender_name VARCHAR NOT NULL,
      sender_profile_image_url VARCHAR,
      message TEXT NOT NULL,
      "to" VARCHAR NOT NULL,
      timestamp TIMESTAMP NOT NULL
    );`);
    console.log('Migration successful: face_descriptor, company_code columns, and messages table added/fixed.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
