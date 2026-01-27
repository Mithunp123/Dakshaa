import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

//Association logo Images
import aevaLogo from "../assest/aeva_aiml_logo.jpg";
import aidsasso from "../assest/artificix_aids_logo.jpg";
import ftasso from "../assest/ft_asso_logo.jpg";
import btasso from "../assest/Neomutant_bt_logo.png";
import mechasso from "../assest/sparks_mech_logo.png";
import eeeasso from "../assest/spicee_eee_logo.png";
import txtasso from "../assest/tafeta_txt_logo.png";
import csbsasso from "../assest/Techragonz_csbs_logo.jpg";
import vlsiasso from "../assest/vlsi-logo.jpg";
import itasso from "../assest/zita_it_logo.png";



import kavinesh from "../../../assets/team_members/kavinesh.jpg";
import narendhar from "../../../assets/team_members/Narendhar.png";
import harish from "../../../assets/team_members/harish.png";
import hariprakash from "../../../assets/team_members/Hariprakash.png";
import deekshana from "../../../assets/team_members/Deekshana.jpg";
import deepak from "../../../assets/team_members/Deepak.png";


const chiefCoordinator = [
   { id: 14, name: "Kavinesh", department: "", img: kavinesh, role: "AEVA", phone: "+91 63820 60464", associationLogo: aevaLogo },
];

const jointCoordinators = [
  { id: 13, name: "Narendhar D ", department: "Artificix", img: narendhar, role: "Volunteers, Helpdesk & Participant Support ", phone: "+91 97516 73398", associationLogo: aidsasso },
    //{ id: 12, name: "Kaviyarasu P", department: "Artificix", img: kaviyarasu, role: "Website, Content & Data Management ", phone: "+91 701067 64469", associationLogo: aidsasso },

  //{ id: 15, name: "Gopinath", department: "Department of AIML", img: gopinath, role: "Gopinath T ", phone: "+91 93611 63363", associationLogo: aevaLogo },
  //{ id : 17, name: "Saran Senthur Suthanthran", department: "IT", img: itco, role: "Registrations, Payments & Attendance ", phone: "+91 80566 70219", associationLogo: itasso},
  //{id : 18, name:"Yashas Yadav", department:"CSE", img:cseco, role:"Technical, Non-Technical & Team Events", phone:"+91 70108 43024", associationLogo:cseasso},
  {id :19, name:"Deepak C ", department:"Techragonz", img:deepak, role:"Technical, Non-Technical & Team Events", phone:"+91 63794 07526", associationLogo:csbsasso},
  {id :20, name:"Hari Prakash G ", department:"VLSI ENGINEERS AND DEVELOPERS ASSOCIATION ", img:hariprakash, role:"Workshops, Expos, Stalls & Resource Persons ", phone:"+91 89257 92409", associationLogo:vlsiasso},
  {id :21, name:"Harish A ", department:"Artificix", img:harish, role:"Hackathon, Codeathon & Flagship Challenges", phone:"+91 63642 32959 ", associationLogo:aidsasso},
  {id :22, name:"Deekshana C S ", department:"AEVA", img:deekshana, role:"National Conference ", phone:"+91 90878 42931", associationLogo:aevaLogo},
  //{id :23, name:"Aarush VS ", department:"CSE", img:cseco, role:"Design, Social Media & Promotions", phone:"+91 88918 50995", associationLogo:cseasso},
  //{id :24, name:"Tharun Kumar R ", department:"AIML", img:aimlco, role:"Accommodation & Lunch ", phone:"+91 77084 13624", associationLogo:aimlasso},
];



const eventCoordinators = [
  //{ id: 11, name: "Vignesh", department: "Department of IT", img: vignesh, role: "Event Coordinator", phone: "+91 63836 34583", associationLogo: aevaLogo },
  //{ id: 16, name: "Ajay", department: "Department of CSE", img: ajay, role: "Event Coordinator", phone: "+91 93446 36553", associationLogo: aevaLogo },
];

const developers = [
  //{ id: 1, name: "Giridharan M", department: "AIML", img: giri, role: "Lead Developer", associationLogo: aevaLogo },
]

const designers = [
  //{ id: 7, name: "Balasaastha", department: "Department of IT", img: bala, role: "Web Designer", associationLogo: aevaLogo },
  ];

