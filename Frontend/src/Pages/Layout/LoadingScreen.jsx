import React from 'react';
import { motion } from 'framer-motion';
import logo from "../../assets/logo1.png";

// Cyber Loading Screen with multiple animation styles
const LoadingScreen = ({ variant = 'cyber', text = 'Loading...' }) => {
  const variants = {
    cyber: <CyberLoader text={text} />,
    pulse: <PulseLoader text={text} />,
    matrix: <MatrixLoader text={text} />,
    circuit: <CircuitLoader text={text} />,
    wave: <WaveLoader text={text} />,
    glitch: <GlitchLoader text={text} />,
  };

  return variants[variant] || variants.cyber;
};

// Cyber Loader - Logo centered with tech rings
const CyberLoader = ({ text }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-sky-950 to-gray-900 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex items-center justify-center">
        {/* Outer spinning ring with gaps */}
        <motion.div
          className="absolute w-64 h-64 border-4 border-sky-500/20 rounded-full border-t-sky-400 border-b-sky-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Middle dashed ring */}
        <motion.div
          className="absolute w-56 h-56 border-2 border-dashed border-cyan-400/30 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner glowing ring */}
        <motion.div
          className="absolute w-48 h-48 border border-sky-400/50 rounded-full shadow-[0_0_30px_rgba(14,165,233,0.3)]"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Logo Container */}
        <motion.div
          className="relative z-10 w-40 h-40 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.img 
            src={logo} 
            alt="Dakshaa Logo" 
            className="w-full h-auto drop-shadow-[0_0_15px_rgba(14,165,233,0.8)]"
            animate={{
              filter: [
                "drop-shadow(0 0 10px rgba(14, 165, 233, 0.5))",
                "drop-shadow(0 0 25px rgba(14, 165, 233, 0.8))",
                "drop-shadow(0 0 10px rgba(14, 165, 233, 0.5))",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Scanning line effect */}
        <motion.div
          className="absolute w-64 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-50 z-20"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ top: '50%' }}
        />
      </div>
      
      {/* Loading text with glitch effect */}
      <div className="mt-16 relative">
        <motion.p
          className="text-2xl font-orbitron text-sky-400 tracking-[0.5em] uppercase font-bold"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.p>
        
        {/* Progress bar */}
        <div className="mt-4 w-64 h-1 bg-sky-900/50 rounded-full overflow-hidden border border-sky-800/30">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-600 to-cyan-400"
            animate={{ 
              width: ['0%', '100%'],
              left: ['-100%', '0%']
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-10 font-mono text-[10px] text-sky-500/40 space-y-1">
        <p>SYSTEM_STATUS: INITIALIZING</p>
        <p>CORE_TEMP: 32°C</p>
        <p>ENCRYPTION: ACTIVE</p>
      </div>
      <div className="absolute bottom-10 right-10 font-mono text-[10px] text-sky-500/40 text-right space-y-1">
        <p>DAKSHAA_OS v2.0</p>
        <p>CONNECTION: SECURE</p>
        <p>LATENCY: 12ms</p>
      </div>
    </motion.div>
  );
};

// Pulse Loader - Expanding circles
const PulseLoader = ({ text }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-sky-950 to-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative w-24 h-24">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 border-2 border-sky-400 rounded-full"
            animate={{
              scale: [1, 2.5],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut',
            }}
          />
        ))}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-full shadow-xl shadow-sky-500/50" />
        </motion.div>
      </div>
      
      <motion.p
        className="mt-10 text-lg font-poppins text-sky-300 tracking-wide"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </motion.div>
  );
};

