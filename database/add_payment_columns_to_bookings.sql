-- =====================================================
-- Add Payment Columns to Accommodation & Lunch Tables
-- =====================================================
-- This migration adds payment tracking columns to support
-- the unified payment gateway integration for all booking types.
--
-- Run this in Supabase SQL Editor if these columns don't exist.
-- =====================================================

-- Add payment columns to accommodation_requests
ALTER TABLE accommodation_requests 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Add comment for clarity
COMMENT ON COLUMN accommodation_requests.payment_status IS 
'Payment status: PENDING, PAID, FAILED, REFUNDED';

COMMENT ON COLUMN accommodation_requests.payment_id IS 
'Transaction ID from payment gateway';

-- Add payment columns to lunch_bookings
ALTER TABLE lunch_bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Add comment for clarity
COMMENT ON COLUMN lunch_bookings.payment_status IS 
'Payment status: PENDING, PAID, FAILED, REFUNDED';

COMMENT ON COLUMN lunch_bookings.payment_id IS 
'Transaction ID from payment gateway';

-- Create indexes for faster payment status queries
CREATE INDEX IF NOT EXISTS idx_accommodation_payment_status 
ON accommodation_requests(payment_status);

CREATE INDEX IF NOT EXISTS idx_accommodation_user_payment 
ON accommodation_requests(user_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_lunch_payment_status 
ON lunch_bookings(payment_status);

CREATE INDEX IF NOT EXISTS idx_lunch_user_payment 
ON lunch_bookings(user_id, payment_status);

-- Update existing records to PAID (if they were created before this migration)
-- Assuming all existing bookings were already processed/paid
UPDATE accommodation_requests 
SET payment_status = 'PAID', 
    payment_id = 'LEGACY_' || id::TEXT
WHERE payment_status IS NULL OR payment_status = '';

UPDATE lunch_bookings 
SET payment_status = 'PAID', 
    payment_id = 'LEGACY_' || id::TEXT
WHERE payment_status IS NULL OR payment_status = '';

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify the changes:

-- Check accommodation_requests table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'accommodation_requests'
  AND column_name IN ('payment_status', 'payment_id');

-- Check lunch_bookings table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'lunch_bookings'
  AND column_name IN ('payment_status', 'payment_id');

-- Count payment status distribution (accommodation)
SELECT payment_status, COUNT(*) 
FROM accommodation_requests 
GROUP BY payment_status;

-- Count payment status distribution (lunch)
SELECT payment_status, COUNT(*) 
FROM lunch_bookings 
GROUP BY payment_status;

-- =====================================================
-- Rollback (if needed)
-- =====================================================
-- CAUTION: Only run this if you need to undo the changes
-- This will REMOVE the payment columns and data!

/*
-- Drop indexes
DROP INDEX IF EXISTS idx_accommodation_payment_status;
DROP INDEX IF EXISTS idx_accommodation_user_payment;
DROP INDEX IF EXISTS idx_lunch_payment_status;
DROP INDEX IF EXISTS idx_lunch_user_payment;

-- Drop columns
ALTER TABLE accommodation_requests 
DROP COLUMN IF EXISTS payment_status,
DROP COLUMN IF EXISTS payment_id;

ALTER TABLE lunch_bookings 
DROP COLUMN IF EXISTS payment_status,
DROP COLUMN IF EXISTS payment_id;
*/
