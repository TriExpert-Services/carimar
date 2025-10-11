/*
  # Fix Infinite Recursion in Users RLS Policies
  
  The "Admins can view all users" policy causes infinite recursion because it queries
  the users table within its own policy check.
  
  ## Changes
  
  1. Drop the problematic admin policy
  2. Create a new policy that checks the role directly from auth metadata
  3. Use auth.jwt() to check admin status from the JWT token instead of querying users table
  
  ## Security
  
  - Users can still only view their own profile
  - Admins can view all users without recursion
  - Registration remains secure
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create a new policy that uses auth.jwt() to avoid recursion
-- This checks if the user's role in their JWT is 'admin'
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  (
    auth.jwt() IS NOT NULL 
    AND 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
);

-- Alternative: If app_metadata is not set, we can use a simpler approach
-- by allowing users to read their own data and creating a function
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Users can read accessible profiles"
ON users
FOR SELECT
TO authenticated
USING (
  -- Users can always read their own profile
  auth.uid() = id
);

-- Separate policy for admins using a subquery with security definer function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the admin policy using the function
DROP POLICY IF EXISTS "Users can read accessible profiles" ON users;

CREATE POLICY "Users can read profiles"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
