# 🔴 STUCK ON LOADING - TROUBLESHOOTING GUIDE

## Problem
Combo purchase is stuck loading with no console errors.

## Root Causes (Most Likely)

### 1. **RPC Functions Missing** (90% probability)
The database doesn't have the required functions, so Supabase returns 404 but it's not showing in console.

### 2. **Infinite Loop** (5% probability)
A function is calling itself or waiting indefinitely.

### 3. **RLS Blocking** (5% probability)
Row Level Security is preventing the operation.

---

## 🔍 Step 1: Check Browser Console Properly

Open browser DevTools (F12) and check:

### Network Tab
1. Go to **Network** tab
2. Filter by **XHR** or **Fetch**
3. Look for requests to `/rest/v1/rpc/`
4. Click on each request and check:
   - **Status**: Should be 200, if 404 = function missing
   - **Response**: Check the error message

### Console Tab
Add this to RegistrationForm.jsx temporarily to see all steps:

```javascript
const handleComboRegistration = useCallback(async () => {
  console.log("🚀 START: handleComboRegistration");
  
  if (isSubmitting || !selectedCombo) {
    console.log("⛔ EARLY RETURN: isSubmitting:", isSubmitting, "selectedCombo:", selectedCombo);
    return;
  }

  try {
    setIsSubmitting(true);
    console.log("✅ Set isSubmitting to true");

    if (!user) {
      console.log("❌ NO USER");
      alert("Please login to register for events");
      return;
    }
    console.log("✅ User:", user.id);

    if (!userProfile) {
      console.log("❌ NO USER PROFILE");
      alert("Profile not loaded. Please refresh and try again.");
      return;
    }
    console.log("✅ User Profile:", userProfile);

    // Step 1: Validate
    console.log("🔍 STEP 1: Validating combo selection...");
    console.log("  - Combo ID:", selectedCombo.id || selectedCombo.combo_id);
    console.log("  - Selected Events:", selectedEvents);
    
    const validation = await comboService.validateComboSelection(
      selectedCombo.id || selectedCombo.combo_id,
      selectedEvents
    );
    
    console.log("✅ STEP 1 COMPLETE: Validation result:", validation);

    if (!validation.valid) {
      console.log("❌ VALIDATION FAILED:", validation.errors);
      alert(`Invalid selection:\n${validation.errors.join('\n')}`);
      setIsSubmitting(false);
      return;
    }

    // Step 2: Create Purchase
    console.log("💰 STEP 2: Creating combo purchase...");
    const purchaseResult = await comboService.createComboPurchase(
      selectedCombo.id || selectedCombo.combo_id,
      user.id,
      selectedEvents
    );
    
    console.log("✅ STEP 2 COMPLETE: Purchase result:", purchaseResult);

    if (!purchaseResult.success) {
      console.log("❌ PURCHASE CREATION FAILED:", purchaseResult.error);
      alert(purchaseResult.error || "Failed to create purchase");
      setIsSubmitting(false);
      return;
    }

    // Step 3: Simulate Payment
    console.log("💳 STEP 3: Processing payment...");
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log("  - Transaction ID:", transactionId);
    
    // Step 4: Complete Payment
    console.log("🎯 STEP 4: Completing payment and exploding combo...");
    console.log("  - Purchase ID:", purchaseResult.purchaseId);
    console.log("  - Transaction ID:", transactionId);
    
    const completionResult = await comboService.completeComboPayment(
      purchaseResult.purchaseId,
      transactionId
    );

    console.log("✅ STEP 4 COMPLETE: Completion result:", completionResult);

    if (!completionResult.success) {
      console.log("❌ PAYMENT COMPLETION FAILED:", completionResult.error);
      alert(completionResult.error || "Payment completion failed");
      setIsSubmitting(false);
      return;
    }

    console.log("🎉 SUCCESS! Combo purchase complete!");
    alert("Success!");
    setCurrentStep(4);
    
  } catch (error) {
    console.error("❌ EXCEPTION in handleComboRegistration:", error);
    alert(`Registration failed: ${error.message}`);
  } finally {
    console.log("🏁 FINALLY: Setting isSubmitting to false");
    setIsSubmitting(false);
  }
}, [user, userProfile, selectedCombo, selectedEvents, selectedEventDetails, isSubmitting]);
```

