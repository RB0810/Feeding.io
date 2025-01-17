/*
  # Initial Schema for Feeding.io

  1. New Tables
    - `food_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (decimal)
      - `original_price` (decimal)
      - `quantity` (integer)
      - `fresh_until` (timestamptz)
      - `seller_id` (uuid)
      - `created_at` (timestamptz)
      
    - `campaigns`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `item_needed` (text)
      - `quantity_needed` (integer)
      - `quantity_received` (integer)
      - `created_at` (timestamptz)
      
    - `campaign_donations`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, references campaigns)
      - `seller_id` (uuid)
      - `quantity` (integer)
      - `created_at` (timestamptz)
      
    - `cart_items`
      - `id` (uuid, primary key)
      - `food_item_id` (uuid, references food_items)
      - `buyer_id` (uuid)
      - `quantity` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since auth is not implemented yet)
*/

-- Food Items Table
CREATE TABLE food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal NOT NULL,
  original_price decimal NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  fresh_until timestamptz NOT NULL,
  seller_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Campaigns Table
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  item_needed text NOT NULL,
  quantity_needed integer NOT NULL,
  quantity_received integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Campaign Donations Table
CREATE TABLE campaign_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Cart Items Table
CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id uuid REFERENCES food_items ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Temporary public policies (until auth is implemented)
CREATE POLICY "Public can view food items"
  ON food_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view campaigns"
  ON campaigns FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view campaign donations"
  ON campaign_donations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage cart items"
  ON cart_items FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);