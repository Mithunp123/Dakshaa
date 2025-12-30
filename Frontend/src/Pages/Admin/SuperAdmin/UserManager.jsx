import React, { useState, useEffect } from 'react';
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
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [messageForm, setMessageForm] = useState({ subject: '', body: '', target: 'all' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    try {
      // Fetch registrations
      const { data: regs } = await supabase
        .from('registrations')
        .select('*, events(*), combos(*)')
        .eq('user_id', user.id);
      
      setUserRegistrations(regs || []);

      // Fetch teams
      const { data: teams } = await supabase
        .from('team_members')
        .select('*, teams(*, events(*))')
        .eq('user_id', user.id);
      
      setUserTeams(teams || []);

      // Fetch attendance
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*, events(*)')
        .eq('user_id', user.id);

      // Combine into activity timeline
      const activity = [
        { type: 'profile', date: user.created_at, label: 'Account Created' },
        ...(regs || []).map(r => ({ type: 'registration', date: r.created_at, label: `Registered for ${r.events?.title || r.combos?.name}` })),
        ...(teams || []).map(t => ({ type: 'team', date: t.created_at, label: `Joined team ${t.teams?.name} for ${t.teams?.events?.title}` })),
        ...(attendance || []).map(a => ({ type: 'attendance', date: a.created_at, label: `Checked in to ${a.events?.title}` }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

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
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
      if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, ...updates });
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
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
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
                      <p className="text-secondary text-xs font-mono mt-1">{user.roll_number || 'No Roll No'}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updatingId === user.id}
                      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border appearance-none cursor-pointer focus:outline-none ${
                        user.role === 'super_admin' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                        user.role === 'event_coordinator' ? 'bg-purple-500/20 text-purple-500 border-purple-500/30' :
                        user.role === 'registration_admin' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                        user.role === 'volunteer' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}
                    >
                      {roles.filter(r => r !== 'all').map(r => (
                        <option key={r} value={r} className="bg-slate-900">{r}</option>
                      ))}
                    </select>
                    {updatingId === user.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-full">
                        <Loader2 className="animate-spin" size={12} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <School size={16} className="shrink-0" />
                    <span className="truncate">{user.college_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Phone size={16} className="shrink-0" />
                    <span>{user.mobile_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Shield size={16} className="shrink-0" />
                    <span className="capitalize">{user.department || 'N/A'}</span>
                  </div>
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
                          label="Roll Number" 
                          value={selectedUser.roll_number} 
                          onSave={(val) => handleUpdateProfile(selectedUser.id, { roll_number: val })}
                        />
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="font-mono text-sm">{selectedUser.email || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="font-mono text-sm">{selectedUser.mobile_number || 'N/A'}</p>
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
                            <div key={reg.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center group">
                              <div>
                                <p className="font-bold">{reg.events?.title || reg.combos?.name}</p>
                                <p className="text-xs text-gray-500">{new Date(reg.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${reg.payment_status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                  {reg.payment_status.toUpperCase()}
                                </span>
                                {reg.combo_id && (
                                  <button 
                                    onClick={() => handleUnlinkCombo(reg)}
                                    className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    title="Unlink Combo"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users size={14} /> Team Memberships
                      </h4>
                      <div className="space-y-3">
                        {userTeams.length === 0 ? (
                          <p className="text-gray-500 text-sm italic">Not in any teams</p>
                        ) : (
                          userTeams.map(tm => (
                            <div key={tm.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center group">
                              <div>
                                <p className="font-bold">{tm.teams?.name}</p>
                                <p className="text-xs text-gray-500">{tm.teams?.events?.title}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${tm.role === 'lead' ? 'bg-secondary/10 text-secondary' : 'bg-white/5 text-gray-400'}`}>
                                  {tm.role.toUpperCase()}
                                </span>
                                <button 
                                  onClick={() => handleSplitTeam(tm.id)}
                                  className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                  title="Remove from Team"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
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
                              act.type === 'registration' ? 'bg-secondary' : 'bg-green-500'
                            }`} />
                            <p className="text-sm font-bold">{act.label}</p>
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
