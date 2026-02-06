import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "../../../supabase";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, ArrowLeft, Trophy, AlertTriangle } from "lucide-react"; 
import { useNavigate, useLocation } from "react-router-dom";
import { hackathonEvents } from "../../../data/hackathonEvents";

// Hackathon Events Content - Separate content for each event
export const hackathonEventDetails = {
  "hackathon-1": {
      id: "hackathon-1",
      title: "Neura-Hack 2.0 (36 Hours Hackathon)",
      date: "12th Feb - 13th Feb, 2026",
      venue: "IT LAB 1 (IT PARK)",
      registrationFee:" ₹ 500 per head.",
      registrationLink: "",
      description: "NeuraHack 2.O is where ideas are built, systems are broken, and security is redefined. Participants Hack, Defend, and Secure technology to shape the future of digital innovation.",
      rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹30,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹20,000",
        },
       
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹10,000",
        },
      ],
      lunchannouncement:[
        "Lunch and accommodation are Free for all participants during the hackathon.",
      ],
      
      /*rounds: [
        {
          title: "",
          description: [
            ,
          ],
        },
        {
          title: "",
          description: [
            
          ],
        },
      ], */
      rules: [
        "Each team shall consist of maximum of 4 members",
        "NeuraHack 2.O is a continuous 36-hour hackathon with no breaks in development time.",
        "A total of two (2) evaluation rounds will be conducted during the hackathon period.",
        "Participants must bring their own laptops, peripherals, and required accessories.",
        "At least one team member must be present and actively working at all times throughout the 36-hour duration.",
        "All solutions must be developed during the hackathon period only.",
        "The decision of the judging panel shall be final and binding.",
      ],
      schedule: [
        {
          date: "12th Feb - 13th Feb, 2026",
          time: "9:00 AM to 9:00 PM",
          location: "IT LAB 1 (IT PARK)",
        },
      ],

      contact: {
        facultyCoordinator: [
          {
            name: "Mr.S.VADIVEL",
            phone: "+91 97906 32171",
            email: "vadivels@ksrct.ac.in",
          },
        ],
        studentCoordinator: [
          {
            name: "Mr.A.SHANMUGESHWARA",
            phone: "+91 94871 19381",
          },
        ],
      },
    },
    "hackathon-2": {
      id: "hackathon-2",
      title: "BioNexathon 2026 (24 Hours Hackathon)",
      date: "February 13 2026 to February 14, 2026",
      registrationFee : " ₹ 500 per head.",
      venue: "Dr. M.S. Swaminathan Biotech Seminar Hall",
      description: "A platform for students, researchers, and professionals to present and discuss recent advancements in biotechnology. Includes keynote lectures, panel discussions, and interactive sessions. Focus on innovation, research impact, and interdisciplinary collaboration. Encourages networking and knowledge exchange among participants.",
      eligibility: {
        categories: [
          "Open to UG, PG, Ph.D., & Research Scholars",
          "Students from Biotechnology, Life Sciences, Bioinformatics, Biomedical, Chemical, Environmental and allied disciplines",
        ],
        teamSize: {
          minimum: 1,
          maximum: 3,
          note: "Interdisciplinary teams are encouraged"
        }
      },
      theme: {
        primary: "Forge the Future of Science & Technology",
        details: [
          "Open to all Life Science students",
          "Interdisciplinary participation is allowed and encouraged"
        ]
      },
      rewards: [
         {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹5,000",
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
        lunchannouncement:[
        "Lunch and accommodation are Free for all participants during the hackathon.",
      ],
      rounds: [
        {
          title: "Topics",
          description: [
            "Biotechnology and Life Sciences",
            "Forge the Future of Science & Technology.",
            "Open to all Life Science students.",
            "Interdisciplinary participation is allowed and encouraged.",

          ],
        },
        {
          title: "",
        },
      ],
      rules: [
        "All team members must be present during the event.",
        "Core idea, logic and scientific justification must be human-driven.",
        "Use of pre-built or plagiarized solutions is strictly prohibited.",
        "Any form of misconduct, cheating or rule violation will lead to disqualification.",
        "Each Team will be allocated a specific time slot; time limits must be strictly followed.",
        "Teams must follow all instructions given by event coordinators.",
        "Fully AI-generated solutions or presentations are not allowed.",
        "Teams must clearly explain how AI tools were used, if applicable.",
        "Organizers and judges decisions regarding presentations, sessions, and awards will be final.",
      ],      prototypeGuidelines: {
        title: "Prototype & Solution Guidelines",
        format: [
          "Conceptual model",
          "Experimental workflow",
          "Computational model",
          "Design prototype or proof-of-concept"
        ],
        requirements: [
          "Scientifically valid",
          "Feasible and scalable",
          "Ethically sound and safe"
        ]
      },
      presentationRules: {
        title: "Presentation Rules",
        rules: [
          "Each team will be given 5–7 minutes for presentation.",
          "2–3 minutes will be allotted for Q&A.",
          "Presentation can be done in English or Tamil or Bilingual.",
          "The presentation must strictly follow the format provided by the organizers.",
          "No modification, addition, or rearrangement of slides beyond the given format is allowed.",
          "Failure to adhere to the prescribed presentation format may lead to point deduction or disqualification."
        ]
      },
      judgingCriteria: {
        title: "Judging Criteria",
        criteria: [
          {
            aspect: "Scientific Understanding & Accuracy",
            percentage: "30%"
          },
          {
            aspect: "Innovation & Originality",
            percentage: "25%"
          },
          {
            aspect: "Feasibility & Practical Application",
            percentage: "20%"
          },
          {
            aspect: "Presentation & Communication",
            percentage: "15%"
          },
          {
            aspect: "Teamwork & Approach",
            percentage: "10%"
          }
        ]
      },      schedule: [
        {
          round: "Venue",
          date: "February 13 2026 to February 14, 2026",
          time: "24 hours",
          location: "Dr. M.S. Swaminathan Biotech Seminar Hall",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. G. Ayyappadasan",
            phone: "+91 99445 28382",
            
          },
        ],
        studentCoordinator: [
          {
            name: "Mr. D Hariharasudhan",
            phone: "+91 98428 25230",
          },
          {
            name: "Mr. P. Nishaanth",
            phone: "+91 98434 93094",
          },
          {
            name: "Mr. M. Karunamurthy",
            phone: "+91 89252 43072",
          },
        ],
      },
    },
    "hackathon-3": {
      id: "hackathon-3",
      title: "Neura Code 2.O - Relay Edition",
      date: "February 13 2026 ",
      venue: "Bhumi Lab (IT PARK)",
      registrationFee:" ₹ 300 per head.",
      registrationLink: " ",
      description: "Relay Edition is a solo-based web design challenge where a reference website design is provided. Team members take turns recreating the design, building upon the previous member’s work without restarting. Creativity, accuracy, and teamwork determine the final output.",
      rewards: [
        {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹5,000",
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
      challenge: [
        {
          title: "Round-1",
          description: [
            "Teams are given a faulty front-end codebase containing intentional logical, syntactical, and UI errors.",
            "The goal is to debug and make the website functionally correct and visually accurate within the time limit. ",
            

          ],
        },
        {
          title: "Round-2",
          description: [
            "“See once. Build from memory.”",
            "A live website is shown for 120 seconds",
            "No screenshots / no notes",
            
          ],
        },
        {
          title: "Round-3",
          description: [
            "Total time: 45 minutes",
            "Coding happens one after another",
           

          ],
        },
        {
          title: "Task Details",
          description: [
            "A surprise website design is provided",
          "Teams must recreate the design as accurately as possible",
          ],
        }
      ],
      rules: [
        "Mandatory CSS Grid",
        "Semantic tags required (header, main, section, footer)",
        "No frameworks (Bootstrap, Tailwind )",
        "All members must be present during all rounds",
        "Participants must bring their own laptop",
        "Required software must be pre-installed (VS Code / browser)",
        "Plagiarism or copying from other teams will result in immediate disqualification"
      ],
      schedule: [
        {
          date: "February 13, 2026",
          time: "09:00 AM",
          location: "Bhumi Lab (IT PARK)",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr.P.Dineshkumar",
            
          },
        ],
        studentCoordinator: [
          {
            name: "Ms.G.Kari Vikashini",
            phone: "+91 93845 25869",
          },
         {
            name: "Mr.M.Osborn Jeremiah",
            phone: "+91 96006 13985",
         },
        ],
      },
    },
    "hackathon-4": {
      id: "hackathon-4",
      title: "24-Hour Vibe Coding Hackathon",
      date: "February 13, 2026",
      venue: "UI Path Lab (IT PARK)",
      registrationFee:" ₹ 500 per head.",
      description: "The 24-Hour Vibe Coding Hackathon is an intensive, creativity-driven coding event where participants design and prototype real-world software solutions using Lovable AI. The hackathon emphasizes problem-first thinking, rapid iteration, and meaningful impact rather than product pitching or hardware-based development.Participants will receive problem statements on the spot and are expected to ideate, build, and present a working solution within 24 hours using limited AI credits—encouraging smart, intentional, and efficient development",
      rewards: [
        {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹10,000",
        },
        {
          position: "2nd Prize",
          emoji: "🥈",
          amount: "₹7,500",
        },
        {
          position: "3rd Prize",
          emoji: "🥉",
          amount: "₹5,000",
        },
      ],
       lunchannouncement:[
        "lunch and accommodation are Free for all participants during the hackathon.",
      ],
      rounds: [
        {
          title: "Themes",
          description: [
            "Industry-Specific",
            "Social & Community Impact",
            "Education & Upskilling",
            "Open Innovation",
          ],
        },
        {
          title: "Round -1 : Mid Evaluation (Checkpoint)",
          description: [
            "Review of progress and direction",
            "Feedback-oriented and non-eliminatory",
          ],},
          {
            title: "Round -2 :Final Presentation",  
            description: [
              "Final project demo and presentation",
              "Comprehensive assessment of the solution",],
            
        },
      ],
       submissionRequirements: [
  " A working prototype or functional demonstration",
  "A brief description covering the problem statement",
  "A brief description covering the solution approach",
  "A brief description covering the target audience",
  "A brief description covering the expected impact"
],

      rules: [
        "Teams must consist of 2-4 members.",
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
          
          date: "February 13, 2026",
          time: "09:00 AM",
          location: "UI Path Lab (IT PARK)",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. S.Insol Rajasekar",
            phone: "+91 82205 12436",
            
          },
          {
            name: "Mr.K.Praveen",
            phone: "+91 95009 18101",
           
          },
        ],
        studentCoordinator: [
          {
            name: "Ms.Dhinesha",
            phone: "+91 99426 87393",
          },
          {
            name: "Ms.R.Monika",
            phone: "+91 93636 07816",
          },
          {
            name: "Mr.D.Adith",
            phone: "+91 70942 78374",
          },
          {
            name: "Mr.M.Madhukumar",
            phone: "+91 97914 41235",
          },
        ],
      },
    },
    "hackathon-5": {
      id: "hackathon-5",
      title: "Startup Pitch 2026",
      date: "13.02.2026",
      venue: "PTC Seminar Hall ",
      registrationFee : " ₹ 250 per head.(Without Food)",
      description: "The StartUp Pitch Event, organized by the Entrepreneurship Development Cell (EDC), aims to encourage students to ideate, innovate, and present impactful startup solutions in emerging technology domains such as automation, robotics, artificial intelligence, smart manufacturing, and intelligent systems. The event provides a platform for participants to showcase how modern development principles integrated with AI-driven technologies can be applied to solve real-world industrial and societal challenges. Students are expected to focus on innovation, technical feasibility, scalability, and real-time impact, while demonstrating entrepreneurial thinking and problem-solving skills. ",
      rewards: [
        {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹3,000",
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
      challenge: [
        {
          title: "Round-1",
          description: [
            "Registration and idea submission should before 09/02/2026, 12:00 pm , and send the idea to this mail id : msme@ksrct.ac.in",

          ],
        },
        {
          title: "Round-2",
          description: [
            "Initial screening. The selected teams are call for pitching. Intimation through mail before  11/02/2026 , 4 pm. The rejected teams are intimate through mail with commends.",
          ],
        },
        {
          title: "Round-3",
          description:[
            "Final Pitching on 13/02/2026 , the top 10 teams will be recommended for 3 lakhs seed fund in  EDII-TN, TN-IVP ",
            "EDII-TN-IVP, knowledge partner Review @KSRCT",
          ],
        },
        {
          title: "PPT should be align with",
          description:[
            "Innovation , Uniqueness, Scalability, Revenue Model, Impact on SGD , ESG, Rural development",
            "Total number of slide : Maximum 10",
          ],
        }
        
      ],
      rules: [
        "Teams must consist of 1-3 members.",
        "Max 10 slides are allowed for the presentation.",
        "4 min presentation + 3 min Q&A per team.",
        

      ],
      schedule: [
        {
         
          date: "13.02.2026",
          time: "9:00 AM to 4:00PM",
          location: "PTC Seminar Hall ",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. N. Tiruvenkadam ",
            
          },
        ],
        studentCoordinator: [
          {
            name: "Ms. H. Ainul Zuvairia",
            
          },
          {
            name:"Ms. A. Shrimathi ",
            
          },
          {
            name:"Mr. M. Barath Kumar ",
            phone: "+91 80123 55633",
          },
          {
            name:"Mr. K. Vijayachandran ",
            phone: "+91 73971 81421",
          }
        ],
      },
    },
    "hackathon-6": {
      id: "hackathon-6",
      title: "Designathon 2026",
      date: "February 13, 2026",
      registrationFee:" ₹ 300  per head.",
      venue: "DESIGN CENTER (Mechanical Block)",
      description: " This Designathon is centered on the innovative use of Computer-Aided Design (CAD) tools to create, redesign, and optimize mechanical components and systems for modern engineering applications. The event provides a creative and technical platform for Mechanical Engineering students to transform ideas into precise digital models using industry-standard CAD software.Participants will apply design thinking principles to develop concepts, create 3D models, perform assemblies, and generate engineering drawings while considering functionality, manufacturability, material selection, and sustainability. The Designathon encourages students to rethink conventional designs and propose efficient, lightweight, and cost-effective solutions through advanced CAD modeling techniques. ",
      rewards: [
        {
          position: "1st Prize",
          emoji: "🥇",
          amount: "₹1,500",
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
     
      rules: [
        "All designs must be original and created during the Designathon period. ",
      "	Participants must use CAD tools only for modeling, assembly, and detailing. ",
      	"Pre-designed or previously submitted models will not be accepted. ",
      "The problem statement / theme will be announced at the start of the event. ",
      "Participants must adhere to the time limits specified for each phase of the Designathon.",
      "Teams are allowed to seek guidance only from assigned mentors. ",
      "Design solutions should consider",
      "Functionality o Manufacturability o Material selection o Cost and sustainability ",
      "Final submission must include: o 3D CAD models ",
      "Assembly (if applicable) ",
      "	Engineering drawings (minimum required views) o Design explanation / presentation ",
      "	Any form of plagiarism or rule violation will lead to immediate disqualification." ,
      "Judges’ decisions will be final and binding. ",
      "	The organizing committee reserves the right to modify rules if necessary. ",

      ],
      schedule: [
        {
         
          date: "February 13, 2026",
          time: "09:00 AM",
          location: "DESIGN CENTER (Mechanical Block)",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr.K.Santhanam",
            phone: " +91 98428 87155",
           
          },
           {
            name: "Mr.P.Prasanth",
            phone: "+91 97882 06877",
            
          },
        ],
        studentCoordinator: [
          {
            name: "Mr.G.S.Priyan",
            phone: "+91 86680 57985",
            
          },
            {
            name: "Mr. S.Vijayaragavan",
            phone: "+91 81245 47760",
            
          },
            {
            name: "Ms. M.Nabishka",
            phone: "+91 90254 65388",
            
          },
        ],
      },
    },

    "hackathon-7": {
      id: "hackathon-7",
      title: "PCBathon ",
      date: "12th Feb (9.30AM to 8.00PM) & 13th Feb 2026(9:30AM to 2:30PM)",
      venue: "IDEAL Lab (Main Building)",
      registrationFee:" ₹ 500 per head.",
      registrationLink: "",
      description: "  This technical event will focus on designing and creating an innovative approach to redesigning and reconfiguring printed circuit board (PCB) modules that power the electronics of tomorrow. This is a fantastic opportunity for everyone, especially students, to combine creativity with technical expertise. Participating in this hackathon will help you unlock the Embedded Hardware Developer within you, and you may also get a  chance to join our team! Dive into the world of Embedded Hardware Development and showcase your ability to create cutting-edge, efficient circuit designs.",
      
      
       


      notable: [
        {
          title: "1st Prize",
          description: [
            "INR 5,000 Winning prize for the Team. Two month Internship with stipend (Rs.5000 per Month) at Mindnics Private Limited to develop the design as product. Product development cost will be borne by Mindnics Private Limited"
          ],
        },{
          title: "2nd Prize",
          description: [
            " •	2nd Position – INR 2,000 Winning prize for the Team. Two month Internship without stipend at Mindnics Private Limited to develop the design as product. Product development cost will be borne by Mindnics Private Limited"
          ],
        },{
          title: "3rd Prize",
          description: [
            "INR 1,000 Winning prize for the Team."
          ],
        }
      ], 


      challenge: [
        {
          title: "Round 1",
          description: [
            "Based on the performance, Participants will be short listed for further rounds."
          ]
        },
      ],
       lunchannouncement:[
        "Lunch and accommodation are Free for all participants during the hackathon.",
      ],
       eligibility: {
        categories: [
          "Students who want to pursue a career in Hardware Development, Electronics Engineers, and Tech enthusiasts.",
        "Have a profound knowledge of Electronic components, PCB designing knowledge, path routing, and Antenna understating.  ",],
      },

      problemstatement:[
        "4-20mA Communication Receiver",
        "4-20mA Communication Transmitter",  
        "0-10V Communication Receiver",  
        "0-10V Communication Transmitter",  
        "RS485 Transceiver",
        "GSM interface (only interface lines)",
        "GPS interface (only interface lines)",
        "Wi-Fi communication",
      ],

      rules: [
        "2 students per team. Team members may be from different departments or different institutions are allowed.",
        "Teams are instructed to use any Open-source software or student licenced software can be used for Schematic and PCB design. Online tools and Crack version software are strictly prohibited.",
        "Evaluation is done by the quality of the design and skills only. Not by the proficiency of tools  usage.", 
        "Only SMD components are allowed for designing. Through-hole components maybe allowed for some components such as connectors where mechanical strength required. ",
        "Clearly understand the problem before diving into solutions. ",
        "This Challenge involves Schematic Designing, Library Creation, PCB Designing, Footprint assignment. Adhere to ethical practices.",
        "Usage of AI in any form is strictly prohibited. If any teams identified the using of AI will be disqualified immediately at any stage of the hackathon.  ",
        "Participants are required to give an interactive demonstration of their design",
        "Ensure that your PCB marking and connection are well-commented and organized.",
        "You cannot use hackathon work/development/code and any other material related to assessment or evaluation other than this event.",
      ],
      schedule: [
        {
          date: "12th Feb - 13th Feb, 2026",
          time: "Day1 (9.30AM to 8.00PM) & Day2 (9:30AM to 2:30)",
          location: "IDEAL Lab (Main Building)",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Mr. Rajavenkatesan T ",
            phone: "+91 94455 77142",
          },
          {
            name:"Mr. Raguvaran K ",
            phone: " +91 99946 66307"
          }
        ],
        studentCoordinator: [
          {
            name: " Iniyavan S  ",
            phone: "+91 963748 84010",
          },
          {
            name: "Dinesh V ",
            phone: "+91 63790 02495",
          }
        ],
      },
    },

    "hackathon-8": {
      id: "hackathon-8",
      title: "Cloudathon ",
      date: "13 February 2026",
      venue: "Shine Lab (IT PARK)",
      registrationFee:" ₹ 500 per head.",
      registrationLink: "",
      description: "CLOUDATHON is a high-energy, hands-on cloud hackathon where ideas turn into scalable, real-world solutions. Build, deploy, and optimize cloud-powered applications while tackling today’s most exciting tech challenges. ",  
      challenge: [
        {
          title: "Round 1 – Idea Submission",
          description: [
            "Problem statement selection",
            "Concept proposal (abstract + solution outline)",
            "Screening by jury",
          ],
        },
        {
          title: "Round 2 – Hackathon Development",
          description: [
            "Prototype / model / simulation / app / design",
            "Mentor interaction",
            "Progress evaluation",
          ]
        },
        {
          title: "Final Round – Presentation",
          description: [
            "5–7 minute pitch",
            "Demo or working model",
            "Jury Q&A",
          ]
        }
      ], 
      eligibility: {
        categories: [
          "Each team must consist of maximum 2 members",
          "All members should belong to the same college or institution",
          "One member must be designated as the Team Leader",
        ],
      },

      theme: {
        details: [
          "Artificial Intelligence & Machine Learning (AI/ML)",
          "Internet of Things (IoT)",
          "Data Analytics & Big Data",
          "DevOps, Automation & Cloud Optimization"
        ]
      },

      rules: [
        "Participants must bring their own laptop and required software must be pre-installed ",
        "Participants must have atleast free-tier account in AWS/GCP/Azure Cloud",
        "All submissions must be original and team-created",
        "Plagiarism, copied ideas, or pre-built projects will lead to immediate disqualification",
        "Participants must maintain professionalism and ethical conduct"
            ],
      schedule: [
        {
          date: "13 February 2026",
          time: "9:00 AM to 4:00 PM",
          location: "Shine Lab (IT PARK)",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. Tamilarasi M ",
            phone: "+91 97500 37023",
          },
          {
            name:"Dr. Sangeetha M ",
            phone: " +91 99946 70017"
            
          }
        ],
        studentCoordinator: [
          {
            name: " Rasikashree S  ",
            phone: "+91 94422 90033",
          },
          {
            name: "Ashmitha B  ",
            phone: "+91 90437 14619",
          },
          {
          name: "Vishak S ",
          phone: "+91 93441 75500",
          },
        ],
      },
    },
    "hackathon-9": {
      id: "hackathon-9",
      title: "Sustainathon – Hackathon for Sustainable Development Goals (SDG) ",
      date: "13 February 2026",
      venue: " ",
      registrationFee:" ₹ 500 per head.",
      registrationLink: "",
      description: "Sustainathon is a problem-solving hackathon focused on creating innovative, practical, and scalable solutions aligned with the United Nations Sustainable Development Goals (SDGs). Participants will work in teams to design technology-driven or social-impact solutions addressing real-world sustainability challenges.",
    
      challenge: [
        {
          title: "Round 1 : : Idea Submission",
          description: [
            "Each team must submit the idea clearly outlining:",
            "Problem statement",
            "Proposed solution",
            "Cloud technologies to be used",
            "Feasibility and real-world impact",
            "Innovation and uniqueness",
          ],
        },
        {
          title: "Round 2 : Cloud Build & Demo Round",
          description: [
            "In this round, teams are expected to design, implement, and demonstrate their proposed solution using cloud technologies.",
            "Build a cloud-based prototype or working model",
            "Use cloud services such as compute, storage, databases, APIs, serverless, etc.",
            "Integrate supporting technologies (if applicable)",  
            "AI/ML, IoT, Data Analytics, Automation, Security, etc.",
            "Demonstrate scalability or cloud advantages",
            "Auto-scaling, pay-as-you-go, remote access, performance, or availability"
          ]
        }
      ],
      eligibility: {
        categories: [
          "Each team must consist of exactly 2 members",
          "Interdisciplinary teams are encouraged",
          "One member will act as the team lead",
          "A participant can join only one team",
        ],
      },

      theme: {
        details: [
          "Clean Water and Sanitation",
          "Affordable and Clean Energy",
          "Sustainable Cities and Communities",
          "Climate Action",
          "Life on Land / Life Below Water",
          "Quality Education",
          "Good Health and Well-being",
          "Industry, Innovation & Infrastructure",
          "No Poverty",
          "Any SDG-aligned sustainability challenge"
        ]
      },

      rules: [
        "Teams must work only on SDG-related problems",
        "Ideas must be original and not previously published",
        "Plagiarism will lead to disqualification",
        "Teams must submit all deliverables within deadlines",
        "Use of open-source tools is allowed",
        "Internet access allowed for research only",
        "Judges' decision will be final",
        "Teams must maintain ethical and respectful conduct",
        "Late submissions will not be accepted",
        "Any hardware/software must be arranged by the team"
            ],
      schedule: [
        {
          date: "13 February 2026",
          time: "9:00 AM to 4:00 PM",
          location: "",
        },
      ],
      contact: {
        facultyCoordinator: [
          {
            name: "Dr. K Mahalakshmi",
            phone: "+91 9944286457",
          },
          {
            name: "Ms. S. Jaividhya",
            phone: "+91 9585304763",
          },
          {
            name: "Dr. K. Balasubramani",
            phone: "+91 9789252952",
          }
        ],
        studentCoordinator: [
          {
            name: " ",
            phone: "",
          },
        ],
      },
    },


  };

