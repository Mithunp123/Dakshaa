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
    let mounted = true;
    
    const checkUser = async () => {
      // Set ready immediately for non-login pages
      if (location.pathname !== '/login') {
        setIsReady(true);
        return;
      }

      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (error || !user) {
          setIsReady(true);
          return;
        }

        // Fetch role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!mounted) return;

        const role = profile?.role || 'student';

        // Redirect based on role
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
      } catch (error) {
        console.error('AuthRedirect error:', error);
        if (mounted) {
          setIsReady(true);
        }
      }
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, [navigate, returnTo, location.pathname]);

  // For non-login pages, render immediately
  if (location.pathname !== '/login') {
    return <>{children}</>;
  }

  // For login page, show children once ready
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
};

export default AuthRedirect;
