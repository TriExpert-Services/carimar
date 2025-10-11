/*
  # Fix Employees RLS Policies to Prevent Recursion

  ## Overview
  Fixes potential RLS recursion issues when admins create employees by using
  a more direct approach to check admin privileges.

  ## Problem
  The current RLS policies check the users table which can cause recursion
  or timing issues during employee creation.

  ## Solution
  Drop and recreate the INSERT policy to use a simpler, more direct check
  that avoids potential recursion issues.

  ## Changes
  1. Drop existing "Admins can insert employees" policy
  2. Create new policy that checks role more efficiently
  
  ## Security
  - Maintains same security level (only admins can insert)
  - Uses direct role check to avoid recursion
  - No change to data access patterns
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Admins can insert employees" ON employees;

-- Recreate with a simpler check that avoids recursion
CREATE POLICY "Admins can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Also update the other admin policies to use the same pattern for consistency
DROP POLICY IF EXISTS "Admins can view all employees" ON employees;
CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can update employees" ON employees;
CREATE POLICY "Admins can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can delete employees" ON employees;
CREATE POLICY "Admins can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Keep the employee self-access policies as they are
-- "Employees can view their own record" - already correct
-- "Employees can update their own profile" - already correct