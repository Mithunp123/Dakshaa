# Team Join Request System - Setup Guide

## Overview
This system allows users to:
1. **See notifications** - Fully functional notification dropdown in the dashboard header
2. **Join existing teams** - Search for teams and send join requests
3. **Approve/reject requests** - Team leaders receive notifications and can approve/reject

## Database Setup

### Run this SQL script in Supabase SQL Editor:

1. Go to your Supabase project: https://ltmyqtcirhsgfyortgfo.supabase.co
2. Navigate to SQL Editor
3. Open and run: `database/setup_team_join_requests.sql`

This will create:
- `team_join_requests` table
- Notification trigger functions
- RPC functions for approve/reject
- RLS policies

## Features Implemented

### 1. ✅ Notification Dropdown (Fixed)
**Location:** Dashboard header (bell icon)

**Features:**
- Shows all notifications in a dropdown
- Real-time updates via Supabase channels
- Handles **team invitations** (Accept/Decline)
- Handles **join requests** (Approve/Reject)
- Mark as read functionality
- Visual indicators for unread notifications

**Types of Notifications:**
- `team_invitation` - When someone invites you to their team
- `team_join_request` - When someone wants to join your team
- `join_request_approved` - When your request is approved
- `join_request_rejected` - When your request is rejected

### 2. ✅ Join Team Feature
**Location:** Dashboard > My Teams > "Join Team" Tab

**Features:**
- Tab system: "My Teams" vs "Join Team"
- Live search for teams (300ms debounce)
- Shows team details:
  - Team name
  - Event name
  - Leader name
  - Current member count / max members
  - Full status
- Request to join button
- Track your join requests with status:
  - Pending (yellow)
  - Approved (green)
  - Rejected (red)
- Cancel pending requests

**Workflow:**
1. User searches for team by name
2. User clicks "Request Join"
3. Team leader gets notification
4. Leader approves/rejects from notification dropdown
5. User gets notification of decision
6. If approved, user is automatically added to team

## Files Modified

### Backend/Database
1. **`database/setup_team_join_requests.sql`** (NEW)
   - Complete database schema for join requests
   - Notification triggers
   - RPC functions

### Frontend Services
2. **`Frontend/src/services/teamService.js`** (UPDATED)
   - Added `searchTeamsToJoin()`
   - Added `sendJoinRequest()`
   - Added `getTeamJoinRequests()`
   - Added `getMyJoinRequests()`
   - Added `cancelJoinRequest()`

3. **`Frontend/src/services/notificationService.js`** (UPDATED)
   - Added `approveJoinRequest()`
   - Added `rejectJoinRequest()`

### Frontend Components
4. **`Frontend/src/Pages/Dashboard/Components/NotificationDropdown.jsx`** (NEW)
   - Complete notification dropdown component
   - Handles all notification types
   - Real-time updates
   - Accept/Reject buttons for invitations and join requests

5. **`Frontend/src/Pages/Dashboard/Components/DashboardLayout.jsx`** (UPDATED)
   - Replaced static bell icon with NotificationDropdown component
   - Import added

6. **`Frontend/src/Pages/Dashboard/Components/MyTeams.jsx`** (UPDATED)
   - Added tab system (My Teams / Join Team)
   - Added team search functionality
   - Added join request tracking
   - Added request management (cancel)

## Testing Instructions

### 1. Test Notification System
1. Hard refresh browser (Ctrl+Shift+R)
2. Look for bell icon in dashboard header (top right)
3. Click bell icon - dropdown should appear
4. Existing notifications should display

### 2. Test Join Team Feature
1. Go to Dashboard > My Teams
2. Click "Join Team" tab
3. Search for a team name
4. Click "Request Join" on a team
5. Check "My Join Requests" section below

### 3. Test Leader Approval (Need 2 accounts)
**Account 1 (Team Leader):**
1. Create a team
2. Wait for join request

**Account 2 (Member):**
1. Go to "Join Team" tab
2. Search for the team
3. Send join request

**Account 1 (Team Leader):**
1. Click bell icon (should show red dot)
2. See join request notification
3. Click "Approve" or "Reject"

**Account 2 (Member):**
1. Click bell icon
2. See approval/rejection notification
3. If approved, check "My Teams" - you should be in the team

## Troubleshooting

### Notifications not showing?
1. Verify database setup completed: `SELECT * FROM notifications LIMIT 1;`
2. Check browser console for errors
3. Try hard refresh (Ctrl+Shift+R)
4. Logout and login again

### Join request not working?
1. Verify table exists: `SELECT * FROM team_join_requests LIMIT 1;`
2. Check RPC functions exist: `SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%join_request%';`
3. Check browser console for errors

### Team search not working?
1. Make sure there are active teams: `SELECT * FROM teams WHERE is_active = true;`
2. Check that you're not already in those teams
3. Check for pending requests to those teams

## Next Steps

If you want additional features:
- Add team descriptions
- Add maximum pending requests limit
- Add auto-expiry for old pending requests
- Add team categories/filters
- Add team recommendations based on events registered

## Security Notes

- All operations protected by RLS policies
- Only team leaders can approve/reject
- Users can only see their own requests
- Team search excludes teams user is already in
- Duplicate requests prevented by UNIQUE constraint
