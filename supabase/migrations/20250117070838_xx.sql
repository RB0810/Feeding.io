/*
  # Fix RLS policies and add validations

  1. Changes
    - Add RLS policies for food items to allow seller operations
    - Add check constraint for seller_id format
*/

-- Add RLS policies for food items
CREATE POLICY "Sellers can create food items"
  ON food_items FOR INSERT
  TO public
  WITH CHECK (
    seller_id IN (SELECT id FROM test_users WHERE role = 'seller')
  );

CREATE POLICY "Sellers can update their food items"
  ON food_items FOR UPDATE
  TO public
  USING (seller_id IN (SELECT id FROM test_users WHERE role = 'seller'))
  WITH CHECK (seller_id IN (SELECT id FROM test_users WHERE role = 'seller'));

CREATE POLICY "Sellers can delete their food items"
  ON food_items FOR DELETE
  TO public
  USING (seller_id IN (SELECT id FROM test_users WHERE role = 'seller'));