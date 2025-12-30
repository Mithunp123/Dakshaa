import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Mail,
  CheckSquare,
  XCircle,
  ArrowRight,
  UserMinus,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  UserCheck,
  FileText,
  RefreshCw
} from "lucide-react";
import {
  getEventStats,
  getEventParticipants,
  approveCashPayment,
  removeParticipant,
  moveParticipantToEvent,
  splitTeamMember,
  bulkApprovePayments,
  exportEventCSV,
  broadcastEventEmail
} from "../../../services/adminService";

const EventRegistrationManager = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  useEffect(() => {
    filterParticipants();
  }, [searchQuery, statusFilter, participants]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, participantsData] = await Promise.all([
        getEventStats(eventId),
        getEventParticipants(eventId)
      ]);
      setStats(statsData);
      setParticipants(participantsData);
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = participants;

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.college_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mobile?.includes(searchQuery)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.payment_status === statusFilter);
    }

    setFilteredParticipants(filtered);
  };

  const handleApproveCash = async (regId) => {
    try {
      await approveCashPayment(regId);
      await fetchData();
    } catch (error) {
      console.error("Error approving payment:", error);
    }
  };

  const handleRemoveParticipant = async (regId) => {
    if (!confirm("Are you sure you want to remove this participant? This will free up 1 seat.")) return;
    
    try {
      await removeParticipant(regId);
      await fetchData();
    } catch (error) {
      console.error("Error removing participant:", error);
    }
  };

  const handleMoveParticipant = async (newEventId) => {
    try {
      await moveParticipantToEvent(selectedParticipant.reg_id, newEventId);
      setShowMoveModal(false);
      setSelectedParticipant(null);
      await fetchData();
    } catch (error) {
      console.error("Error moving participant:", error);
    }
  };

  const handleSplitTeam = async (regId) => {
    if (!confirm("Remove this member from the team?")) return;
    
    try {
      await splitTeamMember(regId);
      await fetchData();
    } catch (error) {
      console.error("Error splitting team:", error);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRows.size === 0) return;
    
    try {
      await bulkApprovePayments(Array.from(selectedRows));
      setSelectedRows(new Set());
      await fetchData();
    } catch (error) {
      console.error("Error bulk approving:", error);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportEventCSV(eventId, stats?.event_name || "event");
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  const handleBroadcastEmail = async (subject, message) => {
    try {
      await broadcastEventEmail(eventId, subject, message);
      setShowEmailModal(false);
    } catch (error) {
      console.error("Error broadcasting email:", error);
    }
  };

  const toggleTeamExpand = (teamLeaderId) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamLeaderId)) {
      newExpanded.delete(teamLeaderId);
    } else {
      newExpanded.add(teamLeaderId);
    }
    setExpandedTeams(newExpanded);
  };

  const toggleRowSelection = (regId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(regId)) {
      newSelected.delete(regId);
    } else {
      newSelected.add(regId);
    }
    setSelectedRows(newSelected);
  };

  const getTeamMembers = (teamLeaderId) => {
    return participants.filter(p => p.team_leader_id === teamLeaderId && p.reg_id !== teamLeaderId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  const capacityPercentage = stats ? (stats.registered / stats.capacity) * 100 : 0;
  const pendingCount = participants.filter(p => p.payment_status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{stats?.event_name || "Event Manager"}</h1>
            <p className="text-gray-400 text-sm mt-1">Micro-manage participants for this event</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="text-blue-500" size={24} />
            <span className="text-2xl font-bold">{stats?.registered || 0}</span>
          </div>
          <p className="text-sm text-gray-400 mb-2">Capacity</p>
          <div className="w-full bg-white/5 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {stats?.registered || 0} / {stats?.capacity || 0} Seats
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="text-green-500" size={24} />
            <span className="text-2xl font-bold">₹{stats?.revenue || 0}</span>
          </div>
          <p className="text-sm text-gray-400">Revenue</p>
          <p className="text-xs text-gray-500 mt-2">
            Collected from this event
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="text-purple-500" size={24} />
            <span className="text-2xl font-bold">
              {stats?.attended || 0} / {stats?.registered || 0}
            </span>
          </div>
          <p className="text-sm text-gray-400">Attendance</p>
          <p className="text-xs text-gray-500 mt-2">
            Updates live during fest
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="text-orange-500" size={24} />
            <span className="text-2xl font-bold">{pendingCount}</span>
          </div>
          <p className="text-sm text-gray-400">Pending Requests</p>
          <p className="text-xs text-gray-500 mt-2">
            Cash payments awaiting approval
          </p>
        </motion.div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, college, mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-colors"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>

        <button
          onClick={() => setShowEmailModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl transition-colors"
        >
          <Mail size={18} />
          <span>Broadcast Email</span>
        </button>

        {selectedRows.size > 0 && (
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl transition-colors"
          >
            <CheckSquare size={18} />
            <span>Approve {selectedRows.size} Selected</span>
          </button>
        )}
      </div>

      {/* Participants Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-4 font-semibold">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(filteredParticipants.filter(p => p.payment_status === "pending").map(p => p.reg_id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">College</th>
                <th className="text-left p-4 font-semibold">Team</th>
                <th className="text-left p-4 font-semibold">Mobile</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant) => {
                const isLeader = participant.is_team_leader;
                const teamMembers = isLeader ? getTeamMembers(participant.reg_id) : [];
                const isExpanded = expandedTeams.has(participant.reg_id);

                return (
                  <React.Fragment key={participant.reg_id}>
                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        {participant.payment_status === "pending" && (
                          <input
                            type="checkbox"
                            checked={selectedRows.has(participant.reg_id)}
                            onChange={() => toggleRowSelection(participant.reg_id)}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isLeader && teamMembers.length > 0 && (
                            <button
                              onClick={() => toggleTeamExpand(participant.reg_id)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}
                          <span className="font-medium">{participant.full_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{participant.college_name}</td>
                      <td className="p-4">
                        {isLeader ? (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">
                            Leader
                          </span>
                        ) : participant.team_leader_id ? (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">
                            Member
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium">
                            Solo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400">{participant.mobile}</td>
                      <td className="p-4">
                        {participant.payment_status === "paid" ? (
                          <span className="flex items-center gap-2 text-green-500">
                            <CheckCircle2 size={16} />
                            PAID
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-orange-500">
                            <Clock size={16} />
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {participant.payment_status === "pending" && (
                            <button
                              onClick={() => handleApproveCash(participant.reg_id)}
                              className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors"
                              title="Approve Cash Payment"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedParticipant(participant);
                              setShowMoveModal(true);
                            }}
                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
                            title="Move to Another Event"
                          >
                            <ArrowRight size={16} />
                          </button>
                          {participant.team_leader_id && (
                            <button
                              onClick={() => handleSplitTeam(participant.reg_id)}
                              className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors"
                              title="Remove from Team"
                            >
                              <UserMinus size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveParticipant(participant.reg_id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                            title="Remove Participant"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Team Members */}
                    {isExpanded && teamMembers.map((member) => (
                      <tr key={member.reg_id} className="border-b border-white/5 bg-white/[0.02]">
                        <td className="p-4 pl-12"></td>
                        <td className="p-4 pl-12">
                          <span className="text-gray-400">↳ {member.full_name}</span>
                        </td>
                        <td className="p-4 text-gray-500">{member.college_name}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">
                            Member
                          </span>
                        </td>
                        <td className="p-4 text-gray-500">{member.mobile}</td>
                        <td className="p-4">
                          {member.payment_status === "paid" ? (
                            <span className="flex items-center gap-2 text-green-500 text-sm">
                              <CheckCircle2 size={14} />
                              PAID
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-orange-500 text-sm">
                              <Clock size={14} />
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleSplitTeam(member.reg_id)}
                            className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors text-sm"
                            title="Remove from Team"
                          >
                            <UserMinus size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredParticipants.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No participants found</p>
          </div>
        )}
      </div>

      {/* Move Modal */}
      {showMoveModal && (
        <MoveParticipantModal
          participant={selectedParticipant}
          onClose={() => {
            setShowMoveModal(false);
            setSelectedParticipant(null);
          }}
          onMove={handleMoveParticipant}
        />
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <BroadcastEmailModal
          eventName={stats?.event_name}
          participantCount={participants.length}
          onClose={() => setShowEmailModal(false)}
          onSend={handleBroadcastEmail}
        />
      )}
    </div>
  );
};

// Move Participant Modal Component
const MoveParticipantModal = ({ participant, onClose, onMove }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await supabase.from("events").select("*").order("name");
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full"
      >
        <h3 className="text-xl font-bold mb-4">Move Participant</h3>
        <p className="text-gray-400 mb-4">
          Move <span className="text-white font-semibold">{participant?.full_name}</span> to another event
        </p>

        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary mb-6"
        >
          <option value="">Select Event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onMove(selectedEvent)}
            disabled={!selectedEvent}
            className="flex-1 px-4 py-3 bg-secondary hover:bg-secondary/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Move
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Broadcast Email Modal Component
const BroadcastEmailModal = ({ eventName, participantCount, onClose, onSend }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-2xl w-full"
      >
        <h3 className="text-xl font-bold mb-4">Broadcast Email</h3>
        <p className="text-gray-400 mb-6">
          Send email to all <span className="text-secondary font-semibold">{participantCount} participants</span> of {eventName}
        </p>

        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Email Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
          />
          <textarea
            placeholder="Email Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(subject, message)}
            disabled={!subject || !message}
            className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Email
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EventRegistrationManager;
