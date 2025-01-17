/*
  # Add buyer_id to campaigns table

  1. Changes
    - Add buyer_id column to campaigns table
    - Add foreign key constraint to test_users
    - Update policies to handle buyer ownership
*/

-- Add buyer_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'buyer_id'
  ) THEN
    ALTER TABLE campaigns 
    ADD COLUMN buyer_id uuid REFERENCES test_users(id);
  END IF;
END $$;

-- Drop existing campaign policies safely
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can create campaigns" ON campaigns;
  DROP POLICY IF EXISTS "Public can update campaigns" ON campaigns;
  DROP POLICY IF EXISTS "Public can delete campaigns" ON campaigns;
  DROP POLICY IF EXISTS "Public can view campaigns" ON campaigns;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies for campaigns
CREATE POLICY "Public can view campaigns"
  ON campaigns FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Buyers can create campaigns"
  ON campaigns FOR INSERT
  TO public
  WITH CHECK (buyer_id IN (SELECT id FROM test_users WHERE role = 'buyer'));

CREATE POLICY "Buyers can update their campaigns"
  ON campaigns FOR UPDATE
  TO public
  USING (buyer_id IN (SELECT id FROM test_users WHERE role = 'buyer'))
  WITH CHECK (buyer_id IN (SELECT id FROM test_users WHERE role = 'buyer'));

CREATE POLICY "Buyers can delete their campaigns"
  ON campaigns FOR DELETE
  TO public
  USING (buyer_id IN (SELECT id FROM test_users WHERE role = 'buyer'));

-- Update existing campaigns to set buyer_id
UPDATE campaigns 
SET buyer_id = '00000000-0000-0000-0000-000000000002'
WHERE buyer_id IS NULL;