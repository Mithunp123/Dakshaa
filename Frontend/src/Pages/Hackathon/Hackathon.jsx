import React from 'react'
import { useLocation } from 'react-router-dom'
import HackathonCards from './Components/HackathonCards'
import HackathonSection from './Components/HackathonSection'

const Hackathon = () => {
  const location = useLocation();
  
  // If we're on /events/hackathon, show the cards view
  // If we're on /event/hackathon-X, show the individual event view
  const isCardsView = location.pathname === '/events/hackathon';
  
  return (
    <div className="min-h-screen bg-slate-950">
        {isCardsView ? <HackathonCards /> : <HackathonSection />}
    </div>
  )
}

export default Hackathon
