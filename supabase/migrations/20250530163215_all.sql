-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creating the user table with UUID primary key
CREATE TABLE customer (
  customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(15) UNIQUE,
  password_hash VARCHAR(255),
  full_name TEXT,
  sex_identify VARCHAR(100),
  login_type VARCHAR(100),
  google_id VARCHAR(100),
  is_email_verified BOOLEAN,
  is_phone_verified BOOLEAN,
  status VARCHAR(50),
  update_at TIMESTAMP,
  create_at TIMESTAMP
);

-- Creating the refreshtoken table with UUID foreign key
CREATE TABLE refreshtoken (
  refreshtoken_id SERIAL PRIMARY KEY,
  customer_id UUID NOT NULL,
  token TEXT,
  expires_at TIMESTAMP,
  is_revoked BOOLEAN,
  created_at TIMESTAMP,
  CONSTRAINT fk_refreshtoken_user_id
    FOREIGN KEY (customer_id)
    REFERENCES customer(customer_id)
);

-- Enable RLS on customer table
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own customer data
CREATE POLICY customer_select_own ON customer
FOR SELECT
USING (auth.uid() = customer_id);

-- Policy: Allow authenticated users to update their own customer data
CREATE POLICY customer_update_own ON customer
FOR UPDATE
USING (auth.uid() = customer_id);

-- Policy: Allow insertion for authenticated users (for registration)
CREATE POLICY customer_insert ON customer
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Enable RLS on refreshtoken table
ALTER TABLE refreshtoken ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to manage their own refresh tokens
CREATE POLICY refreshtoken_manage_own ON refreshtoken
FOR ALL
USING (auth.uid() = customer_id);