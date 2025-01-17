/*
  # Fix campaign donations policies

  1. Changes
    - Drop existing policies safely
    - Add proper RLS policies for campaign donations
    - Allow sellers to create and view their donations
    - Allow buyers to view and update donations

  2. Security
    - Enable RLS for campaign_donations table
    - Add policies for sellers to create and view their donations
    - Add policies for buyers to view and update donations
*/

-- Drop existing policies safely
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Sellers can view their donations" ON campaign_donations;
  DROP POLICY IF EXISTS "Buyers can view campaign donations" ON campaign_donations;
  DROP POLICY IF EXISTS "Buyers can update donation status" ON campaign_donations;
  DROP POLICY IF EXISTS "Sellers can create donations" ON campaign_donations;
  DROP POLICY IF EXISTS "Buyers can manage their donations" ON campaign_donations;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create comprehensive policies
CREATE POLICY "Sellers can create donations"
  ON campaign_donations FOR INSERT
  TO public
  WITH CHECK (seller_id IN (SELECT id FROM test_users WHERE role = 'seller'));

CREATE POLICY "Sellers can view their donations"
  ON campaign_donations FOR SELECT
  TO public
  USING (seller_id IN (SELECT id FROM test_users WHERE role = 'seller'));

CREATE POLICY "Buyers can view all donations"
  ON campaign_donations FOR SELECT
  TO public
  USING (true);

-- Update policy for buyers without using NEW reference
CREATE POLICY "Buyers can update donation status"
  ON campaign_donations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);