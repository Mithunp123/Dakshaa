# 🔍 FRONTEND DEEP DIVE BUG REPORT

**Generated:** January 30, 2026  
**Scope:** Complete Frontend Analysis - All 128 JSX Files  
**Focus:** Additional bugs beyond initial analysis for smooth, lag-free operation

---

## EXECUTIVE SUMMARY

After examining all frontend pages and components, I found **32 additional bugs** categorized by severity:

| Severity | Count | Impact |
|----------|-------|--------|
| 🔴 Critical | 7 | Site-breaking issues |
| 🟠 High | 11 | User experience degradation |
| 🟡 Medium | 9 | Minor annoyances |
| 🟢 Low | 5 | Code quality issues |

---

## I. CRITICAL BUGS (Fix Immediately)

### Bug #1: Empty Catch Blocks Silently Swallowing Errors
**Files Affected:**
- `AuthProvider.jsx` (lines 34, 89, 125)
- `AccommodationBooking.jsx` (line 97)
- `AccommodationManager.jsx` (line 64)

**Problem:**
```javascript
} catch (e) {}  // Error silently ignored!
```

**Impact:** Errors are lost, making debugging impossible. User may experience unexplained failures.

**Fix:**
```javascript
} catch (e) {
  console.error('Auth cache error:', e);
  // Optionally report to error tracking service
}
```

---

### Bug #2: Supabase Health Check Blocks Entire App
**File:** `SupabaseHealthCheck.jsx`

**Problem:** The health check component wraps the entire app and blocks rendering if Supabase is temporarily unavailable.

```javascript
// Line 45-48: Blocks entire app on error
if (isHealthy) {
  return children;  // Only renders if healthy
}
```

**Impact:** 
- If Supabase has a 2-second hiccup, users see error page
- No offline/cached experience possible
- Bad UX during brief network issues

**Fix:** Use graceful degradation:
```javascript
// Show children always, overlay error only if critical
return (
  <>
    {children}
    {!isHealthy && <ErrorOverlay error={error} onRetry={checkHealth} />}
  </>
);
```

---

### Bug #3: Missing Cleanup in MyTeams useEffect
**File:** `MyTeams.jsx` (line 83)

**Problem:** The search debounce timer isn't cleared on unmount:

```javascript
useEffect(() => {
  const delayDebounce = setTimeout(() => {
    if (searchQuery.trim().length >= 2 && expandedTeamId) {
      handleSearch(expandedTeamId);
    }
  }, 300);

  return () => clearTimeout(delayDebounce);  // ✅ This is correct
}, [searchQuery, expandedTeamId]);
```

However, the `handleSearch` function makes async calls that can complete after unmount:

```javascript
const handleSearch = async (teamId) => {
  setIsSearching(true);  // Can cause "setState on unmounted" error
  const result = await searchUsersForTeam(searchQuery);
  // ...
  setSearchResults(filtered);  // Can cause memory leak
  setIsSearching(false);
};
```

**Fix:** Add mounted check:
```javascript
const handleSearch = async (teamId) => {
  if (!mountedRef.current) return;
  setIsSearching(true);
  const result = await searchUsersForTeam(searchQuery);
  if (!mountedRef.current) return;
  // ... rest of code
};
```

---

### Bug #4: Race Condition in CreateTeamModal Payment Flow
**File:** `CreateTeamModal.jsx` (lines 133-140)

**Problem:** After initiating payment, user is redirected but if they navigate back quickly, the modal state is corrupted:

```javascript
const result = await paymentService.initiateTeamPayment({...});

if (result.success && result.payment_url) {
  window.location.href = result.payment_url;  // User redirected
}
// If redirect fails or user cancels, modal is still in loading state
```

**Impact:** Modal stuck in loading state if payment redirect fails.

**Fix:**
```javascript
if (result.success && result.payment_url) {
  // Store state before redirect
  sessionStorage.setItem('team_payment_pending', JSON.stringify({
    teamName: formData.teamName,
    eventId: formData.eventId,
    timestamp: Date.now()
  }));
  window.location.href = result.payment_url;
} else {
  setError(result.error || 'Failed to initiate payment.');
  setLoading(false);
}
```

