import { useState } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaYoutube,
  FaUser,
  FaChevronDown,
  FaChevronUp,
  FaBuilding,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

const InquiryCard = ({ inquiry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="bg-slate-900/50 border border-secondary/30 p-4 rounded-lg mb-4 text-white shadow-lg w-full"
  >
    <p>
      <FaUser className="inline mr-2 text-secondary" /> {inquiry.name}
    </p>
    <p>
      <FaPhone className="inline mr-2 text-secondary" /> {inquiry.mobile}
    </p>
    {/* <p><FaEnvelope className="inline mr-2 text-red-400" /> {inquiry.email}</p> */}
    {inquiry.company && (
      <p>
        <FaBuilding className="inline mr-2 text-secondary" /> {inquiry.company}
      </p>
    )}
  </motion.div>
);

const InquirySection = ({ title, inquiries }) => {
  const [showInquiries, setShowInquiries] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-4 p-4 bg-secondary/10 border border-secondary/20 rounded-lg text-white w-full"
    >
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setShowInquiries(!showInquiries)}
      >
        <h1 className="text-lg font-semibold text-secondary">{title}</h1>
        {showInquiries ? <FaChevronUp className="text-secondary" /> : <FaChevronDown className="text-secondary" />}
      </motion.div>
      <AnimatePresence>
        {showInquiries && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-3 overflow-hidden"
          >
            {inquiries.map((inquiry, index) => (
              <InquiryCard key={index} inquiry={inquiry} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Contact = () => {
  const generalInquiries = [
    { name: "Kavinesh", mobile: "+91 9489243775" },
    { name: "Ajay", mobile: "+91 6383945083" },
  ];

  const [formData, setFormData] = useState({
    username: "",
    email_id: "",
    mobile_number: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { username, email_id, mobile_number, message } = formData;

    if (!username || !email_id || !mobile_number || !message) {
      alert("All fields are required!");
      return;
    }

    const user_id = uuidv4();

    try {
      const response = await fetch("http://localhost:3000/add-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
          username,
          email_id,
          mobile_number,
          message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Contact details added successfully!");
        setFormData({
          username: "",
          email_id: "",
          mobile_number: "",
          message: "",
        });
      } else {
        alert(result.error || "Failed to add contact details.");
      }
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      alert("Internal Server Error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="flex justify-center py-10 mt-36 w-full overflow-x-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-screen-lg mx-auto p-4 sm:p-6 text-white border-4 border-sky-700 rounded-lg bg-gray-900 bg-opacity-80 shadow-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <h1 className="font-bold mb-4 text-xl text-sky-400">Connect</h1>
            <motion.div className="social-icon flex space-x-2 sm:space-x-4 mb-4 items-center w-full">
              {[
                { icon: <FaLinkedin />, link: "https://www.linkedin.com/school/ksrct1994/", color: "text-sky-400" },
                {
                  icon: <FaInstagram />,
                  link: "https://www.instagram.com/ksrct1994?igsh=bTI2bzN6MDJuZGJy",
                  color: "text-sky-400",
                },
                { icon: <FaFacebook />, link: "#", color: "text-sky-400" },
                { icon: <FaYoutube />, link: "#", color: "text-sky-400" },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.link}
                  whileHover={{ scale: 1.2, rotate: 5, backgroundColor: "rgba(14, 165, 233, 0.2)" }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  target="_blank"
                  className={`text-xl sm:text-2xl w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${social.color} rounded-full bg-sky-900/30 border border-sky-500/30`}
                >
                  {social.icon}
                </motion.a>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="map w-full"
            >
              <iframe
                className="gmap_iframe w-full h-[200px] sm:h-[250px] border-4 border-sky-800 rounded-lg"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src="https://maps.google.com/maps?width=600&height=400&hl=en&q=K.S.Rangasamy College Of Technology&t=&z=14&ie=UTF8&iwloc=B&output=embed"
              ></iframe>
            </motion.div>
            <InquirySection
              title="General Inquiries"
              inquiries={generalInquiries}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="p-4 sm:p-6 bg-slate-900/30 border border-secondary/30 rounded-lg h-fit w-full"
          >
            <h1 className="text-2xl font-bold mb-4 text-secondary font-orbitron">Contact</h1>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {[
                {
                  placeholder: "Name",
                  icon: <FaUser className="text-secondary mr-2" />,
                  name: "username",
                },
                {
                  placeholder: "Mobile",
                  icon: <FaPhone className="text-secondary mr-2" />,
                  name: "mobile_number",
                },
                {
                  placeholder: "Email",
                  icon: <FaEnvelope className="text-secondary mr-2" />,
                  name: "email_id",
                },
                {
                  placeholder: "Message",
                  icon: <FaMapMarkerAlt className="text-secondary mr-2" />,
                  name: "message",
                  isTextArea: true,
                },
              ].map((input, index) => (
                <motion.div
                  key={index}
                  whileFocus={{ scale: 1.02, borderColor: "rgba(6, 182, 212, 0.5)" }}
                  className="flex items-start bg-secondary/10 border border-secondary/20 p-2 rounded-lg w-full"
                >
                  {input.icon}
                  {input.isTextArea ? (
                    <textarea
                      name={input.name}
                      placeholder={input.placeholder}
                      className="bg-transparent w-full outline-none text-white resize-none h-24"
                      value={formData[input.name]}
                      onChange={handleChange}
                    ></textarea>
                  ) : (
                    <input
                      type="text"
                      name={input.name}
                      placeholder={input.placeholder}
                      className="bg-transparent w-full outline-none text-white"
                      value={formData[input.name]}
                      onChange={handleChange}
                    />
                  )}
                </motion.div>
              ))}
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(6, 182, 212, 0.8)" }}
                className="w-full p-2 bg-secondary rounded-lg hover:bg-secondary-dark text-white font-orbitron tracking-widest transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                type="submit"
              >
                Submit
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Contact;
