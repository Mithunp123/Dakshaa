import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  User,
  Mail,
  Phone,
  GraduationCap,
  CheckCircle,
  Clock,
  AlertCircle,
  X
} from "lucide-react";
import { supabase } from "../../supabase";
import { API_BASE_URL } from "../../config/api";

const TeamDetailsView = ({ eventId, eventName, onClose, showHeader = true, paymentFilter = 'all' }) => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Filter teams based on payment status
  useEffect(() => {
    if (paymentFilter === 'all') {
      setFilteredTeams(teams);
    } else {
      const filtered = teams.filter(team => team.payment_status === paymentFilter);
      setFilteredTeams(filtered);
    }
  }, [teams, paymentFilter]);

  // Fetch teams for this event
  const fetchEventTeams = async () => {
    try {
      setLoading(true);
      
      // Get current user to pass for role-based filtering
      const { data: { user } } = await supabase.auth.getUser();
      
      const params = new URLSearchParams({
        event_id: eventId,
        user_id: user?.id,
        limit: '100'
      });
      
      const response = await fetch(`${API_BASE_URL}/api/admin/teams?${params}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('🏆 Fetched teams for event:', eventId, 'Count:', result.data?.length);
        setTeams(result.data || []);
      } else {
        console.error('❌ Error fetching teams:', result.error);
        setTeams([]);
      }
    } catch (error) {
      console.error("❌ Error fetching teams:", error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async (teamId) => {
    try {
      const params = new URLSearchParams({ event_id: eventId });
      const response = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}/members?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedTeamMembers(result.data);
        setShowMembersModal(true);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventTeams();
    }
  }, [eventId]);

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

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-white text-sm">Loading teams...</span>
        </div>
      </div>
    );
  }

  if (filteredTeams.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
        <div className="text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No {paymentFilter !== 'all' ? paymentFilter.toLowerCase() : ''} teams found for this event</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{eventName}</h3>
              <p className="text-sm text-gray-400">
                {filteredTeams.length} {paymentFilter !== 'all' ? paymentFilter.toLowerCase() : ''} Teams Registered
                {paymentFilter !== 'all' && teams.length !== filteredTeams.length && (
                  <span className="text-gray-500"> (of {teams.length} total)</span>
                )}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Teams Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                S.NO
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Team & Leader
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Leader Payment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Members
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            <AnimatePresence>
              {filteredTeams.map((team, index) => (
                <motion.tr
                  key={team.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white font-medium">{index + 1}</span>
                  </td>
                  
                  {/* Team & Leader - Leader name on top, team name below */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-white font-bold text-sm">
                          {team.leader_name || 'Unknown Leader'}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {team.name || 'Unnamed Team'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Leader Payment - Just show PAID badge, no amount */}
                  <td className="px-4 py-3">
                    {team.payment_status === 'PAID' || team.is_active ? (
                      <span className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">
                        PAID
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                        PENDING
                      </span>
                    )}
                  </td>
                  
                  {/* Members - Show all team members with (member) label */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {team.members_list && team.members_list.length > 0 ? (
                        team.members_list
                          .filter(m => m.role !== 'leader')
                          .map((member, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="text-cyan-400">{member.full_name || 'Unknown'}</span>
                              <span className="text-gray-500 ml-1">(member)</span>
                            </div>
                          ))
                      ) : team.member_names ? (
                        team.member_names.split(', ').map((name, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="text-cyan-400">{name.replace(' (member)', '')}</span>
                            <span className="text-gray-500 ml-1">(member)</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No members</span>
                      )}
                    </div>
                  </td>
                  
                  {/* Created Date */}
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">
                      {new Date(team.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }).replace(',', '')}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Team Members Modal */}
      <AnimatePresence>
        {showMembersModal && selectedTeamMembers && (
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
              className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[70vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Team Members</h3>
                  <button
                    onClick={() => setShowMembersModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTeamMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-800/30 rounded-lg p-3 border border-gray-700"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {member.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium">{member.full_name}</h4>
                          {member.role === 'leader' && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                              Leader
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs">
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
                          <div className="flex items-center gap-2 text-gray-400">
                            <GraduationCap className="w-3 h-3" />
                            <span className="truncate">{member.college_name}</span>
                          </div>
                        )}
                        {member.payment_status && (
                          <div className="pt-1">
                            {getPaymentStatusBadge(member.payment_status, member.payment_amount)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {selectedTeamMembers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
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

export default TeamDetailsView;