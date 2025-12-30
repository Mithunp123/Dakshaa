import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import { Download } from "lucide-react";
import HeroImg from "../../../assets/Heroimg.png";
import Daksha from "../../../assets/DaKshaa T26.png";
import Countdown from "./Countdown";
import RegisterAni from "../../../assets/registerani.gif";
import brochure from "../../../assets/brochure.pdf";

// Wave Animation for Words (Description & Event Details)
const wordWaveAnimation = {
  hidden: { y: 0 },
  visible: (i) => ({
    y: [0, -4, 0, 4, 0],
    transition: {
      duration: 1.5,
      delay: i * 0.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }),
};

// Fade-in & Slide Animation
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

// Infinite Floating Animation for Image
const floatAnimation = {
  animate: {
    y: [0, -15, 0, 15, 0],
    rotate: [0, 1, -1, 1, 0],
    scale: [1, 1.01, 1, 1.01, 1],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Infinite Pulsing Animation for Button
const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const HeroSection = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const eventDetails = ["3 DAYS", "20+ WORKSHOPS", "25+ EVENTS"];

  // Function to handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* Brochure Button - Desktop */}
      <motion.div
        className="hidden md:flex absolute right-12 top-32 z-20"
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
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Download className="w-5 h-5 text-sky-400 group-hover:text-sky-300 transition-colors" />
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-sky-400/30 rounded-full -z-10"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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

          <div className="absolute inset-0 border border-sky-500/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_15px_rgba(14,165,233,0.3)]" />
        </motion.a>
      </motion.div>

      <motion.div
        className="h-screen flex flex-col md:flex-row items-center justify-center px-4 sm:px-6 lg:px-12 md:mt-24 mt-16 text-white overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        {/* Floating Animated Tech Face Image (Top on Mobile, Right on Desktop) */}
        <motion.div
          className="flex justify-center md:justify-start md:mt-0 w-full md:w-1/2 order-1 md:order-2"
          variants={fadeInUp}
        >
          <motion.img
            src={HeroImg}
            alt="Tech Face"
            className="w-[70%] md:w-[95%] max-w-[400px] sm:max-w-[500px] md:max-w-[700px] lg:max-w-[700px] h-auto md:h-[500px] transition-all hover:scale-105 mb-6"
            variants={floatAnimation}
            animate="animate"
          />
        </motion.div>

        {/* Left Content (Bottom on Mobile, Left on Desktop) */}
        <motion.div className="flex flex-col justify-between md:ml-52 md:mt-14 w-full md:w-1/2 order-2 md:order-1">
          {/* Daksha Image */}
          <div>
            <motion.div variants={fadeInUp}>
              <img
                src={Daksha}
                alt="Daksha"
                className="w-[60%] max-w-[500px] h-auto sm:w-[400px] md:w-[500px] lg:w-[600px]"
              />
            </motion.div>

            {/* Event Details with Wave Animation */}
            <motion.div className="mt-4 sm:mt-6 flex justify-between md:justify-start gap-2 sm:gap-4 text-xs md:text-lg lg:text-base whitespace-nowrap">
              {eventDetails.map((word, i) => (
                <motion.div
                  key={i}
                  className="border-2 border-sky-900 px-2 lg:px-2 md:px-4 py-2 sm:py-3 md:py-4 flex-shrink-0 cursor-pointer"
                  whileHover={{ scale: 1.05 }} // Slightly increase scale on hover
                  onClick={() => {
                    if (word === "20+ WORKSHOPS") {
                      handleNavigation("/events/workshop"); // Navigate to workshops
                    } else if (word === "25+ EVENTS") {
                      handleNavigation("/events"); // Navigate to events
                    } else if (word === "3 DAYS") {
                      handleNavigation("/accomodation"); // Navigate to upcoming events
                    }
                  }}
                >
                  <motion.span
                    className="bg-sky-900 px-4 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-3 bg-opacity-80 clip-bottom-right-2"
                    variants={wordWaveAnimation}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                  >
                    {word}
                  </motion.span>
                </motion.div>
              ))}
            </motion.div>

            <h1 className="text-2xl font-orbitron md:text-4xl mt-4 md:mt-4">
              <q>
                {" "}
                Prize pool of <span className="text-secondary drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                  10 Lakhs
                </span>{" "}
              </q>
            </h1>

            {/* Brochure Button - Mobile */}
            <div className="md:hidden flex justify-center mt-8">
              <motion.a
                href={brochure}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full transition-all duration-300"
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Download className="w-5 h-5 text-sky-400" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-sky-400/30 rounded-full -z-10"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-sky-400/80 font-orbitron leading-none mb-1">
                    Event Guide
                  </span>
                  <span className="text-xs font-bold text-white font-orbitron tracking-wider leading-none">
                    DOWNLOAD BROCHURE
                  </span>
                </div>
              </motion.a>
            </div>
            {/* Countdown for Desktop */}
            <div className="hidden md:block mt-6">
              <Countdown />
            </div>
          </div>
        </motion.div>
      </motion.div>
      <div className="md:hidden ">
        <Countdown />
      </div>
    </>
  );
};

export default HeroSection;
