import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const AuthRedirect = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading } = useAuth();
  
  // Get return URL from state (passed from event registration or other pages)
  const returnTo = location.state?.returnTo;

  useEffect(() => {
    // Only apply redirect logic on login page
    if (location.pathname !== '/login') return;

    // If user is authenticated, redirect them based on role
    if (!loading && user) {
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
    }
  }, [user, role, loading, navigate, returnTo, location.pathname]);

  // For non-login pages, render immediately
  if (location.pathname !== '/login') {
    return <>{children}</>;
  }

  // For login page, show children only if not authenticated
  // (Loading is handled by AuthProvider mostly, but good to be safe)
  if (loading || user) {
    return null;
  }

  return <>{children}</>;
};

export default AuthRedirect;
