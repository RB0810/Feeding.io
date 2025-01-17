/*
  # Add donation tracking features

  1. Changes
    - Add quantity field to campaign donations
    - Add test seller for different items
    - Update some food items and campaigns to use different accounts
*/

-- Create another test seller
INSERT INTO test_users (id, role)
SELECT 
  '00000000-0000-0000-0000-000000000003'::uuid, 'seller'
WHERE NOT EXISTS (
  SELECT 1 FROM test_users WHERE id = '00000000-0000-0000-0000-000000000003'::uuid
);

-- Update some food items to be from different seller
UPDATE food_items 
SET seller_id = '00000000-0000-0000-0000-000000000003'
WHERE name IN ('Fresh Fruit Bowl', 'Veggie Pasta');

-- Create another test buyer
INSERT INTO test_users (id, role)
SELECT 
  '00000000-0000-0000-0000-000000000004'::uuid, 'buyer'
WHERE NOT EXISTS (
  SELECT 1 FROM test_users WHERE id = '00000000-0000-0000-0000-000000000004'::uuid
);

-- Update some campaigns to be from different buyer
UPDATE campaigns 
SET buyer_id = '00000000-0000-0000-0000-000000000004'
WHERE title IN ('School Lunch Program', 'Senior Center Meals');