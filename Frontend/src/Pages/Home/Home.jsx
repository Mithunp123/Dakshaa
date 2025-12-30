import React from 'react'
import UltraHeroSection from './Components/UltraHeroSection'
import UltraAbout from './Components/UltraAbout'
import AnimatedBackground, { GradientOrbs, FloatingParticles } from '../Layout/AnimatedBackground'
import { motion } from 'framer-motion'

const Home = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Global animated background */}
      <GradientOrbs />
      <FloatingParticles count={30} />
      
      {/* Hero Section with integrated countdown */}
      <UltraHeroSection />
      
      {/* About Section */}
      <UltraAbout />
    </motion.section>
  )
}

export default Home
