import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // If user is a student, send to dashboard, otherwise send to their respective home
    if (userRole === 'student') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'super_admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'registration_admin') {
      return <Navigate to="/admin/desk" replace />;
    } else if (userRole === 'event_coordinator') {
      return <Navigate to="/coordinator" replace />;
    } else if (userRole === 'volunteer') {
      return <Navigate to="/volunteer" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
