-- Batch RPC: get_batch_event_stats(UUID[])
-- Returns PAID registration counts for multiple events in one call
-- This dramatically reduces network overhead (1 call vs N calls)

CREATE OR REPLACE FUNCTION public.get_batch_event_stats(p_event_ids UUID[])
RETURNS TABLE(event_id UUID, registered INTEGER, capacity INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS event_id,
    COALESCE(COUNT(er.id) FILTER (WHERE er.payment_status = 'PAID'), 0)::INTEGER AS registered,
    COALESCE(e.capacity::integer, 100) AS capacity
  FROM unnest(p_event_ids) AS e_id
  JOIN public.events e ON e.id = e_id
  LEFT JOIN public.event_registrations_config er ON er.event_id = e.id AND er.payment_status = 'PAID'
  GROUP BY e.id, e.capacity
  ORDER BY e.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_batch_event_stats(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_batch_event_stats(UUID[]) TO anon;

-- Comment explaining the performance improvement
COMMENT ON FUNCTION public.get_batch_event_stats(UUID[]) IS 
'Batched version of get_event_stats - fetches registration counts for multiple events in a single database call. Reduces N network requests to 1 request.';
