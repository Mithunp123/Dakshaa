-- =============================================
-- FIX: Team Join Request Trigger
-- =============================================
-- Problem: The trigger was comparing teams.event_id (TEXT) with events.id (UUID)
-- Solution: Compare teams.event_id with events.event_id (both TEXT)
-- =============================================

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_notify_team_join_request ON team_join_requests;
DROP FUNCTION IF EXISTS notify_team_join_request();

-- Recreate the function with correct join condition
CREATE OR REPLACE FUNCTION notify_team_join_request()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_leader_id UUID;
  v_team_name TEXT;
  v_user_name TEXT;
  v_event_name TEXT;
BEGIN
  -- Get team leader and details (FIXED: join on event_id, not id)
  SELECT 
    t.leader_id,
    t.team_name,
    COALESCE(e.title, e.name, t.event_id) as event_title
  INTO v_leader_id, v_team_name, v_event_name
  FROM teams t
  LEFT JOIN events e ON t.event_id = e.event_id
  WHERE t.id = NEW.team_id;

  -- Get requesting user's name
  SELECT COALESCE(full_name, 'User') INTO v_user_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Only create notification if we have a leader
  IF v_leader_id IS NOT NULL THEN
    -- Create notification for team leader
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      is_read
    ) VALUES (
      v_leader_id,
      'team_join_request',
      'New Team Join Request',
      COALESCE(v_user_name, 'Someone') || ' wants to join your team "' || COALESCE(v_team_name, 'Team') || '"' || 
        CASE WHEN v_event_name IS NOT NULL THEN ' for ' || v_event_name ELSE '' END,
      jsonb_build_object(
        'request_id', NEW.id,
        'team_id', NEW.team_id,
        'team_name', v_team_name,
        'user_id', NEW.user_id,
        'user_name', v_user_name,
        'event_name', v_event_name,
        'message', NEW.message
      ),
      false
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'notify_team_join_request error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_notify_team_join_request
  AFTER INSERT ON team_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_team_join_request();

-- Also fix the approve/reject notification functions if they exist
CREATE OR REPLACE FUNCTION notify_join_request_decision()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_team_name TEXT;
  v_event_name TEXT;
  v_leader_name TEXT;
  v_notification_type TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only trigger on status change to approved or rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    -- Get team details (FIXED: join on event_id)
    SELECT 
      t.team_name,
      COALESCE(e.title, e.name, t.event_id),
      p.full_name
    INTO v_team_name, v_event_name, v_leader_name
    FROM teams t
    LEFT JOIN events e ON t.event_id = e.event_id
    LEFT JOIN profiles p ON t.leader_id = p.id
    WHERE t.id = NEW.team_id;

    IF NEW.status = 'approved' THEN
      v_notification_type := 'join_request_approved';
      v_notification_title := 'Join Request Approved!';
      v_notification_message := 'Your request to join "' || COALESCE(v_team_name, 'the team') || '" has been approved!';
    ELSE
      v_notification_type := 'join_request_rejected';
      v_notification_title := 'Join Request Declined';
      v_notification_message := 'Your request to join "' || COALESCE(v_team_name, 'the team') || '" was declined.';
    END IF;

    -- Create notification for the requesting user
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      is_read
    ) VALUES (
      NEW.user_id,
      v_notification_type,
      v_notification_title,
      v_notification_message,
      jsonb_build_object(
        'request_id', NEW.id,
        'team_id', NEW.team_id,
        'team_name', v_team_name,
        'event_name', v_event_name,
        'status', NEW.status
      ),
      false
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_join_request_decision error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_notify_join_request_decision ON team_join_requests;
CREATE TRIGGER trigger_notify_join_request_decision
  AFTER UPDATE ON team_join_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_join_request_decision();

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'Team join request triggers have been fixed!';
  RAISE NOTICE 'The triggers now correctly join teams.event_id with events.event_id (TEXT to TEXT)';
END $$;
