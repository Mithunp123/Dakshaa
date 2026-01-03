# 🚀 Quick Deployment Checklist

## Pre-Deployment
- [ ] Backup current Supabase database
- [ ] Review `database/complete_combo_schema.sql`
- [ ] Ensure no users are actively registering

## Database Deployment
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy contents of `database/complete_combo_schema.sql`
- [ ] Paste into SQL Editor
- [ ] Click **RUN**
- [ ] Verify success (look for ✅ messages)
- [ ] Run verification queries from IMPLEMENTATION_COMPLETE.md

## Verification
- [ ] Check tables exist:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('combo_event_selections', 'payment_transactions', 'notification_queue');
  ```
- [ ] Check functions exist:
  ```sql
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name LIKE '%combo%';
  ```
- [ ] Test validation function:
  ```sql
  SELECT validate_combo_selection(NULL, '[]'::jsonb);
  ```

## Frontend Deployment
- [ ] Pull latest code
- [ ] Run `npm install` (if needed)
- [ ] Run `npm run build`
- [ ] Deploy to hosting

## Testing
- [ ] Create test combo in admin panel
- [ ] Test combo purchase as student
- [ ] Verify registrations created
- [ ] Check notifications sent
- [ ] Verify payment records

## Post-Deployment
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Review database performance
- [ ] Update documentation if needed

---

## Emergency Rollback

If issues occur:

1. **Database Rollback**:
   ```sql
   -- Drop new tables (data will be lost!)
   DROP TABLE IF EXISTS combo_event_selections CASCADE;
   DROP TABLE IF EXISTS payment_transactions CASCADE;
   DROP TABLE IF EXISTS notification_queue CASCADE;
   
   -- Drop new functions
   DROP FUNCTION IF EXISTS validate_combo_selection CASCADE;
   DROP FUNCTION IF EXISTS explode_combo_purchase CASCADE;
   DROP FUNCTION IF EXISTS create_combo_purchase CASCADE;
   DROP FUNCTION IF EXISTS complete_combo_payment CASCADE;
   DROP FUNCTION IF EXISTS get_user_combo_purchases CASCADE;
   ```

2. **Frontend Rollback**:
   ```bash
   git revert HEAD
   npm run build
   # Deploy previous version
   ```

---

## Success Criteria

✅ All SQL statements executed without errors  
✅ All 3 tables created  
✅ All 5 functions created  
✅ RLS policies active  
✅ Test combo purchase completes successfully  
✅ Individual registrations created  
✅ Notifications sent

---

**Estimated Deployment Time**: 15-30 minutes

**Risk Level**: Low (all changes are additions, no data modification)

**Requires Downtime**: No

---

Ready to deploy? Follow steps in order ☝️
