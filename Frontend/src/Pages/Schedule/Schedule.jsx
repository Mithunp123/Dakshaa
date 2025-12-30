import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronRight,
  Star,
  Zap,
  Coffee,
  Music,
  Trophy,
  Users,
  Lightbulb,
  Code
} from 'lucide-react';

const Schedule = () => {
  const [activeDay, setActiveDay] = useState(1);

  const scheduleData = {
    1: {
      theme: "Skill Building + Kick-off",
      title: "DAY 1 – LEARN & START",
      events: [
        {
          time: "09:00 AM – 12:30 PM",
          title: "Morning Sessions",
          items: [
            { name: "Workshops (5 parallel)", icon: <Lightbulb className="w-4 h-4" />, type: "Workshop" },
            { name: "Technical Events – Round 1 (5 events)", icon: <Code className="w-4 h-4" />, type: "Technical" },
            { name: "Registration help desk & QR attendance", icon: <Users className="w-4 h-4" />, type: "General" }
          ]
        },
        {
          time: "12:30 PM – 01:30 PM",
          title: "Lunch Break",
          items: [
            { name: "Lunch Break", icon: <Coffee className="w-4 h-4" />, type: "Break" }
          ]
        },
        {
          time: "01:30 PM – 04:30 PM",
          title: "Afternoon Sessions",
          items: [
            { name: "Workshops (4 parallel)", icon: <Lightbulb className="w-4 h-4" />, type: "Workshop" },
            { name: "Non-Technical Events (5 events – FREE)", icon: <Zap className="w-4 h-4" />, type: "Non-Technical" },
            { name: "Tech event prelims continue", icon: <Code className="w-4 h-4" />, type: "Technical" }
          ]
        },
        {
          time: "04:30 PM Onwards",
          title: "Evening Kick-off",
          items: [
            { name: "Hackathon inauguration & problem statement release (36 hrs)", icon: <Trophy className="w-4 h-4" />, type: "Hackathon" },
            { name: "Light cultural opening events", icon: <Music className="w-4 h-4" />, type: "Cultural" }
          ]
        }
      ]
    },
    2: {
      theme: "Peak Competition Day",
      title: "DAY 2 – COMPETE & CREATE",
      events: [
        {
          time: "09:00 AM – 12:30 PM",
          title: "Morning Competitions",
          items: [
            { name: "Workshops (5 parallel)", icon: <Lightbulb className="w-4 h-4" />, type: "Workshop" },
            { name: "Technical Events – Finals (5 events)", icon: <Code className="w-4 h-4" />, type: "Technical" },
            { name: "Non-Technical Events (5 events – FREE)", icon: <Zap className="w-4 h-4" />, type: "Non-Technical" }
          ]
        },
        {
          time: "12:30 PM – 01:30 PM",
          title: "Lunch Break",
          items: [
            { name: "Lunch Break", icon: <Coffee className="w-4 h-4" />, type: "Break" }
          ]
        },
        {
          time: "01:30 PM – 05:00 PM",
          title: "Afternoon Specials",
          items: [
            { name: "Codeathon", icon: <Code className="w-4 h-4" />, type: "Technical" },
            { name: "Designathon", icon: <Lightbulb className="w-4 h-4" />, type: "Technical" },
            { name: "Startup TN Idea Pitch", icon: <Trophy className="w-4 h-4" />, type: "Startup" },
            { name: "Hackathon mid-review", icon: <Clock className="w-4 h-4" />, type: "Hackathon" }
          ]
        },
        {
          time: "05:30 PM – 08:00 PM",
          title: "Evening Gala",
          items: [
            { name: "Grand Cultural Night (Participants only)", icon: <Music className="w-4 h-4" />, type: "Cultural" }
          ]
        }
      ]
    },
    3: {
      theme: "Finals + Closure",
      title: "DAY 3 – SHOWCASE & CELEBRATE",
      events: [
        {
          time: "09:00 AM – 12:00 PM",
          title: "Morning Finals",
          items: [
            { name: "Workshops (Remaining 4)", icon: <Lightbulb className="w-4 h-4" />, type: "Workshop" },
            { name: "Non-Technical Events (Remaining 4 – FREE)", icon: <Zap className="w-4 h-4" />, type: "Non-Technical" }
          ]
        },
        {
          time: "12:00 PM – 01:00 PM",
          title: "Lunch Break",
          items: [
            { name: "Lunch Break", icon: <Coffee className="w-4 h-4" />, type: "Break" }
          ]
        },
        {
          time: "01:00 PM – 04:00 PM",
          title: "Grand Finals",
          items: [
            { name: "Hackathon final demo & jury evaluation", icon: <Trophy className="w-4 h-4" />, type: "Hackathon" },
            { name: "Tech event grand finals", icon: <Code className="w-4 h-4" />, type: "Technical" }
          ]
        },
        {
          time: "04:30 PM – 06:00 PM",
          title: "Closing Ceremony",
          items: [
            { name: "Valedictory function", icon: <Star className="w-4 h-4" />, type: "General" },
            { name: "Prize distribution & closing ceremony", icon: <Trophy className="w-4 h-4" />, type: "General" }
          ]
        }
      ]
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Workshop': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Technical': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'Non-Technical': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Hackathon': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Cultural': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      case 'Break': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Startup': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary via-orange-400 to-secondary mb-4"
          >
            Event Schedule
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Plan your 3-day journey through DAKSHAA T26. From skill-building workshops to high-stakes competitions.
          </motion.p>
        </div>

        {/* Day Selector */}
        <div className="flex justify-center gap-4 mb-12">
          {[1, 2, 3].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 ${
                activeDay === day 
                ? 'text-white' 
                : 'text-gray-500 hover:text-gray-300 bg-white/5 border border-white/10'
              }`}
            >
              {activeDay === day && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-secondary rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Day {day}</span>
            </button>
          ))}
        </div>

        {/* Day Content */}
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
                {scheduleData[activeDay].title}
              </h2>
              <p className="text-secondary font-medium tracking-wider uppercase text-sm">
                Theme: {scheduleData[activeDay].theme}
              </p>
            </div>

            <div className="grid gap-6">
              {scheduleData[activeDay].events.map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/20 to-orange-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Time Column */}
                      <div className="md:w-48 flex-shrink-0">
                        <div className="flex items-center gap-2 text-secondary font-bold mb-1">
                          <Clock className="w-4 h-4" />
                          <span>{slot.time}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{slot.title}</h3>
                      </div>

                      {/* Events Column */}
                      <div className="flex-grow grid gap-4">
                        {slot.items.map((item, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${getTypeColor(item.type)} border`}>
                                {item.icon}
                              </div>
                              <span className="text-gray-200 font-medium">{item.name}</span>
                            </div>
                            <div className={`hidden sm:block px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(item.type)}`}>
                              {item.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Summary Table */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 overflow-hidden rounded-3xl border border-white/10 bg-white/5"
        >
          <div className="p-8 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Event Distribution Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-4 text-gray-400 font-medium border-b border-white/10">Category</th>
                  <th className="p-4 text-gray-400 font-medium border-b border-white/10 text-center">Day 1</th>
                  <th className="p-4 text-gray-400 font-medium border-b border-white/10 text-center">Day 2</th>
                  <th className="p-4 text-gray-400 font-medium border-b border-white/10 text-center">Day 3</th>
                  <th className="p-4 text-gray-400 font-medium border-b border-white/10 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {[
                  { cat: "Workshops", d1: "5+4", d2: "5", d3: "4", total: "18" },
                  { cat: "Tech Events", d1: "5", d2: "5", d3: "4", total: "14" },
                  { cat: "Non-Tech (Free)", d1: "5", d2: "5", d3: "4", total: "14" },
                  { cat: "Hackathon", d1: "Start", d2: "Continue", d3: "End", total: "1" },
                  { cat: "Codeathon", d1: "-", d2: "✔", d3: "-", total: "1" },
                  { cat: "Cultural", d1: "Light", d2: "Major", d3: "Closing", total: "3" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 border-b border-white/5 font-medium">{row.cat}</td>
                    <td className="p-4 border-b border-white/5 text-center">{row.d1}</td>
                    <td className="p-4 border-b border-white/5 text-center">{row.d2}</td>
                    <td className="p-4 border-b border-white/5 text-center">{row.d3}</td>
                    <td className="p-4 border-b border-white/5 text-center font-bold text-secondary">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Schedule;
