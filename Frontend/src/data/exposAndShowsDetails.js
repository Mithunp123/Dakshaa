import autoshow from "../assets/EventsImages/EventDetails/exposshows/autoshow.png";
import droneshow from "../assets/EventsImages/EventDetails/exposshows/droneshow.png";

export const exposAndShowsDetails = [
  {
    id: "expo-autoshow",
    img: autoshow,
    shortTitle: "Auto Show",
    title: "Auto Extravaganza",
    description: "A thrilling showcase of automotive innovations, custom builds, and live demonstrations featuring classic, performance, and concept vehicles.",
    date: "TBD",
    venue: "Main Expo Ground",
    price: "Free",
    registrationLink: "",
    schedule: [],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. R. Karthikeyan",
          designation: "Professor, Dept. of Mechanical Engineering",
          phone: "+91 98400 11223",
          email: "rkarthikeyan@example.com",
        },
      ],
      studentCoordinator: [
        {
          name: "M. Aarav, IV Year",
          department: "Mechanical",
          phone: "+91 98765 43210",
          email: "",
        },
        {
          name: "N. Priya, III Year",
          department: "Automobile",
          phone: "+91 91234 55678",
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
    date: "TBD",
    venue: "Open Field",
    price: "Free",
    registrationLink: "",
    schedule: [],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. S. Meenakshi",
          designation: "Associate Professor, Dept. of EEE",
          phone: "+91 94455 33441",
          email: "smeenakshi@example.com",
        },
      ],
      studentCoordinator: [
        {
          name: "K. Rishi, IV Year",
          department: "EEE",
          phone: "+91 90123 45678",
          email: "",
        },
        {
          name: "L. Anika, III Year",
          department: "Aero",
          phone: "+91 90909 90909",
          email: "",
        },
      ],
    },
  },
];
