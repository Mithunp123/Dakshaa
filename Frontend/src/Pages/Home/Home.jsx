import React, { lazy, Suspense, memo } from 'react'

// Use the original components with 3D robot
const UltraHeroSection = lazy(() => import('./Components/UltraHeroSection'))
const UltraAbout = lazy(() => import('./Components/UltraAbout'))

// Simple loading placeholder
const LoadingPlaceholder = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
  </div>
)

const Home = memo(() => {
  return (
    <div className="relative w-full min-h-screen bg-slate-950">
      {/* Content wrapper */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <UltraHeroSection />
        <UltraAbout />
      </Suspense>
    </div>
  )
})

Home.displayName = 'Home'

export default Home
