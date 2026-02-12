import React, { lazy, Suspense, memo } from 'react'
import { MessageCircle } from 'lucide-react'

// Use the original components with 3D robot
const UltraHeroSection = lazy(() => import('./Components/UltraHeroSection'))
const UltraAbout = lazy(() => import('./Components/UltraAbout'))

// Simple loading placeholder
const LoadingPlaceholder = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
  </div>
)

// Floating Chatbot Icon
const ChatbotButton = () => (
  <a
    href="https://vibe-code-navigator.vercel.app/"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-[5.5rem] md:bottom-6 right-4 md:right-6 z-50 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full shadow-lg hover:shadow-sky-500/50 hover:scale-110 transition-all duration-300 group"
    aria-label="Open Chatbot"
  >
    <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-white group-hover:animate-pulse" />
    <span className="absolute -top-10 right-0 bg-slate-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden md:block">
      Chat with us!
    </span>
  </a>
)

const Home = memo(() => {
  return (
    <div className="relative w-full min-h-screen bg-slate-950">
      {/* Content wrapper */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <UltraHeroSection />
        <UltraAbout />
      </Suspense>
      
      {/* Floating Chatbot Button */}
      <ChatbotButton />
    </div>
  )
})

Home.displayName = 'Home'

export default Home
