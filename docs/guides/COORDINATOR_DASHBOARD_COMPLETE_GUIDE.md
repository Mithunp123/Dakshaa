# 🎯 Event Coordinator Dashboard - Complete Implementation Guide
## Updated: December 30, 2025

---

## 📋 Overview

The **Event Coordinator Dashboard** is a mobile-optimized system for event coordinators to:
- ✅ Scan QR codes to mark attendance
- ✅ Track morning and evening session attendance separately
- ✅ View real-time participant statistics
- ✅ Mark manual attendance for walk-ins
- ✅ Select and submit event winners

---

## 🗄️ Database Schema

### Attendance Table Structure

The attendance system uses a **column-based session tracking** approach:

```sql
-- Attendance table with session columns
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    event_id TEXT NOT NULL,  -- References events.event_id (legacy format)
    marked_by UUID REFERENCES auth.users(id),
    morning_attended BOOLEAN DEFAULT FALSE,
    evening_attended BOOLEAN DEFAULT FALSE,
    morning_time TIMESTAMPTZ,
    evening_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)  -- One row per user per event
);
```

### Key Design Decision: Columns vs Rows

**Why columns instead of rows for sessions?**
| Approach | Pros | Cons |
|----------|------|------|
| **Columns (Current)** | Single row per user/event, simpler queries, no duplicates | Less flexible for >2 sessions |
| **Rows (Old)** | Unlimited sessions | Duplicate handling complex, more rows |

---

## 🔧 RPC Functions

### File: `database/coordinator_scanner.sql`

### 1. `mark_manual_attendance()`

Marks attendance for a user at an event with session tracking.

```sql
CREATE OR REPLACE FUNCTION public.mark_manual_attendance(
    p_user_id UUID,
    p_event_uuid UUID,
    p_marked_by UUID,
    p_session_type TEXT DEFAULT 'morning'
)
RETURNS JSON
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `p_user_id` | UUID | The student's UUID (from QR code) |
| `p_event_uuid` | UUID | Event ID from `events_config` table |
| `p_marked_by` | UUID | Coordinator's UUID |
| `p_session_type` | TEXT | 'morning' or 'evening' |

**Return Values:**
```json
// Success
{
  "status": "success",
  "message": "Attendance marked successfully for morning session",
  "code": "ACCESS_GRANTED",
  "student_name": "John Doe",
  "event_name": "Paper Presentation",
  "session_type": "morning",
  "timestamp": "2025-12-30T10:00:00Z"
}

// Already marked
{
  "status": "warning",
  "message": "Already marked attendance for morning session",
  "code": "DUPLICATE_ENTRY",
  "student_name": "John Doe",
  "session_type": "morning"
}

// Not registered
{
  "status": "error",
  "message": "User not registered for this event",
  "code": "NOT_REGISTERED"
}
```

**Logic Flow:**
```
1. Validate session type (morning/evening)
2. Get student info from `profiles`
3. Get event info from `events_config`
4. Check registration in `event_registrations_config`
5. SELECT INTO existing attendance row
6. IF NOT FOUND → INSERT new row
7. ELSE → Check if already marked → UPDATE if not
8. Return appropriate status JSON
```

### 2. `get_event_stats()`

Returns live statistics for an event.

```sql
CREATE OR REPLACE FUNCTION public.get_event_stats(p_event_id UUID)
RETURNS JSON
```

**Returns:**
```json
{
  "registered": 50,
  "morning_attended": 35,
  "evening_attended": 28,
  "total_attended": 40,
  "morning_remaining": 15,
  "evening_remaining": 22
}
```

---

## 🎨 Frontend Component

### File: `Frontend/src/Pages/Admin/Coordinator/EventCoordinatorDashboard.jsx`

### Key State Variables

```jsx
// Session tracking
const [selectedSession, setSelectedSession] = useState('morning');
const selectedSessionRef = useRef(selectedSession);  // For scanner callback
const selectedEventRef = useRef(selectedEvent);      // For scanner callback

