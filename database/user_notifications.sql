-- User Notifications Table for DaKshaa Web
-- This table stores notifications for individual users (registration confirmations, etc.)

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own notifications
CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Allow inserts from authenticated users (for the registration system)
CREATE POLICY "Allow insert for authenticated users"
  ON user_notifications FOR INSERT
  WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
CREATE TRIGGER update_user_notifications_timestamp
  BEFORE UPDATE ON user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notifications_timestamp();

-- Sample insert for testing
-- INSERT INTO user_notifications (user_id, type, title, message, data)
-- VALUES (
--   'your-user-uuid-here',
--   'REGISTRATION_CONFIRMED',
--   'Registration Confirmed!',
--   'Your registration for Workshop has been confirmed.',
--   '{"event_names": "Workshop", "total_amount": 500}'
-- );
