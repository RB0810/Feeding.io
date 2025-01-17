/*
  # Update campaign donations tracking

  1. Changes
    - Add status column to campaign_donations table
    - Add RLS policies for campaign donations viewing and updating
    - Ensure policies don't conflict with existing ones

  2. Security
    - Add policies for sellers to view their donations
    - Add policies for buyers to view and update donations
*/

-- Add status column to campaign_donations if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaign_donations' AND column_name = 'status'
  ) THEN
    ALTER TABLE campaign_donations 
    ADD COLUMN status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'received'));
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Attempt to drop existing policies
  DROP POLICY IF EXISTS "Sellers can view their donations" ON campaign_donations;
  DROP POLICY IF EXISTS "Buyers can view campaign donations" ON campaign_donations;
  DROP POLICY IF EXISTS "Buyers can update donation status" ON campaign_donations;
EXCEPTION
  WHEN undefined_object THEN
    NULL;  -- Ignore if policies don't exist
END $$;

-- Create new policies
CREATE POLICY "Sellers can view their donations"
  ON campaign_donations FOR SELECT
  TO public
  USING (seller_id IN (SELECT id FROM test_users WHERE role = 'seller'));

CREATE POLICY "Buyers can view campaign donations"
  ON campaign_donations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Buyers can update donation status"
  ON campaign_donations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);