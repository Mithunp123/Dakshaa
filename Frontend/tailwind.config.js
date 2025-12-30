/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Custom breakpoints for better responsive control
    screens: {
      'xs': '375px',      // Small phones
      'sm': '640px',      // Large phones / small tablets
      'md': '768px',      // Tablets
      'lg': '1024px',     // Laptops
      'xl': '1280px',     // Desktops
      '2xl': '1536px',    // Large desktops
      '3xl': '1920px',    // Extra large screens
      // Max-width breakpoints
      'max-xs': {'max': '374px'},
      'max-sm': {'max': '639px'},
      'max-md': {'max': '767px'},
      'max-lg': {'max': '1023px'},
      // Height breakpoints for landscape mode
      'short': {'raw': '(max-height: 640px)'},
      'tall': {'raw': '(min-height: 800px)'},
      // Touch device detection
      'touch': {'raw': '(hover: none) and (pointer: coarse)'},
      'pointer': {'raw': '(hover: hover) and (pointer: fine)'},
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0ea5e9", // Sky Blue
          light: "#38bdf8",
          dark: "#0369a1",
        },
        secondary: {
          DEFAULT: "#06b6d4", // Cyan 500
          light: "#22d3ee", // Cyan 400
          dark: "#0891b2", // Cyan 600
        },
        accent: {
          DEFAULT: "#f59e0b", // Amber
          light: "#fbbf24",
          dark: "#d97706",
        },
        dark: {
          DEFAULT: "#0f172a",
          lighter: "#1e293b",
          darker: "#020617",
        }
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        acquire: ["Orbitron", "sans-serif"],
        marck: ["Marck Script", "cursive"],
        kohSantepheap: ["Koh Santepheap", "sans-serif"],
      },
      fontSize: {
        // Fluid typography using clamp
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.4vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.6vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1rem + 1vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.2rem + 1.5vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.5rem + 2vw, 2.5rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.5rem + 3vw, 3rem)',
        'fluid-5xl': 'clamp(3rem, 2rem + 4vw, 4rem)',
        'fluid-6xl': 'clamp(3.75rem, 2.5rem + 5vw, 5rem)',
      },
      spacing: {
        // Touch-friendly spacing
        'touch': '44px',
        'touch-sm': '36px',
        // Safe area insets
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      height: {
        'screen-safe': '100dvh',
        'screen-small': '100svh',
        'screen-large': '100lvh',
      },
      minHeight: {
        'screen-safe': '100dvh',
        'touch': '44px',
      },
      maxHeight: {
        'screen-safe': '100dvh',
        'modal': 'calc(100dvh - 2rem)',
        'modal-mobile': 'calc(100dvh - 4rem)',
      },
      width: {
        'screen-safe': '100dvw',
      },
      minWidth: {
        'touch': '44px',
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 15s ease infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-up": "slideInUp 0.3s ease-out",
        "slide-in-down": "slideInDown 0.3s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInDown: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};
