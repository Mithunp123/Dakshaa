# 🔧 FIX: Table Does Not Exist Error

## The Error
```
ERROR: 42P01: relation "public.accommodation" does not exist
```

## The Cause
The `accommodation` and `lunch_bookings` tables haven't been created in your Supabase database yet.

---

## ✅ Solution

### Step 1: Run the Table Creation Script

**File**: `database/setup_accommodation_and_lunch.sql`

1. Open: https://app.supabase.com
2. Go to: **SQL Editor**
3. Open file: `database/setup_accommodation_and_lunch.sql`
4. Copy ALL content
5. Paste into Supabase SQL Editor
6. Click: **Run**

This will:
- ✅ Create the `accommodation` table
- ✅ Create the `lunch_bookings` table
- ✅ Add all required columns
- ✅ Add proper indexes
- ✅ Enable RLS on both tables
- ✅ Create all RLS policies
- ✅ Grant permissions to authenticated users

---

## What This Script Creates

### Accommodation Table
```sql
CREATE TABLE public.accommodation (
    id UUID PRIMARY KEY
    user_id UUID (links to auth.users)
    username TEXT
    email TEXT
    mobile_number TEXT
    college_name TEXT
    gender TEXT
    accommodation_dates TEXT[]
    march_28_accommodation BOOLEAN
    number_of_days INTEGER
    accommodation_price INTEGER
    status TEXT (pending/confirmed/cancelled)
    created_at TIMESTAMPTZ
    updated_at TIMESTAMPTZ
)
```

### Lunch Bookings Table
```sql
CREATE TABLE public.lunch_bookings (
    id UUID PRIMARY KEY
    user_id UUID (links to auth.users)
    username TEXT
    email TEXT
    mobile_number TEXT
    college_name TEXT
    lunch_date TEXT
    lunch_type TEXT (veg/non-veg)
    number_of_days INTEGER
    lunch_price INTEGER
    status TEXT (pending/confirmed/cancelled)
    created_at TIMESTAMPTZ
    updated_at TIMESTAMPTZ
)
```

---

## RLS Policies Created

Each table gets 4 policies:
1. **INSERT** - Any authenticated user can create bookings
2. **SELECT** - Users see their own, admins see all
3. **UPDATE** - Users update their own, admins update any
4. **DELETE** - Users delete their own, admins delete any

---

## After Running This

You can then:
1. ✅ Start backend: `cd Backend && npm start`
2. ✅ Start frontend: `cd Frontend && npm run dev`
3. ✅ Open browser: http://localhost:5173
4. ✅ Book accommodation (should work now!)

---

## If You Already Ran fix_rls_policies.sql

No problem! Just run `setup_accommodation_and_lunch.sql` now. It will:
- Create the missing tables
- Drop and recreate all policies
- Everything will work correctly

---

## Verification

After running the SQL, check Supabase:

1. **Tables Created**: Go to **Database** → **Tables**
   - You should see: `accommodation` table ✅
   - You should see: `lunch_bookings` table ✅

2. **RLS Enabled**: Click on each table
   - You should see: "Row Level Security: On" ✅

3. **Policies Created**: Click on table → **Policies** tab
   - You should see 4 policies per table ✅

---

## Quick Command Reference

| File | Purpose |
|------|---------|
| `setup_accommodation_and_lunch.sql` | **USE THIS FIRST** - Creates tables + RLS |
| `fix_rls_policies.sql` | For fixing existing policies (tables must exist) |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Still getting 404 errors | Run `setup_accommodation_and_lunch.sql` |
| Table already exists error | It's safe to run - script uses `CREATE IF NOT EXISTS` |
| Policies not working | Check RLS is ON in Database → Tables → (table) |
| Can't insert bookings | Verify policies were created in Policies tab |

---

**Status**: ✅ Ready to run  
**Time**: 2 minutes  
**Next**: Run this SQL, then start backend/frontend!