// Scanner state
const [scanning, setScanning] = useState(false);
const [cameraId, setCameraId] = useState(null);
const [cameraError, setCameraError] = useState(null);
const html5QrCodeRef = useRef(null);

// Stats
const [stats, setStats] = useState({
  registered: 0,
  morningCheckedIn: 0,
  eveningCheckedIn: 0,
  totalCheckedIn: 0,
  morningRemaining: 0,
  eveningRemaining: 0
});
```

### Critical Fix: Stale Closure Problem

**Problem:** QR scanner callback captures state at initialization time, not current values.

**Solution:** Use `useRef` to track current values:

```jsx
// Keep refs in sync with state
useEffect(() => {
  selectedSessionRef.current = selectedSession;
  console.log('Session updated to:', selectedSession);
}, [selectedSession]);

useEffect(() => {
  selectedEventRef.current = selectedEvent;
  console.log('Event updated to:', selectedEvent?.name);
}, [selectedEvent]);

// In scanner callback, use refs
const onScanSuccess = async (decodedText) => {
  const currentSession = selectedSessionRef.current;  // ✅ Always current
  const currentEvent = selectedEventRef.current;      // ✅ Always current
  
  // NOT: selectedSession (❌ stale value from initialization)
};
```

### QR Scanner Implementation

Uses `html5-qrcode` library:

```jsx
import { Html5Qrcode } from 'html5-qrcode';

const initializeScanner = async () => {
  // Wait for DOM element to exist
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const scannerElement = document.getElementById('qr-reader');
  if (!scannerElement) {
    setCameraError('Scanner element not found');
    setScanning(false);
    return;
  }

  html5QrCodeRef.current = new Html5Qrcode("qr-reader", { verbose: false });
  
  const config = {
    fps: 15,
    qrbox: { width: 220, height: 220 },
    aspectRatio: 1.0,
    experimentalFeatures: { useBarCodeDetectorIfSupported: true }
  };

  await html5QrCodeRef.current.start(
    { facingMode: "environment" },  // Back camera
    config,
    onScanSuccess,
    () => {}  // Silent error handler
  );
};
```

### Scanner Lifecycle

```jsx
// Start scanning - just set state, useEffect handles initialization
const startScanning = () => {
  setScanning(true);
  setCameraError(null);
};

// useEffect triggers initialization when scanning becomes true
useEffect(() => {
  if (scanning) {
    initializeScanner();
  }
}, [scanning]);

// Stop scanning
const stopScanning = async () => {
  if (html5QrCodeRef.current?.isScanning) {
    await html5QrCodeRef.current.stop();
  }
  setScanning(false);
};

// Cleanup on unmount
useEffect(() => {
  return () => stopScanning();
}, []);
```

### Scan Success Handler

```jsx
const onScanSuccess = async (decodedText) => {
  const currentSession = selectedSessionRef.current;
  const currentEvent = selectedEventRef.current;
  
  console.log('QR Scanned:', decodedText);
  console.log('Current Session (from ref):', currentSession);
  console.log('Current Event (from ref):', currentEvent?.name);
  
  // Haptic feedback
  navigator.vibrate?.(100);
  
  // Stop, process, restart
  await stopScanning();
  await markAttendanceWithSessionAndEvent(decodedText, currentSession, currentEvent);
  
  // Auto-restart after 1 second
  setTimeout(() => startScanning(), 1000);
};
```

### Dakshaa ID Display

```jsx
const formatDakshaaId = (uuid) => {
  if (!uuid) return 'N/A';
  return `DK-${uuid.substring(0, 8).toUpperCase()}`;
};

// Usage
<p className="font-mono text-secondary">{formatDakshaaId(participant.user_id)}</p>
// Output: DK-8C362499
```

### Toast Notifications

```jsx
import toast, { Toaster } from 'react-hot-toast';

// In component render
<Toaster position="top-center" />

