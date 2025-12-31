-- =====================================================
-- ADMIN DASHBOARD STATISTICS FUNCTION
-- =====================================================
-- This function provides comprehensive real-time statistics
-- for the admin dashboard with accurate counts and revenue

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_registrations_count INT;
  paid_registrations_count INT;
  pending_registrations_count INT;
  total_revenue_amount DECIMAL;
  combo_revenue DECIMAL;
  total_users_count INT;
  total_events_count INT;
  active_events_count INT;
  total_checkins_count INT;
  morning_checkins_count INT;
  evening_checkins_count INT;
  total_combos_count INT;
  active_combos_count INT;
BEGIN
  -- Count total registrations
  SELECT COUNT(*) INTO total_registrations_count
  FROM registrations;

  -- Count paid registrations
  SELECT COUNT(*) INTO paid_registrations_count
  FROM registrations
  WHERE payment_status = 'PAID';

  -- Count pending registrations
  SELECT COUNT(*) INTO pending_registrations_count
  FROM registrations
  WHERE payment_status = 'PENDING';

  -- Calculate total revenue from paid event registrations
  SELECT COALESCE(SUM(e.price), 0) INTO total_revenue_amount
  FROM registrations r
  INNER JOIN events e ON r.event_id = e.event_id
  WHERE r.payment_status = 'PAID' AND r.event_id IS NOT NULL;

  -- Add combo revenue
  SELECT COALESCE(SUM(c.price), 0) INTO combo_revenue
  FROM registrations r
  INNER JOIN combos c ON r.combo_id = c.combo_id
  WHERE r.payment_status = 'PAID' AND r.combo_id IS NOT NULL;
  
  total_revenue_amount := total_revenue_amount + combo_revenue;

  -- Count total users
  SELECT COUNT(*) INTO total_users_count
  FROM profiles;

  -- Count total events
  SELECT COUNT(*) INTO total_events_count
  FROM events;

  -- Count active events
  SELECT COUNT(*) INTO active_events_count
  FROM events
  WHERE is_active = true;

  -- Count total check-ins (unique attendance records)
  SELECT COUNT(DISTINCT user_id) INTO total_checkins_count
  FROM attendance;

  -- Count morning check-ins (assuming attendance table has created_at or session field)
  SELECT COUNT(*) INTO morning_checkins_count
  FROM attendance
  WHERE EXTRACT(HOUR FROM created_at) < 12;

  -- Count evening check-ins
  SELECT COUNT(*) INTO evening_checkins_count
  FROM attendance
  WHERE EXTRACT(HOUR FROM created_at) >= 12;

  -- Count total combos
  SELECT COUNT(*) INTO total_combos_count
  FROM combos;

  -- Count active combos
  SELECT COUNT(*) INTO active_combos_count
  FROM combos
  WHERE is_active = true;

  -- Build JSON result
  result := json_build_object(
    'total_registrations', total_registrations_count,
    'paid_registrations', paid_registrations_count,
    'pending_registrations', pending_registrations_count,
    'total_revenue', total_revenue_amount,
    'total_users', total_users_count,
    'total_events', total_events_count,
    'open_events', active_events_count,
    'total_checkins', total_checkins_count,
    'morning_checkins', morning_checkins_count,
    'evening_checkins', evening_checkins_count,
    'total_combos', total_combos_count,
    'active_combos', active_combos_count,
    'last_updated', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Test the function:
-- SELECT get_admin_dashboard_stats();

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This function calculates all statistics in real-time
-- 2. Revenue is calculated from event prices + combo prices
-- 3. Only PAID registrations count towards revenue
-- 4. Check-ins are divided by time (morning < 12:00, evening >= 12:00)
-- 5. Function is SECURITY DEFINER so it runs with creator privileges
-- 6. Results are cached by Supabase for better performance
