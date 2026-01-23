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
import NonTech10 from "../../../assets/EventsImages/EventDetails/Nontech/eee_nontech.png";
import NonTech11 from "../../../assets/EventsImages/EventDetails/Nontech/eee_nontech1.png";
import NonTech12 from "../../../assets/EventsImages/EventDetails/Nontech/eee_nontech2.png";
import NonTech13 from "../../../assets/EventsImages/EventDetails/Nontech/ft_nontech.png";
import NonTech14 from "../../../assets/EventsImages/EventDetails/Nontech/it_nontech.png";
import NonTech15 from "../../../assets/EventsImages/EventDetails/Nontech/mca_nontech.png";
import NonTech16 from "../../../assets/EventsImages/EventDetails/Nontech/mct_nontech.png";
import NonTech17 from "../../../assets/EventsImages/EventDetails/Nontech/mct_nontech1.png";
import NonTech18 from "../../../assets/EventsImages/EventDetails/Nontech/mech_nontech.png";
import NonTech19 from "../../../assets/EventsImages/EventDetails/Nontech/txt_nontech.png";
import NonTech20 from "../../../assets/EventsImages/EventDetails/Nontech/vlsi_nontech.png";



import workshop1 from "../../../assets/EventsImages/EventDetails/Workshop/aids_wk.png";
import workshop2 from "../../../assets/EventsImages/EventDetails/Workshop/aiml_wk.png";
import workshop3 from "../../../assets/EventsImages/EventDetails/Workshop/bt_wk.png";
import workshop4 from "../../../assets/EventsImages/EventDetails/Workshop/civil_wk.png";
import workshop5 from "../../../assets/EventsImages/EventDetails/Workshop/csbs_wk.png";
import workshop6 from "../../../assets/EventsImages/EventDetails/Workshop/cse_wk.png";
import workshop7 from "../../../assets/EventsImages/EventDetails/Workshop/ece_wk.png";
import workshop8 from "../../../assets/EventsImages/EventDetails/Workshop/eee_wk.png";
import workshop9 from "../../../assets/EventsImages/EventDetails/Workshop/ft_wk.png";
import workshop10 from "../../../assets/EventsImages/EventDetails/Workshop/ipr_wk.png";
import workshop11 from "../../../assets/EventsImages/EventDetails/Workshop/it_wk.png";
import workshop12 from "../../../assets/EventsImages/EventDetails/Workshop/mct_wk.png";
import workshop13 from "../../../assets/EventsImages/EventDetails/Workshop/mech_wk.png";
import workshop14 from "../../../assets/EventsImages/EventDetails/Workshop/txt_wk.png";
import workshop15 from "../../../assets/EventsImages/EventDetails/Workshop/vlsi_wk.png";
//import workshop16 from "../../../assets/EventsImages/EventDetails/Workshop/mca_wk1.png";




