
import workshop1 from "../assets/EventsImages/EventDetails/Workshop/aids_wk.webp";
import workshop2 from "../assets/EventsImages/EventDetails/Workshop/aiml_wk.webp";
import workshop3 from "../assets/EventsImages/EventDetails/Workshop/bt_wk.webp";
import workshop4 from "../assets/EventsImages/EventDetails/Workshop/civil_wk.webp";
import workshop5 from "../assets/EventsImages/EventDetails/Workshop/csbs_wk.webp";
import workshop6 from "../assets/EventsImages/EventDetails/Workshop/cse_wk.webp";
import workshop7 from "../assets/EventsImages/EventDetails/Workshop/ece_wk.webp";
import workshop8 from "../assets/EventsImages/EventDetails/Workshop/eee_wk.webp";
import workshop9 from "../assets/EventsImages/EventDetails/Workshop/ft_wk.webp";
import workshop10 from "../assets/EventsImages/EventDetails/Workshop/ipr_wk.webp";
import workshop11 from "../assets/EventsImages/EventDetails/Workshop/it_wk.webp";
import workshop12 from "../assets/EventsImages/EventDetails/Workshop/mct_wk.webp";
import workshop13 from "../assets/EventsImages/EventDetails/Workshop/mech_wk.webp";
import workshop14 from "../assets/EventsImages/EventDetails/Workshop/txt_wk.webp";
import workshop15 from "../assets/EventsImages/EventDetails/Workshop/vlsi_wk.webp";
import workshop16 from "../assets/EventsImages/EventDetails/Workshop/mca_wk.webp";
import workshop17 from "../assets/EventsImages/EventDetails/Workshop/math.webp";
import workshop18 from "../assets/EventsImages/EventDetails/Workshop/eee1.jpeg"; 


/* Workshop Events List
workshop-aids: Agentic AI
workshop -aiml: AI Arcade (AI tools for game development)
workshop-bt : Next Generation Sequencing Technologies
workshop- civil : BIM (Building Information Modeling)
workshop - civil Blockchain Beyond Crypto: Real-World Applications
workshop-cse: CyberStrike
workshop-ece: The Future of IoT: LoRaWAN with Artificial Intelligence
workshop-eee: EV- Retrofitting
workshop-ft: Sustainable Innovations in Food Processing Techniques
workshop-ipr: IPR
workshop-it: Github Essentials : Code Commit Collaborate
workshop-mct: Flight mode: ON
workshop-mca: Code, Click, Done: Mobile App Development in a day.
workshop-mech: Development of Next Gen vehicle
workshop-txt: AI Integrated Smart Medi Tech
workshop-vlsi: Chip2Test
*/


export const workshopEvents = [
  {
    image: workshop1,
    eventId: "workshop-aids",
    price: 300,
  },
  {
    image: workshop2,
    eventId: "workshop-aiml",
    price: 300,
  },
  {
    image: workshop10,
    eventId: "workshop-ipr",
    price: 300,
  },
  {
    image: workshop4,
    eventId: "workshop-civil",
    price: 300,
  },
  {
    image: workshop5,
    eventId: "workshop-csbs",
    price: 300,
  },
  {
    image: workshop6,
    eventId: "workshop-cse",
    price: 300,
  },
  {
    image: workshop7,
    eventId: "workshop-ece",
    price: 300,
  },
  {
    image: workshop8,
    eventId: "workshop-eee",
    price: 300,
  },
  {
    image: workshop9,
    eventId: "workshop-ft",
    price: 300,
  },
  {
    image: workshop3,
    eventId: "workshop-bt",
    price: 300,
  },
  {
    image: workshop11,
    eventId: "workshop-it",
    price: 300,
  },
  {
    image: workshop12,
    eventId: "workshop-mct",
    price: 300,
  },
  {
    image: workshop13,
    eventId: "workshop-mech",
    price: 300,
  },
  {
    image: workshop14,
    eventId: "workshop-txt",
    price: 300,
  },
  {
    image: workshop15,
    eventId: "workshop-vlsi",
    price: 300,
  },
  {
    image: workshop16,
    eventId: "workshop-mca",
    price: 300,
  },
  {
    image: workshop17,
    eventId: "workshop-math",
    price: 300,
  },
  {
    image: workshop18,
    eventId: "workshop-eee-1",
    price: 300,
  },
  
];

