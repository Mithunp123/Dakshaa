import React, { useState, useEffect } from 'react';
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
import { supabase } from '../../../supabase';

const EventSchedule = () => {
  const [activeDay, setActiveDay] = useState(1);
  const [filter, setFilter] = useState('All Events'); // 'My Events' or 'All Events' - Default to All Events
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Ensure backend runs on 3000 or configure via env
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${API_URL}/api/schedule${userId ? `?userId=${userId}` : ''}`);
      const data = await response.json();

      console.log('📅 Schedule API Response:', data);

      if (data.success) {
        setSchedule(data.schedule);
        console.log('📅 Schedule loaded:', {
          day1: data.schedule[1]?.length || 0,
          day2: data.schedule[2]?.length || 0,
          day3: data.schedule[3]?.length || 0,
          total: (data.schedule[1]?.length || 0) + (data.schedule[2]?.length || 0) + (data.schedule[3]?.length || 0)
        });
      } else {
        console.error('Failed to load schedule:', data.error);
        // Fallback to empty if fetch fails
        setSchedule({});
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setSchedule({});
    } finally {
      setLoading(false);
    }
  };

  const activeDaySchedule = schedule[activeDay] || [];

  const filteredSchedule = activeDaySchedule.filter(event => 
    filter === 'All Events' || (filter === 'My Events' && event.isMyEvent)
  );

  console.log(`📅 Day ${activeDay} - Filter: ${filter} - Showing ${filteredSchedule.length} of ${activeDaySchedule.length} events`);

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

      {/* Schedule List */}
      <div className="space-y-4">
        {loading ? (
             <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
             </div>
        ) : (
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
                      <span>{event.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Session Start</p>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold group-hover:text-secondary transition-colors">{event.name}</h3>
                      {event.isMyEvent && (
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-secondary" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        <span>{event.category}</span>
                      </div>
                      {event.coordinates && (
                        <a 
                          href={event.coordinates} 
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
                      href={event.phone ? `tel:${event.phone}` : undefined}
                      className={`flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 transition-all w-full relative group/btn ${
                        event.phone ? 'hover:bg-secondary/10 hover:border-secondary/30 active:scale-95 cursor-pointer' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0 group-hover/btn:bg-secondary group-hover/btn:text-white transition-colors">
                        <Phone size={18} />
                      </div>
                      <div className="overflow-hidden flex-1 text-left">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Coordinator</p>
                        <p className="text-sm font-bold truncate text-white">{event.coordinator}</p>
                      </div>
                      
                      {/* Mobile Call Indicator */}
                      {event.phone && (
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
        )}
      </div>
    </div>
  );
};

export default EventSchedule;

