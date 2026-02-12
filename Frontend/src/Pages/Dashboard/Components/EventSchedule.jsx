import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Filter, 
  Search,
  ChevronRight,
  Star,
  Navigation
} from 'lucide-react';
import { eventScheduleData } from '../../../data/eventScheduleData';

const EventSchedule = () => {
  const [activeDay, setActiveDay] = useState(1);
  const [filter, setFilter] = useState('All Events');
  const [searchTerm, setSearchTerm] = useState('');

  // Get events directly from eventScheduleData
  const activeDaySchedule = eventScheduleData[activeDay]?.events || [];

  const filteredSchedule = activeDaySchedule.filter(event => {
    const matchesFilter = filter === 'All Events' || (filter === 'My Events' && event.isMyEvent);
    const matchesSearch = !searchTerm || 
      event.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.coordinatorName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold">Event Schedule</h2>
          <p className="text-gray-400 text-sm">Plan your journey through DaKshaa 2026</p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
          {['My Events', 'All Events'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex flex-col gap-4">
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events by name, location, type, or coordinator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
          />
        </div>

        {/* Day Tabs */}
        <div className="flex gap-4 border-b border-white/10">
        {[1, 2, 3].map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`pb-4 px-2 text-lg font-bold transition-all relative ${
              activeDay === day ? 'text-secondary' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Day {day}
            {activeDay === day && (
              <motion.div 
                layoutId="activeDay"
                className="absolute bottom-0 left-0 right-0 h-1 bg-secondary rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
              />
            )}
          </button>
        ))}
      </div>
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeDay}-${filter}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {filteredSchedule.length > 0 ? (
              filteredSchedule.map((event, idx) => (
                <div 
                  key={idx}
                  className={`group relative bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-white/[0.08] transition-all duration-300 ${
                    event.isMyEvent ? 'border-l-4 border-l-secondary' : ''
                  }`}
                >
                  {/* Time Column */}
                  <div className="md:w-32 shrink-0">
                    <div className="flex items-center gap-2 text-secondary font-bold">
                      <Clock size={16} />
                      <span>{event.startTime}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Session Start</p>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold group-hover:text-secondary transition-colors">{event.eventName}</h3>
                      {event.isMyEvent && (
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-secondary" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        <span>{event.type}</span>
                      </div>
                      {event.mapUrl && (
                        <a 
                          href={event.mapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Navigation size={14} className="text-blue-400" />
                          <span>View Map</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Coordinator Info & Mobile Actions */}
                  <div className="md:w-56 shrink-0 flex flex-col gap-2 w-full mt-2 md:mt-0">
                    <a 
                      href={event.coordinatorNumber ? `tel:${event.coordinatorNumber}` : undefined}
                      className={`flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 transition-all w-full relative group/btn ${
                        event.coordinatorNumber ? 'hover:bg-secondary/10 hover:border-secondary/30 active:scale-95 cursor-pointer' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0 group-hover/btn:bg-secondary group-hover/btn:text-white transition-colors">
                        <Phone size={18} />
                      </div>
                      <div className="overflow-hidden flex-1 text-left">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Coordinator</p>
                        <p className="text-sm font-bold truncate text-white">{event.coordinatorName}</p>
                      </div>
                      
                      {/* Mobile Call Indicator */}
                      {event.coordinatorNumber && (
                        <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                           <Phone size={14} className="fill-current" />
                        </div>
                      )}
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Calendar size={32} className="text-gray-600" />
                </div>
                <p className="text-gray-500 font-medium">No events found for this day.</p>
                {filter === 'My Events' && (
                  <button 
                    onClick={() => setFilter('All Events')}
                    className="text-secondary font-bold hover:underline"
                  >
                    Browse All Events
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EventSchedule;

