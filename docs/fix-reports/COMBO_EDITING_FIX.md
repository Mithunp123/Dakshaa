# 🔧 COMBO EDITING FIX - COMPLETE GUIDE

## 🚨 THE PROBLEM

You couldn't edit combo offers in the admin panel because the **database functions were missing**. The functions existed only in archived files, not deployed to your live Supabase database.

### Why This Happened
- ✅ Frontend code has full edit UI (buttons, modals, forms)
- ✅ Service layer calls RPC functions correctly
- ❌ Database functions never deployed (only in `database/archive/` folder)
- ❌ Missing functions: `create_combo`, `update_combo`, `delete_combo`, `toggle_combo_status`

---

## ✅ THE SOLUTION

### Step 1: Deploy Database Functions

**Option A: Manual Deployment (Recommended)**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in sidebar
4. Click **+ New Query**
5. Open file: `database/deploy_combo_functions.sql`
6. Copy ALL contents and paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success. No rows returned" message

**Option B: Use PowerShell Script**

```powershell
.\deploy-combo-functions.ps1
```

This will guide you through the deployment process.

---

## 🎯 WHAT GETS DEPLOYED

### 5 Critical RPC Functions

1. **`create_combo()`**
   - Creates new combo packages
   - Validates minimum 2 SOLO events
   - Tracks category quotas (Tech, Non-Tech, etc.)
   - Returns success/error JSON

2. **`update_combo()`** ⭐ FIXES YOUR ISSUE
   - Updates existing combo details
   - Changes name, description, price, events
   - Validates all events still exist
   - Recreates combo_items with new events

3. **`delete_combo()`**
   - Safely deletes combos
   - Prevents deletion if combo has paid purchases
   - Suggests deactivation instead

4. **`toggle_combo_status()`**
   - Toggles is_active between true/false
   - Instant enable/disable without deleting

5. **`get_combos_with_details()`**
   - Fetches combos with event details
   - Includes purchase counts
   - Used for admin display

---

## 🔒 SECURITY FEATURES

All functions use `SECURITY DEFINER` mode:
- ✅ Execute with elevated permissions
- ✅ Bypass Row Level Security (RLS)
- ✅ Only accessible to authenticated users
- ✅ Validated inputs prevent SQL injection

---

## 🎨 WHAT YOU CAN NOW DO

### In Admin Panel → Combo Management:

**1. Create New Combos**
- Set name, description, price
- Select 2+ SOLO events
- Set category quotas (Tech: 2, Non-Tech: 1, etc.)
- Mark as active/inactive

**2. Edit Existing Combos** ⭐ NEW!
- Click **Edit** button on any combo
- Modify name, description, price
- Add/remove events
- Update category quotas
- Changes save instantly

**3. Delete Combos**
- Click **Delete** button
- If combo has paid purchases → Shows error message
- If no purchases → Deletes successfully
- Suggestion: Use toggle instead of delete

**4. Toggle Active Status**
- Click **toggle switch** on combo card
- Instantly enables/disables combo
- Disabled combos won't show to users
- Can re-enable anytime

---

## 🔍 VERIFICATION STEPS

After deployment, verify everything works:

### 1. Check Functions Exist

Run this in Supabase SQL Editor:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%combo%'
ORDER BY routine_name;
```

**Expected Result:**
```
create_combo         | FUNCTION
delete_combo         | FUNCTION
get_combos_with_details | FUNCTION
toggle_combo_status  | FUNCTION
update_combo         | FUNCTION
```

### 2. Test Edit Functionality

1. Open Admin Panel → Combo Management
2. Find an existing combo
3. Click **Edit** button
4. Modify name or price
5. Click **Save**
6. Check for success toast notification
7. Verify changes reflected in combo card

### 3. Check Browser Console

Open DevTools (F12) and look for:
- ✅ No 404 errors on RPC calls
- ✅ Success messages from Supabase
- ✅ Updated combo data returned

---

## 🐛 TROUBLESHOOTING

### Issue: Still Can't Edit After Deployment

**Check 1: Functions Deployed Correctly**
```sql
SELECT * FROM pg_proc 
WHERE proname IN ('create_combo', 'update_combo', 'delete_combo');
```

If empty → Functions not deployed, re-run SQL script

**Check 2: Permissions Granted**
```sql
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name LIKE '%combo%';
```

Should show `authenticated | EXECUTE` for each function

**Check 3: Browser Console Errors**
- Open F12 → Console tab
- Click Edit button
- Look for error messages
- Common errors:
  - "function update_combo does not exist" → Not deployed
  - "permission denied" → Missing grants
  - "Invalid event_ids" → Frontend data issue

### Issue: Delete Button Not Working

**Reason:** Combo has paid purchases

**Solution:** Use toggle instead:
1. Click toggle switch to disable combo
2. Combo becomes inactive but data preserved
3. Can re-enable anytime

### Issue: Events Not Showing in Edit Modal

**Check:** Event data loading correctly

```sql
SELECT c.id, c.name, 
       json_agg(json_build_object('id', ec.id, 'name', ec.name)) as events
