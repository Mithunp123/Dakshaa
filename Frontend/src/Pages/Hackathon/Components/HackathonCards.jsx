import React, { useState, useEffect } from "react";
import { Slide } from "react-awesome-reveal";
import { motion } from "framer-motion";
import { X, MapPin, Calendar, Users, Trophy } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { hackathonDetails } from "../../../data/hackathonEvents";

const HackathonCards = () => {
  const title = "Hackathon";
  const [selectedHackathon, setSelectedHackathon] = useState(null);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <div className="container mx-auto mb-28 mt-[120px] px-4">
      {/* Banner */}
      <motion.div
        className="text-center border-2 border-primary bg-primary/10 backdrop-blur-sm text-white py-8 px-6 mb-12 max-w-6xl mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        data-aos="fade-down"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3">
          ACCESSING DATABASE...
        </h2>
        <p className="text-gray-200 text-sm sm:text-lg font-semibold mb-2">
          Hackathons - Where Innovation Meets Technology
        </p>
        <p className="text-gray-300 text-xs sm:text-base">
          Join us for intensive coding marathons and create groundbreaking solutions
        </p>
      </motion.div>

      {/* Animated Title */}
      <h1
        className="text-center font-bold text-white md:text-5xl text-2xl mb-10 mt-8"
        data-aos="fade-down"
      >
        {title.split("").map((char, index) => (
          <motion.span
            key={index}
            style={{ display: "inline-block" }}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: index * 0.1 }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </h1>

      {/* Cards Section */}
      <div className="flex flex-wrap justify-center w-full gap-6">
        {hackathonDetails.map((hackathon, index) => (
          <div
            key={hackathon.id}
            className="w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] max-w-[400px] border-2 border-primary hover:border-secondary transition-colors duration-300 bg-primary/10 backdrop-blur-sm rounded-lg"
            data-aos="fade-up"
            data-aos-delay={index * 100}
          >
            <div className="text-white shadow-md overflow-hidden relative group rounded-lg">
              <div className="relative w-full aspect-square cursor-pointer rounded-lg overflow-hidden" onClick={() => setSelectedHackathon(hackathon)}>
                <img
                  src={hackathon.img}
                  alt={hackathon.title}
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
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedHackathon && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-[100] p-4"
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
                      <span className="text-sm">{selectedHackathon.department}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics Section */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                  Hackathon Tracks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedHackathon.topics.map((topic, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="flex items-start gap-2 text-gray-300"
                    >
                      <span className="text-primary mt-1">▸</span>
                      <span className="text-sm">{topic}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Rewards Section */}
              {selectedHackathon.rewards && selectedHackathon.rewards.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Prizes & Rewards
                  </h3>
                  
                  {/* Podium Prize Layout */}
                  <div className="flex justify-center items-end gap-4 sm:gap-8 px-4 mb-6">
                    {selectedHackathon.rewards && (() => {
                      // Create podium order: 2nd, 1st, 3rd (traditional podium layout)
                      const first = selectedHackathon.rewards.find(r => r.position.includes('1st'));
                      const second = selectedHackathon.rewards.find(r => r.position.includes('2nd'));
                      const third = selectedHackathon.rewards.find(r => r.position.includes('3rd'));
                      const orderedRewards = [second, first, third].filter(Boolean);
                      
                      return orderedRewards.map((reward, index) => {
                        const isFirst = reward.position.includes('1st');
                        const isSecond = reward.position.includes('2nd');
                        const isThird = reward.position.includes('3rd');
                        
                        const trophySize = isFirst ? 'w-16 h-16 sm:w-24 sm:h-24' : isSecond ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-14 sm:h-14';
                        const trophyColor = isFirst ? 'text-yellow-400' : isSecond ? 'text-gray-300' : 'text-orange-400';
                        const podiumSize = isFirst ? 'w-24 sm:w-36 h-32 sm:h-44' : isSecond ? 'w-20 sm:w-28 h-24 sm:h-32' : 'w-16 sm:w-24 h-20 sm:h-28';
                        const numberSize = isFirst ? 'text-4xl sm:text-5xl' : isSecond ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl';
                        const position = isFirst ? '1' : isSecond ? '2' : '3';
                        
                        return (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                            className="flex flex-col items-center"
                          >
                            <Trophy className={`${trophySize} mb-2 ${trophyColor}`} />
                            <div className={`bg-cyan-500/80 ${podiumSize} flex flex-col items-center justify-center rounded-t-lg`}>
                              <span className={`text-white ${numberSize} font-bold`}>{position}</span>
                            </div>
                          </motion.div>
                        );
                      });
                    })()}
                  </div>

                  {/* Prize Details Below Podium */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedHackathon.rewards.map((reward, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                        className="bg-primary/5 border border-primary/20 p-4 text-center"
                      >
                        <span className="text-lg font-bold block mb-2 text-gray-200">
                          {reward.emoji} {reward.position}
                        </span>
                        <span className="text-2xl font-semibold text-white">
                          {reward.amount}
                        </span>
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
              {selectedHackathon.eligibility && selectedHackathon.eligibility.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Eligibility Criteria
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedHackathon.eligibility.map((criterion, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{criterion}</span>
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
                  
                  {/* Faculty Coordinators */}
                  {selectedHackathon.contact.facultyCoordinator && selectedHackathon.contact.facultyCoordinator.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-secondary mb-3">
                        Faculty Coordinators
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
              )}

              {/* Registration Button */}
              {selectedHackathon.registrationLink && (
                <div className="text-center mt-8">
                  <a
                    href={selectedHackathon.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-primary hover:bg-primary/80 text-white font-semibold px-8 py-3 border-2 border-primary hover:border-secondary transition-all duration-300"
                  >
                    Register Now
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HackathonCards;
