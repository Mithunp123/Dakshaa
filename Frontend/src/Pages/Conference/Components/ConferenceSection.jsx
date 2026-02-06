import React, { useState, useEffect } from "react";
import { Slide } from "react-awesome-reveal";
import { motion } from "framer-motion";
import { X, MapPin, Calendar, Users, Mail, Phone } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import btcon from "../../../assets/conference/school_of_science.webp";
import eeecon from "../../../assets/conference/school_of_electrical.webp";
import cscon from "../../../assets/conference/school_of_compu.webp";
import mechcon from "../../../assets/conference/school_of_mech.webp";

// Conference data
const conferences = [
  {
    id: 1,
    img: btcon,
    title: "National Conference on Transforming Life Sciences through AI and Smart Technologies",
    shortTitle: " National Conference on Transforming Life Sciences through AI and Smart Technologies",
    department: "School of Life Sciences",
    description:
      "National Conference on Transforming Life Sciences through AI and Smart Technologies aims to provide a scholarly platform for students, researchers, and academicians to present innovative research and interdisciplinary advancements that integrate life sciences with emerging smart technologies such as Artificial Intelligence, Machine Learning, IoT, Data Analytics, Automation, and Digital Health. The conference promotes knowledge exchange, research collaboration, and dissemination of high-quality scientific work.",
    tracks: [
      {
        name: "Biotechnology",
        topics: [
          "AI-Driven Drug Discovery and Precision Therapeutics",
          "Smart Diagnostics and Digital Health",
          "Computational Biology and Bioinformatics",
          "Automation, Robotics, and Smart Laboratories",
          "AI in Genomics and Personalized Medicine",
          "Smart Bioprocessing and Industrial Biotechnology",
          "AI for Environmental and Agricultural Life Sciences"
        ]
      },
      {
        name: "Food Technology",
        topics: [
          "Innovative Food Processing Techniques",
          "Sustainable & Green Food Technologies",
          "Future Foods and Alternative Protein Sources",
          "Food Safety and Fermentation Technologies",
          "Eco-friendly & Smart Food Packaging"
        ]
      },
      {
        name: "Textile Technology",
        topics: [
          "Sustainability in the Textile Industry: An Overview",
          "Recent Trends and Innovations in Textile Technology",
          "Textile Waste: Problems, Solutions, and Opportunities",
          "Smart Textiles: Concepts and Everyday Applications",
          "Eco-Friendly Practices in Textile Manufacturing",
          "Future Scope of Textile Engineering in a Sustainable World"
        ]
      }
    ],
    note:[  
      "All submitted papers must have plagiarism below 5% as per standard guidelines.",
      "Please attach the payment confirmation email received during conference registration while submitting your paper.",
      "Paper should be mailed to :  dakshaaslsnc@ksrct.ac.in",

    ],
     rules: [
      "A paper may be authored by one or two members only.",
      "Participants may submit either an Abstract or a Full Paper.",
      "Full papers meeting the prescribed standards will be published in the Conference Proceedings.",
      "Selected full papers will be recommended for Scopus-indexed journal publication, subject to journal review and compliance.",
      "All submissions must be original, unpublished, and free from plagiarism as per UGC/AICTE norms.",
      "Each paper will be allotted 10 minutes for presentation, followed by a questioning (Q&A) session with the judges/panel members.",
      "Papers must strictly follow the conference formatting guidelines and undergo a peer-review process.",
      "At least one author must register and present the paper.",
      "The Organizing Committee’s decision shall be final in all matters related to acceptance and publication.",

    ],
    eligibility: [
      "Undergraduate (UG) and Postgraduate (PG) Students",
      "Research Scholars",
      "Academicians",

    ],

    templete_link:[
      "Paper Template Download Link : https://drive.google.com/drive/folders/1rxX4vEv9-B2QKS1cZhu_uewq8lCy7Jnf ",

    ],

    
    registrationdetails:[
      " Including one author per paper : ₹300",
      " Additional author per head : ₹150",
    ],

    date: "12 February 2026 ",
    venue: "A102 (Main Building)",
    contact: {
        facultyCoordinator: [
          {
            name: "Dr. S Poornima",
            phone: "+91 99946 25815",
            email: "",
          },
        ],
        studentCoordinator: [
          {
            name: "  Ms. M. Jerin Jenifer",
            phone: "+91 93615 56956",
            email: "",
          },
          {
            name: "Mr. S. Vairabalaji",
            phone: "+91 70944 84560",
            email: "",
          },
          {
            name : "Mr. S. Muralidhar",
            phone:"+91 63821 51595"
          }
        ],
      },
    
  },
  {
    id: 2,
    img: eeecon,
    title: "Exploring the Next Dimension of Signal and Communication Technologies",
    shortTitle: "National Conference on Exploring the Next Dimension of Signal and Communication Technologies",
    department: "School of Electrical Sciences",
    description:
      "The latest advancements in signal processing and communication systems. It covers technologies that enable faster, more reliable, and efficient data transmission in modern networks. The focus is on developing smart and connected electronic systems that meet the demands of the digital era.",
    topics: [

      "Renewable Energy Systems and Sustainability",
      "Advanced Power Electronics and Drives",
      "Smart Grids and Energy Management",
      "Electric Vehicles and Energy Storage Technologies",
      "Embedded Systems and Internet of Things",
      "Image, Speech, Audio and Signal Processing",
      "Satellite, Space, Vehicular and Wireless Communication",
      "Digital Circuit Design and Verification",
      "Low Power VLSI Design",
      "FPGA-Based VLSI Design",
    ],
    theme: [
      "Exploring the Next Dimension of Signal and Communication Technologies",
    ],
    rules: [
     "Only registered participants can attend and present.",
     "Submit original papers; copying results in Disqualification.",
     "Present on time according to your assigned slot.",
     "E-Certificates will be given only to those who participate and present their Papers",
    ],

    note:[  
      "All submitted papers must have plagiarism below 5% as per standard guidelines.",
      "Please attach the payment confirmation email received during conference registration while submitting your paper.",
      "Paper should be mailed to : dakshaasesnc@ksrct.ac.in ",
    ],

    templete_link:[
      "Paper Template Download Link : https://drive.google.com/drive/folders/1rxX4vEv9-B2QKS1cZhu_uewq8lCy7Jnf ",

    ],
    

    registrationdetails:[
      "Rs300 (Per Paper + 1 Author) + Rs150 (Per Co-Author)",
    ],

    date: "12 February 2026",
    venue: "A103 (Main Building)",
    registrationFee: "₹300",
    contact: {
        facultyCoordinator: [
          {
            name: "Mr Balachandran A ",
            phone: "+91 94430 72641",
            email: "",
          },
          {
            name: "Dr. S. Pradeep",
            phone: "+91 81221 39862",
          }
        ],
        studentCoordinator: [
          {
            name: "Ms.S. Muthaal ",
            phone: "+91 80565 88925",
            email: "",
          },
          {
            name : "Ms.M. Deepasri " ,
            phone:"+91 76959 45259"
          },
          
        ],
      },
    
  },
  {
    id: 3,
    img: cscon,
    title: "Applications of Artificial Intelligence and Cybersecurity",
    shortTitle: "AI & Cybersecurity 2026",
    department: "School of Computing Sciences",
    description:
      "Explore the convergence of Artificial Intelligence and Cybersecurity in this comprehensive conference. Learn about cutting-edge AI applications in threat detection, network security, and the ethical implications of AI-powered security systems.",
    topics: [
      "Machine Learning for Threat Detection",
      "Natural Language Processing",
      "Computer Vision in Security Systems",
      "Expert Systems and Decision Support",
      "Network Security and Intrusion Detection",
      "Cloud Security Architecture",
      "Cryptography and Encryption Techniques",
      "Incident Response and Forensics",
      "AI for Cybersecurity Policy and Governance",
      "Explainable AI (XAI) for Cybersecurity",
      "Networking Protocols and Security",
    ],
    eligibility: [
      "Undergraduate (UG) and Postgraduate (PG) Students",
      "Research Scholars",
      "Academicians",

    ],
    note:[  
      "All submitted papers must have plagiarism below 5% as per standard guidelines.",
      "Please attach the payment confirmation email received during conference registration while submitting your paper.",
      "Paper should be mailed to :  dakshaascsnc@ksrct.ac.in",

    ],
    templete_link:[
      "Paper Template Download Link : https://drive.google.com/drive/folders/1rxX4vEv9-B2QKS1cZhu_uewq8lCy7Jnf ",
    ],
    rules: [
      "A paper may be authored by one or two members only.",
      "Participants may submit either an Abstract or a Full Paper.",
      "Full papers meeting the prescribed standards will be published in the Conference Proceedings.",
      "Selected full papers will be recommended for Scopus-indexed journal publication, subject to journal review and compliance.",
      "All submissions must be original, unpublished, and free from plagiarism as per UGC/AICTE norms.",
      "Each paper will be allotted 10 minutes for presentation, followed by a questioning (Q&A) session with the judges/panel members.",
      "Papers must strictly follow the conference formatting guidelines and undergo a peer-review process.",
      "At least one author must register and present the paper.",
      "The Organizing Committee’s decision shall be final in all matters related to acceptance and publication.",

    ],
    registrationdetails: [
      " Including one author per paper : ₹300",
      " Additional author per head : ₹150",
    ],
    date: "12 February 2026",
    venue: "A112,A113 (Main Building)",
    registrationFee: "₹300",
    contact: {
        facultyCoordinator: [ 
          {
            name: "Mr K.C.Mohanraj",
            phone: "+91 98427 93086",
            email: "",
          },
        ],
          
        studentCoordinator: [
          {
            name: "M PuPathee ",
            phone: "+91 91501 35736",
          },
          {
            name : "R Harshavarthini ",
            phone:"+91 93454 01967"
          }
        ],
      },
  },
  
  {
    id: 4,
    img: mechcon,
    title: "Innovations in Smart and Green Intelligent Engineering Systems",
    shortTitle: "Innovations in Smart and Green Intelligent Engineering Systems",
    department: "SCHOOL OF BUILDING & MECHANICAL SCIENCE",
    description:
      "The National Conference serves as a platform for students, researchers, academicians, and industry professionals to present and exchange ideas, research outcomes, and technological innovations in the field of Mechanical Engineering. The event aims to encourage technical discussions, promote knowledge sharing, and foster collaboration between academia and industry. It highlights recent advancements, practical engineering solutions, and emerging technologies that contribute to sustainable development and industrial progress, while helping participants gain insights into current trends and future challenges in the engineering domain.",
    
    tracks: [
      {
        name: "Department of Mechatronics Engineering",
        topics: [
          "Sensors and Transducers in Mechatronics Systems",
          "Actuators and Drives in Automation",
          "Basics of Industrial Automation using PLC",
          "Embedded Systems in Mechatronics Applications",
          "Robotics: Basic Structure, Types, and Applications",
          "Human–Machine Interface (HMI) in Industrial Systems",
          "Basics of Pneumatic and Hydraulic Control Systems",
          "IoT in Mechatronics Engineering",
          "Mechatronics in Smart and Intelligent Systems",
          "Mechatronics in Industry 4.0",
          "Aerodynamics of Multirotor Drones",
          "Flight Control Systems in Drones",
          "Sustainable and Green Energy Source"
        ]
      },
      {
        name:"Department of Mechanical Engineering",
        topics: [
          "Sustainable & Green Engineering",
          "Design Optimization and Finite Element Analysis",
          "Sustainable & Green Engineering",
          "Additive Manufacturing and Advanced Materials",
          "Digital Manufacturing, Automation and Robotics",
          "Advances in Automotive Engineering and Vehicle Dynamics",
          "Smart Materials and Structures",
          "Tribology, Wear and Surface Engineering",
          "Innovations in Machine Design and Optimization",
          "Computational Fluid Dynamics (CFD) in Engineering Applications",
          "Production Planning, Industrial Safety and Reliability",
          "Robotics, Mechatronics and Control Systems",
          "Mechanical Engineering for Industry, Society and Sustainability",
          "Sustainability and Renewable energy",
        ]
      },
      {
        name : "Department of Civil Engineering",
        topics: [
          "Sustainable and Climate-Resilient Infrastructure",
          "Smart Water Resources and Water Management",
          "Environmental Protection and Waste Management Technologies",
          "Green and Sustainable Transportation Systems",
          "Earthquake-Resistant and Safe Structures",
          "Modern Geotechnical Engineering for Safe Foundations",
          "Smart Cities and Urban Infrastructure Development",
          "Use of GIS and Remote Sensing in Civil Engineering",
          "Advanced Construction Materials and Management Practices",
          "Application of AI and Digital Technologies in Civil Engineering",
        ]
      }

    ],

    templete_link:[
      "Paper Template Download Link : https://drive.google.com/drive/folders/1rxX4vEv9-B2QKS1cZhu_uewq8lCy7Jnf ",

    ],

    note:[  
      "All submitted papers must have plagiarism below 5% as per standard guidelines.",
      "Please attach the payment confirmation email received during conference registration while submitting your paper.",
      "Paper should be mailed to :  dakshaasbmsnc@ksrct.ac.in",

    ],

    rules: [
    
      "A paper may be authored by a maximum of two members only.", 
      "Participants must submit their Full Paper.", 
      "Full papers that meet the prescribed standards will be published in the Conference Proceedings.", 
      "All submissions must be original, unpublished, and plagiarism-free as per UGC/AICTE norms (plagiarism must be below 15%).", 
      "Each paper presentation will be allotted 10 minutes, followed by a Q&A session with the judges/panel members. ",
      "Papers must strictly follow the conference formatting guidelines and will undergo a peer-review process. ", 
      "At least one author must register and present the paper; only registered participants are allowed to attend and present.",
      "Participants must present their papers on time as per the allotted schedule; failure to do so may lead to disqualification to do so may lead to disqualification. ",
      " E-Certificates will be issued only to participants who register and present, and the Organizing Committee’s decision will be final in all matters. ",


    ],
    
    registrationdetails:[
      " Including one author per paper : ₹300",
      " Additional author per head : ₹150",
    ],
    date: "12 February 2026",
    venue: "A203 (Main Building)",
    registrationFee: "₹300",
    contact: {
        facultyCoordinator: [
          {
            name: "Dr. S. Jeyaprakasam",
            phone: "91+ 98946 94658 ",
            email: "",
          },
          {
            name: "Dr J .Abdul Bari -(Civil)",
            phone: "+91 99650 10625",
            email: "",
          },
          {
            name: "Mr.M.Sanjay",
            phone:"+91 63825 66247"
          },
          {
            name:"Mr.P.Prakash",
            phone:"+91 "
          }
        ],
        studentCoordinator: [
          {
            name: " Mr.K.Navin",
            phone: "+91 78100 39736",
            email: "",
          },
          {
            name : "Mr. S. Narayanakumar ",
            phone:"+91 93445 22384 "
          },
          {
            name:"Mr.P.A. Sathananth",
            phone:"+91 63694 12252",
          },{
            name:"Mr.R.C.Sathyanarayanan",
            phone:"+91 73730 46996",
          },{
            name : "Mr.R.Vinothkumar - Civil",
            phone:"+91 63826 50977",
          },{
            name : "Ms.B.Dhiyasri - Civil",
            phone:"+91 90256 34058",
          }
        ],
      },
  },
];

