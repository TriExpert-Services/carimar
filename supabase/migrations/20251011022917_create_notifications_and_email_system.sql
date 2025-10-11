/*
  # Notifications and Email System

  ## Overview
  Creates tables for notification system and email functionality to enable
  real-time alerts and SMTP-based email communications.

  ## New Tables

  ### 1. notifications
  Stores notification records for admin and client users:
    - `id` (uuid, primary key) - Notification identifier
    - `user_id` (uuid, references users) - Target user
    - `type` (text) - Notification type (quote_received, quote_approved, etc.)
    - `title` (text) - Notification title
    - `message` (text) - Notification message
    - `link` (text) - Related resource link (optional)
    - `read` (boolean) - Read status
    - `created_at` (timestamptz) - Creation timestamp

  ### 2. smtp_config
  Stores SMTP email server configuration:
    - `id` (uuid, primary key) - Configuration identifier
    - `provider` (text) - SMTP provider name (gmail, custom, etc.)
    - `host` (text) - SMTP server host
    - `port` (integer) - SMTP server port
    - `username` (text) - SMTP username
    - `password` (text) - SMTP password
    - `from_email` (text) - Default sender email
    - `from_name` (text) - Default sender name
    - `use_tls` (boolean) - Use TLS encryption
    - `active` (boolean) - Active configuration
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 3. email_queue
  Queue for email sending with retry capability:
    - `id` (uuid, primary key) - Queue item identifier
    - `to_email` (text) - Recipient email
    - `to_name` (text) - Recipient name
    - `subject` (text) - Email subject
    - `body_html` (text) - HTML email body
    - `body_text` (text) - Plain text email body (optional)
    - `status` (text) - Queue status (pending, sending, sent, failed)
    - `attempts` (integer) - Send attempts count
    - `last_error` (text) - Last error message (optional)
    - `scheduled_at` (timestamptz) - Scheduled send time
    - `sent_at` (timestamptz) - Actual send time (optional)
    - `created_at` (timestamptz) - Creation timestamp

  ## Security

  ### Row Level Security (RLS)
  - notifications: Users see own notifications, admins see all
  - smtp_config: Admin only access
  - email_queue: Admin only access

  ## Notes
  1. Notification system supports real-time subscriptions via Supabase
  2. SMTP configuration supports multiple email providers
  3. Email queue enables reliable delivery with retry logic
  4. All monetary values and sensitive data are protected by RLS
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('quote_received', 'quote_approved', 'quote_rejected', 'booking_confirmed', 'booking_reminder', 'payment_received', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create smtp_config table
CREATE TABLE IF NOT EXISTS smtp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'custom',
  host text NOT NULL,
  port integer NOT NULL DEFAULT 587,
  username text NOT NULL,
  password text NOT NULL,
  from_email text NOT NULL,
  from_name text NOT NULL DEFAULT 'CARIMAR SERVICES LLC',
  use_tls boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  to_name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts integer DEFAULT 0,
  last_error text,
  scheduled_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE smtp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for smtp_config table
CREATE POLICY "Admins can manage SMTP config"
  ON smtp_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for email_queue table
CREATE POLICY "Admins can view email queue"
  ON email_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can manage email queue"
  ON email_queue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);

-- Create function to update updated_at timestamp for smtp_config
CREATE OR REPLACE FUNCTION update_smtp_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for smtp_config updated_at
CREATE TRIGGER update_smtp_config_updated_at
  BEFORE UPDATE ON smtp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_smtp_config_updated_at();