FROM combos c
LEFT JOIN combo_items ci ON c.id = ci.combo_id
LEFT JOIN events_config ec ON ci.event_id = ec.id
WHERE c.id = 'YOUR_COMBO_ID_HERE'
GROUP BY c.id, c.name;
```

---

## 📊 HOW IT WORKS

### Edit Flow (Step-by-Step)

1. **User clicks Edit button**
   ```javascript
   openEditModal(combo) // Sets state
   ```

2. **Modal opens with pre-filled data**
   ```javascript
   formData = {
     name: combo.name,
     description: combo.description,
     price: combo.price,
     eventIds: combo.events.map(e => e.id)
   }
   ```

3. **User modifies fields and clicks Save**
   ```javascript
   handleSubmit() → comboService.updateCombo()
   ```

4. **Frontend calls Supabase RPC**
   ```javascript
   supabase.rpc("update_combo", {
     p_combo_id: comboId,
     p_name: name,
     p_description: description,
     p_price: price,
     p_event_ids: eventIds,
     p_is_active: isActive,
     p_category_quotas: categoryQuotas
   })
   ```

5. **Database function executes**
   ```sql
   -- Validates combo exists
   -- Validates price > 0
   -- Validates events are SOLO type
   -- Updates combos table
   -- Deletes old combo_items
   -- Creates new combo_items
   -- Returns success JSON
   ```

6. **Frontend shows success/error**
   ```javascript
   if (data.success) {
     toast.success("Combo updated!")
     fetchCombos() // Refresh list
   }
   ```

---

## 🎯 CATEGORY QUOTAS EXPLAINED

Category quotas control how many events from each category can be in a combo:

```json
{
  "TECH": 2,
  "NON_TECH": 1,
  "GENERAL": 0
}
```

**Meaning:**
- Combo can have up to 2 TECH events
- Combo can have up to 1 NON_TECH event
- Combo can have 0 GENERAL events (not allowed)

**Used For:**
- Preventing all-tech or all-non-tech combos
- Ensuring balanced event selection
- Quota tracking when user purchases

---

## 📝 FILES CREATED

1. **`database/deploy_combo_functions.sql`**
   - All 5 RPC functions
   - Permission grants
   - Ready to copy-paste into Supabase

2. **`deploy-combo-functions.ps1`**
   - PowerShell deployment helper
   - Opens SQL file in Notepad
   - Displays deployment instructions

3. **`COMBO_EDITING_FIX.md`** (this file)
   - Complete documentation
   - Troubleshooting guide
   - Verification steps

---

## ✅ QUICK CHECKLIST

Before testing:
- [ ] SQL script deployed to Supabase
- [ ] "Success. No rows returned" message received
- [ ] Functions verified in database
- [ ] Admin panel page refreshed

After testing:
- [ ] Edit button opens modal with data
- [ ] Can modify combo name/description/price
- [ ] Can add/remove events
- [ ] Save shows success notification
- [ ] Changes reflected immediately
- [ ] Delete works (if no purchases)
- [ ] Toggle active/inactive works

---

## 🎉 RESULT

After deployment, your admin panel will have **full combo management**:

- ✅ Create combos with any events
- ✅ Edit combos anytime
- ✅ Delete combos safely
- ✅ Toggle active status
- ✅ View purchase statistics
- ✅ All changes persist to database
- ✅ Real-time updates in admin UI

---

## 💡 TIPS

**Best Practices:**
1. Always use **toggle** instead of delete when possible
2. Test combos in inactive mode before publishing
3. Set reasonable category quotas (2 tech + 1 non-tech is good)
4. Verify event IDs exist before saving
5. Check purchase count before deleting

**Common Workflows:**
- Create combo → Test → Toggle active
- Edit combo → Toggle inactive → Make changes → Toggle active
- Combo not selling → Toggle inactive (don't delete)
- Need new version → Create new combo, disable old one

---

## 📞 NEED HELP?

If combo editing still doesn't work after deployment:

1. Check Supabase SQL Editor for errors
2. Open browser console (F12) for JavaScript errors
3. Verify functions deployed: Run `SELECT * FROM pg_proc WHERE proname LIKE '%combo%'`
4. Check permissions: `SELECT * FROM information_schema.routine_privileges WHERE routine_name LIKE '%combo%'`
5. Test RPC directly in SQL Editor:
   ```sql
   SELECT * FROM update_combo(
     'combo-id-here'::uuid,
     'Test Name',
     'Test Description',
     500,
     ARRAY['event-id-1'::uuid, 'event-id-2'::uuid],
     true,
     '{"TECH": 2, "NON_TECH": 1}'::jsonb
   );
   ```

---

**Last Updated:** June 2024  
**Status:** Ready for Deployment ✅
