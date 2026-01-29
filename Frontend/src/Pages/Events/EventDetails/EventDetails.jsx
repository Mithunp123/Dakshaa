import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

//'tech-aids': 'AI Mystery Box Challenge – AI & DS',
  //'tech-csbs': 'System Sense – CSBS',
  //'tech-aiml': 'Lovable Vibes – AIML',
  

  //'tech-bt': ' Reel-O-Science– BT',
  //'tech-bt-1': 'BioNexathon – BT',
  //'tech-bt-2': 'Bioblitz-Map – BT',

  //'tech-civil': '3D Arena – CIVIL ',
  //'tech-civil-1': 'Paper Presentation – CIVIL',

  //'tech-cse': 'NeuroHack 2.0 (36-hour) – CSE',
  //'tech-cse-1': 'BotXhibit – CSE',

  //'tech-ece': 'zero Component – ECE',
  //'tech-ece1': 'Paper Presentation – ECE',
  //'tech-eee': 'trailblazer – EEE',

  //'tech-eee-1': 'Paper Presentation – EEE',
  //'tech-ft': 'poster Presentation – FT',

  //'tech-it': 'code relay – IT',
  //'tech-mct': 'Paper Presentation – MCT',

  //'tech-mech': 'Paper Presentation – MECH',
  //'tech-mech-1': 'Designathon – MECH',

  //'tech-txt': 'DrapeX: Fabric Draping in Action – TXT',
  //'tech-txt-1': 'Paper Presentation – TXT',

  //'tech-vlsi': 'corex - vlsi',
  //'tech-ft-1': 'Paper Presentation – FT',
  

import Tech1 from "../../../assets/EventsImages/EventDetails/TechnicalImages/aids_tech.png";
import Tech2 from "../../../assets/EventsImages/EventDetails/TechnicalImages/csbs_tech.png";
import Tech3 from "../../../assets/EventsImages/EventDetails/TechnicalImages/aiml_tech.png";
import Tech4 from "../../../assets/EventsImages/EventDetails/TechnicalImages/bt_tech.png";
import Tech5 from "../../../assets/EventsImages/EventDetails/TechnicalImages/bt_tech1.png";
import Tech6 from "../../../assets/EventsImages/EventDetails/TechnicalImages/bt_tech2.png";
import Tech7 from "../../../assets/EventsImages/EventDetails/TechnicalImages/civil_tech.png";
import Tech8 from "../../../assets/EventsImages/EventDetails/TechnicalImages/civil_tech1.png";
import Tech9 from "../../../assets/EventsImages/EventDetails/TechnicalImages/cse_tech.png";
import Tech10 from "../../../assets/EventsImages/EventDetails/TechnicalImages/cse_tech1.png";
import Tech11 from "../../../assets/EventsImages/EventDetails/TechnicalImages/ece_tech.png";
import Tech12 from "../../../assets/EventsImages/EventDetails/TechnicalImages/eee_tech.png";
import Tech13 from "../../../assets/EventsImages/EventDetails/TechnicalImages/eee_tech1.png";
import Tech14 from "../../../assets/EventsImages/EventDetails/TechnicalImages/ft_tech.png";
import Tech15 from "../../../assets/EventsImages/EventDetails/TechnicalImages/it_tech.png";
import Tech16 from "../../../assets/EventsImages/EventDetails/TechnicalImages/mct_tech.png";
import Tech17 from "../../../assets/EventsImages/EventDetails/TechnicalImages/mech_tech.png";
import Tech18 from "../../../assets/EventsImages/EventDetails/TechnicalImages/mech_tech1.png";
import Tech19 from "../../../assets/EventsImages/EventDetails/TechnicalImages/txt_tech.png";
import Tech20 from "../../../assets/EventsImages/EventDetails/TechnicalImages/txt_tech1.png";
import Tech21 from "../../../assets/EventsImages/EventDetails/TechnicalImages/vlsi_tech.png";
import Tech22 from "../../../assets/EventsImages/EventDetails/TechnicalImages/ft_tech1.png";
import Tech23 from "../../../assets/EventsImages/EventDetails/TechnicalImages/ece_tech1.png";


import NonTech1 from "../../../assets/EventsImages/EventDetails/Nontech/aids_nontech.png";
import NonTech2 from "../../../assets/EventsImages/EventDetails/Nontech/aids_nontech1.png";
import NonTech3 from "../../../assets/EventsImages/EventDetails/Nontech/bt_nontech.png";
import NonTech4 from "../../../assets/EventsImages/EventDetails/Nontech/civil_nontech.png";
import NonTech5 from "../../../assets/EventsImages/EventDetails/Nontech/csbs_nontech.png";
import NonTech6 from "../../../assets/EventsImages/EventDetails/Nontech/cse_nontech.png";
import NonTech7 from "../../../assets/EventsImages/EventDetails/Nontech/cse_nontech1.png";
import NonTech8 from "../../../assets/EventsImages/EventDetails/Nontech/ece_nontech.png";
import NonTech9 from "../../../assets/EventsImages/EventDetails/Nontech/ece_nontech1.png";
import NonTech10 from "../../../assets/EventsImages/EventDetails/Nontech/eee_nontech2.png";
import NonTech11 from "../../../assets/EventsImages/EventDetails/Nontech/eee_nontech1.png";
import NonTech12 from "../../../assets/EventsImages/EventDetails/Nontech/eee_nontech.png";
import NonTech13 from "../../../assets/EventsImages/EventDetails/Nontech/ft_nontech.png";
import NonTech14 from "../../../assets/EventsImages/EventDetails/Nontech/it_nontech.png";
import NonTech15 from "../../../assets/EventsImages/EventDetails/Nontech/mca_nontech.png";
import NonTech16 from "../../../assets/EventsImages/EventDetails/Nontech/mct_nontech.png";
import NonTech17 from "../../../assets/EventsImages/EventDetails/Nontech/mct_nontech1.png";
import NonTech18 from "../../../assets/EventsImages/EventDetails/Nontech/mech_nontech.png";
import NonTech19 from "../../../assets/EventsImages/EventDetails/Nontech/txt_nontech.png";
import NonTech20 from "../../../assets/EventsImages/EventDetails/Nontech/vlsi_nontech.png";
import NonTech21 from "../../../assets/EventsImages/EventDetails/Nontech/turf_csbs.png";

/* Workshop Events List
workshop-aids: Agentic AI
workshop -aiml: AI Arcade (AI tools for game development)
workshop-bt : Next Generation Sequencing Technologies
workshop- civil : BIM (Building Information Modeling)
workshop - csbs Blockchain Beyond Crypto: Real-World Applications
workshop-cse: CyberStrike
workshop-ece: The Future of IoT: LoRaWAN with Artificial Intelligence
workshop-eee: EV- Retrofitting
workshop-ft: Sustainable Innovations in Food Processing Techniques
workshop-ipr: IPR
workshop-it: Github Essentials : Code Commit Collaborate
workshop-mct: Flight mode: ON
workshop-mech: Development of Next Gen vehicle
workshop-txt: AI Integrated Smart Medi Tech
workshop-vlsi: Chip2Test
workshop-mca: Code, Click, Done: Mobile App Development in a day.

*/






import { supabase } from "../../../supabase";
import { EVENTS_DATA } from "../../../data/events";
import { culturalEvents } from "../../../data/culturalEvents";

