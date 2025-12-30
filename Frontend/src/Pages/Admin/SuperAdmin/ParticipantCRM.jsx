import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Mail,
  Edit,
  Activity,
  Search,
  Send,
  Loader2,
  UserCircle,
  Building,
  Phone,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  searchUsers,
  updateUserProfile,
  getUsersByEvent,
  sendBulkEmail,
  getAllEvents,
  getAdminLogs
} from "../../../services/adminService";

const ParticipantCRM = () => {
  const [activeTab, setActiveTab] = useState('edit'); // 'edit', 'bulk-email', 'activity-log'
  const [loading, setLoading] = useState(false);
  
  // Edit Profile
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Bulk Email
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  });
  const [recipientCount, setRecipientCount] = useState(0);
  
  // Activity Log
  const [activityLogs, setActivityLogs] = useState([]);
  const [logFilters, setLogFilters] = useState({
    actionType: '',
    startDate: ''
  });

  useEffect(() => {
    loadEvents();
    loadActivityLogs();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadActivityLogs();
  }, [logFilters]);

  const loadEvents = async () => {
    const { data } = await getAllEvents();
    if (data) setEvents(data);
  };

  const handleSearch = async () => {
    const { data } = await searchUsers(searchTerm);
    if (data) setSearchResults(data);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      college_name: user.college_name || '',
      department: user.department || '',
      mobile_number: user.mobile_number || '',
      roll_number: user.roll_number || ''
    });
    setSearchResults([]);
  };

  const handleUpdateProfile = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    const { data, error } = await updateUserProfile(selectedUser.id, editForm);
    setLoading(false);
    
    if (data) {
      alert('Profile updated successfully!');
      setSelectedUser(data);
    } else {
      alert('Error: ' + error?.message);
    }
  };

  const loadRecipients = async (eventId) => {
    setSelectedEvent(eventId);
    const { data } = await getUsersByEvent(eventId);
    if (data) setRecipientCount(data.length);
  };

  const handleSendBulkEmail = async () => {
    if (!selectedEvent || !emailData.subject || !emailData.message) {
      alert('Please fill all fields');
      return;
    }
    
    if (!window.confirm(`Send email to ${recipientCount} participants?`)) {
      return;
    }
    
    setLoading(true);
    const { data, error } = await sendBulkEmail(selectedEvent, emailData.subject, emailData.message);
    setLoading(false);
    
    if (data) {
      alert(`Email sent to ${data.recipient_count} participants!`);
      setEmailData({ subject: '', message: '' });
    } else {
      alert('Error: ' + error?.message);
    }
  };

  const loadActivityLogs = async () => {
    setLoading(true);
    const { data } = await getAdminLogs(logFilters);
    setLoading(false);
    if (data) setActivityLogs(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Participant CRM</h1>
        <p className="text-gray-400 mt-1">Manage participant data and communications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'edit', label: 'Edit Profiles', icon: Edit },
          { id: 'bulk-email', label: 'Bulk Email', icon: Mail },
          { id: 'activity-log', label: 'Activity Log', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-secondary text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'edit' && (
        <EditProfileTab
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchResults={searchResults}
          selectUser={selectUser}
          selectedUser={selectedUser}
          editForm={editForm}
          setEditForm={setEditForm}
          handleUpdateProfile={handleUpdateProfile}
          loading={loading}
        />
      )}

      {activeTab === 'bulk-email' && (
        <BulkEmailTab
          events={events}
          selectedEvent={selectedEvent}
          loadRecipients={loadRecipients}
          recipientCount={recipientCount}
          emailData={emailData}
          setEmailData={setEmailData}
          handleSendBulkEmail={handleSendBulkEmail}
          loading={loading}
        />
      )}

      {activeTab === 'activity-log' && (
        <ActivityLogTab
          activityLogs={activityLogs}
          logFilters={logFilters}
          setLogFilters={setLogFilters}
          loading={loading}
        />
      )}
    </div>
  );
};

