# 🚨 DaKshaa T26 - Complete Error Fix Guide

## Issues Identified & Fixes Applied

### 1. **Backend Connection Refused (localhost:3000)**
**Error**: `net::ERR_CONNECTION_REFUSED`

**Cause**: Backend server is not running

**Solution**:
```powershell
cd Backend
npm install
npm start
```

✅ **Fixed**: Backend dependencies are installed and .env is configured

---

### 2. **Infinite Recursion in Teams RLS Policy**
**Error**: `infinite recursion detected in policy for relation "teams"`

**Cause**: The RLS policy for `team_members` table had nested queries that referenced the `teams` table within its own policy

**Solution Applied**: Created `database/fix_rls_policies.sql` which:
- Removes recursive policies
- Simplifies the SELECT conditions
- Uses direct subqueries instead of nested EXISTS
- Properly handles team member visibility

**Action Required**:
1. Open: https://app.supabase.com
2. Go to: SQL Editor
3. Open file: `database/fix_rls_policies.sql`
4. Copy all content and paste into Supabase
5. Click Run

---

### 3. **404 Errors on Accommodation Table**
**Error**: `Failed to load resource: the server responded with a status of 404`

**Cause**: 
- Table may not exist
- RLS policies blocking access
- Missing SELECT permissions

**Solution Applied**:
- Created proper RLS policies for `accommodation` table
- Fixed INSERT permissions for authenticated users
- Added proper SELECT/UPDATE permissions
- Granted permissions to authenticated role

---

### 4. **Hardcoded API URLs**
**Error**: API calls stuck to `localhost:3000` even when deployed

**Solution Applied**:
Updated files to use environment variable:
- `Frontend/src/Pages/Accomodation/Components/AccommodationBooking.jsx`
- `Frontend/src/Pages/Home/Components/Contact.jsx`
- `Frontend/src/Pages/Register/Components/SignUpForm.jsx`

Now uses: `import.meta.env.VITE_API_URL || 'http://localhost:3000'`

---

### 5. **WebGL Context Loss**
**Error**: `THREE.WebGLRenderer: Context Lost`

**Cause**: 3D graphics library memory issue (usually temporary)

**Solution**: 
- Automatic recovery in browser
- Check browser console for persistent errors
- Clear cache if issue persists

---

## Environment Files Status

✅ **Frontend/.env** - Configured
```env
VITE_SUPABASE_URL=https://ltmyqtcirhsgfyortgfo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_VP9VW_jByG-ifTFUQLNTlw_AwY2uGce
VITE_API_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_APP_NAME=DaKshaa T26
```

✅ **Backend/.env** - Configured
```env
SUPABASE_URL=https://ltmyqtcirhsgfyortgfo.supabase.co
SUPABASE_ANON_KEY=sb_publishable_VP9VW_jByG-ifTFUQLNTlw_AwY2uGce
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
EMAIL_USER=pavithranai19@gmail.com
EMAIL_PASSWORD=qnsgrfyslzvblczt
```

---

## Step-by-Step Fix Process

### Step 1: Fix Database (REQUIRED)
```
1. Open: https://app.supabase.com
2. Go to: SQL Editor
3. Paste entire content from: database/fix_rls_policies.sql
4. Click: Run
5. Wait for: "RLS Policies Fixed Successfully!"
```

### Step 2: Start Backend
```powershell
cd Backend
npm install
npm start
# You should see: ✅ Backend connected to Supabase
# Server running on port 3000
```

### Step 3: Start Frontend
```powershell
cd Frontend
npm install
npm run dev
# Access at: http://localhost:5173
```

### Step 4: Test the Application
- Create an account
- Book accommodation
- Book lunch
- Create a team
- Register for events

---

## Quick Start Script

Use the provided automation script:
```powershell
.\start-app.ps1
```

This will:
1. Check .env files
2. Remind you to run RLS fix in Supabase
3. Install dependencies
4. Start both servers in new windows

---

## Troubleshooting Checklist

- [ ] .env files exist in Frontend and Backend
- [ ] Supabase credentials are correct
- [ ] RLS policies have been fixed in Supabase
- [ ] Backend server is running on port 3000
- [ ] Frontend dev server is running on port 5173
- [ ] Supabase tables exist (check in Supabase Studio)
- [ ] RLS is enabled on correct tables
- [ ] Browser console shows no 404 errors
- [ ] No "infinite recursion" errors in Supabase logs

---

## Common Errors & Solutions

### "Missing Supabase credentials"
- Check Frontend/.env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Check Backend/.env has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Restart both servers after fixing .env

### "Failed to fetch accommodation data"
- Run fix_rls_policies.sql in Supabase
- Verify accommodation table exists
- Check RLS policies in Supabase UI

### "infinite recursion detected in policy"
- This is fixed by running fix_rls_policies.sql
- If error persists, manually drop all policies on team_members
- Re-run the SQL fix script

### "404 on /add-accommodation"
- Backend server must be running
- Check Backend/.env is configured
- Verify API_URL in Frontend/.env is correct

### "CORS error"
- Ensure Backend/server.js has: `app.use(cors())`
- Restart backend server
- Clear browser cache

---

## Files Modified/Created

### Created:
- ✅ `database/fix_rls_policies.sql` - RLS policy fixes
- ✅ `start-app.ps1` - Automation script
- ✅ `FIX_GUIDE.md` - This file

### Modified:
- ✅ `Frontend/.env` - Added VITE_API_URL
- ✅ `Frontend/src/Pages/Accomodation/Components/AccommodationBooking.jsx` - Using env var for API URL
- ✅ `Frontend/src/Pages/Home/Components/Contact.jsx` - Using env var for API URL
- ✅ `Frontend/src/Pages/Register/Components/SignUpForm.jsx` - Using env var for API URL

---

## Next Steps

1. **Run the RLS Fix in Supabase** (most important!)
2. **Start Backend**: `cd Backend && npm start`
3. **Start Frontend**: `cd Frontend && npm run dev`
4. **Test**: Navigate to http://localhost:5173
5. **Create an account** and test accommodation/lunch booking
6. **Check browser console** for any remaining errors

---

## Support

If you encounter issues:
1. Check browser console (F12) for error details
2. Check Supabase dashboard for database errors
3. Verify all environment variables are set
4. Review the error message format and match it to this guide
5. Restart both servers if nothing else works

---

**Last Updated**: December 31, 2025
**Status**: ✅ READY FOR TESTING