const ConferenceSection = () => {
  const title = "Conference";
  const [selectedConference, setSelectedConference] = useState(null);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <div className="container mx-auto mb-28 mt-[120px] px-4">
      {/* NCISTEMM Banner */}
      <motion.div
        className="text-center border-2 border-primary bg-primary/10 backdrop-blur-sm text-white py-8 px-6 mb-12 max-w-6xl mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        data-aos="fade-down"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3">
          NATIONAL CONFERENCE
        </h2>
        <p className="text-gray-200 text-sm sm:text-lg font-semibold mb-4">
          NATIONAL CONFERENCE ON INNOVATIONS IN SCIENCE, TECHNOLOGY,
          ENGINEERING, MATHEMATICS, AND MEDICINE
        </p>
        <div className="space-y-2">
          <p className="text-base sm:text-xl font-semibold">
         
            {/*<span className="text-gray-300">Note : </span>*/}

          </p>
          
        </div>
      </motion.div>

      {/* Animated Title */}
      <h1
        className="text-center font-bold text-white md:text-5xl text-2xl mb-10 mt-8"
        data-aos="fade-down"
      >
        {title.split("").map((char, index) => (
          <motion.span
            key={index}
            style={{ display: "inline-block" }}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: index * 0.1 }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </h1>

      {/* Cards Section */}
      <div className="flex flex-wrap justify-center w-full gap-6">
        {conferences.map((conference, index) => (
          <div
            key={conference.id}
            className="w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] max-w-[400px] border-2 border-primary hover:border-secondary transition-colors duration-300 bg-primary/10 backdrop-blur-sm"
            data-aos="fade-up"
            data-aos-delay={index * 100}
          >
            <div className="text-white shadow-md overflow-hidden relative group">
              <div className="relative w-full aspect-square">
                <img
                  src={conference.img}
                  alt={conference.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col space-y-4 items-center justify-center text-center text-white bg-primary/90 opacity-0 backdrop-blur-sm group-hover:opacity-100 transition duration-500 px-4 border-2 border-transparent group-hover:border-secondary/30">
                  <Slide cascade>
                    <h1 className="text-lg font-semibold cursor-default text-secondary">
                      {conference.shortTitle}
                    </h1>
                    <p className="text-sm text-gray-200 line-clamp-2">
                      {conference.department}
                    </p>
                    <button
                      className="border-2 border-secondary text-secondary px-6 py-2 hover:bg-secondary hover:text-white duration-300 font-semibold tracking-wide"
                      onClick={() => setSelectedConference(conference)}
                    >
                      View Details
                    </button>
                  </Slide>
                </div>
              </div>
              <div className="p-4 bg-primary/5">
                <p className="text-center text-secondary font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                  {conference.shortTitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedConference && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-[100] p-4"
          onClick={() => setSelectedConference(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-primary/50 relative max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-slate-800/80 rounded-full p-2"
              onClick={() => setSelectedConference(null)}
            >
              <X size={24} />
            </button>

            <div className="p-6 md:p-10">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-1/3">
                  <img
                    className="w-full aspect-square object-cover border-2 border-primary/30"
                    src={selectedConference.img}
                    alt={selectedConference.title}
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                    {selectedConference.shortTitle}
                  </h2>
                  <h3 className="text-lg text-gray-300 mb-4">
                    {selectedConference.title}
                  </h3>
                  <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mb-6" />

                  <p className="text-gray-200 text-sm leading-relaxed mb-6">
                    {selectedConference.description}
                  </p>

                  {/* Conference Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedConference.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedConference.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedConference.department}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics/Tracks Section */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                  Conference Topics
                </h3>

                {selectedConference.tracks ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedConference.tracks.map((track, idx) => (
                      <div
                        key={idx}
                        className="border-2 border-primary/30 bg-primary/5 p-5"
                      >
                        <h4 className="text-lg font-semibold text-secondary mb-3">
                          {track.name}
                        </h4>
                        <ul className="space-y-2">
                          {track.topics.map((topic, topicIdx) => (
                            <li
                              key={topicIdx}
                              className="flex items-start gap-2 text-gray-300 text-sm"
                            >
                              <span className="text-primary mt-1">▸</span>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedConference.topics.map((topic, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{topic}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rules Section */}
              {selectedConference.rules && selectedConference.rules.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Submission Rules
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedConference.rules.map((rule, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{rule}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligibility Section */}
              {selectedConference.eligibility && selectedConference.eligibility.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Eligibility Criteria
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedConference.eligibility.map((criterion, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{criterion}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registration Fee Section */}
              {selectedConference.registrationdetails && Array.isArray(selectedConference.registrationdetails) && selectedConference.registrationdetails.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Registration Fee
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedConference.registrationdetails.map((fee, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-primary mt-1">▸</span>
                        <span className="text-sm">{fee}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Link Section */}
              {selectedConference.templete_link && Array.isArray(selectedConference.templete_link) && selectedConference.templete_link.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Template
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedConference.templete_link.map((note, idx) => {
                      const urlMatch = note.match(/https?:\/\/\S+/);
                      const url = urlMatch ? urlMatch[0] : null;
                      const label = url ? note.replace(url, "").trim() : note;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="flex items-start gap-2 text-gray-300"
                        >
                          <span className="text-primary mt-1">▸</span>
                          {url ? (
                            <span className="text-sm">
                              {label}
                              {label && " "}
                              <a
                                className="text-secondary underline hover:text-secondary/80 break-all"
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {url}
                              </a>
                            </span>
                          ) : (
                            <span className="text-sm">{note}</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Note Section */}
              {selectedConference.note && Array.isArray(selectedConference.note) && selectedConference.note.length > 0 && (
                <div className="mb-8 border-2 border-secondary bg-secondary/10 p-6 shadow-lg shadow-secondary/20">
                  <h3 className="text-xl font-bold text-secondary mb-4 border-l-4 border-secondary pl-4">
                    📧 Important Note - Paper Submission
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedConference.note.map((noteItem, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-2 text-white"
                      >
                        <span className="text-secondary mt-1 font-bold">▸</span>
                        <span className="text-sm font-medium">{noteItem}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {selectedConference.contact && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4 border-l-4 border-primary pl-4">
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Faculty Coordinator */}
                    <div className="border-2 border-primary/30 bg-primary/5 p-5">
                      <p className="text-white/60 text-sm uppercase tracking-widest mb-3">
                        Faculty Coordinator
                      </p>
                      {selectedConference.contact.facultyCoordinator.map((coordinator, index) => (
                        <div key={index} className="text-white/90 space-y-1 mb-4">
                          <p className="font-medium">{coordinator.name}</p>
                          {coordinator.phone && (
                            <p className="text-sm text-primary">{coordinator.phone}</p>
                          )}
                          {coordinator.email && (
                            <p className="text-sm text-primary">{coordinator.email}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Student Coordinator */}
                    <div className="border-2 border-primary/30 bg-primary/5 p-5">
                      <p className="text-white/60 text-sm uppercase tracking-widest mb-3">
                        Student Coordinator
                      </p>
                      {selectedConference.contact.studentCoordinator.map((coordinator, index) => (
                        <div key={index} className="text-white/90 space-y-1 mb-4">
                          <p className="font-medium">{coordinator.name}</p>
                          {coordinator.phone && (
                            <p className="text-sm text-primary">{coordinator.phone}</p>
                          )}
                          {coordinator.email && (
                            <p className="text-sm text-primary">{coordinator.email}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* General Contact Information */}
              {selectedConference.generalContact && (
                <div className="border-2 border-primary/30 bg-primary/5 p-5 mb-8">
                  <p className="text-white/60 text-sm uppercase tracking-widest mb-3">
                    General Contact Information
                  </p>
                  <div className="flex flex-col gap-2 text-white/90">
                    {selectedConference.generalContact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <span className="text-sm">{selectedConference.generalContact.email}</span>
                      </div>
                    )}
                    {selectedConference.generalContact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <span className="text-sm">{selectedConference.generalContact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Registration Button */}
              <button
                className="w-full md:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold text-xl tracking-widest transition-all shadow-lg shadow-primary/20 border-2 border-primary"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = "/register-events?skip=true";
                  }
                }}
              >
                REGISTER NOW
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ConferenceSection;
