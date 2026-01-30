import React, { memo } from 'react';

// Check if user prefers reduced motion or is on mobile
const prefersReducedMotion = typeof window !== 'undefined' && 
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Gradient Orbs Background Component - CSS-only for better performance
export const GradientOrbs = memo(() => {
  // Skip on mobile or if reduced motion preferred
  if (prefersReducedMotion || isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Primary orb - CSS animation instead of framer-motion */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-float-slow"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          left: '10%',
          top: '20%',
        }}
      />
      
      {/* Secondary orb */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full animate-float-slower"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 70%)',
          filter: 'blur(50px)',
          right: '10%',
          top: '30%',
        }}
      />
    </div>
  );
});

GradientOrbs.displayName = 'GradientOrbs';

// Floating Particles Component - Reduced count and CSS-only
export const FloatingParticles = memo(({ count = 10 }) => {
  // Skip on mobile or if reduced motion preferred
  if (prefersReducedMotion || isMobile) {
    return null;
  }

  // Reduce particle count significantly
  const actualCount = Math.min(count, 10);
  
  const particles = Array.from({ length: actualCount }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: i * 0.5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-sky-400/20 animate-float-particle"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
});

FloatingParticles.displayName = 'FloatingParticles';

// Cyber Grid Background - Static, no animation
export const CyberGrid = memo(() => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
});

CyberGrid.displayName = 'CyberGrid';

// Glowing Lines Animation - Simplified
export const GlowingLines = memo(() => {
  if (prefersReducedMotion || isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute h-[1px] w-full animate-glow-line"
          style={{
            top: `${25 + i * 25}%`,
            background: 'linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.3), transparent)',
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}
    </div>
  );
});

GlowingLines.displayName = 'GlowingLines';

// Main Animated Background Component
const AnimatedBackground = memo(({ variant = 'orbs' }) => {
  switch (variant) {
    case 'grid':
      return <CyberGrid />;
    case 'particles':
      return <FloatingParticles count={10} />;
    case 'lines':
      return <GlowingLines />;
    case 'orbs':
    default:
      return <GradientOrbs />;
  }
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;
