import logo from "../../assets/logo1.png";
import collegeLogo from "../../assets/collegeLogoWhite.png";
import round from "../../assets/round.svg";
import { React, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Download, LogIn, LogOut, User } from "lucide-react";
import brochure from "../../assets/brochure.pdf";
import { supabase } from "../../supabase";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile) setUserRole(profile.role);
      } else {
        setUserRole('student');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setActiveLink("Home");
    else if (path === "/events") setActiveLink("Events");
    else if (path === "/schedule") setActiveLink("Event Schedule");
    else if (path === "/signup") setActiveLink("Register");
    else if (path === "/sponsors") setActiveLink("Sponsors");
    else if (path === "/teams") setActiveLink("Teams");
    else if (path === "/contact") setActiveLink("Contact");
    else if (path === "/feedback") setActiveLink("Feedback");
    else if (path.startsWith("/dashboard")) setActiveLink("Dashboard");
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = (linkName, path) => {
    setActiveLink(linkName);
    navigate(path);
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: "Event Schedule", path: "/schedule" },
    { name: "Sponsors", path: "/sponsors" },
    { name: "Teams", path: "/teams" },
    { name: "Contact", path: "/contact" },
    { name: "Feedback", path: "/feedback" },
  ];

  const getDashboardPath = () => {
    switch (userRole) {
      case 'super_admin': return '/admin';
      case 'registration_admin': return '/admin/desk';
      case 'event_coordinator': return '/coordinator';
      case 'volunteer': return '/volunteer';
      default: return '/dashboard';
    }
  };

  const isAdminRole = ['super_admin', 'registration_admin', 'event_coordinator', 'volunteer'].includes(userRole);

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled || isMenuOpen 
          ? "bg-slate-950/90 backdrop-blur-lg py-3 shadow-2xl border-b border-white/10" 
          : "bg-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0 flex items-center"
            >
              <img
                className="h-10 md:h-14 w-auto cursor-pointer hover:scale-105 transition-transform"
                src={logo}
                onClick={() => handleLinkClick("Home", "/")}
                alt="Logo"
              />
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleLinkClick(link.name, link.path)}
                  className={`font-orbitron text-sm tracking-widest transition-all duration-300 hover:text-secondary relative group ${
                    activeLink === link.name ? "text-secondary" : "text-white/80"
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full ${
                    activeLink === link.name ? "w-full" : ""
                  }`} />
                </button>
              ))}
              
              <div className="flex items-center gap-4 ml-4">
                {user ? (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLinkClick("Dashboard", getDashboardPath())}
                      className={`${isAdminRole ? 'text-orange-400 hover:text-orange-300' : 'text-white/90 hover:text-secondary'} transition-colors font-orbitron text-sm tracking-widest flex items-center gap-2`}
                    >
                      <User size={16} /> {isAdminRole ? 'ADMIN PANEL' : 'DASHBOARD'}
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="text-red-400 hover:text-red-300 transition-colors font-orbitron text-sm tracking-widest flex items-center gap-2"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleLinkClick("Login", "/login")}
                    className="text-white/90 hover:text-secondary transition-colors font-orbitron text-sm tracking-widest flex items-center gap-2"
                  >
                    <LogIn size={16} /> LOGIN
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLinkClick("Register", user ? "/register-events" : "/signup")}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-secondary to-cyan-500 text-white font-orbitron text-sm tracking-widest font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  {user ? "REGISTER EVENTS" : "REGISTER"}
                </motion.button>
              </div>

              
              <a href="https://ksrct.ac.in/" target="_blank" rel="noopener noreferrer" className="ml-6">
                <img className="h-10 w-auto opacity-80 hover:opacity-100 transition-opacity" src={collegeLogo} alt="College Logo" />
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <button
                onClick={toggleMenu}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleLinkClick(link.name, link.path)}
                    className={`block w-full text-left px-4 py-4 text-base font-orbitron tracking-widest transition-colors ${
                      activeLink === link.name 
                        ? "text-secondary bg-white/5" 
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.name}
                  </button>
                ))}
                <div className="pt-4 flex flex-col gap-3 px-4">
                  {user ? (
                    <>
                      <button 
                        onClick={() => handleLinkClick("Dashboard", getDashboardPath())}
                        className={`w-full py-3 text-center font-orbitron tracking-widest ${isAdminRole ? 'text-orange-400 border-orange-400/20' : 'text-white border-white/20'} border rounded-lg flex items-center justify-center gap-2`}
                      >
                        <User size={18} /> {isAdminRole ? 'ADMIN PANEL' : 'DASHBOARD'}
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full py-3 text-center font-orbitron tracking-widest text-red-400 border border-red-400/20 rounded-lg flex items-center justify-center gap-2"
                      >
                        <LogOut size={18} /> LOGOUT
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleLinkClick("Login", "/login")}
                      className="w-full py-3 text-center font-orbitron tracking-widest text-white border border-white/20 rounded-lg flex items-center justify-center gap-2"
                    >
                      <LogIn size={18} /> LOGIN
                    </button>
                  )}
                  <button
                    onClick={() => handleLinkClick("Register", user ? "/register-events" : "/signup")}
                    className="w-full py-3 text-center font-orbitron tracking-widest text-white bg-secondary rounded-lg shadow-lg shadow-secondary/20"
                  >
                    {user ? "REGISTER EVENTS" : "REGISTER"}
                  </button>

                  <a
                    href={brochure}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 flex items-center justify-center gap-2 font-orbitron tracking-widest text-secondary border border-secondary/30 rounded-lg"
                  >
                    <Download size={18} />
                    BROCHURE
                  </a>
                </div>
                <div className="pt-6 flex justify-center">
                  <img className="h-10 w-auto opacity-60" src={collegeLogo} alt="College Logo" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
