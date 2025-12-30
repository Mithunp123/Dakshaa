import React from 'react';
import { motion } from 'framer-motion';

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Slide variants
const slideVariants = {
  initial: {
    opacity: 0,
    x: -50,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Scale variants
const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Page wrapper component
const PageTransition = ({ children, variant = 'fade' }) => {
  const variants = {
    fade: pageVariants,
    slide: slideVariants,
    scale: scaleVariants,
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[variant]}
    >
      {children}
    </motion.div>
  );
};

// Section reveal animation
export const SectionReveal = ({ children, delay = 0, direction = 'up' }) => {
  const directions = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { y: 0, x: 50 },
    right: { y: 0, x: -50 },
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        x: 0 
      }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.8, 
        delay,
        ease: "easeOut" 
      }}
    >
      {children}
    </motion.div>
  );
};

// Stagger container for child animations
export const StaggerContainer = ({ children, staggerDelay = 0.1 }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// Stagger child item
export const StaggerItem = ({ children, direction = 'up' }) => {
  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { y: 0, x: 30 },
    right: { y: 0, x: -30 },
  };

  return (
    <motion.div
      variants={{
        hidden: { 
          opacity: 0, 
          ...directions[direction] 
        },
        visible: { 
          opacity: 1, 
          y: 0, 
          x: 0,
          transition: {
            duration: 0.5,
            ease: "easeOut",
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// Text reveal animation (word by word)
export const TextReveal = ({ text, className = '', delay = 0 }) => {
  const words = text.split(' ');

  return (
    <motion.p
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-1"
          variants={{
            hidden: { 
              opacity: 0, 
              y: 20 
            },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.5,
                delay: delay + i * 0.05,
              },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
};

// Hover scale effect wrapper
export const HoverScale = ({ children, scale = 1.05 }) => {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

// Parallax scroll effect
export const ParallaxScroll = ({ children, speed = 0.5 }) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      style={{
        y: typeof window !== 'undefined' ? 0 : 0,
      }}
      whileInView={{
        y: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  );
};

// Magnetic button effect
export const MagneticButton = ({ children }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
    >
      {children}
    </motion.div>
  );
};

// Ripple effect
export const RippleButton = ({ children, className = '', onClick }) => {
  const [ripples, setRipples] = React.useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { x, y, id: Date.now() };
    setRipples([...ripples, newRipple]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
    
    if (onClick) onClick(e);
  };

  return (
    <button className={`relative overflow-hidden ${className}`} onClick={handleClick}>
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </button>
  );
};

export default PageTransition;
