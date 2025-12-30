import React from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaInstagram, FaFacebook, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import ksrct from '../../assets/collegeLogoWhite.png';
import dakshaa from '../../assets/logo1.png';

const Footer = () => {
    return (
        <div className="footer bg-slate-950 text-white py-12 md:py-20 text-base border-t border-secondary/20">
            <div className="main grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-0 px-6 md:px-12 text-center md:text-left">

                <div className="logo flex justify-center md:justify-start">
                    <img src={ksrct} alt="KSRCT Logo" className="h-16 w-auto md:h-20" />
                </div>

                <div className="contact">
                    <h3 className="text-2xl md:text-3xl font-semibold font-orbitron text-secondary">Student Coordinators</h3>
                    <div className="flex flex-col items-center md:items-start gap-2 mt-3 md:mt-4">
                        <div className="flex items-center gap-2 md:gap-3 leading-8">
                            {/* <FaPhone className="text-white text-lg md:text-xl" /> */}
                            <p className="text-base md:text-lg font-poppins">9489243775 - (Kavinesh K)<br /> 7708739300 - (Gopinath T)<br />8144596872 - (Ruban B)</p>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 leading-8">
                            <FaEnvelope className="text-secondary text-lg md:text-xl" />
                            <p className="text-base md:text-lg font-poppins">dakshaa@ksrct.ac.in</p>
                        </div>
                    </div>
                </div>

                <div className="address">
                    <h3 className="text-2xl md:text-3xl ml-0 md:ml-8 font-semibold font-orbitron text-secondary">Address</h3>
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-2 md:gap-3 mt-2 md:mt-3 text-center md:text-left">
                        <div className="flex justify-center md:justify-start">
                            <FaMapMarkerAlt className="text-secondary text-lg md:text-xl mt-1 md:mt-2" />
                        </div>
                        <p className="text-base md:text-lg leading-8 md:leading-10 font-poppins">
                            K.S.Rangasamy College of Technology, <br />
                            KSR Kalvi Nagar, Tiruchengode-637 215, <br />
                            Tamil Nadu, India.
                        </p>
                    </div>
                </div>

                <div className="social flex flex-col items-center">
                    <img className="max-w-[150px] md:max-w-[190px] mb-3 md:mb-4" src={dakshaa} alt="Event Logo" />
                    <div className="icon flex gap-4 md:gap-6 mt-3 md:mt-4">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                            <FaInstagram className="text-xl md:text-2xl" />
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                            <FaFacebook className="text-xl md:text-2xl" />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                            <FaLinkedin className="text-xl md:text-2xl" />
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                            <FaYoutube className="text-xl md:text-2xl" />
                        </a>
                        <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                            <FaXTwitter className="text-xl md:text-2xl" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;
