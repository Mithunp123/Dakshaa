import hr1 from "../assets/HORMONICS/hr1.webp";
import hr2 from "../assets/HORMONICS/hr2.webp";
import hr3 from "../assets/HORMONICS/hr3.webp";
import hr4 from "../assets/HORMONICS/hr4.webp";
import hr5 from "../assets/HORMONICS/hr5.webp";



/*
hr1: infinite step
hr2: cine fest
hr3:spotlight
hr4: musical maverics
hr5:beat mode
*/
export const culturalEvents = [
  {
    image: hr1,
    eventId: "cultural-1",
    price: 100,
  },
  {
    image: hr2,
    eventId: "cultural-2",
    price: 100,
  },
  {
    image: hr3,
    eventId: "cultural-3",
    price: 100,
  },
  {
    image: hr4,
    eventId: "cultural-4",
    price: 100,
  },
  {
    image: hr5,
    eventId: "cultural-5",
    price: 100,
  },
];

export const culturalDetails = [
  {
    id: "cultural-1",
    shortTitle: "INFINITE STEP",
    title: "Solo Dance Competition",
    description: "Solo dance is a personal expression of rhythm, emotion, and creativity through graceful movements. It captivates audiences with unique styles and storytelling.",
    img: hr1,
    date: "February 14, 2026",
    venue: "Visvesaraya Hall (Academic Block)",
    department: "Cultural Committee",
    price: "₹250 per head",
    rules: [
      "Song Duration should be between 3 to 4 min",
      "Song should be in mp3 format and must be brought by the participants in pen drive",
      "Register before the final date",
      "Props: Allowed but should be pre-approved",
      "Winners will be judged by jury based on Choreography, Costumes, Stage Presence, Overall Impact",
  
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 2,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹1,000",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹500",
        },
      ],
    schedule: [
      {
        date: "February 14, 2026",
        time: "09:00 AM to 3:00 PM",
        location: "Visvesaraya Hall (Academic Block)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr.K.Kiruthika",
          phone: "+91 98426 61683",
          email: "",
        },
        {
          name: "Dr.N.Ramesh",
          phone: "+91 86104 99148",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.S.Bala",
          email: "",
          phone: "+91 93632 80575",
        },
        {
          name: "Ms.P.K.Senthamil",
          email: "",
          phone: "+91 94428 45337",
        },
        {
          name: "Ms.R.Tarunika",
          email: "",
          phone: "+91 89460 86757",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "cultural-2",
    shortTitle: "BEAT MODE",
    title: "Group Dance Competition",
    description: "A thrilling showcase of teamwork, rhythm, and creativity as groups compete with electrifying dance performances!",
    img: hr2,
    date: "February 14, 2026",
    venue: "Visvesaraya Hall (Academic Block)",
    department: "Cultural Committee",
    price: "₹150 (per member)",
    rules: [
      "Song Duration should be between 4 to 5 min",
      "Team size should be between 3 to 10 members",
      "Song should be in mp3 format and must be brought by the participants in pen drive",
      "Register before the final date",
      "Props: Allowed but should be pre-approved",
      "Winners will be judged by jury based on Coordination, Choreography, Costumes, Stage Presence, Overall Impact",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 5,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹3,000",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹2,000",
        },
      ],
    schedule: [
      {
        date: "February 14, 2026",
        time: "09:00 AM to 3:00 PM",
        location: "Visvesaraya Hall (Academic Block)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr.K.Kiruthika",
          email: "",
          phone: "+91 9842661683",
        },
        {
          name: "Dr.N.Ramesh",
          email: "",
          phone: "+91 86104 99148",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.A.Athityaa",
          email: "",
          phone: "+91 93456 64042",
        },
        {
          name: "Ms.T.R.Ramitha",
          email: "",
          phone: "+91 93452 83931",
        },
        {
          name: "Ms.G.S.Harsha Prabha",
          email: "",
          phone: "+91 94422 18288",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "cultural-3",
    shortTitle: "CINE FEST",
    title: "Short Film Competition",
    description: "Cine Fest is a short film competition that celebrates the art of storytelling through visual media. Participants are invited to create and submit original short films that captivate audiences with compelling narratives, creative cinematography, and impactful messages. This event provides a platform for aspiring filmmakers to showcase their talent, creativity, and passion for cinema.",
    img: hr3,
    date: "February 14, 2026",
    venue: "MBA Hall (MBA Block)",
    department: "Cultural Committee",
    price: "₹150 (per member)",
    rules: [
      "The event is open to all individual participants and teams. Teams may consist of 1 to 3 members",
      "The Short films can be based on any theme & genres without any vulgar content",
      "The short film should be original",
      "Duration up to 10 minutes",
      "All films must be submitted in video file format (MP4, MOV, or AVI)",
      "Winners will be judged based on creativity, storytelling, and overall impact",
      "No 18+, bad words and adult content",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 2,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹1,000",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹500",
        },
      ],
    schedule: [
      {
        date: "February 14, 2026",
        time: "09:00 AM to 03:00 PM",
        location: "MBA Hall (MBA Block)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr.K.Kiruthika",
          phone: "+91 98426 61683",
          email: "",
        },
        {
          name: "Dr.N.Ramesh",
          phone: "+91 86104 99148",
          email: "",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.C.Tamilselvan",
          email: "",
          phone: "+91 63741 48544",
        },
        {
          name: "Ms.P.Sudheksha",
          email: "",
          phone: "+91 63812 83352",
        },
        {
          name: "Mr.K.S.Prem",
          email: "",
          phone: "+91 95000 57711",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "cultural-4",
    shortTitle: "MUSICAL MAVERICKS",
    title: "Solo Singing Competition",
    description: "A talented vocalist who mesmerizes the audience with a soulful performance, adding emotion and energy to the event.",
    img: hr4,
    date: "February 14, 2026",
    venue: "Cyberdome (IT Park)",
    department: "Cultural Committee",
    price: "₹200",
    rules: [
      "Time limit: 3–5 minutes per performance",
      "Languages & Genres: Participants can sing in any language and genre",
      "Music: Karaoke track or self-accompanied instrument is allowed (no pre-recorded vocals)",
      "Prohibited: No auto-tune or vocal effects allowed",
      "Judging Criteria: Voice Quality, Pitch, Rhythm, Expression, Song Selection",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 2,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹1,000",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹500",
        },
      ],
    schedule: [
      {
        date: "February 14, 2026",
        time: "09:00 AM to 03:00 PM",
        location: "Cyberdome (IT Park)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr.K.Kiruthika",
          phone: "+91 98426 61683",
          email: "",
        },
        {
          name: "Dr.N.Ramesh",
          phone: "+91 86104 99148",
          email: "",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.S.Balamurugan",
          email: "",
          phone: "+91 94877 07552",
        },
        {
          name: "Ms.Aashitha Firdous A",
          email: "",
          phone: "+91 88388 73452",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "cultural-5",
    shortTitle: "SPOTLIGHT",
    title: "Special Talent Showcase",
    description: "SPOTLIGHT is a special cultural event that celebrates unique and extraordinary talents of participants. This platform is open for performances such as magic shows, musical instrument performances, Silambam, martial arts, beatboxing, mimicry, and other creative skills. Participants will be judged based on originality, stage presence, skill level, and overall impact.",
    img: hr5,
    date: "February 14, 2026",
    venue: "Cyberdome (IT Park)",
    department: "Cultural Committee",
    price: "₹200",
    rules: [
      "The event is open to all registered participants of the cultural fest",
      "Each participant must showcase one special talent only (e.g., magic, musical instrument, Silambam, martial arts, mimicry, etc.)",
      "Performance duration (max 4 minutes) must be strictly followed",
      "Participants must report to the venue at least 30 minutes before the event starts",
      "Vulgarity, offensive content, or any form of inappropriate performance is strictly prohibited",
      "Use of dangerous props, fire, sharp weapons, or hazardous materials is not allowed",
      "Participants are responsible for bringing their own instruments, props, or materials required for the performance",
      "Background music (if any) must be submitted to the coordinators before the event in the specified format",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 2,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹1,000",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹500",
        },
      ],
    schedule: [
      {
      
        date: "February 14, 2026",
        time: "09:00 AM to 03:00 PM",
        location: "Cyberdome (IT Park)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr.K.Kiruthika",
          phone: "+91 98426 61683",
          email: "",
        },
        {
          name: "Dr.N.Ramesh",
          phone: "+91 86104 99148",
          email: "",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.Vijay Chandru",
          email: "",
          phone: "+91 73971 81421",
        },
        {
          name: "Mr.Derik Austin",
          email: "",
          phone: "+91 97889 45834",
        },
        {
          name: "Mr.Sakthivel",
          email: "",
          phone: "+91 80569 47128",
        },
        {
          name: "Ms.Dhivya Sree",
          email: "",
          phone: "+91 63693 92124",
        },
      ],
    },
    registrationLink: "",
  },
];
