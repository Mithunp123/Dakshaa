# 🔧 COMBO REGISTRATION FIXES

**Date:** January 7, 2026  
**Issues Fixed:**
1. ❌ Combo explosion error: "column combo_purchase_id does not exist"
2. ❌ Combos disappear on page refresh (but reappear on relogin)

---

## 🐛 ISSUE 1: Missing combo_purchase_id Column

### **Error Message:**
```
Explosion failed: column "combo_purchase_id" of relation "event_registrations_config" does not exist
```

### **Root Cause:**
The `explode_combo_purchase` function tries to insert records into `event_registrations_config` with a `combo_purchase_id` column, but this column doesn't exist in your current database schema.

### **Solution:**

**Run this SQL in Supabase SQL Editor:**

```sql
-- File: database/fix_combo_purchase_id_column.sql

DO $$ 
BEGIN
    -- Add combo_purchase_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_registrations_config' 
        AND column_name = 'combo_purchase_id'
    ) THEN
        ALTER TABLE public.event_registrations_config
        ADD COLUMN combo_purchase_id UUID;
        
        RAISE NOTICE 'Added combo_purchase_id column';
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_event_reg_combo_purchase_id 
ON public.event_registrations_config(combo_purchase_id)
WHERE combo_purchase_id IS NOT NULL;
```

**Or run the complete file:**
- [fix_combo_purchase_id_column.sql](./database/fix_combo_purchase_id_column.sql)

### **Verification:**

After running the SQL, verify the column was added:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'event_registrations_config'
ORDER BY ordinal_position;
```

You should see `combo_purchase_id` with type `uuid` and `is_nullable = YES`.

---

## 🐛 ISSUE 2: Combos Disappear on Page Refresh

### **Symptoms:**
- Combos show up after login ✅
- Combos disappear when refreshing the page ❌
- Combos reappear after logging out and logging back in ✅

### **Root Cause:**

The issue has two parts:

1. **Authentication state delay:** When the page refreshes, Supabase takes a moment to restore the authentication session. The combo loading code was running **before** the user was authenticated.

2. **Missing auth check in service:** The `getActiveCombosForStudents` function wasn't checking if the user was actually authenticated before querying combos.

### **Solution Applied:**

#### **1. Updated comboService.js**

Added authentication check before fetching combos:

```javascript
// Frontend/src/services/comboService.js

