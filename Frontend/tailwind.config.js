/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
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
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 15s ease infinite",
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
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      }
    },
  },
  plugins: [],
};
