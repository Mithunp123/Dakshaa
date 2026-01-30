import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  UserPlus, 
  UserMinus, 
  Search, 
  Crown,
  Mail,
  User,
  Trash2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { supabase } from "../../../supabase";
import { 
  addTeamMember, 
  removeTeamMember, 
  searchUsersForTeam,
  updateTeam,
  deleteTeam
} from "../../../services/teamService";

const ManageTeamModal = ({ isOpen, onClose, team, onTeamUpdated }) => {
  const [activeTab, setActiveTab] = useState("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [teamName, setTeamName] = useState(team?.name || "");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (isOpen && team) {
      setTeamName(team.name);
      getCurrentUser();
    }
  }, [isOpen, team]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id);
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    
    setIsSearching(true);
    const result = await searchUsersForTeam(searchQuery);
    
    if (result.success) {
      // Filter out users already in team
      const memberIds = team.members.map(m => m.id);
      const filtered = result.data.filter(user => !memberIds.includes(user.id));
      setSearchResults(filtered);
    }
    setIsSearching(false);
  };

  const handleAddMember = async (userId) => {
    if (team.members.length >= team.events?.max_team_size) {
      alert("Team is full!");
      return;
    }

    setIsLoading(true);
    const result = await addTeamMember(team.id, userId);
    
    if (result.success) {
      alert("Member added successfully!");
      setSearchQuery("");
      setSearchResults([]);
      onTeamUpdated();
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsLoading(false);
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Remove this member from the team?")) return;

    setIsLoading(true);
    const result = await removeTeamMember(team.id, userId);
    
    if (result.success) {
      alert("Member removed successfully!");
      onTeamUpdated();
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsLoading(false);
  };

  const handleUpdateTeam = async () => {
    if (!teamName.trim()) {
      alert("Team name cannot be empty!");
      return;
    }

    setIsLoading(true);
    const result = await updateTeam(team.id, { name: teamName });
    
    if (result.success) {
      alert("Team updated successfully!");
      onTeamUpdated();
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsLoading(false);
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to disband this team? This action cannot be undone.")) return;

    setIsLoading(true);
    const result = await deleteTeam(team.id);
    
    if (result.success) {
      alert("Team disbanded successfully!");
      onClose();
      onTeamUpdated();
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsLoading(false);
  };

  if (!isOpen || !team) return null;

  const isLeader = team.role === "lead" || team.leader_id === currentUserId;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] border border-white/20 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h2 className="text-2xl font-bold">Add</h2>
              <p className="text-gray-400 text-sm mt-1">{team.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-white/[0.02]">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "members"
                  ? "text-secondary border-b-2 border-secondary"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Members ({team.members.length}/{team.events?.max_team_size})
            </button>
            {isLeader && (
              <>
                <button
                  onClick={() => setActiveTab("add")}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === "add"
                      ? "text-secondary border-b-2 border-secondary"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Add Members
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === "settings"
                      ? "text-secondary border-b-2 border-secondary"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Settings
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        {member.role === "lead" ? (
                          <Crown className="text-yellow-500" size={20} />
                        ) : (
                          <User className="text-gray-400" size={20} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{member.name}</p>
                          {member.role === "lead" && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full font-semibold">
                              Leader
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{member.email}</p>
                        {member.roll_no !== "N/A" && (
                          <p className="text-xs text-gray-500">{member.roll_no} • {member.department}</p>
                        )}
                      </div>
                    </div>

                    {isLeader && member.role !== "lead" && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Members Tab */}
            {activeTab === "add" && isLeader && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="text-blue-500 shrink-0" size={20} />
                  <div className="text-sm">
                    <p className="text-blue-500 font-semibold">Search for users</p>
                    <p className="text-gray-400 mt-1">
                      Search by name, email, or roll number. Users must be registered on the platform.
                    </p>
                  </div>
                </div>

                {/* Search */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search users..."
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary text-white"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || searchQuery.trim().length < 2}
                    className="px-6 py-3 bg-secondary hover:bg-secondary-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : "Search"}
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">{searchResults.length} users found</p>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <User className="text-gray-400" size={18} />
                          </div>
                          <div>
                            <p className="font-bold">{user.full_name}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                            {user.roll_no && (
                              <p className="text-xs text-gray-500">{user.roll_no} • {user.department}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMember(user.id)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <UserPlus size={16} />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-8 text-gray-500">
                    No users found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && isLeader && (
              <div className="space-y-6">
                {/* Update Team Name */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-400">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary text-white"
                  />
                  <button
                    onClick={handleUpdateTeam}
                    disabled={isLoading || teamName === team.name}
                    className="w-full py-3 bg-secondary hover:bg-secondary-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Update Team Name"}
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="text-red-500 font-bold flex items-center gap-2">
                      <AlertCircle size={20} />
                      Danger Zone
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Disbanding the team will remove all members and cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteTeam}
                    disabled={isLoading}
                    className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Disband Team
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ManageTeamModal;
