-- =============================================
-- RPC Function: Get Event Registration Count
-- =============================================
-- This function returns the total registration count for an event
-- It bypasses RLS so ALL users can see the total count
-- =============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_event_registration_count(TEXT);

-- Create the function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION get_event_registration_count(p_event_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_capacity INTEGER;
  v_current_registrations TEXT;
BEGIN
  -- Count registrations from event_registrations_config table
  SELECT COUNT(*) INTO v_count
  FROM event_registrations_config
  WHERE event_id = p_event_id;

  -- Get capacity from events table
  SELECT 
    COALESCE(capacity::integer, 100),
    COALESCE(current_registrations, '0')
  INTO v_capacity, v_current_registrations
  FROM events
  WHERE event_id = p_event_id;

  -- If no event found, use defaults
  IF v_capacity IS NULL THEN
    v_capacity := 100;
  END IF;

  -- Return the result as JSON
  RETURN json_build_object(
    'count', COALESCE(v_count, 0),
    'capacity', v_capacity,
    'current_registrations', COALESCE(v_current_registrations::integer, v_count, 0)
  );
END;
$$;

-- Grant execute permission to all authenticated users and anonymous users
GRANT EXECUTE ON FUNCTION get_event_registration_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_registration_count(TEXT) TO anon;

-- Add a comment for documentation
COMMENT ON FUNCTION get_event_registration_count(TEXT) IS 
'Returns the total registration count and capacity for an event. Bypasses RLS so all users can see total registrations.';

-- Test the function (optional)
-- SELECT get_event_registration_count('tech-cse');
