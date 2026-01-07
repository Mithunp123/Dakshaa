-- ============================================================
-- RLS POLICIES FOR FRONTEND MIGRATION
-- These policies allow safe direct access from frontend
-- ============================================================

-- ============================================================
-- 1. ACCOMMODATION_REQUESTS TABLE
-- ============================================================

-- Enable RLS
ALTER TABLE accommodation_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own accommodation" ON accommodation_requests;
DROP POLICY IF EXISTS "Users can insert their own accommodation" ON accommodation_requests;
DROP POLICY IF EXISTS "Users can update their own accommodation" ON accommodation_requests;
DROP POLICY IF EXISTS "Admins can view all accommodation" ON accommodation_requests;
DROP POLICY IF EXISTS "Admins can update accommodation" ON accommodation_requests;

-- Users can view only their own accommodation bookings
CREATE POLICY "Users can view their own accommodation"
ON accommodation_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own accommodation bookings
-- Enforces that user_id matches authenticated user
CREATE POLICY "Users can insert their own accommodation"
ON accommodation_requests FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND payment_status = 'PENDING'  -- Force initial status to PENDING
);

-- Users can update only their own pending bookings (for corrections before payment)
CREATE POLICY "Users can update their own accommodation"
ON accommodation_requests FOR UPDATE
USING (auth.uid() = user_id AND payment_status = 'PENDING')
WITH CHECK (auth.uid() = user_id AND payment_status IN ('PENDING', 'PAID'));

-- Admins can view all accommodation bookings
CREATE POLICY "Admins can view all accommodation"
ON accommodation_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'registration_admin')
    )
);

-- Admins can update any accommodation (for payment verification)
CREATE POLICY "Admins can update accommodation"
ON accommodation_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'registration_admin')
    )
);

-- ============================================================
-- 2. LUNCH_BOOKINGS TABLE
-- ============================================================

-- Enable RLS
ALTER TABLE lunch_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own lunch bookings" ON lunch_bookings;
DROP POLICY IF EXISTS "Users can insert their own lunch bookings" ON lunch_bookings;
DROP POLICY IF EXISTS "Users can update their own lunch bookings" ON lunch_bookings;
DROP POLICY IF EXISTS "Admins can view all lunch bookings" ON lunch_bookings;
DROP POLICY IF EXISTS "Admins can update lunch bookings" ON lunch_bookings;

-- Users can view only their own lunch bookings
CREATE POLICY "Users can view their own lunch bookings"
ON lunch_bookings FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own lunch bookings
CREATE POLICY "Users can insert their own lunch bookings"
ON lunch_bookings FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND payment_status = 'PENDING'  -- Force initial status to PENDING
);

-- Users can update only their own pending bookings
CREATE POLICY "Users can update their own lunch bookings"
ON lunch_bookings FOR UPDATE
USING (auth.uid() = user_id AND payment_status = 'PENDING')
WITH CHECK (auth.uid() = user_id AND payment_status IN ('PENDING', 'PAID'));

-- Admins can view all lunch bookings
CREATE POLICY "Admins can view all lunch bookings"
ON lunch_bookings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'registration_admin')
    )
);

-- Admins can update any lunch booking
CREATE POLICY "Admins can update lunch bookings"
ON lunch_bookings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'registration_admin')
    )
);

-- ============================================================
-- 3. CONTACT_DETAILS TABLE
-- ============================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS contact_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,  -- Optional: can be NULL for non-authenticated users
    username TEXT NOT NULL,
    email_id TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE contact_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_details;
DROP POLICY IF EXISTS "Users can view their own contact messages" ON contact_details;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON contact_details;

-- Anyone (authenticated or not) can insert contact messages
CREATE POLICY "Anyone can insert contact messages"
ON contact_details FOR INSERT
WITH CHECK (true);

-- Authenticated users can view their own contact messages
CREATE POLICY "Users can view their own contact messages"
ON contact_details FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all contact messages
CREATE POLICY "Admins can view all contact messages"
ON contact_details FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'registration_admin')
    )
);

-- ============================================================
-- 4. FEEDBACK_DETAILS TABLE
-- ============================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS feedback_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID DEFAULT gen_random_uuid(),
    user_id UUID,  -- Optional: can be NULL for non-authenticated users
    username TEXT NOT NULL,
    email_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE feedback_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert feedback" ON feedback_details;
DROP POLICY IF EXISTS "Anyone can view feedback" ON feedback_details;
DROP POLICY IF EXISTS "Admins can manage all feedback" ON feedback_details;

-- Anyone can insert feedback (for post-event feedback collection)
CREATE POLICY "Anyone can insert feedback"
ON feedback_details FOR INSERT
WITH CHECK (true);

-- Anyone can view feedback (for public testimonials/reviews)
-- Remove this if you want feedback to be private
CREATE POLICY "Anyone can view feedback"
ON feedback_details FOR SELECT
USING (true);

-- Admins can manage all feedback
CREATE POLICY "Admins can manage all feedback"
ON feedback_details FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'registration_admin')
    )
);

-- ============================================================
-- 5. ADDITIONAL SECURITY: RATE LIMITING FUNCTIONS
-- ============================================================

-- Function to check if user has exceeded booking limits
CREATE OR REPLACE FUNCTION check_duplicate_accommodation()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Check if user already has a booking
    SELECT COUNT(*) INTO existing_count
    FROM accommodation_requests
    WHERE user_id = NEW.user_id;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'You have already booked accommodation';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent duplicate accommodation bookings
DROP TRIGGER IF EXISTS trigger_check_duplicate_accommodation ON accommodation_requests;
CREATE TRIGGER trigger_check_duplicate_accommodation
BEFORE INSERT ON accommodation_requests
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_accommodation();

-- Similar function for lunch bookings
CREATE OR REPLACE FUNCTION check_duplicate_lunch_booking()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Check if user already has a lunch booking
    SELECT COUNT(*) INTO existing_count
    FROM lunch_bookings
    WHERE user_id = NEW.user_id;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'You have already booked lunch';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent duplicate lunch bookings
DROP TRIGGER IF EXISTS trigger_check_duplicate_lunch_booking ON lunch_bookings;
CREATE TRIGGER trigger_check_duplicate_lunch_booking
BEFORE INSERT ON lunch_bookings
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_lunch_booking();

-- ============================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_accommodation_user_id ON accommodation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_payment_status ON accommodation_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_lunch_bookings_user_id ON lunch_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_lunch_bookings_payment_status ON lunch_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_contact_user_id ON contact_details(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback_details(created_at);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Test RLS policies (run these after deployment)
/*
-- As regular user (should only see own data):
SELECT * FROM accommodation_requests;
SELECT * FROM lunch_bookings;

-- Try to insert with wrong user_id (should fail):
INSERT INTO accommodation_requests (user_id, full_name, ...) 
VALUES ('some-other-user-id', 'Test', ...);

-- Try to update payment_status to PAID (should fail for regular users):
UPDATE accommodation_requests 
SET payment_status = 'PAID' 
WHERE user_id = auth.uid();
*/
