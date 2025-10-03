/*
  # CARIMAR SERVICES LLC - Initial Database Schema

  ## Overview
  Complete database schema for cleaning services platform with bilingual support,
  quote management, booking system, payment processing, and admin/client portals.

  ## New Tables

  ### 1. users (extends auth.users)
    - `id` (uuid, primary key, references auth.users)
    - `email` (text, unique)
    - `role` (text: 'admin', 'client', 'guest')
    - `nombre` (text, full name)
    - `telefono` (text, phone number)
    - `direccion` (text, address)
    - `idioma_preferido` (text: 'en' or 'es')
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. services
    - `id` (uuid, primary key)
    - `nombre_en` (text, English name)
    - `nombre_es` (text, Spanish name)
    - `descripcion_en` (text, English description)
    - `descripcion_es` (text, Spanish description)
    - `precio_base` (numeric, base price)
    - `precio_por_sqft` (numeric, price per square foot)
    - `icono` (text, icon name)
    - `activo` (boolean, active status)
    - `created_at` (timestamptz)

  ### 3. quotes
    - `id` (uuid, primary key)
    - `user_id` (uuid, references users)
    - `tipo_servicio` (text, service type)
    - `tipo_propiedad` (text: 'residential' or 'commercial')
    - `metros_cuadrados` (integer, square footage)
    - `habitaciones` (integer, bedrooms)
    - `banos` (integer, bathrooms)
    - `frecuencia` (text: 'once', 'weekly', 'biweekly', 'monthly')
    - `fecha_preferida` (date, preferred date)
    - `hora_preferida` (text, preferred time)
    - `precio_estimado` (numeric, estimated price)
    - `precio_final` (numeric, final price)
    - `estado` (text: 'pending', 'approved', 'rejected', 'completed')
    - `notas_cliente` (text, client notes)
    - `notas_admin` (text, admin notes)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 4. bookings
    - `id` (uuid, primary key)
    - `quote_id` (uuid, references quotes)
    - `user_id` (uuid, references users)
    - `fecha_servicio` (date, service date)
    - `hora_servicio` (text, service time)
    - `estado` (text: 'confirmed', 'in_progress', 'completed', 'cancelled')
    - `precio_final` (numeric, final price)
    - `metodo_pago` (text: 'stripe', 'google_pay', 'apple_pay')
    - `pago_completado` (boolean, payment completed)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 5. payments
    - `id` (uuid, primary key)
    - `booking_id` (uuid, references bookings)
    - `user_id` (uuid, references users)
    - `monto` (numeric, amount)
    - `metodo_pago` (text: 'stripe', 'google_pay', 'apple_pay')
    - `stripe_payment_id` (text, Stripe payment intent ID)
    - `estado` (text: 'pending', 'completed', 'failed', 'refunded')
    - `created_at` (timestamptz)

  ### 6. testimonials
    - `id` (uuid, primary key)
    - `user_id` (uuid, references users, nullable)
    - `nombre` (text, name)
    - `calificacion` (integer, rating 1-5)
    - `comentario` (text, comment)
    - `aprobado` (boolean, approved by admin)
    - `foto_url` (text, photo URL)
    - `created_at` (timestamptz)

  ### 7. gallery
    - `id` (uuid, primary key)
    - `titulo` (text, title)
    - `descripcion` (text, description)
    - `tipo_servicio` (text, service type)
    - `antes_url` (text, before photo URL)
    - `despues_url` (text, after photo URL)
    - `visible` (boolean, visible on site)
    - `created_at` (timestamptz)

  ## Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Users can only view/edit their own data
  - Admins have full access to all data
  - Public can view approved testimonials and visible gallery items

  ## Notes
  1. Uses UUID for all primary keys
  2. Timestamps use timestamptz for timezone awareness
  3. All monetary values use numeric type for precision
  4. Bilingual content stored in separate columns (_en, _es)
  5. Status fields use text enums for flexibility
*/

