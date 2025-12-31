# 🚀 QUICK FIX - Table Creation (2 min)

## The Problem
```
ERROR: 42P01: relation "public.accommodation" does not exist
```

## The Solution (Copy & Paste)

### Step 1: Open Supabase
Go to: **https://app.supabase.com**

### Step 2: Open SQL Editor
Click: **SQL Editor** (left sidebar)

### Step 3: Copy This SQL
Open this file and copy ALL content:
```
database/setup_accommodation_and_lunch.sql
```

### Step 4: Paste in Supabase
Right-click in SQL Editor → Paste

### Step 5: Run
Click: **Run** button

### Step 6: Success!
You should see:
```
✅ Tables created and RLS policies applied successfully!
```

---

## What It Does

- ✅ Creates `accommodation` table
- ✅ Creates `lunch_bookings` table  
- ✅ Adds all columns needed
- ✅ Enables Row-Level Security
- ✅ Creates RLS policies
- ✅ Sets up permissions

---

## Then What?

1. Open new PowerShell terminal:
```powershell
cd Backend
npm start
```

2. Open another PowerShell terminal:
```powershell
cd Frontend
npm run dev
```

3. Open browser:
```
http://localhost:5173
```

4. Test by booking accommodation ✅

---

## Still Getting Errors?

1. **Verify tables exist**: Supabase → Database → Tables
   - See `accommodation` table? ✅
   - See `lunch_bookings` table? ✅

2. **Verify RLS is ON**: Click table → Check "Row Level Security: On"

3. **Verify policies exist**: Click table → Policies tab → See 4 policies? ✅

4. **Restart servers**: Kill both PowerShell windows, start again

5. **Clear browser cache**: Press Ctrl+Shift+Delete in browser

---

**Done!** Your tables are now created and ready to use. 🎉
