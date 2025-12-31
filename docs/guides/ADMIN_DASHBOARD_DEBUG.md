# Admin Dashboard Troubleshooting Guide

## Issue: Admin Dashboard Not Showing Dynamic Data

### Quick Fixes

**1. Check Browser Console**
Open browser DevTools (F12) and look for:
```javascript
// Should see these logs:
RPC Stats Response: { rpcStats: {...}, rpcError: null }
Using RPC stats: { total_registrations: 5, ... }
```

**2. Verify Database Function Exists**
Run in Supabase SQL Editor:
```sql
-- Check if function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'get_admin_dashboard_stats';

-- Test function directly
SELECT get_admin_dashboard_stats();
```

**3. Check RLS Policies**
Admin dashboard needs read access to:
- registrations
- events
- profiles
- attendance
- combos

```sql
-- Check if your user has admin role
SELECT id, role FROM profiles WHERE email = 'your-email@example.com';

-- Should return 'super_admin' or 'registration_admin'
```

### Setup Steps (If Function Missing)

**Run this SQL file:**
```sql
-- Creates the admin statistics function
database/create_admin_stats_function.sql
```

**Enable Realtime Replication:**
1. Go to Supabase Dashboard
2. Database → Replication
3. Enable for: `registrations`, `profiles`, `attendance`

### Common Issues

#### Issue 1: "Function does not exist"
**Error**: `function get_admin_dashboard_stats() does not exist`

**Solution**:
```sql
-- Run the function creation script
-- File: database/create_admin_stats_function.sql
```

#### Issue 2: "Permission denied"
**Error**: `permission denied for function get_admin_dashboard_stats`

**Solution**:
```sql
-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
```

#### Issue 3: Shows 0 for Everything
**Possible causes**:
- No data in database
- RLS policies blocking access
- Wrong role (not admin)

**Check data exists**:
```sql
SELECT COUNT(*) FROM registrations;  -- Should be > 0
SELECT COUNT(*) FROM profiles;       -- Should be > 0
SELECT COUNT(*) FROM events;         -- Should be > 0
```

**Check your role**:
```sql
SELECT role FROM profiles WHERE email = 'your-email@example.com';
-- Should be: super_admin, registration_admin, event_coordinator, or volunteer
```

#### Issue 4: Function Returns NULL
**Check function execution**:
```sql
-- Run function directly
SELECT get_admin_dashboard_stats();

-- Should return JSON like:
-- {"total_registrations": 5, "total_revenue": 1500, ...}
```

If NULL, check for errors:
```sql
-- Check Postgres logs in Supabase Dashboard
-- Logs → Database
```

### Verification Steps

**1. Test Function Manually**
```sql
SELECT get_admin_dashboard_stats();
```

**Expected Result**:
```json
{
  "total_registrations": 10,
  "paid_registrations": 8,
  "pending_registrations": 2,
  "total_revenue": 5000,
  "total_users": 50,
  "total_events": 15,
  "open_events": 12,
  "total_checkins": 30,
  "morning_checkins": 15,
  "evening_checkins": 15,
  "total_combos": 5,
  "active_combos": 4,
  "last_updated": "2025-12-31T..."
}
```

**2. Check Network Tab**
In browser DevTools → Network:
- Look for RPC call to `get_admin_dashboard_stats`
- Check response data
- Verify no 401/403 errors

**3. Check Real-time Subscriptions**
In browser console:
```javascript
// Should see subscriptions active
// Look for: "SUBSCRIBED" status
```

### Manual Fallback Queries

If RPC function fails, dashboard uses fallback queries:

```sql
-- Total registrations (paid)
SELECT COUNT(*) FROM registrations WHERE payment_status = 'PAID';

-- Total revenue
SELECT SUM(e.price) FROM registrations r
INNER JOIN events e ON r.event_id = e.event_id
WHERE r.payment_status = 'PAID';

-- Total users
SELECT COUNT(*) FROM profiles;

-- Total events
SELECT COUNT(*) FROM events;

-- Active events
SELECT COUNT(*) FROM events WHERE is_active = true;

-- Check-ins
SELECT COUNT(DISTINCT user_id) FROM attendance;
```

### Debug Mode

Add console logs to see what's happening:

```javascript
// In AdminDashboard.jsx
console.log('Stats state:', stats);
console.log('Loading:', loading);
console.log('Refreshing:', refreshing);
console.log('Last updated:', lastUpdated);
```

### Force Refresh

**Manual Refresh Button**:
- Click the refresh icon in admin dashboard
- Should trigger `fetchStats()` immediately

**Auto-Refresh**:
- Happens every 10 seconds automatically
- Check console for refresh logs

### RLS Policies Check

```sql
-- Check if admin can read registrations
SELECT * FROM registrations LIMIT 1;

-- Check if admin can read profiles
SELECT * FROM profiles LIMIT 1;

-- Check if admin can read events
SELECT * FROM events LIMIT 1;

-- If any fail, RLS policies need updating
```

### Fix RLS for Admins

```sql
-- Grant admins access to view all data
CREATE POLICY "Admins can view all registrations" ON registrations
    FOR SELECT USING (
        get_user_role() IN ('super_admin', 'registration_admin')
    );

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        get_user_role() IN ('super_admin', 'registration_admin')
    );
```

### Sample Data for Testing

If database is empty:
```sql
-- Run seed file
-- File: database/seed.sql
```

### Complete Reset (Last Resort)

If nothing works:

```sql
-- 1. Drop function
DROP FUNCTION IF EXISTS get_admin_dashboard_stats();

-- 2. Recreate
-- Run: database/create_admin_stats_function.sql

-- 3. Clear browser cache
-- DevTools → Application → Clear storage

-- 4. Hard refresh
-- Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
```

### Check Supabase Status

- Verify Supabase project is running
- Check for any service outages
- Verify API keys are correct

### Environment Variables

Verify Frontend/.env:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Still Not Working?

1. Check browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Test with Postman/curl
4. Verify user is logged in as admin
5. Check network connectivity

### Expected Behavior

**On Load**:
1. Dashboard fetches user role
2. Attempts RPC call to `get_admin_dashboard_stats()`
3. If successful, displays stats
4. If fails, uses fallback queries
5. Sets up real-time subscriptions
6. Auto-refreshes every 10 seconds

**On Data Change**:
1. Real-time subscription triggers
2. `fetchStats()` called automatically
3. Stats update immediately
4. "Last updated" timestamp changes

### Success Indicators

✅ Stats show numbers (not all zeros)
✅ No errors in console
✅ "Last updated" timestamp changes
✅ Manual refresh works
✅ Stats update when data changes

### Contact Support

If still stuck:
1. Export browser console logs
2. Export Supabase function logs
3. Share error messages
4. Provide user role and email
