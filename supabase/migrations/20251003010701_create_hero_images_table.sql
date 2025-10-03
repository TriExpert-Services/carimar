/*
  # Create hero_images table for rotating hero section images

  1. New Tables
    - `hero_images`
      - `id` (uuid, primary key) - Unique identifier for each image
      - `image_url` (text) - URL of the image from Pexels or other source
      - `alt_text` (text) - Alternative text for accessibility
      - `position` (integer) - Position in the grid (1-4 for the 4 card slots)
      - `active` (boolean) - Whether the image is currently active/visible
      - `created_at` (timestamptz) - When the image was added
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `hero_images` table
    - Add policy for public read access (images are public)
    - Add policy for authenticated admins to manage images

  3. Initial Data
    - Insert initial set of hero images for all 4 positions
*/

CREATE TABLE IF NOT EXISTS hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text NOT NULL,
  position integer NOT NULL CHECK (position >= 1 AND position <= 4),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hero images"
  ON hero_images
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can insert hero images"
  ON hero_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update hero images"
  ON hero_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete hero images"
  ON hero_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insert initial hero images for each position
INSERT INTO hero_images (image_url, alt_text, position) VALUES
  ('https://images.pexels.com/photos/6197119/pexels-photo-6197119.jpeg?auto=compress&cs=tinysrgb&w=600', 'Professional cleaning supplies', 1),
  ('https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=600', 'Clean modern home', 3),
  ('https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=600', 'Spotless kitchen', 1),
  ('https://images.pexels.com/photos/4239031/pexels-photo-4239031.jpeg?auto=compress&cs=tinysrgb&w=600', 'Fresh bathroom', 3),
  ('https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=600', 'Organized living space', 1),
  ('https://images.pexels.com/photos/4099467/pexels-photo-4099467.jpeg?auto=compress&cs=tinysrgb&w=600', 'Professional window cleaning', 3);