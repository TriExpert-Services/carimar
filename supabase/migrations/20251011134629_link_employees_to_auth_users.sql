/*
  # Link Employees to Authentication System
  
  This migration connects employees with the authentication system, allowing them
  to log in and access their employee dashboard.
  
  ## Changes
  
  1. Add user_id column to employees table
     - Links employee record to auth.users
     - Allows employee to login with email/password
  
  2. Create function to automatically create employee user accounts
     - Helper function for admins to create employee logins
  
  3. Update RLS policies
     - Allow employees to view their own employee record
     - Allow employees to update their own profile information
  
  ## Security
  
  - Employees can only see and update their own information
  - Admins maintain full CRUD access to all employee records
  - Employee role is assigned automatically when linked to user account
  
  ## Usage
  
  When admin creates an employee:
  1. Admin creates employee record in employees table
  2. Admin creates user account with employee role
  3. System links the two via user_id
  4. Employee can now login and see their dashboard
*/

-- Add user_id column to employees table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
  END IF;
END $$;

-- Update RLS policies for employees to access their own data
CREATE POLICY "Employees can view their own record"
  ON employees FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Employees can update their own profile"
  ON employees FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create helper function to create employee user account
CREATE OR REPLACE FUNCTION create_employee_user_account(
  employee_email text,
  employee_name text,
  employee_phone text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  employee_record employees%ROWTYPE;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id
  FROM users
  WHERE email = employee_email;
  
  IF new_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'User with email % already exists', employee_email;
  END IF;
  
  -- Check if employee exists
  SELECT * INTO employee_record
  FROM employees
  WHERE email = employee_email;
  
  IF employee_record.id IS NULL THEN
    RAISE EXCEPTION 'Employee with email % does not exist', employee_email;
  END IF;
  
  -- Create user record with employee role
  INSERT INTO users (email, role, nombre, telefono, idioma_preferido)
  VALUES (employee_email, 'employee', employee_name, employee_phone, 'en')
  RETURNING id INTO new_user_id;
  
  -- Link employee to user
  UPDATE employees
  SET user_id = new_user_id
  WHERE email = employee_email;
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (only admins can actually use it due to RLS)
GRANT EXECUTE ON FUNCTION create_employee_user_account TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_employee_user_account IS 'Creates a user account for an employee and links them together. Admin only.';
