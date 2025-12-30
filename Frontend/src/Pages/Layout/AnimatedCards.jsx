import React from 'react';
import { motion } from 'framer-motion';

// Basic Cyber Card with hover effects
export const CyberCard = ({ children, className = '', onClick }) => {
  return (
    <motion.div
      className={`relative group cursor-pointer ${className}`}
      onClick={onClick}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated border gradient */}
      <motion.div
        className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"
      />
      
      {/* Card content */}
      <div className="relative bg-sky-950/90 backdrop-blur-sm border border-sky-800/50 rounded-lg overflow-hidden group-hover:border-transparent transition-colors duration-300">
        {/* Top shine effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        
        {/* Content */}
        {children}
        
        {/* Hover shine animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
        />
      </div>
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/0 group-hover:border-cyan-400 transition-colors duration-300" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/0 group-hover:border-cyan-400 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/0 group-hover:border-cyan-400 transition-colors duration-300" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/0 group-hover:border-cyan-400 transition-colors duration-300" />
    </motion.div>
  );
};

// Glass Card with glassmorphism effect
export const GlassCard = ({ children, className = '' }) => {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-purple-500/10 backdrop-blur-xl" />
      <div className="relative border border-white/10 rounded-2xl p-6">
        {children}
      </div>
    </motion.div>
  );
};

// Event Card with image and overlay
export const EventCard = ({ image, title, subtitle, onClick }) => {
  return (
    <motion.div
      className="relative group cursor-pointer overflow-hidden rounded-xl"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image */}
      <motion.img
        src={image}
        alt={title}
        className="w-full h-64 object-cover"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
      
      {/* Hover overlay */}
      <motion.div
        className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <motion.h3
          className="text-xl font-orbitron text-white mb-1"
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h3>
        {subtitle && (
          <p className="text-sky-300 text-sm font-poppins">{subtitle}</p>
        )}
      </div>
      
      {/* Animated border on hover */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400 rounded-xl transition-colors duration-300" />
      
      {/* Glow effect */}
      <motion.div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-10 bg-cyan-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
    </motion.div>
  );
};

// Stats Card with animated number
export const StatsCard = ({ value, label, icon: Icon, delay = 0 }) => {
  return (
    <motion.div
      className="relative p-6 bg-gradient-to-br from-sky-900/50 to-sky-950/50 border border-sky-800/50 rounded-xl overflow-hidden group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -5, borderColor: 'rgba(14, 165, 233, 0.8)' }}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
      
      {/* Icon */}
      {Icon && (
        <div className="mb-4">
          <Icon className="w-8 h-8 text-cyan-400" />
        </div>
      )}
      
      {/* Value */}
      <motion.span
        className="block text-4xl font-orbitron font-bold text-white mb-2"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.2, type: "spring" }}
      >
        {value}
      </motion.span>
      
      {/* Label */}
      <span className="text-sky-300/70 font-poppins text-sm">{label}</span>
      
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/10 to-transparent" />
    </motion.div>
  );
};

// Feature Card with icon
export const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
  return (
    <motion.div
      className="relative p-6 rounded-xl bg-sky-950/50 border border-sky-800/30 group hover:border-cyan-500/50 transition-colors duration-300"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
    >
      {/* Icon container */}
      <motion.div
        className="w-14 h-14 mb-4 flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-sky-600/20 rounded-lg border border-cyan-500/30 group-hover:border-cyan-400 transition-colors"
        whileHover={{ rotate: 5, scale: 1.1 }}
      >
        <Icon className="w-7 h-7 text-cyan-400" />
      </motion.div>
      
      {/* Title */}
      <h3 className="text-lg font-orbitron text-white mb-2">{title}</h3>
      
      {/* Description */}
      <p className="text-sky-300/70 font-poppins text-sm leading-relaxed">{description}</p>
      
      {/* Hover line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
      />
    </motion.div>
  );
};

// Team Member Card
export const TeamCard = ({ image, name, role, social }) => {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"
      />
      
      <div className="relative bg-sky-950/90 rounded-xl overflow-hidden border border-sky-800/50 group-hover:border-cyan-500/50 transition-colors">
        {/* Image container */}
        <div className="relative overflow-hidden">
          <motion.img
            src={image}
            alt={name}
            className="w-full h-56 object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-sky-950 via-transparent to-transparent" />
          
          {/* Social icons on hover */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center gap-4 bg-sky-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            {social?.map((item, i) => (
              <motion.a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-sky-800/80 rounded-full text-cyan-400 hover:bg-cyan-500 hover:text-white transition-colors"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <item.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </motion.div>
        </div>
        
        {/* Info */}
        <div className="p-4 text-center">
          <h3 className="text-lg font-orbitron text-white">{name}</h3>
          <p className="text-cyan-400 font-poppins text-sm">{role}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Pricing/Workshop Card
export const PricingCard = ({ title, price, features, isPopular, onClick }) => {
  return (
    <motion.div
      className={`relative p-6 rounded-xl ${isPopular ? 'bg-gradient-to-b from-cyan-900/50 to-sky-950/50 border-cyan-500' : 'bg-sky-950/50 border-sky-800/50'} border overflow-hidden`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-sky-500 text-white text-xs font-orbitron px-4 py-1 rounded-bl-lg">
          Popular
        </div>
      )}
      
      {/* Title */}
      <h3 className="text-xl font-orbitron text-white mb-2">{title}</h3>
      
      {/* Price */}
      <div className="mb-6">
        <span className="text-3xl font-bold text-cyan-400">{price}</span>
      </div>
      
      {/* Features */}
      <ul className="space-y-3 mb-6">
        {features?.map((feature, i) => (
          <motion.li
            key={i}
            className="flex items-center gap-2 text-sky-300/80 text-sm"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <span className="w-5 h-5 flex items-center justify-center bg-cyan-500/20 rounded-full text-cyan-400 text-xs">✓</span>
            {feature}
          </motion.li>
        ))}
      </ul>
      
      {/* CTA Button */}
      <motion.button
        className={`w-full py-3 rounded-lg font-orbitron text-sm ${isPopular ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white' : 'bg-sky-800/50 text-sky-300 border border-sky-700'}`}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Register Now
      </motion.button>
    </motion.div>
  );
};

export default CyberCard;
