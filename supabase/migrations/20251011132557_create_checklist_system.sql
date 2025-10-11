/*
  # Create Checklist System
  
  This migration creates a comprehensive checklist system for tracking service requirements
  and completion across the entire workflow (quote -> assignment -> completion).
  
  ## New Tables
  
  ### `checklist_templates`
  Templates for different types of cleaning services with frequency categories.
  - `id` (uuid, primary key)
  - `service_type` (text) - Type of service this template applies to
  - `frequency` (text) - 'everyday', 'weekly', 'monthly', or 'all'
  - `room_type` (text) - Kitchen, Living Room, Bedroom, Bathroom, Entry, etc.
  - `name_en` (text) - Template name in English
  - `name_es` (text) - Template name in Spanish
  - `active` (boolean) - Whether template is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `checklist_items`
  Individual checklist items that belong to templates.
  - `id` (uuid, primary key)
  - `template_id` (uuid, foreign key to checklist_templates)
  - `name_en` (text) - Item name in English
  - `name_es` (text) - Item name in Spanish
  - `description_en` (text) - Item description in English
  - `description_es` (text) - Item description in Spanish
  - `order_index` (integer) - Order of item in checklist
  - `is_required` (boolean) - Whether item is mandatory
  - `created_at` (timestamptz)
  
  ### `quote_checklist_selections`
  Stores which checklist items a client selected when requesting a quote.
  - `id` (uuid, primary key)
  - `quote_id` (uuid, foreign key to quotes)
  - `checklist_item_id` (uuid, foreign key to checklist_items)
  - `selected` (boolean) - Whether client selected this item
  - `notes` (text) - Additional notes from client
  - `created_at` (timestamptz)
  
  ### `booking_checklist_completion`
  Tracks completion status of checklist items by employees during work.
  - `id` (uuid, primary key)
  - `booking_id` (uuid, foreign key to bookings)
  - `checklist_item_id` (uuid, foreign key to checklist_items)
  - `completed` (boolean) - Whether item was completed
  - `completed_at` (timestamptz) - When item was completed
  - `employee_notes` (text) - Employee notes about completion
  - `quality_rating` (integer) - Self-assessment rating 1-5
  - `created_at` (timestamptz)
  
  ### `booking_photos`
  Stores before/after photos for bookings.
  - `id` (uuid, primary key)
  - `booking_id` (uuid, foreign key to bookings)
  - `photo_type` (text) - 'before' or 'after'
  - `photo_url` (text) - URL to photo in Supabase Storage
  - `room_area` (text) - Which room/area the photo shows
  - `uploaded_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  
  ### `booking_locations`
  Stores GPS coordinates for start and end of work.
  - `id` (uuid, primary key)
  - `booking_id` (uuid, foreign key to bookings)
  - `location_type` (text) - 'start' or 'end'
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `recorded_at` (timestamptz)
  - `accuracy` (numeric) - GPS accuracy in meters
  - `created_at` (timestamptz)
  
  ## Security
  
  All tables have RLS enabled with appropriate policies for admins, employees, and clients.
*/