-- Create users table extending auth.users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client', 'guest')),
  nombre text NOT NULL,
  telefono text,
  direccion text,
  idioma_preferido text DEFAULT 'en' CHECK (idioma_preferido IN ('en', 'es')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_en text NOT NULL,
  nombre_es text NOT NULL,
  descripcion_en text NOT NULL,
  descripcion_es text NOT NULL,
  precio_base numeric NOT NULL DEFAULT 0,
  precio_por_sqft numeric NOT NULL DEFAULT 0,
  icono text NOT NULL DEFAULT 'Sparkles',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tipo_servicio text NOT NULL,
  tipo_propiedad text NOT NULL CHECK (tipo_propiedad IN ('residential', 'commercial')),
  metros_cuadrados integer NOT NULL,
  habitaciones integer,
  banos integer,
  frecuencia text NOT NULL CHECK (frecuencia IN ('once', 'weekly', 'biweekly', 'monthly')),
  fecha_preferida date,
  hora_preferida text,
  precio_estimado numeric NOT NULL,
  precio_final numeric,
  estado text NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'approved', 'rejected', 'completed')),
  notas_cliente text,
  notas_admin text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  fecha_servicio date NOT NULL,
  hora_servicio text NOT NULL,
  estado text NOT NULL DEFAULT 'confirmed' CHECK (estado IN ('confirmed', 'in_progress', 'completed', 'cancelled')),
  precio_final numeric NOT NULL,
  metodo_pago text CHECK (metodo_pago IN ('stripe', 'google_pay', 'apple_pay')),
  pago_completado boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  monto numeric NOT NULL,
  metodo_pago text NOT NULL CHECK (metodo_pago IN ('stripe', 'google_pay', 'apple_pay')),
  stripe_payment_id text,
  estado text NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  calificacion integer NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario text NOT NULL,
  aprobado boolean DEFAULT false,
  foto_url text,
  created_at timestamptz DEFAULT now()
);

-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  tipo_servicio text NOT NULL,
  antes_url text NOT NULL,
  despues_url text NOT NULL,
  visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for services table
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  TO anon, authenticated
  USING (activo = true);

CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for quotes table
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND estado = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all quotes"
  ON quotes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for bookings table
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for payments table
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for testimonials table
CREATE POLICY "Anyone can view approved testimonials"
  ON testimonials FOR SELECT
  TO anon, authenticated
  USING (aprobado = true);

CREATE POLICY "Users can create testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own testimonials"
  ON testimonials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all testimonials"
  ON testimonials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for gallery table
CREATE POLICY "Anyone can view visible gallery items"
  ON gallery FOR SELECT
  TO anon, authenticated
  USING (visible = true);

CREATE POLICY "Admins can manage gallery"
  ON gallery FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_estado ON quotes(estado);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_fecha_servicio ON bookings(fecha_servicio);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- Insert default services with competitive Tampa FL pricing
INSERT INTO services (nombre_en, nombre_es, descripcion_en, descripcion_es, precio_base, precio_por_sqft, icono, activo) VALUES
  ('Residential Cleaning', 'Limpieza Residencial', 'Professional home cleaning service', 'Servicio profesional de limpieza de hogar', 100, 0.15, 'Home', true),
  ('Commercial Cleaning', 'Limpieza Comercial', 'Professional business cleaning service', 'Servicio profesional de limpieza comercial', 150, 0.12, 'Building2', true),
  ('Deep Cleaning', 'Limpieza Profunda', 'Thorough deep cleaning service', 'Servicio de limpieza profunda exhaustiva', 200, 0.20, 'Sparkles', true),
  ('Post-Construction Cleaning', 'Limpieza Post-Construcción', 'Specialized post-construction cleanup', 'Limpieza especializada post-construcción', 300, 0.25, 'HardHat', true),
  ('Window Cleaning', 'Limpieza de Ventanas', 'Professional window cleaning', 'Limpieza profesional de ventanas', 80, 0.05, 'Square', true),
  ('Carpet Cleaning', 'Limpieza de Alfombras', 'Deep carpet cleaning service', 'Servicio de limpieza profunda de alfombras', 120, 0.18, 'Layers', true),
  ('Office Cleaning', 'Limpieza de Oficinas', 'Regular office cleaning service', 'Servicio regular de limpieza de oficinas', 500, 0.10, 'Briefcase', true)
ON CONFLICT DO NOTHING;
