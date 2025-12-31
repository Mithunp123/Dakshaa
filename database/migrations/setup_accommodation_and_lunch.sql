-- Complete Setup for Accommodation & Lunch Bookings
-- This script creates tables and adds RLS policies
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE ACCOMMODATION TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.accommodation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    college_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    accommodation_dates TEXT[] NOT NULL,
    march_28_accommodation BOOLEAN DEFAULT FALSE,
    number_of_days INTEGER NOT NULL,
    accommodation_price INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accommodation_user_id ON public.accommodation(user_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_created_at ON public.accommodation(created_at DESC);

-- ============================================
-- 2. CREATE LUNCH BOOKINGS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.lunch_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    college_name TEXT NOT NULL,
    lunch_date TEXT NOT NULL,
    lunch_type TEXT NOT NULL CHECK (lunch_type IN ('veg', 'non-veg')),
    number_of_days INTEGER NOT NULL,
    lunch_price INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lunch_bookings_user_id ON public.lunch_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_lunch_bookings_created_at ON public.lunch_bookings(created_at DESC);

-- ============================================
-- 3. ENABLE RLS ON BOTH TABLES
-- ============================================

ALTER TABLE public.accommodation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lunch_bookings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. DROP OLD POLICIES (if they exist)
-- ============================================

DROP POLICY IF EXISTS "Users can view their accommodation" ON public.accommodation;
DROP POLICY IF EXISTS "Users can insert accommodation" ON public.accommodation;
DROP POLICY IF EXISTS "Users can update their accommodation" ON public.accommodation;
DROP POLICY IF EXISTS "Admins can view all accommodation" ON public.accommodation;
DROP POLICY IF EXISTS "Anyone can insert accommodation" ON public.accommodation;
DROP POLICY IF EXISTS "Users can view their accommodation and admins can view all" ON public.accommodation;

DROP POLICY IF EXISTS "Users can view their lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Users can insert lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Users can update their lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Admins can view all lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Anyone can insert lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Users can view their lunch bookings and admins can view all" ON public.lunch_bookings;

-- ============================================
-- 5. CREATE ACCOMMODATION RLS POLICIES
-- ============================================

-- Policy 1: Allow INSERT for authenticated users
CREATE POLICY "accommodation_insert_authenticated" ON public.accommodation
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 2: Allow SELECT for users to see their own + admins to see all
CREATE POLICY "accommodation_select_own_or_admin" ON public.accommodation
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy 3: Allow UPDATE for users to update their own + admins
CREATE POLICY "accommodation_update_own_or_admin" ON public.accommodation
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy 4: Allow DELETE for users to delete their own + admins
CREATE POLICY "accommodation_delete_own_or_admin" ON public.accommodation
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- 6. CREATE LUNCH BOOKINGS RLS POLICIES
-- ============================================

-- Policy 1: Allow INSERT for authenticated users
CREATE POLICY "lunch_bookings_insert_authenticated" ON public.lunch_bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 2: Allow SELECT for users to see their own + admins to see all
CREATE POLICY "lunch_bookings_select_own_or_admin" ON public.lunch_bookings
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy 3: Allow UPDATE for users to update their own + admins
CREATE POLICY "lunch_bookings_update_own_or_admin" ON public.lunch_bookings
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy 4: Allow DELETE for users to delete their own + admins
CREATE POLICY "lunch_bookings_delete_own_or_admin" ON public.lunch_bookings
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON public.accommodation TO authenticated;
GRANT ALL ON public.lunch_bookings TO authenticated;

-- ============================================
-- 8. SUCCESS MESSAGE
-- ============================================

SELECT 'Tables created and RLS policies applied successfully!' as status;
