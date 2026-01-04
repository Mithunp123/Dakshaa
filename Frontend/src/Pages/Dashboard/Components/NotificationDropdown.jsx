import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, UserPlus, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import notificationService from '../../../services/notificationService';
import { supabase } from '../../../supabase';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [userId, setUserId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    initializeNotifications();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initializeNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchNotifications(user.id);
        subscribeToNotifications(user.id);
      }
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  };

  const fetchNotifications = async (uid) => {
    try {
      // Fetch from notifications table
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const subscribeToNotifications = (uid) => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleAcceptInvitation = async (notification) => {
    setProcessingId(notification.id);
    const invitationId = notification.data?.invitation_id;
    
    if (!invitationId) {
      console.error("No invitation ID found");
      setProcessingId(null);
      return;
    }

    const result = await notificationService.acceptTeamInvitation(invitationId);
    
    if (result.success) {
      // Mark notification as read (will work even if it fails)
      await notificationService.markAsRead(notification.id);
      // Refresh notifications
      if (userId) {
        await fetchNotifications(userId);
      }
      alert("Successfully joined the team!");
    } else {
      alert(result.error || "Failed to accept invitation");
    }
    setProcessingId(null);
  };

  const handleRejectInvitation = async (notification) => {
    setProcessingId(notification.id);
    const invitationId = notification.data?.invitation_id;
    
    if (!invitationId) {
      console.error("No invitation ID found");
      setProcessingId(null);
      return;
    }

    const result = await notificationService.rejectTeamInvitation(invitationId);
    
    if (result.success) {
      // Mark notification as read
      await notificationService.markAsRead(notification.id);
      // Refresh notifications
      if (userId) {
        await fetchNotifications(userId);
      }
      alert("Invitation declined");
    } else {
      alert(result.error || "Failed to reject invitation");
    }
    setProcessingId(null);
  };

  const handleApproveJoinRequest = async (notification) => {
    setProcessingId(notification.id);
    const requestId = notification.data?.request_id;
    
    if (!requestId) {
      console.error("No request ID found");
      setProcessingId(null);
      return;
    }

    const result = await notificationService.approveJoinRequest(requestId);
    
    if (result.success) {
      // Mark notification as read
      await notificationService.markAsRead(notification.id);
      // Refresh notifications
      if (userId) {
        await fetchNotifications(userId);
      }
      alert("User added to team successfully!");
    } else {
      alert(result.error || "Failed to approve request");
    }
    setProcessingId(null);
  };

  const handleRejectJoinRequest = async (notification) => {
    setProcessingId(notification.id);
    const requestId = notification.data?.request_id;
    
    if (!requestId) {
      console.error("No request ID found");
      setProcessingId(null);
      return;
    }

    const result = await notificationService.rejectJoinRequest(requestId);
    
    if (result.success) {
      // Mark notification as read
      await notificationService.markAsRead(notification.id);
      // Refresh notifications
      if (userId) {
        await fetchNotifications(userId);
      }
      alert("Request declined");
    } else {
      alert(result.error || "Failed to reject request");
    }
    setProcessingId(null);
  };

  const handleMarkAsRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    setLoading(true);
    
    try {
      // Mark all as read in notifications table
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      
      await fetchNotifications(userId);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
    
    setLoading(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderNotificationContent = (notification) => {
    const isProcessing = processingId === notification.id;

    if (notification.type === 'team_invitation') {
      return (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <UserPlus size={16} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
              {notification.data?.team_name && (
                <p className="text-xs text-secondary mt-1">Team: {notification.data.team_name}</p>
              )}
            </div>
          </div>
          
          {!notification.is_read && (
            <div className="flex gap-2 ml-10">
              <button
                onClick={() => handleAcceptInvitation(notification)}
                disabled={isProcessing}
                className="flex-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Accept
              </button>
              <button
                onClick={() => handleRejectInvitation(notification)}
                disabled={isProcessing}
                className="flex-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                Decline
              </button>
            </div>
          )}
        </div>
      );
    }

    if (notification.type === 'team_join_request') {
      return (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Users size={16} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
              {notification.data?.message && (
                <p className="text-xs text-gray-300 mt-1 italic">"{notification.data.message}"</p>
              )}
            </div>
          </div>
          
          {!notification.is_read && (
            <div className="flex gap-2 ml-10">
              <button
                onClick={() => handleApproveJoinRequest(notification)}
                disabled={isProcessing}
                className="flex-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Approve
              </button>
              <button
                onClick={() => handleRejectJoinRequest(notification)}
                disabled={isProcessing}
                className="flex-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                Reject
              </button>
            </div>
          )}
        </div>
      );
    }

    // Default notification rendering
    return (
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-500/10 flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
        </div>
        {!notification.is_read && (
          <button
            onClick={() => handleMarkAsRead(notification.id)}
            className="text-xs text-secondary hover:text-secondary/80"
          >
            Mark read
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-secondary transition-colors relative"
      >
        {unreadCount > 0 && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></div>
        )}
        <Bell className="w-5 h-5 xl:w-6 xl:h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-400">{unreadCount} unread</p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-secondary hover:text-secondary/80 font-medium disabled:opacity-50"
                >
                  {loading ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-white/5 transition-colors ${
                        !notification.is_read ? 'bg-white/5' : ''
                      }`}
                    >
                      {renderNotificationContent(notification)}
                      <p className="text-[10px] text-gray-500 mt-2 ml-10">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
