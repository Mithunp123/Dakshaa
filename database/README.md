# Database Scripts Organization

## 📁 Directory Structure

```
database/
├── schema.sql                      # Main database schema (USE THIS)
├── seed.sql                        # Sample data for testing
├── add_email_to_profiles.sql      # Add email column to profiles
├── setup_profile_trigger.sql      # Auto-create profiles on signup
├── create_admin_stats_function.sql # Admin dashboard statistics
├── delete_user_by_email.sql       # Delete user and all data
│
├── migrations/                     # Database updates and fixes
│   ├── fix_rls_policies.sql       # Fix Row Level Security
│   ├── setup_accommodation_and_lunch.sql # Accommodation tables
│   └── setup_accommodation_lunch_bookings.sql # Lunch bookings
│
└── archive/                        # Historical/unused scripts
    ├── accommodation_referral_livestatus.sql
    ├── admin_roles_extended.sql
    ├── advanced_features.sql
    └── [... other archived files]
```

## 🚀 Setup Order (Fresh Database)

Run these SQL files in **Supabase SQL Editor** in this exact order:

### 1. Core Schema
```sql
-- Creates all tables: profiles, events, registrations, teams, etc.
database/schema.sql
```

### 2. Sample Data (Optional)
```sql
-- Adds test events and combos
database/seed.sql
```

### 3. Profile Enhancements
```sql
-- Adds email column to profiles table
database/add_email_to_profiles.sql

-- Creates trigger to auto-create profiles on user signup
database/setup_profile_trigger.sql
```

### 4. Admin Features
```sql
-- Creates function for admin dashboard statistics
database/create_admin_stats_function.sql
```

### 5. Migrations (If Needed)
```sql
-- Fix RLS policies if infinite recursion occurs
database/migrations/fix_rls_policies.sql

-- Add accommodation and lunch booking tables
database/migrations/setup_accommodation_and_lunch.sql
```

## 📝 Active Scripts (Use These)

| File | Purpose | When to Use |
|------|---------|-------------|
| `schema.sql` | Complete database structure | Fresh setup |
| `seed.sql` | Test data | Development/testing |
| `add_email_to_profiles.sql` | Profile email column | First-time setup |
| `setup_profile_trigger.sql` | Auto profile creation | First-time setup |
| `create_admin_stats_function.sql` | Admin statistics | First-time setup |
| `delete_user_by_email.sql` | Delete specific user | As needed |

## 🗄️ Migrations Folder

Contains database updates and fixes for existing installations:

- **fix_rls_policies.sql**: Fixes infinite recursion in team policies
- **setup_accommodation_and_lunch.sql**: Adds accommodation/lunch tables
- **setup_accommodation_lunch_bookings.sql**: Alternative accommodation setup

## 📦 Archive Folder

Contains historical scripts that were used during development but are no longer needed for new installations. These are kept for reference only:

- Old schema versions
- Deprecated features
- Development-specific scripts
- One-time fix scripts

## ⚠️ Important Notes

1. **Never run archive scripts** on production
2. **Always backup** before running migrations
3. **Test migrations** on development first
4. **Follow order** for fresh installations
5. **Check logs** after each script

## 🔍 Script Descriptions

### schema.sql (Main Schema)
Creates:
- `profiles` - User information
- `events` - Event catalog
- `combos` - Package deals
- `registrations` - Event registrations
- `teams` - Team management
- `team_members` - Team membership
- `attendance` - Attendance tracking
- `winners` - Contest winners
- `event_coordinators` - Event staff

### setup_profile_trigger.sql
- Automatically creates profile when user signs up
- Extracts data from signup metadata
- Sets default role to 'student'

### create_admin_stats_function.sql
Returns:
- Total registrations
- Revenue (events + combos)
- User count
- Event statistics
- Check-in counts
- Morning/evening attendance

## 🛠️ Maintenance Scripts

### Delete User
```sql
-- Edit email in file first
database/delete_user_by_email.sql
```

Deletes:
- Team memberships
- Teams created
- Attendance records
- Registrations
- Accommodation bookings
- Profile
- Auth user

## 📊 Verification Queries

After setup, verify with:

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'get_admin_dashboard_stats';

-- Check sample data
SELECT COUNT(*) FROM events;
SELECT COUNT(*) FROM combos;
SELECT COUNT(*) FROM profiles;
```

## 🔄 Update Existing Database

If you already have a database and need to add features:

1. **Add Profile Features**:
   ```sql
   database/add_email_to_profiles.sql
   database/setup_profile_trigger.sql
   ```

2. **Add Admin Stats**:
   ```sql
   database/create_admin_stats_function.sql
   ```

3. **Fix RLS Issues**:
   ```sql
   database/migrations/fix_rls_policies.sql
   ```

4. **Add Accommodation**:
   ```sql
   database/migrations/setup_accommodation_and_lunch.sql
   ```

## 🚫 What NOT to Use

- **archive/** folder - Historical scripts only
- **.sql.old files** - Backup copies
- **test_*.sql** - Development tests

## 📞 Need Help?

If scripts fail:
1. Check Supabase logs
2. Verify user permissions
3. Check for existing tables/functions
4. Review error messages
5. Check dependencies between scripts

Keep this file updated when adding new scripts! 📝
