# 🎯 Category Quota-Based Combo System - Deployment Guide

## Overview
The combo system has been **updated** to use **category quotas only**. Admins no longer select specific events - instead, they define how many events from each category students must choose.

---

## 🚀 Quick Deployment (2 Steps)

### **Step 1: Update Database Schema** ⚠️ **REQUIRED**

Run these SQL files in order:

1. **First - Update Schema:**
   ```sql
   -- Open Supabase Dashboard → SQL Editor
   -- Copy and run: database/update_combo_quota_system.sql
   ```
   This will:
   - Drop `combo_items` table (no longer needed)
   - Add `description`, `category_quotas`, `total_events_required` to `combos` table
   - Add `selected_event_ids` to `combo_purchases` table
   - Create trigger to auto-calculate total events

2. **Second - Deploy Functions:**
   ```sql
   -- Copy and run: database/deploy_combo_functions.sql
   ```
   This will create updated RPC functions without event_ids parameters

### **Step 2: Test the New System**

1. Go to Admin Panel → Combo Management
2. Click "Create Combo"
3. You should NO LONGER see event selection checkboxes
4. Only see Category Quotas input fields

---

## 🎨 How It Works Now

### **Admin Creates Combo:**
```json
{
  "name": "Tech Enthusiast Pass",
  "description": "Perfect for tech lovers",
  "price": 799,
  "category_quotas": {
    "Technical": 2,
    "Workshop": 3,
    "Sports": 1
  }
}
```
**Total Events Required:** 6 (auto-calculated)

### **Student Purchases Combo:**
1. Sees combo with category requirements
2. Selects events matching quotas:
   - 2 from Technical category
   - 3 from Workshop category
   - 1 from Sports category
3. System validates selection matches quotas
4. Creates individual registrations for selected events

---

## 📊 Database Changes

### Updated: `combos` Table
```sql
- id (UUID)
- name (TEXT)
- description (TEXT)                    ← NEW
- price (INTEGER)
- is_active (BOOLEAN)
- category_quotas (JSONB)               ← Main field
- total_events_required (INTEGER)       ← NEW (auto-calculated)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)              ← NEW
```

### Removed: `combo_items` Table
No longer needed - events are selected by students, not admins

### Updated: `combo_purchases` Table
```sql
- id (UUID)
- combo_id (UUID)
- user_id (UUID)
- payment_status (TEXT)
- payment_amount (INTEGER)
- transaction_id (TEXT)
- selected_event_ids (JSONB)            ← NEW - stores student's event choices
- explosion_completed (BOOLEAN)
- individual_registration_ids (JSONB)
- purchased_at (TIMESTAMPTZ)
```

---

## 🔧 Updated Functions

### 1. `create_combo` - Removed event_ids
**Before:**
```javascript
createCombo({ name, description, price, eventIds, isActive, categoryQuotas })
```

**After:**
```javascript
createCombo({ name, description, price, isActive, categoryQuotas })
```

### 2. `update_combo` - Removed event_ids
**Before:**
```javascript
updateCombo(comboId, { name, description, price, eventIds, isActive, categoryQuotas })
```

**After:**
```javascript
updateCombo(comboId, { name, description, price, isActive, categoryQuotas })
```

### 3. `get_combos_with_details` - No event_details
**Before:** Returned `event_details` JSONB array

**After:** Returns `total_events_required` INTEGER

---

## 🎯 Admin UI Changes

### What Was Removed:
- ❌ Event selection checkboxes
- ❌ "Select Events" section
- ❌ Event list with prices
- ❌ "Calculate 20% Off Price" button
- ❌ Price summary showing original vs combo price

### What Remains:
- ✅ Combo Name input
- ✅ Description textarea
- ✅ Combo Price input
- ✅ Category Quotas grid (now required, not optional)
- ✅ Active/Inactive toggle
- ✅ Create/Edit/Delete/Toggle functions

