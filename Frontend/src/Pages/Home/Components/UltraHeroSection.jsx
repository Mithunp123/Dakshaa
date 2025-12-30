import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import HeroImg from "../../../assets/Heroimg.png";
import Daksha from "../../../assets/DaKshaa.png";
import UltraCountdown from "./UltraCountdown";
import RegisterAni from "../../../assets/registerani.gif";
import brochure from "../../../assets/brochure.pdf";
import RobotHero from "./RobotHero";

// Enhanced Glowing Text Animation
const glowAnimation = {
  animate: {
    filter: [
      "drop-shadow(0 0 10px rgba(14, 165, 233, 0.5))",
      "drop-shadow(0 0 25px rgba(14, 165, 233, 0.8))",
      "drop-shadow(0 0 40px rgba(6, 182, 212, 1))",
      "drop-shadow(0 0 25px rgba(14, 165, 233, 0.8))",
      "drop-shadow(0 0 10px rgba(14, 165, 233, 0.5))",
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Animated Grid Background
const CyberGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(14, 165, 233, 0.05) 50%, transparent 100%)',
        }}
        animate={{ y: ['-100%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

// Enhanced Floating particles with trails
const HeroParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: i % 3 === 0
              ? 'radial-gradient(circle, rgba(14, 165, 233, 1) 0%, rgba(14, 165, 233, 0) 70%)'
              : i % 3 === 1
                ? 'radial-gradient(circle, rgba(6, 182, 212, 1) 0%, rgba(6, 182, 212, 0) 70%)'
                : 'radial-gradient(circle, rgba(249, 115, 22, 1) 0%, rgba(249, 115, 22, 0) 70%)',
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Hexagonal Tech Pattern
const HexPattern = () => {
  return (
    <motion.div
      className="absolute right-0 top-1/4 w-96 h-96 opacity-10 pointer-events-none hidden lg:block"
      initial={{ opacity: 0, rotate: -30 }}
      animate={{ opacity: 0.1, rotate: 0 }}
      transition={{ duration: 2 }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {[...Array(7)].map((_, i) => (
          <motion.polygon
            key={i}
            points="100,10 170,55 170,145 100,190 30,145 30,55"
            fill="none"
            stroke="url(#hexGrad)"
            strokeWidth="0.5"
            transform={`scale(${0.3 + i * 0.12}) translate(${100 - (0.3 + i * 0.12) * 100}, ${100 - (0.3 + i * 0.12) * 100})`}
            animate={{
              rotate: [0, 360],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5
            }}
          />
        ))}
        <defs>
          <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
};

// Animated Cyber Button with enhanced effects
const CyberButton = ({ children, onClick, variant = "primary", className = "" }) => {
  const baseStyles = "relative px-8 py-3 font-orbitron text-sm tracking-wider uppercase overflow-hidden group cursor-pointer";

  const variants = {
    primary: "bg-gradient-to-r from-sky-600 to-cyan-600 text-white",
    secondary: "bg-transparent border-2 border-sky-500 text-sky-400",
    accent: "bg-gradient-to-r from-orange-500 to-sky-600 text-white",
  };

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(14, 165, 233, 0.5)" }}
      whileTap={{ scale: 0.95 }}
      style={{ clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)" }}
    >
      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: "-200%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* Pulse effect on hover */}
      <motion.div
        className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100"
        animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      <span className="relative z-10 flex items-center gap-2">
        {children}
        <motion.span
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          →
        </motion.span>
      </span>
    </motion.button>
  );
};

// Animated Stats Card with glassmorphism
const StatsCard = ({ detail, onClick, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{
        scale: 1.1,
        y: -8,
        boxShadow: "0 20px 40px rgba(14, 165, 233, 0.3)",
      }}
      whileTap={{ scale: 0.95 }}
      className="relative cursor-pointer group"
      onClick={onClick}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-orange-500 rounded-lg blur-lg opacity-0 group-hover:opacity-75"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />

      {/* Card content */}
      <div className="relative bg-gradient-to-br from-sky-900/90 to-sky-950/90 backdrop-blur-xl border border-sky-500/30 rounded-lg px-6 py-4 overflow-hidden">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

        {/* Animated background line */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        <motion.span
          className="relative z-10 text-white text-sm sm:text-base md:text-lg font-orbitron tracking-wider font-bold"
        >
          {detail}
        </motion.span>
      </div>
    </motion.div>
  );
};

// Floating Badge Component
const FloatingBadge = ({ text, position, delay }) => (
  <motion.div
    className={`absolute ${position} hidden lg:flex items-center gap-2 bg-sky-900/80 backdrop-blur-sm border border-sky-500/30 rounded-full px-4 py-2 z-20`}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
  >
    <motion.div
      className="w-2 h-2 bg-green-400 rounded-full"
      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    />
    <span className="text-sky-300 text-xs font-poppins">{text}</span>
  </motion.div>
);

const UltraHeroSection = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const eventDetails = ["3 DAYS", "20+ WORKSHOPS", "25+ EVENTS"];

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Stagger animation for children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  // Enhanced floating animation for hero image
  const floatAnimation = {
    animate: {
      y: [0, -25, 0],
      rotateY: [0, 8, 0, -8, 0],
      rotateX: [0, 3, 0, -3, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.section
      className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:px-12 pt-40 lg:pt-32 pb-10 overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background Elements */}
      <CyberGrid />
      <HeroParticles />
      <HexPattern />

      {/* Mouse follow glow */}
      <motion.div
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 hidden lg:block"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)',
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />



      {/* Brochure Download Button - Top Right */}
      <motion.div
        className="hidden md:flex absolute right-8 top-32 z-20"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <motion.a
          href={brochure}
          target="_blank"
          rel="noopener noreferrer"
          className="relative group flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full transition-all duration-300 overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Icon Container */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Download className="w-5 h-5 text-sky-400 group-hover:text-sky-300 transition-colors" />
            </motion.div>

            {/* Icon Pulse Effect */}
            <motion.div
              className="absolute inset-0 bg-sky-400/30 rounded-full -z-10"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-sky-400/80 font-orbitron leading-none mb-1">
              Event Guide
            </span>
            <span className="text-sm font-bold text-white font-orbitron tracking-wider leading-none">
              BROCHURE
            </span>
          </div>

          {/* Hover Border Glow */}
          <div className="absolute inset-0 border border-sky-500/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_15px_rgba(14,165,233,0.3)]" />
        </motion.a>
      </motion.div>

      {/* Left Content */}
      <motion.div
        className="flex flex-col items-center lg:items-start lg:ml-16 w-full lg:w-1/2 z-10 order-2 lg:order-1 mt-8 lg:mt-0"
        variants={containerVariants}
      >
        {/* Event Type Badge */}
        <motion.div
          variants={itemVariants}
          className="mb-2 flex items-center gap-2"
        >
        </motion.div>

        {/* Logo as Styled Text - Professional Medium Size */}
        <motion.div variants={itemVariants} className="mb-6 w-full">
          <div className="relative">
            {/* Main Title Container */}
            <div className="relative flex flex-col items-center lg:items-start">
              {/* Title Row */}
              <motion.div
                className="relative flex items-center justify-center lg:justify-start gap-2 sm:gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* DAKSHAA in white */}
                <h1
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron font-bold text-white tracking-wide"
                  style={{
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  DAKSHAA
                </h1>

                {/* T26 with cyan gradient */}
                <h1
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron font-bold tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 2px 8px rgba(6, 182, 212, 0.3))',
                  }}
                >
                  T26
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                className="mt-3 text-sm sm:text-base text-orange-200/80 font-poppins tracking-widest uppercase text-center lg:text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                National Level Techno-Cultural Fest
              </motion.p>

              {/* Simple underline */}
              <motion.div
                className="mt-3 w-32 h-[1px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent mx-auto lg:mx-0"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Tagline with typewriter effect */}
        <motion.div
          variants={itemVariants}
          className="relative mb-8"
        >
          <motion.p
            className="text-sky-300 text-xl md:text-2xl font-poppins text-center lg:text-left italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <span className="text-cyan-400">"</span>
            Where Innovation Meets Excellence
            <span className="text-cyan-400">"</span>
          </motion.p>
          <motion.div
            className="absolute -bottom-2 left-0 lg:left-0 right-0 lg:right-auto w-24 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent mx-auto lg:mx-0"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1 }}
          />
        </motion.div>

        {/* Event Stats with enhanced cards */}
        <motion.div
          className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8"
          variants={containerVariants}
        >
          {eventDetails.map((detail, i) => (
            <StatsCard
              key={i}
              detail={detail}
              delay={0.8 + i * 0.15}
              onClick={() => {
                if (detail === "20+ WORKSHOPS") handleNavigation("/events");
                else if (detail === "25+ EVENTS") handleNavigation("/events");
                else if (detail === "3 DAYS") handleNavigation("/schedule");
              }}
            />
          ))}
        </motion.div>

        {/* Countdown Timer */}
        <motion.div variants={itemVariants} className="w-full mb-6">
          <UltraCountdown />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center lg:justify-start"
          variants={itemVariants}
        >
          <CyberButton onClick={() => handleNavigation("/events")} variant="primary">
            Explore Events
          </CyberButton>
          <CyberButton onClick={() => handleNavigation("/schedule")} variant="secondary">
            View Schedule
          </CyberButton>
        </motion.div>
      </motion.div>

      {/* Right Content - Hero Image */}
      <motion.div
        className="relative w-full lg:w-1/2 flex justify-center items-center order-1 lg:order-2 mb-6 lg:mb-0"
        variants={itemVariants}
      >
        {/* Multi-layer glow effect */}
        <motion.div
          className="absolute w-[80%] h-[80%] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, rgba(249, 115, 22, 0.15) 50%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        {/* Animated rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-sky-500/20"
            style={{
              width: `${50 + ring * 15}%`,
              height: `${50 + ring * 15}%`,
            }}
            animate={{
              rotate: ring % 2 === 0 ? 360 : -360,
              scale: [1, 1.05, 1],
            }}
            transition={{
              rotate: { duration: 20 + ring * 5, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity }
            }}
          />
        ))}

        {/* Orbiting elements with trails */}
        <motion.div
          className="absolute w-full h-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 90}deg) translateX(160px)`,
              }}
            >
              <motion.div
                className="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.6, 1, 0.6],
                  boxShadow: [
                    "0 0 10px rgba(249, 115, 22, 0.5)",
                    "0 0 30px rgba(249, 115, 22, 0.8)",
                    "0 0 10px rgba(249, 115, 22, 0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Hero Image with 3D effect */}
        <motion.div
          className="relative z-10 w-full"
          style={{
            transformStyle: "preserve-3d",
            perspective: "1000px",
          }}
        >
          <RobotHero />
        </motion.div>

        {/* Tech circle overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
        >
          <svg className="w-[95%] h-[95%]" viewBox="0 0 200 200">
            <motion.circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke="url(#heroGradient)"
              strokeWidth="0.3"
              strokeDasharray="5 10"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="url(#heroGradient)"
              strokeWidth="0.5"
              strokeDasharray="15 8"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            <defs>
              <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </motion.div>

      {/* Enhanced Scroll indicator */}
      <motion.div
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <motion.span
          className="text-sky-400 text-xs font-poppins mb-3 tracking-widest"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          SCROLL TO EXPLORE
        </motion.span>
        <motion.div
          className="w-6 h-10 border-2 border-sky-500/50 rounded-full flex justify-center pt-2 backdrop-blur-sm bg-sky-950/30"
          animate={{
            borderColor: ['rgba(14, 165, 233, 0.5)', 'rgba(6, 182, 212, 0.8)', 'rgba(14, 165, 233, 0.5)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-3 bg-gradient-to-b from-cyan-400 to-sky-600 rounded-full"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default UltraHeroSection;
