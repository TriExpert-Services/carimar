/*
  # Fix User Registration Policy

  1. Changes
    - Add INSERT policy for users table to allow new user registration
    - Allow authenticated users to create their own user profile during signup

  2. Security
    - Users can only insert their own profile (auth.uid() = id)
    - Maintains security by ensuring users cannot create profiles for others
*/

-- Add policy to allow user registration (INSERT)
CREATE POLICY "Users can create own profile during signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
