import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  QrCode, 
  CreditCard, 
  Calendar, 
  User,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  CalendarCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../supabase';
import NotificationDropdown from './NotificationDropdown';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check sessionStorage first for faster load
          const cachedProfile = sessionStorage.getItem('userProfile');
          if (cachedProfile) {
            setUserProfile(JSON.parse(cachedProfile));
            setLoading(false);
            return;
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, role')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setUserProfile(profile);
            sessionStorage.setItem('userProfile', JSON.stringify(profile));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = useMemo(() => [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Registrations', icon: ClipboardList, path: '/dashboard/registrations' },
    { label: 'My Teams', icon: Users, path: '/dashboard/teams' },
    { label: 'Attendance QR', icon: QrCode, path: '/dashboard/qr' },
    { label: 'Bookings', icon: CalendarCheck, path: '/dashboard/bookings' },
    { label: 'Payments', icon: CreditCard, path: '/dashboard/payments' },
    { label: 'Event Schedule', icon: Calendar, path: '/dashboard/schedule' },
    { label: 'Profile Settings', icon: User, path: '/dashboard/profile' },
  ], []);

  const handleLogout = async () => {
    sessionStorage.removeItem('userProfile'); // Clear cache on logout
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen min-h-screen-safe bg-slate-950 text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/50 border-r border-white/10 backdrop-blur-xl fixed h-full z-40">
        <div className="p-4 xl:p-6">
          <h2 className="text-xl xl:text-2xl font-bold font-orbitron text-secondary">DASHBOARD</h2>
        </div>
        
        <nav className="flex-1 px-3 xl:px-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-secondary text-white shadow-lg shadow-secondary/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                <span className="font-medium text-sm xl:text-base">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 xl:p-4 border-t border-white/10 space-y-1.5">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
            <span className="font-medium text-sm xl:text-base">Back to Site</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm xl:text-base">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 sm:h-16 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-3 sm:px-4 safe-area-top">
        <h2 className="text-lg sm:text-xl font-bold font-orbitron text-secondary truncate">DASHBOARD</h2>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors touch-manipulation"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] sm:w-72 bg-slate-900 z-50 lg:hidden flex flex-col shadow-2xl safe-area-right"
            >
              <div className="p-4 sm:p-6 flex items-center justify-between border-b border-white/10">
                <h2 className="text-lg sm:text-xl font-bold font-orbitron text-secondary">MENU</h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors touch-manipulation"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
              
              <nav className="flex-1 p-3 sm:p-4 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all touch-manipulation ${
                        isActive 
                          ? 'bg-secondary text-white' 
                          : 'text-gray-400 hover:bg-white/5 active:bg-white/10'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-3 sm:p-4 border-t border-white/10 space-y-1.5 safe-area-bottom">
                <button 
                  onClick={() => navigate('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 active:bg-white/10 touch-manipulation"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Back to Site</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 active:bg-red-500/20 touch-manipulation"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen min-h-screen-safe flex flex-col">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 xl:h-20 bg-slate-900/30 border-b border-white/10 backdrop-blur-md sticky top-0 z-30 items-center justify-between px-4 xl:px-8">
          <div className="flex items-center gap-4 xl:gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] xl:text-xs text-gray-500 uppercase tracking-widest font-bold">Event Countdown</span>
              <span className="text-secondary font-orbitron font-bold text-sm xl:text-base">Day 1: 02:14:45</span>
            </div>
          </div>

          <div className="flex items-center gap-4 xl:gap-6">
            <NotificationDropdown />

            <div className="flex items-center gap-2 xl:gap-3 pl-4 xl:pl-6 border-l border-white/10">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-bold">{userProfile?.full_name || 'Loading...'}</p>
                <p className="text-[10px] text-secondary uppercase font-bold">{userProfile?.role || 'Student'}</p>
              </div>
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-secondary to-primary p-0.5">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.full_name || 'User'}`} alt="Avatar" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full mt-14 lg:mt-0 pb-20 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
