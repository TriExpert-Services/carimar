/*
  # Create Orders and Invoices System

  ## Overview
  Complete system for AI Agent order creation, Stripe payments, and invoice generation.

  ## New Tables
  
  ### 1. `orders`
  - `id` (uuid, primary key)
  - `booking_id` (uuid, references bookings) - Optional link to booking
  - `client_id` (uuid, references users)
  - `service_type` (text) - Type of service
  - `service_address` (text) - Where service will be performed
  - `service_date` (timestamptz) - Scheduled date
  - `service_time` (text) - Time slot
  - `status` (text) - pending, confirmed, in_progress, completed, cancelled
  - `total_amount` (numeric) - Total price
  - `payment_status` (text) - unpaid, paid, refunded
  - `payment_intent_id` (text) - Stripe payment intent ID
  - `special_instructions` (text) - Client notes
  - `created_by_agent` (boolean) - Whether created by AI agent
  - `agent_session_id` (text) - AI Agent session identifier
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `order_items`
  - `id` (uuid, primary key)
  - `order_id` (uuid, references orders)
  - `service_name` (text)
  - `description` (text)
  - `quantity` (integer)
  - `unit_price` (numeric)
  - `subtotal` (numeric)
  - `created_at` (timestamptz)

  ### 3. `invoices`
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - Auto-generated invoice number
  - `order_id` (uuid, references orders)
  - `client_id` (uuid, references users)
  - `issue_date` (date)
  - `due_date` (date)
  - `subtotal` (numeric)
  - `tax_rate` (numeric) - Tax percentage
  - `tax_amount` (numeric)
  - `total_amount` (numeric)
  - `status` (text) - draft, sent, paid, overdue, cancelled
  - `payment_date` (timestamptz)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for clients to view their own orders and invoices
  - Policies for admins and employees to manage orders
  - Public access for AI Agent with API key verification

  ## Important Notes
  - Orders can be created directly by AI Agent without prior booking
  - Stripe integration for payment processing
  - Automatic invoice generation upon order completion
  - Invoice numbers follow format: INV-YYYY-NNNN
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_type text NOT NULL,
  service_address text NOT NULL,
  service_date timestamptz NOT NULL,
  service_time text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed')),
  payment_intent_id text,
  special_instructions text,
  created_by_agent boolean DEFAULT false,
  agent_session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  year_part text;
  sequence_num integer;
  invoice_num text;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS integer)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  
  invoice_num := 'INV-' || year_part || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Create function to update order total when items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET 
    total_amount = (
      SELECT COALESCE(SUM(subtotal), 0)
      FROM order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order total updates
DROP TRIGGER IF EXISTS update_order_total_trigger ON order_items;
CREATE TRIGGER update_order_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- Create function to auto-generate invoice when order is completed
CREATE OR REPLACE FUNCTION auto_generate_invoice()
RETURNS TRIGGER AS $$
DECLARE
  new_invoice_number text;
  tax_rate_value numeric(5,2);
  subtotal_value numeric(10,2);
  tax_value numeric(10,2);
  total_value numeric(10,2);
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Check if invoice already exists
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE order_id = NEW.id) THEN
      -- Get tax rate from company settings (default 7% if not set)
      SELECT COALESCE((SELECT tax_rate FROM company_settings LIMIT 1), 7.00) INTO tax_rate_value;
      
      subtotal_value := NEW.total_amount;
      tax_value := ROUND(subtotal_value * (tax_rate_value / 100), 2);
      total_value := subtotal_value + tax_value;
      
      -- Generate invoice number
      new_invoice_number := generate_invoice_number();
      
      -- Create invoice
      INSERT INTO invoices (
        invoice_number,
        order_id,
        client_id,
        issue_date,
        due_date,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
        status
      ) VALUES (
        new_invoice_number,
        NEW.id,
        NEW.client_id,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        subtotal_value,
        tax_rate_value,
        tax_value,
        total_value,
        CASE WHEN NEW.payment_status = 'paid' THEN 'paid' ELSE 'sent' END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto invoice generation
DROP TRIGGER IF EXISTS auto_generate_invoice_trigger ON orders;
CREATE TRIGGER auto_generate_invoice_trigger
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION auto_generate_invoice();

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders

-- Clients can view their own orders
CREATE POLICY "Clients can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Admins and employees can view all orders
CREATE POLICY "Admins and employees can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'employee')
    )
  );

-- Admins can insert orders
CREATE POLICY "Admins can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins and employees can update orders
CREATE POLICY "Admins and employees can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'employee')
    )
  );

-- Admins can delete orders
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for order_items

-- Anyone who can view the order can view its items
CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'employee')
        )
      )
    )
  );

-- Admins can manage order items
CREATE POLICY "Admins can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for invoices

-- Clients can view their own invoices
CREATE POLICY "Clients can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Admins and employees can view all invoices
CREATE POLICY "Admins and employees can view all invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'employee')
    )
  );

-- Admins can manage invoices
CREATE POLICY "Admins can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_service_date ON orders(service_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_by_agent ON orders(created_by_agent);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
