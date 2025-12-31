# 🎯 THE EXACT SOLUTION

## Your Error
```
ERROR: 42P01: relation "public.accommodation" does not exist
```

---

## 🔴 The Problem
The tables `accommodation` and `lunch_bookings` don't exist in your Supabase database.

## 🟢 The Solution
Run this ONE SQL file to create everything:

**File**: `database/setup_accommodation_and_lunch.sql`

---

## 📋 Exact Steps to Copy-Paste

### 1️⃣ Open Supabase
```
https://app.supabase.com
```

### 2️⃣ Go to SQL Editor
**Left sidebar** → Click **SQL Editor**

### 3️⃣ Copy the SQL
Open file: `database/setup_accommodation_and_lunch.sql`
- Select all (Ctrl+A)
- Copy (Ctrl+C)

### 4️⃣ Paste in Supabase
- Click in the SQL Editor text area
- Paste (Ctrl+V)

### 5️⃣ Click Run
Click the **Run** button (green button at bottom right)

### 6️⃣ Success!
You'll see:
```
✅ Tables created and RLS policies applied successfully!
```

---

## ✅ That's It!

Everything is now ready:
- ✅ Tables created
- ✅ Columns added
- ✅ Indexes created
- ✅ RLS enabled
- ✅ Policies created
- ✅ Permissions granted

---

## 🚀 Then Do This

### Terminal 1 - Backend
```powershell
cd Backend
npm start
```

### Terminal 2 - Frontend
```powershell
cd Frontend
npm run dev
```

### Browser
```
http://localhost:5173
```

---

## 🎉 Done!

No more "relation does not exist" errors!  
Your website will work perfectly now! ✨

---

**If you need help**: Check `FINAL_TABLE_FIX.md` for detailed instructions
