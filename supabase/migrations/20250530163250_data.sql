-- Insert data into the customer table
INSERT INTO customer (
  email, 
  phone, 
  password_hash, 
  full_name, 
  sex_identify, 
  login_type, 
  google_id, 
  is_email_verified, 
  is_phone_verified, 
  status, 
  update_at, 
  create_at
) VALUES 
  (
    'john.doe@example.com',
    '+12025550123',
    '$2b$10$exampleHashForJohn', -- Example bcrypt hash
    'John Doe',
    'Male',
    'email',
    NULL,
    TRUE,
    FALSE,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'jane.smith@example.com',
    '+12025550124',
    '$2b$10$exampleHashForJane', -- Example bcrypt hash
    'Jane Smith',
    'Female',
    'google',
    'google123456789',
    TRUE,
    TRUE,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'alex.wilson@example.com',
    '+12025550125',
    '$2b$10$exampleHashForAlex', -- Example bcrypt hash
    'Alex Wilson',
    'Non-binary',
    'email',
    NULL,
    FALSE,
    TRUE,
    'pending',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

-- Insert data into the refreshtoken table
INSERT INTO refreshtoken (
  customer_id,
  token,
  expires_at,
  is_revoked,
  created_at
) VALUES 
  (
    (SELECT customer_id FROM customer WHERE email = 'john.doe@example.com'),
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.john', -- Example JWT token
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    FALSE,
    CURRENT_TIMESTAMP
  ),
  (
    (SELECT customer_id FROM customer WHERE email = 'jane.smith@example.com'),
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.jane', -- Example JWT token
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    FALSE,
    CURRENT_TIMESTAMP
  ),
  (
    (SELECT customer_id FROM customer WHERE email = 'alex.wilson@example.com'),
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.alex', -- Example JWT token
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    TRUE, -- Example of a revoked token
    CURRENT_TIMESTAMP
  );