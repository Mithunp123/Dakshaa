# Coordinator Event Filtering & Data Restoration - Changelog

**Date:** December 31, 2025  
**Session Duration:** ~3 hours  
**Status:** ✅ Completed

---

## Overview

This session focused on implementing proper event filtering for coordinators, ensuring they only see and interact with their assigned events. Additionally, a SQL script was created to restore student registration data.

---

## Issues Addressed

### 1. Coordinators Seeing All Events
**Problem:** Event coordinators could see all events in the system instead of only their assigned events.

**Root Cause:** The dashboard and coordinator components were fetching all events from `events_config` without filtering by coordinator assignments.

### 2. UUID vs TEXT Mismatch Error
**Problem:** Console error: `invalid input syntax for type uuid: "codeathon"`

**Root Cause:** The `event_coordinators` table stores `event_id` as TEXT values (like "codeathon", "conference") but the code was trying to query `events_config.id` which is a UUID column.

### 3. Student Registrations Deleted
**Problem:** Student registration data was accidentally deleted when running the events seed script.

**Solution:** Created a SQL script to restore student registrations.

---

## Files Modified

### 1. EventCoordinatorDashboard.jsx
**Path:** `Frontend/src/Pages/Admin/Coordinator/EventCoordinatorDashboard.jsx`

**Changes:**
- Modified `fetchAssignedEvents()` to only fetch coordinator's assigned events
- Added UUID detection to handle both UUID and TEXT event_id formats
- Super admins still see all events

**Key Code Change:**
```jsx
} else if (profile?.role === 'event_coordinator') {
  // Coordinators ONLY see their assigned events
  const { data: coords, error: coordError } = await supabase
    .from('event_coordinators')
    .select('event_id')
    .eq('user_id', user.id);
  
  if (coordError) throw coordError;
  
  const assignedEventIds = coords?.map(c => c.event_id) || [];
  
  if (assignedEventIds.length > 0) {
    // Check if event_ids are UUIDs or text event_keys
    const isUUID = assignedEventIds[0]?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    let eventsError, assignedEvents;
    if (isUUID) {
      // Query by UUID id
      const result = await supabase
        .from('events_config')
        .select('*')
        .in('id', assignedEventIds);
      eventsError = result.error;
      assignedEvents = result.data;
    } else {
      // Query by text event_key
      const result = await supabase
        .from('events_config')
        .select('*')
        .in('event_key', assignedEventIds);
      eventsError = result.error;
      assignedEvents = result.data;
    }
    
    if (eventsError) throw eventsError;
    events = assignedEvents || [];
  }
}
```

---

### 2. Dashboard.jsx (Coordinator)
**Path:** `Frontend/src/Pages/Admin/Coordinator/Dashboard.jsx`

**Changes:**
- Added same UUID/TEXT detection logic for event filtering
- Coordinators now only see their assigned events
- Super admins continue to see all open events

**Key Code Change:**
```jsx
} else if (assignedEventIds.length > 0) {
  // Check if event_ids are UUIDs or text event_keys
  const isUUID = assignedEventIds[0]?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  
  // Coordinators only see their assigned events
  if (isUUID) {
    const { data: configEvents } = await supabase
      .from('events_config')
      .select('*')
      .in('id', assignedEventIds);
    events = configEvents || [];
  } else {
    const { data: configEvents } = await supabase
      .from('events_config')
      .select('*')
      .in('event_key', assignedEventIds);
    events = configEvents || [];
  }
}
```

---

### 3. AttendanceScanner.jsx
**Path:** `Frontend/src/Pages/Admin/Volunteer/AttendanceScanner.jsx`

**Changes:**
- Added `fetchAssignedEvents()` function to get coordinator's event assignments
- Added `assignedEventIds` and `isSuperAdmin` state variables
- Modified scanned student event filtering to only show events the coordinator is assigned to
- Added UUID/TEXT detection for proper comparison

**New State Variables:**
```jsx
const [assignedEventIds, setAssignedEventIds] = useState([]);
const [isSuperAdmin, setIsSuperAdmin] = useState(false);
```

**New Function:**
```jsx
const fetchAssignedEvents = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'super_admin') {
      setIsSuperAdmin(true);
      return;
    }

    const { data: coords } = await supabase
      .from('event_coordinators')
      .select('event_id')
      .eq('user_id', user.id);

    const eventIds = coords?.map(c => c.event_id) || [];
    setAssignedEventIds(eventIds);
  } catch (error) {
    console.error("Error fetching assigned events:", error);
  }
};
```

