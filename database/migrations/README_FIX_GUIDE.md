# Fix Team Registration & RLS Issues - Quick Guide

## Problem Summary
1. ❌ Missing `registration_type` column in `registrations` table
2. ❌ Registration counts not updating dynamically
3. ❌ Red "UNRESTRICTED" warnings in Supabase dashboard

## Solution

### Run This Single File
Use the comprehensive fix: **`complete_team_registration_fix.sql`**

This file fixes everything in one go:
- ✅ Adds missing `registration_type` column
- ✅ Adds `team_id` column for team registrations
- ✅ Creates automatic registration count updates (trigger)
- ✅ Enables Row Level Security (RLS) on all tables
- ✅ Creates proper security policies
- ✅ Grants correct permissions

## How to Apply

### Method 1: Supabase SQL Editor (Recommended)

1. Open your Supabase Dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy all content from `database/migrations/complete_team_registration_fix.sql`
5. Paste into the editor
6. Click **Run** ▶️

### Method 2: Command Line

```powershell
# If you have Supabase CLI installed
supabase db push
```

## What Gets Fixed

### 1. Registrations Table Schema
```sql
-- New columns added:
- registration_type (TEXT): 'individual', 'combo', or 'team'
- team_id (UUID): Links to teams table
- combo_events (TEXT[]): Stores combo event selections
- registered_at (TIMESTAMPTZ): Registration timestamp
```

### 2. Dynamic Registration Counting
```sql
-- Function: get_events_with_stats()
- Counts only PAID registrations
- Counts unique users (no duplicates)
- Real-time accurate counts

-- Trigger: update_event_registration_count()
- Automatically updates counts on INSERT/UPDATE/DELETE
- Keeps event.current_registrations in sync
```

### 3. Security Policies (RLS)

**Events Table:**
- ✅ Public can view active events
- ✅ Admins can manage all events
- ✅ Coordinators can view their events

**Registrations Table:**
- ✅ Users can view their own registrations
- ✅ Users can create their own registrations
- ✅ Users can update their own registrations
- ✅ Admins can view/manage all registrations

## Verification

After running the migration, verify with these queries:

### Check RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'registrations');
```

### Check columns exist:
```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'registrations'
AND column_name IN ('registration_type', 'team_id');
```

### Test registration counts:
```sql
SELECT event_id, name, current_registrations 
FROM get_events_with_stats() 
LIMIT 5;
```

## Expected Results

✅ **Red warnings disappear** from Supabase dashboard  
✅ **Team registration works** without errors  
✅ **Registration counts update automatically**  
✅ **Secure data access** with proper RLS policies  

## Troubleshooting

### If you still see errors:

1. **Check function exists:**
   ```sql
   SELECT * FROM get_events_with_stats() LIMIT 1;
   ```

2. **Refresh schema cache:**
   - In Supabase dashboard, go to Database → Reconnect

3. **Clear browser cache:**
   - Hard refresh your frontend (Ctrl+Shift+R)

4. **Check user role function:**
   ```sql
   SELECT get_user_role();
   ```

## Notes

- This migration is **idempotent** (safe to run multiple times)
- All existing data is preserved
- Existing registrations get default `registration_type = 'individual'`
- The trigger automatically maintains accurate counts going forward

## Support

If issues persist, check:
- Supabase logs in Dashboard → Logs
- Browser console for frontend errors
- Network tab for API call details
