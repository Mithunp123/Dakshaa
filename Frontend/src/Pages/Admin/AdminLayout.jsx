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
  Package
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkUserRole();
  }, []);

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
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900/50 border-r border-white/10 backdrop-blur-xl transition-all duration-300 flex flex-col fixed h-full z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold font-orbitron text-secondary"
            >
              DAKSHAA ADMIN
            </motion.h2>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* User Role Badge */}
        {userRole && roleDisplayInfo[userRole] && (
          <div className={`mx-4 mb-4 p-3 rounded-xl bg-${roleDisplayInfo[userRole].color}-500/10 border border-${roleDisplayInfo[userRole].color}-500/20`}>
            {isSidebarOpen ? (
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
            ) : (
              <div className="flex justify-center">
                {React.createElement(roleDisplayInfo[userRole].icon, { 
                  size: 20, 
                  className: `text-${roleDisplayInfo[userRole].color}-500` 
                })}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {getMenuItems().map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-secondary text-white shadow-lg shadow-secondary/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-secondary'} />
                {isSidebarOpen && (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                )}
                {isActive && isSidebarOpen && (
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
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
