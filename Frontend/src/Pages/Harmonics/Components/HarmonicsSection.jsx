import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import hr1 from "../../../assets/HORMONICS/hr1.png";
import hr2 from "../../../assets/HORMONICS/hr2.png";
import hr3 from "../../../assets/HORMONICS/hr3.png";
import hr4 from "../../../assets/HORMONICS/hr4.png";
import hr5 from "../../../assets/HORMONICS/hr5.png"
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";

const Card = () => {
  const navigate = useNavigate();
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const cards = [
    { id: 1, image: hr1, title: "Infinite Step", text: "A solo dance competition showcasing rhythm, expression, and graceful movements.", fee: "Registration Fee: 150", link: "/event/culturals-event-1" },
    { id: 2, image: hr2, title: "cine fest", text: "A short film competition that brings creative storytelling and cinematic vision to life.", fee: "Registration Fee: 150", link: "/event/culturals-event-2" },
    { id: 3, image: hr3, title: "spotlight", text: "An open stage event that goes beyond talent, celebrating confidence and originality.",fee: "Registration Fee: 600", link: "/event/culturals-event-3" },
    { id: 4, image: hr4, title: "Musical maverics", text: "A solo singing competition highlighting vocal strength, emotion, and musical finesse.", fee: "Registration Fee: 150", link: "/event/culturals-event-4" },
    { id: 5, image: hr5, title: "Beat mode", text:"A group dance competition featuring synchronization, energy, and powerful choreography.", fee: "Registration Fee: 150", link: "/event/culturals-event-5" },
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
