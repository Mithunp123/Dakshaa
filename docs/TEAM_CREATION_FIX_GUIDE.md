# Team Creation Fix - Complete Guide

## Problem Summary
You were experiencing an infinite recursion error when trying to create or view teams:
```
infinite recursion detected in policy for relation "teams"
```

This occurred because the Row Level Security (RLS) policies on the `teams` and `team_members` tables were creating circular dependencies.

## What Was Fixed

### 1. Database Changes (RLS Policies)
**File:** [database/fix_team_rls_recursion.sql](database/fix_team_rls_recursion.sql)

**Changes:**
- ✅ Added missing columns to `teams` table: `max_members`, `leader_id`
- ✅ Dropped problematic RLS policies that caused recursion
- ✅ Created `user_can_view_team()` security definer function to break circular dependency
- ✅ Created `check_team_membership()` security definer function for team_members
- ✅ Created new RLS policies for SELECT, INSERT, UPDATE, DELETE on both tables
- ✅ Fixed policies to allow team creation and proper member management

### 2. Frontend Changes

#### CreateTeamModal.jsx
**File:** [Frontend/src/Pages/Dashboard/Components/CreateTeamModal.jsx](Frontend/src/Pages/Dashboard/Components/CreateTeamModal.jsx)

**Changes:**
- ✅ Changed `id` to `event_id` in events query (line 31)
- ✅ Fixed event selection to use `event_id` instead of `id` (line 50)
- ✅ Updated event mapping to use `event_id` as key and value (line 203)

#### teamService.js
**File:** [Frontend/src/services/teamService.js](Frontend/src/services/teamService.js)

**Changes:**
- ✅ Changed `team_name` to `name` in insert query
- ✅ Added both `leader_id` and `created_by` fields
- ✅ Properly sets `max_members` field

## How to Apply the Fix

### Step 1: Run Database Migration ⚠️ REQUIRED
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the entire contents of: `database/fix_team_rls_recursion.sql`
4. Paste and click **"Run"**
5. Verify success - you should see a table showing the new policies

### Step 2: Frontend Changes (Already Applied) ✅
The frontend code has been automatically updated. No manual action needed.

### Step 3: Test Team Creation
1. Run your frontend application
2. Log in as a user
3. Go to Dashboard → My Teams
4. Click "Create New Team"
5. Select a team event
6. Enter a team name
7. Click "Create Team"

## Database Schema Reference

### Teams Table
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,                    -- Team name
    event_id TEXT REFERENCES events,       -- Event reference
    created_by UUID REFERENCES profiles,   -- Creator
    leader_id UUID REFERENCES profiles,    -- Team leader
    max_members INTEGER DEFAULT 4,         -- Max team size
    created_at TIMESTAMPTZ
);
```

### Team Members Table
```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY,
    team_id UUID REFERENCES teams,
    user_id UUID REFERENCES profiles,
    role TEXT DEFAULT 'member',            -- 'leader' or 'member'
    status TEXT DEFAULT 'joined',          -- 'invited' or 'joined'
    created_at TIMESTAMPTZ,
    UNIQUE(team_id, user_id)
);
```

## RLS Policies Explained

### Teams Policies
- **SELECT**: Users can only see teams they're members of
- **INSERT**: Any authenticated user can create a team
- **UPDATE**: Only team leaders can update their teams
- **DELETE**: Only team leaders can delete their teams

### Team Members Policies
- **SELECT**: Users can see members of teams they belong to
- **INSERT**: Users can join teams, or leaders can add members
- **DELETE**: Users can leave teams, or leaders can remove members

## Security Definer Functions

These functions break the circular dependency:

```sql
-- Checks if a user is a member of a team
user_can_view_team(team_id UUID, user_id UUID) → BOOLEAN

-- Checks if a user is a member of a team (for team_members table)
check_team_membership(team_id UUID) → BOOLEAN
```

These functions run with elevated privileges (SECURITY DEFINER) which prevents the recursion issue.

## Troubleshooting

### Error: "team_name does not exist"
**Solution:** Database migration was not run. Run `fix_team_rls_recursion.sql`

### Error: "max_members does not exist"
**Solution:** Database migration was not run. Run `fix_team_rls_recursion.sql`

### Error: "infinite recursion detected"
**Solution:** Old policies still exist. Drop them manually:
```sql
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
-- Then run the full migration script
```

### Error: "No team events available"
**Solution:** Make sure you have events with `is_team_event = true` in your events table:
```sql
UPDATE events SET is_team_event = true WHERE event_id = 'your-event-id';
```

### Teams not showing in dashboard
**Solution:** Check RLS policies are applied correctly:
```sql
SELECT * FROM pg_policies WHERE tablename IN ('teams', 'team_members');
```

## Testing Checklist

- [ ] Database migration runs without errors
- [ ] Can create a new team
- [ ] Team appears in "My Teams" section
- [ ] Team leader is automatically added as first member
- [ ] Can view team details
- [ ] Can add members to team (if implemented)
- [ ] Can delete own team
- [ ] Cannot view other teams you're not a member of

## Next Steps

After verifying team creation works, you may want to implement:
1. **Team invitation system** - Invite users via email/username
2. **Team member management** - Add/remove members
3. **Team registration** - Register entire team for events
4. **Team dashboard** - View team stats and members

## Files Modified

- ✅ `database/fix_team_rls_recursion.sql` (created)
- ✅ `Frontend/src/Pages/Dashboard/Components/CreateTeamModal.jsx`
- ✅ `Frontend/src/services/teamService.js`

---

**Status:** Ready to test after running database migration
**Priority:** HIGH - Database migration must be run before testing
