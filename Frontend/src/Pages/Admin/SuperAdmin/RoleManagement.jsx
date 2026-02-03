import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  Calendar,
  UserMinus,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../../supabase';
import toast from 'react-hot-toast';

const RoleManagement = () => {
  const location = useLocation();
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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [eventSearchTerm, setEventSearchTerm] = useState('');

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

    // Set up real-time subscription for profile changes
    const profileSubscription = supabase
      .channel('profile-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Profile changed:', payload);
          if (payload.eventType === 'UPDATE') {
            // Update local state with new data
            setUsers(prevUsers => 
              prevUsers.map(u => 
                u.id === payload.new.id ? { ...u, ...payload.new } : u
              )
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, []);

  // Auto-refresh on visibility change and location change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab visible, refreshing role data...');
        fetchUsers();
        fetchEvents();
        fetchCoordinatorAssignments();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

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
      // Fetch coordinator assignments
      const { data: assignments, error } = await supabase
        .from('event_coordinators')
        .select('*');

      if (error) throw error;

      if (!assignments || assignments.length === 0) {
        setCoordinatorAssignments([]);
        return;
      }

      // Fetch profiles for coordinators
      const userIds = [...new Set(assignments.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch events for coordinators
      const eventIds = [...new Set(assignments.map(a => a.event_id))];
      const { data: eventsData } = await supabase
        .from('events')
        .select('event_id, name, title, category')
        .in('event_id', eventIds);
      
      const eventMap = new Map(eventsData?.map(e => [e.event_id, e]) || []);

      // Combine data
      const assignmentsWithData = assignments.map(a => ({
        ...a,
        profiles: profileMap.get(a.user_id) || { full_name: 'Unknown', email: '' },
        events: eventMap.get(a.event_id) || { event_id: a.event_id, name: a.event_id, title: a.event_id, category: '' }
      }));

      setCoordinatorAssignments(assignmentsWithData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleUpdateRole = async (userId, newRole, skipConfirm = false) => {
    // If not skipping confirmation, show the confirm modal
    if (!skipConfirm) {
      const user = users.find(u => u.id === userId);
      setPendingRoleChange({ userId, newRole, userName: user?.full_name });
      setIsConfirmModalOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user: currentAdmin } } = await supabase.auth.getUser();

      if (!currentAdmin) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      // Prevent self-demotion from super_admin
      if (userId === currentAdmin.id && newRole !== 'super_admin') {
        toast.error('You cannot change your own super admin role!');
        return;
      }

      // Only master admin can assign super_admin role
      if (newRole === 'super_admin' && currentUserId !== MASTER_ADMIN_ID) {
        toast.error('Only the Master Admin can assign Super Admin roles!');
        return;
      }

      console.log('Updating role for user:', userId, 'to:', newRole);

      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Role update result:', data);

      // Log the action (don't fail if logging fails)
      try {
        await supabase
          .from('admin_logs')
          .insert({
            admin_id: currentAdmin.id,
            action_type: 'role_change',
            target_user_id: userId,
            details: { new_role: newRole }
          });
      } catch (logError) {
        console.warn('Failed to log action:', logError);
      }

      const roleInfo = getRoleInfo(newRole);
      toast.success(`Role changed to ${roleInfo.label}!`, {
        icon: newRole === 'student' ? '👤' : '🎖️',
        duration: 3000
      });
      
      // Immediately update the local state for instant UI feedback
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
      
      setIsEditModalOpen(false);
      setIsConfirmModalOpen(false);
      setPendingRoleChange(null);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRole = async (user) => {
    if (user.role === 'student') {
      toast.error('User is already a student');
      return;
    }
    
    // Store current role for cleanup purposes
    setPendingRoleChange({ 
      userId: user.id, 
      newRole: 'student', 
      userName: user.full_name,
      previousRole: user.role,
      isRemoval: true 
    });
    setIsConfirmModalOpen(true);
  };

  const confirmRoleChange = async () => {
    if (pendingRoleChange) {
      // If removing event_coordinator role, also remove their event assignments
      if (pendingRoleChange.previousRole === 'event_coordinator') {
        try {
          await supabase
            .from('event_coordinators')
            .delete()
            .eq('user_id', pendingRoleChange.userId);
          
          // Update local coordinator assignments
          setCoordinatorAssignments(prev => 
            prev.filter(a => a.user_id !== pendingRoleChange.userId)
          );
        } catch (error) {
          console.warn('Failed to remove coordinator assignments:', error);
        }
      }
      
      await handleUpdateRole(pendingRoleChange.userId, pendingRoleChange.newRole, true);
    }
  };

  const handleAssignCoordinator = async () => {
    if (!selectedCoordinator || selectedEvents.length === 0) {
      toast.error('Please select at least one event');
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

      toast.success(`Coordinator assigned to ${selectedEvents.length} event(s)!`, {
        icon: '📅',
        duration: 3000
      });
      
      // Refresh both assignments and users list immediately
      await Promise.all([
        fetchCoordinatorAssignments(),
        fetchUsers()
      ]);
      setIsAssignModalOpen(false);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Error assigning coordinator:', error);
      toast.error('Failed to assign coordinator: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      const { error } = await supabase
        .from('event_coordinators')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Assignment removed!', { icon: '🗑️' });
      // Refresh both assignments and users list immediately
      await Promise.all([
        fetchCoordinatorAssignments(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  // Generate Dakshaa ID format from user ID
  const getDakshaaId = (userId) => {
    if (!userId) return 'N/A';
    const shortId = userId.substring(0, 8).toUpperCase();
    return `DK-${shortId}`;
  };

  const filteredUsers = users.filter(user => {
    const dakshaaId = getDakshaaId(user.id);
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dakshaaId.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold font-orbitron mb-2">Role Management</h1>
          <p className="text-gray-400">Assign and remove admin roles for students</p>
        </div>
        <button
          onClick={() => {
            fetchUsers();
            fetchCoordinatorAssignments();
            toast.success('Data refreshed!', { icon: '🔄' });
          }}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          title="Refresh"
        >
          <RefreshCw size={20} />
        </button>
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
            placeholder="Search by name, email, roll number, or Dakshaa ID (DK-...)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-secondary transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
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
            onClick={() => setSelectedRole('student')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              selectedRole === 'student'
                ? 'bg-gray-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Users size={18} />
            Students Only
          </button>
          <button
            onClick={() => {
              setSelectedCoordinator(null);
              setSelectedEvents([]);
              setEventSearchTerm('');
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
      ) : filteredUsers.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl">
          <Search className="text-gray-500 mb-4" size={48} />
          <p className="text-xl font-bold text-gray-400">No users found</p>
          <p className="text-sm text-gray-500 mt-2">Try a different search term or filter</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedRole('all');
            }}
            className="mt-4 px-4 py-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-all"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          {/* Results count */}
          <div className="px-6 py-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Showing <span className="text-white font-bold">{filteredUsers.length}</span> of <span className="text-white font-bold">{users.length}</span> users
            </span>
            {selectedRole !== 'all' && (
              <span className={`text-xs px-2 py-1 rounded-full bg-${getRoleInfo(selectedRole).color}-500/10 text-${getRoleInfo(selectedRole).color}-500`}>
                Filtered by: {getRoleInfo(selectedRole).label}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">Dakshaa ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">Current Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const isStudent = user.role === 'student';
                  return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center text-sm font-bold">
                            {user.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold">{user.full_name}</p>
                            <p className="text-xs text-gray-500">{user.college_name || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-secondary text-sm bg-secondary/10 px-2 py-1 rounded">
                          {getDakshaaId(user.id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 bg-${roleInfo.color}-500/10 border border-${roleInfo.color}-500/20 rounded-full`}>
                          <roleInfo.icon className={`text-${roleInfo.color}-500`} size={16} />
                          <span className={`text-${roleInfo.color}-500 text-sm font-bold`}>{roleInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Assign Role Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-all flex items-center gap-1"
                            title="Assign Role"
                          >
                            <UserPlus size={16} />
                          </button>
                          
                          {/* Remove Role Button - Only show if not already student */}
                          {!isStudent && (
                            <button
                              onClick={() => handleRemoveRole(user)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all flex items-center gap-1"
                              title="Remove Role (Reset to Student)"
                            >
                              <UserMinus size={16} />
                            </button>
                          )}
                          
                          {/* Manage Events - Only for coordinators */}
                          {user.role === 'event_coordinator' && (
                            <button
                              onClick={() => {
                                setSelectedCoordinator(user.id);
                                const assignments = coordinatorAssignments
                                  .filter(a => a.user_id === user.id)
                                  .map(a => a.event_id);
                                setSelectedEvents(assignments);
                                setEventSearchTerm('');
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
                  <p className="text-sm text-gray-400">{assignment.events?.name || assignment.events?.title || assignment.events?.event_id}</p>
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
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <UserPlus className="text-green-500" size={28} />
                Assign Role
              </h3>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Selected User</p>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center text-lg font-bold">
                      {selectedUser.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{selectedUser.full_name}</p>
                      <p className="text-sm text-gray-400">{selectedUser.email}</p>
                      <p className="text-xs text-secondary font-mono">{getDakshaaId(selectedUser.id)}</p>
                    </div>
                    <div className={`px-3 py-1 bg-${getRoleInfo(selectedUser.role).color}-500/10 border border-${getRoleInfo(selectedUser.role).color}-500/20 rounded-full`}>
                      <span className={`text-${getRoleInfo(selectedUser.role).color}-500 text-xs font-bold`}>
                        {getRoleInfo(selectedUser.role).label}
                      </span>
                    </div>
                  </div>
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
                    .map(role => {
                      const isCurrentRole = selectedUser.role === role.value;
                      return (
                        <button
                          key={role.value}
                          onClick={() => handleUpdateRole(selectedUser.id, role.value)}
                          disabled={submitting || isCurrentRole}
                          className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                            isCurrentRole
                              ? `border-${role.color}-500 bg-${role.color}-500/20 cursor-not-allowed`
                              : `border-white/10 hover:border-${role.color}-500/40 hover:bg-${role.color}-500/10`
                          } disabled:opacity-60`}
                        >
                          <div className={`p-2 rounded-lg bg-${role.color}-500/10`}>
                            <role.icon className={`text-${role.color}-500`} size={24} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{role.label}</p>
                            <p className="text-xs text-gray-500">
                              {role.value === 'student' && 'Default role for all users'}
                              {role.value === 'volunteer' && 'Can scan QR codes for check-in'}
                              {role.value === 'event_coordinator' && 'Manages specific events'}
                              {role.value === 'registration_admin' && 'Handles registrations'}
                              {role.value === 'super_admin' && 'Full system access'}
                            </p>
                          </div>
                          {isCurrentRole && (
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400">
                              Current
                            </span>
                          )}
                          {submitting && !isCurrentRole && (
                            <Loader2 className="animate-spin text-gray-400" size={20} />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
              >
                Cancel
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
                  onChange={(e) => {
                    const newCoordinatorId = e.target.value;
                    setSelectedCoordinator(newCoordinatorId);
                    
                    // Auto-load existing assignments for this coordinator
                    if (newCoordinatorId) {
                      const existingAssignments = coordinatorAssignments
                        .filter(a => a.user_id === newCoordinatorId)
                        .map(a => a.event_id);
                      setSelectedEvents(existingAssignments);
                    } else {
                      setSelectedEvents([]);
                    }
                  }}
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
                
                {/* Event Search Input */}
                <div className="mb-4 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={eventSearchTerm}
                    onChange={(e) => setEventSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                  {events
                    .filter(event => {
                      if (!eventSearchTerm) return true;
                      const searchLower = eventSearchTerm.toLowerCase();
                      const name = (event.name || event.title || event.event_id || '').toLowerCase();
                      const category = (event.category || '').toLowerCase();
                      return name.includes(searchLower) || category.includes(searchLower);
                    })
                    .map(event => (
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
                        <p className="font-bold">{event.name || event.title || event.event_id}</p>
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && pendingRoleChange && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsConfirmModalOpen(false);
                setPendingRoleChange(null);
              }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center">
                {pendingRoleChange.isRemoval ? (
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                    <UserMinus className="text-red-500" size={32} />
                  </div>
                ) : (
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                    <UserPlus className="text-green-500" size={32} />
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-2">
                  {pendingRoleChange.isRemoval ? 'Remove Role?' : 'Confirm Role Change'}
                </h3>
                
                <p className="text-gray-400 mb-4">
                  {pendingRoleChange.isRemoval ? (
                    <>Are you sure you want to remove <span className="text-white font-bold">{pendingRoleChange.userName}</span>'s admin role and reset them to <span className="text-gray-300">Student</span>?</>
                  ) : (
                    <>Change <span className="text-white font-bold">{pendingRoleChange.userName}</span>'s role to <span className={`text-${getRoleInfo(pendingRoleChange.newRole).color}-500 font-bold`}>{getRoleInfo(pendingRoleChange.newRole).label}</span>?</>
                  )}
                </p>

                {/* Warning for coordinator removal */}
                {pendingRoleChange.previousRole === 'event_coordinator' && pendingRoleChange.isRemoval && (
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                      <div className="text-xs text-amber-400">
                        <p className="font-bold mb-1">This will also:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Remove all event assignments for this coordinator</li>
                          <li>Revoke access to coordinator dashboard</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsConfirmModalOpen(false);
                      setPendingRoleChange(null);
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRoleChange}
                    disabled={submitting}
                    className={`flex-1 py-3 ${
                      pendingRoleChange.isRemoval 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        {pendingRoleChange.isRemoval ? 'Remove Role' : 'Confirm'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleManagement;
