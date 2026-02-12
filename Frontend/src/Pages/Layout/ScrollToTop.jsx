import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowUp } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Handle scroll button visibility
  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // Prevent division by zero and NaN
      const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (scrolled / maxScroll) * 100)) : 0;
      
      setScrollProgress(progress);
      setIsVisible(scrolled > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          className="fixed bottom-[9.75rem] md:bottom-24 right-4 md:right-6 z-50 group"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0, rotate: 180 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {/* Progress ring */}
          <svg className="w-12 h-12 md:w-14 md:h-14 -rotate-90">
            {/* Background ring */}
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="rgba(14, 165, 233, 0.2)"
              strokeWidth="3"
              className="md:hidden"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="rgba(14, 165, 233, 0.2)"
              strokeWidth="3"
              className="hidden md:block"
            />
            {/* Progress ring */}
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="url(#scrollGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - (isNaN(scrollProgress) ? 0 : scrollProgress) / 100)}
              transition={{ duration: 0.2 }}
              className="md:hidden"
            />
            <motion.circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="url(#scrollGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 24}
              strokeDashoffset={2 * Math.PI * 24 * (1 - (isNaN(scrollProgress) ? 0 : scrollProgress) / 100)}
              transition={{ duration: 0.2 }}
              className="hidden md:block"
            />
            <defs>
              <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Button center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-sky-900/90 backdrop-blur-sm rounded-full border border-sky-700/50 group-hover:border-cyan-400 group-hover:bg-sky-800 transition-colors">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <FaArrowUp className="text-cyan-400 text-base md:text-lg group-hover:text-white transition-colors" />
              </motion.div>
            </div>
          </div>
          
          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
