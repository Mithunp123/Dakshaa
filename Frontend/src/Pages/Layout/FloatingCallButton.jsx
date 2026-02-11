import React from 'react';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';

const FloatingCallButton = () => {
  const phoneNumber = "8891850995";

  return (
    <motion.a
      href={`tel:${phoneNumber}`}
      className="fixed bottom-[5.5rem] md:bottom-8 right-4 md:right-6 lg:right-8 z-50 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-green-500/50 transition-shadow duration-300 touch-manipulation"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title="Call Us"
      aria-label="Call us"
    >
      <motion.div
        animate={{
          rotate: [0, -10, 10, -10, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        <Phone size={24} className="md:w-7 md:h-7" fill="currentColor" />
      </motion.div>
      
      {/* Pulsing effect */}
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 pointer-events-none"></span>
    </motion.a>
  );
};

export default FloatingCallButton;
