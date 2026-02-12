import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone,
  ExternalLink,
  User
} from 'lucide-react';
import { eventScheduleData } from '../../data/eventScheduleData';

const DetailedSchedule = () => {
  const [activeDay, setActiveDay] = useState(2);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getTypeColor = (type) => {
    switch (type) {
      case 'Technical': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'Non-Technical': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Hackathon': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Cultural': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      case 'Break': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Startup': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'General': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Technical': return '💻';
      case 'Non-Technical': return '🎯';
      case 'Hackathon': return '🚀';
      case 'Cultural': return '🎭';
      case 'Break': return '☕';
      case 'Startup': return '💡';
      case 'General': return '🎊';
      default: return '📌';
    }
  };

  const currentDayData = eventScheduleData[activeDay];
  const events = currentDayData?.events || [];

  return (
    <div className="min-h-screen bg-[#030014] pt-20 sm:pt-24 pb-20 sm:pb-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary via-orange-400 to-secondary mb-3 sm:mb-4 font-orbitron"
          >
            Detailed Event Schedule
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto px-2"
          >
            Complete event details with locations, timings, and coordinator information
          </motion.p>
        </div>

        {/* Day Selector */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 flex-wrap px-2">
          {[2, 3].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`relative px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 text-sm sm:text-base min-w-[100px] sm:min-w-[140px] ${
                activeDay === day 
                ? 'text-white' 
                : 'text-gray-500 hover:text-gray-300 bg-white/5 border border-white/10'
              }`}
            >
              {activeDay === day && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-secondary rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Day {day}</span>
            </button>
          ))}
        </div>

        {/* Day Info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {currentDayData?.title}
              </h2>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-secondary font-medium tracking-wider uppercase text-sm">
                <span>Theme: {currentDayData?.theme}</span>
                <span>•</span>
                <span>{currentDayData?.date}</span>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                  className="cursor-pointer group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/20 to-orange-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className={`relative bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-secondary/30 transition-all duration-300 overflow-hidden ${
                    selectedEvent?.id === event.id ? 'ring-2 ring-secondary' : ''
                  }`}>
                    {/* Event Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white flex-grow">{event.eventName}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(event.type)} whitespace-nowrap`}>
                          {event.type}
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">{event.description}</p>
                    </div>

                    {/* Quick Info - Always visible */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-secondary">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Time</p>
                          <p className="text-sm font-semibold">{event.startTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-secondary">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Location</p>
                          <p className="text-sm font-semibold truncate">{event.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details - Show on click */}
                    {selectedEvent?.id === event.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t border-white/10 mt-4"
                      >
                        {/* Map Link */}
                        <a 
                          href={event.mapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:border-secondary/50 transition-colors group/link"
                        >
                          <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
                          <span className="text-sm text-white group-link/hover:text-secondary transition-colors flex-grow">View on Map</span>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-link/hover:text-secondary transition-colors flex-shrink-0" />
                        </a>

                        {/* Coordinator Info */}
                        {event.coordinatorName && event.coordinatorName !== "Staff" && (
                          <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 text-white font-semibold">
                              <User className="w-4 h-4 text-secondary" />
                              <span>Coordinator</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-300">{event.coordinatorName}</p>
                              {event.coordinatorNumber && event.coordinatorNumber !== "N/A" && (
                                <a 
                                  href={`tel:${event.coordinatorNumber}`}
                                  className="flex items-center gap-2 text-secondary hover:text-orange-400 transition-colors"
                                >
                                  <Phone className="w-4 h-4" />
                                  <span>{event.coordinatorNumber}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Time Duration */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-gray-400 text-xs mb-1">Start</p>
                            <p className="font-semibold text-white">{event.startTime}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-gray-400 text-xs mb-1">End</p>
                            <p className="font-semibold text-white">{event.endTime}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Click Hint */}
                    {selectedEvent?.id !== event.id && (
                      <div className="text-center text-xs text-gray-500 mt-2">
                        Click for details
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Timeline View */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Timeline</h3>
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-secondary shadow-lg" />
                      {index < events.length - 1 && (
                        <div className="w-0.5 h-12 bg-gradient-to-b from-secondary to-transparent mt-2" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{event.eventName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.startTime} - {event.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-secondary/10 to-orange-500/10 border border-secondary/20"
        >
          <h3 className="text-lg font-bold text-white mb-3">📌 Important Information</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Reach the venue 15 minutes before the scheduled time</li>
            <li>• Contact the coordinator for any last-minute changes or queries</li>
            <li>• Check the map link to plan your route</li>
            <li>• Keep your registration QR code ready for check-in</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default DetailedSchedule;
