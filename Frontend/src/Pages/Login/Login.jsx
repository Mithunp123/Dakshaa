import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Loader2, 
  Shield, 
  QrCode, 
  Users, 
  UserCog,
  ShieldCheck,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

// Role information for display
const roleInfo = {
  student: {
    icon: Users,
    label: 'Student',
    color: 'blue',
    description: 'Access events, view registrations, and get your QR code',
    redirect: '/'
  },
  super_admin: {
    icon: ShieldCheck,
    label: 'Super Admin',
    color: 'red',
    description: 'Full system access, manage users, events, and settings',
    redirect: '/admin'
  },
  registration_admin: {
    icon: UserCog,
    label: 'Registration Admin',
    color: 'yellow',
    description: 'Approve cash payments, on-spot registration, ticket support',
    redirect: '/admin/desk'
  },
  event_coordinator: {
    icon: Shield,
    label: 'Event Coordinator',
    color: 'purple',
    description: 'Scan QR codes, mark attendance, select winners for assigned events',
    redirect: '/coordinator'
  },
  volunteer: {
    icon: QrCode,
    label: 'Volunteer',
    color: 'green',
    description: 'Verify gate passes, distribute kits, guide participants',
    redirect: '/volunteer'
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLoginSuccess(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Fetch user role and name from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Could not fetch user profile');
        setLoading(false);
        return;
      }

      const role = profile?.role || 'student';
      const info = roleInfo[role] || roleInfo.student;
      
      // Show success message with role info
      setLoginSuccess({
        role,
        name: profile?.full_name || 'User',
        info
      });

      // Wait briefly to show success state, then redirect
      setTimeout(() => {
        // Redirect based on role
        if (role === 'super_admin') {
          navigate('/admin');
        } else if (role === 'registration_admin') {
          navigate('/admin/desk');
        } else if (role === 'event_coordinator') {
          navigate('/coordinator');
        } else if (role === 'volunteer') {
          navigate('/volunteer');
        } else {
          navigate('/');
        }
      }, 1500);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen min-h-screen-safe flex items-center justify-center bg-gray-900 p-4 pt-20 pb-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 mx-auto"
      >
        {/* Success State */}
        <AnimatePresence>
          {loginSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-6 sm:py-8"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-${loginSuccess.info.color}-500/20 flex items-center justify-center`}>
                <CheckCircle2 className={`w-8 h-8 sm:w-10 sm:h-10 text-${loginSuccess.info.color}-500`} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome, {loginSuccess.name}!</h3>
              <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-${loginSuccess.info.color}-500/20 border border-${loginSuccess.info.color}-500/40`}>
                <loginSuccess.info.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${loginSuccess.info.color}-500`} />
                <span className={`font-bold text-sm sm:text-base text-${loginSuccess.info.color}-500`}>{loginSuccess.info.label}</span>
              </div>
              <p className="text-gray-400 mt-4 text-xs sm:text-sm">Redirecting to your dashboard...</p>
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-500 mx-auto mt-3" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        {!loginSuccess && (
          <>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Welcome Back</h2>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Sign in to your DaKshaa account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 sm:py-3.5 pl-12 pr-4 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="student@college.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 sm:py-3.5 pl-12 pr-4 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Staff/Admin Role Info Toggle */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowRoleInfo(!showRoleInfo)}
                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all text-sm py-2"
              >
                <Shield className="w-4 h-4" />
                Staff/Admin Login Info
                <ChevronDown className={`w-4 h-4 transition-transform ${showRoleInfo ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showRoleInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-3 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                      <p className="text-xs text-gray-500 mb-3">
                        Admin roles are assigned by Super Admins. Use your assigned credentials to access your dashboard.
                      </p>
                      
                      {/* Event Coordinator */}
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <Shield className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-purple-400 text-sm">Event Coordinator</p>
                          <p className="text-xs text-gray-400 mt-1">QR scanning, attendance marking, winner selection</p>
                        </div>
                      </div>

                      {/* Registration Admin */}
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <UserCog className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-yellow-400 text-sm">Registration Admin</p>
                          <p className="text-xs text-gray-400 mt-1">Cash payment approval, on-spot registration</p>
                        </div>
                      </div>

                      {/* Volunteer */}
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <QrCode className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-green-400 text-sm">Volunteer</p>
                          <p className="text-xs text-gray-400 mt-1">Gate pass verification, kit distribution</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-4 text-center">
                        Contact your Super Admin to get role access assigned.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Don't have an account? <Link to="/signup" className="text-blue-400 hover:underline">Register here</Link>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
