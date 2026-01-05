import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  CheckCircle2, 
  XCircle, 
  Crown,
  Mail,
  Phone,
  ShieldCheck,
  Loader2,
  Search,
  User,
  LogIn,
  Clock,
  Check
} from "lucide-react";
import { supabase } from "../../../supabase";
import { supabaseService } from "../../../services/supabaseService";
import CreateTeamModal from "./CreateTeamModal";
import { 
  sendTeamInvitation, 
  searchUsersForTeam,
  getTeamInvitations,
  searchTeamsToJoin,
  sendJoinRequest,
  getMyJoinRequests,
  cancelJoinRequest
} from "../../../services/teamService";

const MyTeams = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState({});
  
  // Join Team states
  const [activeTab, setActiveTab] = useState("my-teams"); // "my-teams" or "join-team"
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamsToJoin, setTeamsToJoin] = useState([]);
  const [isSearchingTeams, setIsSearchingTeams] = useState(false);
  const [myJoinRequests, setMyJoinRequests] = useState([]);

  const handleTeamRegistration = (team) => {
    // Verify minimum team size
    const minSize = team.events?.min_team_size || 2;
    const currentSize = team.members?.length || 0;
    
    if (currentSize < minSize) {
      toast.error(`Team must have at least ${minSize} members to register`, {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    // Navigate to event registration with team data
    navigate('/register-events', {
      state: {
        teamRegistration: true,
        teamId: team.id,
        teamName: team.name,
        eventId: team.event_id,
        eventName: team.events?.title,
        teamMembers: team.members,
        memberCount: currentSize
      }
    });
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchTeams();
        await getCurrentUser();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const data = await supabaseService.getUserTeams(user.id);
      
      // Check registration status for each team
      const teamsWithStatus = await Promise.all(
        data.map(async (team) => {
          // Check if team is registered for the event
          const { data: registrations } = await supabase
            .from('registrations')
            .select('id, payment_status')
            .eq('team_id', team.id)
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 results
          
          return {
            ...team,
            is_registered: !!registrations,
            registration_status: registrations?.payment_status || null
          };
        })
      );
      
      setTeams(teamsWithStatus);
      
      // Fetch pending invitations for each team
      const invitations = {};
      for (const team of teamsWithStatus) {
        if (team.role === "lead" || team.leader_id === user.id) {
          const result = await getTeamInvitations(team.id);
          if (result.success) {
            invitations[team.id] = result.data;
          }
        }
      }
      setPendingInvitations(invitations);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamCreated = () => {
    fetchTeams(); // Refresh teams list
  };

  const toggleTeamExpand = (teamId) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Live search as user types
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2 && expandedTeamId) {
        handleSearch(expandedTeamId);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, expandedTeamId]);

  const handleSearch = async (teamId) => {
    setIsSearching(true);
    const result = await searchUsersForTeam(searchQuery);
    
    if (result.success) {
      const team = teams.find(t => t.id === teamId);
      const memberIds = team.members.map(m => m.id);
      
      // Filter out users already in team or with pending invitations
      const pendingIds = (pendingInvitations[teamId] || []).map(inv => inv.invitee.id);
      const filtered = result.data.filter(user => 
        !memberIds.includes(user.id) && !pendingIds.includes(user.id)
      );
      setSearchResults(filtered);
    }
    setIsSearching(false);
  };

  const handleSendInvitation = async (teamId, userId) => {
    const team = teams.find(t => t.id === teamId);
    const totalCount = team.members.length + (pendingInvitations[teamId]?.length || 0);
    
    if (totalCount >= team.events?.max_team_size) {
      alert("Team is full (including pending invitations)!");
      return;
    }

    const result = await sendTeamInvitation(teamId, userId);
    
    if (result.success) {
      alert("Invitation sent successfully!");
      setSearchQuery("");
      setSearchResults([]);
      fetchTeams(); // Refresh to show pending invitation
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  // Join Team functions
  const handleSearchTeams = async () => {
    if (teamSearchQuery.trim().length < 2) {
      setTeamsToJoin([]);
      return;
    }
    
    setIsSearchingTeams(true);
    const result = await searchTeamsToJoin(teamSearchQuery);
    
    if (result.success) {
      setTeamsToJoin(result.data);
    }
    setIsSearchingTeams(false);
  };

  const fetchMyJoinRequests = async () => {
    const result = await getMyJoinRequests();
    if (result.success) {
      setMyJoinRequests(result.data);
    }
  };

  const handleSendJoinRequest = async (teamId) => {
    const result = await sendJoinRequest(teamId, "");
    
    if (result.success) {
      alert("Join request sent! Team leader will review your request.");
      setTeamSearchQuery("");
      setTeamsToJoin([]);
      fetchMyJoinRequests();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleCancelJoinRequest = async (requestId) => {
    if (!confirm("Cancel this join request?")) return;
    
    const result = await cancelJoinRequest(requestId);
    
    if (result.success) {
      alert("Join request cancelled");
      fetchMyJoinRequests();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  // Fetch join requests when switching to join-team tab
  useEffect(() => {
    if (activeTab === "join-team") {
      fetchMyJoinRequests();
    }
  }, [activeTab]);

  // Live search for teams
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (activeTab === "join-team") {
        handleSearchTeams();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [teamSearchQuery, activeTab]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Team Management</h2>
          <p className="text-gray-400 text-xs">Manage your teams or join existing ones</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-secondary hover:bg-secondary-dark text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.3)] text-sm"
        >
          <UserPlus size={18} />
          Create New Team
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab("my-teams")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "my-teams"
              ? "bg-secondary text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Users size={16} />
          My Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab("join-team")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "join-team"
              ? "bg-secondary text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <LogIn size={16} />
          Join Team
        </button>
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTeamCreated={handleTeamCreated}
      />

      {/* My Teams Tab */}
      {activeTab === "my-teams" && (
        <div className="grid grid-cols-1 gap-6">{teams.map((team) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-white/5 bg-white/[0.02]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl flex items-center justify-center border border-white/10">
                    <Users className="text-secondary" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{team.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        team.role === "lead" ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : "bg-primary/20 text-primary-light border border-primary/30"
                      }`}>
                        {team.role}
                      </span>
                    </div>
                    <p className="text-secondary font-semibold mt-1.5 text-base">{team.events?.title || 'Event Name'}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{team.events?.category || ''} {team.events?.event_type ? `• ${team.events.event_type}` : ''}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Team Size</p>
                    <p className={`text-lg font-bold ${
                      (team.members?.length || 0) >= (team.max_members || team.events?.max_team_size || 4) 
                        ? 'text-green-500' 
                        : (team.members?.length || 0) >= (team.events?.min_team_size || 2)
                        ? 'text-yellow-500'
                        : 'text-white'
                    }`}>{team.members?.length || 0} / {team.max_members || team.events?.max_team_size || 4}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Min: {team.events?.min_team_size || 2}</p>
                  </div>
                  {(team.role === "lead" || team.leader_id === currentUserId) && (
                    <>
                      {/* Registration Status Button */}
                      {team.is_registered ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-default"
                        >
                          <CheckCircle2 size={14} />
                          Registered
                        </button>
                      ) : (team.members?.length || 0) >= (team.events?.min_team_size || 2) ? (
                        <button
                          onClick={() => handleTeamRegistration(team)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          Register Team
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-500/10 border border-gray-500/20 text-gray-500 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                        >
                          <Clock size={14} />
                          Need {(team.events?.min_team_size || 2) - (team.members?.length || 0)} more
                        </button>
                      )}
                      {/* Add Member Button */}
                      <button 
                        onClick={() => toggleTeamExpand(team.id)}
                        disabled={(team.members?.length || 0) >= (team.max_members || team.events?.max_team_size || 4)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          (team.members?.length || 0) >= (team.max_members || team.events?.max_team_size || 4)
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                            : 'bg-secondary/20 hover:bg-secondary/30 text-secondary'
                        }`}
                      >
                        <UserPlus size={14} />
                        {(team.members?.length || 0) >= (team.max_members || team.events?.max_team_size || 4) 
                          ? 'Full' 
                          : expandedTeamId === team.id ? "Hide" : "Add"
                        }
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Team Leader Section - Always Visible */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Team Leader</h4>
                <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-xl">
                  {team.members.find(m => m.role === 'leader') ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center shrink-0">
                        <Crown className="text-yellow-500" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{team.members.find(m => m.role === 'leader').name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <Mail size={11} />
                          <span className="truncate">{team.members.find(m => m.role === 'leader').email}</span>
                        </div>
                        {team.members.find(m => m.role === 'leader').college && (
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                            <span className="truncate">{team.members.find(m => m.role === 'leader').college}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Leader information unavailable</p>
                  )}
                </div>
              </div>

              {/* Team Members Section - Always Visible */}
              {team.members.filter(m => m.role !== 'leader').length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Team Members ({team.members.filter(m => m.role !== 'leader').length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {team.members
                      .filter(m => m.role !== 'leader')
                      .map((member, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                              <User className="text-gray-400" size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{member.name}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                                <Mail size={9} />
                                <span className="truncate">{member.email}</span>
                              </div>
                              {member.college && (
                                <p className="text-[9px] text-gray-500 mt-0.5 truncate">{member.college}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Pending Invitations Only */}
              {pendingInvitations[team.id] && pendingInvitations[team.id].length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Pending Invitations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {pendingInvitations[team.id].map((invitation, idx) => (
                      <div key={`inv-${idx}`} className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center shrink-0">
                          <User className="text-yellow-500" size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{invitation.invitee.full_name}</p>
                          <p className="text-[10px] text-yellow-500 truncate">Pending</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Member Section - Shows when expanded and user is leader */}
              {expandedTeamId === team.id && (team.role === "lead" || team.leader_id === currentUserId) && (
                <div className="pt-5 border-t border-white/10">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-sm">
                    <UserPlus className="text-secondary" size={18} />
                    Invite Team Members
                  </h4>
                  
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type name, email, or roll number..."
                        className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary text-white text-xs"
                      />
                    </div>
                    {isSearching && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Loader2 className="animate-spin" size={12} />
                        Searching...
                      </div>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400">{searchResults.length} users found</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                                <User className="text-gray-400" size={12} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs truncate">{user.full_name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleSendInvitation(team.id, user.id)}
                              className="px-2.5 py-1 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 shrink-0"
                            >
                              <Mail size={10} />
                              Invite
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      No users found matching "{searchQuery}"
                    </div>
                  )}

                  {searchQuery.length < 2 && searchQuery.length > 0 && (
                    <div className="text-center py-4 text-gray-400 text-xs">
                      Type at least 2 characters to search
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {teams.length === 0 && (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-600" size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">No Teams Found</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm">
              You haven't joined or created any teams yet. Start by creating a team for a group event!
            </p>
          </div>
        )}
        </div>
      )}

      {/* Join Team Tab */}
      {activeTab === "join-team" && (
        <div className="space-y-6">
          {/* Search for Teams */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Search className="text-secondary" size={20} />
              Search Teams to Join
            </h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                placeholder="Search by team name..."
                className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary text-white"
              />
            </div>

            {isSearchingTeams && (
              <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
                <Loader2 className="animate-spin" size={20} />
                Searching teams...
              </div>
            )}

            {!isSearchingTeams && teamsToJoin.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">{teamsToJoin.length} teams found</p>
                <div className="grid grid-cols-1 gap-4">
                  {teamsToJoin.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-secondary/30 transition-colors"
                    >
                      {/* Team Header */}
                      <div className="flex items-start gap-3 mb-4 pb-3 border-b border-white/5">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                          <Users className="text-secondary" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base truncate">{team.team_name}</h4>
                          <p className="text-sm text-secondary truncate">{team.events?.title}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Crown size={12} className="text-yellow-500" />
                              <span>{team.leader?.full_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Users size={12} className="text-gray-400" />
                              <span className={`font-medium ${team.is_full ? 'text-red-400' : 'text-gray-300'}`}>
                                {team.current_members} / {team.max_members}
                              </span>
                              {team.is_full && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[9px] font-bold">
                                  FULL
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendJoinRequest(team.id)}
                          disabled={team.is_full}
                          className="px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          <LogIn size={14} />
                          Request Join
                        </button>
                      </div>

                      {/* Team Leader Details */}
                      <div className="mb-3">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Leader</h5>
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center shrink-0">
                              <Crown className="text-yellow-500" size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs truncate">{team.leader?.full_name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <span className="truncate">{team.leader?.email}</span>
                                {team.leader?.roll_no && (
                                  <>
                                    <span>•</span>
                                    <span>{team.leader.roll_no}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team Members */}
                      {team.members && team.members.length > 0 && (
                        <div>
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Team Members ({team.members.length})
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {team.members.map((member, idx) => (
                              <div
                                key={idx}
                                className="bg-white/5 border border-white/10 rounded-lg p-2.5"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                                    {member.role === 'leader' ? (
                                      <Crown className="text-yellow-500" size={12} />
                                    ) : (
                                      <User className="text-gray-400" size={12} />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-xs truncate">
                                      {member.profiles?.full_name || 'Unknown'}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                      <span className="truncate">{member.profiles?.roll_no || 'N/A'}</span>
                                      {member.profiles?.department && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate">{member.profiles.department}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {member.role === 'leader' && (
                                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[8px] font-bold shrink-0">
                                      LEADER
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isSearchingTeams && teamSearchQuery.length >= 2 && teamsToJoin.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No teams found matching "{teamSearchQuery}"
              </div>
            )}

            {teamSearchQuery.length < 2 && teamSearchQuery.length > 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Type at least 2 characters to search
              </div>
            )}

            {teamSearchQuery.length === 0 && (
              <div className="text-center py-8">
                <Search className="mx-auto text-gray-600 mb-2" size={32} />
                <p className="text-gray-400 text-sm">
                  Start typing to search for teams to join
                </p>
              </div>
            )}
          </div>

          {/* My Join Requests */}
          {myJoinRequests.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Clock className="text-secondary" size={20} />
                My Join Requests ({myJoinRequests.length})
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {myJoinRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`border rounded-xl p-4 ${
                      request.status === 'pending'
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : request.status === 'approved'
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm">{request.teams?.team_name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            request.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : request.status === 'approved'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{request.teams?.events?.title}</p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Leader: {request.teams?.leader?.full_name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleCancelJoinRequest(request.id)}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <X size={12} />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTeams;
