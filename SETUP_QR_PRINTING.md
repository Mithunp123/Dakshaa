# Quick Setup Instructions for QR Printing System

## Prerequisites
- Ensure you have access to Supabase dashboard
- Verify you have super admin or database admin privileges

## Step-by-Step Setup

### 1. Apply Database Migration

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire content from `database/add_is_print_column.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify success message appears

#### Option B: Via Command Line
```bash
# If you have Supabase CLI installed
cd database
supabase db execute -f add_is_print_column.sql
```

### 2. Verify Database Changes

Run this query in SQL Editor to verify:
```sql
-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'is_print';

-- Check if functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('can_print_qr', 'mark_as_printed');
```

Expected results:
- Column `is_print` should exist with type `boolean` and default `false`
- Two functions should be listed

### 3. Install Frontend Dependencies

The system uses existing dependencies, but verify these are installed:

```bash
cd Frontend
npm install qrcode.react react-hot-toast
```

### 4. Test the System

#### Test 1: Verify Print Button Appears
1. Login as Super Admin
2. Go to Registration Management
3. Select any event with registrations
4. You should see "Print QR" button (green) next to "Download Report"

#### Test 2: Test Coordinator Restrictions
1. Login as Event Coordinator
2. Navigate to assigned event
3. Click "Print QR" (should work first time)
4. Try clicking "Print QR" again (should show error)

#### Test 3: Verify Scanner Shows Events
1. Login as Coordinator/Volunteer
2. Open Scanner page
3. Scan a student's QR code
4. Verify registered events are displayed

### 5. Common Issues & Fixes

#### Issue: "Print QR" button not visible
**Fix**: 
```javascript
// Check if imports are correct in RegistrationManagement.jsx
import QRPrintSheet from '../../../Components/QR/QRPrintSheet';
import { Printer } from 'lucide-react';
import toast from 'react-hot-toast';
```

#### Issue: Database functions not working
**Fix**: Re-run the migration SQL, ensure you have proper permissions

#### Issue: QR codes not printing properly
**Fix**: 
- Check browser supports print API
- Ensure CSS file is imported
- Try different browser (Chrome/Edge recommended)

#### Issue: Scanner not showing events
**Fix**:
- Clear browser cache
- Verify QR contains JSON format
- Check network connection to Supabase

### 6. Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove the column
ALTER TABLE profiles DROP COLUMN IF EXISTS is_print;

-- Drop the functions
DROP FUNCTION IF EXISTS can_print_qr(UUID, TEXT);
DROP FUNCTION IF EXISTS mark_as_printed(UUID);

-- Drop the index
DROP INDEX IF EXISTS idx_profiles_is_print;
```

## Quick Verification Checklist

After setup, verify:

- [ ] Database migration applied successfully
- [ ] `is_print` column exists in profiles table
- [ ] Helper functions created
- [ ] Print button visible in Registration Management
- [ ] QRPrintSheet component renders
- [ ] Team events generate multiple QRs
- [ ] Coordinator restrictions work
- [ ] Scanner shows registered events

## Need Help?

1. Check the main documentation: `docs/QR_PRINTING_SYSTEM.md`
2. Review browser console for errors
3. Check Supabase logs for database errors
4. Verify user roles in database

## Production Deployment

Before deploying to production:

1. **Backup Database**
   ```bash
   # Create a backup first
   pg_dump your_database > backup_before_qr_system.sql
   ```

2. **Test in Staging**
   - Apply migration in staging environment first
   - Test all functionality thoroughly
   - Verify no breaking changes

3. **Deploy Frontend**
   ```bash
   cd Frontend
   npm run build
   # Deploy build folder to your hosting
   ```

4. **Apply Database Changes**
   - Run migration in production database
   - Monitor for any errors

5. **Verify Production**
   - Test with real user accounts
   - Verify print functionality
   - Check scanner integration

## Success Indicators

You'll know the system is working when:
- ✅ Print button appears for authorized users
- ✅ QR codes print on clean white pages
- ✅ Coordinators get "already printed" message on second attempt
- ✅ Super admins can print unlimited times
- ✅ Scanner displays participant info and events
- ✅ Team events generate separate QRs per member

## Next Steps

After successful setup:
1. Train coordinators on using the print feature
2. Inform participants about QR codes
3. Set up scanner stations at event venue
4. Test end-to-end flow before event day

---

**Setup Date**: February 5, 2026
**Version**: 1.0.0
**Status**: Ready for Production