// Success toast with custom styling
const showSuccessToast = (name, session) => {
  const sessionLabel = session === 'evening' ? 'PM' : 'AM';
  const sessionColor = session === 'evening' ? '#6366f1' : '#f59e0b';
  
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
                    bg-green-500 rounded-2xl p-4 flex items-center`}>
      <CheckCircle2 className="text-white mr-4" size={28} />
      <div>
        <p className="text-white font-bold">{name}</p>
        <p className="text-white/80 text-sm">
          <span className="px-2 py-0.5 rounded" style={{ backgroundColor: sessionColor }}>
            {sessionLabel}
          </span>
          Attendance Marked ✓
        </p>
      </div>
    </div>
  ), { duration: 1500 });
};

// Error/Warning toasts
toast.error('User not registered', { duration: 2000, icon: '❌' });
toast('Already marked', { duration: 2000, icon: '⚠️', 
      style: { background: '#fef3c7', color: '#92400e' } });
```

### Real-time Subscription

```jsx
useEffect(() => {
  if (!selectedEvent) return;
  
  const channel = supabase
    .channel('attendance-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'attendance' },
      (payload) => {
        console.log('Attendance change detected:', payload);
        fetchParticipants();
        fetchStats();
      }
    )
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [selectedEvent]);
```

---

## 📱 UI Components

### Session Selector

```jsx
<div className="flex gap-2 px-4 py-2">
  <button
    onClick={() => setSelectedSession('morning')}
    className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 ${
      selectedSession === 'morning'
        ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20'
        : 'bg-white/5 text-gray-400 border border-white/10'
    }`}
  >
    <Sun size={18} /> Morning
  </button>
  <button
    onClick={() => setSelectedSession('evening')}
    className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 ${
      selectedSession === 'evening'
        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
        : 'bg-white/5 text-gray-400 border border-white/10'
    }`}
  >
    <Moon size={18} /> Evening
  </button>
</div>
```

### Stats Display

```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
    <Users className="mx-auto text-blue-500 mb-2" size={24} />
    <p className="text-2xl font-bold text-blue-500">{stats.registered}</p>
    <p className="text-xs text-gray-400 uppercase">Registered</p>
  </div>
  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
    <Sun className="mx-auto text-yellow-500 mb-2" size={24} />
    <p className="text-2xl font-bold text-yellow-500">{stats.morningCheckedIn}</p>
    <p className="text-xs text-gray-400 uppercase">Morning ✓</p>
  </div>
  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
    <Moon className="mx-auto text-indigo-500 mb-2" size={24} />
    <p className="text-2xl font-bold text-indigo-500">{stats.eveningCheckedIn}</p>
    <p className="text-xs text-gray-400 uppercase">Evening ✓</p>
  </div>
  <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-center">
    <Clock className="mx-auto text-secondary mb-2" size={24} />
    <p className="text-2xl font-bold text-secondary">
      {selectedSession === 'morning' ? stats.morningRemaining : stats.eveningRemaining}
    </p>
    <p className="text-xs text-gray-400 uppercase">
      {selectedSession === 'morning' ? 'AM Left' : 'PM Left'}
    </p>
  </div>
</div>
```

### Scanner Active Indicator

```jsx
{scanning && (
  <div className="space-y-4">
    {/* Event Indicator */}
    <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/30 text-center">
      <p className="text-xs text-gray-400 uppercase mb-1">Scanning for Event</p>
      <p className="text-secondary font-bold text-lg">{selectedEvent?.name}</p>
    </div>
    
    {/* Session Indicator */}
    <div className={`p-3 rounded-xl text-center font-bold flex items-center justify-center gap-2 ${
      selectedSession === 'morning' 
        ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' 
        : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
    }`}>
      {selectedSession === 'morning' ? <Sun size={18} /> : <Moon size={18} />}
      {selectedSession === 'morning' ? 'MORNING' : 'EVENING'} Session
    </div>
    
    {/* Scanner View */}
    <div id="qr-reader" className="rounded-2xl overflow-hidden bg-black min-h-[300px]" />
    
    <p className="text-sm text-gray-400 text-center">
      Point camera at QR code • Auto-scanning enabled
    </p>
    
    <button onClick={stopScanning} className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl">
      <X size={20} /> Stop Scanning
    </button>
  </div>
)}
```

