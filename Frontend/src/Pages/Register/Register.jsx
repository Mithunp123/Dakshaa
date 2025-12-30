import React from 'react';
import { motion } from 'framer-motion';
import SignUpForm from './Components/SignUpForm';
import { GradientOrbs, FloatingParticles } from '../Layout/AnimatedBackground';

const Register = () => {
  return (
    <div className="min-h-screen bg-gray-900 pt-32 pb-20 relative overflow-hidden">
      {/* Global animated background */}
      <GradientOrbs />
      <FloatingParticles count={30} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-primary font-bold text-xs uppercase tracking-widest font-orbitron">Join the Fest</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-orbitron tracking-tight">
              Create <span className="text-secondary drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">Account</span>
            </h1>
          </motion.div>
        </div>

        {/* Sign Up Form Component */}
        <SignUpForm />

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 text-center p-8 bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-sm border border-white/10"
        >
          <p className="text-gray-400">
            Need help? Contact our support team at <span className="text-secondary">support@dakshaa.org</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;

