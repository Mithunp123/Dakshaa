# 🚀 EVENT REGISTRATION DEPLOYMENT GUIDE

**Complete step-by-step guide to deploy the fully functional event registration system**

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Migration](#database-migration)
3. [Deploy RPC Functions](#deploy-rpc-functions)
4. [Update Frontend](#update-frontend)
5. [Testing](#testing)
6. [Post-Deployment](#post-deployment)
7. [Rollback Plan](#rollback-plan)

---

## ✅ Pre-Deployment Checklist

### Prerequisites

- [ ] **Backup Database**
  ```bash
  # On server or local with remote connection
  pg_dump -U postgres -h your-db-host -d dakshaa > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Test Environment Available**
  - Staging database for testing migration
  - Test user accounts
  - Test events data

- [ ] **Access Credentials**
  - Supabase project dashboard access
  - Database superuser credentials
  - Service role key
  - Admin user account

- [ ] **Development Environment**
  - Node.js 18+ installed
  - npm or yarn installed
  - Git for version control
  - Code editor (VS Code)

---

## 🗄️ Database Migration

### Step 1: Connect to Database

#### Option A: Supabase SQL Editor (Recommended)
1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create new query

#### Option B: psql Command Line
```bash
psql postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
```

### Step 2: Run Schema Migration

**⚠️ CRITICAL: Test on staging first!**

```sql
-- Copy contents of SCHEMA_MIGRATION_SCRIPT.sql
-- Execute in SQL Editor or via psql
```

**Expected Output:**
```
📋 PHASE 1: Adding new columns with proper types...
✅ Events table: New columns added
✅ Event registrations config: Missing columns added
✅ Combos table: New columns added
✅ Combo purchases: Missing columns added

📋 PHASE 2: Migrating data to new columns...
✅ Events: 58 rows migrated
✅ Event registrations: 1 rows migrated
✅ Combos: 2 rows migrated

📋 PHASE 3: Replacing old columns with new ones...
✅ Events: Old columns dropped, new columns renamed
✅ Event registrations: Payment amount converted
✅ Combos: Old columns dropped, new columns renamed

📋 PHASE 4: Adding constraints and indexes...
✅ Events: Constraints added
✅ Event registrations: Constraints added
✅ Combos: Constraints added
✅ Indexes created

📋 PHASE 5: Updating RLS policies...
✅ RLS policies updated

📋 PHASE 6: Verification...
📊 Migration Statistics:
   Events migrated: 58
   Registrations migrated: 1
   Combos migrated: 2
   Capacity issues: 0
   
✅ MIGRATION COMPLETED SUCCESSFULLY!
```

### Step 3: Verify Migration

```sql
-- Check events table structure
\d events

-- Check data types
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('price', 'capacity', 'is_team_event', 'is_active');

-- Should show:
-- price           | numeric         | NO
-- capacity        | integer         | NO
-- is_team_event   | boolean         | NO
-- is_active       | boolean         | NO

-- Test query
SELECT name, price, capacity, is_team_event, is_active
FROM events
LIMIT 5;
```

**✅ Migration Success Criteria:**
- All TEXT columns converted to proper types
- No data loss (row counts match)
- Constraints applied
- Indexes created
- RLS policies updated

---

## 🔧 Deploy RPC Functions

### Step 1: Deploy Functions

```sql
-- In Supabase SQL Editor:
-- Copy entire EVENT_REGISTRATION_RPC_FUNCTIONS.sql and execute
```

**Expected Output:**
```
✅ Event Registration RPC Functions Created Successfully!
📊 10 Functions Deployed:
   1. validate_event_registration
   2. create_event_registration
   3. process_payment_confirmation
   4. get_user_registrations
   5. check_event_capacity
   6. create_team_registration
   7. validate_team_registration
   8. get_event_registrations
   9. update_registration_status
   10. get_registration_statistics
🔒 Permissions Granted to authenticated users
🎯 Ready for Full Event Registration System!
```

### Step 2: Verify Functions

```sql
-- List all new functions
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%registration%'
AND routine_schema = 'public';

-- Test capacity check function
SELECT check_event_capacity('YOUR_EVENT_UUID_HERE');

-- Should return JSON:
-- {
--   "available": true,
--   "capacity": 100,
--   "current_registrations": 5,
--   "remaining_spots": 95,
--   "percentage_filled": 5.00
-- }
```

### Step 3: Test Functions with Sample Data

```sql
-- Test validation (replace UUIDs with real ones)
SELECT validate_event_registration(
    'user-uuid-here'::uuid,
    ARRAY['event-uuid-1'::uuid, 'event-uuid-2'::uuid]
);

-- Expected: {"valid": true, "errors": []}

-- Test registration statistics
SELECT get_registration_statistics();

-- Expected: 
-- {
--   "total_registrations": 1,
--   "paid_registrations": 0,
--   "pending_registrations": 1,
--   "total_revenue": 0,
--   "pending_revenue": 0
-- }
```

---

## 💻 Update Frontend

### Step 1: Backup Old Service

```bash
cd d:/Dakshaa/Frontend/src/services
cp supabaseService.js supabaseService_BACKUP_$(date +%Y%m%d).js
```

### Step 2: Replace Service File

```bash
# Copy updated service
cp supabaseService_UPDATED.js supabaseService.js
```

### Step 3: Update Components

#### 3.1 Update EventRegistration.jsx (if needed)

Find and replace old registration call:
```javascript
// OLD
await supabaseService.registerEvents(userId, eventIds);

// NEW (with validation)
try {
  const result = await supabaseService.registerEvents(userId, eventIds);
  console.log('Registration successful:', result);
  // result contains: { success, registration_ids, total_amount, event_count }
} catch (error) {
  console.error('Registration failed:', error.message);
  // Handle validation errors
}
```

#### 3.2 Update RegistrationForm Component

Add capacity check before registration:
```javascript
// Check capacity first
const capacityCheck = await supabaseService.checkEventCapacity(eventId);
if (!capacityCheck.available) {
  alert(`Event is full! ${capacityCheck.remaining_spots} spots remaining.`);
  return;
}
```

#### 3.3 Update Payment Confirmation

```javascript
// After payment gateway response
const confirmResult = await supabaseService.confirmPayment(
  userId,
  registrationIds,
  transactionId,
  paymentAmount
);

if (confirmResult.success) {
  // Show success message
  // Redirect to registrations page
  navigate('/dashboard/registrations');
}
```

### Step 4: Install Dependencies

```bash
cd d:/Dakshaa/Frontend
npm install
```

### Step 5: Build and Test

```bash
# Development mode
npm run dev

# Production build
npm run build
```

---

## 🧪 Testing

### Test Plan

#### 1. **Individual Registration Flow**

**Test Case 1.1: Successful Registration**
- [ ] Login as test user
- [ ] Navigate to events page
- [ ] Select 2-3 events
- [ ] Click "Register"
- [ ] Verify validation passes
- [ ] Verify registration created with PENDING status
- [ ] Check database: `SELECT * FROM event_registrations_config WHERE user_id = 'test-user-id';`

**Test Case 1.2: Duplicate Registration Prevention**
- [ ] Try to register for same event again
- [ ] Verify error: "Already registered for this event"

**Test Case 1.3: Capacity Check**
- [ ] Create test event with capacity = 1
- [ ] Register user1 successfully
- [ ] Try to register user2
- [ ] Verify error: "Event is full"

**Test Case 1.4: Payment Confirmation**
- [ ] Complete registration (PENDING status)
- [ ] Simulate payment with transaction ID
- [ ] Verify status changes to PAID
- [ ] Verify `current_registrations` incremented
- [ ] Verify notification created

#### 2. **Team Registration Flow**

**Test Case 2.1: Team Size Validation**
- [ ] Create team with 2 members
- [ ] Try to register for event requiring min 3 members
- [ ] Verify error: "Team size too small"

**Test Case 2.2: Successful Team Registration**
- [ ] Create team with 4 members
- [ ] Register for team event (min: 3, max: 5)
- [ ] Verify all 4 members registered
- [ ] Verify total amount calculated correctly

#### 3. **Admin Functions**

**Test Case 3.1: Get Event Registrations**
- [ ] Login as admin
- [ ] View registrations for specific event
- [ ] Verify all user details shown
- [ ] Filter by payment status (PAID/PENDING)

**Test Case 3.2: Update Registration Status**
- [ ] Select PENDING registration
- [ ] Update to PAID manually
- [ ] Add transaction ID
- [ ] Verify update successful
- [ ] Check admin_logs table for entry

**Test Case 3.3: Registration Statistics**
- [ ] View dashboard
- [ ] Check statistics widget
- [ ] Verify counts match database
- [ ] Verify revenue calculations correct

#### 4. **Edge Cases**

**Test Case 4.1: Concurrent Registrations**
- [ ] Have 2 users register simultaneously for last spot
- [ ] Verify only 1 succeeds
- [ ] Verify capacity not exceeded

**Test Case 4.2: Invalid UUIDs**
- [ ] Try to register with non-existent event ID
- [ ] Verify error: "Event not found"

**Test Case 4.3: Expired Events**
- [ ] Try to register for past event
- [ ] Verify appropriate error message

---

## 📊 Post-Deployment

### Monitoring

#### 1. Database Monitoring

```sql
-- Monitor registration activity
SELECT 
    DATE(registered_at) as date,
    COUNT(*) as registrations,
    SUM(payment_amount) as revenue
FROM event_registrations_config
GROUP BY DATE(registered_at)
ORDER BY date DESC;

-- Check for errors
SELECT * FROM admin_logs
WHERE action_type = 'error'
ORDER BY created_at DESC
LIMIT 10;

-- Monitor capacity utilization
SELECT 
    e.name,
    e.capacity,
    e.current_registrations,
    ROUND((e.current_registrations::numeric / e.capacity::numeric * 100), 2) as fill_percentage
FROM events e
WHERE e.is_active = true
ORDER BY fill_percentage DESC;
```

#### 2. Frontend Monitoring

Check browser console for:
- API call errors
- Validation errors
- Network timeouts

Check server logs:
```bash
# If using PM2
pm2 logs backend

# If using systemd
journalctl -u dakshaa-backend -f
```

### Performance Optimization

#### 1. Add Database Indexes (if not already present)

```sql
-- Check current indexes
SELECT * FROM pg_indexes WHERE tablename = 'event_registrations_config';

-- Add missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registrations_user_id 
ON event_registrations_config(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registrations_event_id 
ON event_registrations_config(event_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registrations_payment_status 
ON event_registrations_config(payment_status);
```

#### 2. Enable Query Caching (Supabase Dashboard)

- Go to Database > Performance
- Enable PostgREST caching for read-heavy endpoints

### Security Audit

- [ ] Verify RLS policies active on all tables
- [ ] Test unauthorized access attempts
- [ ] Check service role key not exposed in frontend
- [ ] Verify rate limiting on registration endpoints
- [ ] Test SQL injection on input fields

---

## 🔙 Rollback Plan

### If Critical Issues Found

#### Immediate Rollback (Database)

```sql
-- Restore from backup
psql postgresql://[CONNECTION_STRING] < backup_YYYYMMDD_HHMMSS.sql

-- OR manual column restoration (see SCHEMA_MIGRATION_SCRIPT.sql comments)
```

#### Frontend Rollback

```bash
cd d:/Dakshaa/Frontend/src/services
cp supabaseService_BACKUP_YYYYMMDD.js supabaseService.js
npm run build
```

#### Partial Rollback (Keep schema, revert functions)

```sql
-- Drop new functions
DROP FUNCTION IF EXISTS validate_event_registration CASCADE;
DROP FUNCTION IF EXISTS create_event_registration CASCADE;
DROP FUNCTION IF EXISTS process_payment_confirmation CASCADE;
-- ... drop all 10 functions
```

---

## 📞 Support

### Common Issues

**Issue 1: "Function does not exist"**
- **Cause:** RPC functions not deployed
- **Fix:** Re-run EVENT_REGISTRATION_RPC_FUNCTIONS.sql

**Issue 2: "Column does not exist"**
- **Cause:** Migration not completed
- **Fix:** Re-run SCHEMA_MIGRATION_SCRIPT.sql phases

**Issue 3: "Permission denied for function"**
- **Cause:** Missing GRANT statements
- **Fix:** 
  ```sql
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
  ```

**Issue 4: "RLS policy violation"**
- **Cause:** User not authenticated or wrong policy
- **Fix:** Check auth.uid() matches user_id in requests

---

## ✅ Deployment Checklist

### Phase 1: Pre-Deployment
- [ ] Database backup created
- [ ] Staging environment tested
- [ ] Team notified of deployment
- [ ] Rollback plan reviewed

### Phase 2: Database
- [ ] Schema migration successful
- [ ] Data verified (no loss)
- [ ] RPC functions deployed
- [ ] Functions tested
- [ ] Indexes created

### Phase 3: Frontend
- [ ] Service file updated
- [ ] Components updated
- [ ] Dependencies installed
- [ ] Build successful
- [ ] Deployed to server

### Phase 4: Testing
- [ ] Individual registration tested
- [ ] Team registration tested
- [ ] Payment flow tested
- [ ] Admin functions tested
- [ ] Edge cases tested

### Phase 5: Monitoring
- [ ] Database monitoring active
- [ ] Frontend error tracking setup
- [ ] Performance metrics tracked
- [ ] User feedback collected

---

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All 58 events migrated to proper types
- ✅ All 10 RPC functions working
- ✅ Individual registration flow working
- ✅ Team registration flow working
- ✅ Payment confirmation working
- ✅ Admin dashboard showing correct stats
- ✅ No errors in logs for 24 hours
- ✅ User registrations completing successfully

---

## 📝 Next Steps After Deployment

1. **Payment Gateway Integration**
   - Replace `simulatePayment()` with real gateway
   - Add webhook handler for payment callbacks
   - Test with small amounts first

2. **QR Code System**
   - Implement QR generation on payment confirmation
   - Create QR scanner for attendance
   - Link to attendance table

3. **Email Notifications**
   - Setup SMTP credentials
   - Configure email templates
   - Test notification delivery

4. **Real-time Updates**
   - Enable Supabase real-time subscriptions
   - Update UI when events fill up
   - Show live registration counts

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Version:** 2.0.0 - Full Event Registration System

**Status:** ⬜ Pending | ⬜ In Progress | ⬜ Completed | ⬜ Rolled Back
