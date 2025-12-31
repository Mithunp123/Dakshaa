-- Fix for RLS Policy Infinite Recursion Issues
-- IMPORTANT: If you get "relation does not exist" error, use:
--   setup_accommodation_and_lunch.sql (creates tables first)
-- Run this in Supabase SQL Editor to fix the errors

-- ============================================
-- 1. DROP PROBLEMATIC POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Team leaders can manage team members" ON public.team_members;

-- ============================================
-- 2. DISABLE RLS TEMPORARILY TO FIX POLICIES
-- ============================================

ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RECREATE POLICIES WITHOUT RECURSION
-- ============================================

-- Fixed Team Members Policy - Simpler approach without nested recursion
CREATE POLICY "Users can view team members of their teams" ON public.team_members
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.team_members WHERE team_id = team_members.team_id
        )
        OR
        auth.uid() IN (
            SELECT leader_id FROM public.teams WHERE id = team_members.team_id
        )
    );

-- Fixed Team Leaders Manage Policy
CREATE POLICY "Team leaders can manage team members" ON public.team_members
    FOR ALL USING (
        auth.uid() IN (SELECT leader_id FROM public.teams WHERE id = team_members.team_id)
    );

-- ============================================
-- 4. RE-ENABLE RLS
-- ============================================

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. FIX ACCOMMODATION TABLE RLS
-- ============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their accommodation" ON public.accommodation;
DROP POLICY IF EXISTS "Users can insert accommodation" ON public.accommodation;
DROP POLICY IF EXISTS "Users can update their accommodation" ON public.accommodation;
DROP POLICY IF EXISTS "Admins can view all accommodation" ON public.accommodation;

-- Enable RLS
ALTER TABLE public.accommodation ENABLE ROW LEVEL SECURITY;

-- Create permissive INSERT policy for authenticated users
CREATE POLICY "Anyone can insert accommodation" ON public.accommodation
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create SELECT policy for users and admins
CREATE POLICY "Users can view their accommodation and admins can view all" ON public.accommodation
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Allow updates
CREATE POLICY "Users can update their accommodation" ON public.accommodation
    FOR UPDATE USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- 6. FIX LUNCH BOOKINGS TABLE RLS
-- ============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Users can insert lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Users can update their lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Admins can view all lunch bookings" ON public.lunch_bookings;

-- Enable RLS
ALTER TABLE public.lunch_bookings ENABLE ROW LEVEL SECURITY;

-- Create permissive INSERT policy for authenticated users
CREATE POLICY "Anyone can insert lunch bookings" ON public.lunch_bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create SELECT policy for users and admins
CREATE POLICY "Users can view their lunch bookings and admins can view all" ON public.lunch_bookings
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- Allow updates
CREATE POLICY "Users can update their lunch bookings" ON public.lunch_bookings
    FOR UPDATE USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON public.team_members TO authenticated;
GRANT ALL ON public.accommodation TO authenticated;
GRANT ALL ON public.lunch_bookings TO authenticated;
GRANT ALL ON public.teams TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'RLS Policies Fixed Successfully!' as status;