// Edit Profile Tab
const EditProfileTab = ({
  searchTerm,
  setSearchTerm,
  searchResults,
  selectUser,
  selectedUser,
  editForm,
  setEditForm,
  handleUpdateProfile,
  loading
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Search Panel */}
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">Search Participant</h3>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                      <UserCircle size={24} className="text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500">{user.college_name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Panel */}
      <div className="space-y-4">
        {selectedUser ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Edit Profile</h3>
              <span className="text-xs text-gray-500 font-mono">ID: {selectedUser.id.substring(0, 8)}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">College Name</label>
                <input
                  type="text"
                  value={editForm.college_name}
                  onChange={(e) => setEditForm({ ...editForm, college_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Department</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={editForm.mobile_number}
                  onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Roll Number</label>
                <input
                  type="text"
                  value={editForm.roll_number}
                  onChange={(e) => setEditForm({ ...editForm, roll_number: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <p className="text-xs text-yellow-400">
                  <strong>Note:</strong> All changes will be logged in the activity log for audit purposes.
                </p>
              </div>

              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="w-full px-4 py-3 bg-secondary rounded-xl hover:bg-secondary/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Update Profile'}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <UserCircle size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Search and select a participant to edit their profile</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Bulk Email Tab
const BulkEmailTab = ({
  events,
  selectedEvent,
  loadRecipients,
  recipientCount,
  emailData,
  setEmailData,
  handleSendBulkEmail,
  loading
}) => {
  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-blue-500/10 rounded-xl">
            <Mail size={32} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Send Bulk Email</h2>
            <p className="text-gray-400">Send announcements to event participants</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Select Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => loadRecipients(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Choose an event</option>
              {events.map(event => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_id} - {event.category}
                </option>
              ))}
            </select>
          </div>

          {recipientCount > 0 && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500" size={20} />
                <p className="text-green-400 font-medium">
                  {recipientCount} participants will receive this email
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Subject</label>
            <input
              type="text"
              placeholder="Enter email subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Message</label>
            <textarea
              placeholder="Type your message here..."
              value={emailData.message}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              rows={10}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {emailData.message.length} characters
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={20} />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">Email Service Integration</p>
                <p className="text-gray-400">
                  This feature requires integration with an email service provider (SendGrid, EmailJS, etc.).
                  Currently, the action will be logged but emails won't be sent until configured.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSendBulkEmail}
            disabled={loading || !selectedEvent || !emailData.subject || !emailData.message}
            className="w-full px-6 py-3 bg-secondary hover:bg-secondary/90 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Send size={20} />
                Send to {recipientCount} Participants
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Activity Log Tab
const ActivityLogTab = ({ activityLogs, logFilters, setLogFilters, loading }) => {
  const actionTypeColors = {
    force_add: 'text-blue-500 bg-blue-500/10',
    move_user: 'text-purple-500 bg-purple-500/10',
    upgrade_combo: 'text-green-500 bg-green-500/10',
    edit_profile: 'text-yellow-500 bg-yellow-500/10',
    initiate_refund: 'text-red-500 bg-red-500/10',
    promote_waitlist: 'text-indigo-500 bg-indigo-500/10',
    bulk_email: 'text-pink-500 bg-pink-500/10'
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Action Type</label>
            <select
              value={logFilters.actionType}
              onChange={(e) => setLogFilters({ ...logFilters, actionType: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">All Actions</option>
              <option value="force_add">Force Add</option>
              <option value="move_user">Move User</option>
              <option value="upgrade_combo">Upgrade Combo</option>
              <option value="edit_profile">Edit Profile</option>
              <option value="initiate_refund">Initiate Refund</option>
              <option value="promote_waitlist">Promote Waitlist</option>
              <option value="bulk_email">Bulk Email</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={logFilters.startDate}
              onChange={(e) => setLogFilters({ ...logFilters, startDate: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-secondary" />
        </div>
      ) : (
        <div className="space-y-4">
          {activityLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity size={24} className="text-secondary" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        actionTypeColors[log.action_type] || 'text-gray-500 bg-gray-500/10'
                      }`}>
                        {log.action_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium">
                      Admin: {log.admin?.full_name || 'Unknown'} ({log.admin?.role})
                    </p>
                    {log.target_user && (
                      <p className="text-sm text-gray-400">
                        Target: {log.target_user.full_name} ({log.target_user.email})
                      </p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                          View Details
                        </summary>
                        <pre className="mt-2 p-3 bg-black/30 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {activityLogs.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <Activity size={64} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No activity logs found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantCRM;
