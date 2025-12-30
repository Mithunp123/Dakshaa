import React, { useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';

const CursorFollower = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Spring animations for smooth following
  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);
  
  const trailX = useSpring(0, { damping: 35, stiffness: 150 });
  const trailY = useSpring(0, { damping: 35, stiffness: 150 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      trailX.set(e.clientX);
      trailY.set(e.clientY);
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Track hover states on interactive elements
    const handleHoverStart = (e) => {
      if (e.target.tagName === 'A' || 
          e.target.tagName === 'BUTTON' || 
          e.target.closest('button') ||
          e.target.closest('a') ||
          e.target.classList.contains('cursor-pointer')) {
        setIsHovering(true);
      }
    };

    const handleHoverEnd = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseover', handleHoverStart);
    document.addEventListener('mouseout', handleHoverEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseover', handleHoverStart);
      document.removeEventListener('mouseout', handleHoverEnd);
    };
  }, [cursorX, cursorY, trailX, trailY]);

  // Don't render on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      {/* Main cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className="relative -translate-x-1/2 -translate-y-1/2"
          animate={{
            width: isHovering ? 40 : 12,
            height: isHovering ? 40 : 12,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Outer ring */}
          <div 
            className={`absolute inset-0 rounded-full border-2 ${isHovering ? 'border-cyan-400' : 'border-white'} transition-colors duration-200`}
          />
          
          {/* Inner dot */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full"
            animate={{
              width: isHovering ? 6 : 4,
              height: isHovering ? 6 : 4,
            }}
          />
        </motion.div>
      </motion.div>

      {/* Trail effect */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          x: trailX,
          y: trailY,
        }}
        animate={{
          opacity: isVisible ? 0.3 : 0,
        }}
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2 w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl" />
        </div>
      </motion.div>

      {/* Particles around cursor on hover */}
      {isHovering && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9997]"
          style={{
            x: cursorX,
            y: cursorY,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              initial={{ scale: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((i / 6) * Math.PI * 2) * 30,
                y: Math.sin((i / 6) * Math.PI * 2) * 30,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>
      )}
    </>
  );
};

export default CursorFollower;
