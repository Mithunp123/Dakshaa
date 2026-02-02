import Tech1 from "../assets/EventsImages/EventDetails/TechnicalImages/aids_tech.webp";
import Tech2 from "../assets/EventsImages/EventDetails/TechnicalImages/csbs_tech.webp";
import Tech4 from "../assets/EventsImages/EventDetails/TechnicalImages/bt_tech.webp";
import Tech6 from "../assets/EventsImages/EventDetails/TechnicalImages/bt_tech1.webp";
import Tech7 from "../assets/EventsImages/EventDetails/TechnicalImages/civil_tech.webp";
import Tech8 from "../assets/EventsImages/EventDetails/TechnicalImages/civil_tech1.webp";
import Tech10 from "../assets/EventsImages/EventDetails/TechnicalImages/cse_tech1.webp";
import Tech11 from "../assets/EventsImages/EventDetails/TechnicalImages/ece_tech.webp";
import Tech12 from "../assets/EventsImages/EventDetails/TechnicalImages/eee_tech.webp";
import Tech13 from "../assets/EventsImages/EventDetails/TechnicalImages/eee_tech1.webp";
import Tech14 from "../assets/EventsImages/EventDetails/TechnicalImages/ft_tech.webp";
import Tech16 from "../assets/EventsImages/EventDetails/TechnicalImages/mct_tech.webp";
import Tech17 from "../assets/EventsImages/EventDetails/TechnicalImages/mech_tech.webp";
import Tech19 from "../assets/EventsImages/EventDetails/TechnicalImages/txt_tech.webp";
import Tech20 from "../assets/EventsImages/EventDetails/TechnicalImages/txt_tech1.webp";
import Tech21 from "../assets/EventsImages/EventDetails/TechnicalImages/vlsi_tech.webp";
import Tech22 from "../assets/EventsImages/EventDetails/TechnicalImages/ft_tech1.webp";
import Tech23 from "../assets/EventsImages/EventDetails/TechnicalImages/ece_tech1.webp";
import Tech24 from "../assets/EventsImages/EventDetails/TechnicalImages/cody.webp";

