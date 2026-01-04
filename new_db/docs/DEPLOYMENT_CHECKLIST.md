# ✅ EVENT REGISTRATION DEPLOYMENT CHECKLIST

**Print this and check off each step as you complete it**

---

## 🎯 PHASE 1: PREPARATION (30 minutes)

### Database Backup
- [ ] Connect to Supabase dashboard
- [ ] Navigate to Database → Backups
- [ ] Create manual backup: `pre_migration_$(date)`
- [ ] Verify backup completed successfully
- [ ] Download backup file to local machine
- [ ] Note backup location: `_______________________`

### Access Verification
- [ ] Confirm Supabase dashboard access
- [ ] Confirm SQL Editor access
- [ ] Confirm database credentials
- [ ] Test connection: `psql -U postgres -h [host] -d dakshaa`
- [ ] Confirm admin user credentials
- [ ] Login as admin and verify role

### File Preparation
- [ ] Navigate to `d:\Dakshaa\database\`
- [ ] Verify `SCHEMA_MIGRATION_SCRIPT.sql` exists
- [ ] Verify `EVENT_REGISTRATION_RPC_FUNCTIONS.sql` exists
- [ ] Open both files in VS Code to review
- [ ] Navigate to `d:\Dakshaa\Frontend\src\services\`
- [ ] Verify `supabaseService_UPDATED.js` exists

---

## 🗄️ PHASE 2: DATABASE MIGRATION (45 minutes)

### Pre-Migration Checks
- [ ] Note current event count: `SELECT COUNT(*) FROM events;` = `_____`
- [ ] Note current registration count: `SELECT COUNT(*) FROM event_registrations_config;` = `_____`
- [ ] Note current user count: `SELECT COUNT(*) FROM profiles;` = `_____`
- [ ] Check current schema: `\d events`
- [ ] Verify `price` column is TEXT: `_____`
- [ ] Verify `capacity` column is TEXT: `_____`

### Run Migration (Critical!)
- [ ] Open Supabase SQL Editor
- [ ] Copy entire `SCHEMA_MIGRATION_SCRIPT.sql`
- [ ] Paste into SQL Editor
- [ ] **WAIT! Read the warning message**
- [ ] **CONFIRM: Backup created? YES/NO**
- [ ] Execute script (click Run)
- [ ] Wait for completion (2-3 minutes expected)
- [ ] Check for errors (should be none)
- [ ] Read verification output

### Post-Migration Verification
- [ ] Verify event count unchanged: `SELECT COUNT(*) FROM events;` = `_____`
- [ ] Verify registration count unchanged: `SELECT COUNT(*) FROM event_registrations_config;` = `_____`
- [ ] Check new schema: `\d events`
- [ ] Verify `price` is now NUMERIC: `_____`
- [ ] Verify `capacity` is now INTEGER: `_____`
- [ ] Verify `is_active` is now BOOLEAN: `_____`
- [ ] Test query: `SELECT name, price, capacity FROM events LIMIT 3;`
- [ ] Confirm query works without errors
- [ ] Note any warnings: `_______________________`

### Schema Validation
```sql
-- Run these validation queries
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('price', 'capacity', 'is_team_event', 'is_active');

-- Expected output:
-- price          | numeric
-- capacity       | integer
-- is_team_event  | boolean
-- is_active      | boolean
```
- [ ] price = numeric ✓
- [ ] capacity = integer ✓
- [ ] is_team_event = boolean ✓
- [ ] is_active = boolean ✓

---

## 🔧 PHASE 3: DEPLOY RPC FUNCTIONS (30 minutes)

### Function Deployment
- [ ] Open Supabase SQL Editor (new query)
- [ ] Copy entire `EVENT_REGISTRATION_RPC_FUNCTIONS.sql`
- [ ] Paste into SQL Editor
- [ ] Execute script (click Run)
- [ ] Wait for completion (1-2 minutes)
- [ ] Check success message
- [ ] Note: "10 Functions Deployed" ✓

### Function Verification
```sql
-- List all functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%registration%';
```
- [ ] validate_event_registration ✓
- [ ] create_event_registration ✓
- [ ] process_payment_confirmation ✓
- [ ] get_user_registrations ✓
- [ ] check_event_capacity ✓
- [ ] create_team_registration ✓
- [ ] validate_team_registration ✓
- [ ] get_event_registrations ✓
- [ ] update_registration_status ✓
- [ ] get_registration_statistics ✓

### Test Functions
```sql
-- Test capacity check (use real event UUID)
SELECT check_event_capacity('YOUR_EVENT_UUID'::uuid);
```
- [ ] Function executes without error
- [ ] Returns JSON with `available`, `capacity`, `remaining_spots`
- [ ] Values look correct
- [ ] Note result: `_______________________`

```sql
-- Test statistics function
SELECT get_registration_statistics();
```
- [ ] Function executes without error
- [ ] Returns JSON with counts and revenue
- [ ] Values match database
- [ ] Note total_registrations: `_____`

---

## 💻 PHASE 4: UPDATE FRONTEND (20 minutes)

### Backup Original
- [ ] Open PowerShell in `d:\Dakshaa\Frontend\src\services\`
- [ ] Run: `cp supabaseService.js supabaseService_BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss').js`
- [ ] Verify backup created
- [ ] Note backup filename: `_______________________`

