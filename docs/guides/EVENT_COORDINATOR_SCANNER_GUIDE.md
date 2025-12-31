# Event Coordinator Scanner Guide

## Overview

The Event Coordinator Scanner is a mobile-optimized QR code scanning system that allows event coordinators and volunteers to mark student attendance at events. When a student's QR code is scanned, the system looks up their registered events and allows the coordinator to mark attendance for the appropriate event.

## Features

- 📱 **Mobile-First Design** - Optimized for scanning on mobile devices
- 🎯 **Multi-Event Support** - Handles students registered for multiple events
- ⚡ **Auto-Mark Single Event** - Automatically marks if only one pending event
- 🔄 **Camera Switching** - Switch between front/back cameras
- ✋ **Manual Entry** - Fallback option if QR scan fails
- 🔊 **Audio/Haptic Feedback** - Success/error sounds and vibration
- 📊 **Real-time Status** - Shows attendance status for all registered events
- 🔀 **Dual Table Sync** - Writes to both `attendance` and `attendance_logs` tables

---

## System Architecture

### Database Functions

| Function | Purpose |
|----------|---------|
| `get_user_registered_events(p_user_id)` | Returns all events user is registered for with attendance status |
| `get_user_profile_for_scanner(p_user_id)` | Returns user profile details for display |
| `mark_event_attendance(p_user_id, p_event_id, p_scanned_by, p_scan_location)` | Records attendance via QR scan (writes to both tables) |
| `mark_manual_attendance(p_user_id, p_event_uuid, p_marked_by)` | Records attendance via manual selection (writes to both tables) |

### Tables Used

| Table | Purpose |
|-------|---------|
| `profiles` | Student information (name, department, roll no) |
| `events_config` | Event details (name, venue, date, time) - UUID-based |
| `event_registrations_config` | Registration records with payment status |
| `attendance` | Legacy attendance table (event_id is TEXT) |
| `attendance_logs` | New attendance table (event_id is UUID) |

### Important: Dual Table Architecture

The system maintains backwards compatibility by writing to **both** attendance tables:

1. **`attendance`** (legacy) - Used by the coordinator dashboard
   - `event_id` is TEXT referencing `events.event_id`
   
2. **`attendance_logs`** (new) - Used by the AttendanceScanner
   - `event_id` is UUID referencing `events_config.id`

---

## Setup Instructions

### 1. Run Database Migration

Execute the SQL file in your Supabase SQL Editor:

```sql
-- Run the coordinator_scanner.sql file
-- Location: database/coordinator_scanner.sql
```

Or copy and paste the contents directly into the SQL Editor.

### 2. Verify Functions Created

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_user_registered_events', 
    'get_user_profile_for_scanner', 
    'mark_event_attendance'
);
```

Expected output: 3 rows with the function names.

### 3. Test the Functions

```sql
-- Test with a known user ID
SELECT * FROM get_user_registered_events('user-uuid-here');

-- Test profile lookup
SELECT get_user_profile_for_scanner('user-uuid-here');
```

---

## User Flow

### Coordinator Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    START SCANNING                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Scan Student QR Code                           │
│         (Contains User ID / UUID)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Lookup User Profile & Registered Events           │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────┐   ┌───────────────┐   ┌──────────────┐
    │ No Events │   │ Single Event  │   │ Multi Events │
    │ Found     │   │ (Auto-mark)   │   │ (Select one) │
    └───────────┘   └───────────────┘   └──────────────┘
            │               │                   │
            ▼               ▼                   ▼
    ┌───────────┐   ┌───────────────┐   ┌──────────────┐
    │   ERROR   │   │    SUCCESS    │   │ Show Modal   │
    │  Message  │   │   Message     │   │ Select Event │
    └───────────┘   └───────────────┘   └──────────────┘
                            │                   │
                            │                   ▼
                            │           ┌──────────────┐
                            │           │ Mark Selected│
                            │           │    Event     │
                            │           └──────────────┘
                            │                   │
                            ▼                   ▼
                    ┌─────────────────────────────────┐
                    │        Continue Scanning        │
                    └─────────────────────────────────┘
```

---

## Scanner Interface

### Main States

1. **Ready State** - Shows "Start Camera" button
2. **Scanning State** - Live camera feed with scan frame
3. **Loading State** - Processing scanned QR code
4. **Event Selection** - Modal with multiple events to choose
5. **Result State** - Success/Warning/Error feedback

### Event Selection Modal

When a student has multiple registered events:

