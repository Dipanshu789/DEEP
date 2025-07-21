-- Migration: Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR PRIMARY KEY NOT NULL,
  sender_id VARCHAR NOT NULL,
  sender_name VARCHAR NOT NULL,
  sender_profile_image_url VARCHAR,
  message TEXT NOT NULL,
  "to" VARCHAR NOT NULL,
  timestamp TIMESTAMP NOT NULL
);
