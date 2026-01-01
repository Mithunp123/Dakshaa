# 🔧 Fixing Supabase 403 & CORS Errors

## ❌ Current Errors

Your deployed app is showing:
1. ✋ **403 Forbidden** on `/auth/v1/user` and `/auth/v1/logout`
2. 🚫 **CORS policy blocking** requests from `https://dakshaa-t26.web.app`
3. 💥 **502 Bad Gateway** on RPC function `get_event_stats`
4. 🔌 **WebSocket connection failures** for realtime subscriptions

## 🔍 Root Causes

### 1. Supabase Project Issues
- Project might be **paused** (free tier inactivity)
- **Billing issues** or quota exceeded
- **API keys regenerated** (old keys no longer valid)
- **Row Level Security (RLS)** policies blocking requests

### 2. CORS Configuration Missing
- Firebase hosting domain not in allowed origins
- Supabase needs to whitelist: `https://dakshaa-t26.web.app`

### 3. RPC Function Errors
- `get_event_stats` function might not exist
- Function might have errors
- Database connection issues

## 🛠️ Step-by-Step Fixes

### Fix 1: Check Supabase Project Status

1. **Go to**: https://supabase.com/dashboard/projects
2. **Check your project**: `ltmyqtcirhsgfyortgfo`
3. **Look for**:
   - ⏸️ **Paused badge** - Click "Resume Project" if paused
   - 💳 **Billing warnings** - Add payment method if needed
   - 📊 **Usage quotas** - Check if limits exceeded

### Fix 2: Configure CORS (Allow Firebase Domain)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/ltmyqtcirhsgfyortgfo
2. **Go to**: Settings → API
3. **Scroll to**: "Additional Configuration"
4. **Find**: "CORS Configuration" or "Allowed Origins"
5. **Add these origins**:
   ```
   https://dakshaa-t26.web.app
   https://dakshaa-t26.firebaseapp.com
   http://localhost:5173
   http://localhost:4173
   ```
6. **Save changes**

### Fix 3: Verify API Keys

1. **In Supabase Dashboard**: Settings → API
2. **Copy the current keys**:
   - **Project URL**: Should match `https://ltmyqtcirhsgfyortgfo.supabase.co`
   - **anon public key**: Should be 200+ characters

3. **Compare with your .env file**:
   ```bash
   # In your terminal, check current key:
   cd Frontend
   cat .env.production
   ```

4. **If keys don't match**, update `.env.production`:
   ```env
   VITE_SUPABASE_URL=https://ltmyqtcirhsgfyortgfo.supabase.co
   VITE_SUPABASE_ANON_KEY=<paste-new-key-here>
   ```

5. **Rebuild and redeploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Fix 4: Check RPC Function `get_event_stats`

1. **Open Supabase SQL Editor**:
   - Dashboard → SQL Editor → New Query

2. **Check if function exists**:
   ```sql
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'get_event_stats';
   ```

3. **If function missing**, create it:
   ```sql
   CREATE OR REPLACE FUNCTION get_event_stats(event_uuid UUID)
   RETURNS JSON AS $$
   DECLARE
     result JSON;
   BEGIN
     SELECT json_build_object(
       'registered', COUNT(DISTINCT er.user_id),
       'checked_in_morning', COUNT(DISTINCT CASE WHEN a.morning_attended THEN a.user_id END),
       'checked_in_evening', COUNT(DISTINCT CASE WHEN a.evening_attended THEN a.user_id END),
       'remaining_morning', COUNT(DISTINCT er.user_id) - COUNT(DISTINCT CASE WHEN a.morning_attended THEN a.user_id END),
       'remaining_evening', COUNT(DISTINCT er.user_id) - COUNT(DISTINCT CASE WHEN a.evening_attended THEN a.user_id END)
     )
     INTO result
     FROM event_registrations_config er
     LEFT JOIN attendance a ON er.user_id = a.user_id AND er.event_uuid = a.event_uuid
     WHERE er.event_uuid = get_event_stats.event_uuid;
     
     RETURN result;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

4. **Grant execute permission**:
   ```sql
   GRANT EXECUTE ON FUNCTION get_event_stats TO anon, authenticated;
   ```

### Fix 5: Check Row Level Security (RLS)

The 403 errors might be from RLS blocking access. Check policies:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('attendance', 'event_registrations_config', 'profiles', 'events_config');

-- Check existing policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

**If tables are missing policies**, run your schema setup:
```bash
cd d:\Downloads\DaKshaa-login
psql -U postgres -d your_db < database/schema.sql
```

### Fix 6: Enable Realtime for Tables

WebSocket failures might be from disabled realtime:

1. **In Supabase Dashboard**: Database → Replication
2. **Enable realtime for these tables**:
   - ✅ `attendance`
   - ✅ `event_registrations_config`
   - ✅ `registrations`
   - ✅ `events_config`
3. **Save changes**

### Fix 7: Check Supabase Service Status

Sometimes Supabase has outages:
1. **Check status**: https://status.supabase.com/
2. **If there's an incident**, wait for resolution
3. **Subscribe to updates** for notifications

## 🧪 Testing After Fixes

### Test 1: API Connection
```bash
# Test if Supabase is reachable
curl https://ltmyqtcirhsgfyortgfo.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

