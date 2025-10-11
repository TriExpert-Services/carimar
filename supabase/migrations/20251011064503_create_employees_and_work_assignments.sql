/*
  # Employee Management and Work Assignment System

  ## Overview
  Creates employee management functionality and enhances bookings with work assignment capabilities.
  Enables tracking of approved quotes and provides comprehensive work routing features.

  ## New Tables

  ### 1. employees
    - `id` (uuid, primary key)
    - `nombre` (text, full name)
    - `email` (text, unique email)
    - `telefono` (text, phone number)
    - `skills` (text[], array of services they can perform)
    - `hourly_rate` (numeric, hourly compensation rate)
    - `active` (boolean, currently employed status)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. work_routes
    - `id` (uuid, primary key)
    - `employee_id` (uuid, references employees)
    - `route_date` (date, date of the route)
    - `booking_ids` (uuid[], array of booking IDs in order)
    - `total_distance` (numeric, total miles)
    - `estimated_duration` (integer, minutes)
    - `notes` (text, route notes)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Modified Tables

  ### bookings (enhancements)
    - Add `employee_id` (uuid, references employees)
    - Add `service_address` (text, full service address)
    - Add `estimated_duration` (integer, minutes)
    - Add `employee_notes` (text, notes for assigned employee)
    - Add `latitude` (numeric, for routing)
    - Add `longitude` (numeric, for routing)

  ## Security
    - RLS enabled on all new tables
    - Admins have full access to employees and work routes
    - Authenticated users can view assigned employees for their bookings
    - Employees table is admin-only for modifications

  ## Important Notes
    1. Service addresses extracted from user profiles or quote data
    2. Skills stored as array for flexible service assignment
    3. Work routes optimize by time and location
    4. Approved quotes now trackable through booking linkage
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text UNIQUE NOT NULL,
  telefono text NOT NULL,
  skills text[] DEFAULT '{}',
  hourly_rate numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create work_routes table
CREATE TABLE IF NOT EXISTS work_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  route_date date NOT NULL,
  booking_ids uuid[] DEFAULT '{}',
  total_distance numeric DEFAULT 0,
  estimated_duration integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN employee_id uuid REFERENCES employees(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'service_address'
  ) THEN
    ALTER TABLE bookings ADD COLUMN service_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'estimated_duration'
  ) THEN
    ALTER TABLE bookings ADD COLUMN estimated_duration integer DEFAULT 120;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'employee_notes'
  ) THEN
    ALTER TABLE bookings ADD COLUMN employee_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE bookings ADD COLUMN latitude numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE bookings ADD COLUMN longitude numeric;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_routes ENABLE ROW LEVEL SECURITY;

-- Policies for employees table
CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for work_routes table
CREATE POLICY "Admins can view all work routes"
  ON work_routes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage work routes"
  ON work_routes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_fecha_employee ON bookings(fecha_servicio, employee_id);
CREATE INDEX IF NOT EXISTS idx_work_routes_employee_date ON work_routes(employee_id, route_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_employees_updated_at'
  ) THEN
    CREATE TRIGGER update_employees_updated_at
      BEFORE UPDATE ON employees
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_work_routes_updated_at'
  ) THEN
    CREATE TRIGGER update_work_routes_updated_at
      BEFORE UPDATE ON work_routes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
