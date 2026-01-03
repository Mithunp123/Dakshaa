# 🔍 Understanding the "Column 'id' Does Not Exist" Error

## 📖 Definition & Explanation

### What is this error?

```
Operation failed: Error: column "id" does not exist
```

This is a **PostgreSQL schema mismatch error** that occurs when your application code tries to access a database column that doesn't exist in the table structure.

---

## 🎯 Root Cause Analysis

### The Problem: TWO Different Schema Versions

Your database has **conflicting table structures** - legacy and modern schemas coexisting:

#### **Legacy Schema** (schema.sql):
```sql
CREATE TABLE IF NOT EXISTS combos (
    combo_id TEXT PRIMARY KEY,      -- ❌ Uses TEXT type with 'combo_id' name
    name TEXT NOT NULL,
    price DECIMAL NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP...
);
```

#### **Modern Schema** (complete_production_schema.sql):
```sql
CREATE TABLE IF NOT EXISTS public.combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- ✅ Uses UUID type with 'id' name
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    category_quotas JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ...
);
```

---

## ⚡ Why This Error Occurs

### Sequence of Events:

1. **Database Deployed with Legacy Schema**
   - You ran `schema.sql` first
   - Created table with `combo_id` column
   
2. **Frontend Expects Modern Schema**
   - `comboService.js` calls `create_combo()` RPC function
   - RPC function tries to INSERT with: `RETURNING id`
   - But table only has `combo_id`, not `id`

3. **PostgreSQL Throws Error**
   ```
   ERROR: 42703: column "id" does not exist
   ```

### Code Path Analysis:

```javascript
// Frontend: ComboManagement.jsx (line 322)
await comboService.createCombo(formData);

// ↓

// Service: comboService.js (line 153)
const { data, error } = await supabase.rpc("create_combo", {
  p_name: name,
  p_description: description,
  p_price: price,
  p_is_active: isActive,
  p_category_quotas: categoryQuotas,
});

// ↓

// Database: deploy_combo_functions.sql (line 66)
INSERT INTO public.combos (name, description, price, is_active, category_quotas)
VALUES (p_name, p_description, p_price, p_is_active, p_category_quotas)
RETURNING id INTO v_combo_id;  -- ❌ Tries to return 'id' column

// ↓ 

// PostgreSQL Error:
// ERROR: column "id" does not exist
// The table has 'combo_id' but function expects 'id'
```

---

## 🔬 Technical Breakdown

### PostgreSQL Error Code: 42703

- **Category**: Syntax Error or Access Rule Violation
- **Meaning**: Column name referenced in query doesn't exist in table
- **Common Causes**:
  1. Typo in column name
  2. Wrong table referenced
  3. **Schema migration incomplete** ← Your case
  4. Table structure changed but queries not updated

### Your Specific Issue:

| Component | Expected Column | Actual Column | Type Mismatch |
|-----------|----------------|---------------|---------------|
| **Legacy Table** | - | `combo_id` | TEXT |
| **Modern RPC** | `id` | - | UUID |
| **Frontend Code** | `id` or `combo_id` | Varies | Mixed |

---

## 🧩 How Schema Mismatch Happens

### Scenario 1: Incomplete Migration
```
Day 1: Deploy schema.sql → Creates combos with 'combo_id'
Day 2: Create new RPC functions → Functions use 'id'
Result: ❌ Functions fail because column names don't match
```

### Scenario 2: Multiple SQL Scripts
```
File A (schema.sql):           combo_id TEXT
File B (deploy_combo.sql):     Uses 'id' in RETURNING
File C (complete_schema.sql):  id UUID

Which one was deployed? → Depends on execution order
```

### Scenario 3: Partial Updates
```
✅ Frontend updated to use modern schema
✅ RPC functions created for modern schema  
❌ Database table still has legacy schema
Result: Mismatch error
```

---

## 📊 Impact Analysis

### What Works:
- ✅ Reading existing combos (if any exist)
- ✅ Displaying combo list
- ✅ Frontend UI loads normally

### What Breaks:
- ❌ Creating new combos
- ❌ Updating combo details (if using modern RPC)
- ❌ Any RPC function that references `id` column
- ❌ Foreign key relationships using `id`

### Cascading Effects:
```
Cannot create combo
    ↓
Cannot create combo_items (references combo.id)
    ↓
Cannot create combo_purchases
    ↓
Students cannot buy combos
    ↓
Entire combo system broken
```

---

## 🔍 How to Diagnose

### Step 1: Check Current Table Structure

Run in Supabase SQL Editor:
```sql
-- Check what columns exist in combos table
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'combos'
ORDER BY ordinal_position;
```

**Expected Output (Legacy):**
```
column_name    | data_type         | character_maximum_length
combo_id       | text              | NULL
name           | text              | NULL
price          | numeric           | NULL
is_active      | boolean           | NULL
created_at     | timestamp with... | NULL
```

**Expected Output (Modern):**
```
column_name       | data_type         | character_maximum_length
id                | uuid              | NULL
name              | text              | NULL
description       | text              | NULL
price             | integer           | NULL
category_quotas   | jsonb             | NULL
is_active         | boolean           | NULL
created_at        | timestamp with... | NULL
```

