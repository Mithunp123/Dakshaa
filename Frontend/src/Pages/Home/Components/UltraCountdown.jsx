import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import warning from "../../../assets/warning.svg";

// Individual Digit Flip Component
const FlipDigit = ({ value, label }) => {
  return (
    <motion.div
      className="relative flex flex-col items-center mx-1 sm:mx-2 md:mx-3"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {/* Label */}
      <span className="text-[10px] sm:text-xs md:text-sm font-orbitron uppercase text-cyan-300 mb-2 tracking-wider">
        {label}
      </span>
      
      {/* Digit Container */}
      <motion.div
        className="relative"
        key={value}
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-lg" />
        
        {/* Digit box */}
        <div className="relative bg-gradient-to-b from-sky-900 to-sky-950 border border-sky-700/50 rounded-lg p-2 sm:p-3 md:p-4 min-w-[50px] sm:min-w-[70px] md:min-w-[90px]">
          {/* Top shine */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-lg" />
          
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/30" />
          
          {/* Digit */}
          <motion.span
            className="block text-center text-3xl sm:text-5xl md:text-6xl font-digital font-bold text-white"
            style={{
              textShadow: "0 0 20px rgba(14, 165, 233, 0.8), 0 0 40px rgba(14, 165, 233, 0.4)",
            }}
          >
            {value}
          </motion.span>
        </div>
        
        {/* Bottom reflection */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-cyan-500/10 blur-md rounded-full" />
      </motion.div>
    </motion.div>
  );
};

// Separator Component
const TimeSeparator = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-2 mx-1 mt-6"
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
      <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
    </motion.div>
  );
};

// Event Badge Component
const EventBadge = () => {
  return (
    <motion.div
      className="mb-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <motion.div
        className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-500/50 rounded-lg backdrop-blur-sm"
        animate={{
          boxShadow: [
            "0 0 10px rgba(239, 68, 68, 0.3)",
            "0 0 20px rgba(239, 68, 68, 0.5)",
            "0 0 10px rgba(239, 68, 68, 0.3)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.img
          className="w-6 sm:w-8"
          src={warning}
          alt="Event"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
        />
        <span className="text-red-300 font-orbitron text-sm sm:text-base tracking-wide">
          12th, 13th & 14th February, 2026
        </span>
      </motion.div>
    </motion.div>
  );
};

// Progress Bar Component
const CountdownProgress = ({ progress }) => {
  return (
    <div className="w-full max-w-md mt-6">
      <div className="flex justify-between text-xs text-sky-400 mb-2 font-poppins">
        <span>Event Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-sky-950 rounded-full overflow-hidden border border-sky-800/50">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }}
        />
      </div>
    </div>
  );
};

const UltraCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate next January 1st at 12:00 AM
    const now = new Date();
    const currentYear = now.getFullYear();
    let targetDate = new Date(`January 1, ${currentYear + 1} 00:00:00`);
    
    // If we're past Jan 1 of current year, target next year
    if (now > targetDate) {
      targetDate = new Date(`January 1, ${currentYear + 2} 00:00:00`);
    }
    
    const targetTime = targetDate.getTime();
    const startTime = new Date(`January 1, ${currentYear} 00:00:00`).getTime();
    const totalDuration = targetTime - startTime;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;
      const elapsed = now - startTime;
      
      // Calculate progress percentage
      setProgress(Math.min((elapsed / totalDuration) * 100, 100));

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => (num < 10 ? `0${num}` : num.toString());

  return (
    <motion.div
      className="flex flex-col items-center lg:items-start"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Event Badge */}
      <EventBadge />

      {/* Main Countdown Container */}
      <motion.div
        className="relative p-4 sm:p-6 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(7, 89, 133, 0.3) 0%, rgba(12, 74, 110, 0.2) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl border border-sky-500/30" />
        
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-2xl" />

        {/* Title */}
        <motion.p
          className="text-center text-lg sm:text-xl font-orbitron text-cyan-300 mb-4 tracking-wider"
          animate={{
            textShadow: [
              "0 0 10px rgba(6, 182, 212, 0.5)",
              "0 0 20px rgba(6, 182, 212, 0.8)",
              "0 0 10px rgba(6, 182, 212, 0.5)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚡ Registration Begins In ⚡
        </motion.p>

        {/* Timer Grid */}
        <div className="flex items-center justify-center flex-wrap">
          <FlipDigit value={formatNumber(timeLeft.days)} label="Days" />
          <TimeSeparator />
          <FlipDigit value={formatNumber(timeLeft.hours)} label="Hours" />
          <TimeSeparator />
          <FlipDigit value={formatNumber(timeLeft.minutes)} label="Minutes" />
          <TimeSeparator />
          <FlipDigit value={formatNumber(timeLeft.seconds)} label="Seconds" />
        </div>

        {/* Progress Bar */}
        <CountdownProgress progress={progress} />
      </motion.div>

      {/* Animated particles around countdown */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default UltraCountdown;
