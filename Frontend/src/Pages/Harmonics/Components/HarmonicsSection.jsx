import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import dance from "../../../assets/HORMONICS/SOLO DANCE.png";
import group from "../../../assets/HORMONICS/GROUP.png";
import instruments from "../../../assets/HORMONICS/INSTRUMENT.png";
import musical from "../../../assets/HORMONICS/MUSICAL.png";
import shortFilm from "../../../assets/HORMONICS/short flim.png"
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";

const Card = () => {
  const navigate = useNavigate();
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const cards = [
    { id: 1, image: instruments, title: "Mastro Mania", text: "Musicians performing with musical instruments.", fee: "Registration Fee: 150", link: "/event/culturals-event-2" },
    { id: 2, image: musical, title: "Musical Mavericks", text: "Solo singing is an individual vocal performance with expression.", fee: "Registration Fee: 150", link: "/event/culturals-event-1" },
    { id: 3, image: group, title: "Beat Battle", text: "Synchronized dance performance by group.",fee: "Registration Fee: 600", link: "/event/culturals-event-3" },
    { id: 4, image: dance, title: "Spotlight Stepper", text: "Solo dance is expressive, graceful, and captivating.", fee: "Registration Fee: 150", link: "/event/culturals-event-4" },
    { id: 5, image: shortFilm, title: "Short Film", text: "A single moment can change a lifetime, shaping destiny in unexpected ways.", fee: "Registration Fee: 150", link: "/event/culturals-event-5" },
  ];

  const title = "Harmonicks";

  return (
    <div className="p-6 sm:p-8 md:p-10">
      <h1
        className="text-center font-bold text-white text-4xl sm:text-5xl mb-8 sm:mb-10 mt-20 sm:mt-[10px] md:mt-14"
        data-aos="fade-up"
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

      {/* Grid Layout - 4 Cards Per Row */}
      <div className="flex flex-wrap justify-center gap-6 px-4 sm:px-8">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="relative group cursor-pointer overflow-hidden duration-500 
                       w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(25%-1.125rem)] max-w-[300px] aspect-square bg-primary-dark 
                       bg-opacity-30 border border-primary-dark text-gray-50 p-3"
            data-aos="zoom-in"
            data-aos-delay={index * 200}
            onClick={()=>navigate(card.link)}
          >
            <img
              src={card.image}
              alt="Icon"
              className="group-hover:scale-110 w-full h-full object-cover duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-transparent to-transparent opacity-80" />
            <div className="absolute w-full left-0 p-3 bottom-0 duration-500 group-hover:-translate-y-2">
              <span className="text-sm sm:text-base font-bold block truncate">{card.title}</span>
              <p className="group-hover:opacity-100 w-full duration-500 opacity-0 text-[10px] sm:text-xs line-clamp-2">{card.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Card;
