/*
  # Fix Users Role Constraint to Include Employee Role

  ## Overview
  Updates the users table role constraint to include 'employee' as a valid role.
  This fixes the constraint violation error when creating employee users.

  ## Problem
  The initial schema defined a CHECK constraint that only allowed:
  - 'admin'
  - 'client' 
  - 'guest'

  However, employee functionality was added later, and the application code
  attempts to create users with role 'employee', which violates the constraint.

  ## Solution
  Drop the existing constraint and create a new one that includes 'employee'.

  ## Changes
  1. Drop existing users_role_check constraint
  2. Add new constraint that includes all four roles: admin, client, guest, employee

  ## Security
  - No changes to RLS policies needed
  - Existing policies already handle employee role correctly
  - No data migration required

  ## Notes
  - This is a non-breaking change
  - Existing data remains unchanged
  - Only allows new role value to be used
*/

-- Drop the existing role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that includes employee role
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'client', 'guest', 'employee'));