const EventDetails = () => {
  const { eventId: rawEventId } = useParams(); // Get the dynamic parameter from the URL
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStats, setRegistrationStats] = useState({ current: 0, capacity: 100, loading: true });

  // Check authentication status
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch registration stats for this event
  useEffect(() => {
    const fetchRegistrationStats = async () => {
      try {
        // Get the database event ID
        const dbEventId = rawEventId;
        
        // Use RPC function to get total count (bypasses RLS)
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_event_registration_count', { p_event_id: dbEventId });

        if (!rpcError && rpcData) {
          setRegistrationStats({
            current: rpcData.count || rpcData.current_registrations || 0,
            capacity: rpcData.capacity || 100,
            loading: false
          });
        } else {
          // Fallback: fetch from events table (current_registrations column)
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('capacity, current_registrations')
            .eq('event_id', dbEventId)
            .single();

          if (!eventError && eventData) {
            setRegistrationStats({
              current: parseInt(eventData.current_registrations) || 0,
              capacity: parseInt(eventData.capacity) || 100,
              loading: false
            });
          } else {
            setRegistrationStats({
              current: 0,
              capacity: 100,
              loading: false
            });
          }
        }
      } catch (error) {
        console.error('Error fetching registration stats:', error);
        setRegistrationStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchRegistrationStats();
  }, [rawEventId]);

  // Map new database event IDs to old EventDetails IDs


  const eventIdMap = {
    // Technical Events - Database ID -> Old ID
    'tech-aids': 'technical-event-1',
    'tech-csbs': 'technical-event-2',
    'tech-aiml': 'technical-event-3',
    'tech-bt': 'technical-event-4',
    'tech-bt-1': 'technical-event-5',
    'tech-bt-2': 'technical-event-6',
    'tech-civil': 'technical-event-7',
    'tech-civil-1': 'technical-event-8',
    'tech-cse': 'technical-event-9',
    'tech-cse-1': 'technical-event-10',
    'tech-ece': 'technical-event-11',
    'tech-eee': 'technical-event-12',
    'tech-eee-1': 'technical-event-13',
    'tech-ft': 'technical-event-14',
    'tech-it': 'technical-event-15',
    'tech-mct': 'technical-event-16',
    'tech-mech': 'technical-event-17',
    'tech-mech-1': 'technical-event-18',
    'tech-txt': 'technical-event-19',
    'tech-txt-1': 'technical-event-20',
    'tech-vlsi': 'technical-event-21',
    'tech-ft-1': 'technical-event-22',
    'tech-ece1': 'technical-event-23',

    // Non-Technical Events
    

    /*
  nontech-aids :AI MEME CONTEST
  nontech-aids1: IPL AUCTION
  nontech-bt : JUST-A-MINUTE (JAM)
  nontech-civil: CIVIL CIRCUIT
  nontech-csbs: EMOJI PICTIONARY
  nontech-cse: ARANGAM ATHIRA
  nontech-cse1: BATTLE ARENA
  nontech-ece:LINE X
  nontech-ece1: Kahoot Quiz
  nontech-eee: TWISTED TILES
  nontech-eee1: LOGO QUIZ
  nontech-eee2:UNIT WARS
  nontech-ft: UNMASKING BRANDS & FLAVOURS
  nontech-it: TREASURE HUNT
  nontech-mca:FACE PAINTING
  nontech-mct: MIND SPARK
  nontech-mct1: TECH WITHOUT TECH
  nontech-mech:FREEZEFRAME
  nontect-txt: T2T-Trash 2 Textile
  nontech-vlsi: BlindBites: Taste it. Find it
  nontech-csbs: TURF WARS
*/
'nontech-aids' :'non-technical-event-1',
'nontech-aids1': 'non-technical-event-2',
'nontech-bt' :'non-technical-event-3', 
'nontech-civil': 'non-technical-event-4',
'nontech-csbs': 'non-technical-event-5',
'nontech-cse': 'non-technical-event-6',
'nontech-cse1': 'non-technical-event-7',
'nontech-ece':'non-technical-event-8',
'nontech-ece1': 'non-technical-event-9',
'nontech-eee': 'non-technical-event-10', 
'nontech-eee1': 'non-technical-event-11',
'nontech-eee2': 'non-technical-event-12',
'nontech-ft': 'non-technical-event-13',
'nontech-it': 'non-technical-event-14',
'nontech-mca': 'non-technical-event-15',
'nontech-mct': 'non-technical-event-16',
'nontech-mct1': 'non-technical-event-17',
'nontech-mech': 'non-technical-event-18',
'nontech-txt': 'non-technical-event-19',
'nontech-vlsi': 'non-technical-event-20',
'nontech-csbs1':'non-technical-event-21',


    // Cultural Events
    
      'cultural-1': 'culturals-event-1',
      'cultural-2': 'culturals-event-2',
      'cultural-3': 'culturals-event-3',
      'cultural-4': 'culturals-event-4',
      'cultural-5': 'culturals-event-5',

      /*
      

      */
    


    // Hackathon Events - Maps to Neura Hack
    'hackathon1': 'hackathon-1',
    'hackathon2': 'hackathon-2',
    'hackathon3': 'hackathon-3',
    'hackathon4': 'hackathon-4',
    'hackathon5': 'hackathon-5',
    'hackathon6': 'hackathon-6',
    



    // Workshop Events
    'workshop-aids': 'workshop-1',
    'workshop-aiml': 'workshop-2',
    'workshop-bt': 'workshop-3',
    'workshop-civil': 'workshop-4',
    'workshop-csbs': 'workshop-5',
    'workshop-cse': 'workshop-6',
    'workshop-ece': 'workshop-7',
    'workshop-eee': 'workshop-8',
    'workshop-ft': 'workshop-9',
    'workshop-ipr': 'workshop-10',
    'workshop-it': 'workshop-11',
    'workshop-mct': 'workshop-12',
    'workshop-mech': 'workshop-13',
    'workshop-txt': 'workshop-14',
    'workshop-vlsi': 'workshop-15',
    'workshop-mca': 'workshop-16',

    // Conference Events - Maps to conference page (handled separately)
    'conference': 'conference-event-1',
  };
  // Reverse map for getting database ID from old ID
  const reverseEventIdMap = Object.fromEntries(
    Object.entries(eventIdMap).map(([key, value]) => [value, key])
  );

  // Get the correct eventId (handle both old and new IDs)
  const eventId = eventIdMap[rawEventId] || rawEventId;
  
  // Get the database event ID for registration
  const databaseEventId = reverseEventIdMap[eventId] || rawEventId;

  // Get event price from EVENTS_DATA

  // Handle registration click
  const handleRegisterClick = () => {
    console.log('🎫 Register click - user:', user ? 'logged in' : 'not logged in');
    console.log('🎫 databaseEventId:', databaseEventId);
    
    if (!user) {
      // Not logged in - redirect to login with query params for registration intent
      console.log('🔐 Redirecting to login with register=true, eventId:', databaseEventId);
      navigate(`/login?register=true&eventId=${encodeURIComponent(databaseEventId)}`);
      return;
    }
    // Logged in - redirect to registration page with event pre-selected
    navigate('/register-events', { state: { selectedEventId: databaseEventId } });
  };

  const eventDetails = {
    // Technical Events
    "technical-event-1": {
      title: "AI Mystery Box Challenge",
      price: "₹250",
      description:
        "The AI Mystery Box Challenge is a one-day technical event designed to test participants’ analytical thinking, creativity, and practical skills in Artificial Intelligence and Machine Learning. This event offers a unique, problem-solving experience where teams are challenged with an unknown AI task revealed only at the start of the competition. Participants will receive a mystery box containing a real-world dataset and a problem statement. Once the box is opened upon official announcement, teams must quickly analyze the problem, design an appropriate machine learning solution, and develop a working model within the given time. To enhance practical applicability, teams are also required to integrate their model with a functional web interface, simulating industry-level AI deployment.The event encourages collaborative teamwork, effective time management, and hands- on implementation of AI concepts such as data preprocessing, model selection, training, evaluation, and deployment. With internet access permitted, participants can explore libraries, frameworks, and documentation to refine their solutions.The AI Mystery Box Challenge will be conducted at AI Lab 2 with a registration fee of ₹250 per head. This event is ideal for students who are passionate about AI, Data Science, and real-time problem solving, and who wish to showcase their technical expertise in a competitive environment.",
      image: Tech1,
      /*rounds: [
        {
          title: "",
          description: [
            "",
            
          ],
        },
        
      ],*//*
      rewards: [
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹1,000",
        },
        {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹1,500",
        },
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹500",
        },
      ],*/
      rules: [
        "Participants must bring their own laptop; a minimum Intel i5 processor is required to ensure smooth model development and execution.",
        "Teams must consist of 2 to 3 members, and all members must be present throughout the event.",
        "The mystery box may be opened only after the official announcement by the coordinators.",
        "Teams must work exclusively on the dataset and problem statement provided inside their assigned mystery box.",
        "Internet access is permitted .",
        "The final solution must include a working machine learning model integrated with a functional web interface.",
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "9:00 AM - 4:00 PM",
          location: "AI Lab 2",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. J. Karthick",
            phone: "8056408054",
            email: "",
          },
          {
            name: "Ms. J. K. Shalini",
            phone: "9894970113",
            email: "",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr. M.Harish",
            phone: "6369303123",
            email: "",
          },
          {
            name: "Mr. T.Vikas",
            phone: "6381459911",
            email: "",
          },
          {
            name: "Ms. S.Obulakshmi",
            phone: "8124225197",
            email: "",
          },
          {
            name: "Ms. M.Raufama",
            phone: "9345064140",
            email: "",
          },
        ],
      },
      registrationLink: "",
    },
    "technical-event-2": {
      title: "System Sense – Usability & Analysis Challenge",
      price: "₹250",
      description:
        "System Sense is a technical challenge designed to evaluate heuristic principles, identify design and interaction issues, and propose effective improvements within a limited time. Where participants assess systems based on established usability guidelines such as clarity, consistency, feedback, and user control. By applying these principles, participants develop practical solutions that enhance both user experience and business efficiency.",
      image: Tech2,
      rounds: [
        {
          title: "Round-1 – System Analysis Round",
          description: [
            "Participants must analyze the given system, identify key usability or design issues, and propose a logical improvement using heuristic principles.",
            "Evaluation will be based on accuracy of problem identification, relevance of the proposed solution, and clarity of analysis.",
          ],
        },
        {
          title: "Round-2 – Justification & Final Round",
          description: [
            "Shortlisted participants will be given a new and more complex system scenario.",
            "Participants must analyze the system and justify their proposed solution within the allotted time as per the One-Minute Justification Rule.",
          ],
        },
        {
          title: "Round-3 - Additional Features",
          description: [
            "Participants are encouraged to apply heuristic principles and system-thinking approaches to arrive at effective solutions.",
          ],
        },
        {
          title: "Round-4 - Plagiarism and Fair Conduct",
          description: [
            "All analyses and solutions must be original and developed during the event.",
            "Copying, sharing answers, or using unfair means in any form is strictly prohibited.",
            "Any instance of malpractice or violation of rules will result in immediate disqualification.",
            "The decision of the judges will be final and binding in all matters related to evaluation and conduct.",
          ],
        },
      ],

      /*rewards: [
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹1,000",
        },
        {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹1,500",
        },
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹500",
        },
      ],*/
      rules: [
        "The competition consists of two rounds, conducted within a total duration of 2–3 hours.",
        "Participants may compete individually or in teams of two.",
        "Participants must analyze given system scenarios and identify usability or design issues using heuristic principles.",
        "Solutions should emphasize system understanding, logical reasoning, and practical improvements, rather than coding.",
        "Each participant or team must justify their proposed solution within the specified time limit as announced by the organizers.",
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: " 2-3 hrs",
          location: " AB Lab 4",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr . M .Tamilarasi",
            phone: "9750037023",
            email: "",
          },
        ],
        studentCoordinator: [
          {
            name: "Miss . R. Mythra",
            phone: "9345968826",
            email: "",
          },
          {
            name: "Miss . K. Saimohana",
            phone: "",
            email: "",
          },
        ],
      },
      registrationLink: "", // Registration link
    },

    "technical-event-3": {
      title: " 24-Hour Vibe Coding Hackathon ",
      price: "₹250",
      description:
        "The 24-Hour Vibe Coding Hackathon is an intensive, creativity-driven coding event where participants design and prototype real-world software solutions using Lovable AI. The hackathon emphasizes problem-first thinking, rapid iteration, and meaningful impact rather than product pitching or hardware-based development.Participants will receive problem statements on the spot and are expected to ideate, build, and present a working solution within 24 hours using limited AI credits—encouraging smart, intentional, and efficient development",
      image: Tech3,
     
     rules: [
  "Each participant is allotted 100 Lovable AI credits.",
  "Credits are non-transferable.",
  "Teams must manage credits responsibly.",
  "No additional credits will be issued under any circumstances.",
  "All development must occur within the 24-hour hackathon window.",
  "Use of pre-built or previously developed projects is strictly prohibited.",
  "Internet access is permitted for learning and documentation.",
  "Open-source libraries may be used unless explicitly restricted.",
  "Usage of AI tools is prohibited except Lovable AI."
],

      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "9:00 AM - 4:00 PM",
          location: "AB lab 3",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. S.Insol Rajasekar",
            email: "",
            phone: "8220512436",
          },
          {
            name: "Mr.K.Praveen",
            email: "",
            phone: " 9500918101",
          },
        ],
        studentCoordinator: [
          {
            name: "Ms.Dhinesha G",
            email: "",
            phone: "9942687393",
          },
          {
            name: "Ms.Monika R",
            email: "",
            phone: "9363607816",
          },
          {
            name: "Mr.Adith D",
            email: "",
            phone: "7094278374",
          },
          {
            name: "Mr.Madhukumar M",
            email: "",
            phone: "9791441235",
          },
        ],
      },

      registrationLink: "", // Registration link
    },

    "technical-event-4": {
      title: "Reel-O-Science",
      price: "₹250",
      description:
        "Reel-O-Science is a creative science communication challenge where participants create an engaging Instagram reel that explains scientific concepts in a simple, impactful, and visually appealing way. The event encourages students to blend scientific accuracy with creativity to raise awareness on topics related to Biotechnology, Life Sciences, Health, Environment, and Science for Society.",
      image: Tech4,
      rounds: [
        {
          title: "Reel Creation & Submission ",
          description: "Participants must create a 45–60 second vertical Instagram reel based on the given science-related themes. The reel should clearly explain the scientific concept using original ideas, visuals, and narration. The reel must be posted on Instagram by tagging the official Dakshaa page and using the specified hashtags.",
        },
        {
          title: "Evaluation & Shortlisting",
          description:"Submitted reels will be evaluated based on scientific understanding, originality, presentation quality, and audience impact. Shortlisted entries will be considered for final ranking and prizes.",
        }
      ],
      


      rules: [
        "Participation is open to UG and PG students.",

        "Participants can compete individually or in teams of up to 2 members.",

        "Reel duration must be 45–60 seconds and in vertical (9:16) format.",

        "Video resolution should be minimum 720p (up to 4K allowed).",

        "Language can be English or Tamil (subtitles are encouraged).",

        "AI tools may be used only as support; the scientific explanation and narration must be human-driven.",
        "Fully AI-generated reels are strictly prohibited.",

        "Any misuse of AI or misrepresentation of originality will lead to disqualification.",

        "Content must be scientifically accurate and free from offensive, political, religious, or misleading material.",

        "Plagiarism is strictly prohibited.",

        "Only copyright-free music is allowed.",

        "The reel must be posted on Instagram, tagging the official Dakshaa page.",

        "Mandatory hashtags: #Dakshaa #ksrct1994 #Biotechnology",

        "The Instagram reel link must be submitted during the event.",  
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "9.00 AM to 2.00 PM ",
          location: "Bioprocess Laboratory ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. S. Sidhra",
            email: "",
            phone: "8925606990",
          },
        ],
        studentCoordinator: [
          {
            name: "Ms. P. Keerthana",
            email: " ",
            phone: "9894484834",
          },
          {
            name: "Mr. K. Sharen",
            email: "",
            phone: "9943191499",
          },
          {
            name: "Ms. V. Dhanasree",
            email: "",
            phone: " 6374153457",
          },
        ],
      },

      registrationLink: "https://forms.gle/gziLh4EoGaCQLSpg8", // Registration link
    },





    "technical-event-5": {
      title: "Bionexathon",
      price: "₹250",
      description:
        "A platform for students, researchers, and professionals to present and discuss recent advancements in biotechnology.Includes keynote lectures, panel discussions, and interactive sessions.Focus on innovation, research impact, and interdisciplinary collaboration. Encourages networking and knowledge exchange among participants.",
      image: Tech5,
      topics: [
        {
          title: "Title :  Converging Life Sciences with Smart Technologies",
          
        },
      ],
      rules: [
  "Participants must register before the deadline to confirm their attendance.",
  "Presentations must be relevant to biotechnology and allied fields.",
  "Each speaker will be allocated a specific time slot, and time limits must be strictly followed.",
  "Original research and ideas are encouraged; plagiarism is strictly prohibited.",
  "The decisions of the organizers and judges regarding presentations, sessions, and awards are final and binding.",
],


      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "10 AM to 4 PM ",
          location: " Bioinformatics Laboratory",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. G. Ayyappadasan ",
            email: "",
            phone: "+91 99445 28382",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr. P. Nishaanth",
            email: " ",
            phone: "9843493094",
          },
          {
            name: "Mr. N. Vasanth ",
            email: "",
            phone: "7397192415",
          },
          {
            name: "Mr. M. Karunamurthy",
            email: "",
            phone: " 8925243072",
          }
        ],
      },

      registrationLink: "https://forms.gle/gziLh4EoGaCQLSpg8", // Registration link
    },
   "technical-event-6": {
  title: "BioBlitz-Map (Bio Treasure Hunt)",
      price: "₹250",
  description:
    "BioBlitz-Map is a biology-based campus treasure hunt that challenges participants to apply biotechnology concepts, scientific logic, and observation skills to solve clues. Teams navigate through multiple locations using mapped hints, biological riddles, and logical reasoning to reach the final destination. The event emphasizes teamwork, accuracy, and strategic thinking in a competitive and engaging environment.",
  image: Tech6,
  rounds: [
    {
      title: "Round 1: Clue Decoding & Navigation",
      description:
        "Teams begin the hunt by decoding biological riddles, concept-based questions, and image or spot identification clues. Each correct answer leads to the next mapped location within the campus.",
    },
    {
      title: "Round 2: Final Discovery & Completion",
      description:
        "In the final phase, teams solve advanced life-science–based logical challenges to reach the treasure point. Performance is evaluated based on speed, accuracy, and progress within the given time limit.",
    },
  ],
  rules: [
    "The event is open to UG and PG students only.",
    "Each team must consist of 1 to 2 members.",
    "Team members must stay together throughout the event.",
    "No external help from other participants or spectators is allowed.",
    "All clues must be solved using biotechnology and life science knowledge.",
    "Any damage to college property will result in immediate disqualification.",
    "Misconduct, unfair practices, or rule violations will not be tolerated.",
    "All tasks must be completed within the allotted time limit of 60–90 minutes.",
    "Participants must strictly follow the instructions given by the event coordinators.",
    "The decisions of the coordinators and judges are final and binding.",
  ],
  schedule: [
    {
      round: "Event Timing",
      date: "February 13, 2026",
      time: "3 Hours",
      location: "Protein and Enzyme Engineering Laboratory",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Dr. S. Sidhra",
        email: "",
        phone: "8925606990",
      },
    ],
    studentCoordinator: [
      {
        name: "Ms. D. Moumitha",
        email: "",
        phone: "9952533198",
      },
      {
        name: "Mr. M. Ajairaj",
        email: "",
        phone: "9342070737",
      },
      {
        name: "Ms. Nancy",
        email: "",
        phone: "7695890609",
      },
    ],
  },


      registrationLink: "https://forms.gle/2wBfChfRVPiKVw599", // Registration link
    },
    "technical-event-7": {
      title: "3D Arena (Google SketchUp)",
      price: "₹250",
      description:
        "Transform 2D concepts into immersive 3D environments while demonstrating your mastery of spatialefficiency and creative problem-solving. This challenge tests your ability to visualize volume andtexture in a high-energy setting. Bring your ideas to life, from sleek modern interiors to complexstructural exteriors.",
      image: Tech7,
      /*rounds: [
        {
          title: "",
          description: [
            "",
          ],
        },
        {
          title: "",
          description: [
            "",
          ],
        },
      ],*/
      rules: [
        "Time Limit: Complete the model within the allotted time.",
        "No Outside Help: Mobile phones, internet, and external files are strictly prohibited.",
        "Software Only: Use only the provided Google SketchUp software.",
        "Solo Entry: Only registered participants allowed; no team support or helpers.",
        "Judging: Based on accuracy, creativity, and submission time.",
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "9:00 AM to 12:00 PM",
          location: "Civil CADD Laboratory",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. K. Vijaya Sundravel",
            phone: "9688676665",
            email: "",
          },
        ],
        studentCoordinator: [
          {
            name: "Ms. P. Vaishnavi ",
            phone: "9944108747",
            email: "",
          },
          {
            name: "Ms. C. V. Swetha",
            phone: "7538831885",
            email: "",
          },
        ],
      },

      registrationLink: "   ", // Registration link
    },
    "technical-event-8": {
       title: "Paper Presentation",
      price: "₹250",
       description:
         "This presentation provides a clear and structured explanation of the selected concept, covering its basic principles, system design, and real-world relevance. It highlights how the idea can be applied practically, discusses current developments, and points out key challenges and future scope, helping the audience understand both theory and application",
       image: Tech8,
       topics: [
         {
           description: "Topics",
         },
         {
           title: "1) Smart & Sustainable Infrastructure ",
           description:
             "",
         },
         {
            title: "2) AI and Digital Technologies in Civil Engineering ",
            description:"",
         },
         {
            title: "3) Future Trends in Construction and Structural Engineering ",
            description:"",
         }
      ],
       rules: [
         " Each team must consist of 2 to 3 members only. ",
         "Participants must Present their Paper under any one of the three given Themes.",
         "Only registered participants are allowed to be present. ",
         "The team with the best innovative and creative presentation will be selected as the winner. ",
       ],
       schedule: [
         {
           round: "Event Timing",
           date: "February 13, 2026",
           time: "9:00 AM to 12:00 AM",
           location: " Civil Building, C110 classroom",
         },
       ],
       contact: {
         facultyCoordinator: [
           {
             name: "Dr. K. Vijaya Sundravel",
             email: "",
             phone: "9688676665",
           },
         ],
         studentCoordinator: [
           {
             name: " Ms. P. Vaishnavi ",
             email: "",
             phone: "9944108747",
           },
           {
             name: "Ms. C. V. Swetha",
             email: "",
             phone: "7538831885",
           },
         ],
       },
    },
    "technical-event-9": {
      title: " NEUROHACK 2.O",
      price: "₹250",
      description:
        " NeuroHack 2.O is where ideas are built, systems are broken, and security is redefined. Participants Hack, 	Defend, and Secure technology to shape the future of digital innovation",
      image: Tech9,
      rounds: [
        {
          title: "",
          description: "",
        },
        {
          title: "",
          description:
            "",
        },
        {
          title: "",
          description:
            "",
        },
      ],
      rules: [
        "Each team shall consist of three (3) to four (4) members.",
        "NeuroHack 2.O is a continuous 36-hour hackathon with no breaks in development time.",
        " A total of two (2) evaluation rounds will be conducted during the hackathon period.",
        "Participants must bring their own laptops, peripherals, and required accessories.",
        "At least one team member must be present and actively working at all times throughout the 36-hour duration.",
        "All solutions must be developed during the hackathon period only.",
        "The decision of the judging panel shall be final and binding.",
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "9:00 AM to 4:00 PM ",
          location: " IT PARK",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "S.VADIVEL",
            email: "",
            phone: "9790632171",
          },
  
        ],
        studentCoordinator: [
          {
            name: "SHANMUGESHWARA",
            email: "",
            phone: "9487119381",
          },
          
        ],
      },
    
      registrationLink: " ", // Registration link
    },
    "technical-event-10": {
      title: "BOTXHIBIT",
      price: "₹250",
      description:
        "A showcase-based technical event where participants present pre-developed software or hardware bots demonstrating innovation, functionality, and real-world application. Teams must explain the concept, design, working principle, and technology stack of their bot and perform a live demonstration within the allotted time. Evaluation will be based on originality, technical complexity, problem-solving approach, performance, and presentation quality. The team that best demonstrates a functional, innovative, and impactful bot will be declared the winner.",
      image: Tech10,
      rounds: [
        {
          description:"",

        },
        
      ],
      rules: [
        " A team may consist of a maximum of two (2) participants",
        "Only pre-developed bots (software or hardware) are permitted for demonstration.",
        "On-site coding, modification, or fabrication of bots is strictly prohibited.",
        " Mobile phones and external references are not allowed during evaluation, except when required for bot operation.",
        " Each team must demonstrate a fully functional bot to be eligible for full evaluation.",
        "Teams must bring all required components, equipment, and accessories for their bot.",
        " Bots must comply with basic safety standards; unsafe hardware may lead to disqualification.",
        "Any damage to equipment, venue property, or safety violations may result in disqualification.",
        "The decision of the jury shall be final and binding.",
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "",
          location: "IT PARK ",
        },
      
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. K .PONNGODI",
            email: "",
            phone: "97886 80616",
          },
        ],
        studentCoordinator: [
          {
            name: "JEEVANYA R ",
            email: "",
            phone: "9385781083",
          },
          
        ],
      },

      registrationLink: "https://forms.gle/2wBfChfRVPiKVw599", // Registration link
    },
    "technical-event-11": {
      title: "Zero component",
      price: "₹250",
      description:
        "An engaging electronics-based technical event where participants are given only component symbols without component names. Participants must identify the correct components and build the complete circuit within a limited time. The participant who successfully builds a correct and working circuit in the shortest time is declared the winner.",
      image: Tech11,
      rounds: [],
      rules: [
        "Maximum 2 players per team.",
        "Components provided by the team.",
        "Mobile phones, books, or external references are strictly prohibited.",
        "The circuit must be fully functional to earn full points.",
        "Damaging components or equipment may result in disqualification.,"
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "9:00 AM to 1:00 PM",
          location: "Electronic Devices Laboratory",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mrs V P Kalaiarasi",
            email: "",
            phone: "9500241234",
          },
        ],
        studentCoordinator: [
          {
            name: "Harish K",
            email: " ",
            phone: "9385781083",
          },
          
        ],
      },

      registrationLink: "https://forms.gle/2wBfChfRVPiKVw599", // Registration link
    },
    "technical-event-12": {
      title: "Trailblazer",
      price: "₹250",
      description:
        "The Trailblazer event challenges participants to design and operate a robot that follows a predefined path accurately and efficiently. The robot must track a line from start to finish with minimal deviation.",
      image: Tech12,
      rounds: [],
      rules: [
        "Maximum team size: 3 members.",
        "Robot must be autonomous (no remote control).",
        "Manual interference during the run leads to disqualification.",
        "Only one restart is allowed in case of technical failure.",
        
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "4 Hours",
          location: "Location need",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. N Rajasekaran",
            email: "",
            phone: "",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr. Vishwanathan K ",
            email: "",
            phone: "9025081987",
          },
          {
            name: "Mr. Gowri Shankar S ",
            email: "",
            phone: "9629239567",
          },
        ],
      },

      registrationLink: "https://forms.gle/2wBfChfRVPiKVw599", // Registration link
    },
    "technical-event-13": {
      title: "Paper presentation",
      price: "₹250",
      description:
        "Paper Presentation is a technical event that provides a platform for students and researchers to present their innovative ideas, research findings, and technical knowledge in front of an expert panel. Participants are required to prepare and present a research or review paper related to engineering, science, technology, or management domains.",
      image: Tech13,
      topics: [
        {
          title: "TOPICS:",
        },
        {
          title: "Renewable energy ",
          
        },
        {
          title: "AI-Driven Electrical Engineering ",
          
        },
        {
          title: "Smart Grid ",
          
        },
        {
          title: "Power Electronics ",
          
        },
        {
          title: "Internet of things (IoT) ",
          
        },
        {
          title: "Sensor Technology ",
        },
        {
          title: "Power systems .",
        },
      ],
      rules: [
        "The paper must be original, plagiarism-free, and relevant to the chosen technical domain.",
        "A maximum of 2–3 participants per team is allowed; individual participation is also permitted.",
        "Each team will be given 8–10 minutes for presentation followed by a short Q&A session.",
        "Judges’ decision will be final, and any form of malpractice will lead to disqualification.",
      ],
      schedule: [
        {
          round: "Round",
          date: "February 13, 2026",
          time: "4 Hours",
          location: "Location need",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. M. K. Elango ",
            phone: " +91 99524 93666",
          },
        ],
        studentCoordinator: [
          {
            name: "Ms.N.Dharshika ",
            phone: "+91 90036 44185",
          },
          {
            name: "Ms. S .P. Hema Vardhini ",
            phone: "7200904682",
          },
        
        ],
      },

      registrationLink: "", // Registration link
    },
    "technical-event-14": {
      title: "POSTER PRESENTATION",
      price: "₹250",
      description:
        "This poster presentation provides students a platform to showcase innovative ideas and research on emerging food processing technologies. Participants will visually present advanced techniques, applications, and benefits that enhance food quality, safety, and sustainability. The session encourages knowledge sharing, creativity, and scientific discussion among students and experts.",
      image: Tech14,
      topics: [
        {
          title: " Emerging Food Processing Technologies ",
          description:
            "",
        },
      ],
      rules: [
        "Participants must register before the event.",
        " Posters should be original and student-created.",
        "Each team/student must be present during the presentation.",
        " Time limits for presenting must be strictly followed.",
        "Proper citation of references is mandatory.",
        "Posters should be neat, clear, and visually appealing.",
        "Judges’ decisions will be final and binding.",
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 13, 2026",
          time: "",
          location: " Baking and Confectionery Laboratory",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P.Kalai Rajan",
            email: "",
            phone: "7010841881 ",
          },
        ],
        studentCoordinator: [
          {
            name: "Ms.S.Trishna",
            email: "",
            phone: "9843867406",
          },
          {
            name: "Ms.V.Madhushree ",
            email: "",
            phone: "6379704086",
          },
        ],
      },

      registrationLink: "https://forms.gle/2wBfChfRVPiKVw599", // Registration link
    },
    "technical-event-15": {
        title: "Neurocode 2.O",
      price: "₹250",
        description:
          "Neurocode 2.O is a team-based web design challenge where a reference website design is provided.Team members take turns recreating the design, building upon the previous member’s work without restarting. Creativity, accuracy, and teamwork determine the final output.",
        image: Tech15,
        rounds: [
          {
            title: "",
          },
          {
            title: "Round-1: Code Debug Sprint (30 Minutes) – Elimination Round Concept",
            description: [
              "Teams are given a faulty front-end codebase containing intentional logical, syntactical, and UI errors",
              "The goal is to debug and make the website functionally correct and visually accurate within the time limit.",
              
            ],
          },
          {
            title: "Round-2: Reverse Layout Engineering (1 hour) ",
           
            description: [
              "A live website is shown for 120 seconds",
              "No screenshots / no notes",
              "Mandatory CSS Grid",
              "Semantic tags required (header, main, section, footer)",
              "No frameworks (Bootstrap, Tailwind )",
              
            ],
          },
          {
            title: "Round-3: Final Showdown – Code Relay Edition (45 Minutes) ",
            description: [
              "This round introduces the true “Code Relay” challenge, testing teamwork without communication.",
              "Each team must consist of exactly 3 members",
              "All members must be present during all rounds",

            ],
          },
          
        ],
        rules: [
          "Participants must bring their own laptop",
          "Required software must be pre-installed (VS Code / browser)",
          "Internet access is restricted unless explicitly allowed by judges",
          "Plagiarism or copying from other teams will result in immediate disqualification",

        ],
        schedule: [
          {
            round: "Event Timing",
            date: "February 13, 2026",
            time: "9:30 AM to 12:30 PM",
            location: " Computer Lab (high spec)",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Mr.P.Dineshkumar",
              phone: "9047976171",
            },
          ],
          studentCoordinator: [
            {
              name: "Mr.S.Sujith",
              phone: "9361796047",
            },
            {
              name: "Ms.G.Kari Vikashini",
              phone: "9384525869",
            },
          

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },
      "technical-event-16": {
        title: "Paper Presentation",
      price: "₹250",
        description:
          "This presentation provides a clear and structured explanation of the selected concept, covering its basic principles, system design, and real-world relevance. It highlights how the idea can be applied practically, discusses current developments, and points out key challenges and future scope, helping the audience understand both theory and application.",
        image: Tech16,
        topics: [
          
          {
            title: "TOPICS:",
            description: [
              "Next-Gen Robotics",
              "Industry 5.0",
              "Digital Twin Technology",
            ],
            
          },
        ],
        rules: [
          "Compete individually or in teams of 2-3 members.",
          "No External help allowed.",
          "Clarity of Presentation",
          "Innovation / Contribution",
        ],
        schedule: [
          {
            round: "Event Timing",
            date: "February 13, 2026",
            time: "9:30 AM - 3:00 PM",
            location: "Homi J Baba Hall (Conference Hall) (MCT Block)",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Mr. M. Sanjay",
              email:"",
              phone: "7092821630",
            },
          ],
          studentCoordinator: [
            {
              name: "M r. B. Aakash ",
              email:"",
              phone: "7010696233",
            },
            {
              name: "Mr. D. Nishanth",
              email:"",
              phone: "9600352820",
            },

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },

      "technical-event-17": {
        title: "PAPER PRESENTATION",
      price: "₹250",
        description:
          "This event allows students to present technical ideas and research in engineering fields. Participants showcase innovation, analysis, and problem-solving through structured presentations.A Q&A session helps evaluate technical depth and communication skills.",
        image: Tech17,
        topics: [
          
          {
            title: "TOPICS:",
            description: [
              "Any Topics Related to Mechanical Domain .",
              "Upcoming revolutionary technologies in Manufacturing industries.",
            ],
          },
        ],
        rules: [
          "Team of maximum two members is allowed.",
          "Format: PPT / PDF format",
          "PPT must contain 8-12 slides and be presented within 6-8 minutes.",
          "Q&A session is compulsory for evaluation",
        ],
        schedule: [
          {
            round: "Event Timing",
            date: "February 13, 2026",
            time: "9:30AM -2:00PM",
            location: "Smart Class Room [ Mechanical ]",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Dr. P.Sampath",
              email:"",
              phone: "",
            },
            {
              name: "Dr. S. Jeyaprakasam",
              email:"",
              phone: "",
            }
          ],
          studentCoordinator: [
            {
              name: "Mr.N. Surya",
              email:"",
              phone: "9025223203",
            },
            {
              name: "Mr. S.Harish ",
              email:" ",
              phone: "7010963539",
            },
            {
              name: "Ms.V.A.Santhanalakshimi ",
              email:" ",
              phone: "",
            }

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },
      "technical-event-18": {
        title: "DESIGNATHON",
      price: "₹250",
        description:
          "Designathon challenges individuals to solve an engineering problem within a limited time.Participants develop creative design solutions using logical and technical thinking. Originality, feasibility, and time management are key evaluation criteria.",
        image: Tech18,
        rounds: [
          
          {
            title: "",
            
          },
        ],
        rules: [
          "This is an individual (solo) participation event. Open to all participants of any displinary.",
          "Participants must carry a valid ID card. The total duration of the designathon is 3 hours.",
          "Participants must start and end within the given time frame.",
          "Late submissions will not be considered. Any form of plagiarism will lead to immediate disqualification. Internet usage are restricted",
          "Any misconduct may result in disqualification. The decision of the judges will be final and binding.",
        ],
        schedule: [
          {
            round: "Event Timing",
            date: "February 13, 2026",
            time: "3hours",
            location: "Idea lab [ Main Building ]",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Dr.K.Santhanam ",
              email:"",
              phone: "",
            },
            {
              name: "Mr.S.Venkatesan ",
              email:"",
              phone: "",
            }
          ],
          studentCoordinator: [
            {
              name: "Mr.G.S.Priyan",
              email:"",
              phone: "8668057985",
            },
            {
              name: "Mr. S.Vijayaragavan",
              email:" ",
              phone: "8124547760",
            },
            {
              name: "Ms. M.Nabishka ",
              email:" ",
              phone: "",
            },

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },
      "technical-event-19": {
        title: "Drape X: Fabric Draping in Action",
      price: "₹250",
        description:
          "DrapeX: Fabric Draping in Action offers hands-on practice in both basic and advanced fabric draping techniques using dress forms. Participants will understand fabric behavior such as fall, flow, and structure through the use of different fabrics, while applying creativity and technical skills to create original draped designs. The event also focuses on translating draped forms into garment silhouettes and design concepts, analyzing fabric properties that influence drape and appearance, and enhancing practical skills, creativity, and confidence in fabric manipulation.",
        image: Tech19,
        rounds: [
          
          {
            title: "",
            
          },
        ],
        rules: [
          "The event is open to students of textile and related disciplines; prior individual registration is mandatory.",
          "Participation is allowed individual or in teams of 2 members.",
          "Participants must bring their own fabric for draping; basic tools and dress forms will be provided.",
          "The draping activity must be completed within the stipulated time.",
          "Designs should be original; use of pre-stitched or pre-draped materials is not permitted.",
          "Participants must maintain discipline and follow instructions given by the coordinators.",
          "Judging will be based on creativity, fabric utilization, draping technique, and overall presentation.",
          "The decision n of the judges and organizing committee will be final.",
        ],
        schedule: [
          {
            round: "Event Timing",
            date: "February 13, 2026",
            time: "3 hours ",
            location: "Garment Lab -Textile Block",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Dr.K.Saravanan ",
              email:"",
              phone: "98421 03201",
            },
          ],
          studentCoordinator: [
            {
              name: "Ms. Subhalakshmi B ",
              email:"",
              phone: " 95977 78936",
            },
            {
              name: "Ms. Abirama Selvi R J ",
              email:" ",
              phone: "96882 41151",
            },

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },
      "technical-event-20": {
        title: "PAPER PRESENTATION ",
      price: "₹250",
        description:
          "The paper presentation focuses on providing an overview of sustainability and its growing importance in the textile industry, along with recent trends and innovations in textile technology and manufacturing. It addresses key issues related to textile waste and discusses methods such as recycling, reuse, and upcycling to promote sustainable practices. Participants will also be introduced to smart textiles and their basic applications in daily life, eco-friendly practices including water, energy, and chemical conservation, and the future scope, emerging areas, and career opportunities in textile engineering.",
        image: Tech20,
        topics: [
          
          {
            title: "TOPICS:",
            description: [
              "Sustainability in the Textile Industry: An Overview",
              "Recent Trends and Innovations in Textile Technology",
              "Textile Waste: Problems, Solutions, and Opportunities",
              "Smart Textiles: Concepts and Everyday Applications",
              "Eco-Friendly Practices in Textile Manufacturing",
              "Future Scope of Textile Engineering in a Sustainable World",
            ],
          },
        ],
        rules: [
          "Team of maximum two members is allowed.",
          "Format: PPT / PDF format",
          "PPT must contain 8-12 slides and be presented within 6-8 minutes.",
          "Q&A session is compulsory for evaluation",
        ],
        schedule: [
          {
            round: "Event Timing",
            date: "February 13, 2026",
            time: "9.00 AM to 2.00 PM",
            location: "MBA Seminar Hall",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Dr. K.R.Nandagopal",
              email:"",
              phone: "+91 90034 36705",
            },
            {
              name: "Dr. C.Premalatha",
              email:"",
              phone: "+91 97502 06161",
            }
          ],
          studentCoordinator: [
            {
              name: "Mr.Dinu",
              email:"",
              phone: "82206 76049",
            },
            {
              name: "Mr.Raaghul Khanna V ",
              email:" ",
              phone: "96008 88788",
            },

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },
      "technical-event-21": {
        title: "CoreX (Project Presentation)",
      price: "₹250",
        description:
          "A technical project presentation competition where teams (1-3 members) showcase innovative projects in engineering, technology, or innovation.Each team gets 10 minutes to present and 5 minutes for Q&A, with originality being crucial.A Q&A session helps evaluate technical depth and communication skills.The winning team will be awarded with cash prize, and attendance is mandatory for certification.",
        image: Tech21,
        rounds: [
          
          {
            topics: "TOPICS:",
            description: [
              "IoT (Internet of Things)",
              "Al (Artificial Intelligence)",
              "Embedded Systems",
              "E-Vehicle and Autonomous Vehicles",
              "VLSI (Very Large Scale Integration)",
              "3D Printing",
            ],
          },
        ],
        rules: [
          "Each team consist of 1 to 3 members",
          "The team should be available there",
          "Each team will have 10 minutes to present their project",
          "An additional 5 minutes will be allocated for Q&A",
          "All projects be based on engineering, technology, or innovation",
          "Any form of plagiarism or copied work will result in immediate disqualification",
          "The team should have proper project plan with unique solution",
          "The attendance is mandatory for all session to getting certificate",
          "Winner team will be awarded with prize amount",
        ],
        schedule: [
          {
            round: "Event Timing",
            date: "February 13, 2026",
            time: " 9.00 AM to 4.00 PM",
            location: "Electronic Devices Laboratory, J Block 4th Floor",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Mr. D. Poorna Kumar",
              email:"poornakumard@ksrct.ac.in",
              phone: "+91 90036 45614",
            },
            {
              name: "Mrs. C. Saranya ",
              email:"saranyac@ksrct.ac.in",
              phone: "+91 99945 88990",
            }
          ],
          studentCoordinator: [
            {
              name: " Mr. M. Suriya Prasanth",
              email:"",
              phone: " +91 94878 22144",
            },
            {
              name: "Ms. G.S. Harsha Prabha ",
              email:" ",
              phone: "+91 94422 18288",
            },
            {
              name: "Mr. R. Shanmugavel ",
              email:" ",
              phone: " +91 63695 31193",
            },

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },
      "technical-event-22": {
        title: "PAPER PRESENTATION",
        description:
          "Green Innovation in Food Processing Techniques is a platform that celebrates ideas and innovations shaping the future of food. The conference brings together students, researchers, academicians, and industry professionals to explore eco-friendly solutions, safe food practices, and sustainable technologies in food processing. This event encourages creative thinking, knowledge sharing, and meaningful discussions on building a greener, healthier, and more sustainable food system.",
        image: Tech22,
        topics: [
          
          {
            title: "TOPICS:",
            description: [
              "Innovative Food Processing Techniques",
              "Sustainable & Green Food Technologies",
              "Future Foods and Alternative Protein Sources",
              "Food Safety and Fermentation Technologies ",
              "Eco-friendly & Smart Food Packaging",
            
            ],
          },
        ],
        rules: [
           "Individual or team (up to 3 members) participation allowed.",
           "Paper must be original and plagiarism-free.",
            "Abstract (max 250 words) and full paper must be submitted before the deadline.",
            "Abstract Submission Date:7 February",
            "Full Paper Submission Date:10 February",
            "8–10 minutes presentation + Q&A.",
            "udges’ decision is final.",

        ],
        schedule: [
          {
            round: "Event Timing",
            date: "February 13, 2026",
            time: "9.00 AM to 2.00 PM ",
            location: "Smart classroom",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Dr. K.Balasubramani",
              email:"",
              phone: "97892 52952",
            },
          ],
          studentCoordinator: [
            {
              name: "Mr.Rajulapati Yatheeswar",
              email:"",
              phone: "9441236991",
            },
            {
              name: "Mr S.Yogeshwaran ",
              email:" ",
              phone: "7305213626",
            },

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },

      "technical-event-23": {
        title: "PAPER PRESENTATION",
        description:
          "The field of Electronics and Communication Engineering is rapidly evolving with revolutionary trends such as 5G and upcoming 6G communication, Internet of Things (IoT), Artificial Intelligence in communication systems, and advanced embedded technologies. These innovations are transforming the way in high-speed connectivity, smart automation, and intelligent decision-making. Applications like smart cities,autonomous vehicles, healthcare monitoring, industrial automation, and next-generation wireless networks.",
        image: Tech23,
        topics: [
          
          {
            title: "TOPICS:",
            description: [
              "Revolutionary Trends in Electronics and Communication Engineering",
            ],
          },
        ],
        rules: [
          "Individual or team participation (maximum 2 members).",
          "Strict adherence to the allotted time.",
          "Topics must align with the conference theme.",
          "Original work only.",
          "Professional conduct is expected throughout the event.",
          "Judge’s decisions will be final.",
        ],
        schedule: [
          {
            round: "Event Timing",
            date: "February 13, 2026",
            time: "9.00 AM to 2.00 PM",
            location: "Smart Class Room (Main Block)",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Mr. Jayamani S",
              email:"jayamani@ksrct.ac.in",
              phone: "+91 96292 97054",
            },
          ],
          studentCoordinator: [
            {
              name: "Naveen J",
              email:"",
              phone: "+91 90801 21928",
            },
           

          ],
        },
  
        registrationLink: "", // Registration link
      },
      /*"technical-event-16": {
        title: "Code, Click, Done: Mobile AppDevelopment in a day.",
        description:
          "Code, Click, Done is a hands-on mobile app development workshop designed tointroduce participants to the fundamentals of building functional mobile applications in  just one day. This tech event focuses on transforming ideas into real mobile apps through guided coding, interactive demonstrations, and practical exercises.",
        image: Tech16,
        /*rounds: [
          
          {
            title: "TOPICS:",
            description: [
              "Internet of Things",
            ],
          },
        ],
        rules: [
          "The presentation should be within 5-7minutes, followed by a Q&A session of 2-3minutes.",
          "Use PowerPoint (PPT) or any specified tool for the slides.",
          "The number of slides should be 10-15, keeping it clear and concise.",
          "The presentation should have:",
          "Title Slide (Paper title, authors, affiliation)",
          "Introduction (Problem statement, objective)",
          "Methodology (Approach, technologies used)",
          "Results & Discussion (Findings, graphs, tables)",
          "Conclusion & Future Work",
          "References (if required)",
        ],
        schedule: [
          {
            round: "Venue",
            date: "March 28, 2026",
            time: "9:30AM -10:30AM",
            location: "announcing soon",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "RAJASEKARAN N. AP / EEE",
              email:"rajasekaran.n@ksrct.ac.in",
              phone: "8056975723",
            },
          ],
          studentCoordinator: [
            {
              name: "TIVITH C",
              email:"tivithpoongodi@gmail.com",
              phone: "9345426277",
            },
            {
              name: "MOTUPALLI SHEKAR ",
              email:"shekarmotupalli@gmail.com ",
              phone: "8838510411",
            },

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },*/
    // Non-Technical Events

    /*
  nontech-aids :AI MEME CONTEST
  nontech-aids1: IPL AUCTION
  nontech-bt : JUST-A-MINUTE (JAM)
  nontech-civil: CIVIL CIRCUIT
  nontech-csbs: EMOJI PICTIONARY
  nontech-cse: ARANGAM ATHIRA
  nontech-cse1: BATTLE ARENA
  nontech-ece:LINE X
  nontech-ece1: Kahoot Quiz
  nontech-eee: TWISTED TILES
  nontech-eee1: LOGO QUIZ
  nontech-eee2:UNIT WARS
  nontech-ft: UNMASKING BRANDS & FLAVOURS
  nontech-it: TREASURE HUNT
  nontech-mca:FACE PAINTING
  nontech-mct: MIND SPARK
  nontech-mct1: TECH WITHOUT TECH
  nontech-mech:FREEZEFRAME
  nontect-txt: T2T-Trash 2 Textile
  nontech-vlsi: BlindBites: Taste it. Find it
*/

    "non-technical-event-1": {
      title: "AI Meme Contest",
      price: "₹100",
      description:
        "The AI Meme Contest is a fun-filled one-day non-technical event that combines creativity, humor, and artificial intelligence concepts through visually engaging memes. Participants will create original memes based on given AI-related themes using either AI-based tools or manual editing, with a strong focus on originality and ethical content creation. The event encourages innovative thinking and expressive digital creativity in a light-hearted competitive environment. It will be conducted at AB 408, with a registration fee of ₹150, and is open to both individuals and teams.",
      image: NonTech1,
      rounds: [
        {
          title: "",
          description: "",
        },
        {
          title: "",
          description: "",
        },
      ],
      rules: [
        "The meme must be related to the content that are given to you.The meme must be related to the content that are given to you.",
        "Participants may use AI tools or manual design, but the concept must be original.",
        "Each participant/team may submit only one meme.",
        "Memes must be appropriate, ethical, and non-offensive; content that is vulgar, political, or discriminatory will be disqualified.",
        "The meme should be in image format only (JPG/PNG); videos or GIFs are not allowed.",
        "Plagiarized or previously published memes are strictly prohibited.",
        "Judges’ decision will be final, based on creativity, relevance, and humor.",
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 14, 2026",
          time: "10:00 AM to 12:00 PM",
          location: "AB 408",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.S.Raja",
            phone: "7502821440",
            email: " ",
          },
          {
            name: "Mrs.A.Eswari",
            phone: "9443181818",
            email: " ",
          }
        ],
        studentCoordinator: [
          {
            name: "Mr.A.Akash",
            phone: " 6369551324",
            email: " ",
          },
          {
            name: "Mr.D.Gobinath",
            phone: "6382932242",
            email: " ",
          },
          {
            name: "Mr.K.Selvabharathi",
            phone: "8428635597",
            email: " ",
          },
          {
            name: "Mr.Dhilip Shanmugam",
            phone: "9363336136",
            email: " ",
          },
        ],
      },
     
    },
    "non-technical-event-2": {
      title: "IPL AUCTION",
      price: "₹100",
      description:
        "Blind Maze Challenge encourages creative thinking and teamwork to tackle complex challenges in a fun and engaging way.",
      image: NonTech2,
      rounds: [
        {
          title: "Round",
          description: "The IPL Auction is an exciting strategy-based event that simulates the real Indian Premier League player auction experience, where participants act as franchise owners and build a balanced cricket team by analyzing player statistics and bidding within a limited virtual budget. The event emphasizes teamwork, financial planning, and quick decision-making, making it engaging for cricket enthusiasts and strategy lovers alike. It will be conducted for a duration of *3 hours at AB 410, with **free registration* for participants who have registered for any Technical Event, Non-Technical Event, or Workshop.",
        },
        
      ],
      rules: [
        "Teams must consist of exactly 3 members.",
        "Each team will be provided with a fixed virtual budget.",
        "Mobile phones are not allowed during the auction. ",
        "Players once sold cannot be re-auctioned or exchanged.",
        "Teams must adhere to minimum and maximum player category limits.",
        "Any form of unfair practice or misbehavior will lead to immediate disqualification.",
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 14, 2026",
          time: "1:30 PM to 3:00 PM",
          location: " AB 410",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Ms.J.K.Shalini",
            phone: "9894970113",
            email: "dhanpalm@ksrct.ac.in",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr.A.Athityaa",
            email: " ",
            phone: "9345664042",
          },
          {
            name: "Mr.P.Mithun",
            phone: "8122762374",
            email: " ",
          },
          {
            name: "Mr.R.Kowshik",
            phone: "9342556848",
            email: " ",
          },
          {
            name: "Mr.K.Sanjay",
            phone: "7550321307",
            email: " ",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-3": {
      title: "Just-a-Minute (JAM)",
      price: "₹100",
      description:
        "Just-A-Minute (JAM) is a fast-paced speaking event where participants must speak on a given topic for one full minute without hesitation, repetition, or deviation. It tests quick thinking, clarity of thought, confidence, and effective communication skills in a fun and engaging way.",
      image: NonTech3,
      rounds: [
        // {
        //   title: "Round 1 – Guess Similar Words:",
        //   description:
        //     "Image will be shown to the team player they have to identify the represent a word or phrase by correlating the images within 30 seconds",
        // },
        // {
        //   title: "Round 2 – Guess the Movie Name: ",
        //   description:
        //     "Clue images will be given to the team. They have to connect the clue image and identify the movie name correctly within 40 seconds.",
        // },
        // {
        //   title: "Round 3 – Guess the Song:",
        //   description:
        //     "Prepare the challenge your music knowledge here clue images will be shown, providing clues for the popular song. Contestants should identify the song within a minute.",
        // },
        // {
        //   title: "All the Movie names, Songs and Words are tamil.",
        //   description: "",
        // },
      ],
      rules: [
        "Participants will be given a topic and must speak for exactly one minute.",
        "No repetition, deviation, or hesitation is allowed.",
        "Preparation time before speaking will be limited (as per organizers).",
        "Decisions of the judges regarding rule violations or timing are final.",
        "Participants should maintain appropriate language and content.",
      ],
      schedule: [
        {
          round: "Event Timing",
          date: "February 14, 2026",
          time: "1 hour",
          location: " Dr. M S. Swaminathan Biotech Seminar Hall",
        },
        // {
        //   round: "Round 2",
        //   date: "March 29, 2026",
        //   time: "2:00 PM to 4:00 PM",
        //   location: "Art Gallery, Creative Center",
        // },
        // {
        //   round: "Round 3",
        //   date: "March 28, 2026",
        //   time: "2:00 PM to 4:00 PM",
        //   location: "Art Gallery, Creative Center",
        // },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Ms.R.Krishnaveni",
            email: "",
            phone: "",
          },
          
        ],
        studentCoordinator: [
          {
            name: "Ms.A.Lydia Percy",
            email: "",
            phone: "9150436190",
          },
          {
            name: "Ms.V.Aagarshini",
            email: " ",
            phone: "7603959518",
          },
          {
            name: "Ms.D.Laavanya ",
            email: " ",
            phone: "6380696174",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-4": {
  title: "Civil Circuit (Connection)",
      price: "₹100",
  description:
    "Civil Circuit (Connection) is an engaging non-technical event designed to test participants’ speed, logical thinking, and basic technical understanding of civil engineering concepts. Through multiple interactive rounds, participants will identify connections between civil engineering terms, categorize materials and processes, and recognize logos of construction brands and government agencies. The event encourages teamwork, quick thinking, and industry awareness in a competitive yet fun environment.",
  image: NonTech4,
  rounds: [
    {
      title: "Round 1: Quick Link",
      description:
        "Participants must identify the common link between given civil engineering words or images. This round tests speed, observation skills, and basic civil engineering knowledge.",
    },
    {
      title: "Round 2: Build the Connection",
      description:
        "Participants categorize or sequence materials, processes, and structures correctly. This round focuses on logical thinking and technical understanding.",
    },
    {
      title: "Round 3: Logo Find (Finals)",
      description:
        "Participants identify logos of construction brands and government agencies and link them to their respective services. The team with the highest score wins.",
    },
  ],
  rules: [
    "The event consists of three rounds.",
    "Use of mobile phones, smart watches, or any electronic gadgets is strictly prohibited during the event.",
    "Participants must maintain discipline and decorum throughout the event.",
    "Each team must consist of exactly two participants.",
    "A participant is allowed to be part of only one team.",
  ],
  eligibility: [
    "The event is open to all departments and years.",
    "Each team must consist of 2 participants only.",
  ],
  schedule: [
    {
      round: "All Rounds",
      date: "February 14, 2026",
      time: "9.00 AM to 11.00 PM",
      location: "Civil CADD Laboratory",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Dr. M. Velumani",
        phone: "9787978886",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Ms. J. Serlin Maria",
        phone: "7200887993",
        email: " ",
      },
      {
        name: "Ms. A. Gopika",
        phone: "6369819735",
        email: " ",
      },
    ],
  },

      registrationLink: "", // Registration link
    },
    "non-technical-event-5": {
  title: "Emoji Pictionary",
      price: "₹100",
  description:
    "Emoji Pictionary is a fast-paced and entertaining non-technical event where participants decode famous movie titles, book plots, or well-known phrases represented entirely through emoji sequences. This event adds a digital twist to the classic game of Pictionary by replacing drawings with emojis, challenging participants’ creativity, interpretation skills, and quick thinking. Teams race against time to correctly guess the answers based on visual emoji clues, making the event both fun and intellectually stimulating.",
  image: NonTech5,
  rounds: [
    {
      title: "Round 1 – Easy Decode",
      description:
        "Participants solve simple emoji clues that directly represent popular movies or books using literal meanings.",
    },
    {
      title: "Round 2 – Plot Twist",
      description:
        "Emoji strings describe the main storyline or key scenes of movies or books, requiring deeper interpretation.",
    },
    {
      title: "Round 3 – Symbolic Challenge",
      description:
        "Participants face challenging emoji clues that use symbolic or indirect meanings to represent titles or plots.",
    },
  ],
  rules: [
    "Each team may consist of 1 or 2 participants.",
    "Participants must guess the answer within the given time limit of 30 seconds.",
    "The first team to give the correct answer will be awarded the point.",
    "If no team answers correctly, a hint such as actor name, genre, or release year will be provided.",
    "Use of mobile phones or any external assistance is strictly prohibited.",
    "Participants must maintain discipline and fair play throughout the event.",
    "Judges’ decisions will be final and binding.",
  ],
  schedule: [
    {
      round: "Event Timing",
      date: "February 14, 2026",
      time: "2–3 Hours",
      location: "AB 110",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mr. S. Vignesh",
        designation: "Assistant Professor",
        phone: "9944820102",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Akash A",
        department: "Computer Science and Business Systems",
        year: "III Year",
        phone: "9363283385",
        email: " ",
      },
      {
        name: "Guruchandhar D",
        department: "Computer Science and Business Systems",
        year: "III Year",
        phone: "9500446351",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/cgwAsboW12c9pWXFA", // Registration link
    },
    "non-technical-event-7": {
  title: "Arangam Athira",
      price: "₹100",
  description:
    "Arangam Athira is a fun-filled musical entertainment event designed to test participants’ love for music, memory, and spontaneity. Set in a lively DJ atmosphere, the event creates an energetic and engaging environment where rhythm meets challenge. Participants enjoy interactive music sessions focused purely on enjoyment, crowd interaction, and spontaneous performance rather than competition.",
  image: NonTech7,
  rounds: [
    {
      title: "DJ Stop & Sing",
      description:
        "The DJ plays songs and pauses them at random points. Participants must continue singing the lyrics correctly from the exact point where the music stops.",
    },
  ],
  rules: [
    "Participation is open to students from all departments of the institution.",
    "This is an individual participation event; team participation is not allowed.",
    "Participation fee is ₹100 per participant.",
    "Participants must report to the venue at least 15 minutes before their allotted slot for attendance verification.",
    "The event follows a DJ stop–sing-along format with random stoppage points.",
    "Participants must continue the song lyrics correctly from where the music stops.",
    "Song selection, stoppage points, and difficulty level will be decided by the DJ and organizing committee.",
    "Use of mobile phones, lyric sheets, or any external assistance is strictly prohibited during the performance.",
    "This event is conducted purely for fun and entertainment; no prizes, rankings, or certificates will be awarded.",
    "Any form of misbehavior or misconduct will result in immediate disqualification.",
    "Participants must carry a valid college identity card and produce it upon request.",
    "Participants are responsible for the safety of their personal belongings.",
    "The decision of the organizing committee shall be final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "To be announced",
      location: "Quadrangle Triangle, Main Building",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Dr. K. Senthilvadivu",
        department: "Mathematics",
        phone: "9865024343",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Tharneish K",
        department: "Computer Science and Engineering",
        year: "III Year",
        phone: "9514211199",
        email: " ",
      },
    ],
  },

     
    },
    "non-technical-event-6": {
  title: "Battle Arena",
      price: "₹100",
  description:
    "Battle Arena is a high-intensity eSports competition designed to bring together skilled gamers in a professional and competitive environment. Participants compete in popular gaming titles such as EA Sports FC and Free Fire, showcasing precision, strategy, reflexes, and real-time decision-making. The event follows a structured knockout tournament format to identify and crown the ultimate champions of the arena.",
  image: NonTech6,
  rounds: [
    {
      title: "Tournament Battles",
      description:
        "Participants compete in knockout-style matches across selected eSports titles. Winners advance through successive rounds until the final champion is determined.",
    },
  ],
  rules: [
    "Participation is open to students from all departments of the institution.",
    "This is an individual participation event; team participation is not allowed.",
    "The competition will be conducted in a knockout tournament format.",
    "Matches will be held in EA Sports FC (FIFA) and Free Fire as decided by the organizers.",
    "Participants must strictly adhere to fair-play rules; any form of cheating or exploitation will result in disqualification.",
    "Match schedules and game settings will be decided by the organizing committee.",
    "Use of unauthorized devices, hacks, or any external assistance is strictly prohibited.",
    "Participants must report to the venue on time as per their allotted slot.",
    "Participants must carry a valid college identity card and produce it upon request.",
    "The decision of the organizers and referees shall be final and binding.",
  ],
  schedule: [
    {
      round: "Tournament Matches",
      date: "February 14, 2026",
      time: "To be announced",
      location: "IT Park",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Dr. A. Gnanabaskaran",
        department: "Computer Science and Engineering",
        phone: "9865024343",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Shanmugeshwara A",
        department: "Computer Science and Engineering",
        year: "III Year",
        phone: "9487119381",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-8": {
  title: "LineX",
      price: "₹100",
  description:
    "LineX is a robotics-based non-technical event where participants compete head-to-head by controlling robots using a remote control. The robots must navigate through a predefined track filled with multiple obstacles. The participant who completes the track in the shortest time is declared the winner. This event focuses on testing speed, precision, control skills, and the ability to handle robots effectively under competitive conditions.",
  image: NonTech8,
  rounds: [
    {
      title: "Obstacle Track Challenge",
      description:
        "Participants control their robots through a predefined obstacle track. Performance is evaluated based on time, accuracy, and obstacle handling.",
    },
  ],
  rules: [
    "Participants compete in a head-to-head format.",
    "Robots must strictly follow the given track and pass through all obstacles.",
    "If a robot goes off the track, it must be repositioned at the last checkpoint.",
    "Damaging the track or any obstacles will lead to immediate disqualification.",
    "Winners are judged based on completion time, accuracy, and obstacle handling.",
    "Participants must follow the instructions given by the organizers at all times.",
    "The decision of the judges and organizing committee shall be final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "2:30 PM to 4:30 PM",
      location: "Quadrangle Triangle, Main Building",
    },
  ],
  
  contact: {
    facultyCoordinator: [
      {
        name: "Mrs. U. Shayamaldevi",
        department: "Electronics and Communication Engineering",
        phone: "9566356428",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Muthuraj S",
        department: "Electronics and Communication Engineering",
        year: "II Year",
        phone: "6380275179",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/cgwAsboW12c9pWXFA", // Registration link
    },
    "non-technical-event-9": {
  title: "Kahoot! Quiz",
      price: "₹100",
  description:
    "The Kahoot! Quiz Challenge is an exciting and interactive quiz event designed to test participants’ knowledge, speed, and teamwork. Using the Kahoot platform, participants answer multiple-choice questions in real time through their smartphones. The quiz includes a mix of technical topics, general knowledge, and fun questions, making it both competitive and engaging. Accuracy and quick thinking are the key factors for success.",
  image: NonTech9,
  rounds: [
    {
      title: "Live Kahoot Quiz",
      description:
        "Participants answer real-time multiple-choice questions on the Kahoot platform within a limited time. Scores are calculated based on accuracy and response speed.",
    },
  ],
  rules: [
    "The quiz will be conducted using the Kahoot mobile app or website.",
    "Each team must have at least one smartphone with an active internet connection.",
    "The quiz consists of multiple-choice questions that must be answered within the given time limit.",
    "Participants must follow the instructions provided by the quiz host throughout the event.",
    "Winners will be decided based on the final Kahoot leaderboard.",
    "The decision of the organizers shall be final and binding.",
  ],
  schedule: [
    {
      round: "Quiz Session",
      date: "February 14, 2026",
      time: "2:30 PM to 4:30 PM",
      location: "Smart Classroom, Main Block",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mrs. Padmavathi D",
        department: "Electronics and Communication Engineering",
        phone: "9942868893",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Saran G D",
        department: "Electronics and Communication Engineering",
        year: "III Year",
        phone: "9489178522",
        email: " ",
      },
    ],
  },


      registrationLink: "https://forms.gle/F7ToBuAQk8jMRJe5A", // Registration link
    },

    "non-technical-event-10": {
  title: "Twisted Tiles",
      price: "₹100",
  description:
    "Twisted Tiles is a puzzle-based non-technical event designed to challenge participants’ logical thinking and problem-solving abilities. Participants must analyze patterns, think critically, and solve puzzles within a limited time, making it an engaging test of focus, reasoning, and mental agility.",
  image: NonTech10,
  rounds: [
    {
      title: "Puzzle Challenge",
      description:
        "Participants solve a series of logical and tile-based puzzles within the given time limit. Accuracy and completion within time are key to success.",
    },
  ],
  rules: [
    "This is an individual participation event.",
    "No external help or assistance is allowed during the event.",
    "Participants must strictly adhere to the given time limit.",
    "Participants must maintain discipline throughout the event.",
    "The decision of the organizers shall be final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "2 Hours",
      location: "EE301",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mr. A. Thangadurai",
        designation: "Assistant Professor",
        department: "Electrical and Electronics Engineering",
        phone: "",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. Harishwaran R",
        department: "Electrical and Electronics Engineering",
        year: "III Year",
        phone: "9360002523",
        email: " ",
      },
      {
        name: "Mr. Sri Dharan B",
        department: "Electrical and Electronics Engineering",
        year: "II Year",
        phone: "8438986010",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/F7ToBuAQk8jMRJe5A", // Registration link
    },
    "non-technical-event-11": {
  title: "Logo Quiz",
      price: "₹100",
  description:
    "Logo Quiz is a non-technical event that tests participants’ ability to identify logos related to brands, technology companies, and general knowledge. The event challenges visual recognition, memory, and quick recall skills in a fun and engaging quiz-based format.",
  image: NonTech11,
  rounds: [
    {
      title: "Logo Identification Round",
      description:
        "Participants are shown a series of logos and must identify them correctly by writing or speaking the answers as instructed.",
    },
  ],
  rules: [
    "This is an individual participation event.",
    "Use of mobile phones or any electronic devices is strictly prohibited.",
    "Answers must be written or spoken as instructed by the organizers.",
    "Participants must maintain discipline throughout the event.",
    "The decision of the organizers and judges shall be final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "2 Hours",
      location: "EE302",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mr. M. Dhanapal",
        designation: "Assistant Professor",
        department: "Electrical and Electronics Engineering",
        phone: "",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. Aadithya N",
        department: "Electrical and Electronics Engineering",
        year: "III Year",
        phone: "6384363866",
        email: " ",
      },
      {
        name: "Ms. Nirmala D V",
        department: "Electrical and Electronics Engineering",
        year: "II Year",
        phone: "8248282714",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-12": {
  title: "Unit Wars",
      price: "₹100",
  description:
    "Unit Wars is an educational quiz-based non-technical event focusing on fundamental and derived SI units used in science and engineering. The event challenges participants’ conceptual understanding, memory, and speed, making it both informative and competitive.",
  image: NonTech12,
  rounds: [
    {
      title: "SI Units Challenge",
      description:
        "Participants answer questions related to fundamental and derived SI units within a limited time. Accuracy and speed determine performance.",
    },
  ],
  rules: [
    "This is an individual participation event.",
    "Use of calculators, reference materials, or any external aids is strictly prohibited.",
    "A time limit will be applied for each round.",
    "Participants must follow all instructions given by the organizers.",
    "The decision of the organizers and judges shall be final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "2 Hours",
      location: "EE303",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Ms. N. Kayalvizhi",
        designation: "Assistant Professor",
        department: "Electrical and Electronics Engineering",
        phone: "",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. Surendhar S",
        department: "Electrical and Electronics Engineering",
        year: "III Year",
        phone: "7904015088",
        email: " ",
      },
      {
        name: "Ms. Mahitha P",
        department: "Electrical and Electronics Engineering",
        year: "II Year",
        phone: "8122108363",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-13": {
  title: "Unmasking Brands & Flavours",
      price: "₹100",
  description:
    "Unmasking Brands & Flavours is an interactive non-technical event that challenges participants’ knowledge of corporate branding and food recognition. Through a fun, three-level game format, the event tests awareness, teamwork, and quick thinking by combining logo identification, performance-based guessing, and culinary knowledge in an engaging and competitive environment.",
  image: NonTech13,
  rounds: [
    {
      title: "Level 1: Logo Guessing Challenge",
      description:
        "Teams are shown blurred or partial logos of food brands and must identify them correctly. Teams with the highest scores advance to the next level.",
    },
    {
      title: "Level 2: Food Dumb Charades",
      description:
        "One team member enacts a food-related word or brand without speaking, while the other member guesses within the given time limit.",
    },
    {
      title: "Level 3: Guess the Ingredient",
      description:
        "Teams are presented with a mystery dish or product and must identify its key ingredients within a limited time. The team with the most correct identifications wins.",
    },
  ],
  rules: [
    "The event is open to students from all disciplines.",
    "Each team must consist of exactly two participants.",
    "Use of mobile phones or any external assistance is strictly prohibited.",
    "Teams must answer within the time limit specified for each round.",
    "Use of unfair means such as internet searches or external hints will lead to disqualification.",
    "Any form of disrespect towards fellow participants or judges will result in disqualification.",
    "Failure to adhere to time limits may lead to disqualification.",
    "Judges’ decisions shall be final and binding.",
  ],
  schedule: [
    {
      round: "All Levels",
      date: "February 14, 2026",
      time: "To be announced",
      location: "To be announced",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mr. T. G. N. Nagarjun",
        department: "",
        phone: "8754394242",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. K. Hariprasath",
        department: "Food Technology",
        year: "III Year",
        phone: "9080753031",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-14": {
  title: "Treasure Hunt",
      price: "₹100",
  description:
    "Treasure Hunt is an exciting team-based non-technical event that challenges participants to think creatively, solve clues, and work together under time pressure. Teams navigate through multiple checkpoints by cracking riddles, puzzles, physical tasks, and observation-based challenges spread across the campus. The first team to successfully complete all challenges and uncover the final treasure is declared the winner.",
  image: NonTech14,
  rounds: [
    {
      title: "Clue Trail Challenge",
      description:
        "Teams solve a series of clues and tasks to move from one checkpoint to another. Each solved clue leads to the next location, and teams must follow the correct sequence to reach the final treasure.",
    },
  ],
  rules: [
    "Each team must consist of exactly three members.",
    "Team members cannot be changed once the event starts.",
    "All team members must be present throughout the event.",
    "Teams must solve clues in the correct order and must not skip any checkpoint.",
    "Clues may include riddles, puzzles, physical tasks, and observation challenges.",
    "The event will be conducted within a fixed time limit.",
    "In case of a tie, fewer hints used, shorter completion time, and fair play behavior will be considered.",
    "Participants must follow all instructions given by the coordinators.",
    "Any form of misbehavior, cheating, or unfair means will result in disqualification.",
    "The decision of the organizers shall be final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "1 Hour",
      location: "KSRCT IT Park",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mr. M. Thilakraj",
        phone: "+91 98428 15665",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. M. Pravin Kumar",
        phone: "8667474397",
        email: " ",
      },
      {
        name: "Ms. Linesha",
        phone: "9944623923",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
   "non-technical-event-15": {
  title: "Face Painting",
      price: "₹100",
  description:
    "Face Painting is a fun, creative, and engaging non-technical event that brings out the artistic talents of participants. This event offers a platform for students to express their imagination through colors, designs, and meaningful themes painted on faces. Participants can showcase styles such as cartoons, abstract art, nature-inspired patterns, cultural motifs, and message-driven creativity.",
  image: NonTech15,
  /*rounds: [
    {
      title: "Creative Expression Round",
      description:
        "Participants create face painting designs based on given themes such as nature, creativity and fantasy, or social awareness. Designs should creatively convey a message through art.",
    },
  ],*/
  rules: [
    "Participants must bring their own materials including paints, brushes, sponges, mirrors, and tissues.",
    "Only skin-safe and non-toxic paints must be used.",
    "Designs must be decent, appropriate, and strictly follow the given themes.",
    "The face painting must be completed within the given time limit.",
    "Participants must maintain discipline and cleanliness throughout the event.",
    "Judges’ decisions shall be final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "1 Hour",
      location: "KSRCT F Block",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mr. MohanKumar R",
        department: "Master of Computer Applications",
        phone: "9790070708",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "SriNaveen R",
        department: "Master of Computer Applications",
        year: "I Year",
        phone: "9606422181",
        email: " ",
      },
      {
        name: "Vikas M S",
        department: "Master of Computer Applications",
        year: "I Year",
        phone: "6380088208",
        email: " ",
      },
      {
        name: "Madhumitha Devi Sri K",
        department: "Master of Computer Applications",
        year: "I Year",
        phone: "7812837347",
        email: " ",
      },
      {
        name: "Suvetha S",
        department: "Master of Computer Applications",
        year: "I Year",
        phone: "8807737000",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-16": {
  title: "Mind Spark",
      price: "₹100",
  description:
    "Mind Spark Arena is a three-round knowledge-based non-technical event designed to test participants’ intelligence, observation skills, and brand awareness. Teams compete through a general quiz, a visual picture connection round, and a logo & brand tagline identification challenge. Participants must think fast, connect ideas smartly, and demonstrate their mental agility to win.",
  image: NonTech16,
  rounds: [
    {
      title: "Round 1: General Quiz",
      description:
        "Teams answer objective or short-answer questions. Each question carries equal marks unless specified. Top-scoring teams qualify for the next round. Tie-breakers are conducted in case of equal scores.",
    },
    {
      title: "Round 2: Picture Connection",
      description:
        "Teams are shown a set of images and must identify the correct connection or concept within the allotted time. Points are awarded based on accuracy and response speed. Selected teams advance to the final round.",
    },
    {
      title: "Round 3: Logo & Brand Tagline Challenge",
      description:
        "Teams identify logos and their corresponding brands. For tagline questions, partial answers may carry partial marks if applicable. No hints are provided in this round. The team with the highest cumulative score wins.",
    },
  ],
  rules: [
    "The event consists of three rounds.",
    "Use of mobile phones, smart watches, or any electronic gadgets is strictly prohibited.",
    "Participants must maintain discipline and decorum throughout the game.",
    "Teams must register before the event starts. On-spot registrations are allowed subject to availability.",
    "Once registered, team members cannot be changed.",
    "The event is open to all departments and years.",
    "Each team must consist of exactly 2 participants.",
    "A participant can be part of only one team.",
    "Judges’ decisions are final and binding.",
  ],
  schedule: [
    {
      round: "Event Timing",
      date: "February 14, 2026",
      time: "10:30 AM to 12.30PM",
      location: "Hall No: MC 306",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mrs. V. Indumathi",
        department: "",
        phone: "9965137001",
        email: "indhumathi@ksrct.ac.in",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. P. Sridhar",
        department: "",
        year: "",
        phone: "9677996590",
        email: "sridharpalanisamy222@gmail.com ",
      },
      {
        name: "Mr. Bharath",
        department: "",
        year: "",
        phone: "8012355633",
        email: "kumarbharath236@gmail.com ",
      },
    ],
  },

      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-17": {
  title: "Tech Without Tech",
      price: "₹100",
  description:
    "Tech Without Tech is a non-technical team event where participants are given a common technology or everyday system and must explain how it works without using any technical terms. Using simple language, real-life examples, gestures, or storytelling, participants make complex concepts understandable to a non-technical audience. The event tests creativity, communication skills, and the ability to simplify ideas effectively.",
  image: NonTech17,
  rounds: [
    {
      title: "Explanation Challenge",
      description:
        "Organizers display a picture of a system or gadget. One team member explains its working within a limited time using non-technical language, examples, and gestures. Creativity, clarity, and effectiveness of explanation are evaluated.",
    },
  ],
  rules: [
    "This is a team event.",
    "Technical terms are strictly not allowed.",
    "Mobile phones or external assistance are strictly prohibited during the event.",
    "Only one team member may explain the answer.",
    "Participants must maintain discipline throughout the event.",
    "Judges’ decisions are final and binding.",
  ],
  schedule: [
    {
      round: "Event Timing",
      date: "February 14, 2026",
      time: "10:00 AM to 12.30PM",
      location: "Robotics Laboratory",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Dr. M. Sasikumar",
        department: "",
        phone: "9965167895",
        email: "sasikumarm@ksrct.ac.in ",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. K. M. Dharaneesh",
        department: "",
        year: "",
        phone: "9943452438",
        email: " ",
      },
      {
        name: "Mr. T. Bhuvanesh",
        department: "",
        year: "",
        phone: "6369436709",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-18": {
  title: "Freezeframe",
      price: "₹100",
  description:
    "Freezeframe is a creative photography contest focused on visual storytelling and awareness. Participants capture meaningful moments within the college campus without any editing or filters. The event promotes observational skills, creativity, and the ability to convey a message through a single photograph.",
  image: NonTech18,
  rounds: [
    {
      title: "Photography Challenge",
      description:
        "Participants take one natural photograph within the campus that expresses a meaningful concept or awareness theme. Additional points are awarded based on social media engagement using the hashtag #ksrct1994.",
    },
  ],
  rules: [
    "This is an individual participation event.",
    "Only one photograph per participant is allowed, submitted without any edits or filters.",
    "Images must be captured within the college campus.",
    "Photographs should express a meaningful message or awareness theme.",
    "Participants can post their photo on social media using the hashtag #ksrct1994. Extra points will be awarded for likes received.",
    "Participants must maintain discipline and follow instructions from the organizers.",
    "Judges’ decisions are final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "1 Hour",
      location: "KSRCT Campus",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mr. P. Prakash",
        designation: "Assistant Professor",
        department: "",
        phone: "",
        email: " ",
      },
      {
        name: "Mr. S. Karthick",
        designation: "Assistant Professor",
        department: "",
        phone: "",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. M. Rajkumar",
        department: "Mechanical Engineering",
        year: "III Year",
        phone: "9894745652",
        email: " ",
      },
      {
        name: "Ms. D. Vijayalakshimi",
        department: "Mechanical Engineering",
        year: "III Year",
        phone: "+91 99947 47296",
        email: " ",
      },
      {
        name: "Mr. S. Mohanraj",
        department: "Mechanical Engineering",
        year: "III Year",
        phone: "",
        email: " ",
      },
    ],
  },

      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-19": {
  title: "T2T – Trash 2 Textile",
      price: "₹100",
  description:
    "T2T – Trash 2 Textile is a creative non-technical event that focuses on transforming textile waste into innovative and useful products. Participants explore techniques for recycling, upcycling, and repurposing discarded fabrics, old garments, and textile scraps. The event encourages sustainability, hands-on creativity, and understanding how to turn waste into value in an eco-friendly manner.",
  image: NonTech19,
  rounds: [
    {
      title: "Creative Recycling Challenge",
      description:
        "Participants individually or in teams of two create unique products from textile waste materials provided or brought by them. Judging is based on creativity, sustainability, effective use of materials, and overall presentation within the allotted time.",
    },
  ],
  rules: [
    "The event is open to students of all disciplines.",
    "Participants may register individually or in teams of 2 members.",
    "Participants may bring their own textile waste materials such as fabric scraps, old garments, and trims.",
    "All creations must be original and made during the event; pre-made items are not allowed.",
    "The transformation activity must be completed within the allotted time.",
    "Judging is based on creativity, effective use of materials, sustainability, and presentation.",
    "Participants must maintain discipline and follow instructions given by the coordinators.",
    "Judges’ and organizing committee decisions are final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "1 Hour",
      location: "Wet Processing Lab – Textile Department",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Dr. M. B. Sampath",
        designation: "Professor",
        department: "Textile Technology",
        phone: "",
        email: " ",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. Arthanareshwaran P",
        department: "Textile Technology",
        year: "III Year",
        phone: "7604832897",
        email: " ",
      },
      {
        name: "Ms. Abirami S",
        department: "Textile Technology",
        year: "II Year",
        phone: "8610658433",
        email: " ",
      },
    ],
  },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },

    "non-technical-event-20": {
  title: "BlindBites: Taste It. Find It.",
  description:
    "BlindBites is a fun and interactive team-based non-technical event where participants work in pairs to identify mystery food items. One member tastes the food while the other listens to hints and guesses the item. The event tests teamwork, communication, and sensory observation. The winning team is determined by the least time taken to correctly identify all items.",
  image: NonTech20,
  rounds: [
    {
      title: "Blind Taste Challenge",
      description:
        "Teams of two stand back-to-back with the tasting member blindfolded. The tasting member gives verbal hints without naming the item, and the other member must identify the food item correctly within the given time. Points are awarded based on accuracy and speed.",
    },
  ],
  rules: [
    "Each team must consist of exactly two members.",
    "Team members must remain back-to-back and blindfolded throughout the game.",
    "Only the tasting member is allowed to taste the food item.",
    "Hints must be given verbally; directly saying the food name is not allowed.",
    "Use of offensive or inappropriate content is strictly prohibited.",
    "The time starts when the first item is given and stops after the last correct answer.",
    "Participants must maintain discipline and follow all instructions from the organizers.",
    "Judges’ decisions are final and binding.",
  ],
  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "9.00 AM to 01.00 PM",
      location: "Electronic Devices Laboratory, J Block 4th Floor",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Dr. S. Pradeep",
        designation: "Assistant Professor",
        department: "",
        phone: " +91 81221 39862",
        email: "pradeeps@ksrct.ac.in",
      },
      {
        name: "Dr. N. Lalithamani",
        designation: "Professor",
        department: "",
        phone: " +91 89255 68867",
        email: "lathithamani@ksrct.ac.in ",
      },
    ],
    studentCoordinator: [
      {
        name: "Mr. S. Hardeep",
        department: "Electronics Engineering (VLSIDT)",
        year: "II Year",
        phone: "+91 99760 48999",
        email: " ",
      },
      {
        name: "Ms. P. Dhivyadharshini",
        department: "Electronics Engineering (VLSIDT)",
        year: "II Year",
        phone: "+91 84892 53710",
        email: " ",
      },
      {
        name: "Ms. G. Jeevaranjani",
        department: "Electronics Engineering (VLSIDT)",
        year: "I Year",
        phone: "+91 82702 02728",
        email: " ",
      },
    ],
  },

      registrationLink: "", // Registration link
    },


    "non-technical-event-21": {
  title: "POWERHOUSE CHAMPION TROPHY(TURF CRICKET)",
      price: "₹750 per team",
  description:
    "Powerhouse Champion Trophy is a fast-paced cricket tournament focused on skill, discipline, and team strength. With strict rules and limited overs, it promises intense competition and fair play",
  image: NonTech21,
  rounds: [
    {
      title: "Round 1",
      description:
        "Teams will be divided into three groups and ranked based on points and net run rate.",
    },
    {
      title: "Round 2",
      description:"The top three teams and one committee team will qualify for the Semi-Finals.",
    },
    {
      title: "Round 3",
      description:"Winners of the Semi-Finals will compete in the Final match.",
    },
  ],


  rewards: [
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹3,000",
        },
        {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹5,000",
        },
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹1,500",
        },
      ],
  rules: [
  "Each team must consist of 7 players, with 2 additional substitute players.",
  "Each match will be 5 overs per innings.",
  "A bowler is allowed to bowl a maximum of 2 overs.",
  "Boundaries and sixes are valid only on the front side; shots to other sides will count only as running runs.",
  "Only standing bowling is permitted; any other action will be considered a No Ball.",
  "Any delivery bowled above 80 kmph will be considered a No Ball, followed by a Free Hit.",
  "A batsman can be dismissed only by bowled, caught, or run out.",
  "In the event of a tie, a Super Over will be played to decide the winner.",
  "Teams must report at least 10 minutes before the scheduled match time, and carrying a valid College ID card is mandatory.",
  "A player is allowed to represent only one team throughout the tournament.",
  "Use of profanity, consumption of alcohol, or participation under the influence of alcohol is strictly prohibited on the field.",
  "Umpire and organizer decisions are final and binding."
],

  schedule: [
    {
      round: "Event Session",
      date: "February 14, 2026",
      time: "9.00 AM to 01.00 PM",
      location: "KSRCT Hostel Turf",
    },
  ],
  contact: {
    facultyCoordinator: [
      {
        name: "Mr. K. Karthikeyan",
       
        phone: " +91 9952475246",
        email: "",
      },
     
    ],
    studentCoordinator: [
      {
        name: "S. Kishorekumar",
       
        phone: "+91 9344276110",
        email: " ",
      },
      {
        name: "C. Yogeshwaran",
       
        phone: "+91 8610388095",
        email: " ",
      },
     
    ],
    
  },

      registrationLink: "", // Registration link
    },
  };
}