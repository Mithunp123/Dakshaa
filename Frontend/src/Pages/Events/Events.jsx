import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, MapPin, Calendar, Users, AlertTriangle } from "lucide-react";
import logo from "../../assets/logo1.webp";
import TechnicalImage from "../../assets/EventsImages/technical.webp";
import NonTechnicalImage from "../../assets/EventsImages/non-technical.webp";
import Cultural from "../../assets/EventsImages/culturals.webp";
import Workshop from "../../assets/EventsImages/workshop.webp";
import HackathonImage from "../../assets/Hackathon.webp";
import ConferenceImage from "../../assets/conference/conference.webp";

// Import event data from separate files
import { technicalEvents } from "../../data/technicalEvents";
import { technicalDetails } from "../../data/technicalDetails";
import { nonTechnicalEvents } from "../../data/nonTechnicalEvents";
import { nonTechnicalDetails } from "../../data/nonTechnicalDetails";
import { culturalEvents, culturalDetails } from "../../data/culturalEvents";
import { hackathonEvents, hackathonDetails } from "../../data/hackathonEvents";
import { workshopEvents, workshopDetails } from "../../data/workshopEvents";
import { conferenceEvents } from "../../data/conferenceEvents";
import { exposAndShowsEvents } from "../../data/exposAndShowsEvents";
import { exposAndShowsDetails } from "../../data/exposAndShowsDetails";
import { supabase } from "../../supabase";

// Category map constant - moved outside component to prevent recreation on every render
const CATEGORY_MAP = {
  'technical': 1,
  'non-technical': 2, 
  'harmonicks': 3,
  'hackathon': 4,
  'workshop': 5,
  'conference': 6,
  'expos-and-shows': 7
};

