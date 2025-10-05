/*
  # Fix User Registration for Anonymous Users

  1. Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows anonymous (anon) users to register
    - Allow users to insert their own profile where auth.uid() matches the id

  2. Security
    - Anonymous users can insert records where id = auth.uid()
    - This is safe because auth.uid() comes from JWT token during signup
    - Users cannot insert records for other users

  3. Notes
    - During Supabase signup, the user is authenticated with a temporary token
    - The auth.uid() function returns the user's ID from this token
*/

DROP POLICY IF EXISTS "Users can create own profile during signup" ON users;

CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);