---

## 🔄 Workflow

### Coordinator Login Flow

```
1. Coordinator logs in → email/password
2. System fetches profile from `profiles` table
3. Checks role = 'event_coordinator'
4. Redirects to /coordinator
5. Dashboard fetches assigned events
6. Coordinator ready to scan!
```

### Attendance Marking Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SELECT EVENT from dropdown                               │
│ 2. SELECT SESSION (Morning/Evening)                         │
│ 3. CLICK "Start Scanning"                                   │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Camera activates                                          │
│ 5. Scanner initializes (Html5Qrcode)                        │
│ 6. DOM element ready check                                   │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Student shows QR code (contains UUID)                     │
│ 8. Scanner reads QR → triggers onScanSuccess()              │
│ 9. Get current session/event from REFS (not state!)         │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Call mark_manual_attendance RPC                          │
│     - Check registration                                     │
│     - Check existing attendance                              │
│     - Insert or Update                                       │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. Show toast notification (success/warning/error)         │
│ 12. Stats refresh via real-time subscription                │
│ 13. Scanner auto-restarts after 1 second                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: Scanner shows wrong session after switching

**Symptom:** Select evening, scan QR, but morning attendance is marked

**Cause:** Stale closure - `onScanSuccess` captures `selectedSession` at initialization

**Solution:**
```jsx
// Add ref for session
const selectedSessionRef = useRef(selectedSession);

// Keep ref updated
useEffect(() => {
  selectedSessionRef.current = selectedSession;
}, [selectedSession]);

// Use ref in callback
const onScanSuccess = async (decodedText) => {
  const currentSession = selectedSessionRef.current;  // ✅ Current value
  // NOT: selectedSession  ❌ Stale value
};
```

### Issue: "HTML Element with id=qr-reader not found"

**Symptom:** Error when starting scanner

**Cause:** Scanner initializes before React renders the DOM element

**Solution:**
```jsx
// Use useEffect to initialize after render
useEffect(() => {
  if (scanning) {
    initializeScanner();
  }
}, [scanning]);

// Add delay for DOM
const initializeScanner = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const element = document.getElementById('qr-reader');
  if (!element) {
    setCameraError('Scanner element not found');
    setScanning(false);
    return;
  }
  // ... continue initialization
};
```

### Issue: Counts not updating after scan

**Symptom:** Stats stay the same after successful attendance

**Cause:** SQL function using `IS NULL` instead of `FOUND`

**Solution:**
```sql
-- ❌ Wrong approach
SELECT morning_attended INTO v_existing_morning FROM attendance WHERE ...;
IF v_existing_morning IS NULL THEN  -- FALSE is not NULL!
  INSERT ...

-- ✅ Correct approach  
SELECT morning_attended INTO v_existing_morning FROM attendance WHERE ...;
IF NOT FOUND THEN  -- Row doesn't exist
  INSERT ...
ELSE  -- Row exists, update it
  UPDATE ...
END IF;
```

### Issue: "Already marked" when marking different session

**Symptom:** Marked morning, try evening, get "already marked for morning"

**Cause:** Checking wrong session or SQL logic error

**Solution:** Check the `v_session` variable is being passed correctly:
```sql
IF (v_session = 'morning' AND COALESCE(v_existing_morning, FALSE) = TRUE) THEN
  RETURN 'warning: already marked morning';
END IF;

IF (v_session = 'evening' AND COALESCE(v_existing_evening, FALSE) = TRUE) THEN
  RETURN 'warning: already marked evening';
END IF;

-- Only reaches here if correct session is not marked yet
IF v_session = 'morning' THEN
  UPDATE ... SET morning_attended = TRUE, morning_time = NOW();
ELSE
  UPDATE ... SET evening_attended = TRUE, evening_time = NOW();
END IF;
```

---

## 📁 File Structure

