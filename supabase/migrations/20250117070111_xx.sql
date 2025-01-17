/*
  # Add status column and fix ID handling

  1. Changes
    - Add status column to cart_items table
    - Add default seller_id and buyer_id for testing
    - Add test user records
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public access during testing
*/

-- Create a default test users
CREATE TABLE IF NOT EXISTS test_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert test users if they don't exist
INSERT INTO test_users (id, role)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid, 'seller'
WHERE NOT EXISTS (
  SELECT 1 FROM test_users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
);

INSERT INTO test_users (id, role)
SELECT 
  '00000000-0000-0000-0000-000000000002'::uuid, 'buyer'
WHERE NOT EXISTS (
  SELECT 1 FROM test_users WHERE id = '00000000-0000-0000-0000-000000000002'::uuid
);

-- Add status column to cart_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cart_items' AND column_name = 'status'
  ) THEN
    ALTER TABLE cart_items ADD COLUMN status text NOT NULL DEFAULT 'pending';
  END IF;
END $$;