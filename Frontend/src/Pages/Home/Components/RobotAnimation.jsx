import React from 'react';
import { motion } from 'framer-motion';

const RobotAnimation = () => {
  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="relative w-full max-w-[500px] aspect-square">
        {/* Floating Effect Container */}
        <motion.div
          className="w-full h-full"
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-[0_0_50px_rgba(14,165,233,0.3)]"
          >
            <defs>
              <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Robot Head */}
            <rect
              x="60" y="40" width="80" height="70" rx="15"
              fill="#0f172a"
              stroke="url(#robotGradient)"
              strokeWidth="2"
            />
            
            {/* Eye Visor */}
            <rect x="65" y="55" width="70" height="25" rx="5" fill="#1e293b" />
            
            {/* Eyes */}
            <motion.circle
              cx="85" cy="67" r="5"
              fill="#0ea5e9"
              filter="url(#glow)"
              animate={{
                opacity: [1, 0.4, 1],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="115" cy="67" r="5"
              fill="#0ea5e9"
              filter="url(#glow)"
              animate={{
                opacity: [1, 0.4, 1],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            />

            {/* Antenna */}
            <line x1="100" y1="40" x2="100" y2="20" stroke="url(#robotGradient)" strokeWidth="2" />
            <motion.circle
              cx="100" cy="20" r="4"
              fill="#0ea5e9"
              filter="url(#glow)"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />

            {/* Body */}
            <rect
              x="50" y="115" width="100" height="60" rx="10"
              fill="#0f172a"
              stroke="url(#robotGradient)"
              strokeWidth="2"
            />

            {/* Chest Panel */}
            <rect x="65" y="125" width="70" height="40" rx="5" fill="#1e293b" />
            
            {/* Animated Data Bars */}
            {[0, 1, 2].map((i) => (
              <motion.rect
                key={i}
                x={75 + i * 20}
                y={135}
                width="10"
                height="20"
                rx="2"
                fill="#0ea5e9"
                animate={{
                  height: [5, 20, 5],
                  y: [150, 135, 150],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}

            {/* Shoulders/Arms */}
            <circle cx="50" cy="130" r="8" fill="#1e293b" stroke="url(#robotGradient)" strokeWidth="1" />
            <circle cx="150" cy="130" r="8" fill="#1e293b" stroke="url(#robotGradient)" strokeWidth="1" />

            {/* Scanning Line */}
            <motion.line
              x1="65" y1="55" x2="135" y2="55"
              stroke="#0ea5e9"
              strokeWidth="1"
              filter="url(#glow)"
              animate={{
                y: [0, 25, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Circuit Lines on Background */}
            <g opacity="0.2">
              <path d="M20,50 L40,50 L50,40" stroke="#0ea5e9" fill="none" strokeWidth="1" />
              <path d="M180,50 L160,50 L150,40" stroke="#0ea5e9" fill="none" strokeWidth="1" />
              <path d="M20,150 L40,150 L50,160" stroke="#0ea5e9" fill="none" strokeWidth="1" />
              <path d="M180,150 L160,150 L150,160" stroke="#0ea5e9" fill="none" strokeWidth="1" />
            </g>
          </svg>
        </motion.div>

        {/* Orbiting Particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full"
            animate={{
              rotate: 360,
              x: [100, 120, 100],
              y: [0, 20, 0],
            }}
            style={{
              marginLeft: '-4px',
              marginTop: '-4px',
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default RobotAnimation;
