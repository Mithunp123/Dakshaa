import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

const AuthRedirect = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  
  // Get return URL from state (passed from event registration or other pages)
  const returnTo = location.state?.returnTo;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'student';

      // Only redirect if user is on login page or explicitly navigating
      if (location.pathname === '/login') {
        if (role === 'super_admin') {
          navigate('/admin');
        } else if (role === 'registration_admin') {
          navigate('/admin/desk');
        } else if (role === 'event_coordinator') {
          navigate('/coordinator');
        } else if (role === 'volunteer') {
          navigate('/volunteer');
        } else {
          navigate(returnTo || '/');
        }
      }
      setLoading(false);
    };

    checkUser();
  }, [navigate, returnTo]);

  if (loading) return null;

  return <>{children}</>;
};

export default AuthRedirect;
