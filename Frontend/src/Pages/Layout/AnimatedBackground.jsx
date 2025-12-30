import React from 'react';
import { motion } from 'framer-motion';

// Gradient Orbs Background Component
export const GradientOrbs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Primary orb */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: ['-20%', '30%', '-10%', '20%', '-20%'],
          y: ['10%', '40%', '20%', '-10%', '10%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Secondary orb */}
      <motion.div
        className="absolute right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          x: ['20%', '-30%', '10%', '-20%', '20%'],
          y: ['50%', '10%', '60%', '30%', '50%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Accent orb */}
      <motion.div
        className="absolute bottom-0 left-1/2 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: ['-50%', '-20%', '-60%', '-30%', '-50%'],
          y: ['-30%', '-60%', '-20%', '-50%', '-30%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// Floating Particles Component
export const FloatingParticles = ({ count = 20 }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-sky-400/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Cyber Grid Background
export const CyberGrid = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(11, 29, 39, 0.8) 100%)',
        }}
      />
    </div>
  );
};

// Glowing Lines Animation
export const GlowingLines = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[1px] w-full"
          style={{
            top: `${20 + i * 15}%`,
            background: 'linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.5), transparent)',
          }}
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: i * 1.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Main Animated Background Component
const AnimatedBackground = ({ variant = 'orbs' }) => {
  switch (variant) {
    case 'grid':
      return <CyberGrid />;
    case 'particles':
      return <FloatingParticles count={30} />;
    case 'lines':
      return <GlowingLines />;
    case 'orbs':
    default:
      return <GradientOrbs />;
  }
};

export default AnimatedBackground;
