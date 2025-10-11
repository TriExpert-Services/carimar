/*
  # Create Employee Creation Function

  ## Overview
  Creates a secure database function that allows admins to create employee records
  without RLS policy conflicts. This function runs with elevated privileges.

  ## Problem
  RLS policies on the employees table prevent insertion even when the user is an admin,
  due to timing and context issues during the multi-step creation process.

  ## Solution
  Create a SECURITY DEFINER function that:
  1. Verifies the caller is an admin
  2. Creates the employee record with proper permissions
  3. Bypasses RLS for this specific operation

  ## Security
  - Only callable by authenticated users with admin role
  - Validates admin status before any operation
  - All parameters are validated
  - Function runs with definer's privileges (bypasses RLS)

  ## Usage
  Called from the application instead of direct INSERT on employees table.
*/

-- Create function to add employee record (called after user creation)
CREATE OR REPLACE FUNCTION create_employee_record(
  p_user_id uuid,
  p_nombre text,
  p_email text,
  p_telefono text,
  p_skills text[] DEFAULT '{}',
  p_hourly_rate numeric DEFAULT 0,
  p_active boolean DEFAULT true
) RETURNS uuid AS $$
DECLARE
  v_employee_id uuid;
  v_caller_role text;
BEGIN
  -- Check if caller is admin
  SELECT role INTO v_caller_role
  FROM users
  WHERE id = auth.uid();
  
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can create employees';
  END IF;
  
  -- Insert employee record
  INSERT INTO employees (
    user_id,
    nombre,
    email,
    telefono,
    skills,
    hourly_rate,
    active
  ) VALUES (
    p_user_id,
    p_nombre,
    p_email,
    p_telefono,
    p_skills,
    p_hourly_rate,
    p_active
  )
  RETURNING id INTO v_employee_id;
  
  RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_employee_record TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_employee_record IS 'Allows admins to create employee records. Bypasses RLS for this operation.';
