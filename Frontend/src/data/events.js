// ============================================
// DAKSHAA 2026 - EVENTS DATA
// This data should match the database events
// ============================================

export const EVENTS_DATA = {
  // ============================================
  // TECHNICAL EVENTS (22 events)
  // ============================================
  technical: [
    { id: 'tech-aids', title: 'Rewind & Crack', department: 'AI & Data Science', price: 300 },
    { id: 'tech-aiml', title: 'SEMISPARK (Project Presentation)', department: 'AI & Machine Learning', price: 300 },
    { id: 'tech-bt', title: 'Reel-O-Science', department: 'Bio Technology', price: 100 },
    { id: 'tech-bt-1', title: 'BioNexathon', department: 'Bio Technology', price: 100 },
    { id: 'tech-bt-2', title: 'Bioblitz-Map', department: 'Bio Technology', price: 100 },
    { id: 'tech-civil', title: '3D Arena (Google SketchUp)', department: 'Civil Engineering', price: 100 },
    { id: 'tech-civil-1', title: 'Paper Presentation', department: 'Civil Engineering', price: 100 },
    { id: 'tech-cse', title: 'NeuroHack 2.0 (36-hour)', department: 'Computer Science & Engineering', price: 100 },
    { id: 'tech-cse-1', title: 'BotXhibit', department: 'CS & Business Systems', price: 100 },
    { id: 'tech-ece', title: 'Zero Component', department: 'Electronics & Communication', price: 100 },
    { id: 'tech-eee', title: 'Trailblazer', department: 'Electrical & Electronics', price: 100 },
    { id: 'tech-eee-1', title: 'Paper Presentation', department: 'Electrical & Electronics', price: 100 },
    { id: 'tech-ft', title: 'Bacteriart', department: 'Food Technology', price: 100 },
    { id: 'tech-it', title: 'Code Relay', department: 'Information Technology', price: 100 },
    { id: 'tech-mct', title: 'VoltEdge (Paper Presentation)', department: 'Mechatronics', price: 100 },
    { id: 'tech-mech', title: 'Paper Presentation', department: 'Mechanical Engineering', price: 100 },
    { id: 'tech-mech-1', title: 'Designathon', department: 'Mechanical Engineering', price: 100 },
    { id: 'tech-txt', title: 'DrapeX: Fabric Draping in Action', department: 'Textile Technology', price: 100 },
    { id: 'tech-txt-1', title: 'Paper Presentation', department: 'Textile Technology', price: 100 },
    { id: 'tech-vlsi', title: 'CoreX', department: 'VLSI Design', price: 100 },
    { id: 'tech-57', title: 'Paper Presentation', department: 'Mechanical Engineering', price: 100 },
  ],

  // ============================================
  // NON-TECHNICAL EVENTS (20 events) - ₹50 each
  // ============================================
  'non-technical': [
    { id: 'nontech-aids', title: 'AI MEME CONTEST', department: 'AI & Data Science', price: 50 },
    { id: 'nontech-aids1', title: 'IPL AUCTION', department: 'AI & Data Science', price: 50 },
    { id: 'nontech-bt', title: 'JUST-A-MINUTE (JAM)', department: 'Bio Technology', price: 50 },
    { id: 'nontech-civil', title: 'CIVIL CIRCUIT', department: 'Civil Engineering', price: 50 },
    { id: 'nontech-csbs', title: 'EMOJI PICTIONARY', department: 'CS & Business Systems', price: 50 },
    { id: 'nontech-cse', title: 'ARANGAM ATHIRA', department: 'Computer Science & Engineering', price: 50 },
    { id: 'nontech-cse1', title: 'BATTLE ARENA', department: 'Computer Science & Engineering', price: 50 },
    { id: 'nontech-ece', title: 'LINE X', department: 'Electronics & Communication', price: 50 },
    { id: 'nontech-ece1', title: 'Kahoot Quiz', department: 'Electronics & Communication', price: 50 },
    { id: 'nontech-eee', title: 'TWISTED TILES', department: 'Electrical & Electronics', price: 50 },
    { id: 'nontech-eee1', title: 'LOGO QUIZ', department: 'Electrical & Electronics', price: 500   },
    { id: 'nontech-eee2', title: 'UNIT WARS', department: 'Electrical & Electronics', price: 50 },
    { id: 'nontech-ft', title: 'UNMASKING BRANDS & FLAVOURS', department: 'Food Technology', price: 50 },
    { id: 'nontech-it', title: 'TREASURE HUNT', department: 'Information Technology', price: 50 },
    { id: 'nontech-mca', title: 'FACE PAINTING', department: 'MCA', price: 50 },
    { id: 'nontech-mct', title: 'MIND SPARK', department: 'Mechatronics', price: 50 },
    { id: 'nontech-mct1', title: 'TECH WITHOUT TECH', department: 'Mechatronics', price: 50 },
    { id: 'nontech-mech', title: 'FREEZEFRAME', department: 'Mechanical Engineering', price: 50 },
    { id: 'nontect-txt', title: 'T2T-Trash 2 Textile', department: 'Textile Technology', price: 50 },
    { id: 'nontech-vlsi', title: 'BlindBites: Taste it. Find it', department: 'VLSI Design', price: 50 },
  ],

  // ============================================
  // CULTURAL EVENTS - HARMONICKS (5 events) - ₹100 each
  // ============================================
  cultural: [
    { id: 'cultural-musical', title: 'Solo Singing', category: 'Musical', price: 100 },
    { id: 'cultural-instrument', title: 'Instrumental', category: 'Instrument', price: 100 },
    { id: 'cultural-group-dance', title: 'Group Dance', category: 'Group Dance', price: 100 },
    { id: 'cultural-solo-dance', title: 'Solo Dance', category: 'Solo Dance', price: 100 },
    { id: 'cultural-short-film', title: 'Short Film', category: 'Short Film', price: 150 },
  ],

  // ============================================
  // HACKATHON EVENTS (2 events)
  // ============================================
  hackathon: [
    { id: 'hackathon', title: '24-Hour Hackathon', description: 'Build innovative solutions', price: 300 },
    { id: 'codeathon', title: 'Code-a-thon', description: 'Competitive coding challenge', price: 200 },
  ],

  // ============================================
  // WORKSHOP EVENTS (14 events) - ₹300-450 each
  // ============================================
  workshop: [
    { id: 'workshop-aids', title: 'Robotic Process Automation', department: 'AI & Data Science', company: 'UiPath', price: 400 },
    { id: 'workshop-aiml', title: 'AI in Game Development', department: 'AI & Machine Learning', company: 'IITM Pravartak', price: 400 },
    { id: 'workshop-biotech', title: 'Next Gen Sequencing', department: 'Bio Technology', company: 'Genotypic Technology', price: 350 },
    { id: 'workshop-civil', title: 'Building Information Modeling', department: 'Civil Engineering', company: 'ICT Academy', price: 350 },
    { id: 'workshop-csbs', title: 'Blockchain 101', department: 'CS & Business Systems', company: 'Virtuospark', price: 350 },
    { id: 'workshop-cse', title: 'Mobile App Development', department: 'Computer Science & Engineering', company: 'RemitBee', price: 400 },
    { id: 'workshop-ece', title: 'IoT using LoRaWAN', department: 'Electronics & Communication', company: 'Industry Partner', price: 400 },
    { id: 'workshop-eee', title: 'EEE Workshop', department: 'Electrical & Electronics', company: 'Industry Partner', price: 350 },
    { id: 'workshop-ft', title: 'Food Tech Workshop', department: 'Food Technology', company: 'Industry Partner', price: 300 },
    { id: 'workshop-it', title: 'IT Workshop', department: 'Information Technology', company: 'Industry Partner', price: 400 },
    { id: 'workshop-mct', title: 'Mechatronics Workshop', department: 'Mechatronics', company: 'Industry Partner', price: 400 },
    { id: 'workshop-mech', title: 'Mechanical Workshop', department: 'Mechanical Engineering', company: 'Industry Partner', price: 350 },
    { id: 'workshop-textile', title: 'Textile Workshop', department: 'Textile Technology', company: 'Industry Partner', price: 300 },
    { id: 'workshop-vlsi', title: 'VLSI Design Workshop', department: 'VLSI Design', company: 'Industry Partner', price: 450 },
  ],

  // ============================================
  // CONFERENCE (1 event) - FREE
  // ============================================
  conference: [
    { id: 'conference', title: 'Dakshaa Tech Conference 2026', description: 'Keynote speeches from industry leaders', price: 0 },
  ],
};