```
DaKshaa-login/
├── Frontend/
│   └── src/
│       ├── Pages/
│       │   └── Admin/
│       │       └── Coordinator/
│       │           └── EventCoordinatorDashboard.jsx  ← Main dashboard
│       └── supabase.js
│
├── database/
│   └── coordinator_scanner.sql  ← RPC functions & schema
│
└── md_files/
    └── COORDINATOR_DASHBOARD_COMPLETE_GUIDE.md  ← This file
```

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor
-- Run: database/coordinator_scanner.sql
```

### 2. Assign Coordinator Role

```sql
-- Set user role
UPDATE profiles 
SET role = 'event_coordinator' 
WHERE email = 'coordinator@example.com';

-- Assign events
INSERT INTO coordinator_event_assignments (coordinator_id, event_id)
SELECT 
  (SELECT id FROM profiles WHERE email = 'coordinator@example.com'),
  id
FROM events_config 
WHERE name IN ('Paper Presentation', 'Code Debugging', 'Web Design Contest');
```

### 3. Install Dependencies

```bash
cd Frontend
npm install html5-qrcode react-hot-toast
```

### 4. Test the System

1. Login with coordinator credentials
2. Navigate to `/coordinator`
3. Select event from dropdown
4. Choose morning or evening session
5. Start scanning
6. Scan a registered student's QR code
7. Verify toast notification appears
8. Check stats update
9. Switch session and re-scan same student
10. Verify different session is marked

---

## 📊 Console Debugging

Enable these logs to debug issues:

```
Session updated to: morning
Event updated to: Paper Presentation
QR Scanned: 8c362499-ff1c-4b77-80b8-4b2b8080d29a
Current Session (from ref): morning
Current Event (from ref): Paper Presentation
Marking attendance: {userId: '8c362499-...', eventUuid: '789d8773-...', eventName: 'Paper Presentation', session: 'morning'}
RPC Result: {status: 'success', message: 'Attendance marked successfully for morning session', code: 'ACCESS_GRANTED', student_name: 'Pavithran', ...}
Attendance change detected: {eventType: 'INSERT', ...}
```

---

## ✅ Features Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| QR Scanner with mobile camera | ✅ | Uses html5-qrcode |
| Morning/Evening session toggle | ✅ | With visual indicators |
| Real-time stats display | ✅ | Auto-updates via subscription |
| Toast notifications | ✅ | Success/warning/error styles |
| Dakshaa ID display | ✅ | DK-XXXXXXXX format |
| Manual attendance marking | ✅ | Search by name/ID |
| Winner selection | ✅ | 1st, 2nd, 3rd place |
| Real-time subscription | ✅ | Postgres changes |
| Auto-restart scanning | ✅ | 1 second delay |
| Haptic feedback | ✅ | navigator.vibrate |
| Camera error handling | ✅ | Retry button |
| Event/Session indicators while scanning | ✅ | Clear visual display |
| Stale closure fix | ✅ | useRef for session/event |

---

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| Dec 30, 2025 | 2.0 | Fixed stale closure with useRef for session and event |
| Dec 30, 2025 | 1.9 | Added event indicator while scanning |
| Dec 30, 2025 | 1.8 | Changed Html5QrcodeScanner → Html5Qrcode for better control |
| Dec 30, 2025 | 1.7 | Added useEffect for DOM-ready scanner initialization |
| Dec 30, 2025 | 1.6 | Implemented react-hot-toast notifications |
| Dec 30, 2025 | 1.5 | Added Dakshaa ID format (DK-XXXXXXXX) |
| Dec 30, 2025 | 1.4 | Fixed SQL with IF NOT FOUND pattern |
| Dec 30, 2025 | 1.3 | Changed row-based → column-based session tracking |
| Dec 30, 2025 | 1.2 | Added morning/evening session support |
| Dec 30, 2025 | 1.1 | Added real-time stats subscription |
| Dec 30, 2025 | 1.0 | Initial coordinator dashboard |

---

*Last Updated: December 30, 2025*
*Author: DaKshaa Development Team*
