import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Eye, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Download,
  Crown,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
  Mail,
  Phone,
  X,
  Shield,
  AlertTriangle
} from "lucide-react";
import { getCurrentUserProfile } from "../../utils/userUtils";
import toast from "react-hot-toast";

const TeamManagementTable = ({ eventId = null, onlyPaid = false }) => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [statistics, setStatistics] = useState({
    team_count: 0,
    paid_team_count: 0,
    leader_count: 0,
    member_count: 0,
    total_revenue: 0
  });

  // Get current user profile and role
  const fetchUserProfile = async () => {
    try {
      const result = await getCurrentUserProfile();
      if (result.success) {
        setUserProfile(result.data);
        setUserRole(result.data.role?.toLowerCase());
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Fetch teams data
  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '100',
        offset: '0',
        only_paid: onlyPaid.toString()
      });
      
      if (eventId) {
        params.append('event_id', eventId);
      }
      
      // Add user_id for role-based filtering
      if (userProfile?.id) {
        params.append('user_id', userProfile.id);
      }
      
      const response = await fetch(`http://localhost:3000/api/admin/teams?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setTeams(result.data);
        setFilteredTeams(result.data);
      } else {
        toast.error(result.error || "Failed to fetch teams");
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch team statistics
  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams();
      if (eventId) {
        params.append('event_id', eventId);
      }
      
      // Add user_id for role-based statistics
      if (userProfile?.id) {
        params.append('user_id', userProfile.id);
      }
      
      const response = await fetch(`http://localhost:3000/api/admin/teams/statistics?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async (teamId) => {
    try {
      const params = new URLSearchParams();
      if (eventId) {
        params.append('event_id', eventId);
      }
      
      const response = await fetch(`http://localhost:3000/api/admin/teams/${teamId}/members?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setTeamMembers(result.data);
        setShowMembersModal(true);
      } else {
        toast.error("Failed to fetch team members");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
    }
  };

  // Filter teams based on search and payment status
  const filterTeams = () => {
    let filtered = teams;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(team => 
        team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.leader_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.event_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(team => {
        if (paymentFilter === "paid") return team.payment_status === "PAID";
        if (paymentFilter === "pending") return team.payment_status === "PENDING";
        if (paymentFilter === "partial") return team.payment_status === "PARTIAL";
        return true;
      });
    }

    setFilteredTeams(filtered);
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchTeams();
      fetchStatistics();
    }
  }, [eventId, onlyPaid, userProfile]);

  useEffect(() => {
    filterTeams();
  }, [searchQuery, paymentFilter, teams]);

  // Get payment status badge
  const getPaymentStatusBadge = (status, amount) => {
    const badges = {
      PAID: { 
        color: "bg-green-500/20 text-green-400 border-green-500/30", 
        icon: CheckCircle, 
        text: "PAID" 
      },
      PENDING: { 
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", 
        icon: Clock, 
        text: "PENDING" 
      },
      PARTIAL: { 
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30", 
        icon: AlertCircle, 
        text: "PARTIAL" 
      }
    };

    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
          <Icon className="w-3 h-3" />
          {badge.text}
        </span>
        {amount > 0 && (
          <span className="text-xs text-gray-400">₹{amount}</span>
        )}
      </div>
    );
  };

  // Export teams data
  const exportTeamsData = () => {
    const csvData = filteredTeams.map(team => ({
      'Team Name': team.name,
      'Leader': team.leader_name,
      'Members': team.member_count,
      'Event': team.event_name,
      'Payment Status': team.payment_status,
      'Amount': team.payment_amount,
      'Created': new Date(team.created_at).toLocaleDateString()
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams_${eventId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-white">Loading teams...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden">
      {/* Header with Statistics */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">Team Management</h2>
              {userRole && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded-full">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-cyan-400 capitalize">
                    {userRole.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="text-gray-400">
                Total Teams: <span className="text-white font-medium">{statistics.team_count}</span>
              </div>
              <div className="text-gray-400">
                Paid Teams: <span className="text-green-400 font-medium">{statistics.paid_team_count}</span>
              </div>
              <div className="text-gray-400">
                Total Members: <span className="text-white font-medium">{statistics.member_count}</span>
              </div>
              <div className="text-gray-400">
                {statistics.user_role === 'event_coordinator' ? 'Assigned Events' : 'Active Events'}: 
                <span className="text-indigo-400 font-medium"> {statistics.assigned_events_count || 0}</span>
              </div>
              <div className="text-gray-400">
                Revenue: <span className="text-cyan-400 font-medium">₹{statistics.total_revenue}</span>
              </div>
              {userRole === 'event_coordinator' && (
                <div className="text-yellow-400 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Showing events you coordinate
                </div>
              )}
            </div>
          </div>

          <button
            onClick={exportTeamsData}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-800 bg-gray-800/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search teams, leaders, or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="all">All Teams</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teams Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                S.NO
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Team & Event
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Team & Leader
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Leader Payment
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            <AnimatePresence>
              {filteredTeams.map((team, index) => (
                <motion.tr
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white font-medium">{index + 1}</span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{team.name}</div>
                        <div className="text-gray-400 text-sm">{team.event_name}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      {/* Leader Display */}
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-medium">{team.leader_name || 'Unknown Leader'}</span>
                      </div>
                      {team.leader_display && (
                        <div className="text-xs text-gray-400">{team.leader_display}</div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {getPaymentStatusBadge(team.payment_status, team.payment_amount)}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{team.members_list?.length || 0} members</span>
                      </div>
                      {/* Show member names like in reference image */}
                      {team.member_names && (
                        <div className="text-xs text-gray-400 max-w-xs" title={team.member_names}>
                          {team.member_names.length > 50 ? team.member_names.substring(0, 50) + '...' : team.member_names}
                        </div>
                      )}
                      {!team.member_names && team.members_list && team.members_list.length > 0 && (
                        <div className="text-xs text-gray-400 max-w-xs">
                          {team.members_list
                            .filter(m => m.role !== 'leader')
                            .map(m => `${m.full_name} (member)`)
                            .join(', ')
                            .substring(0, 50)}...
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTeam(team);
                          fetchTeamMembers(team.id);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors mt-1 text-xs"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className="text-gray-400 text-sm">
                      {new Date(team.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedTeam(team);
                          fetchTeamMembers(team.id);
                        }}
                        className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Handle edit team
                          toast.success("Edit functionality coming soon!");
                        }}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit Team"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Handle delete team
                          if (window.confirm("Are you sure you want to delete this team?")) {
                            toast.success("Delete functionality coming soon!");
                          }
                        }}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No teams found matching your criteria</p>
        </div>
      )}

      {/* Team Members Modal */}
      <AnimatePresence>
        {showMembersModal && selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowMembersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedTeam.name}</h3>
                    <p className="text-gray-400">{selectedTeam.event_name}</p>
                  </div>
                  <button
                    onClick={() => setShowMembersModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {member.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{member.full_name}</h4>
                          {member.role === 'leader' && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                              Leader
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {member.email && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.mobile_number && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span>{member.mobile_number}</span>
                          </div>
                        )}
                        {member.college_name && (
                          <div className="text-gray-400">
                            <span className="truncate">{member.college_name}</span>
                          </div>
                        )}
                        {member.payment_status && (
                          <div className="pt-2">
                            {getPaymentStatusBadge(member.payment_status, member.payment_amount)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {teamMembers.length === 0 && (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No members found for this team</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamManagementTable;