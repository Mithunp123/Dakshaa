-- =============================================
-- FIX FINANCE DASHBOARD ISSUES
-- =============================================

-- 1. Create a Secure RPC function to calculate stats
-- This bypasses RLS so we guarantee numbers are correct regardless of permissions
CREATE OR REPLACE FUNCTION get_finance_overview()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue DECIMAL := 0;
  v_online_revenue DECIMAL := 0;
  v_cash_revenue DECIMAL := 0;
  v_pending_cash DECIMAL := 0;
  v_total_registrations INTEGER := 0;
  v_category_data JSON;
  v_hourly_data JSON;
BEGIN
  -- Calculate totals from event_registrations_config
  SELECT 
    COALESCE(SUM(CASE WHEN payment_status IN ('PAID', 'paid', 'completed', 'approved') THEN (payment_amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_status IN ('PAID', 'paid', 'completed', 'approved') AND transaction_id IS NOT NULL THEN (payment_amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_status IN ('PAID', 'paid', 'completed', 'approved') AND transaction_id IS NULL THEN (payment_amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_status IN ('PENDING', 'pending', 'initiated') AND transaction_id IS NULL THEN (payment_amount) ELSE 0 END), 0),
    COUNT(*)
  INTO 
    v_total_revenue,
    v_online_revenue,
    v_cash_revenue,
    v_pending_cash,
    v_total_registrations
  FROM event_registrations_config;

  -- Category Data
  SELECT json_agg(t) INTO v_category_data FROM (
      SELECT 
        COALESCE(e.category, erc.event_name, 'Other') as name, 
        SUM(erc.payment_amount) as value
      FROM event_registrations_config erc
      LEFT JOIN events e ON erc.event_id::text = e.event_id::text
      WHERE erc.payment_status IN ('PAID', 'paid', 'completed', 'approved')
      GROUP BY 1
  ) t;

  -- Hourly Data
  SELECT json_agg(t) INTO v_hourly_data FROM (
      SELECT 
        EXTRACT(HOUR FROM registered_at) as hour,
        COUNT(*) as count
      FROM event_registrations_config
      WHERE registered_at IS NOT NULL
      GROUP BY 1
      ORDER BY 1
  ) t;

  RETURN json_build_object(
    'totalRevenue', v_total_revenue,
    'onlineRevenue', v_online_revenue,
    'cashRevenue', v_cash_revenue,
    'pendingCash', v_pending_cash,
    'totalRegistrations', v_total_registrations,
    'categoryData', COALESCE(v_category_data, '[]'::json),
    'hourlyData', COALESCE(v_hourly_data, '[]'::json)
  );
END;
$$;

-- 2. Fix RLS to ensure Admin can see the transaction list
-- Ensure profiles are readable (to check role)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Ensure event_registrations_config is readable by admins
DROP POLICY IF EXISTS "Admins can view all event registrations" ON event_registrations_config;
CREATE POLICY "Admins can view all event registrations" 
ON event_registrations_config FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'registration_admin', 'event_coordinator')
  )
);