export const technicalDetails = [
  {
    id: "tech-aids",
    shortTitle: "AI Mystery Box",
    title: "AI Mystery Box Challenge",
    description: "The AI Mystery Box Challenge is a one-day technical event designed to test participants’ analytical thinking, creativity, and practical skills in Artificial Intelligence and Machine Learning. This event offers a unique, problem-solving experience where teams are challenged with an unknown AI task revealed only at the start of the competition. Participants will receive a mystery box containing a real-world dataset and a problem statement. Once the box is opened upon official announcement, teams must quickly analyze the problem, design an appropriate machine learning solution, and develop a working model within the given time. To enhance practical applicability, teams are also required to integrate their model with a functional web interface, simulating industry-level AI deployment.The event encourages collaborative teamwork, effective time management, and hands- on implementation of AI concepts such as data preprocessing, model selection, training, evaluation, and deployment. With internet access permitted, participants can explore libraries, frameworks, and documentation to refine their solutions.The AI Mystery Box Challenge will be conducted at AI Lab 2 with a registration fee of ₹250 per head. This event is ideal for students who are passionate about AI, Data Science, and real-time problem solving, and who wish to showcase their technical expertise in a competitive environment.",
    img: Tech1,
    date: "February 13, 2026",
    venue: "AI Lab 2",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "Participants must bring their own laptop; a minimum Intel i5 processor is required to ensure smooth model development and execution",
      "Teams must consist of 2 to 3 members, and all members must be present throughout the event",
      "The mystery box may be opened only after the official announcement by the coordinators",
      "Teams must work exclusively on the dataset and problem statement provided inside their assigned mystery box",
      "Internet access is permitted",
      "The final solution must include a working machine learning model integrated with a functional web interface",
    ],

    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 1,500",
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
        date: "February 13, 2026",
        time: "9:00 AM - 4:00 PM",
        location: "AI Lab 2",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. J. Karthick",
          phone: "+91 80564 08054",
        },
        {
          name: "Ms. J. K. Shalini",
          phone: "+91 98949 70113",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr. M.Harish",
          phone: "+91 63693 03123",
        },
        {
          name: "Mr. T.Vikas",
          phone: "+91 63814 59911",
        },
        {
          name: "Ms. S.Obulakshmi",
          phone: "+91 81242 25197",
        },
        {
          name: "Ms. M.Raufama",
          phone: "+91 93450 64140",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-csbs",
    shortTitle: "System Sense",
    title: "System Sense – Usability & Analysis Challenge",
    description: "System Sense is a technical challenge designed to evaluate heuristic principles, identify design and interaction issues, and propose effective improvements within a limited time. Where participants assess systems based on established usability guidelines such as clarity, consistency, feedback, and user control. By applying these principles, participants develop practical solutions that enhance both user experience and business efficiency.",
    img: Tech2,
    date: "February 13, 2026",
    venue: "AB Lab 4",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "The competition consists of two rounds, conducted within a total duration of 2–3 hours",
      "Participants may compete individually or in teams of two",
      "Participants must analyze given system scenarios and identify usability or design issues using heuristic principles",
      "Solutions should emphasize system understanding, logical reasoning, and practical improvements, rather than coding",
      "Each participant or team must justify their proposed solution within the specified time limit as announced by the organizers",
    ],


    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 1,500",
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
    rounds: [
      {
        title: "Round-1 – System Analysis Round",
        description: [
          "Participants must analyze the given system, identify key usability or design issues, and propose a logical improvement using heuristic principles",
          "Evaluation will be based on accuracy of problem identification, relevance of the proposed solution, and clarity of analysis",
        ],
      },
      {
        title: "Round-2 – Justification & Final Round",
        description: [
          "Shortlisted participants will be given a new and more complex system scenario",
          "Participants must analyze the system and justify their proposed solution within the allotted time as per the One-Minute Justification Rule",
        ],
      },
      { title:" Additional Features",
      description: [
        "Participants are encouraged to apply heuristic principles and system-thinking approaches to arrive at effective solutions.",
      ],
      },
      {
        title:"Plagiarism and Fair Conduct",
        description: [
          "All analyses and solutions must be original and developed during the event.",
"Copying, sharing answers, or using unfair means in any form is strictly prohibited.",
"Any instance of malpractice or violation of rules will result in immediate disqualification.",
"The decision of the judges will be final and binding in all matters related to evaluation and conduct."
        ],
      }

    ],
    
    schedule: [
      {
        date: "February 13, 2026",
        time: "2-3 hrs",
        location: "AB Lab 4",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. M.Tamilarasi",
          phone: "+91 97500 37023",
        },
      ],
      studentCoordinator: [
        {
          name: "Miss. R. Mythra",
          phone: "+91 93459 68826",
        },
        {
          name: "Miss. K. Saimohana",
          phone: "",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-bt",
    shortTitle: "Reel-O-Science",
    title: "Reel-O-Science",
    description: "Reel-O-Science is a creative science communication challenge where participants create an engaging Instagram reel that explains scientific concepts in a simple, impactful, and visually appealing way. The event encourages students to blend scientific accuracy with creativity to raise awareness on topics related to Biotechnology, Life Sciences, Health, Environment, and Science for Society.",
    img: Tech4,
    date: "February 13, 2026",
    venue: "Smart class room (Biotechnology)",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "Participation is open to UG and PG students",
      "Participants can compete individually or in teams of up to 2 members",
      "Reel duration must be 45–60 seconds and in vertical (9:16) format",
      "Video resolution should be minimum 720p (up to 4K allowed)",
      "Language can be English or Tamil (subtitles are encouraged)",
      "AI tools may be used only as support; the scientific explanation and narration must be human-driven",
      "Fully AI-generated reels are strictly prohibited",
      "Any misuse of AI or misrepresentation of originality will lead to disqualification",
      "Content must be scientifically accurate and free from offensive, political, religious, or misleading material",
      "Plagiarism is strictly prohibited",
      "Only copyright-free music is allowed",
      "The reel must be posted on Instagram, tagging the official Dakshaa page",
      "Mandatory hashtags: #Dakshaa #ksrct1994 #Biotechnology",
      "The Instagram reel link must be submitted during the event",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 1,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹750",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹500",
        },
      ],
    rounds: [
      {
        title: "Reel Creation & Submission",
        description:[
          "Participants must create a 45–60 second vertical Instagram reel based on the given science-related themes. The reel should clearly explain the scientific concept using original ideas, visuals, and narration. The reel must be posted on Instagram by tagging the official Dakshaa page and using the specified hashtags.",
        ],
      },
      {
        title: "Evaluation & Shortlisting",
        description: ["Submitted reels will be evaluated based on scientific understanding, originality, presentation quality, and audience impact. Shortlisted entries will be considered for final ranking and prizes.",
        ]
      },
    ],
    schedule: [
      {
        date: "February 13, 2026",
        time: "9.00 AM to 2.00 PM",
        location: "Smart class room (Biotechnology)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. S. Sidhra",
          phone: "+91 89256 06990",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms. P. Keerthana",
          phone: "+91 98944 84834",
        },
        {
          name: "Mr. K. Sharen",
          phone: "+91 99431 91499",
        },
        {
          name: "Ms. V. Dhanasree",
          phone: "+91 63741 53457",
        },
      ],
    },
    registrationLink: " ",
  },
  {
    id: "tech-bt-2",
    shortTitle: "BioBlitz-Map",
    title: "BioBlitz-Map (Bio Treasure Hunt)",
    description: "BioBlitz-Map is a biology-based campus treasure hunt that challenges participants to apply biotechnology concepts, scientific logic, and observation skills to solve clues. Teams navigate through multiple locations using mapped hints, biological riddles, and logical reasoning to reach the final destination. The event emphasizes teamwork, accuracy, and strategic thinking in a competitive and engaging environment.",
    img: Tech6,
    date: "February 13, 2026",
    venue: "Protein and Enzyme Engineering Laboratory (Biotechnology Department)",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "The event is open to UG and PG students only",
      "Each team must consist of 1 to 2 members",
      "Team members must stay together throughout the event",
      "No external help from other participants or spectators is allowed",
      "All clues must be solved using biotechnology and life science knowledge",
      "Any damage to college property will result in immediate disqualification",
      "Misconduct, unfair practices, or rule violations will not be tolerated",
      "All tasks must be completed within the allotted time limit of 60–90 minutes",
      "Participants must strictly follow the instructions given by the event coordinators",
      "The decisions of the coordinators and judges are final and binding",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 1,500",
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
    rounds: [
      {
        title: "Round 1: Clue Decoding & Navigation",
        description: ["Teams begin the hunt by decoding biological riddles, concept-based questions, and image or spot identification clues. Each correct answer leads to the next mapped location within the campus.",
        ],
      },
      {
        title: "Round 2: Final Discovery & Completion",
        description: ["In the final phase, teams solve advanced life-science–based logical challenges to reach the treasure point. Performance is evaluated based on speed, accuracy, and progress within the given time limit.",
        ],
      },
    ],
    schedule: [
      {
        date: "February 13, 2026",
        time: "3 Hours",
        location: "Protein and Enzyme Engineering Laboratory (Biotechnology Department)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. S. Sidhra",
          phone: "+91 89256 06990",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms. D. Moumitha",
          phone: "+91 99525 33198",
        },
        {
          name: "Mr. M. Ajairaj",
          phone: "+91 93420 70737",
        },
        {
          name: "Ms. Nancy",
          phone: "+91 76958 90609",
        },
      ],
    },
    registrationLink: " ",
  },
  {
    id: "tech-civil",
    shortTitle: "3D Arena",
    title: "3D Arena (Google SketchUp)",
    description: "Transform 2D concepts into immersive 3D environments while demonstrating your mastery of spatial efficiency and creative problem-solving. This challenge tests your ability to visualize volume and texture in a high-energy setting. Bring your ideas to life, from sleek modern interiors to complex structural exteriors.",
    img: Tech7,
    date: "February 13, 2026",
    venue: "Civil CADD Laboratory",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "Time Limit: Complete the model within the allotted time",
      "No Outside Help: Mobile phones, internet, and external files are strictly prohibited",
      "Software Only: Use only the provided Google SketchUp software",
      "Solo Entry: Only registered participants allowed; no team support or helpers",
      "Judging: Based on accuracy, creativity, and submission time",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 1,500",
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
        date: "February 13, 2026",
        time: "9:00 AM to 12:00 PM",
        location: "Civil CADD Laboratory",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. K. Vijaya Sundravel",
          phone: "+91 96886 76665",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms. P. Vaishnavi",
          phone: "+91 99441 08747",
        },
        {
          name: "Ms. C. V. Swetha",
          phone: "+91 75388 31885",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-civil-1",
    shortTitle: "Paper Presentation",
    title: "Paper Presentation",
    description: "This presentation provides a clear and structured explanation of the selected concept, covering its basic principles, system design, and real-world relevance. It highlights how the idea can be applied practically, discusses current developments, and points out key challenges and future scope, helping the audience understand both theory and application.",
    img: Tech8,
    date: "February 13, 2026",
    venue: "Civil Building, C110 classroom",
    department: "Technical Events",
    price: "₹ 150 per participant",
    topics: [
      {
        description: "Topics",
      },
      {
        title: "1) Smart & Sustainable Infrastructure",
      },
      {
        title: "2) AI and Digital Technologies in Civil Engineering",
      },
      {
        title: "3) Future Trends in Construction and Structural Engineering",
      },
    ],

    papersubmission: [
      {
        description: [
          "Paper Should be mailed to : rameshs@ksrct.ac.in"
        ],
      },
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
          amount: "₹1,500",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹1,000",
        },
      ],
    rules: [
      "Each team must consist of 2 to 3 members only",
      "Participants must Present their Paper under any one of the three given Themes",
      "Only registered participants are allowed to be present",
      "The team with the best innovative and creative presentation will be selected as the winner",
    ],
    schedule: [
      {
        
        date: "February 13, 2026",
        time: "9:00 AM to 12:00 AM",
        location: "Civil Building, C110 classroom",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: " Dr. S. Ramesh",
          phone: "+91 99768 72912",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms.S.Gopika",
          phone: "+91 86374 99578",
        },
        {
          name: "Ms Serlin maria",
          phone: "+91 72008 87993",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-cse-1",
    shortTitle: "BotXhibit",
    title: "BOTXHIBIT",
    description: "A showcase-based technical event where participants present pre-developed software or hardware bots demonstrating innovation, functionality, and real-world application. Teams must explain the concept, design, working principle, and technology stack of their bot and perform a live demonstration within the allotted time. Evaluation will be based on originality, technical complexity, problem-solving approach, performance, and presentation quality.",
    img: Tech10,
    date: "February 13, 2026",
    venue: "IT Park (Smart ClassRoom)",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "A team may consist of a maximum of two (2) participants",
      "Only pre-developed bots (software or hardware) are permitted for demonstration",
      "On-site coding, modification, or fabrication of bots is strictly prohibited",
      "Mobile phones and external references are not allowed during evaluation, except when required for bot operation",
      "Each team must demonstrate a fully functional bot to be eligible for full evaluation",
      "Teams must bring all required components, equipment, and accessories for their bot",
      "Bots must comply with basic safety standards; unsafe hardware may lead to disqualification",
      "Any damage to equipment, venue property, or safety violations may result in disqualification",
      "The decision of the jury shall be final and binding",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 1,500",
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
        
        date: "February 13, 2026",
        time: "10.00AM to 3.30PM",
        location: "IT Park (Smart ClassRoom)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mrs. J.Mythili",
          email: "mythili@ksrct.ac.in",
          phone: "+91 99522 58113",
        },
      ],
      studentCoordinator: [
        {
          name: "JEEVANYA R",
          phone: "+91 99443 12033",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-ece",
    shortTitle: "Zero Component",
    title: "Zero component",
    description: "An engaging electronics-based technical event where participants are given only component symbols without component names. Participants must identify the correct components and build the complete circuit within a limited time. The participant who successfully builds a correct and working circuit in the shortest time is declared the winner.",
    img: Tech11,
    date: "February 13, 2026",
    venue: "EDC Lab (Main Building)",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "Maximum 2 players per team",
      "Components provided by the team",
      "Mobile phones, books, or external references are strictly prohibited",
      "The circuit must be fully functional to earn full points",
      "Damaging components or equipment may result in disqualification",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 1,500",
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
        
        date: "February 13, 2026",
        time: "9:00 AM to 1:00 PM",
        location: "EDC Lab (Main Building)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mrs V P Kalaiarasi",
          phone: "+91 95002 41234",
        },
      ],
      studentCoordinator: [
        {
          name: "Harish K",
          phone: "+91 93857 81083",
        },
      ],
    },
    registrationLink: "",
  },
  /*{
    id: "tech-eee",
    shortTitle: "Trailblazer",
    title: "Trailblazer",
    description: "The Trailblazer event challenges participants to design and operate a robot that follows a predefined path accurately and efficiently. The robot must track a line from start to finish with minimal deviation.",
    img: Tech12,
    date: "February 13, 2026",
    venue: "EEE Department",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "Maximum team size: 3 members",
      "Robot must be autonomous (no remote control)",
      "Manual interference during the run leads to disqualification",
      "Only one restart is allowed in case of technical failure",
    ],
    schedule: [
      {
        
        date: "February 13, 2026",
        time: "4 Hours",
        location: "EEE Department",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. N Rajasekaran",
          phone: "",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr. Vishwanathan K",
          phone: "+91 90250 81987",
        },
        {
          name: "Mr. Gowri Shankar S",
          phone: "+91 96292 39567",
        },
      ],
    },
    registrationLink: "https://forms.gle/2wBfChfRVPiKVw599",
  },*/
  {
    id: "tech-eee-1",
    shortTitle: "Paper presentation",
    title: "Paper presentation",
    description: "Paper Presentation is a technical event that provides a platform for students and researchers to present their innovative ideas, research findings, and technical knowledge in front of an expert panel. Participants are required to prepare and present a research or review paper related to engineering, science, technology, or management domains.",
    img: Tech13,
    date: "February 13, 2026",
    venue: "EE 304",
    department: "Technical Events",
    price: "₹ 150 per participant",
    topics: [
      {
        title: "TOPICS:",
      },
      {
        title: "Renewable energy",
      },
      {
        title: "AI-Driven Electrical Engineering",
      },
      {
        title: "Smart Grid",
      },
      {
        title: "Power Electronics",
      },
      {
        title: "Internet of things (IoT)",
      },
      {
        title: "Sensor Technology",
      },
      {
        title: "Power systems",
      },
    ],
    papersubmission: [
      {
        description: [
          "Paper Should be mailed to : spiceeeee01@gmail.com"
        ],
      },
    ],
    rules: [
      "The paper must be original, plagiarism-free, and relevant to the chosen technical domain",
      "A maximum of 2–3 participants per team is allowed; individual participation is also permitted",
      "Each team will be given 8–10 minutes for presentation followed by a short Q&A session",
      "Judges' decision will be final, and any form of malpractice will lead to disqualification",
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
          amount: "₹1,500",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹1,000",
        },
      ],
    schedule: [
      {
        
        date: "February 13, 2026",
        time: "4 Hours",
        location: "EE 304",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. M. K. Elango",
          phone: "+91 99524 93666",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms.N.Dharshika",
          phone: "+91 90036 44185",
        },
        {
          name: "Ms. S.P. Hema Vardhini",
          phone: "+91 72009 04682",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-ft",
    shortTitle: "Poster Presentation",
    title: "POSTER PRESENTATION",
    description: "This poster presentation provides students a platform to showcase innovative ideas and research on emerging food processing technologies. Participants will visually present advanced techniques, applications, and benefits that enhance food quality, safety, and sustainability. The session encourages knowledge sharing, creativity, and scientific discussion among students and experts.",
    img: Tech14,
    date: "February 13, 2026",
    venue: "Dairy Technology Laboratory",
    department: "Technical Events",
    price: "₹250",
    topics: [
      {
        title: "Emerging Food Processing Technologies",
      },
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 1,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹750",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹500",
        },
      ],
    rules: [
      "Participation is team-based (maximum 2 members).",
       "Prior registration is mandatory.",
       "Teams must submit one A2-size original poster created by students.",
        "The poster should include product name, concept, ingredients, nutritional benefits, and uniqueness.",

      "Posters must be neat, clear, and include visuals/infographics.",

"Proper citation of references is compulsory.",

"All participants must be present during presentation and follow the time limit.",
 
   "Evaluation will be based on clarity, innovation, and feasibility.",
   "Judges’ decision will be final."
    ],
    schedule: [
      {
      
        date: "February 13, 2026",
        time: "9:00 AM to 4:00 PM",
        location: "Dairy Technology Laboratory",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr.P.Kalai Rajan",
         
          phone: "+91 70108 41881",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms.S.Trishna",
          
          phone: "+91 98438 67406",
        },
        {
          name: "Ms.V.Madhushree",
          
          phone: "+91 63797 04086",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-mct",
    shortTitle: "Paper Presentation",
    title: "Paper Presentation",
    description: "This presentation provides a clear and structured explanation of the selected concept, covering its basic principles, system design, and real-world relevance. It highlights how the idea can be applied practically, discusses current developments, and points out key challenges and future scope, helping the audience understand both theory and application.",
    img: Tech16,
    date: "February 13, 2026",
    venue: "Homi J Baba Hall (Conference Hall) (MCT Block)",
    department: "Technical Events",
    price: "₹ 150 per participant",
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
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 2,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹1,500",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹1,000",
        },
      ],
    rules: [
      "Compete individually or in teams of 2-3 members",
      "No External help allowed",
      "Clarity of Presentation",
      "Innovation / Contribution",
    ],
    papersubmission: [
      {
        description: [
          "Paper Should be mailed to : "
        ],
      },
    ],
    schedule: [
      {
        
        date: "February 13, 2026",
        time: "9:30 AM - 3:00 PM",
        location: "Homi J Baba Hall (Conference Hall) (MCT Block)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. M. Sanjay",
      
          phone: "+91 70928 21630",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr. B. Aakash",
         
          phone: "+91 70106 96233",
        },
        {
          name: "Mr. D. Nishanth",
          
          phone: "+91 96003 52820",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-mech",
    shortTitle: "Paper Presentation",
    title: "PAPER PRESENTATION",
    description: "This event allows students to present technical ideas and research in engineering fields. Participants showcase innovation, analysis, and problem-solving through structured presentations. A Q&A session helps evaluate technical depth and communication skills.",
    img: Tech17,
    date: "February 13, 2026",
    venue: "Smart Class Room [Mechanical]",
    department: "Technical Events",
    price: "₹ 150 per participant",
    topics: [
      {
        title: "TOPICS:",
        description: [
          "Any Topics Related to Mechanical Domain",
          "Upcoming revolutionary technologies in Manufacturing industries",
        ],
      },
    ],
    papersubmission: [
      {
        description: [
          "Paper Should be mailed to :  sparkassociationksrct@gmail.com"
        ],
      },
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
          amount: "₹1,500",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹1,000",
        },
      ],
    rules: [
      "Team of maximum two members is allowed",
      "Format: PPT / PDF format",
      "PPT must contain 8-12 slides and be presented within 6-8 minutes",
      "Q&A session is compulsory for evaluation",
    ],
    schedule: [
      {
       
        date: "February 13, 2026",
        time: "9:30AM -2:00PM",
        location: "Smart Class Room [Mechanical]",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. P. Sampath",
         
          phone: "+91 99621 16570",
        },
        {
          name: "Dr.M.Gnanasekaran",
         
          phone: "+91 98944 04279",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.N. Surya",
        
          phone: "+91 90252 23203",
        },
        {
          name: "Mr. S.Harish",
        
          phone: "+91 70109 63539",
        },
        {
          name: "Ms.V.A.Santhanalakshimi",
        
          phone: "+91 80569 10993",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-txt",
    shortTitle: "DrapeX",
    title: "Drape X: Fabric Draping in Action",
    description: "DrapeX: Fabric Draping in Action offers hands-on practice in both basic and advanced fabric draping techniques using dress forms. Participants will understand fabric behavior such as fall, flow, and structure through the use of different fabrics, while applying creativity and technical skills to create original draped designs. The event also focuses on translating draped forms into garment silhouettes and design concepts.",
    img: Tech19,
    date: "February 13, 2026",
    venue: "Garment Construction Lab-TT",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "The event is open to students of textile and related disciplines; prior individual registration is mandatory",
      "Participation is allowed individual or in teams of 2 members",
      "Participants must bring their own fabric for draping; basic tools and dress forms will be provided",
      "The draping activity must be completed within the stipulated time",
      "Designs should be original; use of pre-stitched or pre-draped materials is not permitted",
      "Participants must maintain discipline and follow instructions given by the coordinators",
      "Judging will be based on creativity, fabric utilization, draping technique, and overall presentation",
      "The decision of the judges and organizing committee will be final",
    ],
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 1,500",
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
        
        date: "February 13, 2026",
        time: "3 hours",
        location: "Garment Construction Lab-TT",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr.C.Premalatha",
         
          phone: "+91 971 03201",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms. Subhalakshmi B",
          phone: "+91 95977 78936",
        },
        {
          name: "Ms. Abirama Selvi R J",
          phone: "+91 96882 41151",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-txt-1",
    shortTitle: "Paper Presentation",
    title: "PAPER PRESENTATION",
    description: "The paper presentation focuses on providing an overview of sustainability and its growing importance in the textile industry, along with recent trends and innovations in textile technology and manufacturing. It addresses key issues related to textile waste and discusses methods such as recycling, reuse, and upcycling to promote sustainable practices. Participants will also be introduced to smart textiles and their basic applications in daily life.",
    img: Tech20,
    date: "February 13, 2026",
    venue: "MBA Seminar Hall",
    department: "Technical Events",
    price: "₹ 150 per participant",
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
    papersubmission: [
      {
        description: [
          "Paper Should be mailed to  : tafetatt@gmail.com "
        ],
      },
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
          amount: "₹1,500",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹1,000",
        },
      ],
    rules: [
      "Team of maximum two members is allowed",
      "Format: PPT / PDF format",
      "PPT must contain 8-12 slides and be presented within 6-8 minutes",
      "Q&A session is compulsory for evaluation",
    ],
    schedule: [
      {
       
        date: "February 13, 2026",
        time: "9.00 AM to 2.00 PM",
        location: "MBA Seminar Hall",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. K.R.Nandagopal",
          phone: "+91 90034 36705",
        },
        {
          name: "Dr. C.Premalatha",
          phone: "+91 97502 06161",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.Dinu",
          phone: "+91 82206 76049",
        },
        {
          name: "Mr.Raaghul Khanna V",
          phone: "+91 96008 88788",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-vlsi",
    shortTitle: "CoreX",
    title: "CoreX (Project Presentation)",
    description: "A technical project presentation competition where teams (1-3 members) showcase innovative projects in engineering, technology, or innovation. Each team gets 10 minutes to present and 5 minutes for Q&A, with originality being crucial. A Q&A session helps evaluate technical depth and communication skills. The winning team will be awarded with cash prize, and attendance is mandatory for certification.",
    img: Tech21,
    date: "February 13, 2026",
    venue: "Electronic Devices Laboratory, J Block 4th Floor",
    department: "Technical Events",
    price: "₹250",
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
    rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹ 3,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹2,000",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹1,000",
        },
      ],

    topics: [
      {
        title: "TOPICS:",
        description: [
          "IoT (Internet of Things)",
          "AI (Artificial Intelligence)",
          "Embedded Systems",
          "E-Vehicle and Autonomous Vehicle",
          "VLSI (Very Large Scale Integration)",
          "3D Printing",
        ],
      },
    ], 
    schedule: [
      {
       
        date: "February 13, 2026",
        time: "9.00 AM to 4.00 PM",
        location: "Electronic Devices Laboratory, J Block 4th Floor",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. D. Poorna Kumar",
          email: "poornakumard@ksrct.ac.in",
          phone: "+91 90036 45614",
        },
        {
          name: "Mrs. C. Saranya",
          email: "saranyac@ksrct.ac.in",
          phone: "+91 99945 88990",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr. M. Suriya Prasanth",
          phone: "+91 94878 22144",
        },
        {
          name: "Ms. G.S. Harsha Prabha",
          phone: "+91 94422 18288",
        },
        {
          name: "Mr. R. Shanmugavel",
          phone: "+91 63695 31193",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-ft-1",
    shortTitle: "Paper Presentation",
    title: "PAPER PRESENTATION",
    description: "Green Innovation in Food Processing Techniques is a platform that celebrates ideas and innovations shaping the future of food. The conference brings together students, researchers, academicians, and industry professionals to explore eco-friendly solutions, safe food practices, and sustainable technologies in food processing. This event encourages creative thinking, knowledge sharing, and meaningful discussions on building a greener, healthier, and more sustainable food system.",
    img: Tech22,
    date: "February 13, 2026",
    venue: "Smart class room[Food Technology]",
    department: "Technical Events",
    price: "₹ 150 per participant",
    topics: [
      {
        title: "TOPICS:",
        description: [
          "Innovative Food Processing Techniques",
          "Sustainable & Green Food Technologies",
          "Future Foods and Alternative Protein Sources",
          "Food Safety and Fermentation Technologies",
          "Eco-friendly & Smart Food Packaging",
        ],
      },
    ],
    papersubmission: [
      {
        description: [
          "Paper Should be mailed to : foodvistaft@gmail.com"
        ],
      },
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
          amount: "₹1,500",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹1,000",
        },
      ],
    rules: [
      "Individual or team (up to 3 members) participation allowed",
      "Paper must be original and plagiarism-free",
      "Abstract (max 250 words) and full paper must be submitted before the deadline",
      "Abstract Submission Date:7 February",
      "Full Paper Submission Date:10 February",
      "8–10 minutes presentation + Q&A",
      "Judges' decision is final",
    ],
    schedule: [
      {
        
        date: "February 13, 2026",
        time: "9.00 AM to 2.00 PM",
        location: "Smart class room[Food Technology]",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. K.Balasubramani",
          phone: "+91 97892 52952",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr.Rajulapati Yatheeswar",
          phone: "+91 94412 36991",
        },
        {
          name: "Mr S.Yogeshwaran",
          phone: "+91 73052 13626",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "tech-ece1",
    shortTitle: "Paper Presentation",
    title: "PAPER PRESENTATION",
    description: "The field of Electronics and Communication Engineering is rapidly evolving with revolutionary trends such as 5G and upcoming 6G communication, Internet of Things (IoT), Artificial Intelligence in communication systems, and advanced embedded technologies. These innovations are transforming the way in high-speed connectivity, smart automation, and intelligent decision-making. Applications like smart cities, autonomous vehicles, healthcare monitoring, industrial automation, and next-generation wireless networks.",
    img: Tech23,
    date: "February 13, 2026",
    venue: "A112, A113 Smart Class Room (Main Building)",
    department: "Technical Events",
    price: "₹ 150 per participant",
    topics: [
      {
        title: "TOPICS:",
        description: [
          "Revolutionary Trends in Electronics and Communication Engineering",
        ],
      },
    ],
    papersubmission: [
      {
        description: [
          "Paper Should be mailed to : cafaceassociation@gmail.com"
        ],
      },
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
          amount: "₹1,500",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹1,000",
        },
      ],
    rules: [
      "Individual or team participation (maximum 2 members)",
      "Strict adherence to the allotted time",
      "Topics must align with the conference theme",
      "Original work only",
      "Professional conduct is expected throughout the event",
      "Judge's decisions will be final",
    ],
    schedule: [
      {
        
        date: "February 13, 2026",
        time: "9.00 AM to 2.00 PM",
        location: "A112, A113 Smart Class Room (Main Building)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. Jayamani S",
          email: "jayamani@ksrct.ac.in",
          phone: "+91 96292 97054",
        },
      ],
      studentCoordinator: [
        {
          name: "Naveen J",
          phone: "+91 90801 21928",
        },
      ],
    },
    registrationLink: "",
  },
   {
    id: "tech-cody",
    shortTitle: "Cody challenge  ",
    title: "Cody challenge  ",
    description: "It is an online, interactive game-based event designed to test MATLAB programming skills through puzzle-solving. It’s going to be conducted for 1 hour duration. Top 10 participants will be certified by MathWorks.",
    img: Tech24,
    date: "February 13, 2026",
    venue: " UiPath Laboratory, IT PARK",
    department: "Technical Events",
    price: "₹250",
    rules: [
      "Individual participant only accepted.",
      "System provided in Laboratory.",
      "Mobile phones, books, or external references are strictly prohibited.",
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
      




    slot: [
      "Slot 1 : 9:00 AM to 10.30 AM ",
      "Slot 2 : 11:00 AM to 12.30 PM ",
      "Slot 3 : 12:30 PM to 1:30 PM ",
    ],

    schedule: [
      {
        date: "February 13, 2026",
        time: "9:00 AM - 4:00 PM",
        location: " UiPath Laboratory, IT PARK",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: " Dr Nithya J",
          phone: "+91 94438 46125",
        },
        {
          name: "Ms Ramya R",
          phone: "+91 97879 03008",
        },
      ],
      studentCoordinator: [
        {
          name: "Dhanushri R  ",
          phone: "+91 95858 67766",
        },
        {
          name: "Dharshini U ",
          phone: "+91 63697 22563",
        },
        {
          name: "KiranKumar R",
          phone: "+91 84895 26160",
        },
      ],
    },
    importantNote: " https://tinyurl.com/KSR-DAKHA26",
    importantText: [
      "Do Register here after the completion of the payment to gain the access for MATLAB platform ",
    ],
    registrationLink: "",
  },



];