const HackathonSection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Extract event ID from the current pathname
  const rawEventId = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/event/hackathon-1')) return 'hackathon-1';
    if (path.includes('/event/hackathon-2')) return 'hackathon-2';
    if (path.includes('/event/hackathon-3')) return 'hackathon-3';
    if (path.includes('/event/hackathon-4')) return 'hackathon-4';
    if (path.includes('/event/hackathon-5')) return 'hackathon-5';
    if (path.includes('/event/hackathon-6')) return 'hackathon-6';
    return 'hackathon-1'; // default fallback
  }, [location.pathname]);
  
  // Find the correct hackathon event by eventId
  const currentHackathonEvent = useMemo(() => {
    return hackathonEvents.find(event => event.eventId === rawEventId) || hackathonEvents[0];
  }, [rawEventId]);
  
  const event = hackathonEventDetails[rawEventId] || hackathonEventDetails["hackathon-1"];

  const [openRound, setOpenRound] = useState(null);

  const toggleRound = (round) => {
    setOpenRound(openRound === round ? null : round);
  };

  // Check if rounds has valid data
  const hasRounds = () => {
    return event.rounds && Array.isArray(event.rounds) && event.rounds.length > 0 && event.rounds.some(round => round.title && round.title.trim() !== '');
  };

  const handleRegisterClick = () => {
    console.log('🎫 Hackathon Register click - user:', user ? 'logged in' : 'not logged in');
    console.log('🎫 rawEventId:', rawEventId);
    
    if (!user) {
      // Not logged in - redirect to login with query params for registration intent
      console.log('🔐 Redirecting to login with register=true, eventId:', rawEventId);
      navigate(`/login?register=true&eventId=${encodeURIComponent(rawEventId)}`);
      return;
    }
    // Logged in - redirect to registration page, skip to event selection
    navigate('/register-events', { state: { selectedEventId: rawEventId, skipToEventSelection: true } });
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

  // Load Animation
  const loadAnimation = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const navigationItems = useMemo(() => {
    const items = [{ label: "Rewards", target: "Rewards" }];

    if (hasRounds()) {
      items.push({ label: "Rounds", target: "Rounds" });
    }

    if (event.submissionRequirements?.length) {
      items.push({ label: "Submission Requirements", target: "SubmissionRequirements" });
    }

    items.push(
      { label: "Rules", target: "Rules" },
      { label: "Schedule", target: "Schedule" },
      { label: "Contact", target: "Contact" }
    );

    return items;
  }, [event]);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      transition="transition"
      variants={loadAnimation}
      className="p-4 md:p-10 mt-24 text-white min-h-screen"
    >
      <button 
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
      >
        <ArrowLeft size={20} />
        Back
      </button>
      <div className="max-w-4xl mx-auto text-white p-4 md:p-6">
        <div className="flex justify-center items-center mb-7 md:gap-5 gap-2">
          <h1 className="text-2xl md:text-5xl font-bold text-center text-[#9DD3FF]">
            {event.title}
          </h1>
        </div>
        <div className="border border-sky-800 p-2">
          <div className="text-center clip-bottom-right flex flex-col gap-4 p-4 md:p-10 items-center bg-sky-900/20">
            <img
              src={currentHackathonEvent.image}
              alt={event.title}
              className="w-40 h-40 md:w-96 md:h-96 object-cover mb-4 shadow-md"
            />
            <p className="text-lg md:text-xl mb-4 text-sky-600 text-justify">
              {event.description}
            </p>
            
            <p className="text-xl font-bold text-yellow-400 animate-pulse">
              Registration Begins on 27-01-2026
            </p>

            {(Array.isArray(event.lunchannouncement)
              ? event.lunchannouncement.length > 0
              : Boolean(event.lunchannouncement)) && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mt-4 mb-2 w-full max-w-2xl">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-yellow-400 font-semibold text-sm">Note:</span>
                </div>
                {Array.isArray(event.lunchannouncement) ? (
                  <ul className="list-disc pl-6 text-yellow-300 text-sm mt-1 ml-1 space-y-1">
                    {event.lunchannouncement.map((note, index) => (
                      <li key={index} className="break-words">
                        {note}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-yellow-300 text-sm mt-1 ml-7 break-words">
                    {event.lunchannouncement}
                  </p>
                )}
              </div>
            )}

            {/* Register Now Button */}
            <motion.button
              className="mb-4 w-60 md:w-auto px-6 py-3 bg-primary clip bg-opacity-70 border-2 border-primary-dark hover:bg-primary-dark transition-all text-white font-semibold text-xl shadow-xl"
              whileHover={{ scale: 1.1, rotate: 2 }}
              whileTap={{ scale: 0.9 }}
              variants={pulseAnimation} // Infinite pulsing animation
              animate="animate" // Ensure the animation is always running
              onClick={() => handleRegisterClick()} // Open registration link in a new tab
            >
              {user ? 'REGISTER NOW!' : 'SIGN IN TO REGISTER'}
            </motion.button>
          </div>
        </div>

        {/* Rest of the content */}
        <div className="flex flex-col md:flex-row justify-center my-10 gap-4">
          {navigationItems.map((item) => (
            <motion.div
              key={item.target}
              className="border-2 border-primary-dark p-1"
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                const element = document.getElementById(item.target);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                } else {
                  console.log("Not found");
                }
              }}
            >
              <h1 className="bg-primary-dark cursor-default px-4 md:px-10 py-3 text-primary bg-opacity-80 clip-bottom-right-2">
                {item.label}
              </h1>
            </motion.div>
          ))}
        </div>

        {/* Problem Statements<div className="border border-primary-dark p-2 mb-6 " id="PS">
          <div className="flex flex-col gap-8  border p-4  border-primary-dark bg-primary-dark/30">
            <p className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
              Problem Statements
            </p>

            {eventDetails?.descriptions?.map((desc, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-col gap-3 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <p className="text-primary text-xl font-semibold">
                  {desc.heading}
                </p>
                <p className="font-semibold">Problem Statement:</p>
                <p className="text-primary border border-primary-dark p-4">
                  {desc.desc}
                </p>
              </div>
            ))}
          </div>
        </div> */}
        {/*  */}
        {/* Eligibility Section */}
        {event.eligibility && (
          <div className="border border-primary-dark p-2 mb-5" id="Eligibility">
            <div className="border border-primary-dark shadow-lg p-4 md:p-10">
              <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
                Eligibility
              </h2>
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-primary mb-3">
                    Categories
                  </h3>
                  <ul className="list-disc pl-6 text-lg md:text-xl text-primary">
                    {event.eligibility.categories.map((category, index) => (
                      <li key={index}>{category}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-primary mb-3">
                    Team Size
                  </h3>
                  <p className="text-lg md:text-xl text-primary mb-2">
                    Minimum Members: <span className="font-semibold">{event.eligibility.teamSize.minimum}</span>
                  </p>
                  <p className="text-lg md:text-xl text-primary mb-2">
                    Maximum Members: <span className="font-semibold">{event.eligibility.teamSize.maximum}</span>
                  </p>
                  <p className="text-lg md:text-xl text-primary">
                    {event.eligibility.teamSize.note}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards and Recognition Section */}
        <div className="border border-primary-dark p-2 mb-5 " id="Rewards">
          <div className="border border-primary-dark shadow-lg p-4 md:p-10">
            <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
              Rewards and Recognition
            </h2>

            {/* Podium Prize Layout */}
            <div className="flex justify-center items-end gap-4 sm:gap-8 px-4">
              {event.rewards && (() => {
                // Create podium order: 2nd, 1st, 3rd (traditional podium layout)
                const first = event.rewards.find(r => r.position.includes('1st'));
                const second = event.rewards.find(r => r.position.includes('2nd'));
                const third = event.rewards.find(r => r.position.includes('3rd'));
                const orderedRewards = [second, first, third].filter(Boolean);
                
                return orderedRewards.map((reward, index) => {
                  const isFirst = reward.position.includes('1st');
                  const isSecond = reward.position.includes('2nd');
                  const isThird = reward.position.includes('3rd');
                  
                  const trophySize = isFirst ? 'w-20 h-20 sm:w-28 sm:h-28' : isSecond ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14 sm:w-16 sm:h-16';
                  const trophyColor = isFirst ? 'text-yellow-400' : isSecond ? 'text-gray-300' : 'text-orange-400';
                  const podiumSize = isFirst ? 'w-28 sm:w-40 h-44 sm:h-56' : isSecond ? 'w-24 sm:w-32 h-32 sm:h-40' : 'w-20 sm:w-28 h-24 sm:h-32';
                  const numberSize = isFirst ? 'text-5xl sm:text-6xl' : isSecond ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl';
                  const position = isFirst ? '1' : isSecond ? '2' : '3';
                  
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                      className="flex flex-col items-center"
                    >
                      <Trophy className={`${trophySize} mb-3 ${trophyColor}`} />
                      <div className={`bg-cyan-500/80 ${podiumSize} flex flex-col items-center justify-center rounded-t-lg`}>
                        <span className={`text-white ${numberSize} font-bold`}>{position}</span>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>

            {/* Prize Details Below Podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {event.rewards && event.rewards.map((reward, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className="bg-primary-dark/30 border border-primary-dark p-4 rounded-lg text-center"
                >
                  <span className="text-xl font-bold block mb-2">
                    {reward.emoji} {reward.position}
                  </span>
                  <span className="text-2xl font-semibold text-white">
                    {reward.amount}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Rounds Section */}
        {hasRounds() && (
          <div className="border border-primary-dark p-2" id="Rounds">
            <div className="border border-primary-dark shadow-lg p-4 md:p-10">
              <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
                Rounds
              </h2>
              <div className="flex flex-col gap-7">
                {event.rounds.map((round, index) => (
                  <motion.div key={index} className="flex flex-col gap-3">
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
                      <p className="text-lg md:text-xl text-primary">
                        {round.description}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {event.submissionRequirements?.length > 0 && (
          <div className="border border-primary-dark p-2 mt-6" id="SubmissionRequirements">
            <div className="border border-primary-dark shadow-lg p-4 md:p-10">
              <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
                Submission Requirements
              </h2>

              <div className="flex flex-col gap-7">
                {event.submissionRequirements.map((requirement, index) => (
                  <motion.div key={index} className="flex flex-col gap-3">
                    <h1 className="font-medium text-lg md:text-xl text-primary">
                      {requirement}
                    </h1>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rules Section */}
        <div className="border border-primary-dark p-2 mt-6" id="Rules">
          <div className="bg-primary-dark/30 shadow-lg p-4 md:p-10">
            <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary bg-inherit border border-primary-dark px-3 py-3">
              Rules
            </h2>
            <ul className="list-disc pl-6 text-lg md:text-xl text-primary">
              {event.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Prototype Guidelines Section */}
        {event.prototypeGuidelines && (
          <div className="border border-primary-dark p-2 mt-6" id="Prototype">
            <div className="border border-primary-dark shadow-lg p-4 md:p-10">
              <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
                Prototype & Solution Guidelines
              </h2>
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-primary mb-3">
                    Format
                  </h3>
                  <ul className="list-disc pl-6 text-lg md:text-xl text-primary">
                    {event.prototypeGuidelines.format.map((format, index) => (
                      <li key={index}>{format}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-primary mb-3">
                    Requirements
                  </h3>
                  <ul className="list-disc pl-6 text-lg md:text-xl text-primary">
                    {event.prototypeGuidelines.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Presentation Rules Section */}
        {event.presentationRules && (
          <div className="border border-primary-dark p-2 mt-6" id="Presentation">
            <div className="border border-primary-dark shadow-lg p-4 md:p-10">
              <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
                Presentation Rules
              </h2>
              <ul className="list-disc pl-6 text-lg md:text-xl text-primary">
                {event.presentationRules.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Judging Criteria Section */}
        {event.judgingCriteria && (
          <div className="border border-primary-dark p-2 mt-6" id="Judging">
            <div className="border border-primary-dark shadow-lg p-4 md:p-10">
              <h2 className="text-center font-semibold text-2xl md:text-3xl mb-5 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
                Judging Criteria
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.judgingCriteria.criteria.map((criterion, index) => (
                  <div key={index} className="bg-primary-dark/30 border border-primary-dark p-4 rounded-lg">
                    <h3 className="text-lg md:text-xl font-semibold text-primary mb-2">
                      {criterion.aspect}
                    </h3>
                    <p className="text-base md:text-lg text-primary">
                      Weight: <span className="font-bold">{criterion.percentage}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Section */}
        <div className="border border-primary-dark p-2 mt-6" id="Schedule">
          <div className="p-4 md:p-10">
            <h2 className="text-2xl md:text-3xl text-center font-semibold mb-8 text-primary border border-primary-dark bg-primary-dark/30 px-3 py-3">
              Schedule
            </h2>
            {event.schedule.map((schedule, index) => (
              <div key={index} className="border-gray-300 pb-2 mb-2">
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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
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
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
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
      </div>
    </motion.div>
  );
};

export default HackathonSection;
