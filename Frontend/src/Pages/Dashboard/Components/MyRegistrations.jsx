import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabaseService } from '../../../services/supabaseService';
import { supabase } from '../../../supabase';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Set up real-time subscription for dynamic updates
  useEffect(() => {
    if (!userId) return;

    // Subscribe to changes in event_registrations_config for this user
    const subscription = supabase
      .channel(`user-registrations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'event_registrations_config',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Registration change detected:', payload);
          // Refresh registrations when any change occurs
          fetchRegistrations();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const fetchRegistrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const data = await supabaseService.getUserRegistrations(user.id);
        // Filter to only show registrations that exist (have valid data)
        const validRegistrations = (data || []).filter(reg => reg && reg.id);
        setRegistrations(validRegistrations);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'PAID':
      case 'COMPLETED': 
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'PENDING': 
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: 
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  if (loading) return <div className="text-center p-10">Loading your registrations...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">My Registrations</h2>
      
      {registrations.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <p className="text-gray-400">You haven't registered for any events yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registrations.map((reg) => (
            <motion.div 
              key={reg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-blue-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(reg.payment_status)}`}>
                    {reg.payment_status}
                  </span>
                  <h3 className="text-lg font-bold mt-2">
                    {reg.event_name || reg.events_config?.name || 'Event'}
                  </h3>
                  <p className="text-sm text-gray-400 capitalize">
                    {reg.events_config?.category || ''}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>
                    {reg.events_config?.event_date 
                      ? new Date(reg.events_config.event_date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : 'March 15-17, 2026'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{reg.events_config?.event_time || '09:00 AM onwards'}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button 
                  disabled={reg.payment_status !== 'completed'}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} /> Certificate
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;


