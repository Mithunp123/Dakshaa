# Profile Automatic Creation Setup Guide

## Issue Fixed
✅ **Error**: `userProfile is not defined` in RegistrationForm.jsx  
✅ **Missing**: Automatic profile creation when users sign up

## What Was Changed

### 1. Frontend Fixes (RegistrationForm.jsx)
- Added `userProfile` state variable
- Profile is now fetched when user logs in
- Removed redundant profile fetches in registration functions
- Profile data is loaded once and reused throughout the component

### 2. Database Setup Required

#### Step 1: Add Email Column to Profiles
Run this in Supabase SQL Editor:
```bash
database/add_email_to_profiles.sql
```

This adds an `email` column to the profiles table for easier access.

#### Step 2: Setup Profile Auto-Creation Trigger
Run this in Supabase SQL Editor:
```bash
database/setup_profile_trigger.sql
```

This creates a trigger that automatically creates a profile entry when users sign up.

## How It Works Now

### User Registration Flow
1. **User Signs Up** (SignUpForm.jsx)
   - User fills in registration form
   - Data is passed to Supabase Auth via `options.data`:
     ```javascript
     {
       full_name: formData.fullName,
       gender: formData.gender,
       college_name: formData.collegeName,
       department: formData.department,
       year_of_study: formData.yearOfStudy,
       roll_number: formData.rollNumber,
       mobile_number: formData.mobileNumber
     }
     ```

2. **Database Trigger Fires** (Automatic)
   - When user is created in `auth.users`
   - Trigger `on_auth_user_created` executes
   - Function `handle_new_user()` runs
   - Profile is automatically created in `profiles` table

3. **Profile Data Stored**
   ```sql
   INSERT INTO profiles (
     id,              -- User UUID from auth.users
     full_name,       -- From signup metadata
     email,           -- From auth.users.email
     gender,          -- From signup metadata
     college_name,    -- From signup metadata
     department,      -- From signup metadata
     year_of_study,   -- From signup metadata
     roll_number,     -- From signup metadata
     mobile_number,   -- From signup metadata
     role,            -- Default: 'student'
     created_at       -- Current timestamp
   )
   ```

### Event Registration Flow
1. **User Opens Registration Page**
   - User profile is fetched automatically
   - Stored in `userProfile` state
   - Available for all registration operations

2. **User Selects Events**
   - Individual or Combo mode
   - Selects events/combo package

3. **User Proceeds to Payment**
   - If `PAYMENT_SIMULATION_ENABLED = true`:
     - Redirects to payment simulation page
     - Creates PENDING registrations
     - Updates to PAID after confirmation
   - If `PAYMENT_SIMULATION_ENABLED = false`:
     - Directly creates PAID registrations

## Database Tables Updated

### profiles Table
```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,                    -- NEW: Added for easier access
    gender TEXT,
    college_name TEXT,
    department TEXT,
    year_of_study TEXT,
    roll_number TEXT,
    mobile_number TEXT,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE
);
```

## Testing

### Test Profile Creation
1. Sign up a new user
2. Check if profile is created:
```sql
SELECT * FROM profiles WHERE email = 'test@example.com';
```

### Test Registration Flow
1. Login with existing user
2. Go to event registration page
3. Check browser console - should see profile loaded
4. Register for events
5. Check database:
```sql
SELECT * FROM registrations WHERE user_id = '<user-uuid>';
```

## Verification Queries

### Check if trigger exists
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### Check if email column exists
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'email';
```

### Check profiles
```sql
SELECT id, full_name, email, mobile_number, role, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
```

## Important Notes

1. **Run SQL Files in Order**:
   - First: `add_email_to_profiles.sql`
   - Second: `setup_profile_trigger.sql`

2. **Existing Users**: The trigger only works for NEW signups. Existing users already have profiles created manually.

3. **Email Verification**: Users must verify their email before they can login (if email verification is enabled).

4. **Profile Updates**: Users can update their profile in the dashboard after signup.

5. **Role Management**: Default role is 'student'. Admins can change roles via the admin panel.

## Troubleshooting

### Profile not created on signup
- Check if trigger exists (use verification query above)
- Check Supabase logs for errors
- Verify `raw_user_meta_data` is being passed in signUp

### Email column missing
- Run `add_email_to_profiles.sql`
- Verify with column existence query

### Registration errors
- Check browser console for errors
- Verify user is logged in
- Check if profile exists for the user
- Check Supabase RLS policies

## Next Steps

1. **Run the SQL files** in Supabase SQL Editor
2. **Test signup** with a new user
3. **Test registration** flow
4. **Monitor** for any errors in browser console

All profile data will now be automatically stored when users register! 🎉
