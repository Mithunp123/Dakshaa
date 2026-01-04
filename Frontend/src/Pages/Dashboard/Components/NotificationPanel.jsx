import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "../../../supabase";
import notificationService from "../../../services/notificationService";

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchNotifications(user.id);
        setupRealtimeSubscription(user.id);
      }
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  };

  const fetchNotifications = async (uid) => {
    // Try notifications table first (new), fallback to notification_queue (existing)
    const result = await notificationService.getAllNotifications(uid, 20);
    if (result.success) {
      setNotifications(result.data);
      const unread = result.data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    }
  };

  const setupRealtimeSubscription = (uid) => {
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
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAcceptInvitation = async (notification) => {
    setLoading(true);
    const invitationId = notification.data?.invitation_id;
    
    const result = await notificationService.acceptTeamInvitation(invitationId);
    
    if (result.success) {
      alert("✅ Invitation accepted! You've joined the team.");
      await notificationService.markAsRead(notification.id);
      await fetchNotifications(userId);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleRejectInvitation = async (notification) => {
    setLoading(true);
    const invitationId = notification.data?.invitation_id;
    
    const result = await notificationService.rejectTeamInvitation(invitationId);
    
    if (result.success) {
      alert("Invitation rejected.");
      await notificationService.markAsRead(notification.id);
      await fetchNotifications(userId);
    } else {
      alert(`Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    await fetchNotifications(userId);
  };

  const handleMarkAllAsRead = async () => {
    if (userId) {
      await notificationService.markAllAsRead(userId);
      await fetchNotifications(userId);
    }
  };

  return (
    <div className="relative z-50">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[70] max-h-[500px] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-secondary hover:text-secondary-dark font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="mx-auto mb-3 opacity-30" size={40} />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-white/5 transition-colors ${
                          !notification.is_read ? "bg-white/[0.02]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            notification.type === 'team_invitation' 
                              ? 'bg-secondary/20 text-secondary'
                              : 'bg-blue-500/20 text-blue-500'
                          }`}>
                            {notification.type === 'team_invitation' ? (
                              <UserPlus size={18} />
                            ) : (
                              <Bell size={18} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{notification.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-600 mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>

                            {/* Team Invitation Actions */}
                            {notification.type === 'team_invitation' && !notification.is_read && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleAcceptInvitation(notification)}
                                  disabled={loading}
                                  className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  <Check size={14} />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectInvitation(notification)}
                                  disabled={loading}
                                  className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  <X size={14} />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>

                          {!notification.is_read && notification.type !== 'team_invitation' && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPanel;
