-- RPC: get_event_stats(UUID)
-- Returns accurate PAID registration count for an event, bypassing RLS

CREATE OR REPLACE FUNCTION public.get_event_stats(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registered INTEGER;
  v_capacity INTEGER;
BEGIN
  -- Count PAID registrations in new system
  SELECT COUNT(*) INTO v_registered
  FROM public.event_registrations_config
  WHERE event_id = p_event_id AND payment_status = 'PAID';

  -- Capacity from events table
  SELECT COALESCE(capacity::integer, 100) INTO v_capacity
  FROM public.events
  WHERE id = p_event_id;

  RETURN json_build_object(
    'registered', COALESCE(v_registered, 0),
    'capacity', COALESCE(v_capacity, 100)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_stats(UUID) TO anon;
