# 🔍 Email Verification Not Working - Diagnostic Guide

## Issue: Users can login without verifying email

This means Supabase is auto-confirming emails or the setting is disabled.

## ✅ Quick Fix - Check Supabase Settings

### Step 1: Check Email Confirmation Setting

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/ltmyqtcirhsgfyortgfo
2. **Go to**: Authentication → Providers
3. **Click on**: Email provider
4. **Find**: "Confirm email" setting

**It should be:**
- ✅ **Confirm email**: ENABLED
- ✅ **Enable email confirmations**: ON
- ❌ **Auto Confirm**: OFF (should be disabled)

### Step 2: Check Auth Settings

**Authentication → Settings:**
- ✅ **Enable email confirmations**: ON
- ❌ **Disable email confirmations**: OFF
- ❌ **Auto confirm users**: OFF

### Step 3: Check Environment Variables

**In Supabase Dashboard → Settings → API:**

Look for:
```
ENABLE_EMAIL_CONFIRMATIONS = true
MAILER_AUTOCONFIRM = false
```

### Step 4: Verify in Database

Run this SQL query in Supabase SQL Editor:

```sql
-- Check if users have email_confirmed_at set
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Not Verified'
    ELSE '✅ Verified'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
- New users should have `email_confirmed_at = NULL` until they click verification link
- Old users might have `email_confirmed_at` set already

### Step 5: Test with New Account

1. **Register a NEW account** (not one created before)
2. **Check browser console** (F12)
3. **Look for log**: 
   ```
   🔐 User login data: {
     email: "test@example.com",
     email_confirmed_at: null,  ← Should be NULL for unverified
     confirmed: false
   }
   ```
4. **If `email_confirmed_at` is NOT null**, Supabase is auto-confirming

## 🔧 How to Fix Auto-Confirm Issue

### Option 1: Update Supabase Auth Config (Recommended)

**Via Supabase Dashboard:**
1. Authentication → Providers → Email
2. **Uncheck**: "Auto Confirm Users"
3. **Check**: "Enable email confirmations"
4. **Save changes**

### Option 2: Update via SQL (Advanced)

Run in SQL Editor:

```sql
-- Disable auto-confirm for new signups
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at DROP DEFAULT;

-- Force all existing users to verify (optional)
UPDATE auth.users 
SET email_confirmed_at = NULL 
WHERE email_confirmed_at IS NOT NULL
AND created_at > NOW() - INTERVAL '7 days';
```

⚠️ **Warning**: This will force recent users to re-verify

### Option 3: Check Project Settings

Sometimes auto-confirm is enabled at project level:

1. **Dashboard** → Settings → General
2. Look for "Email Confirmations" section
3. Ensure it's **enabled** and **not auto-confirming**

## 🧪 Testing After Fix

### Test 1: Create New Account
```
1. Register with new email
2. Check console logs
3. Should see: email_confirmed_at: null
4. Try to login → Should be BLOCKED
5. Check email for verification link
6. Click verification link
7. Try login again → Should WORK
```

### Test 2: Check Console Logs
When attempting login before verification:
```
🔐 User login data: {
  email: "test@example.com",
  email_confirmed_at: null,  ✓ NULL = not verified
  confirmed: false
}
❌ Email not verified! Blocking login.
```

After verification:
```
🔐 User login data: {
  email: "test@example.com",
  email_confirmed_at: "2026-01-01T12:34:56.789Z",  ✓ Has timestamp
  confirmed: true
}
✅ Email verified, proceeding with login
```

## 📋 Common Issues & Solutions

### Issue 1: Auto-Confirm Enabled
**Symptom**: All users can login immediately after signup
**Fix**: Disable auto-confirm in Authentication → Providers → Email

### Issue 2: Old User Accounts
**Symptom**: Accounts created before implementing verification can login
**Reason**: They already have `email_confirmed_at` set
**Fix**: Either:
  - Allow old accounts (they're already in)
  - Force re-verification with SQL query above

### Issue 3: Email Not Sending
**Symptom**: No verification email received
**Fixes**:
  1. Check spam folder
  2. Verify SMTP settings in Supabase
  3. Check email template is configured
  4. Test with different email provider (Gmail, Outlook)

### Issue 4: Supabase Service Email
**Symptom**: Emails come from noreply@mail.app.supabase.io
**Note**: This is normal for free tier
**Fix**: Upgrade to Pro for custom SMTP

## 🎯 Expected Behavior (After Fix)

### New User Registration:
```
1. User fills signup form
2. Supabase creates account with email_confirmed_at = NULL
3. Supabase sends verification email
4. User is signed out immediately
5. Toast: "Please verify your email"
```

### Login Attempt (Unverified):
```
1. User enters email/password
2. Supabase authenticates credentials ✓
3. Code checks email_confirmed_at → NULL ❌
4. User is signed out
5. Error: "Please verify your email before logging in"
```

### After Clicking Verification Link:
```
1. Link redirects to /login with hash
2. email_confirmed_at gets timestamp ✓
3. Welcome email sent
4. User can now login successfully
```

## 🔐 Security Check

Run this in browser console after attempting login:

```javascript
// Check what Supabase is returning
supabase.auth.getUser().then(({ data }) => {
  console.log('Current user:', data.user);
  console.log('Email confirmed:', !!data.user?.email_confirmed_at);
  console.log('Confirmed at:', data.user?.email_confirmed_at);
});
```

## 📞 Still Not Working?

1. **Check Supabase Logs**: Dashboard → Logs → Auth
2. **Look for**: Email confirmation events
3. **Verify**: No errors in auth flow
4. **Test**: Create account with different email provider
5. **Contact**: Supabase support if issue persists

---

**Root Cause (Most Likely):**
Supabase has "Auto Confirm" enabled in Authentication settings, which automatically sets `email_confirmed_at` when users signup, bypassing the verification requirement.

**Quick Fix:**
Go to: Authentication → Providers → Email → Disable "Auto Confirm Users"
