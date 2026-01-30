import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Note: AuthProvider usually handles the loading state before rendering children.
  // But strictly speaking, if we use it elsewhere, we might want to check loading.
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, saving the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If user is logged in but doesn't have permission, redirect to their dashboard
    if (role === 'student') {
      return <Navigate to="/dashboard" replace />;
    } else if (role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'registration_admin') {
      return <Navigate to="/admin/desk" replace />;
    } else if (role === 'event_coordinator') {
      return <Navigate to="/coordinator" replace />;
    } else if (role === 'volunteer') {
      return <Navigate to="/volunteer" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
