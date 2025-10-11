/*
  # Create Gallery Storage Buckets
  
  Creates storage buckets for gallery before and after images with proper security policies.
  
  1. Storage Buckets
    - `gallery-images` - Single bucket for all gallery images (before and after)
  
  2. Security Policies
    - Public read access for all images in the bucket
    - Authenticated admin users can upload, update, and delete images
    - Images are organized with prefixes: 'before/' and 'after/'
*/

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete gallery images" ON storage.objects;

-- Allow public to view all images in the gallery bucket
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery-images');

-- Allow authenticated admin users to upload images
CREATE POLICY "Admins can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-images' 
  AND (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
);

-- Allow authenticated admin users to update images
CREATE POLICY "Admins can update gallery images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery-images' 
  AND (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
);

-- Allow authenticated admin users to delete images
CREATE POLICY "Admins can delete gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-images' 
  AND (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
);
