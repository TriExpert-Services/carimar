/*
  # Fix Users INSERT Policy to Allow Admin Employee Creation

  ## Overview
  Updates the users table INSERT policy to allow admins to create user accounts
  for employees while maintaining security for self-registration.

  ## Problem
  Current policy: `WITH CHECK (auth.uid() = id)`
  This only allows users to create their own profiles during registration.
  When an admin tries to create an employee account, the INSERT fails because:
  - The new user's ID (authData.user.id) is NOT equal to the admin's ID (auth.uid())
  - RLS blocks the INSERT operation

  ## Solution
  Create a new INSERT policy that allows:
  1. Self-registration: Users can insert their own profile (auth.uid() = id)
  2. Admin creation: Admins can create user accounts for others (employees)

  ## Security Considerations
  - Non-admin users can only create their own profiles
  - Admins can create profiles for others (employees)
  - Policy prevents privilege escalation by checking existing admin role
  - No recursion issues because we use a simple SELECT query

  ## Changes
  1. Drop existing "Allow user registration" policy
  2. Create new policy with admin exception
  3. Maintain backward compatibility for self-registration

  ## Testing
  - Verify admin can create employee accounts
  - Verify users can still self-register
  - Verify non-admins cannot create accounts for others
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can create own profile during signup" ON users;

-- Create new policy that allows both self-registration and admin-created accounts
CREATE POLICY "Allow user registration and admin creation"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow self-registration (user creating their own profile)
    auth.uid() = id
    OR
    -- Allow admins to create user accounts for others (employees)
    (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Allow user registration and admin creation" ON users IS 
  'Allows users to self-register and admins to create employee accounts';