getActiveCombosForStudents: async (userId) => {
  try {
    // ✅ FIX: Ensure user is authenticated before fetching
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn("User not authenticated, combos not available");
      return {
        success: false,
        data: [],
        error: "User not authenticated",
      };
    }

    // Now safely query combos
    const { data, error } = await supabase
      .from("combos")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const availableCombos = (data || []).filter((combo) => {
      const maxPurchases = combo.max_purchases || 100;
      const currentPurchases = combo.current_purchases || 0;
      return currentPurchases < maxPurchases;
    });

    return {
      success: true,
      data: availableCombos,
    };
  } catch (error) {
    console.error("Error fetching active combos:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}
```

#### **2. Updated RegistrationForm.jsx**

Added better logging and conditional combo loading:

```javascript
// Frontend/src/Pages/Register/Components/RegistrationForm.jsx

useEffect(() => {
  let isMounted = true;
  
  const loadData = async () => {
    try {
      console.log('User state:', user ? `Authenticated (${user.id})` : 'Not authenticated');
      
      // Always load events
      const eventsPromise = eventConfigService.getEventsWithStats();
      
      // ✅ FIX: Wait for user authentication before loading combos
      let combosPromise;
      if (user?.id) {
        console.log('Loading combos for authenticated user:', user.id);
        combosPromise = comboService.getActiveCombosForStudents(user.id);
      } else {
        console.log('Skipping combos - user not authenticated yet');
        combosPromise = Promise.resolve({ success: false, data: [] });
      }
      
      const [eventsResult, combosResult] = await Promise.all([
        eventsPromise,
        combosPromise
      ]);
      
      if (isMounted) {
        const eventsData = eventsResult?.data || [];
        const combosData = combosResult?.success ? (combosResult.data || []) : [];
        
        console.log(`Loaded ${eventsData.length} events`);
        console.log(`Loaded ${combosData.length} combos`);
        
        setEvents(eventsData);
        setCombos(combosData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };
  
  loadData();
  
  return () => {
    isMounted = false;
  };
}, [user]); // ✅ Re-run when user changes
```

### **How It Works Now:**

```
Page Load (F5)
    ↓
Supabase restoring auth session... (~100-300ms)
    ↓
useEffect runs (user = null)
    ↓
Skips combo loading ✅
    ↓
Loads events only
    ↓
User state updates (user = {...})
    ↓
useEffect runs again (user detected) ✅
    ↓
Loads combos successfully ✅
```

---

## ✅ TESTING CHECKLIST

### **Test Issue 1 (combo_purchase_id column):**

1. [ ] Run the SQL migration in Supabase
2. [ ] Verify column exists: Check table structure
3. [ ] Select a combo offer
4. [ ] Choose events from the combo
5. [ ] Click "Confirm Registration"
6. [ ] Should complete without "column does not exist" error ✅

### **Test Issue 2 (combos on refresh):**

1. [ ] Login to the application
2. [ ] Navigate to Registration page
3. [ ] Verify combos are visible ✅
4. [ ] Press F5 to refresh the page
5. [ ] Wait 1-2 seconds
6. [ ] Combos should load and appear ✅
7. [ ] Check browser console:
   - Should see: "User state: Authenticated..."
   - Should see: "Loading combos for authenticated user..."
   - Should see: "Loaded X combos"

---

## 🔍 DEBUGGING

### **If combos still don't show:**

**Check browser console (F12):**

```javascript
// Look for these logs:
"User state: Authenticated (user-id)" // ✅ Good
"Loading combos for authenticated user: user-id" // ✅ Good
"Loaded X combos" // ✅ Good

// Bad signs:
"User state: Not authenticated" // ❌ Auth not working
"Skipping combos - user not authenticated yet" // ❌ User not loaded
"User not authenticated, combos not available" // ❌ Auth failed
```

**Check Supabase RLS policies:**

```sql
-- Run in Supabase SQL Editor
-- Check if combos table has RLS enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'combos';

-- If rowsecurity = true, check policies:
SELECT 
    polname,
    polcmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'combos';
```

If RLS is blocking access, you may need to add a policy:

```sql
-- Allow authenticated users to read combos
CREATE POLICY "Authenticated users can view active combos"
ON combos FOR SELECT
TO authenticated
USING (is_active = true);
```

---

## 📁 FILES CHANGED

1. **Database:**
   - [fix_combo_purchase_id_column.sql](./database/fix_combo_purchase_id_column.sql) - NEW ✨

2. **Frontend:**
   - [comboService.js](../Frontend/src/services/comboService.js) - MODIFIED 🔧
   - [RegistrationForm.jsx](../Frontend/src/Pages/Register/Components/RegistrationForm.jsx) - MODIFIED 🔧

---

## 🚀 DEPLOYMENT STEPS

1. **Deploy Database Fix:**
   ```bash
   # Run in Supabase SQL Editor
   d:\Dakshaa\database\fix_combo_purchase_id_column.sql
   ```

2. **Deploy Frontend Fix:**
   ```bash
   cd Frontend
   npm run build
   # Deploy to Firebase/Vercel
   ```

3. **Clear Browser Cache:**
   - Press Ctrl+Shift+R (hard refresh)
   - Or clear cache and reload

4. **Test:**
   - Login
   - Go to registration
   - Select combo
   - Confirm registration ✅

---

## 💡 PREVENTION

**To prevent similar issues in the future:**

1. **Always run the full production schema:**
   - Use [FRESH_PRODUCTION_SCHEMA.sql](../new_db/FRESH_PRODUCTION_SCHEMA.sql)
   - Don't skip tables or columns

2. **Check authentication state before API calls:**
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
     // Handle unauthenticated state
     return { success: false, error: "Not authenticated" };
   }
   ```

3. **Add loading states for async operations:**
   ```javascript
   const [loading, setLoading] = useState(true);
   const [data, setData] = useState(null);
   
   useEffect(() => {
     if (user) {
       loadData();
     } else {
       setLoading(false); // Stop loading if no user
     }
   }, [user]);
   ```

---

**Fixes Applied Successfully! 🎉**
