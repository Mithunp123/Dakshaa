import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  CreditCard, 
  Search, 
  QrCode,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  UserCog,
  DollarSign,
  Mail,
  Clock,
  Bed,
  Radio,
  ShieldCheck,
  Package,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';

// Role display information
const roleDisplayInfo = {
  super_admin: { label: 'Super Admin', color: 'red', icon: ShieldCheck },
  registration_admin: { label: 'Registration Admin', color: 'yellow', icon: UserCog },
  event_coordinator: { label: 'Event Coordinator', color: 'purple', icon: Shield },
  volunteer: { label: 'Volunteer', color: 'green', icon: QrCode }
};

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkUserRole();
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role === 'student') {
        navigate('/dashboard');
        return;
      }

      setUserRole(profile.role);
      setUserName(profile.full_name || 'Admin User');
    } catch (error) {
      console.error('Error checking role:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getMenuItems = () => {
    const items = [];
    
    if (userRole === 'super_admin') {
      items.push(
        { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
        { label: 'Role Management', icon: ShieldCheck, path: '/admin/roles' },
        { label: 'Event Config', icon: Settings, path: '/admin/events' },
        { label: 'Combo Packages', icon: Package, path: '/admin/combos' },
        { label: 'User Manager', icon: Users, path: '/admin/users' },
        { label: 'Finance', icon: CreditCard, path: '/admin/finance' },
        { label: 'Registration Management', icon: UserCog, path: '/admin/registrations' },
        { label: 'Finance Module', icon: DollarSign, path: '/admin/finance-module' },
        { label: 'Participant CRM', icon: Mail, path: '/admin/crm' },
        { label: 'Waitlist', icon: Clock, path: '/admin/waitlist' },
        { label: 'Accommodation', icon: Bed, path: '/admin/accommodation' },
        { label: 'Referrals', icon: Trophy, path: '/admin/referrals' },
        { label: 'Event Controller', icon: Radio, path: '/admin/event-controller' }
      );
    }

    if (userRole === 'registration_admin' || userRole === 'super_admin') {
      items.push(
        { label: 'Registration Desk', icon: Search, path: '/admin/desk' }
      );
    }

    if (userRole === 'event_coordinator' || userRole === 'super_admin') {
      items.push(
        { label: 'Coordinator Panel', icon: Shield, path: '/coordinator' }
      );
    }

    if (userRole === 'volunteer' || userRole === 'super_admin') {
      items.push(
        { label: 'Global Scanner', icon: QrCode, path: '/volunteer' }
      );
    }

    return items;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:bg-slate-800 transition-all"
      >
        <Menu size={24} className="text-secondary" />
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : -280,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`${
          isSidebarOpen ? 'w-64' : 'w-64'
        } bg-slate-900/95 lg:bg-slate-900/50 border-r border-white/10 backdrop-blur-xl flex flex-col fixed h-full z-50 lg:translate-x-0 shadow-2xl lg:shadow-none`}
      >
        <div className="p-6 flex items-center justify-between">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold font-orbitron text-secondary"
          >
            DAKSHAA ADMIN
          </motion.h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Role Badge */}
        {userRole && roleDisplayInfo[userRole] && (
          <div className={`mx-4 mb-4 p-3 rounded-xl bg-${roleDisplayInfo[userRole].color}-500/10 border border-${roleDisplayInfo[userRole].color}-500/20`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${roleDisplayInfo[userRole].color}-500/20 flex items-center justify-center`}>
                {React.createElement(roleDisplayInfo[userRole].icon, { 
                  size: 20, 
                  className: `text-${roleDisplayInfo[userRole].color}-500` 
                })}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{userName}</p>
                <p className={`text-xs text-${roleDisplayInfo[userRole].color}-400`}>
                  {roleDisplayInfo[userRole].label}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {getMenuItems().map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-secondary text-white shadow-lg shadow-secondary/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-secondary'} />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
                {isActive && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 w-full lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