Expected: `200 OK` or JSON response (not 403)

### Test 2: Auth Endpoint
```bash
curl https://ltmyqtcirhsgfyortgfo.supabase.co/auth/v1/health
```

Expected: `{"version":"...","name":"GoTrue"}`

### Test 3: RPC Function
```bash
curl -X POST https://ltmyqtcirhsgfyortgfo.supabase.co/rest/v1/rpc/get_event_stats \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_uuid":"some-uuid"}'
```

Expected: JSON response (not 502)

### Test 4: Check Frontend Console
1. Open deployed site: https://dakshaa-t26.web.app
2. Open DevTools (F12) → Console
3. Look for:
   - ✅ "Supabase client initialized successfully"
   - ❌ No 403 errors
   - ❌ No CORS errors

## 🚨 Quick Fix Checklist

- [ ] Resume paused Supabase project
- [ ] Add Firebase domain to CORS allowed origins
- [ ] Verify API keys match between Supabase and .env
- [ ] Check RPC function `get_event_stats` exists
- [ ] Enable realtime replication for tables
- [ ] Grant execute permissions on RPC functions
- [ ] Check RLS policies are correct
- [ ] Rebuild and redeploy after changes

## 📞 If Still Not Working

### Option 1: Check Supabase Logs
1. Dashboard → Logs → API
2. Filter by: 403 errors
3. Check error messages for clues

### Option 2: Check Network Tab
1. Open DevTools → Network
2. Find failed requests (red)
3. Check:
   - Request Headers (is apikey present?)
   - Response (error message)
   - CORS headers

### Option 3: Create New Supabase Project
If project is corrupted or irreversibly broken:
1. Create new project: https://supabase.com/dashboard/new
2. Run database migrations: `database/schema.sql`
3. Update .env with new credentials
4. Redeploy

## 🔑 Expected Values

After fixes, you should see:

**Console Logs (Success)**:
```
✅ Supabase client initialized successfully
URL: https://ltmyqtcirhsgfyortgfo.supabase.co
Key length: 208 characters
📊 Loading participants and stats for: Event Name
✅ Data fetched successfully
```

**Console Logs (No Errors)**:
```
❌ GET /auth/v1/user 403 (Forbidden)           → Should be GONE
❌ Access to fetch ... blocked by CORS policy  → Should be GONE
❌ POST /rpc/get_event_stats 502 (Bad Gateway) → Should be GONE
❌ WebSocket connection ... failed             → Should be GONE
```

## 📚 Additional Resources

- **Supabase CORS Guide**: https://supabase.com/docs/guides/api/cors
- **RLS Documentation**: https://supabase.com/docs/guides/auth/row-level-security
- **Realtime Setup**: https://supabase.com/docs/guides/realtime
- **Troubleshooting Auth**: https://supabase.com/docs/guides/auth/troubleshooting

---

**Most Likely Fix**: Resume paused Supabase project + Add Firebase domain to CORS origins

**Last Updated**: 2025-12-31  
**Priority**: 🔴 CRITICAL - App is currently broken
