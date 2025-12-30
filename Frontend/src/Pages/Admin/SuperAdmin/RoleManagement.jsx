import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Shield, 
  UserCog, 
  QrCode, 
  Search, 
  CheckCircle2, 
  X, 
  Loader2,
  ShieldCheck,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  Calendar
} from 'lucide-react';
import { supabase } from '../../../supabase';

const RoleManagement = () => {
  const MASTER_ADMIN_ID = '105f3289-bfc5-467f-8cd0-49ff9c8f7082'; // Only this user can assign super_admin
  const [currentUserId, setCurrentUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [coordinatorAssignments, setCoordinatorAssignments] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  const roles = [
    { value: 'student', label: 'Student', icon: Users, color: 'gray' },
    { value: 'registration_admin', label: 'Registration Admin', icon: UserCog, color: 'blue' },
    { value: 'event_coordinator', label: 'Event Coordinator', icon: Shield, color: 'purple' },
    { value: 'volunteer', label: 'Volunteer', icon: QrCode, color: 'green' },
    { value: 'super_admin', label: 'Super Admin', icon: ShieldCheck, color: 'red' }
  ];

  useEffect(() => {
    getCurrentUser();
    fetchUsers();
    fetchEvents();
    fetchCoordinatorAssignments();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('event_id');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchCoordinatorAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_coordinators')
        .select('*, profiles(full_name, email), events(event_id, category)');

      if (error) throw error;
      setCoordinatorAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setSubmitting(true);
      const { data: { user: currentAdmin } } = await supabase.auth.getUser();

      // Prevent self-demotion from super_admin
      if (userId === currentAdmin.id && newRole !== 'super_admin') {
        alert('⚠️ You cannot change your own super admin role!');
        return;
      }

      // Only master admin can assign super_admin role
      if (newRole === 'super_admin' && currentUserId !== MASTER_ADMIN_ID) {
        alert('🔒 Only the Master Admin can assign Super Admin roles!');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: currentAdmin.id,
          action_type: 'role_change',
          target_user_id: userId,
          details: { new_role: newRole }
        });

      alert('✅ Role updated successfully!');
      fetchUsers();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignCoordinator = async () => {
    if (!selectedCoordinator || selectedEvents.length === 0) {
      alert('Please select at least one event');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user: currentAdmin } } = await supabase.auth.getUser();

      // Remove old assignments
      await supabase
        .from('event_coordinators')
        .delete()
        .eq('user_id', selectedCoordinator);

      // Add new assignments (without assigned_by if column doesn't exist)
      const assignments = selectedEvents.map(eventId => ({
        user_id: selectedCoordinator,
        event_id: eventId
      }));

      const { error } = await supabase
        .from('event_coordinators')
        .insert(assignments);

      if (error) throw error;

      alert(`✅ Coordinator assigned to ${selectedEvents.length} event(s)!`);
      fetchCoordinatorAssignments();
      setIsAssignModalOpen(false);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Error assigning coordinator:', error);
      alert('Failed to assign coordinator: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    const confirmed = confirm('Remove this coordinator assignment?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('event_coordinators')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      alert('✅ Assignment removed!');
      fetchCoordinatorAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roll_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const coordinators = users.filter(u => u.role === 'event_coordinator');

  const getRoleInfo = (roleValue) => {
    return roles.find(r => r.value === roleValue) || roles[0];
  };

  const roleStats = roles.reduce((acc, role) => {
    acc[role.value] = users.filter(u => u.role === role.value).length;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold font-orbitron mb-2">Role Management</h1>
        <p className="text-gray-400">Assign admin roles and manage coordinator assignments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {roles.map(role => {
          const count = roleStats[role.value] || 0;
          return (
            <motion.div
              key={role.value}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`bg-${role.color}-500/10 border border-${role.color}-500/20 rounded-2xl p-5 cursor-pointer hover:border-${role.color}-500/40 transition-all ${
                selectedRole === role.value ? `ring-2 ring-${role.color}-500` : ''
              }`}
              onClick={() => setSelectedRole(role.value)}
            >
              <role.icon className={`text-${role.color}-500 mb-2`} size={24} />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">{role.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search users by name, email, or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-secondary transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              selectedRole === 'all'
                ? 'bg-secondary text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            All Roles
          </button>
          <button
            onClick={() => {
              setSelectedCoordinator(null);
              setSelectedEvents([]);
              setIsAssignModalOpen(true);
            }}
            className="px-6 py-3 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-xl font-bold hover:bg-purple-500 hover:text-white transition-all flex items-center gap-2"
          >
            <Calendar size={20} />
            Assign Coordinator
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="animate-spin text-secondary" size={48} />
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">College</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">Current Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center text-sm font-bold">
                            {user.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold">{user.full_name}</p>
                            <p className="text-xs text-gray-500">{user.roll_number || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.college_name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 bg-${roleInfo.color}-500/10 border border-${roleInfo.color}-500/20 rounded-full`}>
                          <roleInfo.icon className={`text-${roleInfo.color}-500`} size={16} />
                          <span className={`text-${roleInfo.color}-500 text-sm font-bold`}>{roleInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-all"
                            title="Edit Role"
                          >
                            <Edit2 size={16} />
                          </button>
                          {user.role === 'event_coordinator' && (
                            <button
                              onClick={() => {
                                setSelectedCoordinator(user.id);
                                const assignments = coordinatorAssignments
                                  .filter(a => a.user_id === user.id)
                                  .map(a => a.event_id);
                                setSelectedEvents(assignments);
                                setIsAssignModalOpen(true);
                              }}
                              className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg transition-all"
                              title="Manage Events"
                            >
                              <Calendar size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coordinator Assignments */}
      {coordinatorAssignments.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="text-purple-500" size={24} />
            Current Coordinator Assignments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coordinatorAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold">{assignment.profiles?.full_name}</p>
                  <p className="text-sm text-gray-400">{assignment.events?.event_id}</p>
                  <p className="text-xs text-gray-500 capitalize">{assignment.events?.category}</p>
                </div>
                <button
                  onClick={() => handleRemoveAssignment(assignment.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Shield className="text-secondary" size={28} />
                Change User Role
              </h3>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">User</p>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="font-bold">{selectedUser.full_name}</p>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm text-gray-400 mb-3">Select New Role</p>
                {currentUserId !== MASTER_ADMIN_ID && (
                  <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                    <Shield className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-amber-500">
                      Only Master Admin can assign Super Admin roles
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {roles
                    .filter(role => {
                      // Hide super_admin option if not master admin
                      if (role.value === 'super_admin' && currentUserId !== MASTER_ADMIN_ID) {
                        return false;
                      }
                      return true;
                    })
                    .map(role => (
                      <button
                        key={role.value}
                        onClick={() => handleUpdateRole(selectedUser.id, role.value)}
                        disabled={submitting || selectedUser.role === role.value}
                        className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                          selectedUser.role === role.value
                            ? `border-${role.color}-500 bg-${role.color}-500/10 cursor-not-allowed`
                            : `border-white/10 hover:border-${role.color}-500/40 hover:bg-${role.color}-500/10`
                        } disabled:opacity-50`}
                      >
                        <role.icon className={`text-${role.color}-500`} size={24} />
                        <div className="flex-1">
                          <p className="font-bold">{role.label}</p>
                          {selectedUser.role === role.value && (
                            <p className="text-xs text-gray-500">Current Role</p>
                          )}
                        </div>
                        {submitting && selectedUser.role !== role.value && (
                          <Loader2 className="animate-spin text-gray-400" size={20} />
                        )}
                      </button>
                    ))}
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Coordinator Modal */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Calendar className="text-purple-500" size={28} />
                Assign Coordinator to Events
              </h3>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Select Coordinator</p>
                <select
                  value={selectedCoordinator || ''}
                  onChange={(e) => setSelectedCoordinator(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                >
                  <option value="" className="bg-slate-900">Choose Coordinator...</option>
                  {coordinators.map(coord => (
                    <option key={coord.id} value={coord.id} className="bg-slate-900">
                      {coord.full_name} ({coord.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-8">
                <p className="text-sm text-gray-400 mb-3">Select Events (Multiple)</p>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                  {events.map(event => (
                    <label
                      key={event.event_id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                        selectedEvents.includes(event.event_id)
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 hover:border-purple-500/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.event_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, event.event_id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter(id => id !== event.event_id));
                          }
                        }}
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <p className="font-bold">{event.event_id}</p>
                        <p className="text-xs text-gray-400 capitalize">{event.category} • ₹{event.price}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignCoordinator}
                  disabled={submitting || !selectedCoordinator || selectedEvents.length === 0}
                  className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Assign ({selectedEvents.length})
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleManagement;