### New Validation:
```javascript
// Must total at least 2 events from category quotas
const totalEvents = Object.values(categoryQuotas)
  .filter(v => typeof v === 'number' && v > 0)
  .reduce((sum, val) => sum + val, 0);

if (totalEvents < 2) {
  alert('Category quotas must total at least 2 events');
}
```

---

## 📋 Example Combos

### Example 1: Flexible Tech Pass
```json
{
  "name": "Flexible Tech Pass",
  "description": "Choose any 5 tech events",
  "price": 999,
  "category_quotas": {
    "Technical": 5
  }
}
```
Students pick ANY 5 Technical events

### Example 2: Balanced Explorer
```json
{
  "name": "Balanced Explorer",
  "description": "Experience everything",
  "price": 1499,
  "category_quotas": {
    "Technical": 2,
    "Workshop": 2,
    "Sports": 1,
    "Cultural": 1
  }
}
```
Students must pick exactly:
- 2 Technical
- 2 Workshop
- 1 Sports
- 1 Cultural

### Example 3: Workshop Master
```json
{
  "name": "Workshop Master",
  "description": "Skill up with workshops",
  "price": 699,
  "category_quotas": {
    "Workshop": 4
  }
}
```
Students pick ANY 4 Workshop events

---

## 🔄 Migration Path

### If You Have Existing Combos:

1. **Export combo data** before migration:
   ```sql
   SELECT * FROM combos;
   SELECT * FROM combo_items;
   ```

2. **Run migration SQL** (`update_combo_quota_system.sql`)
   - This will DROP combo_items table
   - Existing combo purchases are preserved

3. **Recreate combos** in admin panel:
   - Use category quotas instead of specific events
   - Students with old combos keep their registrations

---

## ✅ Testing Checklist

- [ ] Run `update_combo_quota_system.sql`
- [ ] Run `deploy_combo_functions.sql`
- [ ] Verify `combo_items` table is dropped
- [ ] Verify `combos` table has new columns
- [ ] Open admin panel → Combo Management
- [ ] Confirm NO event selection UI appears
- [ ] Create new combo with category quotas
- [ ] Verify validation (minimum 2 events total)
- [ ] Check combo appears in list
- [ ] Test editing combo
- [ ] Test toggling status
- [ ] Verify student can see combo with quota requirements

---

## 🐛 Troubleshooting

### Error: "Column 'description' does not exist"
**Solution:** Run `update_combo_quota_system.sql` first

### Error: "Table combo_items does not exist"
**Solution:** This is normal after migration - the table was intentionally removed

### UI still shows event selection
**Solution:** Clear browser cache and refresh. Check that ComboManagement.jsx was updated.

### Validation error: "Category quotas must total at least 2 events"
**Solution:** This is correct behavior. Set quotas so total is ≥ 2.
Example: `{"Technical": 2}` or `{"Workshop": 1, "Sports": 1}`

---

## 📁 Updated Files

```
DaKshaa/
├── database/
│   ├── update_combo_quota_system.sql      ← Run first (schema changes)
│   └── deploy_combo_functions.sql         ← Run second (updated functions)
├── Frontend/src/
│   ├── services/
│   │   └── comboService.js                 ← Updated (no eventIds)
│   └── Pages/Admin/SuperAdmin/
│       └── ComboManagement.jsx             ← Updated (no event selection)
└── CATEGORY_QUOTA_DEPLOYMENT.md            ← This file
```

---

## 🎓 Benefits of This Approach

1. **More Flexibility:** Students choose events they want
2. **Less Admin Work:** No need to pre-select events
3. **Better UX:** Students get personalized combo
4. **Easier Updates:** Change quotas without recreating combos
5. **Cleaner Code:** Simpler data model

---

## 📞 Next Steps

1. ✅ Deploy both SQL files in order
2. 🎨 Test combo creation in admin panel
3. 👥 Test student event selection (when implemented)
4. 📊 Monitor combo purchases and quota compliance

---

**Category Quota System Deployed! 🎉**

Students now have full control over their event selection while admins define the structure through category quotas.
