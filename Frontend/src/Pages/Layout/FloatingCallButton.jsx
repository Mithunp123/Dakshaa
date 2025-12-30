import React from 'react';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';

const FloatingCallButton = () => {
  const phoneNumber = "9489243775";

  return (
    <motion.a
      href={`tel:${phoneNumber}`}
      className="fixed bottom-24 md:bottom-8 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-green-500/50 transition-shadow duration-300 lg:bottom-8 lg:right-8"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title="Call Us"
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
        <Phone size={28} fill="currentColor" />
      </motion.div>
      
      {/* Pulsing effect */}
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 pointer-events-none"></span>
    </motion.a>
  );
};

export default FloatingCallButton;
