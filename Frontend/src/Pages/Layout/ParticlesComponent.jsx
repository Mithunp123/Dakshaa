import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useMemo, useState, memo } from "react";
import { loadSlim } from "@tsparticles/slim";

// Check if user prefers reduced motion or is on mobile
const prefersReducedMotion = typeof window !== 'undefined' && 
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const ParticlesComponent = memo((props) => {
  const [init, setInit] = useState(false);

  // Don't render particles on mobile or if user prefers reduced motion
  if (prefersReducedMotion || isMobile) {
    return null;
  }

  useEffect(() => {
    // Delay initialization to not block initial render
    const timer = setTimeout(() => {
      initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      }).then(() => {
        setInit(true);
      });
    }, 1000); // Delay particles by 1 second

    return () => clearTimeout(timer);
  }, []);

  const particlesLoaded = (container) => {
    // Particles loaded successfully
  };

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 30, // Reduced from 60 for better performance
      interactivity: {
        events: {
          onClick: {
            enable: false,
            mode: "none",
          },
          onHover: {
            enable: false, // Disable hover interactions for performance
            mode: 'grab',
          },
        },
      },
      particles: {
        color: {
          value: "#FFFFFF",
        },
        links: {
          color: "#FFFFFF",
          distance: 200, // Increased distance = fewer links
          enable: true,
          opacity: 0.08,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out", // Changed from bounce for less CPU
          },
          random: false, // Disable random for smoother movement
          speed: 0.3, // Even slower
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 1200, // Larger area = fewer particles
          },
          value: 25, // Reduced from 50
        },
        opacity: {
          value: 0.2,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 2 },
        },
      },
      detectRetina: false, // Disable retina detection for performance
    }),
    [],
  );

  if (!init) return null;

  return <Particles id={props.id} init={particlesLoaded} options={options} />;
});

ParticlesComponent.displayName = 'ParticlesComponent';

export default ParticlesComponent;
