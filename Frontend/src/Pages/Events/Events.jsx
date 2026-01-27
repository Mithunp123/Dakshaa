import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/logo1.png";
import TechnicalImage from "../../assets/EventsImages/technical.png";
import NonTechnicalImage from "../../assets/EventsImages/non-technical.png";
import Cultural from "../../assets/EventsImages/culturals.jpg";
import Workshop from "../../assets/EventsImages/workshop.jpg";
import HackathonImage from "../../assets/Hackathon.png";
import ConferenceImage from "../../assets/conference/conference.jpeg";

// Import event data from separate files
import { technicalEvents } from "../../data/technicalEvents";
import { nonTechnicalEvents } from "../../data/nonTechnicalEvents";
import { culturalEvents } from "../../data/culturalEvents";
import { hackathonEvents } from "../../data/hackathonEvents";
import { workshopEvents } from "../../data/workshopEvents";
import { conferenceEvents } from "../../data/conferenceEvents";

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const eventsRef = useRef(null);

  // Check if user is admin
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin' || userRole === 'super_admin');
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (showCountdown && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
      setCountdown(10);
    }
    return () => clearTimeout(timer);
  }, [showCountdown, countdown]);

  const startCountdown = () => {
    setShowCountdown(true);
    setCountdown(10);
  };

  const events = [
    {
      id: 1,
      image: TechnicalImage,
      name: "Technical Events",
      descriptionImages: technicalEvents,
    },
    {
      id: 2,
      image: NonTechnicalImage,
      name: "Non-Technical Events",
      descriptionImages: nonTechnicalEvents,
    },
    {
      id: 3,
      image: Cultural,
      name: "Harmonicks",
      descriptionImages: culturalEvents,
    },
    {
      id: 4,
      image: HackathonImage,
      name: "Hackathon",
      descriptionImages: hackathonEvents,
    },
    {
      id: 5,
      image: Workshop,
      name: "Workshop",
      descriptionImages: workshopEvents,
    },
    {
      id: 6,
      image: ConferenceImage,
      name: "Conference",
      descriptionImages: conferenceEvents,
    },
    {
      id: 7,
      image: NonTechnicalImage,
      name: "Others",
      descriptionImages: [],
    },
  ];

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      // Map category names to event IDs
      const categoryMap = {
        'technical': 1,
        'non-technical': 2, 
        'harmonicks': 3,
        'hackathon': 4,
        'workshop': 5,
        'conference': 6,
        'others': 7
      };
      const eventId = categoryMap[categoryParam] || 1;
      setSelectedEvent(eventId);
      
      // Set rotation for the selected category
      const index = events.findIndex(event => event.id === eventId);
      if (index !== -1) {
        const anglePerEvent = 360 / events.length;
        const targetRotation = -(index * anglePerEvent);
        setRotation(targetRotation);
      }
    } else {
      setSelectedEvent(events[0].id);
    }
  }, [searchParams]);

  const handleEventClick = (id, index) => {
    if (isSpinning) return;

    setIsSpinning(true);
    const anglePerEvent = 360 / events.length;
    // Calculate the shortest rotation to the target index
    // We want the selected event to be at the top (270 degrees in SVG terms usually, but here we rotate the container)
    const targetRotation = -(index * anglePerEvent);

    // Add a full spin for effect
    setRotation((prev) => {
      const currentRotation = prev % 360;
      return prev + (targetRotation - currentRotation) - 360;
    });

    setSelectedEvent(id);
    
    // Update URL with selected category
    const categoryNames = ['technical', 'non-technical', 'harmonicks', 'hackathon', 'workshop', 'conference', 'others'];
    const categoryName = categoryNames[index];
    setSearchParams({ category: categoryName });
    
    setTimeout(() => setIsSpinning(false), 1200);
  };

  const selectedEventData =
    events.find((event) => event.id === selectedEvent) || null;

  const title = "Events";

  const handleSlideClick = (eventId) => {
    // Check if it's a conference event (starts with "conference")
    if (eventId && eventId.startsWith("conference")) {
      navigate("/events/conference");
    } else {
      navigate(`/event/${eventId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden pt-24 pb-12">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 relative z-10"
      >
        <h1 className="text-center font-orbitron font-bold text-4xl md:text-6xl mb-16 tracking-tighter">
          {title.split("").map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                textShadow: [
                  "0 0 0px rgba(14,165,233,0)",
                  "0 0 20px rgba(14,165,233,0.5)",
                  "0 0 0px rgba(14,165,233,0)",
                ],
              }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                textShadow: { repeat: Infinity, duration: 2 },
              }}
              className="inline-block hover:text-secondary transition-colors cursor-default"
            >
              {char}
            </motion.span>
          ))}
        </h1>

        <div className="flex flex-col items-center justify-center mb-20">
          {/* Instruction Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 text-center"
          >
            <p className="text-secondary font-orbitron text-sm tracking-[0.3em] uppercase animate-pulse">
              Select a Category to Explore
            </p>
          </motion.div>

          {/* Cyber Spin Wheel Container */}
          <div className="relative w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] md:w-[580px] md:h-[580px] lg:w-[680px] lg:h-[680px] flex items-center justify-center">
            {/* Background Hex Grid (CSS Pattern) */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#0ea5e9 0.5px, transparent 0.5px)`,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Outer Decorative Rings */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Slow Rotating Outer Ring */}
              <motion.div
                className="absolute inset-[-30px] rounded-full border border-primary/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              />
              {/* Fast Counter-Rotating Ring */}
              <motion.div
                className="absolute inset-[-15px] rounded-full border-2 border-dashed border-secondary/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              />
              {/* Pulsing Glow Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border border-primary/20 shadow-[0_0_100px_rgba(14,165,233,0.1)]"
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Rotating Container */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: rotation }}
              transition={{ type: "spring", stiffness: 20, damping: 12, mass: 1.5 }}
            >
              {/* SVG Background for the Wheel */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient
                    id="cyberGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Main Wheel Body */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="url(#cyberGradient)"
                  stroke="#0ea5e9"
                  strokeWidth="0.2"
                  strokeDasharray="1 2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="0.1"
                  opacity="0.3"
                />

                {/* Degree Markers */}
                {[...Array(36)].map((_, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1="2"
                    x2="50"
                    y2={i % 9 === 0 ? 6 : 4}
                    transform={`rotate(${i * 10} 50 50)`}
                    stroke="#0ea5e9"
                    strokeWidth={i % 9 === 0 ? "0.5" : "0.2"}
                    opacity={i % 9 === 0 ? "0.8" : "0.4"}
                  />
                ))}

                {/* Spokes with Energy Flow */}
                {events.length > 0 &&
                  events.map((event, i) => {
                    const angle =
                      events.length > 0 ? (i / events.length) * 360 : 0;
                    const angleRad = (angle * Math.PI) / 180;
                    const endX = 50 + 48 * Math.cos(angleRad);
                    const endY = 50 + 48 * Math.sin(angleRad);
                    const isSelected = selectedEvent === event.id;
                    
                    // Ensure values are valid numbers
                    const validEndX = !isNaN(endX) && isFinite(endX) ? endX : 50;
                    const validEndY = !isNaN(endY) && isFinite(endY) ? endY : 50;
                    
                    return (
                      <g key={event.id || i}>
                        {/* Outer glow line for selected */}
                        {isSelected && (
                          <line
                            x1="50"
                            y1="50"
                            x2={validEndX}
                            y2={validEndY}
                            stroke="#22d3ee"
                            strokeWidth="3"
                            opacity="0.3"
                            filter="url(#glow)"
                          />
                        )}
                        {/* Middle glow line for selected */}
                        {isSelected && (
                          <line
                            x1="50"
                            y1="50"
                            x2={validEndX}
                            y2={validEndY}
                            stroke="#22d3ee"
                            strokeWidth="2"
                            opacity="0.6"
                            filter="url(#glow)"
                          />
                        )}
                        {/* Main spoke line - prominent cyan for selected */}
                        <line
                          x1="50"
                          y1="50"
                          x2={validEndX}
                          y2={validEndY}
                          stroke={isSelected ? "#22d3ee" : "#0ea5e9"}
                          strokeWidth={isSelected ? "1.2" : "0.15"}
                          opacity={isSelected ? "1" : "0.3"}
                          filter={isSelected ? "url(#glow)" : ""}  
                        />
                        {isSelected && (
                          <motion.circle
                            cx={50}
                            cy={50}
                            r="1"
                            fill="#22d3ee"
                            animate={{
                              cx: [50, validEndX],
                              cy: [50, validEndY],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        )}
                      </g>
                    );
                  })}
              </svg>

              {/* Event Nodes */}
              {events.map((event, index) => {
                const angle = (index / events.length) * 2 * Math.PI;
                const radius = 42; // Percentage of SVG viewbox
                const isSelected = selectedEvent === event.id;

                return (
                  <motion.div
                    key={event.id}
                    className="absolute cursor-pointer group"
                    style={{
                      left: `${50 + radius * Math.cos(angle)}%`,
                      top: `${50 + radius * Math.sin(angle)}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => handleEventClick(event.id, index)}
                  >
                    {/* Node Content */}
                    <div className="relative">
                      {/* Holographic Frame */}
                      <div
                        className={`absolute -inset-2 rounded-full border border-dashed transition-all duration-500 ${
                          isSelected
                            ? "border-secondary animate-spin-slow opacity-100"
                            : "border-primary/20 opacity-0 group-hover:opacity-50"
                        }`}
                      />

                      <motion.div
                        className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden border-2 transition-all duration-500 ${
                          isSelected
                            ? "border-secondary shadow-[0_0_40px_rgba(34,211,238,0.8)] scale-110 z-20"
                            : "border-primary/40 grayscale hover:grayscale-0 hover:border-primary hover:scale-105 z-10"
                        }`}
                        style={{ rotate: -rotation }}
                      >
                        <img
                          src={event.image}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Overlay with Scanlines */}
                        <div
                          className={`absolute inset-0 transition-colors duration-500 ${
                            isSelected
                              ? "bg-secondary/10"
                              : "bg-black/50 group-hover:bg-black/20"
                          }`}
                        />

                        <div className="absolute inset-0 flex items-center justify-center p-2">
                          <span
                            className={`text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-orbitron font-bold text-center leading-tight uppercase tracking-tighter transition-colors duration-500 ${
                              isSelected
                                ? "text-white"
                                : "text-gray-300 group-hover:text-white"
                            }`}
                          >
                            {event.name}
                          </span>
                        </div>

                        {/* Active Selection Glow */}
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 border-4 border-secondary/30 rounded-full"
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Center Hub - Reactor Core */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52">
                {/* Rotating Core Rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-secondary/30 border-t-secondary"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border border-primary/30 border-b-primary"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Core */}
                <div className="absolute inset-4 rounded-full bg-[#020617] border border-secondary/50 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3),inset_0_0_20px_rgba(34,211,238,0.2)] overflow-hidden">
                  {/* Core Pulse */}
                  <motion.div
                    className="absolute inset-0 bg-secondary/5"
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <motion.img
                    src={logo}
                    alt="Dakshaa Logo"
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain relative z-10"
                    animate={{
                      scale: [1, 1.05, 1],
                      filter: [
                        "drop-shadow(0 0 0px rgba(34,211,238,0))",
                        "drop-shadow(0 0 15px rgba(34,211,238,0.5))",
                        "drop-shadow(0 0 0px rgba(34,211,238,0))",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="relative z-10 text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-[0.3em] mt-1">
                    2026
                  </div>

                  {/* Scanning Line */}
                  <motion.div
                    className="absolute top-0 left-0 w-full h-0.5 bg-secondary/40 blur-sm"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Selection Indicator (Top Pointer) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-none z-30">
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex flex-col items-center"
              >
                <div className="w-0.5 h-16 bg-gradient-to-b from-secondary via-secondary/50 to-transparent" />
                <div className="w-4 h-4 border-2 border-secondary rotate-45 flex items-center justify-center shadow-[0_0_20px_#22d3ee]">
                  <div className="w-1.5 h-1.5 bg-secondary" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Event Details Section */}
        <AnimatePresence mode="wait">
          <motion.div
            ref={eventsRef}
            key={selectedEvent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-7xl mx-auto relative mt-16 pt-8"
          >
            {/* Decorative Background for Section */}
            <div className="absolute -inset-10 bg-primary/5 rounded-[4rem] blur-3xl -z-10" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden -z-10">
              <div
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(0deg, transparent 24%, rgba(14, 165, 233, .3) 25%, rgba(14, 165, 233, .3) 26%, transparent 27%, transparent 74%, rgba(14, 165, 233, .3) 75%, rgba(14, 165, 233, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(14, 165, 233, .3) 25%, rgba(14, 165, 233, .3) 26%, transparent 27%, transparent 74%, rgba(14, 165, 233, .3) 75%, rgba(14, 165, 233, .3) 76%, transparent 77%, transparent)",
                  backgroundSize: "50px 50px",
                }}
              />
            </div>

            <div className="flex flex-col items-center mb-12">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100px" }}
                className="h-px bg-gradient-to-r from-transparent via-secondary to-transparent mb-4"
              />
              <h2 className="text-3xl md:text-5xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary uppercase tracking-[0.2em]">
                {selectedEventData?.name}
              </h2>
              <div className="mt-2 text-secondary/60 font-orbitron text-[10px] tracking-[0.5em] uppercase">
                Accessing Database...
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              {selectedEventData?.descriptionImages.map((slide, index) => (
                <motion.div
                  key={`${slide.eventId}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-[300px]"
                  onClick={() => handleSlideClick(slide.eventId)}
                >
                  {/* Cyber Card */}
                  <div className="relative overflow-hidden bg-slate-900/50 border border-white/10 rounded-lg aspect-square cursor-pointer group-hover:border-secondary/50 transition-all duration-500">
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary opacity-0 group-hover:opacity-100 transition-opacity z-20" />

                    <img
                      src={slide.image}
                      alt="Event"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-10" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 z-20">
                      <div className="flex items-center justify-between bg-secondary/20 border border-secondary/50 rounded-lg px-4 py-2 backdrop-blur-sm">
                        <span className="text-xs font-orbitron text-secondary tracking-widest uppercase font-bold">
                          Register Now
                        </span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <svg
                            className="w-5 h-5 text-secondary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Admin Countdown Button */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 right-8 z-40"
          >
            <button
              onClick={startCountdown}
              className="px-6 py-3 bg-gradient-to-r from-secondary to-primary text-white font-orbitron font-bold rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] transition-all duration-300 uppercase tracking-wider text-sm"
            >
              🚀 Open All Events
            </button>
          </motion.div>
        )}

        {/* Countdown Overlay */}
        <AnimatePresence>
          {showCountdown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
            >
              {/* Animated Stars/Particles Background */}
              <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              {/* Animated Grid Background */}
              <motion.div 
                className="absolute inset-0 opacity-30"
                animate={{ 
                  backgroundPosition: ['0px 0px', '50px 50px'],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '50px 50px',
                }}
              />

              {/* Cyber Hexagon Pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="hexagons-events" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                      <polygon points="25,0 50,14.4 50,38.4 25,52.8 0,38.4 0,14.4" fill="none" stroke="#22d3ee" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hexagons-events)"/>
                </svg>
              </div>

              {/* Multiple Expanding Pulse Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border-2 border-secondary"
                    initial={{ width: 100, height: 100, opacity: 0.8 }}
                    animate={{ 
                      width: [100, 800],
                      height: [100, 800],
                      opacity: [0.6, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>

              {/* Rotating Orbital Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full border border-secondary/40"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-secondary rounded-full shadow-[0_0_20px_#22d3ee]" />
                </motion.div>
                <motion.div
                  className="absolute w-[400px] h-[400px] md:w-[550px] md:h-[550px] rounded-full border border-primary/40"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_#0ea5e9]" />
                </motion.div>
                <motion.div
                  className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border-2 border-dashed border-white/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Center Glow Effect */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0.1) 40%, transparent 70%)',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Countdown Number with Epic Animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdown}
                  className="relative z-10"
                  initial={{ 
                    scale: 3,
                    opacity: 0,
                    rotateX: -90,
                    filter: 'blur(20px)',
                  }}
                  animate={{ 
                    scale: 1,
                    opacity: 1,
                    rotateX: 0,
                    filter: 'blur(0px)',
                  }}
                  exit={{ 
                    scale: 0.5,
                    opacity: 0,
                    rotateX: 90,
                    filter: 'blur(20px)',
                    transition: { duration: 0.3 }
                  }}
                  transition={{ 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                >
                  {/* Glitch Effect Layers */}
                  <motion.span
                    className="absolute inset-0 text-[180px] md:text-[280px] lg:text-[380px] font-orbitron font-black text-cyan-500/30 flex items-center justify-center"
                    animate={{
                      x: [0, -5, 5, -5, 0],
                      opacity: [0, 1, 0, 1, 0],
                    }}
                    transition={{
                      duration: 0.2,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    {countdown}
                  </motion.span>
                  <motion.span
                    className="absolute inset-0 text-[180px] md:text-[280px] lg:text-[380px] font-orbitron font-black text-red-500/30 flex items-center justify-center"
                    animate={{
                      x: [0, 5, -5, 5, 0],
                      opacity: [0, 1, 0, 1, 0],
                    }}
                    transition={{
                      duration: 0.2,
                      repeat: Infinity,
                      repeatDelay: 2,
                      delay: 0.1,
                    }}
                  >
                    {countdown}
                  </motion.span>
                  
                  {/* Main Number */}
                  <motion.span 
                    className="text-[180px] md:text-[280px] lg:text-[380px] font-orbitron font-black text-transparent bg-clip-text relative"
                    style={{
                      backgroundImage: 'linear-gradient(180deg, #22d3ee 0%, #ffffff 50%, #0ea5e9 100%)',
                      textShadow: '0 0 100px rgba(34,211,238,0.8), 0 0 200px rgba(34,211,238,0.4)',
                      WebkitTextStroke: '2px rgba(34,211,238,0.3)',
                    }}
                    animate={{
                      textShadow: [
                        '0 0 100px rgba(34,211,238,0.8), 0 0 200px rgba(34,211,238,0.4)',
                        '0 0 150px rgba(34,211,238,1), 0 0 300px rgba(34,211,238,0.6)',
                        '0 0 100px rgba(34,211,238,0.8), 0 0 200px rgba(34,211,238,0.4)',
                      ],
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    {countdown}
                  </motion.span>

                  {/* Scanning Line Effect */}
                  <motion.div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ mixBlendMode: 'overlay' }}
                  >
                    <motion.div
                      className="absolute left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-white to-transparent"
                      animate={{
                        top: ['-10%', '110%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Circular Progress Indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-[250px] h-[250px] md:w-[350px] md:h-[350px] lg:w-[450px] lg:h-[450px] -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="rgba(34,211,238,0.2)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ 
                      strokeDashoffset: 2 * Math.PI * 45,
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                    key={countdown}
                    style={{ filter: 'drop-shadow(0 0 10px #22d3ee)' }}
                  />
                </svg>
              </div>

              {/* Corner Decorations */}
              <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-secondary/50" />
              <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-secondary/50" />
              <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-secondary/50" />
              <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-secondary/50" />

              {/* Top Status Bar */}
              <motion.div
                className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full">
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                  <span className="text-xs text-secondary font-orbitron uppercase tracking-wider">System Active</span>
                </div>
              </motion.div>

              {/* Bottom Text with Typewriter Effect */}
              <motion.div
                className="absolute bottom-16 md:bottom-20 text-center"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="flex items-center justify-center gap-3 mb-4"
                >
                  {['E', 'V', 'E', 'N', 'T', 'S', ' ', 'O', 'P', 'E', 'N', 'I', 'N', 'G'].map((letter, i) => (
                    <motion.span
                      key={i}
                      className="text-2xl md:text-3xl font-orbitron font-bold text-secondary"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      style={{ textShadow: '0 0 20px rgba(34,211,238,0.8)' }}
                    >
                      {letter === ' ' ? '\u00A0' : letter}
                    </motion.span>
                  ))}
                </motion.div>
                <motion.div
                  className="h-1 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto"
                  initial={{ width: 0 }}
                  animate={{ width: '300px' }}
                  transition={{ delay: 1, duration: 0.5 }}
                />
              </motion.div>

              {/* Floating Tech Elements */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-secondary/30 font-orbitron text-xs"
                  style={{
                    left: `${10 + (i % 3) * 40}%`,
                    top: `${20 + Math.floor(i / 3) * 60}%`,
                  }}
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                >
                  {['<INIT/>', '{READY}', '[SYNC]', '//LOAD', '#EVENT', '@LIVE'][i]}
                </motion.div>
              ))}

              {/* Close button */}
              <motion.button
                onClick={() => {
                  setShowCountdown(false);
                  setCountdown(10);
                }}
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center text-white/50 hover:text-white text-2xl transition-all hover:bg-white/10 rounded-full border border-white/20 hover:border-white/40 z-50"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Events;

