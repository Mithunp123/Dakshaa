# Real-Time Dynamic Dashboard Setup Guide

## Overview
All dashboards (Student & Admin) now have **real-time updates** using Supabase Realtime subscriptions. Data automatically refreshes when changes occur in the database.

## Changes Made

### 1. Student Dashboard Components

#### **DashboardHome.jsx**
- ✅ Added real-time subscription for registrations
- ✅ Auto-updates when user registers for events
- ✅ Shows live event count, payment status

#### **MyRegistrations.jsx**
- ✅ Real-time updates on registration changes
- ✅ Auto-refreshes when payment status changes
- ✅ Fixed table name: `registrations` (was `event_registrations_config`)

#### **Payments.jsx**
- ✅ Real-time payment status updates
- ✅ Live total spent calculation
- ✅ Fixed payment status: `PAID` instead of `completed`
- ✅ Fixed status: `PENDING` instead of `pending`

### 2. Admin Dashboard

#### **AdminDashboard.jsx**
- ✅ Real-time subscriptions for:
  - Registrations changes
  - Attendance updates
  - Profile changes
- ✅ Auto-refresh every 10 seconds
- ✅ Manual refresh button
- ✅ Fixed table names:
  - `registrations` (was `event_registrations_config`)
  - `events` (was `events_config`)
  - `is_active` field (was `is_open`)

### 3. Database Functions

#### **get_admin_dashboard_stats()**
Created comprehensive statistics function that returns:
- Total registrations (all, paid, pending)
- Total revenue (from events + combos)
- Total users count
- Total events (all & active)
- Check-ins (total, morning, evening)
- Combo statistics

## Database Setup Required

Run this in **Supabase SQL Editor**:
```bash
database/create_admin_stats_function.sql
```

This creates the `get_admin_dashboard_stats()` function for optimized admin statistics.

## How Real-Time Works

### Student Dashboard Flow
```
1. User logs in
2. Dashboard subscribes to registrations table
3. When registration created/updated → Auto-refresh
4. Stats update immediately
5. No manual refresh needed
```

### Admin Dashboard Flow
```
1. Admin logs in
2. Dashboard subscribes to multiple tables:
   - registrations
   - attendance  
   - profiles
3. Any change → Trigger refresh
4. Auto-refresh every 10 seconds
5. Manual refresh button available
```

## Real-Time Subscription Details

### Student Subscription
```javascript
supabase
  .channel('student-registration-updates')
  .on('postgres_changes', {
    event: '*',  // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'registrations',
    filter: `user_id=eq.${userId}`  // Only their registrations
  })
  .subscribe();
```

### Admin Subscription
```javascript
// Registrations
supabase
  .channel('admin-registration-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'registrations'
  })
  .subscribe();

// Attendance
supabase
  .channel('admin-attendance-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'attendance'
  })
  .subscribe();

// Profiles
supabase
  .channel('admin-profile-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'profiles'
  })
  .subscribe();
```

## Dynamic Data Displayed

### Student Dashboard
| Data | Source | Updates |
|------|--------|---------|
| Events Registered | registrations table | Real-time |
| Payment Status | registrations.payment_status | Real-time |
| Total Spent | SUM(events.price) | Real-time |
| Combo Status | registrations.combo_id | Real-time |
| Attendance | attendance table | Real-time |

### Admin Dashboard
| Data | Source | Updates |
|------|--------|---------|
| Total Users | profiles table | Real-time |
| Total Registrations | registrations table | Real-time |
| Total Revenue | events.price × registrations | Real-time |
| Active Events | events.is_active | Real-time |
| Check-ins | attendance table | Real-time |
| Payment Status | registrations.payment_status | Real-time |

## Payment Status Values

**Correct Values (Now Used)**:
- `PAID` - Payment completed
- `PENDING` - Awaiting payment
- `FAILED` - Payment failed

**Old Values (Removed)**:
- ~~`completed`~~
- ~~`pending`~~
- ~~`failed`~~

## Testing Real-Time Updates

### Test Student Dashboard
1. Login as student
2. Open dashboard in browser
3. Register for event (payment simulation)
4. **Dashboard auto-updates** with new registration
5. Check payments tab - should show updated total

### Test Admin Dashboard
1. Login as admin
2. Open admin dashboard
3. Have student register for event
4. **Admin dashboard auto-updates** with:
   - Increased registration count
   - Increased revenue
   - Updated user count

### Test Manual Actions
```sql
-- Test by manually updating payment status
UPDATE registrations
SET payment_status = 'PAID'
WHERE payment_status = 'PENDING'
LIMIT 1;

-- Dashboard should update within seconds
```

## Performance Optimizations

1. **Debouncing**: Updates batched within 500ms
2. **Channel Management**: Subscriptions cleaned up on unmount
3. **Optimized Queries**: Uses indexes on user_id, payment_status
4. **RPC Function**: Admin stats calculated server-side
5. **Auto-Refresh**: Every 10 seconds for admin (configurable)

## Supabase Realtime Requirements

### Enable Realtime in Supabase Dashboard
1. Go to **Database → Replication**
2. Enable replication for tables:
   - ✅ registrations
   - ✅ attendance
   - ✅ profiles
   - ✅ events
   - ✅ combos

3. Check replication status:
```sql
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

## Troubleshooting

### Realtime Not Working
**Check Replication**:
```sql
-- Enable realtime for table
ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

**Check Subscriptions in Console**:
```javascript
// Should see: "SUBSCRIBED" status
console.log(subscription.state);
```

### Stats Not Updating
1. **Check RLS Policies**: Ensure authenticated users can read data
2. **Check Function**: Test `get_admin_dashboard_stats()` in SQL editor
3. **Check Console**: Look for Supabase errors in browser console

### Slow Updates
1. **Check Network**: Realtime uses WebSockets
2. **Check Subscription Count**: Too many channels = slow
3. **Increase Refresh Interval**: Change from 10s to 30s

## Environment Requirements

- ✅ Supabase Realtime enabled
- ✅ WebSocket connection allowed
- ✅ RLS policies configured
- ✅ Database replication enabled

## Next Steps

1. **Run SQL file**: `create_admin_stats_function.sql`
2. **Enable Replication**: In Supabase Dashboard
3. **Test Real-Time**: Register events and watch updates
4. **Monitor Performance**: Check browser Network tab for WS connections

All data is now **dynamic and updates in real-time** across student and admin dashboards! 🎉