```
┌─────────────────────────────────────────┐
│  👤 Student Name                        │
│  🏢 Department | #Roll Number           │
├─────────────────────────────────────────┤
│  SELECT EVENT TO MARK ATTENDANCE        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📅 Workshop: AI/ML Basics       │ → │
│  │    📍 Lab 101 | 🕐 10:00 AM     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📅 Hackathon Registration       │ → │
│  │    📍 Hall A | 🕐 2:00 PM       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ✅ Web Dev Workshop (Attended)  │   │
│  │    📍 Lab 102 | ✓ 9:30 AM       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [        Cancel        ]               │
└─────────────────────────────────────────┘
```

---

## Access Routes

| Route | Role | Description |
|-------|------|-------------|
| `/coordinator/scanner` | Event Coordinator | Scanner for assigned events |
| `/volunteer/scanner` | Volunteer | Scanner for general check-in |

---

## QR Code Format

The student's QR code should contain their **User ID (UUID)** from the `profiles` table.

### Example QR Content
```
550e8400-e29b-41d4-a716-446655440000
```

### Generating Student QR

Students can view their QR code from their dashboard:
- Route: `/dashboard/qr` or `/dashboard/profile`

---

## Response Codes

| Code | Status | Description |
|------|--------|-------------|
| `ACCESS_GRANTED` | success | Attendance marked successfully |
| `DUPLICATE_ENTRY` | warning | Already marked attendance for this event |
| `ALL_ATTENDED` | warning | All registered events already attended |
| `USER_NOT_FOUND` | error | Invalid user ID scanned |
| `EVENT_NOT_FOUND` | error | Event not found or inactive |
| `NOT_REGISTERED` | error | User not registered for selected event |
| `NO_EVENTS` | error | No registered events found |
| `DATABASE_ERROR` | error | System error occurred |

---

## Mobile Optimization

### Camera Configuration

```javascript
const config = {
  fps: 15,                    // Frames per second
  qrbox: { 
    width: 220,               // Scan area on mobile
    height: 220 
  },
  aspectRatio: 1.0,           // Square aspect ratio
  disableFlip: false,         // Allow image flip
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true  // Native API if available
  }
};
```

### Preferred Camera

The scanner automatically selects the back camera on mobile devices by looking for:
- `back`
- `rear`
- `environment`

in the camera label.

---

## Troubleshooting

### Camera Not Working

1. **Check Permissions** - Ensure camera access is allowed in browser
2. **HTTPS Required** - Camera only works on secure connections
3. **Retry Button** - Use the retry button to re-request permissions

### QR Not Scanning

1. **Lighting** - Ensure adequate lighting
2. **Distance** - Hold phone 6-12 inches from QR code
3. **Focus** - Keep phone steady for auto-focus
4. **Manual Entry** - Use manual entry as fallback

### Event Not Showing

1. **Payment Status** - Only PAID registrations appear
2. **Event Status** - Event must have `is_open = TRUE`
3. **Registration** - Verify user is registered for the event

---

## Database Schema Reference

### attendance_logs Table

```sql
CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    event_id UUID NOT NULL REFERENCES public.events_config(id),
    scanned_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    scan_location TEXT,
    UNIQUE(user_id, event_id, timestamp)
);
```

### Required Indexes

```sql
CREATE INDEX idx_attendance_user_event 
ON attendance_logs(user_id, event_id);

CREATE INDEX idx_attendance_timestamp 
ON attendance_logs(timestamp DESC);
```

---

## Security

### RLS Policies

- **Volunteers/Coordinators** can INSERT attendance logs
- **Admins** can view all attendance records
- **Students** can view only their own attendance

### Function Security

All functions use `SECURITY DEFINER` to run with elevated privileges while being safely parameterized.

---

## File Locations

| File | Purpose |
|------|---------|
| `database/coordinator_scanner.sql` | Database functions |
| `Frontend/src/Pages/Admin/Volunteer/AttendanceScanner.jsx` | Scanner component |
| `Frontend/src/App.css` | QR scanner styles |

---

## Related Documentation

- [ATTENDANCE_SYSTEM_GUIDE.md](ATTENDANCE_SYSTEM_GUIDE.md) - Full attendance system
- [VOLUNTEER_SCANNER_GUIDE.md](VOLUNTEER_SCANNER_GUIDE.md) - Volunteer operations
- [ADMIN_ROLES_GUIDE.md](ADMIN_ROLES_GUIDE.md) - Role permissions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2025 | Initial implementation with multi-event support |
