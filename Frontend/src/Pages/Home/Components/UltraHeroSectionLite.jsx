import React, { memo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";

// Lazy load heavy components
const UltraCountdown = lazy(() => import("./UltraCountdownLite"));

// Check if mobile or reduced motion
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const prefersReducedMotion = typeof window !== 'undefined' && 
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Simple Stats Card - no animations
const StatsCard = memo(({ detail, onClick }) => (
  <button
    onClick={onClick}
    className="relative p-4 rounded-xl bg-slate-800/50 border border-sky-500/20 hover:border-sky-500/50 transition-colors cursor-pointer group"
  >
    <span className="text-white font-orbitron text-sm sm:text-base font-bold group-hover:text-sky-400 transition-colors">
      {detail}
    </span>
  </button>
));

StatsCard.displayName = 'StatsCard';

// Simple Button
const CyberButton = memo(({ children, onClick, variant = "primary", className = "" }) => {
  const baseStyles = "relative px-6 py-3 font-orbitron text-sm tracking-wider uppercase overflow-hidden cursor-pointer transition-all duration-300";
  const variants = {
    primary: "bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white",
    secondary: "bg-transparent border-2 border-sky-500 text-sky-400 hover:bg-sky-500/10",
    accent: "bg-gradient-to-r from-orange-500 to-sky-600 hover:from-orange-400 hover:to-sky-500 text-white",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className} rounded-lg`}
      onClick={onClick}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        <span>→</span>
      </span>
    </button>
  );
});

CyberButton.displayName = 'CyberButton';

const UltraHeroSection = memo(() => {
  const navigate = useNavigate();
  const eventDetails = ["3 DAYS", "20+ WORKSHOPS", "25+ EVENTS"];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <section
      className="relative w-full flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:px-12 pt-32 lg:pt-28 pb-10 min-h-screen"
    >
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Simple grid pattern - CSS only */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(14, 165, 233, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Left Content */}
      <div
        className="flex flex-col items-center lg:items-start lg:ml-16 w-full lg:w-1/2 order-2 lg:order-1 mt-8 lg:mt-0 relative z-10"
      >
        {/* Logo */}
        <div className="mb-6 w-full">
          <div className="relative flex flex-col items-center lg:items-start">
            <div className="relative flex items-center justify-center lg:justify-start gap-2 sm:gap-3">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron font-bold text-white tracking-wide"
              >
                DAKSHAA
              </h1>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron font-bold tracking-wide bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent"
              >
                T26
              </h1>
            </div>
            <p className="mt-3 text-sm sm:text-base text-orange-200/80 font-poppins tracking-widest uppercase text-center lg:text-left">
              National Level Techno-Cultural Fest
            </p>
            <div className="mt-3 w-32 h-[1px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent mx-auto lg:mx-0" />
          </div>
        </div>

        {/* Tagline */}
        <div className="relative mb-8">
          <p className="text-sky-300 text-xl md:text-2xl font-poppins text-center lg:text-left italic">
            <span className="text-cyan-400">"</span>
            <span className="text-white">Connecting people for gearing skills</span>
            <span className="text-cyan-400">"</span>
          </p>
        </div>

        {/* Event Stats */}
        <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8 w-full">
          {eventDetails.map((detail, index) => (
            <StatsCard
              key={detail}
              detail={detail}
              onClick={() => handleNavigation(index === 1 ? '/events/workshop' : '/events')}
            />
          ))}
        </div>

        {/* Countdown */}
        <div className="w-full mb-8">
          <Suspense fallback={<div className="h-24 bg-slate-800/30 rounded-xl animate-pulse" />}>
            <UltraCountdown />
          </Suspense>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <CyberButton
            onClick={() => handleNavigation('/register-events')}
            variant="accent"
            className="w-full sm:w-auto"
          >
            Register Now
          </CyberButton>
          <CyberButton
            onClick={() => handleNavigation('/events')}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Explore Events
          </CyberButton>
        </div>
      </div>

      {/* Right Content - Simple Hero Image */}
      <div className="w-full lg:w-1/2 order-1 lg:order-2 flex items-center justify-center relative z-10 mb-8 lg:mb-0">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 rounded-full blur-3xl" />
          
          {/* Simple decorative element instead of heavy 3D model */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full border-2 border-sky-500/30 flex items-center justify-center">
              <div className="w-36 h-36 sm:w-48 sm:h-48 lg:w-60 lg:h-60 rounded-full border border-cyan-500/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-orbitron font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                    FEB
                  </div>
                  <div className="text-5xl sm:text-6xl lg:text-7xl font-orbitron font-bold text-white">
                    12-14
                  </div>
                  <div className="text-lg sm:text-xl font-poppins text-sky-300">
                    2026
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator - only on desktop */}
      {!isMobile && (
        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center">
          <span className="text-sky-400 text-xs font-poppins mb-3 tracking-widest opacity-60">
            SCROLL TO EXPLORE
          </span>
          <div className="w-6 h-10 border-2 border-sky-500/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gradient-to-b from-cyan-400 to-sky-600 rounded-full animate-bounce" />
          </div>
        </div>
      )}
    </section>
  );
});

UltraHeroSection.displayName = 'UltraHeroSection';

export default UltraHeroSection;
