import React from "react";
import { motion } from "framer-motion";
import college from "../../../assets/college.png";
import logo from "../../../assets/logo1.png";

// Animated Card Component
const AnimatedCard = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay }}
      className="relative group"
    >
      {children}
    </motion.div>
  );
};

// Cyber Border Component
const CyberBorder = ({ children, className = "", glowColor = "sky" }) => {
  const glowClasses = {
    sky: "from-sky-500/50 to-cyan-500/50",
    purple: "from-purple-500/50 to-pink-500/50",
    green: "from-green-500/50 to-emerald-500/50",
  };

  return (
    <div className={`relative p-[2px] overflow-hidden ${className}`}>
      {/* Animated gradient border */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${glowClasses[glowColor]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ filter: "blur(2px)" }}
      />
      
      {/* Border */}
      <div className="relative border-2 border-sky-800 group-hover:border-sky-600 transition-colors duration-300">
        {children}
      </div>
    </div>
  );
};

// Floating Tech Elements
const FloatingTechElements = () => {
  const elements = [
    { icon: "⚡", x: "10%", y: "20%" },
    { icon: "🔧", x: "85%", y: "30%" },
    { icon: "💻", x: "15%", y: "70%" },
    { icon: "🚀", x: "80%", y: "80%" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-20"
          style={{ left: el.x, top: el.y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          {el.icon}
        </motion.div>
      ))}
    </div>
  );
};

// Section Title Component
const SectionTitle = ({ title, subtitle }) => {
  return (
    <motion.div
      className="text-center mb-12"
      initial={{ opacity: 0, y: -30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2
        className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent"
        animate={{
          backgroundPosition: ["0%", "100%", "0%"],
        }}
        transition={{ duration: 5, repeat: Infinity }}
        style={{ backgroundSize: "200% 100%" }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          className="mt-4 text-sky-300/70 text-lg font-poppins"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {subtitle}
        </motion.p>
      )}
      
      {/* Decorative line */}
      <motion.div
        className="mt-6 mx-auto w-24 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      />
    </motion.div>
  );
};

// About Card Component
const AboutCard = ({ image, title, description, isReversed = false }) => {
  return (
    <motion.div
      className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-12 items-center`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8 }}
    >
      {/* Image Section */}
      <motion.div
        className="w-full lg:w-2/5"
        initial={{ x: isReversed ? 50 : -50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <CyberBorder>
          <div className="p-3 bg-sky-950/50">
            <motion.img
              src={image}
              alt={title}
              className="w-full h-auto"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </CyberBorder>
      </motion.div>

      {/* Content Section */}
      <motion.div
        className="w-full lg:w-3/5"
        initial={{ x: isReversed ? -50 : 50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <CyberBorder glowColor="sky">
          <div className="relative bg-sky-950/70 backdrop-blur-sm p-6 lg:p-8 overflow-hidden">
            {/* Animated background pattern */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, transparent 40%, rgba(14, 165, 233, 0.1) 40%, rgba(14, 165, 233, 0.1) 60%, transparent 60%),
                  linear-gradient(-45deg, transparent 40%, rgba(14, 165, 233, 0.1) 40%, rgba(14, 165, 233, 0.1) 60%, transparent 60%)
                `,
                backgroundSize: "20px 20px",
              }}
            />
            
            {/* Title */}
            <motion.div
              className="relative"
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="inline-block bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-2 mb-6">
                <h3 className="text-xl lg:text-2xl font-orbitron text-white tracking-wide">
                  {title}
                </h3>
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              className="relative text-sky-300/90 font-poppins leading-7 text-justify"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              {description}
            </motion.p>

            {/* Corner decorations */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30" />
          </div>
        </CyberBorder>
      </motion.div>
    </motion.div>
  );
};

// Stats Component
const StatsBar = () => {
  const stats = [
    { label: "Years of Excellence", value: "30+" },
    { label: "Students", value: "8000+" },
    { label: "Programs", value: "37" },
    { label: "NIRF Ranking", value: "99" },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 my-16"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          className="relative text-center p-6 bg-sky-900/30 border border-sky-800/50 overflow-hidden group"
          whileHover={{ scale: 1.05, borderColor: "rgba(14, 165, 233, 0.8)" }}
          transition={{ duration: 0.3 }}
        >
          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-sky-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          />
          
          <motion.span
            className="relative block text-3xl md:text-4xl font-orbitron text-cyan-400 font-bold"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
          >
            {stat.value}
          </motion.span>
          <span className="relative text-sm text-sky-300/70 font-poppins mt-2 block">
            {stat.label}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

function UltraAbout() {
  const ksrctDescription = `K.S.Rangasamy College of Technology (KSRCT) was started in 1994. Located near Tiruchengode, Tamil Nadu, it offers quality technical education with 14 U.G., 11 P.G. and 12 Ph.D. programs. Approved by AICTE and affiliated with Anna University, Chennai, KSRCT has Autonomous status from UGC. It ranked 99th in NIRF 2017 and 51-100 band in NIRF Innovation Ranking 2023 for Engineering. Accredited with NAAC A++ grade and NBA Tier 1 departments, it features modern infrastructure including AICTE-IDEA Lab, ATAL Community Innovation Centre, and MSME incubation centre. With NTTM funding of 6.5 crore rupees, it fosters cutting-edge research and collaborates with DST, DBT, DAE, CSIR, DRDO, and ISRO.`;

  const dakshaaDescription = `DaKshaa T26 is a premier National Level Techno-Cultural Fest that brings together innovation, creativity, and talent under one grand stage. Designed to foster technical excellence and artistic expression, this fest serves as a vibrant platform for students and professionals across the country to showcase their skills, exchange ideas, and compete at the highest level. With a perfect blend of technology, culture, and entertainment, DaKshaa T26 features an array of events, including technical challenges, hackathons, workshops, cultural performances, and interactive sessions with industry experts. Whether you're a tech enthusiast eager to dive into the latest advancements or an artist looking to mesmerize the audience, DaKshaa T26 has something for everyone.`;

  return (
    <section className="relative py-20 px-4 sm:px-8 lg:px-20 overflow-hidden">
      <FloatingTechElements />
      
      {/* Section Title */}
      <SectionTitle 
        title="About Us" 
        subtitle="Discover the legacy of excellence and innovation"
      />

      {/* Stats Bar */}
      <StatsBar />

      {/* About Cards Container */}
      <div className="max-w-7xl mx-auto space-y-20">
        {/* KSRCT Card */}
        <AboutCard
          image={college}
          title="K.S.Rangasamy College of Technology"
          description={ksrctDescription}
        />

        {/* Dakshaa Card */}
        <AboutCard
          image={logo}
          title="DaKshaa T26"
          description={dakshaaDescription}
          isReversed
        />
      </div>

      {/* Bottom decoration */}
      <motion.div
        className="mt-20 flex justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-[2px] bg-gradient-to-r from-transparent to-sky-500" />
          <motion.div
            className="w-3 h-3 bg-cyan-400 rotate-45"
            animate={{ rotate: [45, 225, 45] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="w-20 h-[2px] bg-gradient-to-l from-transparent to-sky-500" />
        </div>
      </motion.div>
    </section>
  );
}

export default UltraAbout;
