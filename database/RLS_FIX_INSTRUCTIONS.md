# Fix RLS Policy for Event Registrations

## Problem
Users are getting a `403 Forbidden` error when trying to register for events:
```
new row violates row-level security policy for table "event_registrations_config"
```

## Root Cause
The RLS policies on `event_registrations_config` table are incomplete or not properly configured to allow authenticated users to insert their own registrations.

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Run the Fix Script
Copy and paste the contents of `fix_event_registrations_rls.sql` into the SQL editor and execute it.

Or manually run these commands:

```sql
-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can view their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Users can insert their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Users can update their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Admins can view all event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Admins can manage event registrations" ON event_registrations_config;

-- 2. Create SELECT policy for users
CREATE POLICY "Users can view their own event registrations" 
ON event_registrations_config FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Create INSERT policy for users
CREATE POLICY "Users can insert their own event registrations" 
ON event_registrations_config FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Create UPDATE policy for users
CREATE POLICY "Users can update their own event registrations" 
ON event_registrations_config FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Create admin policies
CREATE POLICY "Admins can view all event registrations" 
ON event_registrations_config FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'registration_admin', 'event_coordinator')
  )
);

CREATE POLICY "Admins can manage event registrations" 
ON event_registrations_config FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- 6. Ensure RLS is enabled
ALTER TABLE event_registrations_config ENABLE ROW LEVEL SECURITY;

-- 7. Grant permissions
GRANT SELECT ON event_registrations_config TO authenticated;
GRANT INSERT ON event_registrations_config TO authenticated;
GRANT UPDATE ON event_registrations_config TO authenticated;
```

### Step 3: Verify the Fix
Run this query to check if policies are created:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'event_registrations_config';
```

You should see 5 policies:
- Users can view their own event registrations (SELECT)
- Users can insert their own event registrations (INSERT)
- Users can update their own event registrations (UPDATE)
- Admins can view all event registrations (SELECT)
- Admins can manage event registrations (ALL)

### Step 4: Test Registration
1. Log in to the frontend as a regular user
2. Try to register for an event
3. Registration should now work without 403 errors

## What the Policies Do

### User Policies
- **SELECT**: Users can only see their own registrations
- **INSERT**: Users can only create registrations for themselves
- **UPDATE**: Users can only update their own registrations (for payment status changes)

### Admin Policies
- **SELECT**: Admins can see all registrations
- **ALL**: Super admins can do everything (insert, update, delete)

## Security Maintained
✅ Users cannot view other users' registrations
✅ Users cannot modify other users' registrations
✅ Users cannot register on behalf of others
✅ Admins have full oversight and control
✅ RLS remains enabled and secure

## Additional Tables to Check
If you face similar issues with other tables, check these:
- `registrations` table
- `teams` table
- `team_members` table

All should have similar RLS policies allowing users to manage their own data while preventing access to others' data.
