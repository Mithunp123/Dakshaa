import autoshow from "../assets/EventsImages/EventDetails/exposshows/autoshow.webp";
import droneshow from "../assets/EventsImages/EventDetails/exposshows/droneshow.webp";
import foodshow from "../assets/EventsImages/EventDetails/exposshows/food.webp";
import txt from "../assets/EventsImages/EventDetails/exposshows/texexpo.webp";


export const exposAndShowsDetails = [
  {
    id: "expo-autoshow",
    img: autoshow,
    shortTitle: "Auto Show",
    title: "Auto Extravaganza",
    description: "High-performance cars, thrilling displays, and unforgettable auto entertainment.",
    date: "10 AM to 3 PM on 14 February 2026",
    venue: "Breeze Land",
    price: "Free",
    registrationLink: "",
    schedule: [],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. B.Balaji",
          designation: "Professor, Dept. of Mechanical Engineering",
          phone: "+91 7373 557060",
          email: "",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.J.N.Ravindra",
          department: "Mechanical",
          phone: "+91 95975  94597",
          email: "",
        },
        {
          name: "Mr.P.Sree Prahajeeth",
          department: "Mechanical",
          phone: "+91 86108 81422",
          email: "",
        },
        
      ],
    },
  },
  {
    id: "expo-droneshow",
    img: droneshow,
    shortTitle: "Drone Show",
    title: "Aerial Drone Showcase",
    description: "An aerial spectacle of synchronized drone displays, demonstrations of drone capabilities, and talks on UAV technology.",
    date: "10 AM to 3 PM on 14 February 2026",
    venue: "Open Field",
    price: "Free",
    registrationLink: "",
    schedule: [],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr.R.Vivek",
          designation: "Associate Professor, Dept. of EEE",
          phone: "+91 72004 58826",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.S.I.Pon Subra Balan",
          department: "EEE",
          phone: "+91 99948 20486",
          email: "",
        },
        
      ],
    },
  },

  {
    id: "expo-foodshow",
    img: foodshow,
    shortTitle: "Expo Food Show",
    title: "Expo Food Show 2026",
    description: "A vibrant food expo showcasing cuisines, live cooking, food startups, and culinary innovations—all in one place.",
    date: "12,13 and 14 February 2026",
    venue: "Open Field",
    price: "Free",
    registrationLink: "",
    schedule: [],
    
  },

  {
    id: "expo-textexpo",
    img: txt,
    shortTitle: "Textile Expo",
    title: "Textile Expo 2026",
    description: "An exhibition showcasing textiles, fabrics, fashion trends, weaving techniques, and innovations in the textile industry",
    date: "",
    venue: "Open Field",
    price: "Free",
    registrationLink: "",
    schedule: [],
    
  },
];
