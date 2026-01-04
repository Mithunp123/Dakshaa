# 🚀 EVENT REGISTRATION - QUICK START GUIDE

**Fast reference for using the new event registration system**

---

## 📦 What's New

### Database Changes
- ✅ **Proper Types**: TEXT → NUMERIC/INTEGER/BOOLEAN
- ✅ **10 RPC Functions**: Complete registration workflow
- ✅ **Missing Fields Added**: combo_purchase_id, explosion_completed, etc.
- ✅ **Performance Indexes**: 15+ indexes for faster queries
- ✅ **Triggers**: Auto-notifications on new registrations

### Frontend Changes
- ✅ **Updated Service**: `supabaseService.js` uses new RPC functions
- ✅ **Validation**: Pre-registration checks (capacity, duplicates)
- ✅ **Team Support**: Full team registration flow
- ✅ **Admin Functions**: Registration management & statistics

---

## 🎯 Quick Usage Examples

### 1. Check Event Capacity

```javascript
import { supabaseService } from './services/supabaseService';

// Check before showing register button
const capacityInfo = await supabaseService.checkEventCapacity(eventId);

if (capacityInfo.available) {
  console.log(`${capacityInfo.remaining_spots} spots remaining`);
} else {
  console.log('Event is full!');
}
```

### 2. Register for Events (Individual)

```javascript
// Step 1: Validate (automatic in new registerEvents)
const result = await supabaseService.registerEvents(
  userId,
  [eventId1, eventId2, eventId3]
);

console.log(result);
// {
//   success: true,
//   registration_ids: ['uuid1', 'uuid2', 'uuid3'],
//   total_amount: 850,
//   event_count: 3
// }
```

### 3. Get User Registrations

```javascript
const registrations = await supabaseService.getUserRegistrations(userId);

registrations.forEach(reg => {
  console.log(`${reg.event_name}: ${reg.payment_status}`);
  console.log(`QR Code: ${reg.qr_code}`);
  console.log(`Attendance: ${reg.attendance_status}`);
});
```

### 4. Process Payment

```javascript
// After payment gateway returns success
const paymentResult = await supabaseService.confirmPayment(
  userId,
  registrationIds, // Array of UUIDs from step 2
  'RAZOR_123456', // Transaction ID from gateway
  850 // Total amount paid
);

if (paymentResult.success) {
  alert('Payment confirmed! Check your email for QR code.');
}
```

### 5. Team Registration

```javascript
// Check if team meets requirements
const validation = await supabaseService.validateTeamRegistration(
  teamId,
  eventId
);

if (!validation.valid) {
  console.error('Team validation failed:', validation.errors);
  return;
}

// Register entire team
const teamReg = await supabaseService.registerTeam(
  teamId,
  eventId,
  true // Leader pays for all members
);

console.log(`Team of ${teamReg.team_size} registered for ₹${teamReg.total_amount}`);
```

### 6. Admin: Get Event Registrations

```javascript
// Get all registrations for an event
const registrations = await supabaseService.getEventRegistrations(eventId);

// Filter by payment status
const paidRegistrations = await supabaseService.getEventRegistrations(
  eventId,
  'PAID'
);

registrations.forEach(reg => {
  console.log(`${reg.user_name} (${reg.user_email})`);
  console.log(`Status: ${reg.payment_status}`);
  console.log(`College: ${reg.user_college}`);
});
```

### 7. Admin: Update Registration Status

```javascript
// Manually approve pending payment
const updateResult = await supabaseService.updateRegistrationStatus(
  adminId,
  registrationId,
  'PAID',
  'MANUAL_APPROVAL_123'
);

if (updateResult.success) {
  console.log('Registration approved!');
}
```

### 8. Admin: Dashboard Statistics

```javascript
// Global stats
const globalStats = await supabaseService.getRegistrationStats();
console.log(`Total Revenue: ₹${globalStats.total_revenue}`);
console.log(`Pending: ${globalStats.pending_registrations}`);

// Event-specific stats
const eventStats = await supabaseService.getRegistrationStats(eventId);
console.log(`Event Revenue: ₹${eventStats.total_revenue}`);
```

---

## 🔧 Database Functions Reference

### User Functions

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `validate_event_registration` | Check if user can register | `p_user_id`, `p_event_ids[]` | `{valid: boolean, errors: []}` |
| `create_event_registration` | Create registration records | `p_user_id`, `p_event_ids[]`, `p_combo_purchase_id?` | `{success, registration_ids[], total_amount}` |
| `process_payment_confirmation` | Confirm payment | `p_user_id`, `p_registration_ids[]`, `p_transaction_id`, `p_payment_amount` | `{success, updated_count}` |
| `get_user_registrations` | Get user's registrations | `p_user_id` | Table of registrations |
| `check_event_capacity` | Real-time capacity check | `p_event_id` | `{available, capacity, remaining_spots}` |
| `create_team_registration` | Register team | `p_team_id`, `p_event_id`, `p_leader_pays?` | `{success, registration_ids[], total_amount, team_size}` |
| `validate_team_registration` | Validate team | `p_team_id`, `p_event_id` | `{valid, errors[], team_size}` |

### Admin Functions

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `get_event_registrations` | Get all event registrations | `p_event_id`, `p_status?` | Table of registrations with user details |
| `update_registration_status` | Update payment status | `p_admin_id`, `p_registration_id`, `p_new_status`, `p_transaction_id?` | `{success, new_status}` |
| `get_registration_statistics` | Get stats | `p_event_id?` | `{total, paid, pending, revenue}` |