---

### Bug #5: ProfileSettings Uses Alert Instead of Toast
**File:** `ProfileSettings.jsx` (lines 74, 79)

**Problem:**
```javascript
alert("Profile updated successfully!");  // Blocking, inconsistent UX
// ...
alert("Failed to update profile.");
```

**Impact:** Inconsistent UI - rest of app uses toast notifications.

**Fix:**
```javascript
import toast from 'react-hot-toast';
// ...
toast.success('Profile updated successfully!');
// ...
toast.error('Failed to update profile');
```

---

### Bug #6: DashboardHome Hardcoded Supabase Key in localStorage
**File:** `DashboardHome.jsx` (line 24)

**Problem:**
```javascript
const session = localStorage.getItem('sb-ltmyqtcirhsgfyortgfo-auth-token');
```

The Supabase project ID is hardcoded. If the project is migrated, this breaks.

**Fix:** Use dynamic key like AuthProvider does:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const sessionKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
const session = localStorage.getItem(sessionKey);
```

---

### Bug #7: MyRegistrations API Calls Without Error Boundaries
**File:** `MyRegistrations.jsx` (lines 143-215)

**Problem:** Multiple nested API calls without try-catch:

```javascript
// Inside map callback - if one fails, all fail
const registrationsWithTotals = await Promise.all(
  validRegistrations.map(async (reg) => {
    // Multiple API calls that can throw
    const { data: userTeams } = await supabase.from('team_members')...
    const { data: eventTeam } = await supabase.from('teams')...
    const response = await fetch(`${apiUrl}/payment/calculate-team-amount`...
    // No try-catch around fetch!
```

**Impact:** If one registration has corrupt data, entire page fails.

**Fix:** Wrap each registration processing in try-catch:
```javascript
const registrationsWithTotals = await Promise.all(
  validRegistrations.map(async (reg) => {
    try {
      // ... existing code
    } catch (err) {
      console.error(`Error processing registration ${reg.id}:`, err);
      return reg; // Return original without totals
    }
  })
);
```

---

## II. HIGH PRIORITY BUGS

### Bug #8: AdminDashboard Auto-Refresh Every 10 Seconds
**File:** `AdminDashboard.jsx` (lines 51-75)

**Problem:** Auto-refreshes stats every 10 seconds PLUS real-time subscriptions:
```javascript
// Auto-refresh every 10 seconds
const refreshInterval = setInterval(() => {
  fetchStats();
}, 10000);

// Plus 3 separate real-time subscriptions
const attendanceSubscription = supabase.channel(...)
const registrationSubscription = supabase.channel(...)
const profileSubscription = supabase.channel(...)
```

**Impact:** 
- Unnecessary database load (real-time already handles updates)
- Multiple overlapping refresh cycles
- 3+ database queries every 10 seconds

**Fix:** Remove auto-refresh interval, rely on real-time subscriptions only:
```javascript
// Remove this:
// const refreshInterval = setInterval(() => { fetchStats(); }, 10000);
```

---

### Bug #9: Events.jsx Category Lookup Not Memoized
**File:** `Events.jsx` (lines 125-145)

**Problem:** `categoryMap` object is created fresh on every render:
```javascript
const categoryMap = {
  'technical': 1,
  'non-technical': 2, 
  'harmonicks': 3,
  // ...
};
const eventId = categoryMap[categoryParam] || 1;
```

**Fix:** Move outside component or memoize:
```javascript
const CATEGORY_MAP = {
  'technical': 1,
  'non-technical': 2,
  // ...
};

// Inside component
const eventId = useMemo(() => CATEGORY_MAP[categoryParam] || 1, [categoryParam]);
```

---

### Bug #10: Login.jsx Email Verification Redirect Loop Risk
**File:** `Login.jsx` (lines 84-115)

**Problem:** After email verification, a redirect is triggered:
```javascript
setTimeout(() => {
  navigate('/');
}, 3000);
```

If user is already on home page or if navigation fails, this can cause issues.

**Fix:** Check current location before redirecting:
```javascript
setTimeout(() => {
  if (location.pathname === '/login') {
    navigate('/');
  }
}, 3000);
```

---

### Bug #11: AccommodationBooking No Validation Before Payment
**File:** `AccommodationBooking.jsx` (lines 235-280)

**Problem:** Mobile number validation is insufficient:
```javascript
if (formData.accommodationDates.length === 0) {
  // Only date validation, no profile validation
}
```

**Missing Checks:**
- Email validation
- Mobile number format validation
- Name validation

**Fix:**
```javascript
if (!formData.fullName?.trim()) {
  toast.error('Please enter your full name');
  setLoading(false);
  return;
}
if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) {
  toast.error('Please enter a valid 10-digit mobile number');
  setLoading(false);
  return;
}
```

---

### Bug #12: Referral.jsx Search on Enter Key Issue
**File:** `Referral.jsx` (line 46)

**Problem:** Using `onKeyPress` which is deprecated:
```javascript
onKeyPress={handleKeyPress}
```

**Fix:** Use `onKeyDown`:
```javascript
onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
```

---

### Bug #13: AttendanceQR Canvas Memory Leak
**File:** `AttendanceQR.jsx` (lines 53-140)

**Problem:** Canvas and blob URL created but cleanup may not happen:
```javascript
const canvas = document.createElement('canvas');
// ... lots of drawing
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob);
  // ...
  URL.revokeObjectURL(url);  // ✅ Good
  // But canvas is never cleaned up
});
```

The canvas element isn't explicitly removed from memory.

**Fix:** Null out canvas reference after use:
```javascript
canvas.toBlob((blob) => {
  // ... existing code
  URL.revokeObjectURL(url);
  canvas.width = 0;  // Release memory
  canvas.height = 0;
});
```

---

### Bug #14: Schedule.jsx Hardcoded Event Data
**File:** `Schedule.jsx` (lines 19-117)

**Problem:** Schedule data is hardcoded in the component:
```javascript
const scheduleData = {
  1: {
    theme: "Skill Building + Kick-off",
    // ...
  },
  // ...
};
```

**Impact:** Any schedule changes require code deployment.

**Recommendation:** Move to database or JSON config file that can be updated without deployment.

---

### Bug #15: Payments.jsx Receipt Download Disabled Always
**File:** `Payments.jsx` (lines 216-222)

**Problem:** Download receipt button is always disabled for successful payments:
```javascript
<button 
  disabled={txn.status?.toUpperCase() !== 'SUCCESS'}
  // ...
