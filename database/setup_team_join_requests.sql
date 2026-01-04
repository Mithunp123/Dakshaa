-- =============================================
-- TEAM JOIN REQUEST SYSTEM
-- =============================================
-- This script sets up the team join request feature where users can:
-- 1. Search for teams
-- 2. Request to join a team
-- 3. Team leader approves/rejects the request
-- 4. User gets notified of the decision
-- =============================================

-- Create team_join_requests table
CREATE TABLE IF NOT EXISTS team_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT, -- Optional message from user to team leader
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id) -- Prevent duplicate requests
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team_id ON team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_user_id ON team_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON team_join_requests(status);

-- Add new notification types to notifications table constraint
DO $$ 
BEGIN
  -- Drop existing constraint
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  
  -- Add new constraint including join request types
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN (
      'team_invitation',
      'team_join_request',
      'join_request_approved',
      'join_request_rejected',
      'registration',
      'payment',
      'general'
    ));
END $$;

-- =============================================
-- TRIGGER: Notify team leader of join request
-- =============================================
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
  -- Get team leader and details
  SELECT 
    t.leader_id,
    t.team_name,
    e.title
  INTO v_leader_id, v_team_name, v_event_name
  FROM teams t
  JOIN events e ON t.event_id = e.id
  WHERE t.id = NEW.team_id;

  -- Get requesting user's name
  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = NEW.user_id;

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
    v_user_name || ' wants to join your team "' || v_team_name || '" for ' || v_event_name,
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

  RETURN NEW;
END;
$$;

-- Attach trigger to team_join_requests
DROP TRIGGER IF EXISTS trigger_notify_team_join_request ON team_join_requests;
CREATE TRIGGER trigger_notify_team_join_request
  AFTER INSERT ON team_join_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_team_join_request();

-- =============================================
-- RPC: Approve join request
-- =============================================
CREATE OR REPLACE FUNCTION approve_join_request(request_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_request RECORD;
  v_team RECORD;
  v_current_members INT;
  v_user_name TEXT;
BEGIN
  -- Get request details
  SELECT * INTO v_request
  FROM team_join_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  -- Get team details and check if user is leader
  SELECT * INTO v_team
  FROM teams
  WHERE id = v_request.team_id;

  IF v_team.leader_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only team leader can approve requests');
  END IF;

  -- Check team capacity
  SELECT COUNT(*) INTO v_current_members
  FROM team_members
  WHERE team_id = v_request.team_id;

  IF v_current_members >= v_team.max_members THEN
    -- Update request to rejected due to full team
    UPDATE team_join_requests
    SET status = 'rejected', updated_at = NOW()
    WHERE id = request_id;

    RETURN jsonb_build_object('success', false, 'error', 'Team is full');
  END IF;

  -- Check if user is already in another team for same event
  IF EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = v_request.user_id 
    AND t.event_id = v_team.event_id
  ) THEN
    UPDATE team_join_requests
    SET status = 'rejected', updated_at = NOW()
    WHERE id = request_id;

    RETURN jsonb_build_object('success', false, 'error', 'User is already in a team for this event');
  END IF;

  -- Add user to team
  INSERT INTO team_members (team_id, user_id, role, joined_at)
  VALUES (v_request.team_id, v_request.user_id, 'member', NOW());

  -- Update request status
  UPDATE team_join_requests
  SET status = 'approved', updated_at = NOW()
  WHERE id = request_id;

  -- Get user name
  SELECT full_name INTO v_user_name FROM profiles WHERE id = v_request.user_id;

  -- Notify user of approval
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    is_read
  ) VALUES (
    v_request.user_id,
    'join_request_approved',
    'Join Request Approved!',
    'Your request to join "' || v_team.team_name || '" has been approved',
    jsonb_build_object(
      'team_id', v_team.id,
      'team_name', v_team.team_name
    ),
    false
  );

  RETURN jsonb_build_object('success', true, 'message', 'User added to team successfully');
END;
$$;

-- =============================================
-- RPC: Reject join request
-- =============================================
CREATE OR REPLACE FUNCTION reject_join_request(request_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_request RECORD;
  v_team RECORD;
BEGIN
  -- Get request details
  SELECT * INTO v_request
  FROM team_join_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  -- Get team details and check if user is leader
  SELECT * INTO v_team
  FROM teams
  WHERE id = v_request.team_id;

  IF v_team.leader_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only team leader can reject requests');
  END IF;

  -- Update request status
  UPDATE team_join_requests
  SET status = 'rejected', updated_at = NOW()
  WHERE id = request_id;

  -- Notify user of rejection
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    is_read
  ) VALUES (
    v_request.user_id,
    'join_request_rejected',
    'Join Request Declined',
    'Your request to join "' || v_team.team_name || '" was declined',
    jsonb_build_object(
      'team_id', v_team.id,
      'team_name', v_team.team_name
    ),
    false
  );

  RETURN jsonb_build_object('success', true, 'message', 'Request rejected');
END;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own join requests"
  ON team_join_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Team leaders can view requests for their teams
CREATE POLICY "Leaders can view team join requests"
  ON team_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_join_requests.team_id
      AND teams.leader_id = auth.uid()
    )
  );

-- Users can create join requests
CREATE POLICY "Users can create join requests"
  ON team_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Team leaders can update requests (for approval/rejection via RPC)
CREATE POLICY "Leaders can update team join requests"
  ON team_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_join_requests.team_id
      AND teams.leader_id = auth.uid()
    )
  );

-- Users can delete their own pending requests (cancel request)
CREATE POLICY "Users can delete own pending requests"
  ON team_join_requests FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- =============================================
-- GRANT EXECUTE ON RPC FUNCTIONS
-- =============================================
GRANT EXECUTE ON FUNCTION approve_join_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_join_request(UUID) TO authenticated;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Team join request system setup complete!';
  RAISE NOTICE '📋 Created: team_join_requests table';
  RAISE NOTICE '🔔 Created: notify_team_join_request trigger';
  RAISE NOTICE '✅ Created: approve_join_request RPC function';
  RAISE NOTICE '❌ Created: reject_join_request RPC function';
  RAISE NOTICE '🔒 Created: RLS policies for team_join_requests';
END $$;
