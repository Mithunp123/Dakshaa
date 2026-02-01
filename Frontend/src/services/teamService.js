import { supabase } from "../supabase";

/**
 * Team Service
 * Handles team creation and management for team-based events
 */

/**
 * Create a new team
 * @param {Object} teamData - Team information
 * @returns {Promise<Object>} Response with team details
 */
/**
 * Get team statistics
 * @param {string|null} eventId - Optional event ID filter
 * @returns {Promise<Object>} Team statistics
 */
export const getTeamStatistics = async (eventId = null) => {
  try {
    let teamsQuery = supabase
      .from('teams')
      .select('id', { count: 'exact', head: true });
    
    let membersQuery = supabase
      .from('team_members')
      .select('id, teams!inner(event_id)', { count: 'exact', head: true });
    
    let paidTeamsQuery = supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    
    let revenueQuery = supabase
      .from('teams')
      .select('total_paid_amount')
      .eq('is_active', true);

    if (eventId) {
      teamsQuery = teamsQuery.eq('event_id', eventId);
      membersQuery = membersQuery.eq('teams.event_id', eventId);
      paidTeamsQuery = paidTeamsQuery.eq('event_id', eventId);
      revenueQuery = revenueQuery.eq('event_id', eventId);
    }

    const [teamsRes, membersRes, paidRes, revRes] = await Promise.all([
      teamsQuery,
      membersQuery,
      paidTeamsQuery,
      revenueQuery
    ]);

    const teamsCount = teamsRes.count || 0;
    const membersCount = membersRes.count || 0;
    const paidTeamsCount = paidRes.count || 0;
    
    let revenue = 0;
    if (revRes.data) {
      revenue = revRes.data.reduce((sum, team) => {
        return sum + (parseFloat(team.total_paid_amount) || 0);
      }, 0);
    }

    return {
      success: true,
      data: {
        team_count: teamsCount,
        paid_team_count: paidTeamsCount,
        leader_count: teamsCount,
        member_count: membersCount,
        total_revenue: revenue
      }
    };
  } catch (error) {
    console.error('Error fetching team statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all teams with members and payment status
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Teams data
 */
export const getAllTeams = async (options = {}) => {
  try {
    const {
      limit = 100,
      offset = 0,
      eventId = null,
      onlyPaid = false
    } = options;

    // Build teams query
    let query = supabase
      .from('teams')
      .select('*');

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    if (onlyPaid) {
      query = query.eq('is_active', true);
    }

    const { data: teams, error: teamsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (teamsError) {
      throw teamsError;
    }

    if (!teams || teams.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    const teamIds = teams.map(team => team.id);
    const leaderIds = teams.map(team => team.leader_id).filter(Boolean);

    // Fetch team members with profiles
    const { data: members } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles(
          full_name,
          mobile_number,
          email
        )
      `)
      .in('team_id', teamIds);

    // Fetch leader profiles
    const { data: leaderProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, mobile_number, email')
      .in('id', leaderIds);

    // Group members by team_id
    const membersMap = {};
    const leaderProfilesMap = {};
    
    members?.forEach(member => {
      const teamId = member.team_id;
      if (!membersMap[teamId]) {
        membersMap[teamId] = [];
      }
      
      membersMap[teamId].push({
        full_name: member.profiles?.full_name || 'Unknown User',
        mobile: member.profiles?.mobile_number || '',
        email: member.profiles?.email || '',
        role: member.role,
        user_id: member.user_id
      });
    });

    leaderProfiles?.forEach(profile => {
      leaderProfilesMap[profile.id] = profile;
    });

    // Process teams data
    const processedTeams = await Promise.all(
      teams.map(async (team) => {
        const teamMembers = membersMap[team.id] || [];
        
        // Resolve event information
        let eventName = 'Unknown Event';
        let realEventId = team.event_id;
        
        if (team.event_id) {
          try {
            const { data: event } = await supabase
              .from('events')
              .select('id, name, price')
              .eq('id', team.event_id)
              .single();
            
            if (event) {
              eventName = event.name;
              realEventId = event.id;
            }
          } catch (error) {
            console.log('Event lookup failed, trying event_id column:', error.message);
            try {
              const { data: event } = await supabase
                .from('events')
                .select('id, name, price')
                .eq('event_id', team.event_id)
                .single();
              
              if (event) {
                eventName = event.name;
                realEventId = event.id;
              }
            } catch (e) {
              console.log('Event lookup failed completely:', e.message);
            }
          }
        }

        // Get leader information
        let leaderName = null;
        let leaderMobile = null;
        let leaderEmail = null;

        if (team.leader_id) {
          const leaderProfile = leaderProfilesMap[team.leader_id];
          if (leaderProfile) {
            leaderName = leaderProfile.full_name;
            leaderMobile = leaderProfile.mobile_number;
            leaderEmail = leaderProfile.email;
          }
        }

        // Fallback: check created_by in members
        if (!leaderName && team.created_by) {
          const creatorMember = teamMembers.find(m => m.user_id === team.created_by);
          if (creatorMember) {
            leaderName = creatorMember.full_name;
          }
        }

        // Fallback: check role='leader' in members
        if (!leaderName) {
          const leaderMember = teamMembers.find(m => m.role === 'leader');
          if (leaderMember) {
            leaderName = leaderMember.full_name;
          }
        }

        // Sort members (leaders first)
        teamMembers.sort((a, b) => {
          if (a.role === 'leader' && b.role !== 'leader') return -1;
          if (a.role !== 'leader' && b.role === 'leader') return 1;
          return 0;
        });

        return {
          ...team,
          name: team.team_name || 'Unnamed Team',
          event_name: eventName,
          real_event_id: realEventId,
          leader_name: leaderName,
          leader_mobile: leaderMobile,
          leader_email: leaderEmail,
          member_count: teamMembers.length,
          members_list: teamMembers,
          payment_amount: parseFloat(team.total_paid_amount) || 0,
          leader_payment_status: team.is_active ? 'PAID' : 'PENDING',
          payment_status: team.is_active ? 'PAID' : 'PENDING'
        };
      })
    );

    return {
      success: true,
      data: processedTeams
    };
  } catch (error) {
    console.error('Error fetching teams:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get team by ID with members
 * @param {string} teamId - Team ID
 * @returns {Promise<Object>} Team data with members
 */
export const getTeamById = async (teamId) => {
  try {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) {
      throw teamError;
    }

    if (!team) {
      return {
        success: false,
        error: 'Team not found'
      };
    }

    // Resolve event information
    let eventName = 'Unknown Event';
    let realEventId = team.event_id;
    let pricePerMember = 0;
    
    if (team.event_id) {
      try {
        const { data: event } = await supabase
          .from('events')
          .select('id, name, price')
          .eq('id', team.event_id)
          .single();
        
        if (event) {
          eventName = event.name;
          realEventId = event.id;
          pricePerMember = parseFloat(event.price) || 0;
        }
      } catch (error) {
        try {
          const { data: event } = await supabase
            .from('events')
            .select('id, name, price')
            .eq('event_id', team.event_id)
            .single();
          
          if (event) {
            eventName = event.name;
            realEventId = event.id;
            pricePerMember = parseFloat(event.price) || 0;
          }
        } catch (e) {
          console.log('Event lookup failed:', e.message);
        }
      }
    }

    // Get leader information
    let leaderName = null;
    if (team.leader_id) {
      try {
        const { data: leader } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', team.leader_id)
          .single();
        
        if (leader) {
          leaderName = leader.full_name;
        }
      } catch (error) {
        console.log('Leader lookup failed:', error.message);
      }
    }

    // Calculate team payment status
    let memberCount = 0;
    let paidMembersCount = 0;
    let paymentAmount = 0;
    let paymentStatus = 'PENDING';

    if (realEventId) {
      try {
        const { data: members } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', teamId);

        if (members) {
          memberCount = members.length;
          const memberIds = members.map(m => m.user_id).filter(Boolean);

          if (memberIds.length > 0) {
            const { data: registrations } = await supabase
              .from('event_registrations_config')
              .select('payment_status')
              .eq('event_id', realEventId)
              .in('user_id', memberIds);

            if (registrations) {
              paidMembersCount = registrations.filter(r => r.payment_status === 'PAID').length;
              paymentAmount = paidMembersCount * pricePerMember;
              
              if (paidMembersCount > 0) {
                paymentStatus = paidMembersCount === memberCount ? 'PAID' : 'PARTIAL';
              }
            }
          }
        }
      } catch (error) {
        console.log('Payment calculation failed:', error.message);
      }
    }

    return {
      success: true,
      data: {
        ...team,
        event_name: eventName,
        real_event_id: realEventId,
        leader_name: leaderName,
        member_count: memberCount,
        paid_members_count: paidMembersCount,
        payment_amount: paymentAmount,
        payment_status: paymentStatus
      }
    };
  } catch (error) {
    console.error('Error fetching team by ID:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get team members with optional payment status
 * @param {string} teamId - Team ID
 * @param {string|null} eventId - Optional event ID for payment status
 * @returns {Promise<Object>} Team members data
 */
export const getTeamMembers = async (teamId, eventId = null) => {
  try {
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('role', { ascending: false })
      .order('joined_at');

    if (membersError) {
      throw membersError;
    }

    if (!members || members.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // Process each member
    const processedMembers = await Promise.all(
      members.map(async (member) => {
        let profile = {};
        let paymentInfo = {
          payment_status: 'PENDING',
          payment_amount: 0,
          transaction_id: null,
          reg_id: null
        };

        // Fetch profile information
        if (member.user_id) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email, mobile_number, college_name')
              .eq('id', member.user_id)
              .single();
            
            if (profileData) {
              profile = profileData;
            }
          } catch (error) {
            console.log('Profile lookup failed:', error.message);
          }

          // Fetch payment status if event_id provided
          if (eventId) {
            try {
              const { data: registration } = await supabase
                .from('event_registrations_config')
                .select('*')
                .eq('event_id', eventId)
                .eq('user_id', member.user_id)
                .single();
              
              if (registration) {
                paymentInfo = {
                  payment_status: registration.payment_status || 'PENDING',
                  payment_amount: registration.payment_amount || 0,
                  transaction_id: registration.transaction_id,
                  reg_id: registration.id
                };
              }
            } catch (error) {
              console.log('Payment lookup failed:', error.message);
            }
          }
        }

        return {
          ...member,
          full_name: profile.full_name || 'Unknown User',
          email: profile.email || '',
          mobile_number: profile.mobile_number || '',
          college_name: profile.college_name || '',
          ...paymentInfo
        };
      })
    );

    return {
      success: true,
      data: processedMembers
    };
  } catch (error) {
    console.error('Error fetching team members:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const createTeam = async (teamData) => {
  try {
    // DEPRECATED: Direct team creation is no longer allowed
    // Teams must be created through payment flow to ensure proper activation
    console.error("❌ DEPRECATED: Direct createTeam is no longer allowed. Use paymentService.initiateTeamPayment instead");
    throw new Error("Team creation requires payment. Please use the payment flow instead.");
    
    /* OLD IMPLEMENTATION - COMMENTED OUT TO PREVENT BYPASS
    // Debug: Check session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔍 Session check:', session ? '✅ Active' : '❌ Missing');
    console.log('🔍 User ID:', session?.user?.id);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const {
      teamName,
      eventId,
      maxMembers
    } = teamData;

    // Check if team name already exists for this event
    const { data: existingTeam, error: checkError } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('event_id', eventId)
      .ilike('team_name', teamName.trim())
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking team name:', checkError);
      throw new Error('Failed to validate team name');
    }

    if (existingTeam) {
      throw new Error(`Team name "${teamName}" already exists for this event. Please choose a different name.`);
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        team_name: teamName,
        event_id: eventId,
        leader_id: user.id,
        created_by: user.id,
        max_members: maxMembers || 4,
        is_active: true  // This was the problem - bypassing payment
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Add leader as first team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'leader',
        status: 'active'
      });

    if (memberError) throw memberError;

    return {
      success: true,
      data: team,
      error: null
    };
    */
  } catch (error) {
    console.error("Error creating team:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get team details with members
 * @param {String} teamId - ID of the team
 * @returns {Promise<Object>} Team details with members
 */
export const getTeamDetails = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        leader:profiles!teams_leader_id_fkey(full_name, email, college_name),
        members:team_members(
          id,
          role,
          status,
          created_at,
          user:profiles!team_members_user_id_fkey(id, full_name, email, department)
        )
      `)
      .eq('id', teamId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error fetching team details:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Send team invitation to user
 * @param {String} teamId - ID of the team
 * @param {String} userId - ID of the user to invite
 * @returns {Promise<Object>} Response with success status
 */
export const sendTeamInvitation = async (teamId, userId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create invitation
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        inviter_id: user.id,
        invitee_id: userId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error sending invitation:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get pending invitations for a team
 * @param {String} teamId - ID of the team
 * @returns {Promise<Object>} Response with invitations
 */
export const getTeamInvitations = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        invitee:profiles!team_invitations_invitee_id_fkey(id, full_name, email, roll_no, department)
      `)
      .eq('team_id', teamId)
      .eq('status', 'pending');

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Add member to team
 * @param {String} teamId - ID of the team
 * @param {String} userId - ID of the user to add
 * @returns {Promise<Object>} Response with success status
 */
export const addTeamMember = async (teamId, userId) => {
  try {
    // Check if team is full
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('max_members, members:team_members(count)')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    const currentMembers = team.members[0].count;
    if (currentMembers >= team.max_members) {
      throw new Error('Team is full');
    }

    // Add member
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: 'member',
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error adding team member:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Remove member from team
 * @param {String} teamId - ID of the team
 * @param {String} userId - ID of the user to remove
 * @returns {Promise<Object>} Response with success status
 */
export const removeTeamMember = async (teamId, userId) => {
  try {
    const { error } = await supabase
      .from('team_members')
      .update({ status: 'left' })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error removing team member:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update team details
 * @param {String} teamId - ID of the team
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Response with updated team
 */
export const updateTeam = async (teamId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error updating team:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Delete/Disband team
 * @param {String} teamId - ID of the team
 * @returns {Promise<Object>} Response with success status
 */
export const deleteTeam = async (teamId) => {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ is_active: false })
      .eq('id', teamId);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error deleting team:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Search users to add to team
 * @param {String} searchQuery - Search query (name, email, roll number)
 * @returns {Promise<Array>} List of users
 */
export const searchUsersForTeam = async (searchQuery) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, roll_no, department, college_name')
      .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,roll_no.ilike.%${searchQuery}%`)
      .limit(20);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error searching users:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Search teams to join
 * @param {String} searchQuery - Search query (team name, event name)
 * @returns {Promise<Array>} List of teams
 */
export const searchTeamsToJoin = async (searchQuery) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('User not authenticated');

    // First, search for leaders by name to get their IDs
    const { data: matchingLeaders } = await supabase
      .from('profiles')
      .select('id')
      .ilike('full_name', `%${searchQuery}%`)
      .limit(50);

    const leaderIdsFromSearch = matchingLeaders?.map(l => l.id) || [];

    // Search teams by team name
    const { data: teamsByName, error: nameError } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        max_members,
        leader_id,
        event_id,
        created_at,
        team_members(
          user_id,
          role,
          created_at,
          profiles(full_name, email)
        )
      `)
      .eq('is_active', true)
      .ilike('team_name', `%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (nameError) throw nameError;

    // Search teams by leader ID (if any leaders matched)
    let teamsByLeader = [];
    if (leaderIdsFromSearch.length > 0) {
      const { data: leaderTeams, error: leaderError } = await supabase
        .from('teams')
        .select(`
          id,
          team_name,
          max_members,
          leader_id,
          event_id,
          created_at,
          team_members(
            user_id,
            role,
            created_at,
            profiles(full_name, email)
          )
        `)
        .eq('is_active', true)
        .in('leader_id', leaderIdsFromSearch)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!leaderError && leaderTeams) {
        teamsByLeader = leaderTeams;
      }
    }

    // Combine and deduplicate results
    const allTeamsMap = new Map();
    [...(teamsByName || []), ...teamsByLeader].forEach(team => {
      if (!allTeamsMap.has(team.id)) {
        allTeamsMap.set(team.id, team);
      }
    });
    const data = Array.from(allTeamsMap.values());

    // Filter out teams user is already in or has pending requests for
    const { data: userTeams } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id);

    const { data: pendingRequests } = await supabase
      .from('team_join_requests')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    const userTeamIds = new Set(userTeams?.map(t => t.team_id) || []);
    const pendingTeamIds = new Set(pendingRequests?.map(r => r.team_id) || []);

    // Get unique event IDs and leader IDs
    const eventIds = [...new Set(data?.map(t => t.event_id).filter(Boolean) || [])];
    const leaderIds = [...new Set(data?.map(t => t.leader_id).filter(Boolean) || [])];

    // Fetch events and leaders separately
    const [eventsResult, leaderProfiles] = await Promise.all([
      eventIds.length > 0 
        ? supabase.from('events').select('event_id, title, category, event_type').in('event_id', eventIds)
        : { data: [] },
      leaderIds.length > 0
        ? supabase.from('profiles').select('id, full_name, email')
            .in('id', leaderIds)
        : { data: [] }
    ]);

    const eventMap = new Map(eventsResult.data?.map(e => [e.event_id, e]) || []);
    const leaderMap = new Map(leaderProfiles.data?.map(p => [p.id, p]) || []);

    const filteredTeams = (data || [])
      .filter(team => !userTeamIds.has(team.id) && !pendingTeamIds.has(team.id))
      .map(team => ({
        ...team,
        events: eventMap.get(team.event_id) || { title: team.event_id, category: '', event_type: '' },
        leader: leaderMap.get(team.leader_id),
        members: team.team_members || [],
        current_members: team.team_members?.length || 0,
        is_full: (team.team_members?.length || 0) >= team.max_members
      }));

    return {
      success: true,
      data: filteredTeams,
      error: null
    };
  } catch (error) {
    console.error("Error searching teams:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Send join request to a team
 * @param {String} teamId - ID of the team
 * @param {String} message - Optional message to team leader
 * @returns {Promise<Object>} Response with success status
 */
export const sendJoinRequest = async (teamId, message = '') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('User not authenticated');

    // Check if user already sent a request for this team
    const { data: existingRequest } = await supabase
      .from('team_join_requests')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new Error('You already have a pending request for this team');
      } else if (existingRequest.status === 'approved') {
        throw new Error('Your request was already approved');
      }
      // If rejected, allow sending a new request by deleting the old one
      await supabase
        .from('team_join_requests')
        .delete()
        .eq('id', existingRequest.id);
    }

    const { data, error } = await supabase
      .from('team_join_requests')
      .insert({
        team_id: teamId,
        user_id: user.id,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error sending join request:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get pending join requests for user's teams (for team leaders)
 * @returns {Promise<Array>} List of join requests
 */
export const getTeamJoinRequests = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('User not authenticated');

    // Fetch join requests with team and user data
    const { data, error } = await supabase
      .from('team_join_requests')
      .select(`
        id,
        message,
        created_at,
        status,
        user_id,
        teams(id, team_name, event_id, leader_id),
        profiles(id, full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, data: [], error: null };
    }

    // Filter to only show requests for teams the user leads
    const userTeamRequests = data.filter(r => r.teams?.leader_id === user.id);

    // Get unique event IDs
    const eventIds = [...new Set(userTeamRequests.map(r => r.teams?.event_id).filter(Boolean))];

    // Fetch events separately
    const { data: eventsData } = eventIds.length > 0 
      ? await supabase.from('events').select('event_id, title').in('event_id', eventIds)
      : { data: [] };

    const eventMap = new Map(eventsData?.map(e => [e.event_id, e]) || []);

    // Combine data
    const enrichedData = userTeamRequests.map(request => ({
      ...request,
      teams: request.teams ? {
        ...request.teams,
        events: eventMap.get(request.teams.event_id) || { title: request.teams.event_id }
      } : null
    }));

    return {
      success: true,
      data: enrichedData,
      error: null
    };
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get user's own join requests
 * @returns {Promise<Array>} List of user's join requests
 */
export const getMyJoinRequests = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('User not authenticated');

    // Fetch join requests with team data
    const { data, error } = await supabase
      .from('team_join_requests')
      .select(`
        id,
        message,
        created_at,
        status,
        team_id,
        teams(id, team_name, event_id, leader_id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, data: [], error: null };
    }

    // Get unique event IDs and leader IDs
    const eventIds = [...new Set(data.map(r => r.teams?.event_id).filter(Boolean))];
    const leaderIds = [...new Set(data.map(r => r.teams?.leader_id).filter(Boolean))];

    // Fetch events and leaders separately
    const [eventsResult, leadersResult] = await Promise.all([
      eventIds.length > 0 
        ? supabase.from('events').select('event_id, title').in('event_id', eventIds)
        : { data: [] },
      leaderIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', leaderIds)
        : { data: [] }
    ]);

    const eventMap = new Map(eventsResult.data?.map(e => [e.event_id, e]) || []);
    const leaderMap = new Map(leadersResult.data?.map(l => [l.id, l]) || []);

    // Combine data
    const enrichedData = data.map(request => ({
      ...request,
      teams: request.teams ? {
        ...request.teams,
        events: eventMap.get(request.teams.event_id) || { title: request.teams.event_id },
        leader: leaderMap.get(request.teams.leader_id) || { full_name: 'Unknown' }
      } : null
    }));

    return {
      success: true,
      data: enrichedData,
      error: null
    };
  } catch (error) {
    console.error("Error fetching my join requests:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Cancel a pending join request
 * @param {String} requestId - ID of the join request
 * @returns {Promise<Object>} Response with success status
 */
export const cancelJoinRequest = async (requestId) => {
  try {
    const { error } = await supabase
      .from('team_join_requests')
      .delete()
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error canceling join request:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Accept a join request (team leader only)
 * @param {String} requestId - ID of the join request
 * @returns {Promise<Object>} Response with success status
 */
export const acceptJoinRequest = async (requestId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('User not authenticated');

    // Get the join request details
    const { data: request, error: requestError } = await supabase
      .from('team_join_requests')
      .select('*, teams(id, leader_id, max_members)')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;
    if (!request) throw new Error('Join request not found');

    // Verify current user is the team leader
    if (request.teams.leader_id !== user.id) {
      throw new Error('Only team leader can accept join requests');
    }

    // Check if team is full
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', request.team_id);

    if (memberCount >= request.teams.max_members) {
      throw new Error('Team is full');
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: request.team_id,
        user_id: request.user_id,
        role: 'member',
        status: 'joined'
      });

    if (memberError) throw memberError;

    // Update request status to approved
    const { error: updateError } = await supabase
      .from('team_join_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error accepting join request:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reject a join request (team leader only)
 * @param {String} requestId - ID of the join request
 * @returns {Promise<Object>} Response with success status
 */
export const rejectJoinRequest = async (requestId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('User not authenticated');

    // Get the join request details
    const { data: request, error: requestError } = await supabase
      .from('team_join_requests')
      .select('*, teams(id, leader_id)')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;
    if (!request) throw new Error('Join request not found');

    // Verify current user is the team leader
    if (request.teams.leader_id !== user.id) {
      throw new Error('Only team leader can reject join requests');
    }

    // Update request status to rejected
    const { error: updateError } = await supabase
      .from('team_join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error rejecting join request:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createTeam,
  getTeamDetails,
  addTeamMember,
  removeTeamMember,
  updateTeam,
  deleteTeam,
  searchUsersForTeam,
  sendTeamInvitation,
  getTeamInvitations,
  searchTeamsToJoin,
  sendJoinRequest,
  getTeamJoinRequests,
  getMyJoinRequests,
  cancelJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest
};
