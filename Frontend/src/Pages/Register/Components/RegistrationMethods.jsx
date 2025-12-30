import React from "react";
import { motion } from "framer-motion";
import { Ticket, Sliders, Crown, CheckCircle2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RegistrationMethods = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Card 1: Combo Pass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative group"
        >
          <div className="absolute -top-4 right-4 z-20">
            <span className="bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider animate-pulse">
              Most Popular
            </span>
          </div>
          
          <div className="h-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/10 flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-primary/20">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Ticket className="w-7 h-7 text-primary" />
            </div>
            
            <div className="mb-2">
              <span className="text-primary font-semibold text-[10px] uppercase tracking-widest">Best Value • Recommended</span>
              <h3 className="text-2xl font-bold text-white mt-1 font-orbitron">Choose a Combo Pass</h3>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 font-poppins leading-relaxed">
              Pre-designed passes that give you access to multiple workshops, technical events, and cultural activities at a discounted price.
            </p>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                { text: "Access to 2+ Workshops", tip: "Choose any two workshops from our technical tracks" },
                { text: "All Technical Events included", tip: "Free entry to all paper presentations, quizzes, and more" },
                { text: "Priority seating for Culturals", tip: "Reserved front-row seats for evening mega shows" },
                { text: "Exclusive DaKshaa T26 Merch", tip: "Get a free T-shirt and goodies bag" }
              ].map((item, i) => (
                <li key={i} className="flex items-center text-gray-300 text-sm font-poppins group/item relative">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span>{item.text}</span>
                  <div className="ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-help">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-white text-gray-900 text-[10px] rounded-lg whitespace-nowrap z-30 pointer-events-none">
                      {item.tip}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                    </div>
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => navigate("/events")}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group/btn"
            >
              View Combo Passes
              <Crown className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Card 2: Build Your Own */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative group"
        >
          <div className="h-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/10 flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-secondary/20">
            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Sliders className="w-7 h-7 text-secondary" />
            </div>
            
            <div className="mb-2">
              <span className="text-secondary font-semibold text-[10px] uppercase tracking-widest">Flexible • Pay only for what you choose</span>
              <h3 className="text-2xl font-bold text-white mt-1 font-orbitron">Build Your Own Pass</h3>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 font-poppins leading-relaxed">
              Select individual workshops and technical events based on your interests and create your own personalized schedule.
            </p>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                "Choose specific Workshops",
                "Pick individual Tech Events",
                "Add Cultural events as needed",
                "Customized pricing"
              ].map((item, i) => (
                <li key={i} className="flex items-center text-gray-300 text-sm font-poppins">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => navigate("/events")}
              className="w-full py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-secondary/25 flex items-center justify-center gap-2 group/btn"
            >
              Build Your Pass
              <Sliders className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Card 3: Accommodation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative group"
        >
          <div className="h-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/10 flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-accent/20">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Home className="w-7 h-7 text-accent" />
            </div>
            
            <div className="mb-2">
              <span className="text-accent font-semibold text-[10px] uppercase tracking-widest">Convenient • Stay on Campus</span>
              <h3 className="text-2xl font-bold text-white mt-1 font-orbitron">Accommodation</h3>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 font-poppins leading-relaxed">
              Need a place to stay? Book your accommodation within the campus for a comfortable and hassle-free experience during the fest.
            </p>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                "Safe & Secure Campus Stay",
                "24/7 Support Staff",
                "Includes Breakfast & Dinner",
                "Proximity to Event Venues"
              ].map((item, i) => (
                <li key={i} className="flex items-center text-gray-300 text-sm font-poppins">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => navigate("/accomodation")}
              className="w-full py-3 bg-accent hover:bg-accent-dark text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-accent/25 flex items-center justify-center gap-2 group/btn"
            >
              Book Accommodation
              <Home className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationMethods;