>
  <Download size={18} />
</button>
```

The button exists but no `onClick` handler - it does nothing when enabled!

**Fix:** Add actual download handler:
```javascript
<button 
  disabled={txn.status?.toUpperCase() !== 'SUCCESS'}
  onClick={() => downloadReceipt(txn)}
  // ...
>
```

---

### Bug #16: Real-time Subscriptions Without Deduplication
**Files Affected:**
- `DashboardHome.jsx` (line 99)
- `MyRegistrations.jsx` (line 103)
- `Payments.jsx` (line 23)

**Problem:** Multiple components subscribe to the same tables, causing duplicate fetch calls.

**Impact:** If user has dashboard open with all tabs loaded, there are:
- 1 subscription to `registrations`
- 1 subscription to `event_registrations_config`
- 1 subscription to `payment_transactions`
- + Any admin subscriptions

All triggering when data changes.

**Fix:** Create a centralized subscription manager or use React Query.

---

### Bug #17: eventConfigService Cache Race Condition
**File:** `eventConfigService.js` (lines 60-100)

**Problem:** Background refresh can overwrite newer data:
```javascript
if (age > 2 * 60 * 1000) {
  console.log('🔄 Background refresh triggered...');
  setTimeout(() => getEventsWithStats(true), 100);  // This runs async
}