---

## 📝 Schema Changes Summary

### events table

| Old (TEXT) | New (Proper Type) | Example |
|------------|-------------------|---------|
| `price` TEXT | `price` NUMERIC(10,2) | 350.00 |
| `capacity` TEXT | `capacity` INTEGER | 100 |
| `current_registrations` TEXT | `current_registrations` INTEGER | 45 |
| `is_team_event` TEXT | `is_team_event` BOOLEAN | true |
| `is_active` TEXT | `is_active` BOOLEAN | true |
| `is_open` TEXT | `is_open` BOOLEAN | true |

### event_registrations_config table

**New Fields:**
- `combo_purchase_id` UUID (FK to combo_purchases)
- `payment_amount` NUMERIC(10,2) (was TEXT)

### combo_purchases table

**New Fields:**
- `explosion_completed` BOOLEAN
- `individual_registration_ids` UUID[]

---

## ⚠️ Breaking Changes

### 1. Registration Service

**Old:**
```javascript
// Direct insert, no validation
await supabase
  .from('event_registrations_config')
  .insert({ user_id, event_id });
```

**New:**
```javascript
// Uses RPC with validation
await supabaseService.registerEvents(userId, [eventId]);
```

### 2. Query Filters

**Old:**
```javascript
// TEXT comparison
.eq('is_active', 'true')
```

**New:**
```javascript
// Boolean comparison
.eq('is_active', true)
```

### 3. Price Calculations

**Old:**
```javascript
// Manual parsing
const price = parseFloat(event.price || '0');
```

**New:**
```javascript
// Direct numeric
const price = event.price; // Already numeric
```

---

## 🐛 Common Errors & Fixes

### Error: "Function does not exist"

**Cause:** RPC functions not deployed

**Fix:**
```sql
-- Run in Supabase SQL Editor
\i EVENT_REGISTRATION_RPC_FUNCTIONS.sql
```

### Error: "Column does not exist"

**Cause:** Schema migration not run

**Fix:**
```sql
-- Run migration script
\i SCHEMA_MIGRATION_SCRIPT.sql
```

### Error: "Already registered for this event"

**Cause:** Duplicate registration attempt (expected behavior)

**Fix:** Check existing registrations first:
```javascript
const existing = await supabaseService.getUserRegistrations(userId);
const alreadyRegistered = existing.some(r => r.event_id === eventId);
```

### Error: "Event is full"

**Cause:** Capacity reached

**Fix:** Check capacity before showing register button:
```javascript
const capacity = await supabaseService.checkEventCapacity(eventId);
if (!capacity.available) {
  // Disable register button or show "FULL" badge
}
```

---

## 🔐 Security Notes

1. **RLS Policies Active**
   - Users can only view their own registrations
   - Admins can view all registrations
   - All functions use `SECURITY DEFINER` for privilege escalation

2. **Auth Required**
   - All functions require authenticated user
   - Use `auth.uid()` for user_id
   - Admin functions check role before execution

3. **Rate Limiting**
   - TODO: Add rate limiting on registration endpoints
   - Prevent spam registrations

4. **Input Validation**
   - All UUIDs validated
   - Numeric fields have CHECK constraints
   - Foreign key constraints enforced

---

## 🎨 UI Components to Update

### 1. Event Card Component

```jsx
// Add capacity indicator
const EventCard = ({ event }) => {
  const [capacity, setCapacity] = useState(null);

  useEffect(() => {
    supabaseService.checkEventCapacity(event.id)
      .then(setCapacity);
  }, [event.id]);

  return (
    <div className="event-card">
      <h3>{event.name}</h3>
      <p>₹{event.price}</p>
      {capacity && (
        <div className="capacity-indicator">
          <progress value={capacity.current_registrations} max={capacity.capacity} />
          <span>{capacity.remaining_spots} spots left</span>
        </div>
      )}
      <button disabled={!capacity?.available}>
        {capacity?.available ? 'Register' : 'FULL'}
      </button>
    </div>
  );
};
```

### 2. Registration Form

```jsx
// Add validation before submission
const handleRegister = async () => {
  try {
    // Auto-validates via RPC
    const result = await supabaseService.registerEvents(
      userId,
      selectedEventIds
    );
    
    // Redirect to payment
    navigate('/payment', { 
      state: { 
        registrationIds: result.registration_ids,
        amount: result.total_amount
      }
    });
  } catch (error) {
    alert(error.message);
  }
};
```

### 3. Admin Dashboard

```jsx
// Show live statistics
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    supabaseService.getRegistrationStats()
      .then(setStats);
  }, []);

  return (
    <div className="dashboard">
      <StatCard title="Total Registrations" value={stats?.total_registrations} />
      <StatCard title="Revenue" value={`₹${stats?.total_revenue}`} />
      <StatCard title="Pending" value={stats?.pending_registrations} />
    </div>
  );
};
```

---

## 📞 Need Help?

1. **Check Documentation:**
   - `EVENT_REGISTRATION_COMPLETE_ANALYSIS.md` - Detailed analysis
   - `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
   - `FRESH_PRODUCTION_SCHEMA.sql` - Complete schema

2. **Database Issues:**
   - Run verification queries in SQL Editor
   - Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'events';`
   - Check functions: `\df *registration*`

3. **Frontend Issues:**
   - Check browser console for errors
   - Verify Supabase client initialized
   - Check auth state: `supabase.auth.getUser()`

---

**Last Updated:** January 4, 2026  
**Version:** 2.0.0  
**Status:** ✅ Production Ready
