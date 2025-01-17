/*
  # Add dummy data

  1. New Data
    - Add sample food items from different sellers
    - Add sample campaigns
    - Add sample campaign donations

  2. Changes
    - Insert test data for demonstration purposes
*/

-- Insert sample food items
INSERT INTO food_items (name, description, price, original_price, quantity, fresh_until, seller_id)
VALUES
  ('Fresh Baked Bread', 'Artisanal sourdough bread, baked today', 3.99, 7.99, 5, NOW() + INTERVAL '2 days', '00000000-0000-0000-0000-000000000001'),
  ('Organic Salad Mix', 'Mixed greens with cherry tomatoes', 2.49, 4.99, 8, NOW() + INTERVAL '1 day', '00000000-0000-0000-0000-000000000001'),
  ('Chicken Sandwich', 'Grilled chicken with lettuce and mayo', 4.99, 8.99, 3, NOW() + INTERVAL '1 day', '00000000-0000-0000-0000-000000000001'),
  ('Fresh Fruit Bowl', 'Assorted seasonal fruits', 3.99, 6.99, 4, NOW() + INTERVAL '1 day', '00000000-0000-0000-0000-000000000001'),
  ('Veggie Pasta', 'Penne with mixed vegetables', 5.99, 11.99, 6, NOW() + INTERVAL '2 days', '00000000-0000-0000-0000-000000000001');

-- Insert sample campaigns
INSERT INTO campaigns (title, description, item_needed, quantity_needed, quantity_received)
VALUES
  ('Feed the Homeless', 'Help us provide meals to the homeless', 'Sandwich', 50, 20),
  ('School Lunch Program', 'Support local school lunch program', 'Fruit Bowl', 100, 45),
  ('Senior Center Meals', 'Provide meals for senior citizens', 'Hot Meal', 75, 30),
  ('Food Bank Drive', 'Stock local food bank', 'Non-perishable Items', 200, 85);

-- Insert sample campaign donations
INSERT INTO campaign_donations (campaign_id, seller_id, quantity)
SELECT 
  c.id,
  '00000000-0000-0000-0000-000000000001',
  20
FROM campaigns c
WHERE c.title = 'Feed the Homeless';