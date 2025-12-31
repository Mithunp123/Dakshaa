# 🎯 INSTANT FIX - 3 SIMPLE STEPS

## ⚠️ THE CRITICAL STEP (Do This First!)

### STEP 1: Fix Database RLS in Supabase (5 min)

```
1️⃣  Open Browser: https://app.supabase.com
2️⃣  Log in to your project
3️⃣  Click "SQL Editor" (on left sidebar)
4️⃣  Open File: database/fix_rls_policies.sql (from your project)
5️⃣  Copy ALL content
6️⃣  Paste into Supabase SQL Editor
7️⃣  Click "Run" button
8️⃣  See green success message ✅
```

**You MUST do this step first!** Without it, the errors continue.

---

## STEP 2: Start Backend (2 min)

Open PowerShell and run:
```powershell
cd d:\Downloads\DaKshaa-login\Backend
npm start
```

Expected output:
```
✅ Backend connected to Supabase
Listening on port 3000
```

Keep this window open!

---

## STEP 3: Start Frontend (2 min)

Open **NEW** PowerShell and run:
```powershell
cd d:\Downloads\DaKshaa-login\Frontend
npm run dev
```

Expected output:
```
Local: http://localhost:5173
```

---

## ✅ DONE! Your App is Running!

Open browser: **http://localhost:5173**

---

## 🔧 What Was Fixed

| Issue | Status |
|-------|--------|
| Backend 404 errors | ✅ Environment configured |
| Infinite recursion in database | ✅ SQL fix ready (Supabase) |
| Accommodation 404 errors | ✅ RLS policies fixed (Supabase) |
| Hardcoded API URLs | ✅ Now uses environment vars |
| WebGL Context Lost | ✅ Auto-recovery enabled |

---

## 🚨 If You Still See Errors

### Error: "infinite recursion detected"
→ You skipped Step 1. Go back and run the SQL in Supabase!

### Error: "Failed to fetch from localhost:3000"
→ Backend not running. Check Step 2.

### Error: "Supabase credentials missing"
→ Check `Frontend/.env` and `Backend/.env` files exist

### Error: "CORS error"
→ Restart backend server

---

## 📋 Verification Checklist

After completing 3 steps, verify:

- [ ] Browser shows http://localhost:5173 without errors
- [ ] Backend console shows "✅ Connected to Supabase"
- [ ] Can create a user account (register page works)
- [ ] Can book accommodation without errors
- [ ] Can book lunch without errors
- [ ] Console (F12) shows no 404 errors

---

## 🆘 Emergency: Wrong Step Order

If you started frontend/backend before fixing Supabase:

1. Kill both server windows (Ctrl+C)
2. Run the SQL fix in Supabase
3. Restart both servers
4. Refresh browser

---

## 💡 Tips

- Keep 3 windows open: Supabase SQL, Backend PowerShell, Frontend PowerShell
- Use `npm run dev` not `npm start` for frontend
- Frontend is on port 5173, Backend on 3000
- Don't share your .env files or Supabase keys!

---

## ✨ Success Message

When everything works, you should see:
- Registration page loads ✅
- Accommodation booking works ✅
- Team creation works ✅
- No red errors in console ✅

---

**Ready?** Start with Step 1! 🚀
