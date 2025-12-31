# ✅ SOLUTION: "relation does not exist" Error

## What Happened
You tried to run `fix_rls_policies.sql` but the tables didn't exist yet.

## What You Need to Do

### ⚡ FASTEST FIX (Copy-Paste, 2 minutes)

1. **Open**: https://app.supabase.com → SQL Editor
2. **Copy**: All content from `database/setup_accommodation_and_lunch.sql`
3. **Paste**: Into Supabase SQL Editor
4. **Click**: Run
5. **Done** ✅ See green success message

---

## Files to Use

| File | Use When |
|------|----------|
| `setup_accommodation_and_lunch.sql` | Tables don't exist (USE THIS FIRST) ⭐ |
| `fix_rls_policies.sql` | Tables exist but policies are broken |

---

## Complete Flow

```
┌─────────────────────────────────┐
│  Run setup_accommodation_and... │  ← You are here
│  (creates tables + policies)    │
└──────────────┬──────────────────┘
               │
               ✅ Tables created
               │
┌──────────────▼──────────────────┐
│  Start Backend: npm start       │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Start Frontend: npm run dev    │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Open localhost:5173 in browser │
└──────────────┬──────────────────┘
               │
               ✅ Website works!
```

---

## What Gets Created

✅ `accommodation` table  
✅ `lunch_bookings` table  
✅ All required columns  
✅ Row-Level Security enabled  
✅ 4 RLS policies per table  
✅ Database indexes for performance  
✅ Proper permissions granted  

---

## After Running the SQL

Your backend will now be able to:
- ✅ Insert accommodation bookings
- ✅ Insert lunch bookings
- ✅ Read user's own bookings
- ✅ Allow admins to read all bookings
- ✅ Update/delete with proper permissions

---

## Verification Checklist

After running the SQL, verify in Supabase:

- [ ] Go to **Database** → **Tables**
- [ ] See `accommodation` table listed
- [ ] See `lunch_bookings` table listed
- [ ] Click on `accommodation` table
- [ ] See "Row Level Security: On"
- [ ] Click **Policies** tab
- [ ] See 4 policies listed

All ✅ = Ready to start backend/frontend!

---

## No More Errors! 🎉

Once tables are created, you won't see:
- ❌ `relation "public.accommodation" does not exist`
- ❌ `relation "public.lunch_bookings" does not exist`
- ❌ `Failed to load resource: 404`
- ❌ `RLS policy violations`

---

**Next**: Run the SQL, then start your application! 🚀
