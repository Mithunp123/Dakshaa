import React from 'react'
import UltraHeroSection from './Components/UltraHeroSection'
import UltraAbout from './Components/UltraAbout'
import { GradientOrbs, FloatingParticles } from '../Layout/AnimatedBackground'
import { motion } from 'framer-motion'

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative w-full min-h-screen"
    >
      {/* Global animated background - Absolute positioning within container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <GradientOrbs />
        <FloatingParticles count={30} />
      </div>
      
      {/* Content wrapper with proper z-index */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Hero Section with integrated countdown */}
        <UltraHeroSection />
        
        {/* About Section */}
        <UltraAbout />
      </div>
    </motion.div>
  )
}

export default Home
