//paper
import aidspaper from "../assets/EventsImages/EventDetails/paper/aids_paper.webp";
import aimlpaper from "../assets/EventsImages/EventDetails/paper/aiml_paper.webp";
import itpaper from "../assets/EventsImages/EventDetails/paper/it_paper.webp";
import csbspaper from "../assets/EventsImages/EventDetails/paper/csbs_paper.webp";
import ftpaper from "../assets/EventsImages/EventDetails/paper/ft_paper.webp";
import vlsipaper from "../assets/EventsImages/EventDetails/paper/vlsi_paper.webp";
import biopaper from "../assets/EventsImages/EventDetails/paper/bio_paper.webp";




//poster
import aidsposter from "../assets/EventsImages/EventDetails/poster/aids_poster.webp";
import aimlposter from "../assets/EventsImages/EventDetails/poster/aiml_poster.webp";
import civilposter from "../assets/EventsImages/EventDetails/poster/civil_poster.webp";
import itposter from "../assets/EventsImages/EventDetails/poster/it_poster.webp";
import cseposter from "../assets/EventsImages/EventDetails/poster/cse_poster.webp";
import eceposter from "../assets/EventsImages/EventDetails/poster/ece_poster.webp";
import eeeposter from "../assets/EventsImages/EventDetails/poster/eee_poster.webp";
import csbsposter from "../assets/EventsImages/EventDetails/poster/csbs_poster.webp";
import vlsiposter from "../assets/EventsImages/EventDetails/poster/vlsi_poster.webp";
import bioposter from "../assets/EventsImages/EventDetails/poster/bio_poster.webp";
import mechposter from "../assets/EventsImages/EventDetails/poster/mech_poster.webp";
import mctposter from "../assets/EventsImages/EventDetails/poster/mct_poster.webp";
import txtposter from "../assets/EventsImages/EventDetails/poster/txt_poster.webp";

//project
import mechproject from "../assets/EventsImages/EventDetails/project/mech_project.webp";

/*()
import aidsproject from "../assets/EventsImages/EventDetails/project/aids_project.webp";
import aimlproject from "../assets/EventsImages/EventDetails/project/aiml_project.webp";
import civilproject from "../assets/EventsImages/EventDetails/project/civil_project.webp";
import itproject from "../assets/EventsImages/EventDetails/project/it_project.webp";
import cseproject from "../assets/EventsImages/EventDetails/project/cse_project.webp";
import eceproject from "../assets/EventsImages/EventDetails/project/ece_project.webp";
import eeproject from "../assets/EventsImages/EventDetails/project/eee_project.webp";
import csbsproject from "../assets/EventsImages/EventDetails/project/csbs_project.webp";
import bioproject from "../assets/EventsImages/EventDetails/project/bio_project.webp";
import mctproject from "../assets/EventsImages/EventDetails/project/mct_project.webp";
import txtproject from "../assets/EventsImages/EventDetails/project/txt_project.webp";
import ftproject from "../assets/EventsImages/EventDetails/project/ft_project.webp";

*/

// move from technical to here

import Tech8 from "../assets/EventsImages/EventDetails/TechnicalImages/civil_tech1.webp";
import Tech10 from "../assets/EventsImages/EventDetails/TechnicalImages/cse_tech1.webp";
import Tech13 from "../assets/EventsImages/EventDetails/TechnicalImages/eee_tech1.webp";
import Tech14 from "../assets/EventsImages/EventDetails/TechnicalImages/ft_tech.webp";
import Tech16 from "../assets/EventsImages/EventDetails/TechnicalImages/mct_tech.webp";
import Tech17 from "../assets/EventsImages/EventDetails/TechnicalImages/mech_tech.webp";
import Tech20 from "../assets/EventsImages/EventDetails/TechnicalImages/txt_tech1.webp";

import Tech22 from "../assets/EventsImages/EventDetails/TechnicalImages/ft_tech1.webp";
import Tech23 from "../assets/EventsImages/EventDetails/TechnicalImages/ece_tech1.webp";




















// Paper,poster,project - simple tiles
export const exposAndShowsEvents = [
  //paper
  {
    image: aidspaper,
    eventId: "paper-aids",
  },
  {
    image: aimlpaper,
    eventId: "paper-aiml",
  },
  {
    image: itpaper,
    eventId: "paper-it",
  },
  {
    image: csbspaper,
    eventId: "paper-csbs",
  },
  {
    image: ftpaper,
    eventId: "paper-ft",
  },
  {
    image: vlsipaper,
    eventId: "paper-vlsi",
  },
  {
    image: biopaper,
    eventId: "paper-bio",
  },

  // moved paper

  {
    image: Tech8,
    eventId: "tech-civil-1",
    price: 250,
  },
  {
      image: Tech10,
      eventId: "tech-cse-1",
      price: 250,
    },
    {
        image: Tech13,
        eventId: "tech-eee-1",
        price: 250,
      },
        
        {
          image: Tech16,
          eventId: "tech-mct",
          price: 250,
        },
        {
          image: Tech17,
          eventId: "tech-mech",
          price: 250,
        },
        {
          image: Tech20,
          eventId: "tech-txt-1",
          price: 250,

        },
        {
          image: Tech23,
          eventId: "tech-ece1",
          price: 250,
        },
      {
          image: Tech22,
          eventId: "tech-ft-1",
          price: 250,
        },



        //move form technical
 

        {
          image: Tech14,
          eventId: "tech-ft",
          price: 250,
        },
  //poster
  {
    image: aidsposter,
    eventId: "poster-aids",
  },
  {
    image: aimlposter,
    eventId: "poster-aiml",
  },
  {
    image: civilposter,
    eventId: "poster-civil",
  },
  {
    image: itposter,
    eventId: "poster-it",
  },
  {
    image: cseposter,
    eventId: "poster-cse",
  },
  {
    image: eceposter,
    eventId: "poster-ece",
  },
  {
    image: eeeposter,
    eventId: "poster-eee",
  },
  {
    image: csbsposter,
    eventId: "poster-csbs",
  },
  {
    image: vlsiposter,
    eventId: "poster-vlsi",
  },
  {
    image: bioposter,
    eventId: "poster-bio",
  },
  {
    image: mechposter,
    eventId: "poster-mech",
  },
  {
    image: mctposter,
    eventId: "poster-mct",
  },
  {
    image: txtposter,
    eventId: "poster-txt",
  },
  //project

  {
    image: mechproject,
    eventId: "project-mech",
  },

  /*
  {
    image: aidsproject,
    eventId: "project-aids",
  },
  {
    image: aimlproject,
    eventId: "project-aiml",
  },
  {
    image: civilproject,
    eventId: "project-civil",
  },
  {
    image: itproject,
    eventId: "project-it",
  },

  {
    image: cseproject,
    eventId: "project-cse",
  },
  {
    image: eceproject,

    eventId: "project-ece",
  },
  {
    image: eeproject,
    eventId: "project-eee",
  },
  {
    image: csbsproject,
    eventId: "project-csbs",
  },
  {
    image: bioproject,
    eventId: "project-bio",
  },
  
  {
    image: mctproject,
    eventId: "project-mct",
  },
  {
    image: txtproject,
    eventId: "project-txt",
  },
  {
    image: ftproject,
    eventId: "project-ft",
  },

  */
 
        


 
];
