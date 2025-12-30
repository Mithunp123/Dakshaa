import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QrCode, ArrowRight } from "lucide-react";

/**
 * Quick Access Button to Attendance Scanner
 * Use this in Volunteer and Coordinator dashboards
 */
const ScannerAccessButton = ({ basePath }) => {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`${basePath}/scanner`)}
      className="w-full bg-gradient-to-r from-secondary to-primary p-6 rounded-3xl text-left group hover:shadow-2xl hover:shadow-secondary/50 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
            <QrCode className="text-white" size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              Event Attendance Scanner
            </h3>
            <p className="text-white/80 text-sm">
              Scan QR codes for event check-in and verification
            </p>
          </div>
        </div>
        <ArrowRight
          className="text-white group-hover:translate-x-2 transition-transform"
          size={28}
        />
      </div>
    </motion.button>
  );
};

export default ScannerAccessButton;