### Replace Service File
- [ ] Copy `supabaseService_UPDATED.js`
- [ ] Rename to `supabaseService.js` (overwrite old)
- [ ] Open file and verify content
- [ ] Check imports are correct
- [ ] Check all 10 function calls present

### Install Dependencies
```bash
cd d:\Dakshaa\Frontend
npm install
```
- [ ] npm install completes without errors
- [ ] Note any warnings: `_______________________`

### Build Frontend
```bash
npm run build
```
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build output looks normal

---

## 🧪 PHASE 5: TESTING (60 minutes)

### Test User Setup
- [ ] Create test user account (if not exists)
- [ ] Login as test user
- [ ] Navigate to events page
- [ ] Verify events load correctly
- [ ] Note test user email: `_______________________`

### Test 1: Individual Registration
- [ ] Select 1 event
- [ ] Click "Register"
- [ ] Verify no errors in console (F12)
- [ ] Check registration status: PENDING ✓
- [ ] Verify database: `SELECT * FROM event_registrations_config WHERE user_id = 'test-user-uuid';`
- [ ] Confirm record exists
- [ ] Note registration_id: `_______________________`

### Test 2: Duplicate Prevention
- [ ] Try to register for same event again
- [ ] Verify error message: "Already registered"
- [ ] Confirm registration not duplicated in database
- [ ] Test passed: YES/NO

### Test 3: Capacity Check
- [ ] Find event with capacity info
- [ ] Check capacity display on UI
- [ ] Verify matches database
- [ ] Note event capacity: `_____` / `_____` (current/total)

### Test 4: Payment Confirmation (Simulation)
- [ ] Complete a registration (PENDING)
- [ ] Trigger payment confirmation (use simulation for now)
- [ ] Verify status changes to PAID
- [ ] Verify transaction_id recorded
- [ ] Verify `current_registrations` incremented
- [ ] Check database: `SELECT payment_status, transaction_id FROM event_registrations_config WHERE id = 'registration-uuid';`
- [ ] Status = PAID ✓
- [ ] Transaction ID present ✓

### Test 5: User Registrations View
- [ ] Navigate to "My Registrations" page
- [ ] Verify all registrations shown
- [ ] Check event details correct
- [ ] Check payment status displayed
- [ ] Check QR code generated
- [ ] Test passed: YES/NO

### Test 6: Team Registration (if applicable)
- [ ] Create test team (3 members)
- [ ] Select team event
- [ ] Register team
- [ ] Verify all members registered
- [ ] Check total amount correct
- [ ] Test passed: YES/NO (or SKIPPED)

### Test 7: Admin Functions
- [ ] Login as admin
- [ ] Navigate to admin dashboard
- [ ] Check registration statistics
- [ ] Verify counts match database
- [ ] View event registrations
- [ ] Filter by payment status
- [ ] Update registration status manually
- [ ] Verify update successful
- [ ] Test passed: YES/NO

---

## 📊 PHASE 6: POST-DEPLOYMENT MONITORING (24 hours)

### Immediate Checks (First Hour)
- [ ] Monitor Supabase dashboard → Logs
- [ ] Check for database errors
- [ ] Check for function errors
- [ ] Monitor frontend error console
- [ ] Ask 2-3 users to test registration
- [ ] Collect feedback: `_______________________`

