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
      transition={{ duration: 0.5 }}
      className="relative w-full"
      style={{ minHeight: '100vh' }}
    >
      {/* Global animated background - Fixed positioning */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
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