### Step 2: Check Primary Key Name
```sql
SELECT constraint_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'combos' 
  AND constraint_name LIKE '%pkey%';
```

### Step 3: Check RPC Functions
```sql
-- See what functions exist
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%combo%'
  AND routine_schema = 'public';
```

### Step 4: Check Foreign Key Dependencies
```sql
-- Find tables that reference combos
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'combos';
```

---

## 🛠️ Solutions

### Option 1: Migrate to Modern Schema (RECOMMENDED)

**Pros:**
- ✅ Modern UUID primary keys (better for distributed systems)
- ✅ JSONB support for category_quotas
- ✅ All new RPC functions work
- ✅ Frontend code matches database

**Cons:**
- ⚠️ Requires data migration if existing combos
- ⚠️ Must update foreign key references

**Migration Script:**
```sql
-- Step 1: Backup existing data
CREATE TABLE combos_backup AS SELECT * FROM combos;

-- Step 2: Drop old table and dependencies
DROP TABLE IF EXISTS combo_items CASCADE;
DROP TABLE IF EXISTS combo_purchases CASCADE;
DROP TABLE IF EXISTS combo_rules CASCADE;
DROP TABLE IF EXISTS combos CASCADE;

-- Step 3: Create modern schema
CREATE TABLE public.combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    category_quotas JSONB DEFAULT '{}'::jsonb,
    total_events_required INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    max_purchases INTEGER DEFAULT 100,
    current_purchases INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Step 4: Migrate data (if any)
INSERT INTO combos (name, price, is_active, created_at)
SELECT name, price::integer, is_active, created_at
FROM combos_backup;

-- Step 5: Create related tables
-- (combo_items, combo_purchases, etc.)
```

### Option 2: Update RPC Functions to Use Legacy Schema

**Pros:**
- ✅ No database changes needed
- ✅ Existing data preserved
- ✅ Quick fix

**Cons:**
- ❌ Stuck with TEXT primary keys (less efficient)
- ❌ No JSONB support
- ❌ Limited modern features

**Fix Script:**
```sql
CREATE OR REPLACE FUNCTION public.create_combo(
    p_name TEXT,
    p_description TEXT,
    p_price DECIMAL,
    p_is_active BOOLEAN,
    p_category_quotas JSONB
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_combo_id TEXT;
BEGIN
    -- Generate TEXT-based ID
    v_combo_id := 'COMBO_' || gen_random_uuid()::text;
    
    -- Insert using combo_id instead of id
    INSERT INTO public.combos (combo_id, name, price, is_active)
    VALUES (v_combo_id, p_name, p_price, p_is_active)
    RETURNING combo_id INTO v_combo_id;  -- Changed from 'id' to 'combo_id'
    
    RETURN json_build_object(
        'success', true,
        'combo_id', v_combo_id
    );
END;
$$;
```

### Option 3: Dual Compatibility (TEMPORARY)

Add `id` column alongside `combo_id`:
```sql
-- Add new UUID column
ALTER TABLE combos ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Make it unique
ALTER TABLE combos ADD CONSTRAINT combos_id_unique UNIQUE (id);

-- Now both columns exist
-- combo_id: Legacy TEXT
-- id: Modern UUID
```

---

## ✅ Recommended Action Plan

### 🚀 Quick Fix (5 minutes)

1. **Check current schema:**
```sql
\d combos
```

2. **If legacy (combo_id exists), run migration:**
```sql
-- Run complete_combo_schema.sql from line 1
-- This will create modern schema
```

3. **Verify:**
```sql
SELECT * FROM combos LIMIT 1;
-- Should show 'id' column, not 'combo_id'
```

4. **Test in frontend:**
- Go to Admin → Combo Management
- Try creating a combo
- Should work without errors

---

## 📚 Key Takeaways

1. **Error Meaning**: PostgreSQL can't find a column that your code references
2. **Root Cause**: Schema version mismatch (legacy vs modern)
3. **Why It Happens**: Incomplete migration or mixed SQL scripts
4. **Solution**: Align database schema with RPC functions and frontend code
5. **Prevention**: Use single source of truth for schema (one master SQL file)

---

## 🎓 Technical Concepts

### Primary Key Design:

**Legacy Approach:**
```sql
combo_id TEXT PRIMARY KEY
```
- Uses human-readable IDs
- Requires manual ID generation
- Harder to distribute across systems

**Modern Approach:**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```
- Globally unique identifiers
- Automatic generation
- Better for distributed systems
- Industry standard

### JSONB vs Separate Tables:

**Old Way:**
```sql
combo_rules table with:
- combo_id
- category
- allowed_count
```
Multiple rows per combo

**New Way:**
```sql
combos table with:
- category_quotas JSONB:
  {"Technical": 2, "Workshop": 3}
```
Single row, flexible structure

---

**Next Step**: See `FIX_COMBOS_SCHEMA.sql` for automated migration script

**Last Updated**: January 3, 2026
