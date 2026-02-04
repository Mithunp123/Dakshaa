import React, { useEffect } from 'react';
import { useAuth } from '../Components/AuthProvider';
import { useSilentRefreshManager } from '../utils/silentRefresh';
import toast from 'react-hot-toast';

// Global session monitor component
const SessionMonitor = () => {
  const { user } = useAuth();
  const { addListener } = useSilentRefreshManager();

  useEffect(() => {
    if (!user) return;

    console.log('🔐 Session monitor started for user:', user.email);

    // Listen for refresh events
    const unsubscribe = addListener((event) => {
      switch (event.type) {
        case 'refresh-success':
          console.log('✅ Session refreshed successfully');
          break;
          
        case 'refresh-failed':
          console.warn('❌ Session refresh failed, user will be signed out');
          toast.error('Session expired. Please log in again.', {
            duration: 5000,
            position: 'top-center',
          });
          break;
          
        case 'refresh-error':
          console.error('❌ Session refresh error:', event.error);
          // Only show error toast for network issues, not auth failures
          if (event.error && !event.error.message?.includes('refresh_token')) {
            toast.error('Connection issue. Please check your internet.', {
              duration: 3000,
              position: 'top-center',
            });
          }
          break;
          
        default:
          break;
      }
    });

    return unsubscribe;
  }, [user, addListener]);

  // This component doesn't render anything
  return null;
};

export default SessionMonitor;