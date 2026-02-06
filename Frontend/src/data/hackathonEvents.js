import hackathon1 from "../assets/EventsImages/EventDetails/HackathonImages/hackathon1.webp";
import hackathon2 from "../assets/EventsImages/EventDetails/HackathonImages/hackathon2.webp";
import hackathon3 from "../assets/EventsImages/EventDetails/HackathonImages/hackathon3.webp";
import hackathon4 from "../assets/EventsImages/EventDetails/HackathonImages/hackathon4.webp";
import hackathon5 from "../assets/EventsImages/EventDetails/HackathonImages/hackathon5.webp";
import hackathon6 from "../assets/EventsImages/EventDetails/HackathonImages/hackathon6.webp";
import hackathon7 from "../assets/EventsImages/EventDetails/HackathonImages/hackathon7.webp";
import hackathon8 from "../assets/EventsImages/EventDetails/HackathonImages/hackathon8.webp";
import hackathon9 from "../assets/EventsImages/EventDetails/HackathonImages/hackathon9.webp";

import { hackathonEventDetails } from "../Pages/Hackathon/Components/HackathonSection";
/*
NeuroHack 2.O - hackathon1
BioNexathon - hackathon2
NeuroCode 2.O - hackathon3
VibeCode-26- hackathon4
STARTUP PITCH - hackathon5
Designathon- hackathon6
*/  

export const hackathonEvents = [
  {
    image: hackathon1,
    eventId: "hackathon1",
    title: "NeuroHack 2.0",
    price : "₹50",
  },
  {
    image: hackathon2,
    eventId: "hackathon2",
    title: "BioNexathon",
  },
  {
    image: hackathon3,
    eventId: "hackathon3",
    title: "NeuroCode 2.0",
  },
  {
    image: hackathon4,
    eventId: "hackathon4",
    title: "VibeCode-26",
  },
  {
    image: hackathon5,
    eventId: "hackathon5",
    title: "Startup Pitch",
  },
  {
    image: hackathon6,
    eventId: "hackathon6",
    title: "Designathon",
  },
  {
    image: hackathon7,
    eventId: "hackathon7",
    title: "RoboWars",
  },
  {
    image: hackathon8,
    eventId: "hackathon8",
    title: "Cloud",
  },
  {
    image:hackathon9,
    eventId:"hackathon9",
    title:"Sustainathon",
  }


];

// Detailed hackathon data for modal display - mapped from HackathonSection
export const hackathonDetails = [
  {
    ...hackathonEventDetails["hackathon-1"],
    id: 1,
    img: hackathon1,
    shortTitle: hackathonEventDetails["hackathon-1"]?.title || "NeuroHack 2.0",
  },
  {
    ...hackathonEventDetails["hackathon-2"],
    id: 2,
    img: hackathon2,
    shortTitle: hackathonEventDetails["hackathon-2"]?.title || "BioNexathon",
  },
  {
    ...hackathonEventDetails["hackathon-3"],
    id: 3,
    img: hackathon3,
    shortTitle: hackathonEventDetails["hackathon-3"]?.title || "NeuroCode 2.0",
  },
  {
    ...hackathonEventDetails["hackathon-4"],
    id: 4,
    img: hackathon4,
    shortTitle: hackathonEventDetails["hackathon-4"]?.title || "VibeCode-26",
  },
  {
    ...hackathonEventDetails["hackathon-5"],
    id: 5,
    img: hackathon5,
    shortTitle: hackathonEventDetails["hackathon-5"]?.title || "Startup Pitch",
    // Inject missing fields here as a fallback so the modal shows them even if the imported source was partially initialized
    
  },
  {
    ...hackathonEventDetails["hackathon-6"],
    id: 6,
    img: hackathon6,
    shortTitle: hackathonEventDetails["hackathon-6"]?.title || "Designathon",
  },
  {
    ...hackathonEventDetails["hackathon-7"],
    id: 7,
    img: hackathon7,
    shortTitle: hackathonEventDetails["hackathon-7"]?.title || "RoboWars",
  },
  {
    ...hackathonEventDetails["hackathon-8"],
    id: 8,
    img: hackathon8,
    shortTitle: hackathonEventDetails["hackathon-8"]?.title || "Cloud",
  },
  {
    ...hackathonEventDetails["hackathon-9"],
    id: 9,
    img: hackathon9,
    shortTitle: hackathonEventDetails["hackathon-9"]?.title || "Sustainathon",
  },

];
