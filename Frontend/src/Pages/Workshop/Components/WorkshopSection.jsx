import React, { useState, useEffect } from "react";
import { Slide } from "react-awesome-reveal";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import Pravartak from '../../../assets/WorkshopImages/Pravartak.jpg'
import virtuospark from '../../../assets/WorkshopImages/virtuospark.jpg'
import TXT from '../../../assets/WorkshopImages/TXT.png'
import dftt from '../../../assets/WorkshopImages/dftt.jpg'
import garuda from '../../../assets/WorkshopImages/garuda.jpg'
import macro from '../../../assets/WorkshopImages/macro.jpg'
import millet from '../../../assets/WorkshopImages/millet.jpg'
import it from '../../../assets/WorkshopImages/it.png'
import Cokupa from '../../../assets/WorkshopImages/Cokupa.png'
import EnthuTechnology from '../../../assets/WorkshopImages/EnthuTechnology.png'
import uipath from '../../../assets/WorkshopImages/uipath.png'
import Ictacademy from '../../../assets/WorkshopImages/Ictacademy.png'
import mewLogo from "../../../assets/WorkshopImages/mew logo BLUE.png"
import bt from "../../../assets/WorkshopImages/BT.png"


import Photo1 from "../../../assets/workshop_card/Ai.jpg";
import Photo2 from "../../../assets/workshop_card/Aiml.jpg";
import Photo3 from "../../../assets/workshop_card/bt.jpg";
import Photo4 from "../../../assets/workshop_card/civil.jpg";
import Photo5 from "../../../assets/workshop_card/csbs.jpg";
import Photo6 from "../../../assets/workshop_card/cse.jpg";
import Photo7 from "../../../assets/workshop_card/ece.jpg";
import Photo8 from "../../../assets/workshop_card/eee.jpg";
import Photo9 from "../../../assets/workshop_card/ft.jpg";
import Photo10 from "../../../assets/workshop_card/it.jpg";
import Photo11 from "../../../assets/workshop_card/mct.jpg";
import Photo12 from "../../../assets/workshop_card/mech.jpg";
import Photo13 from "../../../assets/workshop_card/tex.jpg";
import Photo14 from "../../../assets/workshop_card/vlsi.jpg";


