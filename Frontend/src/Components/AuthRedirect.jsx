import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

const AuthRedirect = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);
  
  // Get return URL from state (passed from event registration or other pages)
  const returnTo = location.state?.returnTo;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsReady(true);
        return;
      }

      // Fetch role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'student';

      // Only redirect if user is on login page
      if (location.pathname === '/login') {
        if (role === 'super_admin') {
          navigate('/admin', { replace: true });
        } else if (role === 'registration_admin') {
          navigate('/admin/desk', { replace: true });
        } else if (role === 'event_coordinator') {
          navigate('/coordinator', { replace: true });
        } else if (role === 'volunteer') {
          navigate('/volunteer', { replace: true });
        } else {
          navigate(returnTo || '/', { replace: true });
        }
        return; // Don't set ready if redirecting from login
      }
      
      setIsReady(true);
    };

    checkUser();
  }, [navigate, returnTo, location.pathname]);

  // For home page and other pages, render children immediately while checking auth in background
  // This prevents blank screen while auth loads
  if (location.pathname !== '/login') {
    return <>{children}</>;
  }

  // For login page, wait until we know if we should redirect
  if (!isReady) return null;

  return <>{children}</>;
};

export default AuthRedirect;