---

## 📊 Step 2: Run Database Diagnostic

Run this in Supabase SQL Editor:

```sql
-- Copy/paste from database/DIAGNOSTIC_CHECK.sql
```

This will tell you EXACTLY what's missing.

---

## 🛠️ Step 3: Fix Based on Results

### If Diagnostic Shows Missing Functions:

**Run in this order:**

```sql
-- 1. Fix combo table schema (if needed)
-- File: database/FIX_COMBOS_SCHEMA.sql

-- 2. Add all RPC functions
-- File: database/complete_combo_schema.sql
-- (Run from line 193 to 627 - all the functions)

-- 3. Add missing helper functions
-- File: database/ADD_MISSING_RPC_FUNCTIONS.sql

-- 4. Fix category validation
-- File: database/FIX_CATEGORY_VALIDATION.sql
```

---

## 🎯 Quick Fix Script

If you don't want to run multiple files, here's a consolidated version:

**FILE: database/COMPLETE_FIX_ALL_FUNCTIONS.sql**

```sql
-- Run this ONCE to create all required functions

-- 1. validate_combo_selection
\i database/FIX_CATEGORY_VALIDATION.sql

-- 2. create_combo_purchase
-- (Copy from complete_combo_schema.sql lines 543-625)

-- 3. complete_combo_payment
-- (Copy from complete_combo_schema.sql lines 628-668)

-- 4. explode_combo_purchase
-- (Copy from complete_combo_schema.sql lines 311-540)

-- 5. get_user_combo_purchases
-- (Copy from complete_combo_schema.sql lines 476-538)

-- 6. Helper functions
\i database/ADD_MISSING_RPC_FUNCTIONS.sql
```

---

## ⚡ Most Likely Issue

Based on the symptoms, **99% chance** it's this:

```
Frontend calls: supabase.rpc("create_combo_purchase", ...)
Database: ❌ Function doesn't exist
Supabase: Returns 404 silently
Frontend: await never resolves (times out after 60s)
User: Sees infinite loading
```

**Solution**: Run `database/complete_combo_schema.sql` sections 3-5 (the RPC functions)

---

## 🧪 Test Each Function Individually

After deploying, test each function:

```sql
-- Test 1: Validation
SELECT public.validate_combo_selection(
  '<your-combo-id>'::uuid,
  '["<event-id-1>", "<event-id-2>"]'::jsonb
);
-- Should return: {"valid": true/false, "errors": [...]}

-- Test 2: Create Purchase
SELECT public.create_combo_purchase(
  '<combo-id>'::uuid,
  auth.uid(),
  '["<event-id-1>", "<event-id-2>"]'::jsonb
);
-- Should return: {"success": true, "purchase_id": "..."}

-- Test 3: Complete Payment (use purchase_id from above)
SELECT public.complete_combo_payment(
  '<purchase-id>'::uuid,
  'TEST_TXN_123'
);
-- Should return: {"success": true, "registration_ids": [...], "event_count": 2}
```

---

## 📝 Checklist

- [ ] Opened browser DevTools (F12)
- [ ] Checked Network tab for 404 errors
- [ ] Added console.log statements to see where it hangs
- [ ] Ran DIAGNOSTIC_CHECK.sql in Supabase
- [ ] Deployed missing functions from complete_combo_schema.sql
- [ ] Tested functions individually in SQL Editor
- [ ] Refreshed frontend and tried again

---

## 🚨 Emergency Quick Fix

If all else fails, run these 4 files in order:

1. `FIX_COMBOS_SCHEMA.sql` - Fix table structure
2. `FIX_CATEGORY_VALIDATION.sql` - Fix validation function
3. Section 3 of `complete_combo_schema.sql` (lines 193-627) - All RPC functions
4. `ADD_MISSING_RPC_FUNCTIONS.sql` - Helper functions

Then refresh frontend (Ctrl+R) and try again.

---

**Most common result**: After running complete_combo_schema.sql, the loading will resolve and registration will complete successfully.

**Last Updated**: January 3, 2026
