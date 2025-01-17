/*
  # Update campaign policies

  1. Changes
    - Add policy to allow public to create campaigns
    - Add policy to allow public to update campaigns
    - Add policy to allow public to delete campaigns

  2. Security
    - Maintain existing public read access
    - Add write access for campaigns
*/

-- Update campaign policies to allow public write access
CREATE POLICY "Public can create campaigns"
  ON campaigns FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update campaigns"
  ON campaigns FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete campaigns"
  ON campaigns FOR DELETE
  TO public
  USING (true);