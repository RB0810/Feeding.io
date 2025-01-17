/*
  # Add order status management

  1. Changes
    - Add received status to cart_items
    - Add RLS policies for cart items
*/

-- Add check constraint for status values
ALTER TABLE cart_items
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'received'));

-- Add RLS policies for cart items
CREATE POLICY "Buyers can view their cart items"
  ON cart_items FOR SELECT
  TO public
  USING (buyer_id IN (SELECT id FROM test_users WHERE role = 'buyer'));

CREATE POLICY "Buyers can manage their cart items"
  ON cart_items FOR ALL
  TO public
  USING (buyer_id IN (SELECT id FROM test_users WHERE role = 'buyer'))
  WITH CHECK (buyer_id IN (SELECT id FROM test_users WHERE role = 'buyer'));