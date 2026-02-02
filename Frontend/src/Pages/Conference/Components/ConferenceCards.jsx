import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const ConferenceCard = ({ name, title, image, description }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Get bullet points based on conference name
  const getBulletPoints = () => {
    switch (name) {
      case "National Conference on Mechanical automation & building science":
        return [
          "Sustainable Building Materials",
          "Structural Health Monitoring",
          "Ground Improvement Techniques",
          "Geotextiles and Geosynthetics Applications",
          "Environmental Monitoring and Treatment",
          "Transportation Planning and Smart Cities",
          "Remote Sensing and GIS Applications",
          "River Basin and Watershed Management",
          "Automation and Construction Project Management",
          "AI & ML Integration in Civil Engineering",
        ];
      case "National Conference on Advancements in Semiconductor Technologies, Intelligent systems and Power Engineering (ASTIPE 2026)":
        return [
          "Renewable Energy Systems and Sustainability",
          "Advanced Power Electronics and Drives",
          "Smart Grids and Energy Management",
          "Electric Vehicles and Energy Storage Technologies",
          "Embedded Systems and Internet of Things",
          "Image, Speech, Audio and Signal Processing",
          "Satellite, Space, Vehicular and Wireless Communication",
          "Digital Circuit Design and Verification",
          "Low Power VLSI Design",
          "FPGA-Based VLSI Design",
        ];
      case "Applications of Artificial intelligence and  Cybersecurity":
        return [
          "Machine Learning",
          "Natural Language Processing",
          "Computer Vision",
          "Expert Systems",
          "Network Security",
          "Cloud Security",
          "Cryptography",
          "Incident Response",
          "AI for Cybersecurity Policy and Governance",
          "Explainable AI (XAI) for Cybersecurity",
        ];
      default:
        return [];
    }
  };

  const bulletPoints = getBulletPoints();

  return (
    <motion.div
      className="w-full max-w-6xl mx-auto mb-8"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="border-2 border-primary bg-primary/10 backdrop-blur-sm overflow-hidden">
        {/* Header Section */}
        <div className="bg-primary/20 p-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white mb-4">
            {name}
          </h2>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Image Section */}
          <div className="flex justify-center">
            <motion.div
              className="border-2 border-primary overflow-hidden max-w-2xl w-full"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={image}
                alt={name}
                className="w-full h-auto object-cover"
              />
            </motion.div>
          </div>

          {/* Details Toggle Button */}
          <div className="flex justify-center">
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-6 py-3 bg-primary/80 hover:bg-primary text-white font-semibold text-lg border-2 border-primary transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showDetails ? (
                <>
                  Hide Details <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  Show Details <ChevronDown className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>

          {/* Expandable Details Section */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <div className="border-2 border-primary bg-primary/5 p-6 space-y-4">
                  {/* Topics Section */}
                  {bulletPoints.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-primary mb-3">
                        Conference Topics:
                      </h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white">
                        {bulletPoints.map((point, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex items-start gap-2"
                          >
                            <span className="text-primary mt-1">▸</span>
                            <span className="text-sm sm:text-base">{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Description if available */}
                  {description && (
                    <div className="mt-4">
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                        {description}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registration Section */}
          <div className="border-2 border-primary bg-primary/10 p-6 text-center space-y-4">
            <div className="text-2xl md:text-3xl font-bold text-primary">
              Registration Fee: ₹300
            </div>
            <motion.button
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold text-xl border-2 border-primary transition-all duration-300 shadow-lg"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = "/register-events?skip=true";
                }
              }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(14, 165, 233, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              REGISTER NOW!
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConferenceCard;
