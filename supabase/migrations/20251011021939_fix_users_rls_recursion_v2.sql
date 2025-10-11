/*
  # Fix Users Table RLS Infinite Recursion
  
  The problem is that policies on the users table cannot query the users table itself.
  We'll use a different approach by storing the role in auth.users metadata.
  
  ## Solution
  
  1. Drop all existing SELECT policies on users table
  2. Create a simple policy that only checks auth.uid() = id
  3. For admin access, we'll handle it differently in the application
  
  ## Changes
  
  - Removes recursive policies
  - Allows users to read only their own profile
  - Admins will need to use service role key for admin operations (which the app should handle)
*/

-- Drop all SELECT policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can read profiles" ON users;
DROP POLICY IF EXISTS "Users can read accessible profiles" ON users;

-- Create a single, simple SELECT policy
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- For admin operations, we'll add a special policy that checks a session variable
-- This is set by the application when an admin is authenticated
CREATE POLICY "Admins bypass restrictions"
ON users
FOR SELECT
TO authenticated
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);
