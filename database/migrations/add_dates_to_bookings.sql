-- =====================================================
-- Add Dates Storage to Accommodation and Lunch Tables
-- =====================================================
-- This migration adds proper date storage fields to track
-- which specific dates were booked by users
-- =====================================================

-- Add dates column to lunch_bookings if it doesn't exist
ALTER TABLE lunch_bookings 
ADD COLUMN IF NOT EXISTS booked_dates TEXT;

COMMENT ON COLUMN lunch_bookings.booked_dates IS 
'Comma-separated list of booked lunch dates (e.g., "February 12, February 13")';

-- The accommodation_requests table already has special_requests field
-- which we'll use to store dates as JSON

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lunch_booked_dates 
ON lunch_bookings(booked_dates);

COMMENT ON TABLE lunch_bookings IS 
'Stores lunch booking information with specific dates';

COMMENT ON TABLE accommodation_requests IS 
'Stores accommodation booking information with dates in special_requests field as JSON';