// Workshop data
const workshops = [
  {
    id: 1,
    img: Photo1,
    department: "Artificial Intelligence and Data Science",
    dept: "Robotic Process Automation",
    title: "Artificial Intelligence and Data Science",
    facultyCo: "Mr. N.Giridharan",
    facultyCoNo: "+91 8925325252",
    studentCo1: "Gowrinath V",
    studentCo2: "Durga S",
    studentCoNo1: "+91 8056570574",
    studentCoNo2: "+91 9080191925",
    companyName: "Ui Path",
    companyImg: uipath,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 2,
    img: Photo2,
    department: "Artificial Intelligence and Machine Learning",
    dept: "AI in Game Development",
    title: "Artificial Intelligence and Machine Learning",
    facultyCo: "Mrs R S Sivarajani",
    facultyCoNo: "+91 96770 55783",
    studentCo1: "Surendra Krishana R  III-Year/CSE(AIML)",
    studentCo2: "Sriharan S III-Year/CSE(AIML)",
    studentCoNo1: "+91 8438878063",
    studentCoNo2: "+91 9629729009",
    companyName: "IITM Pravartak Technologies Foundation",
    companyImg: Pravartak,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 3,
    img: Photo3,
    department: "Bio-Technology",
    dept: "Next Generation Sequencing technologies in Health Care",
    title: "Bio-Technology",
    facultyCo: " Dr. Puniethaa Prabhu",
    facultyCoNo: "+91 9080195801",
    facultyCo1: " Dr. Sidhra S",
    facultyCoNo1: "+91 8870681797",
    studentCo1: "Mohammed Arkam K",
    studentCo2: "Sanjay Kumar K",
    studentCo3: "Raamprasaanth S",
    studentCoNo1: "+91 7904655755",
    studentCoNo2: "+91 8807076569",
    studentCoNo3: "+91 8838616292",
    companyName: "Genotypic Technology - Bengaluru",
    companyImg: bt,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 4,
    img: Photo4,
    department: "Civil Engineering",
    dept: "Building Information Modeling",
    title: "Civil Engineering",
    facultyCo: "Dr. S. Gunasekar",
    facultyCoNo: "+91 9976876238",
    studentCo1: "B. Susimitha",
    studentCo2: "S. Suja",
    studentCo3: "",
    studentCoNo1: "+91 6374735128",
    studentCoNo2: "+91 9500534225",
    studentCoNo3: "",
    companyName: "Ictacademy",
    companyImg: Ictacademy,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 5,
    img: Photo5,
    department: "Computer Science and Business Systems",
    dept: "Blockchain 101",
    title: "Computer Science and Business Systems",
    facultyCo: "Mr. P. Venkatesh",
    facultyCoNo: "+91 89033 66916",
    studentCo1: "K. Mohanakumaran",
    studentCo2: "P. Narendar",
    studentCo3: "",
    studentCoNo1: "+91 8838401078",
    studentCoNo2: "+91 8508774247",
    studentCoNo3: "",
    companyName: "Virtuospark",
    companyImg: virtuospark,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 6,
    img: Photo6,
    department: "Computer Science and Engineering",
    dept: "Mobile Application Development",
    title: "Computer Science and Engineering",
    facultyCo: "Mr K.Dinesh Kumar",
    facultyCoNo: "+91 9360287212",
    studentCo1: "Kaviya S III-Year/CSE",
    studentCo2: "Obu Sharva Dharshini O  III-Year/CSE",
    studentCoNo1: "+91 6369548280",
    companyName: "RemitBee India Private Limited - Chennai",
    companyImg: Cokupa,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 7,
    img: Photo7,
    department: "Electronics and Communication Engineering",
    dept: "Industry IoT using LoRaWAN Technology",
    title: "Electronics and Communication Engineering",
    facultyCo: "Mr. Jayamani S",
    facultyCoNo: "+91 9629297054",
    studentCo1: "Rohith R III-Year/ECE",
    studentCo2: "Rithan II-Year/ECE",
    studentCoNo1: "8838948748",
    studentCoNo2: "9025033891",
    studentCoNo3: "",
    companyName: "Enthu Technology Solutions India Pvt Ltd",
    companyImg: EnthuTechnology,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 8,
    img: Photo8,
    department: "Electrical and Electronics Engineering",
    dept: "NI Lab view",
    title: "Electrical and Electronics Engineering",
    facultyCo: "Mr. Thangadurai A",
    facultyCoNo: "+91 9095322233",
    studentCo1: "Nivitha V P",
    studentCo2: "Ramya T",
    studentCoNo1: "+91 9003344108",
    studentCoNo2: "+91 9025244374",
    companyName: " Mew Technology - Bangalore",
    companyImg: mewLogo,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 9,
    img: Photo9,
    department: "Food Technology",
    dept: "Millet Fiesta: From Farm to Fork",
    title: "Food Technology",
    facultyCo: "Mr. S. Nithishkumar",
    facultyCoNo: "+91 89733 33396",
    studentCo1: "Pugazh Vendhan R, III Year",
    studentCo2: "Shahana B, II Year",
    studentCo3: "Santhosh S, II Year",
    studentCoNo1: "+91 75503 48891",
    studentCoNo2: "+91 74188 83634",
    studentCoNo3: "+91 73058 44895",
    companyName: "Moon Foods",
    companyImg: millet,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 10,
    img: Photo10,
    department: "Information Technology",
    dept: "Prompt Engineering (A Walkthrough of Modern Techniques)",
    title: "Information Technology",
    facultyCo: "Mr. P. Dinesh Kumar",
    facultyCoNo: "+91 96888 37873",
    studentCo2: "F.Anisa III Year/IT",
    studentCo3: "E.Balasastha III Year/IT",
    studentCoNo1: "+91 99426 51212",
    studentCoNo2: "+91 99426 51212",
    companyName: "Statix.pro",
    companyImg: it,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 11,
    img: Photo11,
    department: "Mechatronics Engineering",
    dept: "Soaring High: Hands-On Drone Building and Flight Workshop",
    title: "Mechatronics Engineering",
    facultyCo: "Mr. S. Hari Prasadh",
    facultyCoNo: "+91 7092821630",
    facultyCo1: "Mr. R. Vivek",
    facultyCoNo1: "+91 7200458826",
    studentCo1: "Soundarrajan A III Year/MCT",
    studentCoNo1: "+91 9442727410",
    companyName: "Garuda Aerospace",
    companyImg: garuda,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 12,
    img: Photo12,
    department: "Mechanical Engineering",
    dept: "Design and development of automotive Product",
    title: "Mechanical Engineering",
    facultyCo: "Dr.K.Raja",
    facultyCoNo: "+91 9842314481",
    studentCo1: " Lingeshwaran S L",
    studentCo2: " Raghunath E",
    studentCoNo1: "+91 8012439250",
    companyName: "Macbro Institute of Technology",
    companyImg: macro,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 13,
    img: Photo13,
    department: "Textile Technology",
    dept: "Medi Tex",
    title: "Textile Technology",
    facultyCo: "Dr.K.R.Nanadagopal ",
    facultyCoNo: "+91 9003436705",
    facultyCo1: "Mr.G.Devanand",
    facultyCoNo1: "+91 9952841869",
    studentCo1: "Akshaya III-Year/Textile",
    studentCo2: "R.Hiruthik II-Year/Textile",
    studentCo3: "",
    studentCoNo1: "+91 7871969769",
    studentCoNo2: "+91 9965227394",
    studentCoNo3: "",
    companyName: "Care 4 U India Pvt, Ltd",
    companyImg: TXT,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
  {
    id: 14,
    img: Photo14,
    department: "VLSI",
    dept: "DFT Demystified: The Basic you need to know",
    title: "VLSI",
    facultyCo: "Dr. S. Gomathi",
    facultyCoNo: "+91 98942 79244",
    facultyCo1: "Mr. S. Pradeep",
    facultyCoNo1: "+91 81221 39862",
    studentCo1: "Harikesavaraj J II-Year/EE(VLSI D&T)",
    studentCo2: "Aishvarieya V II-Year/EE(VLSI D&T)",
    studentCoNo1: "+91 82702 78279",
    studentCoNo2: "+91 63746 84519",
    companyName: "DFT Training Institute Private Limited",
    companyImg: dftt,
    registrationLink: "https://forms.gle/JzY7C819nFQnmC2D9",
  },
];


const WorkshopSection = () => {
  const title = "Workshop";
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  useEffect(() => {
    AOS.init({
      duration: 1000, // Animation duration
      once: true, // Whether animation should happen only once
    });
  }, []);

  return (
<div className="container mx-auto mb-28 mt-[120px]">
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
            {char}
          </motion.span>
        ))}
      </h1>

      {/* Cards Section */}
      <div className="flex flex-wrap justify-center w-full gap-6">
        {workshops.map((workshop, index) => (
          <div
            key={workshop.id}
            className="w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(25%-1.125rem)] max-w-[300px] border-2 border-primary-dark hover:border-secondary transition-colors duration-300 bg-primary-dark/30"
            data-aos="fade-up"
            data-aos-delay={index * 100}
          >
            <div className="text-white shadow-md overflow-hidden relative group">
              <div className="relative w-full aspect-square">
                <img src={workshop.img} alt={workshop.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 flex flex-col space-y-4 items-center justify-center text-center text-white bg-primary-dark/80 opacity-0 backdrop-blur-sm group-hover:opacity-100 transition duration-500 px-4 border-2 border-transparent group-hover:border-secondary/30">
                  <Slide cascade>
                    <h1 className="text-lg font-semibold cursor-default text-secondary">
                      {workshop.dept}
                    </h1>
                    <button
                      className="border border-secondary text-secondary px-6 py-2 hover:bg-secondary hover:text-white duration-300 font-semibold tracking-wide"
                      onClick={() => setSelectedWorkshop(workshop)}
                    >
                      View
                    </button>
                  </Slide>
                </div>
              </div>
              <p className="text-center my-2 text-secondary group-hover:text-secondary transition-colors duration-300 font-medium text-sm truncate px-2">{workshop.dept}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedWorkshop && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-[100] p-4"
          onClick={() => setSelectedWorkshop(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-secondary/30 p-1 relative max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-white/50 hover:text-white z-10"
              onClick={() => setSelectedWorkshop(null)}
            >
              <X size={24} />
            </button>
            
            <div className="p-4 md:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3">
                  <img className="w-full aspect-square object-cover rounded-lg border border-white/10" src={selectedWorkshop.img} alt="" />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-orbitron font-bold text-secondary mb-4">{selectedWorkshop.dept}</h2>
                  <div className="h-px bg-gradient-to-r from-secondary/50 to-transparent mb-6" />

                  <div className="space-y-6">
                    <div>
                      <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Partner Company</p>
                      <div className="flex items-center gap-4">
                        <img className="h-12 object-contain bg-white/5 p-2 rounded" src={selectedWorkshop.companyImg} alt={selectedWorkshop.companyName} />
                        <span className="text-white font-medium">{selectedWorkshop.companyName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Faculty Coordinators</p>
                        <ul className="space-y-1 text-white/90">
                          {selectedWorkshop.facultyCo && (
                            <li>{selectedWorkshop.facultyCo} <span className="text-secondary/80 text-xs ml-2">{selectedWorkshop.facultyCoNo}</span></li>
                          )}
                          {selectedWorkshop.facultyCo1 && (
                            <li>{selectedWorkshop.facultyCo1} <span className="text-secondary/80 text-xs ml-2">{selectedWorkshop.facultyCoNo1}</span></li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Student Coordinators</p>
                        <ul className="space-y-1 text-white/90">
                          {selectedWorkshop.studentCo1 && <li>{selectedWorkshop.studentCo1}</li>}
                          {selectedWorkshop.studentCo2 && <li>{selectedWorkshop.studentCo2}</li>}
                          {selectedWorkshop.studentCo3 && <li>{selectedWorkshop.studentCo3}</li>}
                        </ul>
                      </div>
                    </div>

                    <button
                      className="w-full md:w-auto px-8 py-4 bg-secondary text-white font-orbitron font-bold tracking-widest hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 rounded-lg"
                      onClick={() => window.open(selectedWorkshop.registrationLink, "_blank")}
                    >
                      REGISTER NOW
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>


  );
};

export default WorkshopSection;
