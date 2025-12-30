import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowUp } from 'react-icons/fa';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / maxScroll) * 100;
      
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
          className="fixed bottom-8 right-8 z-50 group"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0, rotate: 180 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {/* Progress ring */}
          <svg className="w-14 h-14 -rotate-90">
            {/* Background ring */}
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="rgba(14, 165, 233, 0.2)"
              strokeWidth="3"
            />
            {/* Progress ring */}
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
            <div className="w-10 h-10 flex items-center justify-center bg-sky-900/90 backdrop-blur-sm rounded-full border border-sky-700/50 group-hover:border-cyan-400 group-hover:bg-sky-800 transition-colors">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <FaArrowUp className="text-cyan-400 text-lg group-hover:text-white transition-colors" />
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