import Culturals1 from "../../../assets/HORMONICS/hr1.png";
import Culturals2 from "../../../assets/HORMONICS/hr2.png";
import Culturals3 from "../../../assets/HORMONICS/hr3.png";
import Culturals4 from "../../../assets/HORMONICS/hr4.png";
import Culturals5 from "../../../assets/HORMONICS/hr5.png";





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
'nontect-txt': 'non-technical-event-19',
'nontech-vlsi': 'non-technical-event-20',


    // Cultural Events
    
      'cultural-1': 'culturals-event-1',
      'cultural-2': 'culturals-event-2',
      'cultural-3': 'culturals-event-3',
      'cultural-4': 'culturals-event-4',
      'cultural-5': 'culturals-event-5',

      /*
      

      */
    


    // Hackathon Events - Maps to Neura Hack
    'hackathon': 'technical-event-2',


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
    //'workshop-mca': 'workshop-16',

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
  const getEventPrice = () => {
    const dbId = databaseEventId;
    for (const category of Object.values(EVENTS_DATA)) {
      const event = category.find(e => e.id === dbId);
      if (event) return event.price;
    }
    return null;
  };

  // Handle registration click
  const handleRegisterClick = () => {
    if (!user) {
      // Not logged in - redirect to login with return URL
      navigate('/login', { state: { returnTo: `/event/${rawEventId}` } });
      return;
    }
    // Logged in - redirect to registration page with event pre-selected
    navigate('/register-events', { state: { selectedEventId: databaseEventId } });
  };

  const eventDetails = {
    // Technical Events
    "technical-event-1": {
      title: "AI Mystery Box Challenge",
      description:
        "The AI Mystery Box Challenge is a one-day technical event designed to test participants’ analytical thinking, creativity, and practical skills in Artificial Intelligence and Machine Learning. This event offers a unique, problem-solving experience where teams are challenged with an unknown AI task revealed only at the start of the competition. Participants will receive a mystery box containing a real-world dataset and a problem statement. Once the box is opened upon official announcement, teams must quickly analyze the problem, design an appropriate machine learning solution, and develop a working model within the given time. To enhance practical applicability, teams are also required to integrate their model with a functional web interface, simulating industry-level AI deployment.The event encourages collaborative teamwork, effective time management, and hands- on implementation of AI concepts such as data preprocessing, model selection, training, evaluation, and deployment. With internet access permitted, participants can explore libraries, frameworks, and documentation to refine their solutions.The AI Mystery Box Challenge will be conducted at AI Lab 2 with a registration fee of ₹250 per head. This event is ideal for students who are passionate about AI, Data Science, and real-time problem solving, and who wish to showcase their technical expertise in a competitive environment.",
      image: Tech1,
      rounds: [
        {
          title: "",
          description: [
            "",
            
          ],
        },
        
      ],
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
          round: "Round",
          date: "February 13, 2026",
          time: "1 day",
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
            Phone: "8124225197",
            email: "",
          },
          {
            name: "Ms. M.Raufama",
            phone: "9345064140",
            email: "",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
    },
    "technical-event-2": {
      title: "System Sense – Usability & Analysis Challenge",
      description:
        "System Sense is a technical challenge designed to evaluate heuristic principles, identify design and interaction issues, and propose effective improvements within a limited time. Where participants assess systems based on established usability guidelines such as clarity, consistency, feedback, and user control. By applying these principles, participants develop practical solutions that enhance both user experience and business efficiency.",
      image: Tech2,
      rounds: [
        {
          title: "Round 1 – System Analysis Round",
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
          title: "Additional Features",
          description: [
            "Participants are encouraged to apply heuristic principles and system-thinking approaches to arrive at effective solutions.",
          ],
        },
        {
          title: "Plagiarism and Fair Conduct",
          description: [
            "All analyses and solutions must be original and developed during the event.",
            "Copying, sharing answers, or using unfair means in any form is strictly prohibited.",
            "Any instance of malpractice or violation of rules will result in immediate disqualification.",
            "The decision of the judges will be final and binding in all matters related to evaluation and conduct.",
          ],
        },
      ],
      rules: [
        "The competition consists of two rounds, conducted within a total duration of 2–3 hours.",
        "Participants may compete individually or in teams of two.",
        "Participants must analyze given system scenarios and identify usability or design issues using heuristic principles.",
        "Solutions should emphasize system understanding, logical reasoning, and practical improvements, rather than coding.",
        "Each participant or team must justify their proposed solution within the specified time limit as announced by the organizers.",
      ],
      schedule: [
        {
          round: "Round",
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
      registrationLink: "https://forms.gle/rdVwYuEvx9Bpi5zk9", // Registration link
    },

    "technical-event-3": {
      title: " VibeCode’26 (Vibe coding partnered with Lovable.AI) ",
      description:
        " “Launch Something Lovable” in 24 Hours is a high-energy, in-person vibe coding hackathon where teams build and ship real MVPs using Lovable, focusing on product thinking, usability, and real-world impact.",
      image: Tech3,
      rounds: [
        {
          title: "",
          description: [
            ""
          ],
        },
        {
          title: "",
          description:
            "",
        },

      ],
      rules: [
        "Only registered participants are permitted to attend the workshop.",
        "Participants must bring their own laptop with internet access.",
        "Full-day attendance and punctuality are mandatory.",
        "All participants must follow the instructions of the Lovable.AI team and organizers.",
      ],
      schedule: [
        {
          round: "Round",
          date: "February 13, 2026",
          time: "1Day",
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

      registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
    },

    "technical-event-4": {
      title: "Reel-O-Science",
      description:
        "Short technical video presentation event Students showcase innovative engineering ideas Focus on clarity, creativity, and technical understanding  Judged through content quality and explanation skills   ",
      image: Tech4,
      rounds: [
        {
          title: " ",
          description: "",
        },
      ],
      rules: [
        "Video must be short and within the specified time limit.",
        "Content should be original and based on an engineering or technical concept.",
        "Explanation must be clear, relevant, and technically accurate.",
        "Plagiarism or inappropriate content will lead to disqualification.",
        "Judges’ decision will be final and binding.",  
      ],
      schedule: [
        {
          round: "Round",
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
            phone: "",
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
      title: "aa",
      description:
        "Bioblitz-Map is an exciting treasure hunt event that challenges participants to use logic, observation, and problem-solving skills. Teams navigate through mapped clues and tasks, decoding hints to reach the final destination.The event promotes teamwork, strategic thinking, and quick decision-making in a fun and competitive environment.",
      image: Tech5,
      rounds: [
        {
          title: " ",
          description: "",
        },
      ],
      rules: [
        "Participants must follow the given map and clues strictly.",
      ],
      schedule: [
        {
          round: "Round",
          date: "February 13, 2026",
          time: "3hours ",
          location: "Location need",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mrs. V. Indumathi",
            email: "indumathi@ksrct.ac.in",
            phone: "9965137001",
          },
        ],
        studentCoordinator: [
          {
            name: "Gokkarneashvarnath V",
            email: "gokkarmct@gmail.com ",
            phone: "9444177711",
          },
          {
            name: "Gokul V",
            email: "gokulv992004@gmail.com",
            phone: "6382116360",
          },
        ],
      },

      registrationLink: "https://forms.gle/gziLh4EoGaCQLSpg8", // Registration link
    },
    "technical-event-6": {
      title: "Bioblitz- Map (Bio Treasure Hunt)",
      description:
        "Bioblitz-Map is an exciting treasure hunt event that challenges participants to use logic, observation, and problem-solving skills. Teams navigate through mapped clues and tasks, decoding hints to reach the final destination.The event promotes teamwork, strategic thinking, and quick decision-making in a fun and competitive environment.",
      image: Tech6,
      rounds: [
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
        "Participants must follow the given map and clues strictly.",
        "Teams should not damage property or disturb others during the hunt.",
        "Use of unfair means or external help is strictly prohibited.",
        "All tasks must be completed within the allotted time.",
        "The organizers’ and judges’ decisions will be final and binding.",
      ],
      schedule: [
        {
          round : "Round ",
          date: "February 13, 2026",
          time: " 3hours ",
          location: "Protein and Enzyme Engineering Laboratory",
        },

      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. S. Sidhra",
            email: "",
            phone: "",
          },
        ],
        studentCoordinator: [
          {
            name: "Ms. D. Moumitha",
            email: "",
            phone: "9952533198",
          },
          {
            name: "Mr. M. Ajairaj ",
            email: "",
            phone: " 9342070737",
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
      description:
        "Transform 2D concepts into immersive 3D environments while demonstrating your mastery of spatialefficiency and creative problem-solving. This challenge tests your ability to visualize volume andtexture in a high-energy setting. Bring your ideas to life, from sleek modern interiors to complexstructural exteriors.",
      image: Tech7,
      rounds: [
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
      ],
      rules: [
        "Time Limit: Complete the model within the allotted time.",
        "No Outside Help: Mobile phones, internet, and external files are strictly prohibited.",
        "Software Only: Use only the provided Google SketchUp software.",
        "Solo Entry: Only registered participants allowed; no team support or helpers.",
        "Judging: Based on accuracy, creativity, and submission time.",
      ],
      schedule: [
        {
          round: "Round",
          date: "February 13, 2026",
          time: "",
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

      registrationLink: "https://forms.gle/gziLh4EoGaCQLSpg8", // Registration link
    },
    "technical-event-8": {
       title: "Paper Presentation",
       description:
         "This presentation provides a clear and structured explanation of the selected concept, covering its basic principles, system design, and real-world relevance. It highlights how the idea can be applied practically, discusses current developments, and points out key challenges and future scope, helping the audience understand both theory and application",
       image: Tech8,
       rounds: [
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
           round: "Round",
           date: "May 22, 2026",
           time: "9:00 AM to 11:00 AM",
           location: "Tech Hub, Innovation Center",
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
             name: ". Ms. C. V. Swetha",
             email: "",
             phone: "7538831885",
           },
         ],
       },
    },
    "technical-event-9": {
      title: " NEUROHACK 2.O",
      description:
        " NeuroHack 2.O is where ideas are built, systems are broken, and security is redefined. Participants Hack, 	Defend, and Secure technology to shape the future of digital innovation.",
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
          round: "Round",
          date: "February 13, 2026",
          time: "",
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
            name: "SHANMUGESHWARA A",
            email: "",
            phone: "9487119381",
          },
          
        ],
      },

      registrationLink: "https://forms.gle/gziLh4EoGaCQLSpg8", // Registration link
    },
    "technical-event-10": {
      title: "BOTXHIBIT",
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
          round: "Round",
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
          round: "Round",
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
          round: "Round",
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
      description:
        "Paper Presentation is a technical event that provides a platform for students and researchers to present their innovative ideas, research findings, and technical knowledge in front of an expert panel. Participants are required to prepare and present a research or review paper related to engineering, science, technology, or management domains.",
      image: Tech13,
      rounds: [
        {
          title: "TOPICS:",
        },
        {
          title: "themes need",
          
        },
        {
          title: "themes need",
          
        },
        {
          title: "themes need",
          
        },
        {
          title: "themes need",
          
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
            phone: "",
          },
        ],
        studentCoordinator: [
          {
            name: "Ms. Dharseni Santhiya Sampath Kumar ",
            phone: "9344415565",
          },
          {
            name: "Ms. Hema Vardhini S P",
            phone: "7200904682",
          },
        
        ],
      },

      registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
    },
    "technical-event-14": {
      title: "POSTER PRESENTATION",
      description:
        "This poster presentation provides students a platform to showcase innovative ideas and research on emerging food processing technologies. Participants will visually present advanced techniques, applications, and benefits that enhance food quality, safety, and sustainability. The session encourages knowledge sharing, creativity, and scientific discussion among students and experts.",
      image: Tech14,
      rounds: [
        {
          title: " ",
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
          round: "Round",
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
        title: "CODE RELAY",
        description:
          "Code Relay is a team-based web design challenge where a reference website design is provided.Team members take turns recreating the design, building upon the previous member’s work without restarting. Creativity, accuracy, and teamwork determine the final output.",
        image: Tech15,
        rounds: [
          {
            title: "TOPICS:",
          },
          {
            title: "Life Science and Technology Sector:",
            description: [
              "The Future of Genetic Engineering.",
              "Urban Nourish: Street Food Remix.",
              "Eco-Friendly Dyes: Reducing Environmental Impact in Textile Processing.",
            ],
          },
          {
            title: "Computer & IT Sector:",
            description: [
              "Quantum Computing: Revolutionizing Data Processing.",
              "Blockchain Technology in Cybersecurity.",
              "Edge Computing: A Game-Changer for IoT Applications.",
            ],
          },
          {
            title: "Electrical & Electronics Sector:",
            description: [
              "The Future of Wireless Communication.",
              "Wireless Power Transmission: The Next Energy Revolution.",
            ],
          },
          {
            title: "Building and Mechanical Sector:",
            description: [
              "3D Printing in Manufacturing: A Sustainable Approach.",
              "Green Buildings: Designing a Sustainable Future.",
            ],
          },
          {
            title: "Artificial Intelligence & IoT Sector:",
            description: [
              "AI in Climate Change Prediction: A Sustainable Approach.",
              "Smart Cities: IoT Solutions for Urban Sustainability.",
            ],
          },
          {
            title: "Chemical & Pharmaceutical Sector:",
            description: [
              "Carbon Capture Technology: Fighting Global Warming.",
              "Green Hydrogen: The Future of Renewable Energy.",
              "Personalized Medicine: The Role of AI in Drug Development.",
            ],
          }
        ],
        rules: [
          "Open to all UG, PG Students and Research Scholars. Teams can have a maximum of 3 members.",
          "1) Poster Guidelines:",
          "  i) Size: A1 (594 × 841 mm).",
          "  ii) Must include title, name of the concept , and uniqueness.",
          "  iii) Clear visuals, infographics, and creativity are encouraged.",
          "2) Presentation:",
          "1) Poster Guidelines:",
          "  i) Time Limit:10 minutes per team.",
          "  ii) Includes presentation for 6 minutes and  Q and A sections  for 4 minutes.",
          "  iii) Must cover product innovation,  and SDG alignment",
          "  iv) Judges may ask questions after the presentation.",
          "3) Judging Criteria:",
          "i) Content Relevance & Accuracy – 25%",
          "ii) Creativity & Innovation – 20%",
          "iii) Clarity & Organization – 20%",
          "iv) Visual Appeal – 15%",
          "v) Presentation & Communication Skills – 20%",
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
              name: "Mr G Bharath, AP/FT",
              phone: "9047976171",
            },
          ],
          studentCoordinator: [
            {
              name: "Surya S",
              phone: "9360492992",
            },
            {
              name: "Yatheeswar R",
              phone: "9441236991",
            },
            {
                name: "Vijaya Yugeshwar R ",
                phone: "9585768184",
            },

          ],
        },
  
        registrationLink: "https://forms.gle/Co3kBQwR53cbBH1B9", // Registration link
      },
      "technical-event-16": {
        title: "Paper Presentation",
        description:
          "This presentation provides a clear and structured explanation of the selected concept, covering its basic principles, system design, and real-world relevance. It highlights how the idea can be applied practically, discusses current developments, and points out key challenges and future scope, helping the audience understand both theory and application.",
        image: Tech16,
        rounds: [
          
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
            round: "Round",
            date: "February 13, 2026",
            time: "time need",
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
        description:
          "This event allows students to present technical ideas and research in engineering fields. Participants showcase innovation, analysis, and problem-solving through structured presentations.A Q&A session helps evaluate technical depth and communication skills.",
        image: Tech17,
        rounds: [
          
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
            round: "Round",
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
            round: "Round",
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
            round: "Round",
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
        title: "PAPER PRESENTATION",
        description:
          "The paper presentation focuses on providing an overview of sustainability and its growing importance in the textile industry, along with recent trends and innovations in textile technology and manufacturing. It addresses key issues related to textile waste and discusses methods such as recycling, reuse, and upcycling to promote sustainable practices. Participants will also be introduced to smart textiles and their basic applications in daily life, eco-friendly practices including water, energy, and chemical conservation, and the future scope, emerging areas, and career opportunities in textile engineering.",
        image: Tech20,
        rounds: [
          
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
            round: "Round",
            date: "February 13, 2026",
            time: "9.00 AM to 2.00 PM",
            location: "Smart Class Room MBA Block",
          },
        ],
        contact: {
          facultyCoordinator: [
            {
              name: "Dr. K.R.NandagopalE",
              email:"",
              phone: "90034 36705",
            },
            {
              name: "Dr. C.Premalatha",
              email:"",
              phone: " 97502 06161",
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
        title: "VoltEdge (PAPER PRESENTATION)",
        description:
          "The Internet of Things (IoT) – Connecting the Future Discover how IoT is transforming industries with smart connectivity, automation, and real-time data, shaping a smarter and more efficient world.",
        image: Tech21,
        rounds: [
          
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
      },
      "technical-event-22": {
        title: "VoltEdge (PAPER PRESENTATION)",
        description:
          "The Internet of Things (IoT) – Connecting the Future Discover how IoT is transforming industries with smart connectivity, automation, and real-time data, shaping a smarter and more efficient world.",
        image: Tech22,
        rounds: [
          
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
      },

      "technical-event-23": {
        title: "VoltEdge (PAPER PRESENTATION)",
        description:
          "The Internet of Things (IoT) – Connecting the Future Discover how IoT is transforming industries with smart connectivity, automation, and real-time data, shaping a smarter and more efficient world.",
        image: Tech23,
        rounds: [
          
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
      },
      /*"technical-event-16": {
        title: "VoltEdge (PAPER PRESENTATION)",
        description:
          "The Internet of Things (IoT) – Connecting the Future Discover how IoT is transforming industries with smart connectivity, automation, and real-time data, shaping a smarter and more efficient world.",
        image: Tech16,
        rounds: [
          
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
          round: "Round 1",
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
      registrationLink: "https://forms.gle/F7ToBuAQk8jMRJe5A", // Registration link
    },
    "non-technical-event-2": {
      title: "IPL AUCTION",
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
          round: "Round 1",
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
          round: "Round 1",
          date: "March 29, 2026",
          time: "10:00 AM to 12:00 PM",
          location: "Art Gallery, Creative Center",
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
            email: "lalithamani@ksrct.ac.in",
            phone: "8925568867",
          },
          {
            name: "Dr. P.Suthanthirakumar",
            email: "suthanthirakumar@ksrct.ac.in",
            phone: "9500825738",
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
      title: "Dumb Charades - Act It Out!",
      description:
        "A fun and engaging event where participants act out biotech-related words or phrases without speaking",
      image: NonTech4,
      rounds: [
        {
          title: "Round 1 – Qualifiers:",
          description:
            "Each team gets 60 seconds per turn to act out and guess a word/phrase. Teams must guess at least 3 words to qualify for the next round",
        },
        {
          title: "Round 2 – Semi-Finals: ",
          description:
            "Difficulty level increases with phrases, movie titles, or scientific terms. Teams get 45 seconds per turn. Top teams proceed to the final round.",
        },
        {
          title: "Final Round:",
          description:
            "Teams must guess as many words/phrases as possible within 1 minutes. The team with the highest correct guesses wins",
        },
      ],
      rules: [
        "2 members per team",
        "No speaking, lip movement, or writing is allowed while acting",
        "Teams can pass a word but will lose points",
        "Use of gestures, facial expressions, and body language is encouraged",
      ],
      schedule: [
        {
          round: "Round 1",
          date: "March 29, 2026",
          time: "10:00 AM to 12:00 PM",
          location: "Art Gallery, Creative Center",
        },
        {
          round: "Round 2",
          date: "March 29, 2026",
          time: "2:00 PM to 4:00 PM",
          location: "Art Gallery, Creative Center",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. R. Arulvel",
            email: "arulvelr@ksrct.ac.in",
            phone: "8870921600",
          },
        ],
        studentCoordinator: [
          {
            name: "Pradeep Kumar A",
            email: "pradeeplatha16@gmail.com",
            phone: "8825656199",
          },
          {
            name: "Manoj R",
            email: "ravimano672@gmail.com",
            phone: "9345286006",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-5": {
      title: "Its Talk Time",
      description:
        "Two teams face off, taking turns to continue a given sentence within 5 seconds. Each team starts with 3 lives and failing to respond in time or providing an illogical continuation results in losing a life. The game continues until one team loses all three lives and gets eliminated. With pressure mounting and stories taking unexpected turns, teams must stay sharp and work together to keep the narrative flowing. The last team standing wins, proving their mastery of words and quick wit!",
      image: NonTech5,
      rounds: [
        {
          title: "",
          description: "",
        },
      ],
      rules: [
        "Teams & Lives: Each team (3 or fewer members) starts with 3 lives per round.",
        "Turn Time: Teams must continue the given sentence within 5 seconds or lose a life.",
        "Elimination: The first team to lose all 3 lives is eliminated",
        "Match Duration: If the round reaches 10 minutes, the team with more lives moves forward. If both teams have the same lives, the round restarts, but each team gets only 1 life.",
        "Language: Sentences must be in English or Tamil only.",
        "Originality: No repeating sentences, every response must be unique and meaningful.",
        "Final Round: Rules for the final round will be revealed on the spot",
      ],
      schedule: [
        {
          round: "Round",
          date: "March 29, 2026",
          time: "10:00 AM to 12:00 PM",
          location: "HPC LAB,Mechatronics Block",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. C. Vijayakumar",
            email: "vijayakumarc@ksrct.ac.in",
            phone: "6379112939",
          },
          {
            name: "Dr. R Senthilmurugan",
            email: "senthilmurugan@ksrct.ac.in",
            phone: "9843488996",
          },
        ],
        studentCoordinator: [
          {
            name: "Akash Raam S",
            email: "akashadthi.sd@gmail.com",
            phone: "6381279741",
          },
          {
            name: "Deva S",
            email: "sivadeva2203@gmail.com",
            phone: "9976438984",
          },
        ],
      },
      registrationLink: "https://forms.gle/cgwAsboW12c9pWXFA", // Registration link
    },
    "non-technical-event-6": {
      title: "Auction Arena",
      description:
        "Auction Arena is a thrilling and interactive event designed to bring out the strategist in you! This fun-filled IPL-themed auction challenges participants to think analytically, bid smartly, and build the ultimate cricket squad. Participants must bid wisely, manage their budgets effectively, and build a well-balanced squad to outshine their competitors.",
      image: NonTech6,
      rounds: [],
      rules: [
        "Minimum Requirements: 2 Batters, 2 Bowlers, 1 Wicketkeeper, 5 Players who can bowl (e.g., 2 Bowlers + 3 All-rounders or 3 Bowlers + 2 All-rounders)",
        "Maximum 4 Foreign Players Allowed in the playing XI:",
        "Final Squad Composition: 11 Main Players, 1 Impact Player",
      ],
      schedule: [
        {
          round: "Slot1",
          date: "March 29, 2026",
          time: "10:00 AM to 12:00 PM",
          location: "AB(211),AB Block",
        },
        {
          round: "Slot2",
          date: "March 29, 2026",
          time: "1:00 PM to 4:00 PM",
          location: "AB(211),AB Block",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mrs.T.Udhaya",
            email: "udhaya@ksrct.ac.in",
            phone: "8675587180",
          },
        ],
        studentCoordinator: [
          {
            name: "Kishorekumar S",
            email: "kishoresenthilkumar25@gmail.com",
            phone: "9344276110",
          },
          {
            name: "Gogul J",
            email: "goguljeyaraj04@gmail.com",
            phone: "8807614376",
          },
        ],
      },
      registrationLink: "https://forms.gle/F7ToBuAQk8jMRJe5A", // Registration link
    },
    "non-technical-event-7": {
      title: "A Guess Challenge ",
      description:
        "Unmasking Brands & Flavors: A Journey Through Corporate Identities & Culinary Secrets This event is designed to challenge participantsknowledge of corporate branding and food recognition through an interactive three-level game. It tests awareness, teamwork, and quick thinking in a fun and engaging way.",
      image: NonTech7,
      rounds: [
        {
          title: "Round 1: Logo Guessing Challenge",
          description: [
            "Teams will be shown blurred or partial logos of food brands and must identify them.",
            "Each correct answer earns points; the top teams progress to the next level.",
          ],
        },
        {
          title: "Round 2: Food Dumb Charades",
          description: [
            "One team member will be given a food-related word/brand and must enact it without speaking.",
            "The other members must guess the word within a given time.",
            "Teams with the highest scores move to the final level",
          ],
        },
        {
          title: "Round 3: Guess the Ingredient",
          description: [
            "Teams will be presented with a mystery dish or product and must identify key ingredients.",
            "Limited time will be given for each guess.",
            "The team with the most correct ingredient identifications wins.",
          ],
        },
      ],
      rules: [
        "Use of mobile phones or external help is strictly prohibited.",
        "Teams must answer within the time limit for each round.",
        "Judges' decisions are final and binding",
      ],
      schedule: [
        {
          round: "Round 1",
          date: "March 29, 2026",
          time: "10:00 AM to 12:00 PM",
          location: "Art Gallery, Creative Center",
        },
        {
          round: "Round 2",
          date: "March 29, 2026",
          time: "2:00 PM to 4:00 PM",
          location: "Art Gallery, Creative Center",
        },
        {
          round: "Round 3",
          date: "March 29, 2026",
          time: "2:00 PM to 4:00 PM",
          location: "Art Gallery, Creative Center",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mrs. K. Kavitha , AP/Maths",
            phone: "9600933007",
            email: "kavithak@ksrct.ac.in",
          },
        ],
        studentCoordinator: [
          {
            name: "Lega C, III Year/FT ",
            phone: "9360115935",
            email: "lega.chandhrasekar07@gmail.com",
          },
          {
            name: "Pavithra R, II Year/FT",
            phone: "9345894830",
            email: "rppavithra2006@gmail.com",
          },
          {
            name: "Hariprasath K, II Year/FT",
            phone: "9080753031",
            email: "prasath202hari@gmail.com",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-8": {
      title: "one Click",
      description:
        "Capture the beauty of our campus and showcase your photography skills in this exciting contest! Post your photo on social media with #ksrct1994 to gain bonus points based on likes. Participants receive certificates, and winners get a cash prize! 📸✨",
      image: NonTech8,
      rounds: [],
      rules: [
        "The photographs should be taken only within the campus.",
        "The photographs can be taken with any camera, i.e. DSLR, Mobile camera.",
        "Photo enhancements is allowed, but not allowed to manipulate the content.",
        "Photographs should be minimum 1MB in size.",
        "The originality of the photos will be checked.",
        "The participants have to post the photo in their social media handle using the hashtag #ksrct1994. Additional of five points will be awarded for the likes they got for the photo.",
        "For Individual 50 rupees",
      ],
      schedule: [
        {
          round: "Round",
          date: "March 29, 2026",
          time: "9:00 AM to 12:30 PM",
          location: "Mechanical Block",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.S.Karthik",
            email: "skarthik@ksrct.ac.in",
            phone: "9790667321",
          },
        ],
        studentCoordinator: [
          {
            name: "Harshad Gajanan Shivpuje ",
            email: "harshadshivpujeg@gmail.com",
            phone: "7708927651",
          },
          {
            name: "Rajesh Kumar S ",
            email: "rajesh2342005@gmail.com",
            phone: "9361688130",
          },
        ],
      },
      registrationLink: "https://forms.gle/cgwAsboW12c9pWXFA", // Registration link
    },
    "non-technical-event-9": {
      title: "404:Meme Overload (Meme creation based on IT scenarios)",
      description:
        "IT Meme Battle is a fun and creative competition where teams of one or two members create original IT-related memes. Participants can use image + text, GIFs, or even hand-drawn memes for extra creativity. Plagiarized content will lead to disqualification, and all memes must be appropriate and respectful. Submissions must be made within the given time limit. Let your humor and tech knowledge shine in this battle of wit and creativity.",
      image: NonTech9,
      rounds: [],
      rules: [
        "Team Size: Each team can have 1 or 2 members.",
        "Originality Matters – Memes should be original and creative. Plagiarized content will lead to disqualification.",
        "Appropriate Content – No offensive and inappropriate memes. Keep it fun and respectful.",
        "Format Flexibility – Participants can create memes using:  Image + Text (classic meme style) ,  GIFs  ,Hand-drawn memes (for extra creativity!)",
        "Submission Time – Memes must be submitted within the given time limit.",
      ],
      schedule: [
        {
          round: "venue",
          date: "March 29, 2026",
          time: "9:30 PM to 12:00 PM",
          location: "IT lab 2,IT Park ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P.Dinesh Kumar",
            email: "p.dineshkumar@ksrct.ac.in",
            phone: "9688837873",
          },
        ],
        studentCoordinator: [
          {
            name: "Sandhiya M ",
            email: "sandhiyamanikandan17@gmail.com",
            phone: "9344806015",
          },
          {
            name: "Vignesh K ",
            email: "vigneshblue3162@gmail.com",
            phone: "6381083683",
          },
        ],
      },

      registrationLink: "https://forms.gle/F7ToBuAQk8jMRJe5A", // Registration link
    },

    "non-technical-event-10": {
      title: "Mind Maze",
      description:
        "Mind Maze is an exciting non-technical event that challenges participants to decode hidden clues from images using logic, pattern recognition, and creative thinking. Participants will engage their problem-solving skills to uncover the mystery, aiming to be the first to solve the clue within the time limit.",
      image: NonTech10,
      rounds: [
        {
          title: "Single Round",
          description: [
            "Participants will decode a hidden clue within an image.",
            "Speed, accuracy, and logical reasoning used to decipher the clue.",
          ],
        },
      ],
      rules: [
        "Participants must complete the task within the 15-minute time limit",
        "Only the first participant to solve the clue will be declared the winner.",
        "No external help or resources can be used during the event.",
      ],
      schedule: [],
      contact: {
        facultyCoordinator: [
          {
            name: " Dr. D. Mugilan (AP/ECE))",
            email: "mugilan@ksrct.ac.in",
            phone: "98946 07523",
          },
        ],
        studentCoordinator: [
          {
            name: "Prathipa T (II-Year/ECE)",
            email: "thangavelprathiba@gmail.com",
            phone: "9342626157",
          },
          {
            name: "Harish V(III-Year/ECE)",
            email: "harishpvr23@gmail.com ",
            phone: "8825508742",
          },
        ],
      },
      registrationLink: "https://forms.gle/F7ToBuAQk8jMRJe5A", // Registration link
    },
    "non-technical-event-11": {
      title: "Waste to Wealth 2026",
      description:
        "This event invites Engineering and Polytechnic students to showcase innovative solutions by transforming waste into creative, functional, or technological models. Participants will present their projects in a 5-7 minute pitch, focusing on creativity, sustainability, and practicality. The competition enhances problem-solving, entrepreneurial skills, and environmental awareness, offering career and networking opportunities in sustainability.",
      image: NonTech11,
      rounds: [
        {
          title: "Single Round",
          description: [
            "Each participant/team will get 5-7 minutes to present their project",
            "Craft and Art – Creative decorative items from waste.",
            "Utility and Innovation – Functional products from waste.",
            "Technology & Science Models – Prototypes for environmental sustainability",
          ],
        },
      ],
      rules: [
        "A poster or short PowerPoint presentation explaining the idea is recommended",
        "A short demonstration of the product/model is encouraged.",
        "All work must be original. Plagiarism or copied designs will lead to disqualification.",
        "The decision of the judges will be final and binding.",
        "Participants should ensure cleanliness and dispose of leftover waste properly.",
      ],
      schedule: [],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr.M.Velumani/AP/Civil",
            email: "velumani@ksrct.ac.in",
            phone: "9787978886",
          },
        ],
        studentCoordinator: [
          {
            name: "R.K.Aswin",
            email: "rkaswin07@gmail.com",
            phone: "8148934756",
          },
          {
            name: "Nithiya Suriyan K",
            email: "viratsuryaviratsurya4@gmail.com",
            phone: "8056603518",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-12": {
      title: "Glorify the Face with Colours",
      description:
        "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. This session delves into color theory, skin tone analysis, and the impact of hues on facial appearance, focusing on textile-based cosmetics, fashion coordination, and makeup artistry. Participants will learn how to enhance facial features using the right color palettes, understand psychological effects of colors, and experiment with practical applications. Ideal for those interested in fashion, styling, and personal grooming, this workshop blends creativity with scientific principles for a transformative experience.",
      image: NonTech12,
      rounds: [
        {
          title: "Single Round",
          description: [
            "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. ",
          ],
        },
      ],
      rules: [
        "Theme:On the Spot",
        "Two Participants per Team",
        "Duration:1 Hr",
        "Participants have to bring their own colours, brushes etc",
        "Juries Judgement is Final",
      ],
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P. Maheswaran AP/Textile ",
            email: "pmaheswaran@ksrct.ac.in",
            phone: "9600589068",
          },
        ],
        studentCoordinator: [
          {
            name: "V.Sandhiya 2nd year / Textile ",
            email: "sandhiya07082006@gmail.com",
            phone: "6369670394",
          },
          {
            name: "S.A.Hariharan 2nd year / Textile",
            email: "harihraran18@gmail.com",
            phone: "7092102427",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-13": {
      title: "Glorify the Face with Colours",
      description:
        "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. This session delves into color theory, skin tone analysis, and the impact of hues on facial appearance, focusing on textile-based cosmetics, fashion coordination, and makeup artistry. Participants will learn how to enhance facial features using the right color palettes, understand psychological effects of colors, and experiment with practical applications. Ideal for those interested in fashion, styling, and personal grooming, this workshop blends creativity with scientific principles for a transformative experience.",
      image: NonTech13,
      rounds: [
        {
          title: "Single Round",
          description: [
            "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. ",
          ],
        },
      ],
      rules: [
        "Theme:On the Spot",
        "Two Participants per Team",
        "Duration:1 Hr",
        "Participants have to bring their own colours, brushes etc",
        "Juries Judgement is Final",
      ],
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P. Maheswaran AP/Textile ",
            email: "pmaheswaran@ksrct.ac.in",
            phone: "9600589068",
          },
        ],
        studentCoordinator: [
          {
            name: "V.Sandhiya 2nd year / Textile ",
            email: "sandhiya07082006@gmail.com",
            phone: "6369670394",
          },
          {
            name: "S.A.Hariharan 2nd year / Textile",
            email: "harihraran18@gmail.com",
            phone: "7092102427",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-14": {
      title: "Glorify the Face with Colours",
      description:
        "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. This session delves into color theory, skin tone analysis, and the impact of hues on facial appearance, focusing on textile-based cosmetics, fashion coordination, and makeup artistry. Participants will learn how to enhance facial features using the right color palettes, understand psychological effects of colors, and experiment with practical applications. Ideal for those interested in fashion, styling, and personal grooming, this workshop blends creativity with scientific principles for a transformative experience.",
      image: NonTech14,
      rounds: [
        {
          title: "Single Round",
          description: [
            "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. ",
          ],
        },
      ],
      rules: [
        "Theme:On the Spot",
        "Two Participants per Team",
        "Duration:1 Hr",
        "Participants have to bring their own colours, brushes etc",
        "Juries Judgement is Final",
      ],
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P. Maheswaran AP/Textile ",
            email: "pmaheswaran@ksrct.ac.in",
            phone: "9600589068",
          },
        ],
        studentCoordinator: [
          {
            name: "V.Sandhiya 2nd year / Textile ",
            email: "sandhiya07082006@gmail.com",
            phone: "6369670394",
          },
          {
            name: "S.A.Hariharan 2nd year / Textile",
            email: "harihraran18@gmail.com",
            phone: "7092102427",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-15": {
      title: "Glorify the Face with Colours",
      description:
        "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. This session delves into color theory, skin tone analysis, and the impact of hues on facial appearance, focusing on textile-based cosmetics, fashion coordination, and makeup artistry. Participants will learn how to enhance facial features using the right color palettes, understand psychological effects of colors, and experiment with practical applications. Ideal for those interested in fashion, styling, and personal grooming, this workshop blends creativity with scientific principles for a transformative experience.",
      image: NonTech15,
      rounds: [
        {
          title: "Single Round",
          description: [
            "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. ",
          ],
        },
      ],
      rules: [
        "Theme:On the Spot",
        "Two Participants per Team",
        "Duration:1 Hr",
        "Participants have to bring their own colours, brushes etc",
        "Juries Judgement is Final",
      ],
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P. Maheswaran AP/Textile ",
            email: "pmaheswaran@ksrct.ac.in",
            phone: "9600589068",
          },
        ],
        studentCoordinator: [
          {
            name: "V.Sandhiya 2nd year / Textile ",
            email: "sandhiya07082006@gmail.com",
            phone: "6369670394",
          },
          {
            name: "S.A.Hariharan 2nd year / Textile",
            email: "harihraran18@gmail.com",
            phone: "7092102427",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-16": {
      title: "Glorify the Face with Colours",
      description:
        "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. This session delves into color theory, skin tone analysis, and the impact of hues on facial appearance, focusing on textile-based cosmetics, fashion coordination, and makeup artistry. Participants will learn how to enhance facial features using the right color palettes, understand psychological effects of colors, and experiment with practical applications. Ideal for those interested in fashion, styling, and personal grooming, this workshop blends creativity with scientific principles for a transformative experience.",
      image: NonTech16,
      rounds: [
        {
          title: "Single Round",
          description: [
            "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. ",
          ],
        },
      ],
      rules: [
        "Theme:On the Spot",
        "Two Participants per Team",
        "Duration:1 Hr",
        "Participants have to bring their own colours, brushes etc",
        "Juries Judgement is Final",
      ],
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P. Maheswaran AP/Textile ",
            email: "pmaheswaran@ksrct.ac.in",
            phone: "9600589068",
          },
        ],
        studentCoordinator: [
          {
            name: "V.Sandhiya 2nd year / Textile ",
            email: "sandhiya07082006@gmail.com",
            phone: "6369670394",
          },
          {
            name: "S.A.Hariharan 2nd year / Textile",
            email: "harihraran18@gmail.com",
            phone: "7092102427",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-17": {
      title: "Glorify the Face with Colours",
      description:
        "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. This session delves into color theory, skin tone analysis, and the impact of hues on facial appearance, focusing on textile-based cosmetics, fashion coordination, and makeup artistry. Participants will learn how to enhance facial features using the right color palettes, understand psychological effects of colors, and experiment with practical applications. Ideal for those interested in fashion, styling, and personal grooming, this workshop blends creativity with scientific principles for a transformative experience.",
      image: NonTech17,
      rounds: [
        {
          title: "Single Round",
          description: [
            "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. ",
          ],
        },
      ],
      rules: [
        "Theme:On the Spot",
        "Two Participants per Team",
        "Duration:1 Hr",
        "Participants have to bring their own colours, brushes etc",
        "Juries Judgement is Final",
      ],
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P. Maheswaran AP/Textile ",
            email: "pmaheswaran@ksrct.ac.in",
            phone: "9600589068",
          },
        ],
        studentCoordinator: [
          {
            name: "V.Sandhiya 2nd year / Textile ",
            email: "sandhiya07082006@gmail.com",
            phone: "6369670394",
          },
          {
            name: "S.A.Hariharan 2nd year / Textile",
            email: "harihraran18@gmail.com",
            phone: "7092102427",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-18": {
      title: "Glorify the Face with Colours",
      description:
        "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. This session delves into color theory, skin tone analysis, and the impact of hues on facial appearance, focusing on textile-based cosmetics, fashion coordination, and makeup artistry. Participants will learn how to enhance facial features using the right color palettes, understand psychological effects of colors, and experiment with practical applications. Ideal for those interested in fashion, styling, and personal grooming, this workshop blends creativity with scientific principles for a transformative experience.",
      image: NonTech18,
      rounds: [
        {
          title: "Single Round",
          description: [
            "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. ",
          ],
        },
      ],
      rules: [
        "Theme:On the Spot",
        "Two Participants per Team",
        "Duration:1 Hr",
        "Participants have to bring their own colours, brushes etc",
        "Juries Judgement is Final",
      ],
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P. Maheswaran AP/Textile ",
            email: "pmaheswaran@ksrct.ac.in",
            phone: "9600589068",
          },
        ],
        studentCoordinator: [
          {
            name: "V.Sandhiya 2nd year / Textile ",
            email: "sandhiya07082006@gmail.com",
            phone: "6369670394",
          },
          {
            name: "S.A.Hariharan 2nd year / Textile",
            email: "harihraran18@gmail.com",
            phone: "7092102427",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-19": {
      title: "Glorify the Face with Colours",
      description:
        "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. This session delves into color theory, skin tone analysis, and the impact of hues on facial appearance, focusing on textile-based cosmetics, fashion coordination, and makeup artistry. Participants will learn how to enhance facial features using the right color palettes, understand psychological effects of colors, and experiment with practical applications. Ideal for those interested in fashion, styling, and personal grooming, this workshop blends creativity with scientific principles for a transformative experience.",
      image: NonTech19,
      rounds: [
        {
          title: "Single Round",
          description: [
            "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. ",
          ],
        },
      ],
      rules: [
        "Theme:On the Spot",
        "Two Participants per Team",
        "Duration:1 Hr",
        "Participants have to bring their own colours, brushes etc",
        "Juries Judgement is Final",
      ],
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P. Maheswaran AP/Textile ",
            email: "pmaheswaran@ksrct.ac.in",
            phone: "9600589068",
          },
        ],
        studentCoordinator: [
          {
            name: "V.Sandhiya 2nd year / Textile ",
            email: "sandhiya07082006@gmail.com",
            phone: "6369670394",
          },
          {
            name: "S.A.Hariharan 2nd year / Textile",
            email: "harihraran18@gmail.com",
            phone: "7092102427",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },
    "non-technical-event-20": {
      title: "Glorify the Face with Colours",
      description:
        "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. This session delves into color theory, skin tone analysis, and the impact of hues on facial appearance, focusing on textile-based cosmetics, fashion coordination, and makeup artistry. Participants will learn how to enhance facial features using the right color palettes, understand psychological effects of colors, and experiment with practical applications. Ideal for those interested in fashion, styling, and personal grooming, this workshop blends creativity with scientific principles for a transformative experience.",
      image: NonTech20,
      rounds: [
        {
          title: "Single Round",
          description: [
            "The Glorify the Face with Colours workshop is an exciting opportunity for students and enthusiasts to explore the art and science of facial aesthetics through color application. ",
          ],
        },
      ],
      rules: [
        "Theme:On the Spot",
        "Two Participants per Team",
        "Duration:1 Hr",
        "Participants have to bring their own colours, brushes etc",
        "Juries Judgement is Final",
      ],
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P. Maheswaran AP/Textile ",
            email: "pmaheswaran@ksrct.ac.in",
            phone: "9600589068",
          },
        ],
        studentCoordinator: [
          {
            name: "V.Sandhiya 2nd year / Textile ",
            email: "sandhiya07082006@gmail.com",
            phone: "6369670394",
          },
          {
            name: "S.A.Hariharan 2nd year / Textile",
            email: "harihraran18@gmail.com",
            phone: "7092102427",
          },
        ],
      },
      registrationLink: "https://forms.gle/5yq2dPubztMWun548", // Registration link
    },



    // Culturals
    "culturals-event-1": {
      title: "INFINITE STEP",
      description:
        "Solo dance is a personal expression of rhythm, emotion, and creativity through graceful movements. It captivates audiences with unique styles and storytelling.",
      image: Culturals1,
        rules: [
        "Song Duration should be between 3 to 4 min",
        "Song should be in mp3 format and must be brought by the participants in pen drive.",
        "Register before the final date",
        "Props: Allowed but should be pre-approved",
        "Winners will be judged by jury based on Choreography, Costumes, Stage Presence,Overall Impact ",
      ],

      schedule: [
        {
          round: "Round 1",
          date: "February 14, 2026",
          time: "10:00 AM to 3:00 PM",
          location: "KSRCT",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr.K.Kiruthika",
            phone: "9842661683",
            email: " ",
          },
          {
            name: "Dr.N.Ramesh",
            phone: "8610499148",
            email: " ",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr.S.Bala",
            email: " ",
            phone: "9363280575",
          },
          {
            name: "Ms.P.K.Senthamil",
            email: "",
            phone: "9442845337",
          },
          {
            name: "Ms.R.Tarunika",
            email: " ",
            phone: "8946086757",
          },
        ],
      },
      registrationLink: "https://forms.gle/3pXHgWk3HHYvFqoP8", // Registration link
    },
    "culturals-event-2": {
      title: "BEAT MODE",
      description:
        "A thrilling showcase of teamwork, rhythm, and creativity as groups compete with electrifying dance performances!",
      image: Culturals2,

      schedule: [
        {
          round: "Round 1",
          date: "February 14, 2026",
          time: "10:00 AM to 3:00 PM",
          location: "KSRCT",
        },
      ],
      rules: [
        "Song Duration should be between 4 to 5 min.",
        "Team size should be between 2 to 10 members.",
        "Song should be in mp3 format and must be brought by the participants in pen drive.",
        "Register before the final date.",
        "Props: Allowed but should be pre-approved.",
        "Winners will be judged by jury based on Coordination,Choreography, Costumes, Stage Presence, Overall Impact.",
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr.K.Kiruthika",
            email: " ",
            phone: "9842661683",
          },
          {
            name: "Dr.N.Ramesh",
            email: " ",
            phone: "8610499148",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr.A.Athityaa",
            email: " ",
            phone: "9345664042",
          },
          {
            name: "Ms.T.R.Ramitha",
            email: "",
            phone: "9345283931",
          },
          {
            name: "Ms.G.S.Harsha Prabha",
            email: "",
            phone: "9442218288",
            
          },
        ],
      },
      registrationLink: "https://forms.gle/3pXHgWk3HHYvFqoP8", // Registration link
    },
    "culturals-event-3": {
      title: "CINE FEST",
      description:
        "A thrilling showcase of teamwork, rhythm, and creativity as groups compete with electrifying dance performances! ",
      image: Culturals3,

      schedule: [
        {
          round: "Round 1",
          date: "February 14, 2026",
          time: "10:00 AM to 03:00 PM",
          // location: "AI Lab, Mechatronics Block",
        },
      ],
      rules: [
        "Song Duration should be between 4 to 5 min",
        "Team size should be between 3 to 8 members",
        "Song should be in mp3 format and must be brought by the participants",
        "Register before the final date",
        "Props: AlloweDuration up to 10 minutes.",
        "WiAll films must be submitted in video file format (MP4, MOV, or AVI).",
        "Winners will be judged based on creativity, storytelling, and overall impact.",
        "No 18 +, bad words and adult content.",
      ],
      contact: {
        facultyCoordinator:
        [
          {
            name: "Dr.K.Kiruthika",
            phone: "9842661683",
          },
          {
            name: "Dr.N.Ramesh",
            phone: "8610499148",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr. C.Tamilselvan",
            email: " ",
            phone: "6374148544",
          },
          {
            name: "Ms.P.Sudheksha",
            email: " ",
            phone: "6381283352",
          },
          {
            name: "Mr.K.S.Prem",
            email: " ",
            phone: "9500057711",
            
          },
        ],
      },
      registrationLink: "https://forms.gle/vgcbHJpHuwMzxvpu8", // Registration link
    },
    "culturals-event-4": {
      title: "MUSICAL MAVERICKS",
      description:
        "A talented vocalist who mesmerizes the audience with a soulful performance, adding emotion and energy to the event.",
      image: Culturals4,
      rules: [
        "Time limit: 3–5 minutes per performance ",
        "Languages & Genres: Participants can sing in any language and genre",
        "Music: Karaoke track or self-accompanied instrument is allowed (no pre-recorded vocals)",
        "Prohibited: No auto-tune or vocal effects allowed",
        "Judging Criteria: Voice Quality, Pitch, Rhythm, Expression, Song Selection ",
      ],
      // rounds: [
      //     {
      //         title: "Single Round",
      //         description: [

      //             "Register before the final date",
      //             "Onspot Registration must be completed before 9.30AM",
      //             "",
      //         ]
      //     },
      // ],
      schedule: [
        {
          round: "Round 1",
          date: "February 14, 2026",
          time: "10:00 AM to 03:00 PM",
          location: "KSRCT",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr.K.Kiruthika",
            phone: "9842661683",
            email: " ",
            
          },
          {
            name: "Dr.N.Ramesh",
            phone: "8610499148",
            email: " ",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr. Kavin",
            email: " ",
            phone: "8610475412",
          },
          {
            name: "Ms.Aashitha Firdous A",
            email: " ",
            phone: "8838873452",
          },
          
        ],
      },
      registrationLink: "https://forms.gle/3pXHgWk3HHYvFqoP8", // Registration link
    },
    "culturals-event-5": {
      title: "SPOTLIGHT",
      description:
        "SPOTLIGHT is a special cultural event that celebrates unique and extraordinary talents of participants. This platform is open for performances such as magic shows, musical instrument performances, Silambam, martial arts, beatboxing, mimicry, and other creative skills. Participants will be judged based on originality, stage presence, skill level, and overall impact. SPOTLIGHT aims to recognize and encourage diverse talents by giving them a stage to shine.",
      image: Culturals5,
      schedule: [
        {
          round: "Round 1",
          date: "February, 2026",
          time: "10:00 AM to 03:00 PM",
          location: "KSRCT",
        },
      ],
      rules: [
        "The event is open to all registered participants of the cultural fest.",
        "Each participant must showcase one special talent only (e.g., magic, musical instrument, Silambam, martial arts, mimicry, etc.).",
        "Performance duration must be strictly followed",
        "Participants must report to the venue at least 30 minutes before the event starts.",
        "Vulgarity, offensive content, or any form of inappropriate performance is strictly prohibited.",
        "Use of dangerous props, fire, sharp weapons, or hazardous materials is not allowed.",
        "Participants are responsible for bringing their own instruments, props, or materials required for the performance.",
        "Background music (if any) must be submitted to the coordinators before the event in the specified format.",
        "Background music (if any) must be submitted to the coordinators before the event in the specified format.",
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr.K.Kiruthika",
            phone: "9842661683",
            email: "",
          },
          {
            name: "Dr.N.Ramesh",
            phone: "8610499148",
            email: "",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr. Vijay Chandru",
            email: "",
            phone: "7397181421",
          },
          {
            name: "Mr. Derik Austin",
            email: "",
            phone: "9788945834",
          },
          {
            name: "Mr. Sakthivel",
            email: "",
            phone: "8056947128",
          },
          {
            name: "Ms. Dhivya Sree",
            email: "",
            phone: "6369392124",
          },
        ],
      },
      registrationLink: "https://forms.gle/sSFoH8BMWLLG5xGZA", // Registration link
    },

    // Workshop
    "workshop-1": {
      title:
        "Design for Testability (DFT) Demystified:The Basics you need to Know",
      description:
        "Join our workshop to gain a basic understanding of DFT and its importance in the semiconductor industry. Open to UG & PG students from all branches, with mandatory attendance for certification. Participation certificates will be provided to all attendees!",
      image: workshop1,
      schedule: [
        {
          round: "Round  ",
          date: "March 28, 2026",
          time: "9:00 AM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr.S.Gomathi",
            email: "gomathi@ksrct.ac.in",
            phone: "9894279244",
          },
          {
            name: "Mr.S.Pradeep ",
            email: "pradeeps@ksrct.ac.in",
            phone: "812213986",
          },
        ],

        studentCoordinator: [
          {
            name: "Hari Kesavaraj J , Second Year EE (VLSI D&T)",
            email: "harikesavaraj1806@gmail.com",
            phone: "8270278279",
          },
          {
            name: "Aishvarieya V , Second Year EE (VLSI D&T)",
            email: "aishvarieyav5@gmail.com",
            phone: "6374684519",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-2": {
      title: "A Walkthrough of Modern Techniques",
      description:
        "This workshop will introduce students to prompt engineering, a critical skill for optimizing AI interactions. Participants will learn how to craft precise, efficient, and structured prompts to get the best responses from AI models like ChatGPT, Gemini, and DeepSeek. The session will cover types of prompts, best practices, real-world applications, and hands-on exercises to help students develop a deeper understanding of AI communication.",
      image: workshop2,
      schedule: [
        {
          round: "Venue ",
          date: "March 28, 2026",
          time: "9:00 PM to 3:00 PM",
          location: "IT lab 1,IT Park ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P.Dinesh Kumar ",
            phone: "9688837873",
            email: "p.dineshkumar@ksrct.ac.in",
          },
        ],
        studentCoordinator: [
          {
            name: "Anisa F",
            phone: "9942651212",
            email: "anisafairoz@gmail.com",
          },
          {
            name: "Balasastha E",
            phone: "8056520787",
            email: "balasastha85266@gmail.com",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-3": {
      title: "Ui Path Supported Workshop” Robotic Process Automation”",
      description:
        "Join our UiPath-Supported Workshop on Robotic Process Automation (RPA) led by Mr. M. Senthil, Lead Technical Trainer at ICT Academy, Chennai. Gain hands-on experience in automation tools and techniques to enhance workflow efficiency. Don’t miss this opportunity to elevate your automation skills! 🚀",
      image: workshop3,
      schedule: [
        {
          round: "Workshop timing",
          date: "March 28, 2026",
          time: "10:00 AM to 3:00 PM",
          location: "AI Lab, Mechatronics Block",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr N.Giridharan ",
            email: "giridharan@ksrct.ac.in",
            phone: "8925325252",
          },
        ],
        studentCoordinator: [
          {
            name: "Gowrinath V",
            email: "gowrigowri75392@gmail.com",
            phone: "8056570574",
          },
          {
            name: "Durga S",
            email: "durgasaran2004@gmail.com",
            phone: "9080191925",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-4": {
      title: "AI in Game Developing",
      description:
        "The AI on Game Developing Workshop, organized by IITM Pravartak Technologies Foundation, is a two-day event designed to introduce participants to the integration of Artificial Intelligence (AI) in game development. This hands-on workshop covers key AI techniques such as pathfinding, decision-making algorithms, and neural networks, enabling participants to create intelligent game characters, optimize game mechanics, and enhance player experience. Open to students, professionals, and AI/game development enthusiasts, no prior experience is required—just a basic understanding of programming is recommended. Inter-specialization teams are welcome, and registration is free! 🚀🎮",
      image: workshop4,
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mrs. R.S. Sivarajani (AP/CSE(AIML))",
            email: "sivaranjani.rs@ksrct.ac.in",
            phone: "9677055783",
          },
        ],
        studentCoordinator: [
          {
            name: "Surendra Krishana R (III-Year/CSE(AIML))",
            email: "surendirakrishna.info@gmail.com",
            phone: "8438878063",
          },
          {
            name: "Sriharan S (III-Year/CSE(AIML))",
            email: "sriharan2544@gmail.com",
            phone: "9629729009",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-5": {
      title: "Blockchain 101",
      description:
        "Blockchain 101  is an introductory workshop designed to help developers understand blockchain technology and its practical applications. It covers key concepts such as decentralization, cryptographic security, consensus mechanisms, and smart contracts. Participants will gain hands-on experience in writing and deploying smart contracts using Solidity and working with blockchain development tools like Remix, Truffle, and MetaMask. By the end of the session, attendees will have a solid foundation in blockchain and the skills to start building decentralized applications (DApps).",
      image: workshop5,
      schedule: [
        {
          round: "Event Timing",
          date: "March 28, 2026",
          time: "9:00 AM to 4:00 PM",
          location: "AB 209, Academic Block",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. P. Venkatesh",
            email: "venkateshp@ksrct.ac.in",
            phone: "8903366916",
          },
        ],
        studentCoordinator: [
          {
            name: "Mohanakumaran K",
            email: "mohanakumaran2004@gmail.com",
            phone: "8838401078",
          },
          {
            name: "Narendar P",
            email: "naren20062005@gmail.com",
            phone: "8508774247",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-6": {
      title:
        "Mobile Application Development By RemitBee India Private Limited - Chennai",
      description:
        "In today’s digital world, mobile applications are a key driver of how individuals and businesses engage with technology. This Mobile Application Development Workshop aims to equip participants with a solid grasp of mobile app development across both Android and iOS platforms. The workshop will feature hands-on training, live coding, and a mini-project to implement learned concepts in practice",
      image: workshop6,
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr K.Dinesh Kumar",
            email: "dineshkumark@ksrct.ac.in",
            phone: "9360287212",
          },
        ],
        studentCoordinator: [
          {
            name: "Kaviya S",
            email: "kaviyasenthil12005@gmail.com",
            phone: "6382491543",
          },
          {
            name: "Obu Sharva Dharshini O ",
            email: "obusharvadharshinio@gmail.com",
            phone: "6381014001",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-7": {
      title: "Do Engineering using NI Lab VIEW By Mew Technology, Bangalore",
      description:
        "Participants will learn to create virtual instruments, control hardware, and analyze data. The workshop focuses on practical applications in engineering and control systems.",
      image: workshop7,
      schedule: [
        {
          round: "Venue",
          date: "March 28 & 22, 2026",
          time: "9:00 AM to 4:00 PM",
          location: "Computer Lab,EEE Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. Thangadurai A",
            email: "thangaduraia@ksrct.ac.in ",
            phone: "9095322233",
          },
        ],
        studentCoordinator: [
          {
            name: "Bhuwanesh R",
            email: "bhuwanesh2004@gmail.com",
            phone: "9342566322",
          },
          {
            name: "Karmuhilan V",
            email: "karmuhilan90252@gmail.com ",
            phone: "9025244374",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-8": {
      title:
        "Next Generation Sequencing technologies in Health Care By Genotypic Technology, Bengaluru",
      description:
        "An interactive workshop providing hands-on experience and insights into cutting-edge sequencing technologies.",
      image: workshop8,
      schedule: [
        {
          round: "Round ",
          date: "March 28, 2026",
          time: "10:00 AM to 4:00 PM",
          location: "Bio tech smart class,BIOTECH Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. Puniethaa Prabhu",
            email: "punithaa@ksrct.ac.in",
            phone: "9080195801",
          },
          {
            name: "Dr. Sidhra S",
            email: "sidhra@ksrct.ac.in",
            phone: "8870681797",
          },
        ],
        studentCoordinator: [
          {
            name: "Sanjay Kumar K",
            email: "sanjaysanjay212004@gmail.com",
            phone: "8807076569",
          },
          {
            name: "Mohammed Arkam K",
            email: "mohammedarkamsheriff@gmail.com",
            phone: "7904655755",
          },
          {
            name: "Raamprasaanth S",
            email: "raamprasaanths7607@gmail.com",
            phone: "8838616292",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-9": {
      title:
        "Soaring High: Hands-on Drone Building and Flight workshop By Garuda Aerospace",
      description:
        "Join our Hands-on Drone Building and Flight Workshop and experience the thrill of creating and flying your own drone! This interactive session covers drone assembly, aerodynamics, and real-world applications, giving you practical insights into UAV technology. With expert guidance, you'll build your drone from scratch and take it for a test flight, mastering essential piloting skills. Whether you're a beginner or a tech enthusiast, this workshop will elevate your knowledge and take you to new heights!",
      image: workshop9,
      schedule: [
        {
          round: "Round ",
          date: "March 28 & 29, 2026",
          time: "9:00 AM to 4:00 PM",
          location:
            "Centre of Excellence in Drone Technology,Mechatronics Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. S. Hari Prasadh",
            email: "hariprasadh@ksrct.ac.in",
            phone: "7092821630",
          },
          {
            name: "Mr. R. Vivek",
            email: "vivekr@ksrct.ac.in",
            phone: "7200458826",
          },
        ],
        studentCoordinator: [
          {
            name: "Soundarrajan A",
            email: "soundarrajan2004@gmail.com",
            phone: "9442727410",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-10": {
      title:
        "Industry IoT using LoRaWAN Technology By Enthu Technology Solutions India Pvt Ltd",
      description:
        "Workshop delves into LoRaWAN technology and its role in Industrial IoT (IIoT), enabling long-range, low-power wireless communication for various applications. Participants will gain insights into LoRaWAN architecture, device communication, network deployment, and security protocols. The workshop will cover smart manufacturing, asset tracking, environmental monitoring, and predictive maintenance, with hands-on sessions and real-world case studies to equip attendees with practical skills for implementing IoT solutions in industrial automation and efficiency.",
      image: workshop10,
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mrs. Jayamani S (AP/ECE)",
            email: "jayamani@ksrct.ac.in",
            phone: "9629297054",
          },
        ],
        studentCoordinator: [
          {
            name: "Rohith R (III-Year/ECE)",
            email: "rohith66r@gmail.com",
            phone: "9345580330",
          },
          {
            name: "Rithan V (II-Year/ECE)",
            email: "rithanv78@gmail.com",
            phone: "9025033891",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-11": {
      title: "",
      description:
        "'Value Addition in Millet': Millets are highly nutritious, climate-resilient grains that offer immense potential for health benefits and economic growth. This workshop aims to explore innovative ways to enhance the value of millets through processing, product development, and marketing strategies.",
      image: workshop11,
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. S. Nithishkumar, AP/FT",
            email: "nithishkumar@ksrct.ac.in",
            phone: "8973333396",
          },
        ],
        studentCoordinator: [
          {
            name: "Pugazh Vendhan R, III Year/FT",
            phone: "7550348891",
            email: "vendhanpugazh0@gmail.com",
          },
          {
            name: "Shahana B, II Year/FT",
            phone: "7418883634",
            email: "shahanabhaskaran041@gmail.com",
          },
          {
            name: "Santhosh S, II Year/FT",
            phone: "7305844895",
            email: "santhoshhaterz05@gmail.com",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-12": {
      title:
        "Design and development of automotive Product By Mr.K.Santhosh Kumar, Support Manger, Macbro Technology Pvt Ltd, Erode.",
      description:
        "The Design and Development of Automotive Products is a comprehensive process that combines innovation, engineering, and cutting-edge technology to create high-performance vehicles and components. From conceptualization and prototyping to testing and manufacturing, this process ensures safety, efficiency, and sustainability in automotive solutions. Engineers and designers work collaboratively to optimize aerodynamics, materials, and electronic systems, integrating advanced technologies like AI, IoT, and automation. Whether developing electric vehicles, smart mobility solutions, or high-performance car components, this field plays a crucial role in shaping the future of transportation. ",
      image: workshop12,
      schedule: [
        {
          round: "Round",
          date: "March 28, 2026",
          time: "9:00 AM to 3:00 PM",
          location: "Idea lab,Main Block",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr.K.Raja",
            email: "rajak@ksrct.ac.in",
            phone: "9842314481",
          },
        ],
        studentCoordinator: [
          {
            name: "Lingeshwaran S L",
            email: "lingeshwaransl04@gmail.com",
            phone: "8012439250",
          },
          {
            name: "Raghunath E",
            email: "raghunath10091@gmail.com",
            phone: "8248732445",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-13": {
      title:
        "Building Information Modeling (BIM) By ICT Academy, Chennai, Tamil Nadu",
      description:
        "The Building Information Modeling (BIM) workshop aims to introduce participants to the fundamentals of BIM technology and its applications in the construction industry. Participants will gain hands-on experience with BIM software tools and learn how to effectively utilize BIM for project planning, design, construction, and management. The Workshop “BIM in structural Design Development’ focused on enhancing architectural design skills through hands-on activities and software training. Participants utilized BIM Revit Architecture software to create 3D plans, elevations, and views. The workshop featured a building plan as exercise and emphasized innovation and creativity in design solutions. Mentors provided guidance and feedback throughout the workshop to refine participants, architectural concepts. Overall, the Workshop inspired participants to push the boundaries of architectural design and pursue excellence in their craft.",
      image: workshop13,
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. S. Gunasekar",
            email: "gunasekar@ksrct.ac.in",
            phone: "9976876238",
          },
        ],
        studentCoordinator: [
          {
            name: "B. Susimitha",
            email: "bsusimitha18@gmail.com",
            phone: "6374735128",
          },
          {
            name: "S. Suja",
            email: "sujavishalini234@gmail.com",
            phone: "9500534225",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    "workshop-14": {
      title:
        "Medi Tex By Mr.T.Sureshram, Proprietor Care 4 U India Pvt, Ltd.,Tirupur",
      description:
        "The Medi-Tex Workshop is a valuable opportunity for students, researchers, and professionals in textile technology to explore advancements in medical textiles. This workshop will cover key topics such as smart textiles for healthcare, antibacterial fabrics, wound care materials, compression garments, and innovations in bio-textiles. Experts from the industry and academia will provide insights into material selection, fabrication techniques, and applications in medical fields. Participants will gain hands-on experience, engage in discussions on sustainability and regulations, and network with professionals. This workshop is ideal for those looking to enhance their knowledge and explore career opportunities in the growing field of medical textiles.",
      image: workshop14,
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr.K.R.Nanadagopal AP/Textile ",
            email: "nandagopakr@ksrct.ac.in",
            phone: "9003436705",
          },
          {
            name: "Mr.G.Devanand, AP / Textile",
            email: "devanandg@ksrct.ac.in ",
            phone: "9952841869",
          },
        ],
        studentCoordinator: [
          {
            name: "Akshaya , 3rd  /Textile ",
            email: "akshayasrini007@gmail.com",
            phone: "7871969769",
          },
          {
            name: "R.Hiruthik , 2nd /Textile ",
            email: "hiruthik4463@gmail.com",
            phone: "9965227394",
          },
        ],
        
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },


    "workshop-15": {
      title:
        "Building Information Modeling (BIM) By ICT Academy, Chennai, Tamil Nadu",
      description:
        "The Building Information Modeling (BIM) workshop aims to introduce participants to the fundamentals of BIM technology and its applications in the construction industry. Participants will gain hands-on experience with BIM software tools and learn how to effectively utilize BIM for project planning, design, construction, and management. The Workshop “BIM in structural Design Development’ focused on enhancing architectural design skills through hands-on activities and software training. Participants utilized BIM Revit Architecture software to create 3D plans, elevations, and views. The workshop featured a building plan as exercise and emphasized innovation and creativity in design solutions. Mentors provided guidance and feedback throughout the workshop to refine participants, architectural concepts. Overall, the Workshop inspired participants to push the boundaries of architectural design and pursue excellence in their craft.",
      image: workshop15,
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. S. Gunasekar",
            email: "gunasekar@ksrct.ac.in",
            phone: "9976876238",
          },
        ],
        studentCoordinator: [
          {
            name: "B. Susimitha",
            email: "bsusimitha18@gmail.com",
            phone: "6374735128",
          },
          {
            name: "S. Suja",
            email: "sujavishalini234@gmail.com",
            phone: "9500534225",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },
    /*
    "workshop-16": {
      title:
        "Building Information Modeling (BIM) By ICT Academy, Chennai, Tamil Nadu",
      description:
        "The Building Information Modeling (BIM) workshop aims to introduce participants to the fundamentals of BIM technology and its applications in the construction industry. Participants will gain hands-on experience with BIM software tools and learn how to effectively utilize BIM for project planning, design, construction, and management. The Workshop “BIM in structural Design Development’ focused on enhancing architectural design skills through hands-on activities and software training. Participants utilized BIM Revit Architecture software to create 3D plans, elevations, and views. The workshop featured a building plan as exercise and emphasized innovation and creativity in design solutions. Mentors provided guidance and feedback throughout the workshop to refine participants, architectural concepts. Overall, the Workshop inspired participants to push the boundaries of architectural design and pursue excellence in their craft.",
      image: workshop16,
      schedule: [
        {
          round: "Round ",
          date: "March 29, 2026",
          time: "2:00 PM to 3:00 PM",
          location: "Textile chemical processing laboratory,Textile Block ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. S. Gunasekar",
            email: "gunasekar@ksrct.ac.in",
            phone: "9976876238",
          },
        ],
        studentCoordinator: [
          {
            name: "B. Susimitha",
            email: "bsusimitha18@gmail.com",
            phone: "6374735128",
          },
          {
            name: "S. Suja",
            email: "sujavishalini234@gmail.com",
            phone: "9500534225",
          },
        ],
      },
      registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9", // Registration link
    },*/
  };  


  // Define animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const ScrollAnimation = ({ children }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView();

    useEffect(() => {
      if (inView) {
        controls.start("visible");
      }
    }, [controls, inView]);

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={{
          visible: { opacity: 1, y: 0 },
          hidden: { opacity: 0, y: 50 },
        }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    );
  };

  const event = eventDetails[eventId];

  if (!event) {
    return (
      <div className="text-center text-3xl font-bold mt-24">
        Event not found!
      </div>
    );
  }

  const [openRound, setOpenRound] = useState(null);

  const toggleRound = (round) => {
    setOpenRound(openRound === round ? null : round);
  };

  // Infinite Pulsing Animation for Button
  const pulseAnimation = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const isTechnicalOrNonTechnical =
    eventId.startsWith("technical-event") ||
    eventId.startsWith("non-technical-event");
  const isCultural = eventId.startsWith("culturals-event");

  // Check if event has valid rounds data
  const hasRounds = event?.rounds && event.rounds.length > 0 && 
    event.rounds.some(round => round.title || round.description);

  // Get price from database data instead of hardcoded values
  const eventPrice = getEventPrice();
  const registrationFee = eventPrice !== null ? `₹${eventPrice}` : (
    eventId.startsWith("workshop") ? "₹350" :
    eventId.startsWith("technical-event") ? "₹100" :
    eventId.startsWith("non-technical-event") ? "₹50" :
    eventId.startsWith("culturals") ? "₹100" : ""
  );

  return (
    <div className="p-4 md:p-10 mt-24 text-white min-h-screen">
      <button 
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-sky-700 transition-colors"
      >
        <ArrowLeft size={20} />
        Back
      </button>
      <div className="max-w-4xl mx-auto text-white p-4 md:p-6">
        <ScrollAnimation>
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-8 text-[#9DD3FF]">
            {event.title}
          </h1>
        </ScrollAnimation>

        {/* Display Registration Fee */}
        {registrationFee && (
          <div className="text-center text-primary text-xl md:text-2xl font-semibold mb-4">
            Registration Fee: {registrationFee}
            {eventPrice === 0 && <span className="ml-2 text-green-400">(FREE)</span>}
          </div>
        )}

        {/* Display Registration Count */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 rounded-lg border border-primary-dark/50">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-gray-300 text-lg">Registered:</span>
            </div>
            {registrationStats.loading ? (
              <span className="text-primary text-xl font-bold animate-pulse">Loading...</span>
            ) : (
              <span className={`text-xl font-bold ${
                registrationStats.current >= registrationStats.capacity 
                  ? 'text-red-400' 
                  : registrationStats.current >= registrationStats.capacity * 0.8 
                    ? 'text-yellow-400' 
                    : 'text-green-400'
              }`}>
                {registrationStats.current} / {registrationStats.capacity}
              </span>
            )}
            {!registrationStats.loading && registrationStats.current >= registrationStats.capacity && (
              <span className="text-red-400 text-sm">(Full)</span>
            )}
            {!registrationStats.loading && registrationStats.current >= registrationStats.capacity * 0.8 && registrationStats.current < registrationStats.capacity && (
              <span className="text-yellow-400 text-sm">(Filling Fast!)</span>
            )}
          </div>
        </div>

        {/* Register Now Button */}
        <motion.button
          className="mb-8 w-60 ml-12 md:w-auto block md:ml-[310px] px-6 py-3 bg-primary clip bg-opacity-70 border-2 border-primary-dark hover:bg-primary-dark transition-all text-white font-semibold text-xl md:text-2xl shadow-xl"
          whileHover={{ scale: 1.1, rotate: 2 }}
          whileTap={{ scale: 0.9 }}
          variants={pulseAnimation}
          animate="animate"
          onClick={handleRegisterClick}
        >
          {user ? 'REGISTER NOW!' : 'LOGIN TO REGISTER'}
        </motion.button>
        {!user && (
          <p className="text-center text-yellow-400 text-sm mb-4">
            Please login to register for this event
          </p>
        )}
        <motion.button
          className="mb-8 w-60 md:w-auto block mx-auto px-5 py-2 border-2 border-primary-dark hover:bg-primary-dark transition-all text-primary font-semibold text-lg md:text-lg shadow-xl"
          variants={pulseAnimation}
          animate="animate"
          onClick={() => navigate("/accomodation")}
        >
          Registration For Accommodation & Food
        </motion.button>
        <ScrollAnimation>
          <div className="border border-primary-dark p-2">
            <div className="text-center border border-primary-dark clip-bottom-right flex flex-col gap-4 p-4 md:p-10 items-center bg-primary-dark/20">
              <p className="font-semibold text-2xl md:text-3xl text-primary border border-primary-dark px-3 py-3">
                Description
              </p>
              <img
                src={event.image}
                alt={event.title}
                className="w-40 h-40 md:w-96 md:h-96 object-cover mb-4 shadow-md"
              />
              <p className="text-lg md:text-xl text-justify mb-4 text-primary">
                {event.description}
              </p>
            </div>
          </div>
        </ScrollAnimation>

        {isTechnicalOrNonTechnical && (
          <>
            <ScrollAnimation>
              <div className="flex flex-col md:flex-row justify-between my-10 gap-4">
                {["Description", "Rounds", "Rules", "Schedule", "Contact"]
                  .filter(item => item !== "Rounds" || hasRounds)
                  .map((item, index) => (
                    <motion.div
                      key={index}
                      className="border-2 border-primary-dark p-1"
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        const element = document.getElementById(item);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                    >
                      <h1 className="bg-primary-dark cursor-default px-4 md:px-10 py-3 text-primary bg-opacity-80 clip-bottom-right-2">
                        {item}
                      </h1>
                    </motion.div>
                  )
                )}
              </div>
            </ScrollAnimation>

            {/* Rounds Section */}
            {hasRounds && (
              <ScrollAnimation>
                <div className="border border-primary-dark p-2" id="Rounds">
                  <div className="border border-primary-dark shadow-lg p-4 md:p-10">
                    <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
                      Rounds
                    </h2>
                    <div className="flex flex-col gap-7">
                      {event.rounds.map((round, index) => (
                        <motion.div
                          key={index}
                          className="flex flex-col gap-3"
                          variants={itemVariants}
                        >
                          <h1 className="font-semibold text-xl md:text-2xl text-primary">
                            {round.title}
                          </h1>
                          {/* Check if description is an array and render as a list */}
                          {Array.isArray(round.description) ? (
                            <ul className="list-disc pl-6 text-lg md:text-xl text-primary">
                              {round.description.map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-lg md:text-xl text-justify text-primary">
                              {round.description}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            )}

            {/* Rules Section */}
            <ScrollAnimation>
              <div className="border border-primary-dark p-2 mt-6" id="Rules">
                <div className="bg-primary-dark/30 shadow-lg p-4 md:p-10">
                  <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary bg-inherit border border-primary-dark px-3 py-3">
                    Rules
                  </h2>
                  <ul className="list-disc pl-6 text-lg text-justify md:text-xl text-primary">
                    {event.rules.map((rule, index) => (
                      <motion.li key={index} variants={itemVariants}>
                        {rule}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollAnimation>
          </>
        )}

        {isCultural && (
          <>
            <ScrollAnimation>
              <div className="flex flex-col md:flex-row justify-between my-10 gap-4">
                {["Description", "Rules", "Schedule", "Contact"].map(
                  (item, index) => (
                    <motion.div
                      key={index}
                      className="border-2 border-primary-dark p-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      <h1 className="bg-primary-dark px-4 md:px-10 py-3 text-primary bg-opacity-80 clip-bottom-right-2">
                        {item}
                      </h1>
                    </motion.div>
                  )
                )}
              </div>
            </ScrollAnimation>

            {/* Rules Section */}
            <ScrollAnimation>
              <div className="border border-primary-dark p-2 mt-6" id="Rules">
                <div className="bg-primary-dark/30 shadow-lg p-4 md:p-10">
                  <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark px-3 py-3">
                    Rules
                  </h2>
                  {event.rules && event.rules.length > 0 ? (
                    <ul className="list-disc pl-6 text-lg md:text-xl text-primary">
                      {event.rules.map((rule, index) => (
                        <motion.li key={index} variants={itemVariants}>
                          {rule}
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-300 text-center">
                      No rules available.
                    </p>
                  )}
                </div>
              </div>
            </ScrollAnimation>
          </>
        )}

        {/* Schedule Section */}
        <div className="border border-primary-dark p-2 mt-6" id="Schedule">
          <div className="p-4 md:p-10">
            <h2 className="text-2xl md:text-3xl text-center font-semibold mb-8 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
              Schedule
            </h2>

            {event?.schedule?.length > 0 ? (
              event.schedule.map((schedule, index) => (
                <motion.div
                  key={index}
                  className="border-gray-300 pb-2 mb-2"
                  variants={itemVariants}
                >
                  <motion.button
                    className="flex justify-between items-center w-full text-lg md:text-xl font-medium p-3 border border-primary-dark text-primary hover:bg-primary-dark transition-colors duration-300"
                    onClick={() => toggleRound(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {schedule.round}
                    {openRound === index ? <ChevronUp /> : <ChevronDown />}
                  </motion.button>

                  {openRound === index && (
                    <motion.div
                      className="mt-2 p-3 border border-primary-dark bg-transparent text-gray-300"
                      initial="hidden"
                      animate="visible"
                      variants={itemVariants}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-base md:text-lg">
                        Date: {schedule.date}
                      </p>
                      <p className="text-base md:text-lg">
                        Time: {schedule.time}
                      </p>
                      <p className="text-base md:text-lg">
                        Location: {schedule.location}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))
            ) : (
              <p className="text-gray-300 text-center">
                No schedule available.
              </p>
            )}
          </div>
        </div>
        {/* Contact Section */}
        <ScrollAnimation>
          <div className="border border-primary-dark p-3 mt-6" id="Contact">
            <div className="bg-primary-dark/20 p-4 md:p-10">
              <h2 className="text-2xl md:text-3xl text-center font-bold mb-8 text-primary border border-primary-dark px-3 py-3">
                Contact
              </h2>

              {/* Faculty Coordinator Contact Details */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                  Faculty Coordinator
                </h3>
                {event.contact.facultyCoordinator.map((coordinator, index) => (
                  <div key={index} className="mb-4">
                    <p className="text-lg md:text-xl text-primary">
                      {coordinator.name}
                    </p>
                    <p className="text-lg md:text-xl text-primary">
                      {coordinator.phone}
                    </p>
                    <p className="text-lg md:text-xl text-primary">
                      {coordinator.email}
                    </p>
                  </div>
                ))}
              </div>

              {/* Student Coordinator Contact Details */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                  Student Coordinator
                </h3>
                {event.contact.studentCoordinator.map((coordinator, index) => (
                  <div key={index} className="mb-4">
                    <p className="text-lg md:text-xl text-primary">
                      {coordinator.name}
                    </p>
                    <p className="text-lg md:text-xl text-primary">
                      {coordinator.phone}
                    </p>
                    <p className="text-lg md:text-xl text-primary">
                      {coordinator.email}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </div>
  );
};

export default EventDetails;

