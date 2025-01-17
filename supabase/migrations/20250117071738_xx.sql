/*
  # Update campaign donations tracking

  1. Changes
    - Add buyer_id column to campaign_donations table
    - Update RLS policies for campaign donations

  2. Security
    - Add policies for buyers to manage donations
*/

-- Add buyer_id column to campaign_donations
ALTER TABLE campaign_donations 
ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES test_users(id);

-- Update RLS policies
CREATE POLICY "Buyers can manage their donations"
  ON campaign_donations FOR UPDATE
  TO public
  USING (buyer_id IN (SELECT id FROM test_users WHERE role = 'buyer'))
  WITH CHECK (buyer_id IN (SELECT id FROM test_users WHERE role = 'buyer'));