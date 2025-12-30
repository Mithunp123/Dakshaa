import React from "react";
import TeamMembers from "./Components/TeamMembers";
import { motion } from "framer-motion";

function Teams() {
  return (
    <div className="min-h-screen bg-[#020617] pt-32 pb-12 relative overflow-hidden">
      {/* Cyberpunk Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-4">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              className="h-px bg-gradient-to-r from-transparent via-secondary to-transparent"
            />
            <h1 className="text-5xl md:text-7xl font-orbitron font-black text-white mt-4 tracking-[0.2em] uppercase">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary animate-gradient-x">Architects</span>
            </h1>
            <p className="font-orbitron text-secondary/60 text-xs md:text-sm tracking-[0.5em] uppercase mt-2">System Core // Personnel Directory</p>
          </div>
        </motion.div>
        
        <TeamMembers />
      </div>
    </div>
  );
}

export default Teams;