return {
  success: true,
  data: data,  // Returns old cached data
  fromCache: true,
};
```

If user triggers a manual refresh while background refresh is running, data can be inconsistent.

**Fix:** Add timestamp validation before updating cache.

---

### Bug #18: CreateTeamModal Event Price Display Issue
**File:** `CreateTeamModal.jsx` (line 77)

**Problem:**
```javascript
const calculateTotal = () => {
  if (!selectedEventObj || !formData.memberCount) return 0;
  const price = selectedEventObj.price || 0;  // Price might be string "300"
  return price * parseInt(formData.memberCount);  // String * Number = NaN
};
```

**Fix:**
```javascript
const price = parseFloat(selectedEventObj.price) || 0;
```

---

## III. MEDIUM PRIORITY BUGS

### Bug #19: Inconsistent Toast Positioning
**Files Affected:** Multiple

Some pages use:
- `position: 'top-center'`
- `position: 'top-right'` (default)

**Fix:** Standardize all toast positions:
```javascript
// In App.jsx or a config file
<Toaster position="top-center" />
```

---

### Bug #20: DashboardLayout Missing Loading State
**File:** `Dashboard.jsx` (line 22)

**Problem:** `LoadingSpinner` component is defined but layout itself has no loading state for auth check.

---

### Bug #21: ProtectedRoute Double Loading Check
**File:** `ProtectedRoute.jsx`

**Problem:** AuthProvider already handles loading, but ProtectedRoute checks again:
```javascript
if (loading) {
  return (
    <div className="min-h-screen...">
      <div className="animate-spin..."></div>
    </div>
  );
}
```

This can cause flash of loading spinner.

---

### Bug #22: MyTeams Deprecated Team Registration Flow
**File:** `MyTeams.jsx` (lines 69-95)

**Problem:** Large commented-out code block:
```javascript
// DEPRECATED: Old team registration flow - Teams are now created with immediate payment
// const handleTeamRegistration = (team) => {
//   // ... 30+ lines of dead code
// };
```

**Fix:** Remove dead code to reduce file size and confusion.

---

### Bug #23: supabaseService.js Cache Duration Inconsistency
**File:** `supabaseService.js` (line 159)

**Problem:** Uses 60-second cache but eventConfigService uses 10-minute cache:
```javascript
if (Date.now() - timestamp < 60000) { // 60 seconds
```

**Fix:** Align cache durations or make configurable.

---

### Bug #24: Events.jsx Auth Listener Duplicate
**File:** `Events.jsx` (lines 45-59)

**Problem:** Creates its own auth listener despite AuthProvider:
```javascript
useEffect(() => {
  const getUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };
  getUser();

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user || null);
  });

  return () => subscription.unsubscribe();
}, []);
```

**Fix:** Use `useAuth()` hook from AuthProvider.

---

### Bug #25: AccommodationBooking Gender Not Validated
**File:** `AccommodationBooking.jsx`

**Problem:** Gender field exists but isn't validated - accommodation may have gender-specific rooms.

---

### Bug #26: Login.jsx Multiple console.log Statements
**File:** `Login.jsx`

**Problem:** Several debug console.log statements in production code:
```javascript
console.log('🔐 Login page loaded - wantsToRegister:', wantsToRegister, ...);
console.log('🔐 User login data:', {...});
console.log('✅ Email verified, proceeding with login');
```

**Fix:** Use conditional logging or remove for production:
```javascript
if (import.meta.env.DEV) {
  console.log('🔐 Login page loaded...');
}
```

---

### Bug #27: Referral.jsx Coins Calculation Logic Unclear
**File:** `Referral.jsx` (lines 54-57)

**Problem:** Magic numbers without explanation:
```javascript
const isMobileNumber = searchResult && /^\d{10}$/.test(searchResult.referral_id);
const coinsPerReferral = isMobileNumber ? 2 : 4;  // Why these values?
const maxCoins = isMobileNumber ? 100 : 100;  // Both are 100?
```

**Fix:** Add comments or use named constants:
```javascript
const COINS_PER_MOBILE_REFERRAL = 2;
const COINS_PER_CODE_REFERRAL = 4;
const MAX_REFERRAL_COINS = 100;
```

---

## IV. LOW PRIORITY BUGS

### Bug #28: Home.jsx displayName Not Needed with memo
**File:** `Home.jsx` (line 26)

```javascript
Home.displayName = 'Home';  // Not strictly necessary
```

This is optional - React DevTools will show name anyway.

---

### Bug #29: Missing PropTypes/TypeScript
**Files:** All components

**Problem:** No type checking for props.

**Recommendation:** Add TypeScript or PropTypes for better developer experience.

---

### Bug #30: Inconsistent Import Ordering
**Files:** Multiple

Some files import:
1. React
2. External libraries
3. Internal components

Others have random ordering. 

**Fix:** Use ESLint import sorting rule.

---

### Bug #31: Dashboard Nested Routes Could Use Outlet
**File:** `Dashboard.jsx`

**Problem:** Uses `<Routes>` with `<Route>` inside a layout. Could be cleaner with React Router's `<Outlet>`.

---

### Bug #32: LazyImage.jsx Potential
**File:** `LazyImage.jsx`

This component exists but isn't used in many places that load images.

**Recommendation:** Use consistently for all event/user images.

---

## V. PERFORMANCE OPTIMIZATION OPPORTUNITIES

### 1. Image Optimization
- Use WebP format (already done for some assets ✅)
- Add lazy loading to all images
- Use `srcset` for responsive images

### 2. Bundle Splitting
Current lazy loading is good, but bundles are still large:
- `RegistrationForm.jsx`: 3,102 lines → Split into 5+ components
- `Events.jsx`: 2,582 lines → Split into 3+ components

### 3. Memoization Opportunities
Add `React.memo()` to:
- Event cards
- Team member rows
- Registration list items

### 4. Virtual Scrolling
For pages with many items:
- Event list (if > 50 events)
- Registration history
- Admin user list

Use `react-window` or `react-virtualized`.

---

## VI. QUICK WINS (30-minute fixes)

| # | Fix | File | Time |
|---|-----|------|------|
| 1 | Replace `alert()` with `toast()` | ProfileSettings.jsx | 5 min |
| 2 | Remove console.log in production | Login.jsx | 5 min |
| 3 | Fix empty catch blocks | AuthProvider.jsx | 5 min |
| 4 | Add `parseFloat()` to price | CreateTeamModal.jsx | 2 min |
| 5 | Remove dead commented code | MyTeams.jsx | 5 min |
| 6 | Fix deprecated onKeyPress | Referral.jsx | 2 min |
| 7 | Standardize toast position | Multiple | 5 min |

---

## VII. RECOMMENDED TESTING CHECKLIST

Before declaring the site bug-free, test these scenarios:

### Authentication Flow
- [ ] Login with correct credentials
- [ ] Login with wrong password
- [ ] Email verification redirect
- [ ] Session persistence after browser close
- [ ] Logout from all tabs

### Registration Flow
- [ ] Individual event registration
- [ ] Combo package registration
- [ ] Team event registration
- [ ] Payment success callback
- [ ] Payment failure callback
- [ ] Partial payment handling

### Dashboard
- [ ] Dashboard loads with cached data
- [ ] Dashboard refreshes in background
- [ ] Real-time updates work
- [ ] QR code downloads correctly

### Edge Cases
- [ ] Slow network (3G simulation)
- [ ] Network disconnect mid-operation
- [ ] Multiple tabs open simultaneously
- [ ] Mobile browser (Safari, Chrome)
- [ ] Back button after payment

---

## VIII. CONCLUSION

The DaKshaa frontend has **32 additional bugs** beyond the initial payment/performance analysis. Most are related to:

1. **Error handling** - Empty catch blocks, missing try-catch
2. **State management** - Race conditions, memory leaks
3. **Consistency** - Toast vs alert, cache durations
4. **Dead code** - Commented blocks, unused imports

**Priority Order:**
1. Fix 7 critical bugs (blocks user journeys)
2. Fix 11 high priority bugs (UX degradation)
3. Address 9 medium bugs (polish)
4. Clean up 5 low priority issues (code quality)

**Estimated Total Fix Time:** 2-3 days for a senior developer

---

**Report End**  
**Total Additional Bugs Found:** 32  
**Critical Path Bugs:** 7  
**Recommended Immediate Action:** Fix bugs #1-7 before next deployment
