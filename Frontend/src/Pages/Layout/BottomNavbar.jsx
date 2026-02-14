import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, ShieldCheck, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: ShieldCheck, label: 'Verify', path: '/verify' },
    { icon: User, label: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-slate-950/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 relative min-w-[60px] min-h-[44px] justify-center touch-manipulation"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-secondary bg-secondary/10' 
                    : 'text-gray-400 active:bg-white/5'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className={`text-[10px] font-orbitron uppercase tracking-tight transition-colors ${
                isActive ? 'text-secondary font-bold' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_10px_#22d3ee]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavbar;
