import React from "react";
import { motion } from "framer-motion";


import aidswk from "./assets/aidswk.png";
import aimlwk from "./assets/aimlwk.png";
import btwk from "./assets/btwk.jpg";
import civilwk from "./assets/civilwk.png";
import csbswk from "./assets/csbswk.png";
import csewk from "./assets/csewk.png";
import ecewk from "./assets/ecewk.png";
import eeewk from "./assets/eeewk.jpeg";
import ftwk from "./assets/ftwk.jpg";
import iprwk from "./assets/iprwk.jpeg";
import itwk from "./assets/itwk.jpeg";
import mcawk from "./assets/mcawk.png";
import mctwk from "./assets/mctwk.png";
import mechwk from "./assets/mechwk.png";
import txtwk from "./assets/txtwk.jpeg";
import vlsiwk from "./assets/vlsiwk.jpeg";
import comingsoon from "./assets/comingsoon.jpg";
import startuptn from "./assets/startuptn.png";



import AOS from "aos";
import "aos/dist/aos.css";

function Sponsors() {
  const titlesponser =[comingsoon];
  const cosponser=[comingsoon];
  const ecosystem=[startuptn];

  const eventSponsors = [aidswk,aimlwk,btwk,civilwk,csbswk,csewk,ecewk,eeewk,ftwk,iprwk,itwk,mcawk,mctwk,mechwk,txtwk,vlsiwk ];
  const stallsponsors = [comingsoon];

  const letter = "Sponsors";
  const letters = letter.split("");

  const letterAnimation = (index) => ({
    y: [0, -5, 0],
    transition: {
      delay: index * 0.05,
      duration: 1.2,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    },
  });

  const cardEntryAnimation = (index) => ({
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.8,
      ease: "easeInOut",
    },
  });

  return (
    <div className="mt-16 text-white min-h-screen flex flex-col items-center py-10 px-4 sm:px-8 lg:px-16 space-y-16">
      <h1 className="font-bold text-center text-3xl" data-aos="fade-down">
        {letters.map((char, index) => (
          <motion.span
            key={index}
            initial={{ y: 0 }}
            animate={letterAnimation(index)}
            style={{ display: "inline-block" }}
          >
            {char}
          </motion.span>
        ))}
      </h1>

      {/* Title Sponsors Section */}
      <div className="text-center w-full">
        <h2 className="text-3xl font-bold mb-10">Title Sponser</h2>
        <div className="flex justify-center flex-wrap gap-6">
          {titlesponser.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
              animate={cardEntryAnimation(index)}
              whileHover={{ scale: 1.15, rotateY: 5 }}
              className="shadow-lg flex justify-center items-center bg-white w-48 h-48 rounded-lg border-2 border-secondary shadow-secondary"
            >
              <img className="w-40 h-40 object-contain rounded-lg" src={image} alt={`Event Partner ${index + 1}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Co-Sponsor Section */}
      <div className="text-center w-full">
        <h2 className="text-3xl font-bold mb-10">Co-Sponsors</h2>
        <div className="flex justify-center">
          {cosponser.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
              animate={cardEntryAnimation(index)}
              whileHover={{ scale: 1.15, rotateY: 5 }}
              className="shadow-lg flex justify-center items-center bg-white w-48 h-48 rounded-lg border-2 border-secondary shadow-secondary"
            >
              <img className="w-40 h-40 object-contain rounded-lg" src={image} alt={`Sponsor ${index + 1}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Eco-System Partner Section */}
      <div className="text-center w-full">
        <h2 className="text-3xl font-bold m-10">Eco-System Partner</h2>
        <div className="flex justify-center flex-wrap gap-6">
          {ecosystem.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
              animate={cardEntryAnimation(index)}
              whileHover={{ scale: 1.15, rotateY: 5 }}
              className="shadow-lg flex justify-center items-center bg-white w-48 h-48 rounded-lg border-2 border-secondary shadow-secondary"
            >
              <img className="w-40 h-40 object-contain rounded-lg" src={image} alt={`Co-Partner ${index + 1}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Event Partners Section */}
      <div className="text-center w-full">
        <h2 className="text-3xl font-bold mb-10">Event Partners</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 place-items-center justify-center">
          {eventSponsors.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
              animate={cardEntryAnimation(index)}
              whileHover={{ scale: 1.15, rotateY: 5 }}
              className="shadow-lg flex justify-center items-center bg-white w-48 h-48 rounded-lg border-2 border-secondary shadow-secondary"
            >
              <img className="w-40 h-40 object-contain rounded-lg" src={image} alt={`Event Partner ${index + 1}`} />
            </motion.div>
          ))}
        </div>
      </div>


      {/* Stall Sponsors Section */}
      <div className="text-center w-full">
        <h2 className="text-3xl font-bold mb-10">Stall Sponsors</h2>
        <div className="flex justify-center flex-wrap gap-6">
          {stallsponsors.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
              animate={cardEntryAnimation(index)}
              whileHover={{ scale: 1.15, rotateY: 5 }}
              className="shadow-lg flex justify-center items-center bg-white w-48 h-48 rounded-lg border-2 border-secondary shadow-secondary"
            >
              <img className="w-40 h-40 object-contain rounded-lg" src={image} alt={`Event Partner ${index + 1}`} />
            </motion.div>
          ))}
        </div>
      </div>


    </div>
  );
}

export default Sponsors;
