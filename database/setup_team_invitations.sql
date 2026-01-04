-- ============================================================================
-- TEAM INVITATION SYSTEM
-- ============================================================================

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES profiles(id),
    invitee_id UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, invitee_id)
);

-- Create or update notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add data column if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;

-- Drop existing type check constraint if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated type check constraint that includes team_invitation
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'team_invitation',
    'registration_confirmation',
    'payment_confirmation',
    'event_reminder',
    'announcement',
    'system_notification',
    'accommodation_confirmation',
    'team_update'
));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee ON team_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================================
-- RLS POLICIES FOR TEAM_INVITATIONS
-- ============================================================================

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_invitations_select" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_insert" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_update" ON team_invitations;
DROP POLICY IF EXISTS "team_invitations_delete" ON team_invitations;

-- Users can view invitations they sent or received
CREATE POLICY "team_invitations_select" ON team_invitations
    FOR SELECT
    USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

-- Team leaders can send invitations
CREATE POLICY "team_invitations_insert" ON team_invitations
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        is_team_leader(team_id, auth.uid())
    );

-- Invitees can update their invitation status
CREATE POLICY "team_invitations_update" ON team_invitations
    FOR UPDATE
    USING (invitee_id = auth.uid())
    WITH CHECK (invitee_id = auth.uid());

-- Team leaders can delete/cancel invitations
CREATE POLICY "team_invitations_delete" ON team_invitations
    FOR DELETE
    USING (is_team_leader(team_id, auth.uid()));

-- ============================================================================
-- RLS POLICIES FOR NOTIFICATIONS
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

-- Users can only see their own notifications
CREATE POLICY "notifications_select" ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Anyone can create notifications (for system/admin use)
CREATE POLICY "notifications_insert" ON notifications
    FOR INSERT
    WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update" ON notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete" ON notifications
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to create notification when invitation is sent
CREATE OR REPLACE FUNCTION notify_team_invitation()
RETURNS TRIGGER AS $$
DECLARE
    team_name TEXT;
    inviter_name TEXT;
BEGIN
    -- Get team and inviter details
    SELECT t.team_name, p.full_name INTO team_name, inviter_name
    FROM teams t, profiles p
    WHERE t.id = NEW.team_id AND p.id = NEW.inviter_id;

    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
        NEW.invitee_id,
        'team_invitation',
        'Team Invitation',
        inviter_name || ' invited you to join ' || team_name,
        jsonb_build_object(
            'invitation_id', NEW.id,
            'team_id', NEW.team_id,
            'team_name', team_name,
            'inviter_id', NEW.inviter_id,
            'inviter_name', inviter_name
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification on invitation
DROP TRIGGER IF EXISTS team_invitation_notify ON team_invitations;
CREATE TRIGGER team_invitation_notify
    AFTER INSERT ON team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION notify_team_invitation();

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_id UUID)
RETURNS JSONB AS $$
DECLARE
    invitation RECORD;
    result JSONB;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation FROM team_invitations WHERE id = invitation_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
    END IF;

    IF invitation.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitation already processed');
    END IF;

    -- Add user to team
    INSERT INTO team_members (team_id, user_id, role, status)
    VALUES (invitation.team_id, invitation.invitee_id, 'member', 'active');

    -- Update invitation status
    UPDATE team_invitations SET status = 'accepted', updated_at = NOW()
    WHERE id = invitation_id;

    RETURN jsonb_build_object('success', true, 'message', 'Invitation accepted');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject invitation
CREATE OR REPLACE FUNCTION reject_team_invitation(invitation_id UUID)
RETURNS JSONB AS $$
BEGIN
    UPDATE team_invitations SET status = 'rejected', updated_at = NOW()
    WHERE id = invitation_id AND invitee_id = auth.uid();

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'message', 'Invitation rejected');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or unauthorized');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ TEAM INVITATION SYSTEM SETUP COMPLETE!' as status;

SELECT 'Tables:' as section;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('team_invitations', 'notifications')
ORDER BY table_name;

SELECT 'Functions:' as section;
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('accept_team_invitation', 'reject_team_invitation', 'notify_team_invitation')
ORDER BY routine_name;
