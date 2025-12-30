import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: Clock, label: 'Schedule', path: '/schedule' },
    { icon: User, label: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-slate-950/90 backdrop-blur-lg border-t border-white/10 px-6 py-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 relative"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-colors ${
                  isActive ? 'text-secondary' : 'text-gray-400'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className={`text-[10px] font-orbitron uppercase tracking-tighter ${
                isActive ? 'text-secondary font-bold' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-3 w-1 h-1 bg-secondary rounded-full shadow-[0_0_10px_#22d3ee]"
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