// Matrix Loader - Falling code effect
const MatrixLoader = ({ text }) => {
  const columns = 20;
  const chars = '01アイウエオカキクケコ'.split('');
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Matrix rain */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(columns)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-green-500 text-xs font-mono"
            style={{ left: `${(i / columns) * 100}%` }}
            initial={{ y: '-100%' }}
            animate={{ y: '100vh' }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'linear',
            }}
          >
            {[...Array(20)].map((_, j) => (
              <div key={j} className="leading-tight">
                {chars[Math.floor(Math.random() * chars.length)]}
              </div>
            ))}
          </motion.div>
        ))}
      </div>
      
      {/* Center content */}
      <motion.div
        className="relative z-10 text-4xl font-orbitron text-cyan-400"
        animate={{ 
          textShadow: [
            '0 0 10px #0ea5e9, 0 0 20px #0ea5e9',
            '0 0 20px #06b6d4, 0 0 40px #06b6d4',
            '0 0 10px #0ea5e9, 0 0 20px #0ea5e9',
          ]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        DAKSHAA
      </motion.div>
      
      <motion.p
        className="mt-6 text-green-400 font-mono tracking-widest"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </motion.div>
  );
};

// Circuit Loader - Electric circuit paths
const CircuitLoader = ({ text }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-sky-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Circuit paths */}
          <motion.path
            d="M50 10 L50 30 L70 30 L70 50 L90 50"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2"
            strokeDasharray="100"
            animate={{ strokeDashoffset: [100, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.path
            d="M10 50 L30 50 L30 70 L50 70 L50 90"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="100"
            animate={{ strokeDashoffset: [100, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
          <motion.path
            d="M50 10 L50 30 L30 30 L30 50 L10 50"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeDasharray="100"
            animate={{ strokeDashoffset: [100, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          />
          <motion.path
            d="M90 50 L70 50 L70 70 L50 70 L50 90"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeDasharray="100"
            animate={{ strokeDashoffset: [100, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
          />
          
          {/* Center node */}
          <motion.circle
            cx="50"
            cy="50"
            r="8"
            fill="#0ea5e9"
            animate={{ r: [8, 12, 8] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          
          {/* Corner nodes */}
          {[[50, 10], [90, 50], [50, 90], [10, 50]].map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x || 0}
              cy={y || 0}
              r="4"
              fill="#06b6d4"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </svg>
      </div>
      
      <motion.p
        className="mt-6 text-lg font-orbitron text-cyan-400 tracking-wider"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </motion.div>
  );
};

// Wave Loader - Audio wave animation
const WaveLoader = ({ text }) => {
  const bars = 12;
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-end gap-1 h-20">
        {[...Array(bars)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 bg-gradient-to-t from-sky-500 to-purple-500 rounded-full"
            animate={{
              height: [20, 60 + Math.random() * 20, 20],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      
      <motion.p
        className="mt-8 text-xl font-poppins text-purple-300 tracking-wide"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </motion.div>
  );
};

// Glitch Loader - Cyberpunk glitch effect
const GlitchLoader = ({ text }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Glitch lines */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-full h-[2px] bg-cyan-500/30"
          style={{ top: `${Math.random() * 100}%` }}
          animate={{
            scaleX: [0, 1, 0],
            x: ['-100%', '100%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
            delay: Math.random(),
          }}
        />
      ))}
      
      {/* Main text with glitch effect */}
      <div className="relative">
        <motion.h1
          className="text-5xl font-orbitron text-white relative z-10"
          animate={{
            x: [0, -3, 3, -3, 0],
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          DAKSHAA
        </motion.h1>
        
        {/* Glitch copies */}
        <motion.h1
          className="absolute inset-0 text-5xl font-orbitron text-cyan-500 z-0"
          animate={{
            x: [0, 5, -5, 0],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          DAKSHAA
        </motion.h1>
        <motion.h1
          className="absolute inset-0 text-5xl font-orbitron text-red-500 z-0"
          animate={{
            x: [0, -5, 5, 0],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
            repeatDelay: 3,
            delay: 0.1,
          }}
        >
          DAKSHAA
        </motion.h1>
      </div>
      
      <motion.p
        className="mt-8 text-cyan-400 font-mono tracking-widest"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {text}
      </motion.p>
      
      {/* Scanlines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
        }}
      />
    </motion.div>
  );
};

export default LoadingScreen;

// Export individual loaders
export { CyberLoader, PulseLoader, MatrixLoader, CircuitLoader, WaveLoader, GlitchLoader };