const TechCard = ({ member, variant = "default", allowContact = false }) => {
  const [showContact, setShowContact] = useState(false);
  const isChief = variant === "chief";
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      onClick={() => allowContact && setShowContact(!showContact)}
      className={`relative group w-full ${isChief ? "max-w-[340px] h-[28rem]" : "max-w-[280px] h-80"} ${allowContact ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Cyber Frame */}
      <div className="absolute inset-0 bg-[#020617] border border-white/10 rounded-lg overflow-hidden transition-all duration-500 group-hover:border-secondary/50 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(45deg, #0ea5e9 25%, transparent 25%, transparent 50%, #0ea5e9 50%, #0ea5e9 75%, transparent 75%, transparent)', backgroundSize: '4px 4px' }} />

        {/* Image Container */}
        <div className="relative h-[65%] overflow-hidden">
          {/* Glitch Overlay */}
          <div className="absolute inset-0 bg-secondary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
          
          <img
            src={member.img}
            alt={member.name}
            className="w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-110"
          />

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-secondary/50 z-20" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-secondary/50 z-20" />
          
          {/* Status Indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full z-20">
            <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
            <span className="text-[8px] font-orbitron text-white/70 tracking-tighter uppercase">Active</span>
          </div>
        </div>

        {/* Association Logo - Top Left */}
        {member.associationLogo && (
          <div className="absolute top-3 left-3 flex items-center gap-2 z-30">
            <div className="w-12 h-12 rounded-full border-2 border-secondary bg-[#020617] p-1 shadow-lg shadow-secondary/20">
              <img src={member.associationLogo} alt={member.association} className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="relative h-[35%] p-4 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/40">
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px w-4 bg-secondary" />
              <span className="text-[9px] font-orbitron text-secondary tracking-[0.2em] uppercase">{member.role}</span>
            </div>
            <h3 className={`font-orbitron font-black text-white ${isChief ? "text-2xl" : "text-lg"} tracking-tight group-hover:text-secondary transition-colors`}>
              {member.name}
            </h3>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] font-poppins text-white/40 uppercase tracking-widest">{member.department.replace('Department of ', '')}</span>
            {allowContact && (
              <div className="w-6 h-6 rounded-full border border-secondary/30 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <svg className="w-3 h-3 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Contact Overlay */}
        <AnimatePresence>
          {showContact && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="absolute inset-0 bg-[#020617] z-30 p-6 flex flex-col justify-center"
            >
              <div className="mb-6">
                <p className="text-[10px] font-orbitron text-secondary tracking-[0.3em] uppercase mb-1">Contact Protocol</p>
                <h4 className="text-xl font-orbitron font-bold text-white">{member.name}</h4>
              </div>

              <div className="space-y-4">
                <a href={`tel:${member.phone}`} className="flex items-center gap-4 p-3 rounded border border-white/5 hover:border-secondary/30 hover:bg-secondary/5 transition-all group/link">
                  <div className="w-8 h-8 rounded bg-secondary/10 flex items-center justify-center text-secondary">📞</div>
                  <div>
                    <p className="text-[8px] text-white/40 uppercase tracking-widest">Voice Line</p>
                    <p className="text-sm text-white font-medium">{member.phone}</p>
                  </div>
                </a>
                <a href={`mailto:${member.email || 'dakshaa@ksrct.ac.in'}`} className="flex items-center gap-4 p-3 rounded border border-white/5 hover:border-secondary/30 hover:bg-secondary/5 transition-all group/link">
                  <div className="w-8 h-8 rounded bg-secondary/10 flex items-center justify-center text-secondary">✉️</div>
                  <div>
                    <p className="text-[8px] text-white/40 uppercase tracking-widest">Data Stream</p>
                    <p className="text-sm text-white font-medium truncate max-w-[160px]">{member.email || 'dakshaa@ksrct.ac.in'}</p>
                  </div>
                </a>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); setShowContact(false); }}
                className="mt-8 text-[10px] font-orbitron text-secondary/50 hover:text-secondary tracking-[0.4em] uppercase transition-colors"
              >
                [ Close Terminal ]
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const SectionTitle = ({ title, isFirst = false }) => (
  <div className={`flex items-center justify-center gap-4 mb-12 ${isFirst ? 'mt-4' : 'mt-16'} px-4`}>
    <div className="hidden sm:block h-[1px] w-8 md:w-12 bg-gradient-to-r from-transparent to-secondary" />
    <h2 className="text-xl sm:text-2xl md:text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-400 uppercase tracking-widest text-center">
      {title}
    </h2>
    <div className="hidden sm:block h-[1px] w-8 md:w-12 bg-gradient-to-l from-transparent to-secondary" />
  </div>
);

const TeamMembers = () => {
  return (
    <div className="w-full min-h-screen py-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center px-4">
        
        {/* Chief Coordinator */}
        <SectionTitle title="Chief Coordinator" isFirst={true} />
        <div className="grid grid-cols-1 justify-items-center w-full mb-8">
          {chiefCoordinator.map((member) => (
            <TechCard key={member.id} member={member} variant="chief" allowContact={true} />
          ))}
        </div>

        {/* Joint Coordinators */}
        <SectionTitle title="Joint Coordinators" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 justify-items-center w-full">
          {jointCoordinators.map((member) => (
            <TechCard key={member.id} member={member} allowContact={true} />
          ))}
        </div>

        {/* Event Coordinators */}
        <SectionTitle title="Event Coordinators" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 justify-items-center w-full">
          {eventCoordinators.map((member) => (
            <TechCard key={member.id} member={member} allowContact={true} />
          ))}
        </div>

        {/* Developers */}
        <SectionTitle title="Developers" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 justify-items-center w-full">
          {developers.map((member) => (
            <TechCard key={member.id} member={member} />
          ))}
        </div>

        {/* Designers */}
        <SectionTitle title="Designers" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 justify-items-center w-full">
          {designers.map((member) => (
            <TechCard key={member.id} member={member} />
          ))}
        </div>

      </div>
    </div>
  );
};

export default TeamMembers;