const CATEGORY_NAMES = ['technical', 'non-technical', 'harmonicks', 'hackathon', 'workshop', 'conference', 'expos-and-shows'];

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [selectedCultural, setSelectedCultural] = useState(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [selectedTechnical, setSelectedTechnical] = useState(null);
  const [selectedNonTechnical, setSelectedNonTechnical] = useState(null);
  const [selectedExpo, setSelectedExpo] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const eventsRef = useRef(null);

  // Check authentication status - fetch session once (AuthProvider handles global auth state)
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      // Also check admin role from localStorage
      const userRole = localStorage.getItem('userRole');
      setIsAdmin(userRole === 'admin' || userRole === 'super_admin');
    };
    getUser();
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
      name: "Paper ,Poster & Project Presentation",
      descriptionImages: exposAndShowsEvents,
    },
  ];

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const eventParam = searchParams.get('event');
    
    // Handle direct event parameter (for opening specific modals)
    if (eventParam) {
      if (eventParam === 'startup-pitch') {
        // Set hackathon category and open startup pitch modal
        setSelectedEvent(4); // hackathon category id
        const index = events.findIndex(event => event.id === 4);
        if (index !== -1) {
          const anglePerEvent = 360 / events.length;
          const targetRotation = -(index * anglePerEvent);
          setRotation(targetRotation);
        }
        // Find and open the startup pitch hackathon modal
        const startupPitchEvent = hackathonDetails.find(h => h.id === 5);
        if (startupPitchEvent) {
          setSelectedHackathon(startupPitchEvent);
        }
      }
    } else if (categoryParam) {
      // Use constant category map
      const eventId = CATEGORY_MAP[categoryParam] || 1;
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
    
    // Update URL with selected category - use constant array
    const categoryName = CATEGORY_NAMES[index];
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
    } else if (eventId && eventId.startsWith("hackathon")) {
      // Check if it's a hackathon event - open modal instead of navigating
      const hackathonId = parseInt(eventId.replace("hackathon", ""));
      const hackathon = hackathonDetails.find(h => h.id === hackathonId);
      if (hackathon) {
        setSelectedHackathon(hackathon);
      }
    } else if (eventId && eventId.startsWith("cultural")) {
      // Check if it's a cultural event - open modal instead of navigating
      const cultural = culturalDetails.find(c => c.id === eventId);
      if (cultural) {
        setSelectedCultural(cultural);
      }
    } else if (eventId && eventId.startsWith("workshop")) {
      // Check if it's a workshop event - open modal instead of navigating
      const workshop = workshopDetails.find(w => w.id === eventId);
      if (workshop) {
        setSelectedWorkshop(workshop);
      }
    } else if (eventId && (eventId.startsWith("paper-") || eventId.startsWith("poster-") || eventId.startsWith("project-") || eventId === "auto-show")) {
      // Expos & Shows - open modal instead of navigating (paper, poster, project presentations and auto show)
      const expo = exposAndShowsDetails.find(e => e.id === eventId);
      if (expo) {
        setSelectedExpo(expo);
      }
    } else if (eventId && eventId.startsWith("tech")) {
      // Check if it's a technical event - open modal instead of navigating
      const technical = technicalDetails.find(t => t.id === eventId);
      if (technical) {
        setSelectedTechnical(technical);
      }
    } else if (eventId && (eventId.startsWith("nontech") || eventId.startsWith("expo-"))) {
      // Check if it's a non-technical event - open modal instead of navigating
      // Also handles "expo-" events (autoshow, droneshow, etc.) which are stored in nonTechnicalDetails
      const nonTechnical = nonTechnicalDetails.find(nt => nt.id === eventId);
      if (nonTechnical) {
        setSelectedNonTechnical(nonTechnical);
      }
    } else {
      navigate(`/event/${eventId}`);
    }
  };

  return (
    <>
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
              {selectedEventData?.descriptionImages.map((slide, index) => {
                const isHackathon = slide.eventId && slide.eventId.startsWith("hackathon");
                
                return (
                  <motion.div
                    key={`${slide.eventId}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-[300px]"
                  >
                    {isHackathon ? (
                      // Hackathon: Workshop-style card with Register Now button at bottom
                      <div className="text-white shadow-md overflow-hidden relative border-2 border-primary hover:border-secondary transition-colors duration-300 bg-primary/10 backdrop-blur-sm cursor-pointer group rounded-lg" onClick={() => handleSlideClick(slide.eventId)}>
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                          <img
                            src={slide.image}
                            alt={slide.title || "Hackathon Event"}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* Always visible Register Now button at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                            <div className="bg-secondary/20 backdrop-blur-md border-2 border-secondary/60 hover:bg-secondary/30 hover:border-secondary transition-all duration-300 px-4 py-2 flex items-center justify-between group-hover:shadow-lg group-hover:shadow-secondary/50 rounded-lg">
                              <span className="text-xs font-orbitron font-bold tracking-wider uppercase text-secondary">
                                REGISTER NOW
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
                      </div>
                    ) : (
                      // Other events: Original cyber card style
                      <div className="relative overflow-hidden bg-slate-900/50 border border-white/10 rounded-lg aspect-square cursor-pointer group-hover:border-secondary/50 transition-all duration-500" onClick={() => handleSlideClick(slide.eventId)}>
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
                    )}
                  </motion.div>
                );
              })}
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

      {/* Hackathon Modal - Moved outside main content for proper z-index stacking */}
      {selectedHackathon && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-[9999] p-4"
          onClick={() => setSelectedHackathon(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-primary/50 relative max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
              <button
                className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-slate-800/80 rounded-full p-2"
                onClick={() => setSelectedHackathon(null)}
              >
                <X size={24} />
              </button>

              <div className="p-6 md:p-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="w-full md:w-1/3">
                    <img
                      className="w-full aspect-square object-cover border-2 border-primary/30"
                      src={selectedHackathon.img}
                      alt={selectedHackathon.title}
                    />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                      {selectedHackathon.shortTitle}
                    </h2>
                    <h3 className="text-lg text-gray-300 mb-4">
                      {selectedHackathon.title}
                    </h3>
                    <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mb-6" />

                    <p className="text-gray-200 text-sm leading-relaxed mb-6">
                      {selectedHackathon.description}
                    </p>

                    {(Array.isArray(selectedHackathon.lunchannouncement)
                      ? selectedHackathon.lunchannouncement.length > 0
                      : Boolean(selectedHackathon.lunchannouncement)) && (
                      <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-6">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                          <span className="text-yellow-400 font-semibold text-sm">Note:</span>
                        </div>
                        {Array.isArray(selectedHackathon.lunchannouncement) ? (
                          <ul className="list-disc pl-6 text-yellow-300 text-sm mt-1 ml-1 space-y-1">
                            {selectedHackathon.lunchannouncement.map((note, index) => (
                              <li key={index} className="break-words">
                                {note}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-yellow-300 text-sm mt-1 ml-7 break-words">
                            {selectedHackathon.lunchannouncement}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Event Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-sm">{selectedHackathon.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="text-sm">{selectedHackathon.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedHackathon.registrationFee}</span>
                    </div>
                       {/* Event Details */}
                  

                    {/* Register Button */}
                    <button
                      className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-lg tracking-widest transition-all shadow-lg shadow-primary/20 border-2 border-primary"
                      onClick={() => {
                        if (!user) {
                          // Not logged in - redirect to login with return URL
                          setSelectedHackathon(null);
                          navigate('/login', { state: { returnTo: '/register-events' } });
                          return;
                        }
                        // Logged in - redirect to registration page, skip to event selection
                        setSelectedHackathon(null);
                        navigate('/register-events', { state: { skipToEventSelection: true } });
                      }}
                    >
                      REGISTER NOW
                    </button>
                  </div>
                </div>
            </div>


                {/* Rewards Section */}
                {selectedHackathon.rewards && selectedHackathon.rewards.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Prize Worth
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedHackathon.rewards.map((reward, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          className="bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-lg text-center"
                        >
                          <div className="text-3xl mb-2">{reward.emoji}</div>
                          <div className="text-lg font-bold text-white mb-1">{reward.position}</div>
                          <div className="text-2xl font-bold text-primary">{reward.amount}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}



                {/* Rounds Section */}
                {selectedHackathon.challenge && selectedHackathon.challenge.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Hackathon Rounds
                    </h3>
                    <div className="space-y-4">
                      {selectedHackathon.challenge.map((round, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg"
                        >
                          <h4 className="text-lg font-semibold text-white mb-2">{round.title}</h4>
                          {round.description && Array.isArray(round.description) && (
                            <ul className="space-y-1">
                              {round.description.map((desc, descIdx) => (
                                <li key={descIdx} className="text-sm text-gray-300 flex items-start gap-2">
                                  <span className="text-primary mt-1">▸</span>
                                  <span>{desc}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Schedule Section */}
                {selectedHackathon.schedule && selectedHackathon.schedule.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Event Schedule
                    </h3>
                    <div className="space-y-3">
                      {selectedHackathon.schedule.map((event, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg"
                        >
                          <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                            {event.round && <div><span className="text-primary font-semibold">Round:</span> {event.round}</div>}
                            {event.date && <div><span className="text-primary font-semibold">Date:</span> {event.date}</div>}
                            {event.time && <div><span className="text-primary font-semibold">Time:</span> {event.time}</div>}
                            {event.location && <div><span className="text-primary font-semibold">Location:</span> {event.location}</div>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}


                {/* problem Section */}
                {selectedHackathon.problemstatement && selectedHackathon.problemstatement.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Problem Statement : Design an Industrial control node with following features:
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedHackathon.problemstatement.map((problem, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="flex items-start gap-2 text-gray-300"
                        >
                          <span className="text-primary mt-1">▸</span>
                          <span className="text-sm">{problem}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Rules Section */}
                {selectedHackathon.rules && selectedHackathon.rules.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Rules & Guidelines
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedHackathon.rules.map((rule, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="flex items-start gap-2 text-gray-300"
                        >
                          <span className="text-primary mt-1">▸</span>
                          <span className="text-sm">{rule}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}



                {/* Eligibility Section */}
                {selectedHackathon.eligibility && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Eligibility Criteria
                    </h3>
                    <div className="space-y-4">
                      {selectedHackathon.eligibility.categories && Array.isArray(selectedHackathon.eligibility.categories) && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Eligible Participants:</h4>
                          <div className="space-y-2">
                            {selectedHackathon.eligibility.categories.map((category, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                className="flex items-start gap-2 text-gray-300"
                              >
                                <span className="text-primary mt-1">▸</span>
                                <span className="text-sm">{category}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedHackathon.eligibility.teamSize && (
                        <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-white mb-2">Team Size:</h4>
                          <div className="text-sm text-gray-300">
                            <p><span className="text-primary">Minimum:</span> {selectedHackathon.eligibility.teamSize.minimum} member(s)</p>
                            <p><span className="text-primary">Maximum:</span> {selectedHackathon.eligibility.teamSize.maximum} members</p>
                            {selectedHackathon.eligibility.teamSize.note && (
                              <p className="mt-2 italic"><span className="text-primary">Note:</span> {selectedHackathon.eligibility.teamSize.note}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                

                {/* Theme Section */}
                {selectedHackathon.theme && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Hackathon Theme
                    </h3>
                    <div className="bg-gradient-to-r from-secondary/20 to-primary/20 p-4 rounded-lg">
                      {selectedHackathon.theme.primary && (
                        <p className="text-lg font-semibold text-white mb-3">{selectedHackathon.theme.primary}</p>
                      )}
                      {selectedHackathon.theme.details && Array.isArray(selectedHackathon.theme.details) && (
                        <div className="space-y-2">
                          {selectedHackathon.theme.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-gray-300">
                              <span className="text-primary mt-1">▸</span>
                              <span className="text-sm">{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* notable Section */}
                {selectedHackathon.notable && selectedHackathon.notable.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Opporunity for Winners : 
                    </h3>
                    <div className="space-y-4">
                      {selectedHackathon.notable.map((notable, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg"
                        >
                          <h4 className="text-lg font-semibold text-white mb-2">{notable.title}</h4>
                          {notable.description && Array.isArray(notable.description) && (
                            <ul className="space-y-1">
                              {notable.description.map((desc, descIdx) => (
                                <li key={descIdx} className="text-sm text-gray-300 flex items-start gap-2">
                                  <span className="text-primary mt-1">▸</span>
                                  <span>{desc}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Registration Fee Section */}
                {selectedHackathon.registrationdetails && Array.isArray(selectedHackathon.registrationdetails) && selectedHackathon.registrationdetails.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Registration Details
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedHackathon.registrationdetails.map((detail, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="flex items-start gap-2 text-gray-300"
                        >
                          <span className="text-primary mt-1">▸</span>
                          <span className="text-sm">{detail}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Section */}
                {selectedHackathon.contact && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Contact Information
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Faculty Coordinators */}
                      {selectedHackathon.contact.facultyCoordinator && selectedHackathon.contact.facultyCoordinator.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-secondary mb-3">
                            Faculty Coordinators
                          </h4>
                          <div className="space-y-4">
                            {selectedHackathon.contact.facultyCoordinator.map((faculty, idx) => (
                              <div
                                key={idx}
                                className="bg-primary/5 border border-primary/20 p-4"
                              >
                                <p className="text-gray-200 font-medium mb-2">{faculty.name}</p>
                                {faculty.phone && (
                                  <p className="text-gray-400 text-sm">📞 {faculty.phone}</p>
                                )}
                                {faculty.email && (
                                  <p className="text-gray-400 text-sm break-all">✉️ {faculty.email}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Student Coordinators */}
                      {selectedHackathon.contact.studentCoordinator && selectedHackathon.contact.studentCoordinator.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-secondary mb-3">
                            Student Coordinators
                          </h4>
                          <div className="space-y-4">
                            {selectedHackathon.contact.studentCoordinator.map((student, idx) => (
                              <div
                                key={idx}
                                className="bg-primary/5 border border-primary/20 p-4"
                              >
                                <p className="text-gray-200 font-medium mb-2">{student.name}</p>
                                {student.phone && (
                                  <p className="text-gray-400 text-sm">📞 {student.phone}</p>
                                )}
                                {student.email && (
                                  <p className="text-gray-400 text-sm break-all">✉️ {student.email}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

      {/* Cultural/Harmonicks Modal - Moved outside main content for proper z-index stacking */}
      {selectedCultural && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-[9999] p-4"
          onClick={() => setSelectedCultural(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-primary/50 relative max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-slate-800/80 rounded-full p-2"
              onClick={() => setSelectedCultural(null)}
            >
              <X size={24} />
            </button>

            <div className="p-6 md:p-10">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-1/3">
                  <img
                    className="w-full aspect-square object-cover border-2 border-primary/30"
                    src={selectedCultural.img}
                    alt={selectedCultural.title}
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                    {selectedCultural.shortTitle}
                  </h2>
                  <h3 className="text-lg text-gray-300 mb-4">
                    {selectedCultural.title}
                  </h3>
                  <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mb-6" />

                  <p className="text-gray-200 text-sm leading-relaxed mb-6">
                    {selectedCultural.description}
                  </p>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedCultural.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedCultural.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedCultural.price}</span>
                    </div>
                  </div>


                  {/* Important Note */}
                  {/*<div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-400 font-semibold text-sm">Important Note:</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-1 ml-7">Lunch will be provided for all Events.</p>
                  </div>/*}

                  {/* Register Button */}
                  <button
                    className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-lg tracking-widest transition-all shadow-lg shadow-primary/20 border-2 border-primary"
                    onClick={() => {
                      if (!user) {
                        // Not logged in - redirect to login with return URL
                        setSelectedCultural(null);
                        navigate('/login', { state: { returnTo: '/register-events' } });
                        return;
                      }
                      // Logged in - redirect to registration page, skip to event selection
                      setSelectedCultural(null);
                      navigate('/register-events', { state: { skipToEventSelection: true } });
                    }}
                  >
                    REGISTER NOW
                  </button>
                </div>
              </div>

              {/* Schedule Section */}
              {selectedCultural.schedule && selectedCultural.schedule.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Event Schedule
                  </h3>
                  <div className="space-y-3">
                    {selectedCultural.schedule.map((event, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg"
                      >
                        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                          {event.round && <div><span className="text-primary font-semibold">Round:</span> {event.round}</div>}
                          {event.date && <div><span className="text-primary font-semibold">Date:</span> {event.date}</div>}
                          {event.time && <div><span className="text-primary font-semibold">Time:</span> {event.time}</div>}
                          {event.location && <div><span className="text-primary font-semibold">Location:</span> {event.location}</div>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules Section */}
              {selectedCultural.rules && selectedCultural.rules.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Rules & Guidelines
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedCultural.rules.map((rule, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{rule}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {selectedCultural.contact && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Faculty Coordinators */}
                    {selectedCultural.contact.facultyCoordinator && selectedCultural.contact.facultyCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Faculty Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedCultural.contact.facultyCoordinator.map((faculty, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{faculty.name}</p>
                              {faculty.phone && (
                                <p className="text-gray-400 text-sm">📞 {faculty.phone}</p>
                              )}
                              {faculty.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {faculty.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student Coordinators */}
                    {selectedCultural.contact.studentCoordinator && selectedCultural.contact.studentCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Student Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedCultural.contact.studentCoordinator.map((student, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{student.name}</p>
                              {student.phone && (
                                <p className="text-gray-400 text-sm">📞 {student.phone}</p>
                              )}
                              {student.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {student.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Workshop Modal - Moved outside main content for proper z-index stacking */}
      {selectedWorkshop && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-[9999] p-4"
          onClick={() => setSelectedWorkshop(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-primary/50 relative max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-slate-800/80 rounded-full p-2"
              onClick={() => setSelectedWorkshop(null)}
            >
              <X size={24} />
            </button>

            <div className="p-6 md:p-10">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-1/3">
                  <img
                    className="w-full aspect-square object-cover border-2 border-primary/30"
                    src={selectedWorkshop.img}
                    alt={selectedWorkshop.title}
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                    {selectedWorkshop.shortTitle}
                  </h2>
                  <h3 className="text-lg text-gray-300 mb-4">
                    {selectedWorkshop.title}
                  </h3>
                  <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mb-6" />

                  <p className="text-gray-200 text-sm leading-relaxed mb-6">
                    {selectedWorkshop.description}
                  </p>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedWorkshop.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedWorkshop.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedWorkshop.price}</span>
                    </div>
                  </div>

                  {/* Important Note */}
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-400 font-semibold text-sm">Important Note:</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-1 ml-7">Lunch will be provided for all Events.</p>
                  </div>


                  {/* Important Note */}
                  {(selectedWorkshop.importantNote || selectedWorkshop.importantText) && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-6">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <span className="text-yellow-400 font-semibold text-sm">Important Note:</span>
                      </div>
                      <div className="mt-1 ml-7 space-y-1">
                        {selectedWorkshop.importantText && (
                          <p className="text-yellow-300 text-sm break-words">{selectedWorkshop.importantText}</p>
                        )}
                        {selectedWorkshop.importantNote && (
                          <p className="text-yellow-300 text-sm break-words">
                            <a
                              href={selectedWorkshop.importantNote}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-yellow-200 hover:text-yellow-100"
                            >
                              {selectedWorkshop.importantNote}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-lg tracking-widest transition-all shadow-lg shadow-primary/20 border-2 border-primary"
                    onClick={() => {
                      if (!user) {
                        // Not logged in - redirect to login with return URL
                        setSelectedWorkshop(null);
                        navigate('/login', { state: { returnTo: '/register-events' } });
                        return;
                      }
                      // Logged in - redirect to registration page, skip to event selection
                      setSelectedWorkshop(null);
                      navigate('/register-events', { state: { skipToEventSelection: true } });
                    }}
                  >
                    REGISTER NOW
                  </button>
                </div>
              </div>

              {/* Schedule Section */}
              {selectedWorkshop.schedule && selectedWorkshop.schedule.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Workshop Schedule
                  </h3>
                  <div className="space-y-3">
                    {selectedWorkshop.schedule.map((event, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg"
                      >
                        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                          {event.round && <div><span className="text-primary font-semibold">Session:</span> {event.round}</div>}
                          {event.date && <div><span className="text-primary font-semibold">Date:</span> {event.date}</div>}
                          {event.time && <div><span className="text-primary font-semibold">Time:</span> {event.time}</div>}
                          {event.duration && <div><span className="text-primary font-semibold">Duration:</span> {event.duration}</div>}
                          {event.location && <div><span className="text-primary font-semibold">Location:</span> {event.location}</div>}
                          {event.venue && <div><span className="text-primary font-semibold">Venue:</span> {event.venue}</div>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {selectedWorkshop.contact && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Faculty Coordinators */}
                    {selectedWorkshop.contact.facultyCoordinator && selectedWorkshop.contact.facultyCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Faculty Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedWorkshop.contact.facultyCoordinator.map((faculty, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{faculty.name}</p>
                              {faculty.phone && (
                                <p className="text-gray-400 text-sm">📞 {faculty.phone}</p>
                              )}
                              {faculty.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {faculty.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student Coordinators */}
                    {selectedWorkshop.contact.studentCoordinator && selectedWorkshop.contact.studentCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Student Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedWorkshop.contact.studentCoordinator.map((student, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{student.name}</p>
                              {student.phone && (
                                <p className="text-gray-400 text-sm">📞 {student.phone}</p>
                              )}
                              {student.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {student.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Expos & Shows Modal */}
      {selectedExpo && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-[9999] p-4"
          onClick={() => setSelectedExpo(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-primary/50 rounded-lg relative max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-slate-800/80 rounded-full p-2"
              onClick={() => setSelectedExpo(null)}
            >
              <X size={24} />
            </button>

            <div className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-1/3">
                  <img
                    className="w-full aspect-square object-cover border-2 border-primary/30"
                    src={selectedExpo.img}
                    alt={selectedExpo.title}
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                    {selectedExpo.shortTitle}
                  </h2>
                  <h3 className="text-lg text-gray-300 mb-4">
                    {selectedExpo.title}
                  </h3>
                  <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mb-6" />

                  <p className="text-gray-200 text-sm leading-relaxed mb-6">
                    {selectedExpo.description}
                  </p>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedExpo.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedExpo.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedExpo.price}</span>
                    </div>
                  </div>


                  {/* Important Note */}
                  {/*<div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-400 font-semibold text-sm">Important Note:</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-1 ml-7">Lunch will be provided for all Events.</p>
                  </div>*/}

                  {/* Register Button */}
                  <button
                    className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-lg tracking-widest transition-all shadow-lg shadow-primary/20 border-2 border-primary"
                    onClick={() => {
                      if (!user) {
                        setSelectedExpo(null);
                        navigate('/login', { state: { returnTo: '/register-events' } });
                      } else {
                        setSelectedExpo(null);
                        navigate('/register-events', { state: { skipToEventSelection: true } });
                      }
                    }}
                  >
                    REGISTER NOW
                  </button>
                </div>  
              </div>

              {/* Theme Section */}
              {selectedExpo.theme && selectedExpo.theme.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Theme
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedExpo.theme.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Requirements Section */}
              {selectedExpo.projectRequirements && selectedExpo.projectRequirements.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Project Requirements
                  </h3>
                  <div className="space-y-6">
                    {selectedExpo.projectRequirements.map((requirement, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg"
                      >
                        <h4 className="text-lg font-semibold text-primary mb-3">
                          {requirement.title}
                        </h4>
                        <div className="space-y-2">
                          {requirement.details.map((detail, detailIdx) => (
                            <div
                              key={detailIdx}
                              className="flex items-start gap-2 text-gray-300"
                            >
                              <span className="text-primary mt-1">▸</span>
                              <span className="text-sm">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards Section */}
              {selectedExpo.awards && selectedExpo.awards.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Awards
                  </h3>
                  <div className="space-y-4">
                    {selectedExpo.awards.map((award, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg"
                      >
                        <h4 className="text-lg font-semibold text-primary mb-2">
                          {award.title}
                        </h4>
                        <p className="text-gray-300 text-sm">
                          {award.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules & Guidelines Section */}
              {selectedExpo.rules && selectedExpo.rules.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Rules & Guidelines
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedExpo.rules.map((rule, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{rule}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {selectedExpo.schedule && selectedExpo.schedule.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Event Schedule
                  </h3>
                  <div className="space-y-3">
                    {selectedExpo.schedule.map((event, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg"
                      >
                        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                          {event.round && <div><span className="text-primary font-semibold">Round:</span> {event.round}</div>}
                          {event.date && <div><span className="text-primary font-semibold">Date:</span> {event.date}</div>}
                          {event.time && <div><span className="text-primary font-semibold">Time:</span> {event.time}</div>}
                          {event.duration && <div><span className="text-primary font-semibold">Duration:</span> {event.duration}</div>}
                          {event.location && <div><span className="text-primary font-semibold">Location:</span> {event.location}</div>}
                          {event.venue && <div><span className="text-primary font-semibold">Venue:</span> {event.venue}</div>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission Details Section */}
              {((selectedExpo.papersubmission && selectedExpo.papersubmission.length > 0) || 
                (selectedExpo.postersubmission && selectedExpo.postersubmission.length > 0)) && (
                <div className="mb-8">
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-400 font-semibold text-sm">Submission Details:</span>
                    </div>
                    <div className="ml-7 space-y-2">
                      {selectedExpo.papersubmission?.length > 0 && (
                        <div className="text-yellow-300 text-sm break-words space-y-1">
                          {selectedExpo.papersubmission.map((item, idx) => (
                            <div key={`paper-submission-${idx}`} className="space-y-1">
                              {Array.isArray(item.description)
                                ? item.description.map((line, lineIdx) => (
                                    <p key={`paper-submission-${idx}-${lineIdx}`}>{line}</p>
                                  ))
                                : item.description && <p>{item.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedExpo.postersubmission?.length > 0 && (
                        <div className="text-yellow-300 text-sm break-words space-y-1">
                          {selectedExpo.postersubmission.map((item, idx) => (
                            <div key={`poster-submission-${idx}`} className="space-y-1">
                              {Array.isArray(item.description)
                                ? item.description.map((line, lineIdx) => (
                                    <p key={`poster-submission-${idx}-${lineIdx}`}>{line}</p>
                                  ))
                                : item.description && <p>{item.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {selectedExpo.contact && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Faculty Coordinators */}
                    {selectedExpo.contact.facultyCoordinator && selectedExpo.contact.facultyCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Faculty Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedExpo.contact.facultyCoordinator.map((faculty, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{faculty.name}</p>
                              {faculty.phone && (
                                <p className="text-gray-400 text-sm">📞 {faculty.phone}</p>
                              )}
                              {faculty.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {faculty.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student Coordinators */}
                    {selectedExpo.contact.studentCoordinator && selectedExpo.contact.studentCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Student Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedExpo.contact.studentCoordinator.map((student, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{student.name}</p>
                              {student.phone && (
                                <p className="text-gray-400 text-sm">📞 {student.phone}</p>
                              )}
                              {student.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {student.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Technical Event Modal */}
      {selectedTechnical && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-[9999] p-4"
          onClick={() => setSelectedTechnical(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-primary/50 rounded-lg relative max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedTechnical(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-slate-800/80 rounded-full p-2"
            >
              <X size={24} />
            </button>

            <div className="p-6 md:p-10">\n              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-1/3">
                  <img
                    className="w-full aspect-square object-cover border-2 border-primary/30"
                    src={selectedTechnical.img}
                    alt={selectedTechnical.title}
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                    {selectedTechnical.shortTitle}
                  </h2>
                  <h3 className="text-lg text-gray-300 mb-4">
                    {selectedTechnical.title}
                  </h3>
                  <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mb-6" />

                  <p className="text-gray-200 text-sm leading-relaxed mb-6">
                    {selectedTechnical.description}
                  </p>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedTechnical.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedTechnical.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedTechnical.price}</span>
                    </div>
                  </div>

                  {/* Important Note */}
                  {(selectedTechnical.importantNote || selectedTechnical.importantText || (selectedTechnical.papersubmission && selectedTechnical.papersubmission.length > 0)) && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-6">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <span className="text-yellow-400 font-semibold text-sm">Important Note:</span>
                      </div>
                      <div className="mt-1 ml-7 space-y-1">
                        {selectedTechnical.importantText && (
                          <p className="text-yellow-300 text-sm break-words">{selectedTechnical.importantText}</p>
                        )}
                        {selectedTechnical.importantNote && (
                          <p className="text-yellow-300 text-sm break-words">
                            <a
                              href={selectedTechnical.importantNote}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-yellow-200 hover:text-yellow-100"
                            >
                              {selectedTechnical.importantNote}
                            </a>
                          </p>
                        )}
                        {selectedTechnical.papersubmission?.length > 0 && (
                          <div className="text-yellow-300 text-sm break-words space-y-1">
                            {selectedTechnical.papersubmission.map((item, idx) => (
                              <div key={`paper-submission-${idx}`} className="space-y-1">
                                {Array.isArray(item.description)
                                  ? item.description.map((line, lineIdx) => (
                                      <p key={`paper-submission-${idx}-${lineIdx}`}>{line}</p>
                                    ))
                                  : item.description && <p>{item.description}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Important Note */}
                  {/*<div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-400 font-semibold text-sm">Important Note:</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-1 ml-7">Lunch will be provided for all Events.</p>
                  </div>*/}

                  {/* Register Button */}
                  <button
                    className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-lg tracking-widest transition-all shadow-lg shadow-primary/20 border-2 border-primary"
                    onClick={() => {
                      if (!user) {
                        setSelectedTechnical(null);
                        navigate('/login', { state: { returnTo: '/register-events' } });
                      } else {
                        setSelectedTechnical(null);
                        navigate('/register-events', { state: { skipToEventSelection: true } });
                      }
                    }}
                  >
                    REGISTER NOW
                  </button>
                </div>
              </div>


              {/* Rewards Section */}
                {selectedTechnical.rewards && selectedTechnical.rewards.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                      Prize Worth
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedTechnical.rewards.map((reward, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          className="bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-lg text-center"
                        >
                          <div className="text-3xl mb-2">{reward.emoji}</div>
                          <div className="text-lg font-bold text-white mb-1">{reward.position}</div>
                          <div className="text-2xl font-bold text-primary">{reward.amount}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Schedule Section */}
              {selectedTechnical.schedule && selectedTechnical.schedule.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Event Schedule
                  </h3>
                  <div className="space-y-3">
                    {selectedTechnical.schedule.map((event, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg"
                      >
                        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                          {event.round && <div><span className="text-primary font-semibold">Round:</span> {event.round}</div>}
                          {event.date && <div><span className="text-primary font-semibold">Date:</span> {event.date}</div>}
                          {event.time && <div><span className="text-primary font-semibold">Time:</span> {event.time}</div>}
                          {event.location && <div><span className="text-primary font-semibold">Location:</span> {event.location}</div>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              

              {/* Rules Section */}
              {selectedTechnical.rules && selectedTechnical.rules.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Rules & Guidelines
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedTechnical.rules.map((rule, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{rule}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards Section */}
              {selectedTechnical.awards && selectedTechnical.awards.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Awards
                  </h3>
                  <div className="space-y-4">
                    {selectedTechnical.awards.map((award, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg"
                      >
                        <h4 className="text-lg font-semibold text-primary mb-2">
                          {award.title}
                        </h4>
                        <p className="text-gray-300 text-sm">
                          {award.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules Section */}
              {selectedTechnical.slot && selectedTechnical.slot.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Slot
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedTechnical.slot.map((rule, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{rule}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}


              {/* Topics Section */}
              {selectedTechnical.topics && selectedTechnical.topics.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Topics
                  </h3>
                  <div className="bg-gradient-to-r from-secondary/20 to-primary/20 p-4 rounded-lg">
                    <div className="space-y-2">
                      {selectedTechnical.topics.map((topic, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="text-gray-300"
                        >
                          {topic.title && (
                            <p className="text-lg font-semibold text-white mb-3">{topic.title}</p>
                          )}
                          {topic.description && Array.isArray(topic.description) && (
                            <div className="space-y-2">
                              {topic.description.map((detail, detailIdx) => (
                                <div key={detailIdx} className="flex items-start gap-2 text-gray-300">
                                  <span className="text-primary mt-1">▸</span>
                                  <span className="text-sm">{detail}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rounds Section */}
              {selectedTechnical.rounds && selectedTechnical.rounds.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Event Rounds
                  </h3>
                  <div className="space-y-4">
                    {selectedTechnical.rounds.map((round, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg"
                      >
                        <h4 className="text-lg font-semibold text-white mb-2">{round.title}</h4>
                        {round.description && Array.isArray(round.description) && (
                          <ul className="space-y-1">
                            {round.description.map((desc, descIdx) => (
                              <li key={descIdx} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-primary mt-1">▸</span>
                                <span>{desc}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {selectedTechnical.contact && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Faculty Coordinators */}
                    {selectedTechnical.contact.facultyCoordinator && selectedTechnical.contact.facultyCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Faculty Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedTechnical.contact.facultyCoordinator.map((faculty, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{faculty.name}</p>
                              {faculty.phone && (
                                <p className="text-gray-400 text-sm">📞 {faculty.phone}</p>
                              )}
                              {faculty.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {faculty.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student Coordinators */}
                    {selectedTechnical.contact.studentCoordinator && selectedTechnical.contact.studentCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Student Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedTechnical.contact.studentCoordinator.map((student, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{student.name}</p>
                              {student.phone && (
                                <p className="text-gray-400 text-sm">📞 {student.phone}</p>
                              )}
                              {student.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {student.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Non-Technical Event Modal */}
      {selectedNonTechnical && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-[9999] p-4"
          onClick={() => setSelectedNonTechnical(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-primary/50 rounded-lg relative max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedNonTechnical(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-slate-800/80 rounded-full p-2"
            >
              <X size={24} />
            </button>

            <div className="p-6 md:p-10">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-1/3">
                  <img
                    className="w-full aspect-square object-cover border-2 border-primary/30"
                    src={selectedNonTechnical.img}
                    alt={selectedNonTechnical.title}
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                    {selectedNonTechnical.shortTitle}
                  </h2>
                  <h3 className="text-lg text-gray-300 mb-4">
                    {selectedNonTechnical.title}
                  </h3>
                  <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mb-6" />

                  <p className="text-gray-200 text-sm leading-relaxed mb-6">
                    {selectedNonTechnical.description}
                  </p>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedNonTechnical.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedNonTechnical.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedNonTechnical.price}</span>
                    </div>
                  </div>

                  {/* Important Note */}
                  {/*<div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-400 font-semibold text-sm">Important Note:</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-1 ml-7">Lunch will be provided for all Events.</p>
                  </div>*/}

                  {/* Register Button */}
                  <button
                    className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-lg tracking-widest transition-all shadow-lg shadow-primary/20 border-2 border-primary"
                    onClick={() => {
                      if (!user) {
                        setSelectedNonTechnical(null);
                        navigate('/login', { state: { returnTo: '/register-events' } });
                      } else {
                        setSelectedNonTechnical(null);
                        navigate('/register-events', { state: { skipToEventSelection: true } });
                      }
                    }}
                  >
                    REGISTER NOW
                  </button>
                </div>
              </div>

              {/* Schedule Section */}
              {selectedNonTechnical.schedule && selectedNonTechnical.schedule.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Event Schedule
                  </h3>
                  <div className="space-y-3">
                    {selectedNonTechnical.schedule.map((event, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg"
                      >
                        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                          {event.round && <div><span className="text-primary font-semibold">Round:</span> {event.round}</div>}
                          {event.date && <div><span className="text-primary font-semibold">Date:</span> {event.date}</div>}
                          {event.time && <div><span className="text-primary font-semibold">Time:</span> {event.time}</div>}
                          {event.location && <div><span className="text-primary font-semibold">Location:</span> {event.location}</div>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules Section */}
              {selectedNonTechnical.rules && selectedNonTechnical.rules.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Rules & Guidelines
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedNonTechnical.rules.map((rule, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{rule}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rounds Section */}
              {selectedNonTechnical.rounds && selectedNonTechnical.rounds.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Event Rounds
                  </h3>
                  <div className="space-y-4">
                    {selectedNonTechnical.rounds.map((round, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg"
                      >
                        <h4 className="text-lg font-semibold text-white mb-2">{round.title}</h4>
                        {round.description && typeof round.description === 'string' && (
                          <p className="text-sm text-gray-300">{round.description}</p>
                        )}
                        {round.description && Array.isArray(round.description) && (
                          <ul className="space-y-1">
                            {round.description.map((desc, descIdx) => (
                              <li key={descIdx} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-primary mt-1">▸</span>
                                <span>{desc}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligibility Section (for special events like cricket) */}
              {selectedNonTechnical.eligibility && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Eligibility Criteria
                  </h3>
                  <div className="space-y-4">
                    {selectedNonTechnical.eligibility.categories && Array.isArray(selectedNonTechnical.eligibility.categories) && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Eligible Participants:</h4>
                        <div className="space-y-2">
                          {selectedNonTechnical.eligibility.categories.map((category, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              className="flex items-start gap-2 text-gray-300"
                            >
                              <span className="text-primary mt-1">▸</span>
                              <span className="text-sm">{category}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedNonTechnical.eligibility.teamSize && (
                      <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-white mb-2">Team Size:</h4>
                        <div className="text-sm text-gray-300">
                          <p><span className="text-primary">Minimum:</span> {selectedNonTechnical.eligibility.teamSize.minimum} member(s)</p>
                          <p><span className="text-primary">Maximum:</span> {selectedNonTechnical.eligibility.teamSize.maximum} members</p>
                          {selectedNonTechnical.eligibility.teamSize.note && (
                            <p className="mt-2 italic"><span className="text-primary">Note:</span> {selectedNonTechnical.eligibility.teamSize.note}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rewards Section (for special events) */}
              {selectedNonTechnical.rewards && selectedNonTechnical.rewards.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Prize Worth
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedNonTechnical.rewards.map((reward, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        className="bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-lg text-center"
                      >
                        <div className="text-3xl mb-2">{reward.emoji}</div>
                        <div className="text-lg font-bold text-white mb-1">{reward.position}</div>
                        <div className="text-2xl font-bold text-primary">{reward.amount}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {selectedNonTechnical.contact && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Faculty Coordinators */}
                    {selectedNonTechnical.contact.facultyCoordinator && selectedNonTechnical.contact.facultyCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Faculty Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedNonTechnical.contact.facultyCoordinator.map((faculty, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{faculty.name}</p>
                              {faculty.phone && (
                                <p className="text-gray-400 text-sm">📞 {faculty.phone}</p>
                              )}
                              {faculty.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {faculty.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student Coordinators */}
                    {selectedNonTechnical.contact.studentCoordinator && selectedNonTechnical.contact.studentCoordinator.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          Student Coordinators
                        </h4>
                        <div className="space-y-4">
                          {selectedNonTechnical.contact.studentCoordinator.map((student, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/5 border border-primary/20 p-4"
                            >
                              <p className="text-gray-200 font-medium mb-2">{student.name}</p>
                              {student.phone && (
                                <p className="text-gray-400 text-sm">📞 {student.phone}</p>
                              )}
                              {student.email && (
                                <p className="text-gray-400 text-sm break-all">✉️ {student.email}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Events;