// ============================================
// COMBO PACKAGES
// ============================================
export const COMBO_PACKAGES = [
  {
    id: 'silver_pass',
    name: 'Silver Pass',
    price: 399,
    originalPrice: 500,
    color: 'from-gray-400 to-gray-600',
    icon: '🥈',
    includes: [
      { category: 'technical', count: 2, label: '2 Technical Events' },
      { category: 'non-technical', count: 2, label: '2 Non-Technical Events' },
      { category: 'cultural', count: 1, label: '1 Cultural Event' },
    ],
    benefits: [
      'Access to 5 events',
      'Event certificate',
      'Lunch on Day 1',
    ],
  },
  {
    id: 'gold_pass',
    name: 'Gold Pass',
    price: 699,
    originalPrice: 900,
    color: 'from-yellow-400 to-yellow-600',
    icon: '🥇',
    popular: true,
    includes: [
      { category: 'technical', count: 4, label: '4 Technical Events' },
      { category: 'non-technical', count: 4, label: '4 Non-Technical Events' },
      { category: 'cultural', count: 2, label: '2 Cultural Events' },
      { category: 'hackathon', count: 1, label: '1 Hackathon' },
    ],
    benefits: [
      'Access to 11 events',
      'Event certificate',
      'Lunch on both days',
      'Exclusive merchandise',
      'Priority seating',
    ],
  },
  {
    id: 'platinum_pass',
    name: 'Platinum Pass',
    price: 999,
    originalPrice: 1500,
    color: 'from-purple-400 to-indigo-600',
    icon: '💎',
    includes: [
      { category: 'technical', count: 15, label: 'ALL Technical Events' },
      { category: 'non-technical', count: 12, label: 'ALL Non-Technical Events' },
      { category: 'cultural', count: 5, label: 'ALL Cultural Events' },
      { category: 'hackathon', count: 2, label: 'ALL Hackathons' },
      { category: 'workshop', count: 1, label: '1 Workshop' },
      { category: 'conference', count: 1, label: 'Conference Access' },
    ],
    benefits: [
      'UNLIMITED event access',
      'Premium certificate',
      'Lunch & snacks both days',
      'Exclusive merchandise kit',
      'VIP seating',
      'Networking dinner',
      'Internship opportunities',
    ],
  },
];

// ============================================
// CATEGORY CONFIG
// ============================================
export const CATEGORIES = {
  technical: { label: 'Technical', color: 'blue', icon: '💻' },
  'non-technical': { label: 'Non-Technical', color: 'green', icon: '🎮' },
  cultural: { label: 'Cultural', color: 'purple', icon: '🎭' },
  hackathon: { label: 'Hackathon', color: 'orange', icon: '🚀' },
  workshop: { label: 'Workshop', color: 'cyan', icon: '🔧' },
  conference: { label: 'Conference', color: 'pink', icon: '🎤' },
};

// Helper to get all events as flat array
export const getAllEvents = () => {
  return Object.values(EVENTS_DATA).flat();
};

// Helper to get events by category
export const getEventsByCategory = (category) => {
  return EVENTS_DATA[category] || [];
};

// Helper to get event by ID
export const getEventById = (eventId) => {
  return getAllEvents().find(e => e.id === eventId);
};

// Helper to get combo by ID
export const getComboById = (comboId) => {
  return COMBO_PACKAGES.find(c => c.id === comboId);
};

export default EVENTS_DATA;