-- Create checklist_templates table
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('everyday', 'weekly', 'monthly', 'all')),
  room_type text NOT NULL,
  name_en text NOT NULL,
  name_es text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checklist templates"
  ON checklist_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view active templates"
  ON checklist_templates FOR SELECT
  TO authenticated
  USING (active = true);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES checklist_templates(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_es text NOT NULL,
  description_en text,
  description_es text,
  order_index integer DEFAULT 0,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checklist items"
  ON checklist_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view checklist items"
  ON checklist_items FOR SELECT
  TO authenticated
  USING (true);

-- Create quote_checklist_selections table
CREATE TABLE IF NOT EXISTS quote_checklist_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  checklist_item_id uuid REFERENCES checklist_items(id) ON DELETE CASCADE,
  selected boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quote_checklist_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their quote checklist selections"
  ON quote_checklist_selections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_checklist_selections.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all quote checklist selections"
  ON quote_checklist_selections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create booking_checklist_completion table
CREATE TABLE IF NOT EXISTS booking_checklist_completion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  checklist_item_id uuid REFERENCES checklist_items(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  employee_notes text,
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_checklist_completion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can manage checklist for their bookings"
  ON booking_checklist_completion FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN employees ON employees.id = bookings.employee_id
      WHERE bookings.id = booking_checklist_completion.booking_id
      AND employees.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all booking checklist completions"
  ON booking_checklist_completion FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Clients can view checklist for their bookings"
  ON booking_checklist_completion FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_checklist_completion.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Create booking_photos table
CREATE TABLE IF NOT EXISTS booking_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after')),
  photo_url text NOT NULL,
  room_area text,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can upload photos for their bookings"
  ON booking_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN employees ON employees.id = bookings.employee_id
      WHERE bookings.id = booking_photos.booking_id
      AND employees.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Everyone involved can view booking photos"
  ON booking_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_photos.booking_id
      AND (
        bookings.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
        OR EXISTS (
          SELECT 1 FROM employees
          WHERE employees.id = bookings.employee_id
          AND employees.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Admins can delete booking photos"
  ON booking_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create booking_locations table
CREATE TABLE IF NOT EXISTS booking_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  location_type text NOT NULL CHECK (location_type IN ('start', 'end')),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  recorded_at timestamptz DEFAULT now(),
  accuracy numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can record locations for their bookings"
  ON booking_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN employees ON employees.id = bookings.employee_id
      WHERE bookings.id = booking_locations.booking_id
      AND employees.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all booking locations"
  ON booking_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Employees can view their booking locations"
  ON booking_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN employees ON employees.id = bookings.employee_id
      WHERE bookings.id = booking_locations.booking_id
      AND employees.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create storage bucket for booking photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-photos', 'booking-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for booking photos bucket
CREATE POLICY "Authenticated users can upload booking photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'booking-photos');

CREATE POLICY "Public can view booking photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'booking-photos');

CREATE POLICY "Admins can delete booking photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'booking-photos'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default checklist templates based on the image provided

-- EVERYDAY tasks
INSERT INTO checklist_templates (service_type, frequency, room_type, name_en, name_es, active) VALUES
('Residential Cleaning', 'everyday', 'Kitchen', 'Kitchen Daily Tasks', 'Tareas Diarias de Cocina', true),
('Residential Cleaning', 'everyday', 'Living Room', 'Living Room Daily Tasks', 'Tareas Diarias de Sala', true),
('Residential Cleaning', 'everyday', 'Bedroom', 'Bedroom Daily Tasks', 'Tareas Diarias de Dormitorio', true),
('Residential Cleaning', 'everyday', 'Bathroom', 'Bathroom Daily Tasks', 'Tareas Diarias de Baño', true),
('Residential Cleaning', 'everyday', 'Entry', 'Entry Daily Tasks', 'Tareas Diarias de Entrada', true),
('Residential Cleaning', 'everyday', 'General', 'General Daily Tasks', 'Tareas Diarias Generales', true);

-- Get template IDs for everyday tasks
DO $$
DECLARE
  kitchen_everyday_id uuid;
  living_everyday_id uuid;
  bedroom_everyday_id uuid;
  bathroom_everyday_id uuid;
  entry_everyday_id uuid;
  general_everyday_id uuid;
BEGIN
  SELECT id INTO kitchen_everyday_id FROM checklist_templates WHERE room_type = 'Kitchen' AND frequency = 'everyday';
  SELECT id INTO living_everyday_id FROM checklist_templates WHERE room_type = 'Living Room' AND frequency = 'everyday';
  SELECT id INTO bedroom_everyday_id FROM checklist_templates WHERE room_type = 'Bedroom' AND frequency = 'everyday';
  SELECT id INTO bathroom_everyday_id FROM checklist_templates WHERE room_type = 'Bathroom' AND frequency = 'everyday';
  SELECT id INTO entry_everyday_id FROM checklist_templates WHERE room_type = 'Entry' AND frequency = 'everyday';
  SELECT id INTO general_everyday_id FROM checklist_templates WHERE room_type = 'General' AND frequency = 'everyday';

  -- Kitchen everyday items
  INSERT INTO checklist_items (template_id, name_en, name_es, order_index, is_required) VALUES
  (kitchen_everyday_id, 'Clean kitchen table', 'Limpiar mesa de cocina', 1, true),
  (kitchen_everyday_id, 'Wipe down sink and counters', 'Limpiar fregadero y mostradores', 2, true),
  (kitchen_everyday_id, 'Vacuum and/or mop', 'Aspirar y/o trapear', 3, true),
  (kitchen_everyday_id, 'Wipe down appliances', 'Limpiar electrodomésticos', 4, true);

  -- Living Room everyday items
  INSERT INTO checklist_items (template_id, name_en, name_es, order_index, is_required) VALUES
  (living_everyday_id, 'Pick up clutter', 'Recoger desorden', 1, true),
  (living_everyday_id, 'Vacuum and/or mop', 'Aspirar y/o trapear', 2, true),
  (living_everyday_id, 'Wash blankets', 'Lavar cobijas', 3, false),
  (living_everyday_id, 'Dust surfaces', 'Quitar polvo de superficies', 4, true);

  -- Bedroom everyday items
  INSERT INTO checklist_items (template_id, name_en, name_es, order_index, is_required) VALUES
  (bedroom_everyday_id, 'Put away clothes/pick up', 'Guardar ropa/recoger', 1, true),
  (bedroom_everyday_id, 'Dust surfaces', 'Quitar polvo de superficies', 2, true),
  (bedroom_everyday_id, 'Wash bedding', 'Lavar ropa de cama', 3, false),
  (bedroom_everyday_id, 'Vacuum and/or mop', 'Aspirar y/o trapear', 4, true);

  -- Bathroom everyday items
  INSERT INTO checklist_items (template_id, name_en, name_es, order_index, is_required) VALUES
  (bathroom_everyday_id, 'Sanitize toilet', 'Desinfectar inodoro', 1, true),
  (bathroom_everyday_id, 'Vacuum and/or mop', 'Aspirar y/o trapear', 2, true),
  (bathroom_everyday_id, 'Wash shower, sink and mirrors', 'Lavar ducha, lavabo y espejos', 3, true),
  (bathroom_everyday_id, 'Wash towels and mats', 'Lavar toallas y tapetes', 4, false);

  -- Entry everyday items
  INSERT INTO checklist_items (template_id, name_en, name_es, order_index, is_required) VALUES
  (entry_everyday_id, 'Sanitize doorknobs', 'Desinfectar perillas de puertas', 1, true),
  (entry_everyday_id, 'Dust surfaces', 'Quitar polvo de superficies', 2, true),
  (entry_everyday_id, 'Vacuum and/or mop', 'Aspirar y/o trapear', 3, true),
  (entry_everyday_id, 'Put away shoes/coats/hats', 'Guardar zapatos/abrigos/sombreros', 4, true);

  -- General everyday items
  INSERT INTO checklist_items (template_id, name_en, name_es, order_index, is_required) VALUES
  (general_everyday_id, 'One load of laundry', 'Una carga de lavandería', 1, false),
  (general_everyday_id, 'Dishes', 'Platos', 2, true),
  (general_everyday_id, 'Make beds', 'Hacer camas', 3, true),
  (general_everyday_id, 'Spray countertops', 'Rociar mostradores', 4, true),
  (general_everyday_id, 'Pick up clutter', 'Recoger desorden', 5, true),
  (general_everyday_id, 'Sort mail', 'Ordenar correo', 6, false),
  (general_everyday_id, 'Trash', 'Basura', 7, true);
END $$;

-- MONTHLY tasks
INSERT INTO checklist_templates (service_type, frequency, room_type, name_en, name_es, active) VALUES
('Residential Cleaning', 'monthly', 'Kitchen', 'Kitchen Monthly Tasks', 'Tareas Mensuales de Cocina', true),
('Residential Cleaning', 'monthly', 'Living Room', 'Living Room Monthly Tasks', 'Tareas Mensuales de Sala', true),
('Residential Cleaning', 'monthly', 'General', 'General Monthly Tasks', 'Tareas Mensuales Generales', true);

DO $$
DECLARE
  kitchen_monthly_id uuid;
  living_monthly_id uuid;
  general_monthly_id uuid;
BEGIN
  SELECT id INTO kitchen_monthly_id FROM checklist_templates WHERE room_type = 'Kitchen' AND frequency = 'monthly';
  SELECT id INTO living_monthly_id FROM checklist_templates WHERE room_type = 'Living Room' AND frequency = 'monthly';
  SELECT id INTO general_monthly_id FROM checklist_templates WHERE room_type = 'General' AND frequency = 'monthly';

  -- Kitchen monthly items
  INSERT INTO checklist_items (template_id, name_en, name_es, order_index, is_required) VALUES
  (kitchen_monthly_id, 'Dust ceiling fans', 'Quitar polvo de ventiladores de techo', 1, false),
  (kitchen_monthly_id, 'Clean microwave', 'Limpiar microondas', 2, true),
  (kitchen_monthly_id, 'Clean inside of fridge', 'Limpiar interior del refrigerador', 3, true),
  (kitchen_monthly_id, 'Wash windows', 'Lavar ventanas', 4, false),
  (kitchen_monthly_id, 'Pick up garage', 'Limpiar garaje', 5, false),
  (kitchen_monthly_id, 'Pick up basement', 'Limpiar sótano', 6, false),
  (kitchen_monthly_id, 'Dust/clean baseboards', 'Quitar polvo/limpiar zócalos', 7, true),
  (kitchen_monthly_id, 'Dust curtains', 'Quitar polvo de cortinas', 8, false);

  -- Living Room monthly items  
  INSERT INTO checklist_items (template_id, name_en, name_es, order_index, is_required) VALUES
  (living_monthly_id, 'Clean off table', 'Limpiar mesa', 1, true),
  (living_monthly_id, 'Vacuum and/or mop', 'Aspirar y/o trapear', 2, true),
  (living_monthly_id, 'Dust surfaces', 'Quitar polvo de superficies', 3, true),
  (living_monthly_id, 'Pick up clutter', 'Recoger desorden', 4, true);

  -- General monthly items (Sunday tasks)
  INSERT INTO checklist_items (template_id, name_en, name_es, order_index, is_required) VALUES
  (general_monthly_id, 'Clean out fridge', 'Limpiar refrigerador', 1, true),
  (general_monthly_id, 'Meal plan', 'Planificar comidas', 2, false),
  (general_monthly_id, 'Grocery shop/fill gas tank', 'Comprar comestibles/llenar tanque de gasolina', 3, false),
  (general_monthly_id, 'Meal prep', 'Preparar comidas', 4, false);
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_template_id ON checklist_items(template_id);
CREATE INDEX IF NOT EXISTS idx_quote_checklist_quote_id ON quote_checklist_selections(quote_id);
CREATE INDEX IF NOT EXISTS idx_booking_checklist_booking_id ON booking_checklist_completion(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_photos_booking_id ON booking_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_locations_booking_id ON booking_locations(booking_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_service_frequency ON checklist_templates(service_type, frequency);
