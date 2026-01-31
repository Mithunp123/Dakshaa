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
  Trophy,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import { useAuth } from '../../Components/AuthProvider';

// Role display information
const roleDisplayInfo = {
  super_admin: { label: 'Super Admin', color: 'red', icon: ShieldCheck },
  registration_admin: { label: 'Registration Admin', color: 'yellow', icon: UserCog },
  event_coordinator: { label: 'Event Coordinator', color: 'purple', icon: Shield },
  volunteer: { label: 'Volunteer', color: 'green', icon: QrCode }
};

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use centralized auth to persist role across refreshes
  const { user, role: authRole, logout } = useAuth();
  const [userRole, setUserRole] = useState(authRole);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Use authRole from context if available, otherwise check manually
    // Wait for AuthProvider to finish loading to avoid race condition
    if (authRole && authRole !== 'student') {
      setUserRole(authRole);
      setLoading(false);
      // Still fetch name if not available
      if (user && !userName) {
        fetchUserName(user.id);
      }
    } else if (user) {
      // Check localStorage for cached role first (instant check)
      const cachedRole = localStorage.getItem('userRole');
      if (cachedRole && cachedRole !== 'student') {
        setUserRole(cachedRole);
        setLoading(false);
        if (!userName) {
          fetchUserName(user.id);
        }
      } else {
        // Fetch from DB (role might not be in cache yet or context hasn't updated)
        checkUserRole();
      }
    } else if (!user) {
      navigate('/login');
    }
  }, [user, authRole]);

  const fetchUserName = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    if (profile?.full_name) {
      setUserName(profile.full_name);
    }
  };

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const checkUserRole = async () => {
    try {
      // Use the user from context
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

    // Event coordinator gets their own restricted menu items (not added for super_admin)
    if (userRole === 'event_coordinator') {
      items.push(
        { label: 'Overview', icon: LayoutDashboard, path: '/admin/coordinator/overview' },
        { label: 'Registration Management', icon: ClipboardList, path: '/admin/coordinator/registration' },
        { label: 'Global Scanner', icon: QrCode, path: '/admin/coordinator/global-scanner' },
        { label: 'Attendance Scanner', icon: Shield, path: '/admin/coordinator' }
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
    await logout();
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-6 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            aria-label="Toggle Menu"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-3">
             <span className="text-xl font-bold font-orbitron text-secondary">DAKSHAA</span>
             <span className="hidden md:inline px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400 border border-white/10">v2.0</span>
          </div>
        </div>

        {/* User Profile in Header */}
        <div className="flex items-center gap-4">
             {userRole && roleDisplayInfo[userRole] && (
               <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <div className={`p-1 rounded-full bg-${roleDisplayInfo[userRole].color}-500/20`}>
                    {React.createElement(roleDisplayInfo[userRole].icon, { 
                      size: 14, 
                      className: `text-${roleDisplayInfo[userRole].color}-500` 
                    })}
                  </div>
                  <span className="text-sm font-medium text-gray-300">{userName}</span>
               </div>
             )}
        </div>
      </header>

      <div className="flex flex-1 pt-16 h-screen overflow-hidden">
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{
            x: isSidebarOpen ? 0 : -280,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`
            fixed top-16 bottom-0 left-0 z-[100]
            w-64 bg-slate-900/95 lg:bg-slate-900/80 
            border-r border-white/10 backdrop-blur-xl 
            flex flex-col
            shadow-2xl lg:shadow-none
          `}
        >
          {/* Mobile User Info (visible in sidebar on mobile since header might be small) */}
          <div className="md:hidden p-4 border-b border-white/10">
             {userRole && roleDisplayInfo[userRole] && (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-${roleDisplayInfo[userRole].color}-500/20 flex items-center justify-center`}>
                    {React.createElement(roleDisplayInfo[userRole].icon, { 
                      size: 16, 
                      className: `text-${roleDisplayInfo[userRole].color}-500` 
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <p className={`text-xs text-${roleDisplayInfo[userRole].color}-400`}>{roleDisplayInfo[userRole].label}</p>
                  </div>
                </div>
              )}
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {getMenuItems().map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                    isActive 
                      ? 'bg-secondary text-white shadow-lg shadow-secondary/20 font-medium' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-white' : 'group-hover:text-secondary'} />
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto opacity-70" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </motion.aside>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
              style={{ top: '64px' }}
            />
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main 
          className={`
            flex-1 overflow-y-auto relative bg-slate-950
            transition-all duration-300 ease-in-out
            ${!isMobile && isSidebarOpen ? 'lg:ml-64' : ''}
          `}
        >
          <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