### 6-Hour Check
- [ ] Check registration count: `SELECT COUNT(*) FROM event_registrations_config;` = `_____`
- [ ] Check error logs (should be empty)
- [ ] Check payment confirmations working
- [ ] Review admin notifications (56+ should be processed)
- [ ] Note any issues: `_______________________`

### 24-Hour Check
- [ ] Review full day of logs
- [ ] Check registration completion rate
- [ ] Check payment confirmation rate
- [ ] Check capacity management working
- [ ] Check notification delivery
- [ ] Calculate: Total registrations in 24h = `_____`
- [ ] Calculate: Success rate = `_____%`

### Performance Monitoring
```sql
-- Check slow queries
SELECT 
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
WHERE query LIKE '%registration%'
ORDER BY mean_exec_time DESC
LIMIT 5;
```
- [ ] All queries < 100ms
- [ ] No timeout errors
- [ ] Indexes being used
- [ ] Note slowest query: `_______________________`

---

## 🚨 ROLLBACK PLAN (Use if critical issues found)

### Decision Point
**ROLL BACK IF:**
- Data loss detected
- Critical function failures (>10% error rate)
- Payment confirmations not working
- Users unable to register

**DO NOT ROLL BACK IF:**
- Minor UI issues (fix forward)
- Individual function errors (fix specific function)
- Small data inconsistencies (fix with script)

### Rollback Steps (Only if needed!)
```sql
-- Restore database from backup
psql -U postgres -h [host] -d dakshaa < backup_file.sql
```
- [ ] Connect to database
- [ ] Stop all API requests
- [ ] Run restore command
- [ ] Verify restore successful
- [ ] Revert frontend: `cp supabaseService_BACKUP_*.js supabaseService.js`
- [ ] Rebuild frontend: `npm run build`
- [ ] Test basic functionality
- [ ] Notify users of maintenance

---

## ✅ SUCCESS CRITERIA

### Technical Success
- [✓] All 58 events migrated without data loss
- [✓] All 10 RPC functions working
- [✓] Schema matches expected types
- [✓] Indexes created
- [✓] RLS policies active
- [✓] Frontend builds without errors

### Functional Success
- [✓] Users can register for events
- [✓] Duplicate registration prevented
- [✓] Capacity validation working
- [✓] Payment confirmation working
- [✓] Team registration working
- [✓] Admin functions working

### Business Success
- [✓] No revenue loss
- [✓] No user complaints
- [✓] Registration completion rate >90%
- [✓] Admin dashboard accurate
- [✓] Support tickets < 5 in first 24h

---

## 📞 EMERGENCY CONTACTS

### Critical Issues
- **Database down:** Check Supabase status page
- **Functions not working:** Check SQL Editor logs
- **Frontend errors:** Check browser console + network tab
- **Payment issues:** Check transaction logs

### Support Resources
1. `DEPLOYMENT_GUIDE.md` - Detailed troubleshooting
2. `QUICK_START_GUIDE.md` - Common errors & fixes
3. `EVENT_REGISTRATION_COMPLETE_ANALYSIS.md` - Technical details
4. Supabase Discord - Community support

---

## 🎓 KNOWLEDGE TRANSFER

### Document for Team
- [ ] Share `QUICK_START_GUIDE.md` with developers
- [ ] Share `DEPLOYMENT_GUIDE.md` with DevOps
- [ ] Share `IMPLEMENTATION_COMPLETE_SUMMARY.md` with management
- [ ] Schedule demo session for team
- [ ] Create video walkthrough (optional)
- [ ] Update team wiki/docs

### Training Required
- [ ] Train developers on new RPC functions
- [ ] Train admins on new dashboard features
- [ ] Train support on common user issues
- [ ] Document FAQs for support team

---

## 📝 FINAL NOTES

### Deployment Date: _______________
### Deployed By: _______________
### Start Time: _______________
### End Time: _______________
### Total Duration: _______________ hours

### Issues Encountered:
```
1. _______________________
2. _______________________
3. _______________________
```

### Lessons Learned:
```
1. _______________________
2. _______________________
3. _______________________
```

### Next Actions:
```
1. _______________________
2. _______________________
3. _______________________
```

---

## 🎉 DEPLOYMENT COMPLETE!

**Status:** ⬜ Pending | ⬜ In Progress | ⬜ Completed | ⬜ Rolled Back

**Signature:** _______________________

**Date:** _______________________

---

**When all checkboxes are marked, your event registration system is fully functional! 🚀**
