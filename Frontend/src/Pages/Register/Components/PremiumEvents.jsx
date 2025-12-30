import React from "react";
import { motion } from "framer-motion";
import { Code, Cpu, Rocket, Music, Clock, Trophy, IndianRupee, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PremiumEvents = () => {
  const navigate = useNavigate();

  const events = [
    {
      title: "Hackathon",
      description: "A high-intensity 36-hour coding marathon to build innovative solutions for real-world problems.",
      icon: <Code className="w-6 h-6" />,
      duration: "36 Hours",
      prizePool: "₹50,000+",
      fee: "₹500/team",
      tag: "High Prize Pool",
      tagColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      link: "/event/hackathon",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Codeathon",
      description: "Test your algorithmic skills and speed in this competitive programming challenge.",
      icon: <Cpu className="w-6 h-6" />,
      duration: "4 Hours",
      prizePool: "₹20,000+",
      fee: "₹200",
      tag: "National Level",
      tagColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      link: "/event/codeathon",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Startup TN Idea Pitch",
      description: "Pitch your revolutionary business ideas to industry experts and venture capitalists.",
      icon: <Rocket className="w-6 h-6" />,
      duration: "Full Day",
      prizePool: "Incubation Support",
      fee: "₹300/team",
      tag: "Limited Seats",
      tagColor: "bg-red-500/20 text-red-400 border border-red-500/30",
      link: "/startups",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: "Cultural Mega Events",
      description: "The ultimate stage for talent, rhythm, and expression. Show your best moves!",
      icon: <Music className="w-6 h-6" />,
      duration: "Evening",
      prizePool: "₹30,000+",
      fee: "₹150",
      tag: "Most Awaited",
      tagColor: "bg-pink-500/20 text-pink-400 border border-pink-500/30",
      link: "/events/hormonics",
      color: "text-pink-400",
      bgColor: "bg-pink-500/10"
    }
  ];

  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-white mb-4 font-orbitron"
        >
          Special & Premium Events
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 font-poppins"
        >
          These events require separate registration and are not included in combo passes. 
          Experience the flagship challenges of DaKshaa T26.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-white/10 flex flex-col group hover:shadow-2xl transition-all duration-300"
          >
            <div className={`p-6 ${event.bgColor} flex justify-between items-start`}>
              <div className={`p-3 rounded-xl bg-gray-900/50 shadow-sm ${event.color}`}>
                {event.icon}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${event.tagColor}`}>
                {event.tag}
              </span>
            </div>

            <div className="p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2 font-orbitron">{event.title}</h3>
              <p className="text-sm text-gray-400 mb-6 font-poppins line-clamp-3">
                {event.description}
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-400 font-poppins">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{event.duration}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 font-poppins">
                  <Trophy className="w-4 h-4 mr-2 text-amber-400" />
                  <span className="font-semibold text-gray-300">{event.prizePool}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 font-poppins">
                  <IndianRupee className="w-4 h-4 mr-2 text-green-400" />
                  <span className="font-bold text-white">{event.fee}</span>
                </div>
              </div>

              <button 
                onClick={() => navigate(event.link)}
                className="w-full py-3 border-2 border-white/20 text-white rounded-xl font-bold hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center justify-center gap-2 group/btn mt-auto"
              >
                Register Separately
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PremiumEvents;
