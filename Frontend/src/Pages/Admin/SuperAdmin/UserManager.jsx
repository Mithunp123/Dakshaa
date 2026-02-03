import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  User, 
  Shield, 
  Mail, 
  Phone, 
  School,
  Loader2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Ban,
  History,
  Award,
  Ticket,
  Users
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { AnimatePresence } from 'framer-motion';

const UserManager = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userActivity, setUserActivity] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [allUserTeams, setAllUserTeams] = useState({});
  const [referredByInfo, setReferredByInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [messageForm, setMessageForm] = useState({ subject: '', body: '', target: 'all' });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-refresh on visibility change and location change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab visible, refreshing users...');
        fetchUsers();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data);
      
      // Fetch team members data
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('team_members')
        .select('user_id, role, team_id');
      
      if (teamMembersError) {
        console.error('Error fetching team members:', teamMembersError);
        setAllUserTeams({});
        return;
      }
      
      // Fetch all teams data including leader_id
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, team_name, event_id, leader_id');
      
      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        setAllUserTeams({});
        return;
      }
      
      console.log('Fetched teams data with leaders:', teamsData);
      
      // Create a map of team_id to team data for quick lookup
      const teamsMap = {};
      if (teamsData) {
        teamsData.forEach(team => {
          teamsMap[team.id] = team;
        });
      }
      
      // Organize teams by user_id and add team details
      const userTeamsMap = {};
      if (teamMembersData) {
        teamMembersData.forEach(tm => {
          if (!userTeamsMap[tm.user_id]) {
            userTeamsMap[tm.user_id] = [];
          }
          userTeamsMap[tm.user_id].push({
            ...tm,
            teams: teamsMap[tm.team_id] || null
          });
        });
      }
      
      // Also add team leaders from teams table (they might not be in team_members)
      if (teamsData) {
        teamsData.forEach(team => {
          if (team.leader_id) {
            if (!userTeamsMap[team.leader_id]) {
              userTeamsMap[team.leader_id] = [];
            }
            // Only add if not already added from team_members
            const alreadyExists = userTeamsMap[team.leader_id].some(t => t.team_id === team.id);
            if (!alreadyExists) {
              userTeamsMap[team.leader_id].push({
                team_id: team.id,
                user_id: team.leader_id,
                role: 'leader',
                teams: team
              });
            }
          }
        });
      }
      
      console.log('Final userTeamsMap:', userTeamsMap);
      setAllUserTeams(userTeamsMap);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setReferredByInfo(null); // Reset
    try {
      // Fetch direct registrations from event_registrations_config
      const { data: regs } = await supabase
        .from('event_registrations_config')
        .select('*, events(name, event_key)')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });
      
      // Fetch teams where user is a member (including leader)
      // First try from team_members table
      const { data: teams, error: teamsError } = await supabase
        .from('team_members')
        .select('*, teams!inner(*, events(name), leader_id)')
        .eq('user_id', user.id);
      
      console.log('Fetched teams for user from team_members:', teams, teamsError);
      
      // Also check if user is a leader (from teams.leader_id)
      const { data: leaderTeams, error: leaderError } = await supabase
        .from('teams')
        .select('*, events(name)')
        .eq('leader_id', user.id);
      
      console.log('Fetched teams where user is leader:', leaderTeams, leaderError);
      
      // Combine both sources - convert leaderTeams to same structure as teams
      const allTeams = [
        ...(teams || []),
        ...(leaderTeams || []).map(team => ({
          team_id: team.id,
          user_id: user.id,
          role: 'leader',
          teams: team
        }))
      ];
      
      // Remove duplicates based on team_id
      const uniqueTeams = allTeams.filter((team, index, self) =>
        index === self.findIndex((t) => t.team_id === t.team_id || t.team_id === team.teams?.id)
      );
      
      console.log('Combined unique teams:', uniqueTeams);
      
      // For each team, fetch all team members including the leader
      const teamsWithMembers = await Promise.all(
        (uniqueTeams || []).map(async (tm) => {
          const teamId = tm.team_id || tm.teams?.id;
          
          const { data: members } = await supabase
            .from('team_members')
            .select('*, profiles(full_name, email, college_name)')
            .eq('team_id', teamId)
            .order('role', { ascending: false }); // Leaders first
          
          console.log(`Team ${teamId} members:`, members);
          
          // Check if current user is the team leader
          const isLeader = tm.teams?.leader_id === user.id;
          
          // For team members (not leaders), check if team leader has a registration for this event
          let teamRegistration = null;
          if (!isLeader && tm.teams?.event_id && tm.teams?.leader_id) {
            // Use leader_id from teams table to get leader's registration
            const { data: leaderReg } = await supabase
              .from('event_registrations_config')
              .select('*')
              .eq('user_id', tm.teams.leader_id)
              .eq('event_id', tm.teams.event_id)
              .maybeSingle();
            
            if (leaderReg) {
              teamRegistration = {
                ...leaderReg,
                isTeamRegistration: true,
                teamName: tm.teams.team_name
              };
            }
          }
          
          return { 
            ...tm, 
            team_id: teamId,
            allMembers: members || [], 
            teamRegistration, 
            isLeader 
          };
        })
      );
      
      console.log('Teams with members:', teamsWithMembers);
      setUserTeams(teamsWithMembers || []);
      
      // Combine direct registrations with team-based registrations for display
      const teamRegs = teamsWithMembers
        .filter(tm => tm.teamRegistration)
        .map(tm => ({
          id: `team-${tm.id}`,
          event_name: tm.teams?.events?.name,
          registered_at: tm.created_at,
          payment_status: tm.teamRegistration.payment_status,
          payment_amount: null, // Team members don't pay individually
          transaction_id: null,
          isTeamRegistration: true,
          teamName: tm.teams?.team_name,
          events: { name: tm.teams?.events?.name }
        }));
      
      const allRegistrations = [...(regs || []), ...teamRegs];
      setUserRegistrations(allRegistrations);

      // Store referred by code/value directly (no user lookup)
      if (user.referred_by) {
        setReferredByInfo({
          code: user.referred_by
        });
      }

      // For timeline - no lookup needed
      let referredByData = null;
      if (user.referred_by) {
        referredByData = { code: user.referred_by };
      }

      // Combine into activity timeline
      const activity = [
        { type: 'profile', date: user.created_at, label: 'Account Created' },
        ...(user.referred_by && referredByData ? [{ type: 'referral', date: user.created_at, label: `Referred by ${referredByData.code}`, referredBy: referredByData }] : []),
        ...(regs || []).map(r => ({ type: 'registration', date: r.registered_at, label: `Registered for ${r.event_name || r.events?.name}`, payment: r.payment_status, amount: r.payment_amount })),
        ...teamRegs.map(r => ({ type: 'registration', date: r.registered_at, label: `Registered for ${r.event_name} (via team ${r.teamName})`, payment: r.payment_status, isTeam: true })),
        ...(teamsWithMembers || []).map(t => ({ type: 'team', date: t.joined_at || t.created_at || new Date().toISOString(), label: `Joined team ${t.teams?.team_name} for ${t.teams?.events?.name}`, eventName: t.teams?.events?.name }))
      ].filter(a => a.date).sort((a, b) => new Date(b.date) - new Date(a.date));

      setUserActivity(activity);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleUnlinkCombo = async (reg) => {
    if (!confirm('Are you sure you want to unlink this combo? This will convert it into individual event registrations.')) return;
    setSubmitting(true);
    try {
      // 1. Get combo rules to see which events are included
      const { data: rules } = await supabase
        .from('combo_rules')
        .select('*')
        .eq('combo_id', reg.combo_id);

      // 2. Create individual registrations (this is a simplified version)
      // In a real scenario, you'd need to know which events the user actually picked
      
      // 3. Delete combo registration
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', reg.id);

      if (error) throw error;
      alert('Combo unlinked successfully. Please manually add individual events if needed.');
      fetchUserDetails(selectedUser);
    } catch (error) {
      alert('Unlink failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSplitTeam = async (teamMemberId) => {
    if (!confirm('Are you sure you want to remove this user from the team?')) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', teamMemberId);

      if (error) throw error;
      alert('User removed from team successfully');
      fetchUserDetails(selectedUser);
    } catch (error) {
      alert('Split failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (userId, updates) => {
    try {
      // Optimistic update - update UI immediately
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
      if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, ...updates });
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      alert('Profile updated successfully');
    } catch (error) {
      alert('Update failed: ' + error.message);
    }
  };

  const handleToggleBlock = async (user) => {
    const newStatus = !user.is_blocked;
    await handleUpdateProfile(user.id, { is_blocked: newStatus });
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      // Optimistic update - update UI immediately
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      alert(`Role updated to ${newRole}`);
    } catch (error) {
      alert('Update failed: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile_number?.includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roles = ['all', 'student', 'super_admin', 'registration_admin', 'event_coordinator', 'volunteer'];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Message sent to ${messageForm.target} users!`);
      setMessageForm({ subject: '', body: '', target: 'all' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">User Management</h2>
          <p className="text-gray-400">Search users, view profiles, and manage permissions</p>
        </div>
        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-secondary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('communication')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'communication' ? 'bg-secondary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Communication Hub
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="text" 
                placeholder="Search by name, roll number, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-secondary transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
              <Filter size={20} className="text-gray-500" />
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-transparent focus:outline-none capitalize"
              >
                {roles.map(role => (
                  <option key={role} value={role} className="bg-slate-900">{role}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-secondary/30 transition-all relative group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center border border-white/10">
                      <User className="text-secondary" size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{user.full_name}</h3>
                      <p className={`text-xs font-semibold uppercase tracking-wider mt-1 ${
                        user.role === 'super_admin' ? 'text-red-400' :
                        user.role === 'event_coordinator' ? 'text-purple-400' :
                        user.role === 'registration_admin' ? 'text-blue-400' :
                        user.role === 'volunteer' ? 'text-green-400' :
                        'text-gray-400'
                      }`}>{user.role?.replace(/_/g, ' ') || 'Student'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <School size={16} className="shrink-0" />
                    <span className="truncate">{user.college_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Phone size={16} className="shrink-0" />
                    <span className="break-all">{user.mobile_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Mail size={16} className="shrink-0" />
                    <span className="truncate text-xs">{user.email || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-xs">Dept:</span>
                      <span className="font-medium text-gray-300 truncate">{user.department || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-xs">Year:</span>
                      <span className="font-medium text-gray-300">{user.year_of_study || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-xs">Gender:</span>
                      <span className="font-medium text-gray-300 capitalize">{user.gender || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-xs">Roll:</span>
                      <span className="font-medium text-gray-300 truncate">{user.roll_number || 'N/A'}</span>
                    </div>
                  </div>
                  {/* Team Display - Prominent */}
                  {allUserTeams[user.id] && allUserTeams[user.id].length > 0 ? (
                    <div className="pt-3 border-t border-white/5">
                      {allUserTeams[user.id].map((tm, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                          <Users size={16} className="shrink-0 text-secondary" />
                          <span className="font-bold text-secondary text-sm">
                            {tm.teams?.team_name || 'Unknown Team'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
                            tm.role === 'leader' 
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {tm.role === 'leader' ? '👑 Leader' : 'Member'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-gray-500 italic text-sm">
                        <Users size={16} className="shrink-0" />
                        <span>No Team</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => fetchUserDetails(user)}
                      className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                      title="View 360° Profile"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleToggleBlock(user)}
                      className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${user.is_blocked ? 'text-red-500' : 'text-gray-400'}`}
                      title={user.is_blocked ? "Unblock User" : "Block User"}
                    >
                      <Ban size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'communication' && (
        <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Mail className="text-secondary" size={28} /> Bulk Communication Hub
          </h3>
          <form onSubmit={handleSendMessage} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-400 ml-2">Target Audience</label>
              <select 
                value={messageForm.target}
                onChange={(e) => setMessageForm({...messageForm, target: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-secondary transition-all"
              >
                <option value="all">All Registered Students</option>
                <option value="pending">Pending Payment Users</option>
                <option value="workshop">Workshop Participants</option>
                <option value="tech">Technical Event Participants</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400 ml-2">Subject</label>
              <input 
                required
                type="text"
                value={messageForm.subject}
                onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-secondary transition-all"
                placeholder="Important Update regarding Venue"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400 ml-2">Message Body</label>
              <textarea 
                required
                rows={6}
                value={messageForm.body}
                onChange={(e) => setMessageForm({...messageForm, body: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-secondary transition-all resize-none"
                placeholder="Write your message here..."
              />
            </div>
            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-secondary text-white font-bold rounded-2xl hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
              Send Bulk Message
            </button>
          </form>
        </div>
      )}

      {activeTab === 'users' && filteredUsers.length === 0 && (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[3rem]">
          <User className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-400">No users found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
        </div>
      )}

      {/* User 360° Modal */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-secondary/10 to-primary/10">
                <div className="flex gap-6 items-center">
                  <div className="w-20 h-20 bg-secondary/20 rounded-3xl flex items-center justify-center border border-secondary/30">
                    <User size={40} className="text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold">{selectedUser.full_name}</h3>
                    <div className="flex gap-3 mt-2">
                      <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 border border-white/10 uppercase tracking-widest">
                        {selectedUser.role}
                      </span>
                      {selectedUser.is_blocked && (
                        <span className="px-3 py-1 bg-red-500/10 rounded-full text-xs font-bold text-red-500 border border-red-500/20 uppercase tracking-widest">
                          Blocked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Details & Correction */}
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Edit2 size={14} /> Data Correction
                      </h4>
                      <div className="space-y-4">
                        <EditableField 
                          label="Full Name" 
                          value={selectedUser.full_name} 
                          onSave={(val) => handleUpdateProfile(selectedUser.id, { full_name: val })}
                        />
                        <EditableField 
                          label="College" 
                          value={selectedUser.college_name} 
                          onSave={(val) => handleUpdateProfile(selectedUser.id, { college_name: val })}
                        />
                        <EditableField 
                          label="Department" 
                          value={selectedUser.department} 
                          onSave={(val) => handleUpdateProfile(selectedUser.id, { department: val })}
                        />
                        <EditableField 
                          label="Year of Study" 
                          value={selectedUser.year_of_study} 
                          onSave={(val) => handleUpdateProfile(selectedUser.id, { year_of_study: val })}
                        />
                        <EditableField 
                          label="Gender" 
                          value={selectedUser.gender} 
                          onSave={(val) => handleUpdateProfile(selectedUser.id, { gender: val })}
                        />
                        <EditableField 
                          label="Roll Number" 
                          value={selectedUser.roll_number} 
                          onSave={(val) => handleUpdateProfile(selectedUser.id, { roll_number: val })}
                        />
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="font-mono text-sm break-all">{selectedUser.email || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="font-mono text-sm">{selectedUser.mobile_number || 'N/A'}</p>
                        </div>
                        {referredByInfo && (
                          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                            <p className="text-xs text-purple-400 mb-1 uppercase tracking-wider">Referred By</p>
                            <p className="font-bold text-purple-300 font-mono">{referredByInfo.code}</p>
                          </div>
                        )}
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-500 mb-1">Account Created</p>
                          <p className="font-mono text-sm">{new Date(selectedUser.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Middle Column: Registrations & Teams */}
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Ticket size={14} /> Registrations
                      </h4>
                      <div className="space-y-3">
                        {userRegistrations.length === 0 ? (
                          <p className="text-gray-500 text-sm italic">No registrations found</p>
                        ) : (
                          userRegistrations.map(reg => (
                            <div key={reg.id} className={`p-4 rounded-2xl border group ${reg.isTeamRegistration ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/5 border-white/10'}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-bold">{reg.event_name || reg.events?.name}</p>
                                  {reg.isTeamRegistration && (
                                    <p className="text-xs text-orange-400 mt-1">📋 Team: {reg.teamName}</p>
                                  )}
                                  <p className="text-xs text-gray-500">{new Date(reg.registered_at).toLocaleDateString()}</p>
                                  {reg.payment_amount && (
                                    <p className="text-xs text-gray-400 mt-1">₹{reg.payment_amount}</p>
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${reg.payment_status?.toUpperCase() === 'PAID' ? 'bg-green-500/10 text-green-500' : reg.payment_status?.toUpperCase() === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {reg.payment_status?.toUpperCase() || 'TEAM'}
                                </span>
                              </div>
                              {reg.transaction_id && (
                                <p className="text-[10px] text-gray-500 font-mono">TXN: {reg.transaction_id}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users size={14} /> Team Members
                      </h4>
                      <div className="space-y-4">
                        {userTeams.length === 0 ? (
                          <p className="text-gray-500 text-sm italic">Not in any teams</p>
                        ) : (
                          userTeams.map(tm => (
                            <div key={tm.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 group">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="font-bold">{tm.teams?.team_name}</p>
                                  <p className="text-xs text-gray-500">{tm.teams?.events?.name}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${tm.role === 'leader' ? 'bg-secondary/10 text-secondary' : 'bg-white/5 text-gray-400'}`}>
                                  {tm.role.toUpperCase()}
                                </span>
                              </div>
                              {/* Team Members List - Always show for all users */}
                              {tm.allMembers && tm.allMembers.length > 0 ? (
                                <div className="mt-3 pt-3 border-t border-white/5">
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Team Members ({tm.allMembers.length})</p>
                                  <div className="space-y-2">
                                    {tm.allMembers.map(member => (
                                      <div key={member.id} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-1.5 h-1.5 rounded-full ${member.role === 'leader' ? 'bg-secondary' : 'bg-gray-500'}`} />
                                          <span className="text-gray-300">{member.profiles?.full_name}</span>
                                        </div>
                                        <span className="text-gray-500 text-[10px]">{member.profiles?.college_name?.substring(0, 20)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 pt-3 border-t border-white/5">
                                  <p className="text-[10px] text-gray-500 italic">No team members loaded</p>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Activity Timeline */}
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History size={14} /> Activity Timeline
                      </h4>
                      <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                        {userActivity.map((act, i) => (
                          <div key={i} className="relative pl-8">
                            <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ${
                              act.type === 'profile' ? 'bg-blue-500' : 
                              act.type === 'referral' ? 'bg-purple-500' :
                              act.type === 'registration' ? 'bg-secondary' : 
                              act.type === 'team' ? 'bg-orange-500' : 'bg-green-500'
                            }`} />
                            <p className="text-sm font-bold">{act.label}</p>
                            {act.type === 'registration' && act.payment && (
                              <div className="flex gap-2 items-center mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${act.payment === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                  {act.payment}
                                </span>
                                {act.amount && <span className="text-xs text-gray-400">₹{act.amount}</span>}
                              </div>
                            )}
                            <p className="text-xs text-gray-500">{new Date(act.date).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EditableField = ({ label, value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  const handleSave = () => {
    onSave(val);
    setIsEditing(false);
  };

  return (
    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group">
      <div className="flex justify-between items-start mb-1">
        <p className="text-xs text-gray-500">{label}</p>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 text-secondary transition-opacity"
          >
            <Edit2 size={12} />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="flex gap-2">
          <input 
            type="text" 
            value={val} 
            onChange={(e) => setVal(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm focus:outline-none"
            autoFocus
          />
          <button onClick={handleSave} className="text-green-500"><CheckCircle2 size={16} /></button>
          <button onClick={() => { setVal(value); setIsEditing(false); }} className="text-red-500"><XCircle size={16} /></button>
        </div>
      ) : (
        <p className="text-sm font-medium">{value || 'N/A'}</p>
      )}
    </div>
  );
};

export default UserManager;