export const workshopDetails = [
  {
    id: "workshop-aids",
    shortTitle: "Agentic AI",
    title: "Agentic AI Workshop",
    description: "A one-day workshop on \"Agentic AI\" will introduce participants to intelligent AI agents capable of autonomous decision-making, planning, and real-world problem solving.Through expert talks and real-world use cases, participants will explore the architecture, applications, and future scope of Agentic AI across industries such as automation, robotics, and smart systems.",
    img: workshop1,
    date: "February 12, 2026",
    venue: "AB Lab 2(Academic Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        
        date: "February 12, 2026",
        time: "1 day",
        location: "AB Lab 2(Academic Block)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. S. Raja",
          phone: "+91 75028 21440",
        },
        {
          name: "Mrs. A. Eswari",
          phone: "+91 94431 81818",
        },
      ],
      studentCoordinator: [
        {
          name: "S. Balamurugan",
          phone: "+91 94877 07552",
        },
        {
          name: "D. Vedhaanthan",
          phone: "+91 8825722898",
        },
        {
          name: "A. Kayalvizhi",
          phone: "+91 80982 14368",
        },
        {
          name: "Nivethitha",
          phone: "+91 63804 46457",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-aiml",
    shortTitle: "AI Arcade",
    title: "AI Arcade (AI Tools for Game Development)",
    description: "Step into the AI Arcade and discover how AI tools can supercharge game development — build smarter, faster, and more creative games using cutting-edge AI tools.",
    img: workshop2,
    date: "February 12, 2026",
    venue: "AB Lab 1 , AB Lab 3 (Academic Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
       
        time: "1 Day",
        venue: "AB Lab 1 , AB Lab 3 (Academic Block)",
        registrationFee: "₹300",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Ms. M. Indumathi",
          designation: "Assistant Professor",
          phone: "+91 97152 47992",
        },
        {
          name: "Ms.R.P.Harshini",
          designation: "Assistant Professor",
          phone: "+91 9361446506",
        },
      ],
      studentCoordinator: [
        {
          name: "Jevithesh",
          year: "III Year",
          department: "CSE (AIML)",
          phone: "+91 80728 27232",
        },
        {
          name: "Hanish J",
          year: "II Year",
          department: "CSE (AIML)",
          phone: "+91 80728 13642",
        },
        {
          name: "Bharanidharan P",
          year: "I Year",
          department: "CSE (AIML)",
          phone: "+91 97892 82253",
        },
        {
          name: "Lesanth N",
          year: "III Year",
          department: "CSE (AIML)",
          phone: "+91 63856 43934",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-bt",
    shortTitle: "Next Gen Sequencing",
    title: "Next Generation Sequencing Technologies",
    description: "This workshop introduces Next-Generation Sequencing (NGS) technologies used in modern and future genomic and biomedical research. Participants gain industry-oriented knowledge on advanced sequencing platforms, workflows, and data analysis trends. The session connects molecular biology and genomics theory with real-time clinical, agricultural, and research applications.",
    img: workshop3,
    date: "February 12, 2026",
    venue: "Bio Tech Seminar Hall MBA Laboratory (Biotechnology Block 1st Floor MBA F Floor Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
       
        date: "February 12, 2026",
        time: "1 Day",
        location: "Bio Tech Seminar Hall MBA Laboratory (Biotechnology Block 1st Floor MBA F Floor Block)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Ms.S.Sathviga",
          designation: "Assistant Professor",
          phone: "+91 88702 76967",
        },
      ],
      studentCoordinator: [
        {
          name: "S. Raamprasaanth",
          year: "III Year",
          department: "Biotechnology",
          phone: "+91 88386 16292",
        },
        {
          name: "E.K.A. Lakshitha",
          year: "III Year",
          department: "Biotechnology",
          phone: "+91 90956 22122",
        },
        {
          name: "R. Hari",
          year: "III Year",
          department: "Biotechnology",
          phone: "+91 97512 39792",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-civil",
    shortTitle: "BIM",
    title: "BIM (Building Information Modeling)",
    description: "Master the future of construction in this BIM workshop, where 3D design meets intelligent data integration to streamline project lifecycles, improve collaboration, minimize structural errors, and build expertise using industry-standard tools for the digital transformation of the Architecture, Engineering, and Construction (ACE) industry.",
    img: workshop4,
    date: "February 12, 2026",
    venue: "MA108 Lecture Hall (MBA Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        location: "MA108 Lecture Hall (MBA Block)",
        time: "1 Day",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. S. Gunasekar",
          phone: "+91 99768 76238",
        },
      ],
      studentCoordinator: [
        {
          name: "S. Sandhiya",
          phone: "+91 96599 53151",
        },
        {
          name: "M. Keerthi Varshini",
          phone: "+91 88700 16266",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-csbs",
    shortTitle: "Blockchain Beyond Crypto",
    title: "Blockchain Beyond Crypto: Real-World Applications",
    description: "This workshop introduces blockchain technology beyond cryptocurrencies, focusing on real-world applications across industries such as supply chain management, healthcare, finance, governance, digital identity, and data security, while exploring how decentralization, transparency, and trust solve challenges in traditional systems through practical examples and discussions.",
    img: workshop5,
    date: "February 12, 2026",
    venue: "AB LAB-4 (Academic Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        
        location: "AB LAB-4 (Academic Block)",
        time: "1 Day",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mrs. T. Udhaya",
          designation: "Assistant Professor",
          phone: "+91 86755 87180",
        },
      ],
      studentCoordinator: [
        {
          name: "G. Abinithi",
          year: "III Year",
          department: "CSBS",
          phone: "+91 97872 02300",
        },
        {
          name: "B. Mahitha",
          year: "III Year",
          department: "CSBS",
          phone: "+91 93605 03971",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-cse",
    shortTitle: "CyberStrike",
    title: "CyberStrike - Cybersecurity Workshop",
    description: "CyberStrike is a high-impact hands-on cybersecurity workshop designed to introduce participants to the fundamentals of cybersecurity and real-world web application security. The event covers career insights, essential security concepts, and practical exposure to OWASP Top 10 vulnerabilities through live demonstrations and guided activities. Participants will learn how attacks happen, how to defend systems, and how to build secure applications with industry-relevant knowledge and techniques.",
    img: workshop6,
    date: "February 12, 2026",
    venue: "Bhumi Lab (IT Park)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
       
        location: "Bhumi Lab (IT Park)",
        time: "9:30 AM to 4:00 PM",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "S.Mithuna",
          department: "CSE",
          phone: "+91 99526 65042",
        },
      ],
      studentCoordinator: [
        {
          name: "K.L. Peranandha",
          phone: "+91 81485 37603",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-ece",
    shortTitle: "LoRaWAN with AI",
    title: "The Future of IoT: LoRaWAN with Artificial Intelligence",
    description: "The Future of IoT: LoRaWAN with Artificial Intelligence workshop by Enthu Technology Solutions India Pvt. Ltd. introduces participants to long-range, low-power IoT communication using LoRaWAN and its integration with AI. The session highlights real-world applications like smart cities, agriculture, and industrial automation through practical demonstrations and insights into intelligent IoT systems.",
    img: workshop7,
    date: "February 12, 2026",
    venue: "Embedded Lab (Main Building 1st Floor)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        
        location: "Embedded Lab (Main Building 1st Floor)",
        duration: "9:00 AM to 4:00 PM",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. Mohanraj AP",
          phone: "+91 80565 75711",
        },
      ],
      studentCoordinator: [
        {
          name: "Srinivasan P",
          phone: "+91 63833 19663",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-eee",
    shortTitle: "EV Retrofitting",
    title: "EV- Retrofitting",
    description: "The Workshop on EV Retrofitting is designed to provide participants with comprehensive knowledge of converting conventional internal combustion engine (ICE) vehicles into electric vehicles. This workshop focuses on fundamental principles, design considerations, and practical aspects involved in EV retrofitting, including motor selection, battery systems, power electronics, motor controllers, charging infrastructure, and safety standards.",
    img: workshop8,
    date: "February 12, 2026",
    venue: "Power Electronics and Drives Lab / EEE Computer Lab (1st Floor EEE M Block )",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        
        location: "Power Electronics and Drives Lab / EEE Computer Lab (1st Floor EEE M Block )",
        time: "2 Days",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. E. Chandrakumar",
          phone: "",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr. Sujaysarvesh D",
          phone: "+91 77087 58486",
        },
        {
          name: "Mr. Muhildharshan L",
          phone: "+91 95970 33919",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-ft",
    shortTitle: "Sustainable Food Processing",
    title: "Sustainable Innovation in Food Processing Techniques",
    description: "Students will actively engage in hands-on sessions to explore innovative and sustainable food processing techniques, focusing on waste reduction, energy efficiency, and value addition. Through live demonstrations and guided activities, participants will design, analyze, and improve food processing methods using eco-friendly practices, while collaborating to develop practical solutions for real-world food sustainability challenges.",
    img: workshop9,
    date: "February 12, 2026",
    venue: "Baking and Confectionery Laboratory (Food Technology Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
       
        location: "Baking and Confectionery Laboratory (Food Technology Block)",
        time: "1 Day",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. T.G.N. Nagarjun",
          phone: "+91 87543 94242",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms. R. Pavithra",
          phone: "+91 93458 94830",
        },
        {
          name: "Mr. V. Lithin Prasath",
          phone: "+91 97913 20244",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-ipr",
    shortTitle: "IPR",
    title: "Monetizing Your Idea through Intellectual Property Rights (IPR)",
    description: "This one-day workshop on \"Monetizing Your Idea through Intellectual Property Rights (IPR)\" focuses on helping students, innovators, and early-stage entrepreneurs understand how ideas can be converted into protected intellectual assets and commercially leveraged. The session covers the practical use of patents, copyrights, trademarks, and designs, explaining what can be protected, when to file, and how IPR directly supports revenue generation through licensing, technology transfer, product commercialization, and startup valuation.",
    img: workshop10,
    date: "February 12, 2026",
    venue: "PTC Conference Hall (PTC Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
       
        date: "12 February 2026",
        time: "9:00 AM to 4:00 PM",
        location: "PTC Conference Hall (PTC Block)",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. B. Mythili Gnanamangai",
          email: "mythilignanamangai@ksrct.ac.in",
          phone: "+91 94870 88678",
        },
      ],
      studentCoordinator: [
        {
          name: "Abinav S",
          phone: "+91 9342651164",
        },
        {
          name:"Nithin santhosh R",
          phone:"+91 7010273909",
        }
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-it",
    shortTitle: "Github Essentials",
    title: "Github Essentials: Code Commit Collaborate",
    description: "This hands-on workshop introduces college students to Git and GitHub for efficient version control and team-based development, covering repositories, commits, branching, merging, and conflict resolution through live demos and practice, while engaging participants in real-world workflows like collaboration and code reviews, ultimately preparing them to confidently use Git and GitHub for academic, internship, hackathon, and industry-level projects.",
    img: workshop11,
    date: "February 12, 2026",
    venue: "IT LAB 1 (IT Park)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        
        location: "IT LAB 1 (IT Park)",
        time: "1 Day",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. R.T. Dineshkumar",
          designation: "Assistant Professor",
          phone: "+91 99527 62214",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr. S. Deepan",
          phone: "8015441715",
        },
        {
          name: "Ms. P.D. Malathi",
          phone: "+91 80728 44465",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-mct",
    shortTitle: "Flight mode: ON",
    title: "Flight mode: ON - Drone Assembly Workshop",
    description: "Flight modes help control how a drone flies, making it safer and easier to operate. This workshop also includes simple drone assembly, covering basic parts, motor fixing, wiring, and controller setup.",
    img: workshop12,
    date: "February 12, 2026",
    venue: "PLC Laboratory (Ground Floor MCT J Block )",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
      
        location: "PLC Laboratory (Ground Floor MCT J Block )",
        time: "1 Day",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. S. HariPrasadh",
          phone: "+91 70928 21630",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr. G. Harish",
          phone: "+91 63829 05603",
        },
        {
          name: "Mr. V. Gowtham",
          phone: "+91 74484 28784",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-mech",
    shortTitle: "Next Gen Vehicle",
    title: "Development of Next Gen Vehicle",
    description: "This workshop introduces emerging technologies used in modern and future vehicles. Participants gain industry-oriented knowledge on advanced vehicle systems and design trends. The session connects engineering theory with real-time automotive applications.",
    img: workshop13,
    date: "February 12, 2026",
    venue: "Design Centre (Mechanical Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        
        location: "Design Centre (Mechanical Block)",
        time: "1 Day",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Dr. K. Raja",
          phone: "+91 98423 14481",
        },
        {
          name: "Mr. C. Ramesh",
          phone: " +91 96297 67778",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms. A. Harini",
          phone: "+91 63794 14177",
        },
        {
          name: "Mr. M. Marushini",
          phone: "+91 97869 04315",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-txt",
    shortTitle: "AI Smart Medi Tech",
    title: "AI Integrated Smart Medi Tech",
    description: "The workshop provides an introduction to AI concepts and their role in smart medical and healthcare technologies, along with an overview of medical textiles, smart fabrics, and sensor-integrated textile systems. Participants will gain exposure to AI-enabled health monitoring, diagnostics, and wearable medical applications through demonstrations and real-world case studies. The program also offers insights into emerging trends, innovations, and career opportunities in AI-driven medical textiles and healthcare technology.",
    img: workshop14,
    date: "February 12, 2026",
    venue: "Dr. Amartyasen Hall MBA Seminar Hall  (MBA F Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        
        location: "Dr. Amartyasen Hall MBA Seminar Hall  (MBA F Block)",
        time: "1 Day",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. G. Devanand",
          designation: "Assistant Professor",
          department: "Textile Technology",
          phone: "+91 99528 41869",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr. Hariharan S A",
          year: "III Year",
          department: "Textile Technology",
          phone: "+91 70921 02427",
        },
        {
          name: "Ms. Monika P T",
          year: "II Year",
          department: "Textile Technology",
          phone: "+91 93447 14198",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-vlsi",
    shortTitle: "Chip2Test",
    title: "Chip2Test - VLSI Design Workshop",
    description: "This hands-on workshop will guide students through the journey of VLSI design, from logic design to the implementation of test patterns using DFT techniques. Participants will gain practical experience in identifying faults, creating test strategies, and understanding how DFT ensures reliability and efficiency in modern chip design. By the end of the session, students will have a clear understanding of the role of DFT in bridging design and verification in real-world VLSI circuits.",
    img: workshop15,
    date: "February 12, 2026",
    venue: "VLSI Lab (MCT J Block)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
       
        location: "VLSI Lab (MCT J Block)",
        time: "9.00 AM to 4.00 PM",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. A. Suresh Kumar",
          designation: "Assistant Professor",
          phone: "+91 95003 71772",
          email: "sureshkumara@ksrct.ac.in",
        },
        {
          name: "Dr. P. Suthanthira Kumar",
          designation: "Assistant Professor",
          phone: "+91 95008 25738",
        },
      ],
      studentCoordinator: [
        {
          name: "Ms. S. Srikiruthika",
          phone: "+91 90422 31825",
        },
        {
          name: "Mr. S. Gowtham",
          year: "II Year",
          department: "Electronics Engineering (VLSIDT)",
          phone: "+91 97878 31624",
        },
        {
          name: "Ms. S. Kalaimagal",
          year: "II Year",
          department: "Electronics Engineering (VLSIDT)",
          phone: "+91 88706 71141",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-mca",
    shortTitle: "Mobile App Development",
    title: "Code, Click, Done: Mobile App Development in a Day",
    description: "Code, Click, Done is a hands-on mobile app development workshop designed to introduce participants to the fundamentals of building functional mobile applications in just one day. This tech event focuses on transforming ideas into real mobile apps through guided coding, interactive demonstrations, and practical exercises.",
    img: workshop16,
    date: "February 12, 2026",
    venue: "NET LAB (IT Park)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        
        location: "NET LAB (IT Park)",
        time: "9:30 AM to 4:00 PM",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr. MohanKumar R",
          department: "MCA",
          phone: "+91 97900 70708",
        },
      ],
      studentCoordinator: [
        {
          name: "SriNaveen R",
          year: "I Year",
          department: "MCA",
          phone: "+91 96064 22181",
        },
        {
          name: "Vikas M S",
          year: "I Year",
          department: "MCA",
          phone: "+91 63800 88208",
        },
        {
          name: "Madhumitha Devi Sri K",
          year: "I Year",
          department: "MCA",
          phone: "+91 78128 37347",
        },
        {
          name: "Suvetha S",
          year: "I Year",
          department: "MCA",
          phone: "+91 88077 37000",
        },
      ],
    },
    registrationLink: "",
  },
  {
    id: "workshop-math",
    shortTitle: "Empowering the Next Generation on Emerging Trends through  MATLAB & Simulink",
    title: "Empowering the Next Generation on Emerging Trends through MATLAB & Simulink",
    description: "This workshop provides an introduction to Artificial Intelligence, Machine Learning, Deep Learning, and Image Processing using MATLAB in a practical and easy-to-understand manner. Participants will learn how intelligent models are built, how neural networks are trained, and how images are processed and analysed. The session includes hands-on experience with real-time applications such as classification, prediction, object detection, along with applications in Electric Vehicles (EVs) and Robotics. ",
    img: workshop17,
    date: "February 12, 2026",
    venue: "UiPath Laboratory (IT Park)",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        
        location: "UiPath Laboratory (IT Park)",
        time: "1:00 PM to 4:30PM ",
        date: "February 12, 2026",
      },
    ],

    importantNote: "https://tinyurl.com/KSRCT-DAKSHAEvent",
    importantText: [
      "Do Register here after the completion of the payment to gain the access for mathlab platform ",
    ],

    contact: {
      facultyCoordinator: [
        {
          name: "Ms Ramya R",
          department: "Electronics Engineering",
          phone: "+91 97879 03008",
        },
      ],
      studentCoordinator: [
        {
          name: " Kirankumar R",
          year: "I Year",
          department: "MCA",
          phone: "+91 98489 526160",
        },
        {
          name: "Megavardhini L",
          year: "I Year",
          department: "MCA",
          phone: "+91 639942 339351",
        },
      ],
    },
    registrationLink: "",
  },
   {
    id: "workshop-eee-1",
    shortTitle: "IoT in System Engineering",
    title: "IoT in System Engineering",
    description: "The IoT System Engineering is a 1-day hands-on workshop conducted in collaboration with C-DAC Bangalore under the NASSCOM FutureSkills PRIME initiative. It provides practical exposure to IoT architecture, sensors, microcontrollers, communication protocols, and cloud integration using C-DAC's Ubimote IoT Laboratory Kits. The workshop equips participants with industry-relevant skills to develop real-time IoT applications and supports innovation for final-year projects and research.",
    img: workshop18,
    date: "February 12, 2026",
    venue: "CDAC’s CoE in IoT Applications (1st Floor EEE M Block )",
    department: "Workshop",
    price: "₹300 per member",
    schedule: [
      {
        location: "CDAC’s CoE in IoT Applications (1st Floor EEE M Block )",
        time: "9:00 AM to 4:00 PM",
        date: "February 12, 2026",
      },
    ],
    contact: {
      facultyCoordinator: [
        {
          name: "Mr Lt.E Chandra Kumar",
          department: "Electrical and Electronics Engineering",
          phone: "+91 93608 50480",
        },
      ],
      studentCoordinator: [
        {
          name: "Mr. Prithvirajan",
          year: "III Year",
          department: "EEE",
          phone: "+91 96291 60573",
        },
      ],
    },
    registrationLink: "",
  },

];