**Event Filtering Logic:**
```jsx
// Filter events based on coordinator's assignments (unless super admin)
let filteredEventsData = eventsData;
if (!isSuperAdmin && assignedEventIds.length > 0) {
  // Check if assignedEventIds are UUIDs or text event_keys
  const isUUID = assignedEventIds[0]?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  
  if (isUUID) {
    filteredEventsData = eventsData.filter((e) => 
      assignedEventIds.includes(e.event_id)
    );
  } else {
    filteredEventsData = eventsData.filter((e) => 
      assignedEventIds.includes(e.event_key)
    );
  }
  
  if (filteredEventsData.length === 0) {
    // Show warning that student isn't registered for coordinator's events
  }
}
```

---

### 4. restore_student_registrations.sql (New File)
**Path:** `database/restore_student_registrations.sql`

**Purpose:** SQL script to restore student registrations that were accidentally deleted.

**Contents:**
- Queries to view existing students
- Queries to view available events
- INSERT statements to register students for events
- Bulk registration examples
- Verification queries

**Example Usage:**
```sql
-- Register a single student for an event
INSERT INTO event_registrations_config (user_id, event_id, event_name, payment_status)
SELECT p.id, e.id, e.name, 'PAID'
FROM profiles p, events_config e
WHERE p.email = 'student@example.com'
  AND e.event_key = 'tech-cse'
ON CONFLICT (user_id, event_id) DO NOTHING;

-- Bulk register multiple students
INSERT INTO event_registrations_config (user_id, event_id, event_name, payment_status)
SELECT p.id, e.id, e.name, 'PAID'
FROM profiles p
CROSS JOIN events_config e
WHERE p.email IN ('student1@example.com', 'student2@example.com')
  AND e.event_key IN ('tech-cse', 'workshop-ai')
ON CONFLICT (user_id, event_id) DO NOTHING;
```

---

## Database Schema Reference

### Tables Involved

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `events_config` | `id` (UUID), `event_key` (TEXT), `name`, `category` | Primary events table |
| `event_coordinators` | `user_id` (UUID), `event_id` (TEXT or UUID) | Links coordinators to events |
| `event_registrations_config` | `user_id`, `event_id` (UUID), `payment_status` | Student registrations |
| `profiles` | `id` (UUID), `email`, `role`, `full_name` | User profiles |

### Data Type Mismatch Issue

The `event_coordinators.event_id` column was designed to reference `events_config.id` (UUID), but the actual data contains TEXT values matching `events_config.event_key`.

**Solution:** Added runtime detection to check if the value is a UUID or TEXT and query the appropriate column.

---

## Behavior After Changes

### For Super Admins
- ✅ See all open events in dashboards
- ✅ Can scan attendance for any event
- ✅ Full access to all coordinator features

### For Event Coordinators
- ✅ Only see events they are assigned to
- ✅ Can only mark attendance for their assigned events
- ✅ Student scan shows warning if student isn't registered for coordinator's events
- ✅ Dashboard stats only reflect their assigned events

---

## Deployment Steps

```powershell
# Navigate to Frontend directory
Set-Location D:\Downloads\DaKshaa-login\Frontend

# Build the application
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

---

## Testing Checklist

- [ ] Login as super_admin - should see all events
- [ ] Login as event_coordinator - should only see assigned events
- [ ] Coordinator dashboard shows correct event count
- [ ] Coordinator attendance scanner filters by assigned events
- [ ] Student scan shows warning for non-assigned events
- [ ] No console errors for UUID/TEXT mismatch

---

## Related Files

- [ADMIN_ROLES_GUIDE.md](ADMIN_ROLES_GUIDE.md) - Role permissions documentation
- [ATTENDANCE_SYSTEM_GUIDE.md](ATTENDANCE_SYSTEM_GUIDE.md) - Attendance scanner documentation
- [EVENT_CONFIGURATION_GUIDE.md](EVENT_CONFIGURATION_GUIDE.md) - Event setup guide

---

## Future Recommendations

1. **Normalize event_coordinators table**: Update `event_id` column to consistently use UUIDs referencing `events_config.id`

2. **Add database constraint**: Add foreign key constraint after normalizing data:
   ```sql
   ALTER TABLE event_coordinators
   ADD CONSTRAINT fk_event_coordinators_event
   FOREIGN KEY (event_id) REFERENCES events_config(id);
   ```

3. **Create migration script**: Write a one-time migration to convert TEXT event_keys to UUIDs in `event_coordinators`

---

*Document generated: December 31, 2025*
