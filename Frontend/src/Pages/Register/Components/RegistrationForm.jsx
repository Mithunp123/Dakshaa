import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from 'react-hot-toast';
import {
  Package,
  Calendar,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
  Star,
  Zap,
  Trophy,
  Building,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";
import EventCard from "./EventCard";
import ComboCard from "./ComboCard";
import eventConfigService, {
  registerForEvent,
} from "../../../services/eventConfigService";
import comboService from "../../../services/comboService";
import paymentService from "../../../services/paymentService";
import pendingPaymentService from "../../../services/pendingPaymentService";
import notificationService from "../../../services/notificationService";
import { supabase } from "../../../supabase";
import { supabaseService } from "../../../services/supabaseService";

// Helper: Read session from localStorage synchronously
const getStoredUser = () => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const sessionKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    const storedSession = localStorage.getItem(sessionKey);
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      if (parsed.expires_at && parsed.expires_at * 1000 > Date.now()) {
        console.log('📦 Found valid session in localStorage on init');
        return parsed.user;
      }
    }
  } catch (e) {
    console.warn('Could not read stored session:', e.message);
  }
  return null;
};

const RegistrationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const preSelectedEventId = location.state?.selectedEventId;
  
  // Check URL parameter for skip flag
  const urlParams = new URLSearchParams(location.search);
  const skipFromUrl = urlParams.get('skip') === 'true';
  const skipToEventSelection = location.state?.skipToEventSelection || skipFromUrl; // Flag to skip step 1
  
  // Check if returning from successful payment
  const registrationSuccess = location.state?.registrationSuccess;
  
  // Team registration data from MyTeams
  const teamRegistrationData = location.state?.teamRegistration ? {
    teamId: location.state.teamId,
    teamName: location.state.teamName,
    eventId: location.state.eventId,
    eventName: location.state.eventName,
    teamMembers: location.state.teamMembers,
    memberCount: location.state.memberCount,
    isPartialPayment: location.state.isPartialPayment || false,
    registeredCount: location.state.registeredCount || 0
  } : null;
  
  const [currentStep, setCurrentStep] = useState(1); // Start at step 1, will adjust after events load
  const [registrationMode, setRegistrationMode] = useState("");
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [userPurchasedCombos, setUserPurchasedCombos] = useState([]);
  const [teamData, setTeamData] = useState(teamRegistrationData);
  const [calculatedTeamAmount, setCalculatedTeamAmount] = useState(null);
  const [teamAmountFetched, setTeamAmountFetched] = useState(false);
  const [preSelectApplied, setPreSelectApplied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [events, setEvents] = useState(() => {
    // Initialize with cached events for instant display
    const cached = eventConfigService.getCachedEvents();
    return cached || [];
  });
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(() => getStoredUser()); // Initialize with stored user
  const [userProfile, setUserProfile] = useState(null);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [pendingPaymentEvents, setPendingPaymentEvents] = useState(new Set());
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showingCachedData, setShowingCachedData] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  
  // Department Filter State
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef(null);

  const departments = [
    "ALL",
    "AI-DS",
    "AIML",
    "BT",
    "CIVIL",
    "CSBS",
    "CSE",
    "CULTURALS",
    "ECE",
    "EDC",
    "EEE",
    "FT",
    "IPR",
    "IT",
    "MCA",
    "MCT",
    "MECH",
    "SOES",
    "SOLS",
    "TEXTILE",
    "TXT",
    "VLSI"
  ];
  
  // State for Mixed Registration (Team Details per Event)
  const [teamDetailsMap, setTeamDetailsMap] = useState({});
  
  // State for Terms and Conditions
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Ref to track footer visibility
  const footerObserverRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Detect when footer becomes visible to hide navigation buttons
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Trigger when 10% of footer is visible
    );

    observer.observe(footer);
    footerObserverRef.current = observer;

    return () => {
      if (footerObserverRef.current) {
        footerObserverRef.current.disconnect();
      }
    };
  }, []);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  // Close department dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setIsDeptDropdownOpen(false);
      }
    };

    if (isDeptDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDeptDropdownOpen]);

  // Memoized steps configuration
  const steps = useMemo(
    () => [
      { number: 1, title: "Choose Type", icon: Package },
      {
        number: 2,
        title: registrationMode === "combo" ? "Select Combo" : registrationMode === "team" ? "Team Details" : "Select Events",
        icon: Calendar,
      },
      {
        number: 3,
        title: registrationMode === "combo" ? "Select Events" : "Review",
        icon: Users,
      },
      {
        number: 4,
        title: registrationMode === "combo" ? "Review" : "Complete",
        icon: registrationMode === "combo" ? Users : Check,
      },
      ...(registrationMode === "combo" ? [{ number: 5, title: "Complete", icon: Check }] : []),
    ],
    [registrationMode]
  );

  // Handle payment success callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success' && user?.id) {
      console.log('✅ Payment success detected, clearing pending payments');
      
      // Clear expired pending payments
      pendingPaymentService.clearExpiredPayments();
      
      // Sync with database to clear completed payments
      pendingPaymentService.syncWithDatabase(supabase, user.id).then(() => {
        // Reload pending payment events
        const pending = pendingPaymentService.getPendingPayments();
        const pendingEventIds = new Set(
          pending
            .filter(p => p.userId === user.id)
            .map(p => p.eventId)
        );
        setPendingPaymentEvents(pendingEventIds);
        
        // Reload registered events
        eventConfigService.getUserRegisteredEventIds(user.id).then(ids => {
          setRegisteredEventIds(ids);
        });
      });
      
      // Show success toast
      toast.success('Payment successful. Registration confirmed. Redirecting to home...', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Redirect to home after a delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [user]);

  // Ref to prevent duplicate data loading in StrictMode
  const dataLoadedRef = useRef(false);
  const loadingRef = useRef(false);
  const effectIdRef = useRef(0);

  // Load data and set up auth listener
  useEffect(() => {
    // Increment effect ID to track this specific effect run
    const currentEffectId = ++effectIdRef.current;
    
    // Prevent double execution in React StrictMode if data already loaded
    if (dataLoadedRef.current) {
      console.log('⏭️ Skipping duplicate load call (data already loaded)');
      setLoading(false);
      return;
    }
    
    console.log(`🚀 Starting data loading... (effect #${currentEffectId})`);
    console.log('👤 Initial user:', user ? `✅ ${user.id}` : '❌ None');
    loadingRef.current = true;
    
    // Helper to check if this effect is still valid
    const isEffectValid = () => effectIdRef.current === currentEffectId;
    
    const loadData = async () => {
      try {
        console.log('=== LOADING DATA ===');
        
        // Check if we have cached events for instant display
        const cachedEvents = eventConfigService.getCachedEvents();
        const hasCachedData = cachedEvents && cachedEvents.length > 0;
        
        if (hasCachedData && isEffectValid()) {
          console.log('⚡ Showing cached events instantly:', cachedEvents.length);
          // Auto-close full events even in cached data
          const cachedWithAutoClose = cachedEvents.map(event => {
            const isFull = event.current_registrations >= event.capacity;
            if (isFull && event.is_open) {
              return { ...event, is_open: false };
            }
            return event;
          });
          setEvents(cachedWithAutoClose);
          setShowingCachedData(true);
          setLoading(false); // Hide loading spinner immediately
        } else {
          setLoading(true); // Show loading spinner only if no cache
        }
        
        // Load events (always fetch fresh in background)
        const eventsPromise = eventConfigService.getEventsWithStats().catch(err => {
          console.error('Failed to load events:', err);
          return { success: false, data: cachedEvents || [] }; // Fallback to cache
        });
        
        // Load combos if user exists
        let combosPromise;
        let registeredIdsPromise;
        
        if (user?.id) {
          console.log('🔄 Loading combos for user:', user.id);
          combosPromise = comboService.getActiveCombosForStudents(user.id).catch(err => {
            console.error('Failed to load combos:', err);
            return { success: false, data: [] };
          });
          
          // Fetch user's PAID combo purchases (SINGLE CALL - removed duplicate)
          const paidCombosPromise = comboService.getUserPaidCombos(user.id).then(result => {
            if (isEffectValid() && result.success) {
              console.log('💳 User paid combos:', result.data.length);
              setUserPurchasedCombos(result.data);
            }
          }).catch(err => {
            console.warn('Failed to load paid combos:', err);
          });
          
          // Fetch registered events FIRST - important for showing already registered events as disabled
          registeredIdsPromise = eventConfigService.getUserRegisteredEventIds(user.id).catch(err => {
            console.error('Failed to load registered IDs:', err);
            return new Set();
          });
          
          // Sync pending payments with database and load pending event IDs (don't block on this)
          pendingPaymentService.syncWithDatabase(supabase, user.id).then(() => {
            const pending = pendingPaymentService.getPendingPayments();
            const pendingEventIds = new Set(
              pending
                .filter(p => p.userId === user.id)
                .map(p => p.eventId)
            );
            if (isEffectValid()) {
              console.log('💳 Pending payment events:', pendingEventIds.size, 'events');
              setPendingPaymentEvents(pendingEventIds);
            }
          }).catch(err => {
            console.warn('Failed to sync pending payments:', err);
          });
          
          // Fetch profile (don't block on this)
          supabase.from("profiles")
            .select("full_name, email, mobile_number, gender, college_name, department, year_of_study, roll_number")
            .eq("id", user.id)
            .single()
            .then(({ data: profile }) => {
              if (isEffectValid()) setUserProfile(profile);
            })
            .catch(err => {
              console.warn('Failed to load profile Please log in again.', err);
            });
        } else {
          console.log('⚠️ No user - skipping combos');
          combosPromise = Promise.resolve({ success: false, data: [] });
          registeredIdsPromise = Promise.resolve(new Set());
        }
        
        const [eventsResult, combosResult, registeredIds] = await Promise.all([
          eventsPromise, 
          combosPromise,
          registeredIdsPromise
        ]);
        
        // Check if this effect is still valid before updating state
        if (isEffectValid()) {
          const eventsData = eventsResult?.data || [];
          const combosData = combosResult?.success ? (combosResult.data || []) : [];
          
          console.log(`✅ [RegistrationForm] Effect #${currentEffectId} - Loaded ${eventsData.length} events`);
          console.log(`✅ [RegistrationForm] Loaded ${combosData.length} combos`);
          console.log(`✅ [RegistrationForm] Loaded ${registeredIds.size} registered event IDs`);
          
          // Auto-close full events (frontend restriction)
          const eventsWithAutoClose = eventsData.map(event => {
            const isFull = event.current_registrations >= event.capacity;
            if (isFull && event.is_open) {
              console.log(`🔒 Auto-closing full event: ${event.name} (${event.current_registrations}/${event.capacity})`);
              return { ...event, is_open: false };
            }
            return event;
          });
          
          // ALWAYS update events state with fresh data
          setEvents(eventsWithAutoClose);
          setShowingCachedData(false);
          setCombos(combosData);
          setRegisteredEventIds(registeredIds);
          setLoading(false);
          
          console.log('✅ [RegistrationForm] State updated successfully');
          
          dataLoadedRef.current = true;
        } else {
          console.warn(`⚠️ [RegistrationForm] Effect #${currentEffectId} cancelled (newer effect exists)`);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (isEffectValid()) {
          setLoading(false);
          // Show error toast
          toast.error('Failed to load events. Please refresh the page.', {
            duration: 4000,
            position: 'top-center',
          });
        }
      } finally {
        loadingRef.current = false;
      }
    };
    
    loadData();
    
    // Auth state listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth changed:', event);
      if (!isEffectValid()) return;
      
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN') {
          // Reload combos on sign in
          comboService.getActiveCombosForStudents(session.user.id).then(result => {
            if (isEffectValid() && result.success) setCombos(result.data || []);
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setCombos([]);
        navigate('/login');
      }
    });
    
    return () => {
      // Cleanup - no need to set anything, effectIdRef will naturally invalidate
      subscription.unsubscribe();
    };
  }, []); // Run once on mount - user is already initialized from localStorage

  // Handle successful payment return
  useEffect(() => {
    if (registrationSuccess) {
      setCurrentStep(4);
      toast.success('Registration completed successfully.', {
        duration: 4000,
        position: 'top-center',
      });
    }
  }, [registrationSuccess]);

  // Apply pre-selection after events are loaded
  useEffect(() => {
    // Handle team registration pre-selection
    if (teamRegistrationData && events.length > 0 && !preSelectApplied) {
      console.log('Team registration data:', teamRegistrationData);
      console.log('Looking for event:', teamRegistrationData.eventId);
      const matchedEvent = events.find(e => {
        console.log('Checking event:', e.event_id, e.id);
        return e.id === teamRegistrationData.eventId || e.event_id === teamRegistrationData.eventId;
      });
      console.log('Matched event:', matchedEvent);
      if (matchedEvent) {
        setRegistrationMode("team");
        setSelectedEvents([matchedEvent.id || matchedEvent.event_id]);
        setCurrentStep(3); // Skip to review
        setPreSelectApplied(true);
        return;
      } else {
        // Event not found, but still set team mode and go to step 2 to select
        console.warn('Event not found, showing team event selection');
        setRegistrationMode("team");
        setCurrentStep(2);
        setPreSelectApplied(true);
        return;
      }
    }
    
    // Handle individual event pre-selection or skip to event selection
    if ((preSelectedEventId || skipToEventSelection) && events.length > 0 && !preSelectApplied) {
      // Always set individual mode and go to step 2
      setRegistrationMode("individual");
      setCurrentStep(2);
      
      // If a specific event was passed, try to pre-select it
      if (preSelectedEventId) {
        // Find the event by event_key OR by id
        const matchedEvent = events.find(
          (e) => e.event_key === preSelectedEventId || e.id === preSelectedEventId
        );
        
        if (matchedEvent) {
          const eventUUID = matchedEvent.id;
          // Check if event is full
          const isFull = matchedEvent.current_registrations >= matchedEvent.capacity;
          const isOpen = matchedEvent.is_open !== false;
          
          if (!isFull && isOpen) {
            setSelectedEvents([eventUUID]);
          }
        }
      }
      
      setPreSelectApplied(true);
    }
  }, [preSelectedEventId, skipToEventSelection, teamRegistrationData, events, preSelectApplied]);

  // Memoized categories - prevents recalculation on every render
  const categories = useMemo(() => {
    // Define the preferred categories as requested by user - these will ALWAYS be shown
    const alwaysShowCategories = ["Technical", "Non-Technical", "Team Events", "Hackathon", "Workshop", "Sports","Cultural","Conference"];
    
    // Additional categories that only show if events exist
    const optionalCategories = ["Conference"];
    
    // Get all unique categories from events
    const uniqueCategories = new Set(
      events
        .filter(
          (e) =>
            e.category && e.category !== "Special" && e.category.trim() !== ""
        )
        .map((e) => e.category.trim())
    );
    
    // Always include the mandatory categories, plus optional ones if they exist in events
    const filteredCategories = [
      ...alwaysShowCategories,
      ...optionalCategories.filter(cat => uniqueCategories.has(cat))
    ];
    
    return ["ALL", ...filteredCategories].filter(Boolean);
  }, [events]);

  // Memoized special events
  const specialEvents = useMemo(
    () => events.filter((event) => event.category === "Special"),
    [events]
  );

  // Memoized filtered events - prevents recalculation on every render
  const filteredEvents = useMemo(() => {
    // Get list of specific event IDs from combo quotas (if any)
    const specificEventIds = new Set();
    const allowedCategories = new Set();
    const categoriesWithSpecificEvents = new Set();
    
    if (registrationMode === "combo" && selectedCombo?.category_quotas) {
      Object.entries(selectedCombo.category_quotas).forEach(([category, quota]) => {
        const categoryKey = category.toLowerCase().trim();
        // Check if quota is a UUID (specific event ID)
        const isEventId = typeof quota === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quota);
        if (isEventId) {
          specificEventIds.add(quota);
          categoriesWithSpecificEvents.add(categoryKey);
        }
        // Always add the category to allowed categories
        allowedCategories.add(categoryKey);
      });
    }
    
    return events.filter((event) => {
      if (event.category === "Special") return false;

      const eventId = event.id || event.event_id;
      const eventCategory = (event.category || "").toLowerCase().trim();

      // For combo mode, ONLY show events from allowed categories but exclude team events
      if (registrationMode === "combo" && allowedCategories.size > 0) {
        // Check if this is a team event and exclude it from combo packages
        const minTeamSize = event.min_team_size || 0;
        const maxTeamSize = event.max_team_size || 0;
        const isTeamEvent = minTeamSize > 1 || maxTeamSize > 1 || event.category === "Team Events";
        
        if (isTeamEvent) {
          return false; // Don't show team events in combo packages
        }
        
        // If this category has a specific event configured, only show that specific event
        if (categoriesWithSpecificEvents.has(eventCategory)) {
          if (!specificEventIds.has(eventId)) {
            return false; // This category has a specific event, but this isn't it
          }
        } else if (!allowedCategories.has(eventCategory)) {
          // This category is not in the combo quotas - don't show
          return false;
        }
        // Event is from an allowed category (either specific or count-based)
      }

      const eventName = (event.name || event.event_name || "").toLowerCase();
      const eventDescription = (event.description || "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        eventName.includes(searchLower) ||
        eventDescription.includes(searchLower);
      
      // For combo mode, only filter by search (categories are already filtered above)
      if (registrationMode === "combo") {
        // When "All Events" is selected, show all allowed events
        if (categoryFilter === "ALL") {
          return matchesSearch;
        }
        // Otherwise filter by selected category (must still be in allowed categories)
        return matchesSearch && eventCategory === categoryFilter.toLowerCase().trim();
      }
      
      // For non-combo modes (individual/team), use normal category filtering
      const minTeamSize = event.min_team_size || 0;
      const maxTeamSize = event.max_team_size || 0;
      const isTeamEvent = minTeamSize > 1 || maxTeamSize > 1;
      
      let matchesCategory = false;
      if (categoryFilter === "ALL") {
        matchesCategory = true;
      } else if (categoryFilter === "Team Events") {
        // Check both the boolean flag and team size
        matchesCategory = isTeamEvent || (event.is_team_event === true);
      } else if (categoryFilter === "Hackathon") {
        // Match if category or name contains "hackathon"
        matchesCategory = eventCategory.includes("hackathon") || eventName.includes("hackathon");
      } else {
        // Case-insensitive comparison for category
        matchesCategory = eventCategory === categoryFilter.toLowerCase();
      }

      // Department Filter Logic
      let matchesDept = true;
      if (deptFilter !== "ALL") {
        const deptLower = deptFilter.toLowerCase();
        // Use event_id string specifically for department matching as it contains the readable dept code
        // and ignore numeric suffixes if present (though includes check handles it)
        const lookupId = event.event_id;
        
        if (lookupId) {
           const idLower = lookupId.toLowerCase();
           matchesDept = idLower.includes(deptLower);
        } else {
           matchesDept = false;
        }
      }

      return matchesSearch && matchesCategory && matchesDept;
    });
  }, [events, searchTerm, categoryFilter, deptFilter, registrationMode, selectedCombo]);

  // Memoized selected event details
  const selectedEventDetails = useMemo(
    () => events.filter((e) => selectedEvents.includes(e.id || e.event_id)),
    [events, selectedEvents]
  );

  // For team registrations, fetch backend-calculated amount when on review step
  useEffect(() => {
    const fetchTeamAmountPreview = async () => {
      if (registrationMode !== "team") return;
      if (currentStep !== 3) return; // Only on Review step
      if (!teamData?.teamId) return;
      if (!selectedEvents.length) return;

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const body = {
          team_id: teamData.teamId,
          event_id: selectedEvents[0]
        };

        console.log('💰 Fetching team amount preview:', body);

        const response = await fetch(`${apiUrl}/payment/calculate-team-amount`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const result = await response.json();
        if (response.ok && result.success && typeof result.calculated_amount === 'number') {
          setCalculatedTeamAmount(result.calculated_amount);
          console.log('✅ Team amount preview loaded:', result);
        } else {
          console.warn('⚠️ Failed to calculate team amount preview:', result);
        }
      } catch (error) {
        console.error('❌ Error fetching team amount preview:', error);
      }
    };

    fetchTeamAmountPreview();
  }, [registrationMode, currentStep, teamData, selectedEvents]);

  // Check if user can proceed based on current step and terms acceptance
  const canProceedBasedOnTerms = useMemo(() => {
    // On confirmation step (step 3 for non-combo, step 4 for combo), require terms acceptance
    if ((currentStep === 3 && registrationMode !== "combo") || 
        (currentStep === 4 && registrationMode === "combo")) {
      return termsAccepted;
    }
    return true; // Other steps don't require terms
  }, [currentStep, registrationMode, termsAccepted]);

  // Memoized total amount
  const totalAmount = useMemo(() => {
    // For legacy single-team mode
    if (registrationMode === "team" && calculatedTeamAmount !== null) {
      return calculatedTeamAmount;
    }

    // For combo packages - fixed price (no extra charges for team members)
    if (registrationMode === "combo" && selectedCombo) {
      return parseFloat(selectedCombo.price) || 0;
    }

    let sum = 0;
    // For "Own Combo" (Individual + Mixed Team) or just plain selection
    selectedEventDetails.forEach(e => {
       const isTeam = (e.min_team_size > 1 || e.max_team_size > 1);
       const isConference = (e.category || '').toLowerCase() === 'conference';
       
       if (isTeam) {
          const eventId = e.id || e.event_id;
          const details = teamDetailsMap[eventId];
          const count = details?.memberCount ? parseInt(details.memberCount) : (e.min_team_size || 1);
          const price = parseFloat(e.price || 0);
          
          // Apply 50% discount for additional conference attendees
          if (isConference && count > 1) {
            // First person pays full price, additional people pay 50%
            const firstPersonPrice = price;
            const additionalPeoplePrice = price * 0.5 * (count - 1);
            sum += (firstPersonPrice + additionalPeoplePrice);
          } else {
            sum += (price * count);
          }
       } else {
          sum += parseFloat(e.price || 0);
       }
    });

    return sum;
  }, [selectedEventDetails, registrationMode, calculatedTeamAmount, teamDetailsMap, selectedCombo]);

  // Count selected events by category for combo quotas
  const selectedCountByCategory = useMemo(() => {
    const counts = {};
    selectedEventDetails.forEach((event) => {
      const category = (event.category || "").toLowerCase().trim();
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [selectedEventDetails]);

  // Helper to check if a string is a UUID
  const isUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Create a map of event IDs to event names for quota display
  const eventIdToNameMap = useMemo(() => {
    const map = {};
    events.forEach(event => {
      const eventId = event.id || event.event_id;
      map[eventId] = event.name || event.title || event.event_name || eventId;
    });
    return map;
  }, [events]);

  // Process category quotas to resolve event IDs to names and determine quota type
  const processedCategoryQuotas = useMemo(() => {
    if (!selectedCombo?.category_quotas) return [];
    
    return Object.entries(selectedCombo.category_quotas).map(([category, quota]) => {
      const isEventId = isUUID(quota);
      const quotaCount = isEventId ? 1 : (typeof quota === 'number' ? quota : parseInt(quota) || 1);
      const eventName = isEventId ? (eventIdToNameMap[quota] || quota) : null;
      const specificEventId = isEventId ? quota : null;
      
      return {
        category,
        categoryKey: category.toLowerCase().trim(),
        quotaCount,
        isSpecificEvent: isEventId,
        specificEventId,
        eventName
      };
    });
  }, [selectedCombo?.category_quotas, eventIdToNameMap]);

  // Callbacks to prevent unnecessary re-renders
  const handleModeSelect = useCallback((mode) => {
    setRegistrationMode(mode);
    setCurrentStep(2);
  }, []);

  const handleSpecialEventSelect = useCallback((event) => {
    setRegistrationMode("individual");
    setSelectedEvents([event.id || event.event_id]);
    setCurrentStep(3);
  }, []);

  const handleComboSelect = useCallback((combo) => {
    setSelectedCombo(combo);
    
    // Auto-select specific events that admin has configured
    if (combo.category_quotas) {
      const autoSelectEventIds = [];
      Object.entries(combo.category_quotas).forEach(([category, quota]) => {
        // Check if quota is a UUID (specific event ID)
        const isEventId = typeof quota === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quota);
        if (isEventId) {
          autoSelectEventIds.push(quota);
        }
      });
      
      if (autoSelectEventIds.length > 0) {
        setSelectedEvents(autoSelectEventIds);
        console.log('🎯 Auto-selected events from combo:', autoSelectEventIds);
      } else {
        setSelectedEvents([]); // Clear any previous selections
      }
    } else {
      setSelectedEvents([]); // Clear any previous selections
    }
    
    setCurrentStep(3);
    // Scroll to top of the page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleEventToggle = useCallback(async (eventId) => {
    // Check if event is already registered
    if (registeredEventIds.has(eventId)) {
      console.log('Cannot select - event already registered');
      return;
    }
    
    // Find the event to get its category and details
    const event = events.find(e => e.id === eventId || e.event_id === eventId);
    if (!event) {
      console.log('Event not found');
      return;
    }
    
    // Check if this is a specific event from combo quota (auto-selected, can't be deselected)
    if (registrationMode === 'combo' && selectedCombo?.category_quotas) {
      const isSpecificEvent = Object.values(selectedCombo.category_quotas).some(quota => {
        const isEventId = typeof quota === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quota);
        return isEventId && quota === eventId;
      });
      
      // If trying to deselect a specific event, prevent it
      if (isSpecificEvent && selectedEvents.includes(eventId)) {
        console.log('Cannot deselect - this event is required by the combo');
        return;
      }
      
      // Check quota limits before allowing selection
      if (!selectedEvents.includes(eventId)) {
        const eventCategory = (event.category || "").toLowerCase().trim();
        const currentCount = selectedCountByCategory[eventCategory] || 0;
        
        // Find the quota for this category
        const categoryQuotas = selectedCombo.category_quotas;
        let quotaLimit = null;
        
        for (const [category, quota] of Object.entries(categoryQuotas)) {
          const categoryKey = category.toLowerCase().trim();
          if (categoryKey === eventCategory) {
            // Check if quota is a number (category limit) or UUID (specific event)
            const isEventId = typeof quota === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quota);
            if (!isEventId) {
              quotaLimit = parseInt(quota);
            }
            break;
          }
        }
        
        // If quota limit exists and would be exceeded, prevent selection
        if (quotaLimit !== null && currentCount >= quotaLimit) {
          console.log(`Cannot select - quota exceeded for ${eventCategory} (${currentCount}/${quotaLimit})`);
          return;
        }
      }
    }
    
    // Check if event is full or closed
    const isFull = event.current_registrations >= event.capacity;
    const isOpen = event.is_open !== false;
    
    // Don't allow selecting full or closed events
    if (isFull || !isOpen) {
      return;
    }

    // Check for team event and redirect to Dashboard My Teams
    if (event.is_team_event && registrationMode !== 'individual') {
      navigate('/dashboard/teams', { 
        state: { 
          createTeam: true, 
          eventId: event.event_id || eventId,
          eventName: event.title || event.name 
        } 
      });
      return;
    }
    
    const newSelection = selectedEvents.includes(eventId)
      ? selectedEvents.filter((id) => id !== eventId)
      : [...selectedEvents, eventId];
    
    setSelectedEvents(newSelection);

    // Real-time validation for combo selection
    if (selectedCombo && registrationMode === 'combo' && newSelection.length > 0) {
      try {
        const validation = await comboService.validateComboSelection(
          selectedCombo.id || selectedCombo.combo_id,
          newSelection
        );

        setValidationStatus(validation);

        if (validation.valid) {
          setValidationMessage('✓ Selection complete and valid!');
        } else {
          setValidationMessage(
            validation.errors && validation.errors.length > 0
              ? `⚠ ${validation.errors.join(', ')}`
              : '⚠ Selection incomplete'
          );
        }
      } catch (error) {
        console.error('Validation error:', error);
        setValidationMessage('⚠ Unable to validate selection');
      }
    }
  }, [events, selectedEvents, selectedCombo, registrationMode, registeredEventIds]);

  // Helper function to check if an event can be selected based on quota limits
  const canSelectEvent = useCallback((eventId) => {
    // If already selected, can always deselect
    if (selectedEvents.includes(eventId)) {
      return true;
    }
    
    // If not in combo mode, no quota restrictions
    if (registrationMode !== 'combo' || !selectedCombo?.category_quotas) {
      return true;
    }
    
    // Find the event to get its category
    const event = events.find(e => e.id === eventId || e.event_id === eventId);
    if (!event) return false;
    
    const eventCategory = (event.category || "").toLowerCase().trim();
    const currentCount = selectedCountByCategory[eventCategory] || 0;
    
    // Find the quota for this category
    const categoryQuotas = selectedCombo.category_quotas;
    for (const [category, quota] of Object.entries(categoryQuotas)) {
      const categoryKey = category.toLowerCase().trim();
      if (categoryKey === eventCategory) {
        // Check if quota is a number (category limit) or UUID (specific event)
        const isEventId = typeof quota === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quota);
        if (!isEventId) {
          const quotaLimit = parseInt(quota);
          return currentCount < quotaLimit;
        }
      }
    }
    
    return true; // No quota limit found for this category
  }, [events, selectedEvents, registrationMode, selectedCombo, selectedCountByCategory]);

  const handleBack = useCallback(() => {
    if (currentStep === 3 && registrationMode === "combo") {
      // When going back from combo event selection, only clear non-required events
      // Keep specific events that are auto-selected
      if (selectedCombo?.category_quotas) {
        const requiredEventIds = Object.values(selectedCombo.category_quotas).filter(quota => {
          return typeof quota === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quota);
        });
        setSelectedEvents(requiredEventIds);
      } else {
        setSelectedEvents([]);
      }
    } else if (currentStep === 2) {
      setRegistrationMode("");
      setSelectedCombo(null);
      setSelectedEvents([]);
    }
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, [currentStep, registrationMode, selectedCombo]);

  const handleIndividualRegistration = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!user) {
        toast.error('Please login to continue', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }

      // Use fetched user profile from state
      if (!userProfile) {
        toast.error('Profile not loaded. Please refresh and try again.', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }

      // Check if any selected events are now full (real-time capacity check)
      const fullEvents = [];
      for (const eventId of selectedEvents) {
        const eventInfo = selectedEventDetails.find(e => (e.id || e.event_id) === eventId);
        if (eventInfo) {
          const isFull = eventInfo.current_registrations >= eventInfo.capacity;
          if (isFull) {
            fullEvents.push(eventInfo.name || eventInfo.event_name || 'Unknown Event');
          }
        }
      }
      
      if (fullEvents.length > 0) {
        toast.error(`Cannot register. The following event(s) are now full: ${fullEvents.join(', ')}`, {
          duration: 5000,
          position: 'top-center',
        });
        setIsSubmitting(false);
        // Reload events to update UI
        const result = await eventConfigService.getEventsWithStats();
        if (result.success) {
          const eventsWithAutoClose = result.data.map(event => {
            const isFull = event.current_registrations >= event.capacity;
            if (isFull && event.is_open) {
              return { ...event, is_open: false };
            }
            return event;
          });
          setEvents(eventsWithAutoClose);
        }
        return;
      }

      // Clear any existing PENDING registrations for the selected events
      // This allows the user to retry payment without duplicate key errors
      if (selectedEvents.length > 0) {
        // We use a broader check here to ensure we clean up any stashed pending state
        try {
          // Identify event UUIDs from the selection (selectedEvents contains IDs)
          // We need to match how event_registrations_config stores them
          const { error: deleteError } = await supabase
            .from('event_registrations_config')
            .delete()
            .eq('user_id', user.id)
            .in('event_id', selectedEvents)
            .eq('payment_status', 'PENDING');
            
          if (deleteError) {
            console.warn('Warning: Could not clear pending registrations:', deleteError);
          } else {
             console.log('Cleared pending registrations for retry');
          }
        } catch (e) {
          console.warn('Error clearing pending payments:', e);
        }
      }

      // Step 1: Create pending registrations
      const registrations = [];
      const batchId = `BATCH_${Date.now()}_${user.id.substring(0, 8)}`; // Shared batch ID for all events in this payment
      
      for (const eventId of selectedEvents) {
        const eventInfo = selectedEventDetails.find(e => (e.id || e.event_id) === eventId);
        
        if (!eventInfo) {
          console.warn(`Event not found for ID: ${eventId}`);
          continue;
        }
        
        // Use UUID id field for event_registrations_config (not event_id TEXT)
        const eventUuidId = eventInfo.id || eventId;
        
        registrations.push({
          event_id: eventUuidId, // Must be UUID to match FK constraint
          user_id: user.id,
          event_name: eventInfo?.name || eventInfo?.event_name || eventInfo?.title,
          payment_status: 'PENDING',
          payment_amount: eventInfo?.price || 0,
          transaction_id: batchId // Use batch ID temporarily to group registrations
        });
      }

      console.log('Creating pending registrations with batch ID:', batchId, registrations);

      // Insert registrations with PENDING status
      const { data: insertedRegs, error: regError } = await supabase
        .from('event_registrations_config')
        .insert(registrations)
        .select();
      
      console.log('Insert result:', { insertedRegs, regError });
      
      if (regError) {
        console.error('Registration error:', regError);
        
        // Check for duplicate registration (PostgreSQL unique constraint violation)
        if (regError.code === '23505' || regError.message?.includes('duplicate') || regError.message?.includes('unique')) {
          toast.error('Already registered for one or more selected events', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#DC2626',
              color: '#fff',
            },
          });
          return;
        }
        
        throw new Error(regError.message || 'Failed to create registrations');
      }

      console.log('✅ Pending registrations created successfully:', insertedRegs);

      // Step 2: Initiate payment via backend
      const bookingId = insertedRegs && insertedRegs.length > 0 ? insertedRegs[0].id : `REG_${Date.now()}`;
      
      toast.loading('Preparing payment...', {
        duration: 2000,
        position: 'top-center',
      });

      // Prepare payload for mixed booking
      const mixedRegistrations = selectedEventDetails.map(event => {
         const eventId = event.id || event.event_id;
         const isTeam = (event.min_team_size > 1 || event.max_team_size > 1);
         if (isTeam) {
            return {
               type: 'team',
               event_id: eventId,
               team_name: teamDetailsMap[eventId]?.teamName || '',
               member_count: parseInt(teamDetailsMap[eventId]?.memberCount || event.min_team_size || 1)
            };
         } else {
            return {
               type: 'individual',
               event_id: eventId
            };
         }
      });
      
      // Validate teams have names
      const invalidTeams = mixedRegistrations.filter(r => r.type === 'team' && !r.team_name?.trim());
      if (invalidTeams.length > 0) {
         toast.error('Please enter team names for all team events', { duration: 4000, position: 'top-center' });
         setIsSubmitting(false);
         return;
      }

      // Call backend to get payment data
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const backendResponse = await fetch(`${apiUrl}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          booking_id: bookingId,
          booking_type: 'mixed_registration',
          registrations: mixedRegistrations,
          amount: totalAmount,
        }),
      });

      const backendResult = await backendResponse.json();

      if (!backendResult.success) {
        throw new Error(backendResult.error || 'Failed to prepare payment');
      }

      // Step 3: Backend returns payment URL from gateway
      const paymentUrl = backendResult.payment_url;
      
      // Track pending payments in localStorage for each event
      selectedEvents.forEach(eventId => {
        pendingPaymentService.addPendingPayment({
          userId: user.id,
          eventId: eventId,
          bookingId: bookingId,
          amount: totalAmount,
          orderId: backendResult.payment_data.order_id,
        });
      });
      
      // Update UI to show pending state
      setPendingPaymentEvents(new Set(selectedEvents));
      
      // Store payment data in session for return
      sessionStorage.setItem('pending_registration', JSON.stringify({
        bookingId,
        eventIds: selectedEvents,
        amount: totalAmount,
        orderId: backendResult.payment_data.order_id,
      }));

      toast.success('Redirecting to payment gateway...', {
        duration: 1000,
        position: 'top-center',
      });

      // Redirect to payment gateway page
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1000);
      
      return; // Don't proceed to success step yet - wait for payment

      // Note: After successful payment callback, admin notification will be created
      // and user will be redirected to success page

    } catch (error) {
      console.error("Registration error:", error);
      // Show the actual error message if available, otherwise generic message
      const errorMessage = error.message || "Registration failed. Please try again.";
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedEvents, selectedEventDetails, totalAmount, isSubmitting]);

  const handleComboRegistration = useCallback(async () => {
    if (isSubmitting || !selectedCombo) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (!user) {
        toast.error('Please login to continue', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }

      if (!userProfile) {
        toast.error('Profile not loaded. Please refresh and try again.', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }

      // Check if any selected events are now full (real-time capacity check)
      const fullEvents = [];
      for (const eventId of selectedEvents) {
        const eventInfo = selectedEventDetails.find(e => (e.id || e.event_id) === eventId);
        if (eventInfo) {
          const isFull = eventInfo.current_registrations >= eventInfo.capacity;
          if (isFull) {
            fullEvents.push(eventInfo.name || eventInfo.event_name || 'Unknown Event');
          }
        }
      }
      
      if (fullEvents.length > 0) {
        toast.error(`Cannot register. The following event(s) are now full: ${fullEvents.join(', ')}`, {
          duration: 5000,
          position: 'top-center',
        });
        setIsSubmitting(false);
        // Reload events to update UI
        const result = await eventConfigService.getEventsWithStats();
        if (result.success) {
          const eventsWithAutoClose = result.data.map(event => {
            const isFull = event.current_registrations >= event.capacity;
            if (isFull && event.is_open) {
              return { ...event, is_open: false };
            }
            return event;
          });
          setEvents(eventsWithAutoClose);
        }
        return;
      }

      // Validate team events have team names
      const hasTeamEvents = selectedEventDetails.some(e => (e.min_team_size > 1 || e.max_team_size > 1));
      if (hasTeamEvents) {
        console.log('🔍 Validating team events...');
        console.log('teamDetailsMap:', teamDetailsMap);
        
        const invalidTeams = selectedEventDetails.filter(e => {
          const isTeam = (e.min_team_size > 1 || e.max_team_size > 1);
          if (!isTeam) return false;
          
          const eventId = e.id || e.event_id;
          const teamName = teamDetailsMap[eventId]?.teamName;
          console.log(`Event ${e.name || e.event_name} (${eventId}): teamName = "${teamName}"`);
          return !teamName?.trim();
        });
        
        console.log('Invalid teams:', invalidTeams.map(e => e.name || e.event_name));
        
        if (invalidTeams.length > 0) {
          toast.error('Please enter team names for all team events', { duration: 4000, position: 'top-center' });
          setIsSubmitting(false);
          return;
        }
      }

      // Step 1: Validate selection
      const validation = await comboService.validateComboSelection(
        selectedCombo.id || selectedCombo.combo_id,
        selectedEvents
      );

      if (!validation.valid) {
        toast.error(`Invalid selection: ${validation.errors.join(', ')}`, {
          duration: 4000,
          position: 'top-center',
        });
        setIsSubmitting(false);
        return;
      }

      // Step 2: Create purchase record (PENDING status)
      const purchaseResult = await comboService.createComboPurchase(
        selectedCombo.id || selectedCombo.combo_id,
        user.id,
        selectedEvents
      );

      if (!purchaseResult.success) {
        toast.error(purchaseResult.error || 'Failed to create purchase', {
          duration: 4000,
          position: 'top-center',
        });
        setIsSubmitting(false);
        return;
      }

      const bookingId = purchaseResult.purchaseId; // Note: purchaseId not purchase_id
      const totalAmount = purchaseResult.amount || selectedCombo.price || selectedCombo.total_price || 0;

      // Validate payment data before proceeding
      if (!bookingId) {
        console.error('Purchase result:', purchaseResult);
        throw new Error('Failed to get booking ID from purchase');
      }
      if (!totalAmount || totalAmount <= 0) {
        throw new Error('Invalid combo price');
      }

      console.log('Combo purchase created:', { bookingId, totalAmount });

      toast.loading('Preparing payment...', {
        duration: 2000,
        position: 'top-center',
      });

      // Prepare team data for combo registrations
      const teamDataForCombo = {};
      console.log('🔍 Preparing team data for combo...');
      console.log('📋 teamDetailsMap:', teamDetailsMap);
      console.log('📋 selectedEventDetails:', selectedEventDetails.map(e => ({ id: e.id, name: e.name, min_team_size: e.min_team_size, max_team_size: e.max_team_size })));
      
      selectedEventDetails.forEach(event => {
        const eventId = event.id || event.event_id;
        const isTeam = (event.min_team_size > 1 || event.max_team_size > 1);
        console.log(`Event ${event.name}: eventId=${eventId}, isTeam=${isTeam}, hasDetails=${!!teamDetailsMap[eventId]}`);
        if (isTeam) {
          // Always add team event data, even if teamName is empty (for debugging)
          teamDataForCombo[eventId] = {
            teamName: teamDetailsMap[eventId]?.teamName || '',
            memberCount: parseInt(teamDetailsMap[eventId]?.memberCount || event.min_team_size || 2)
          };
          console.log(`✅ Added team data for ${event.name}:`, teamDataForCombo[eventId]);
        }
      });
      
      console.log('📦 Final teamDataForCombo:', teamDataForCombo);

      // Step 3: Initiate payment via backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const backendResponse = await fetch(`${apiUrl}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          booking_id: bookingId,
          booking_type: 'combo',
          amount: totalAmount,
          team_data: teamDataForCombo,  // Always send team data (even if empty)
          selected_events: selectedEvents
        }),
      });

      const backendResult = await backendResponse.json();

      if (!backendResult.success) {
        throw new Error(backendResult.error || 'Failed to prepare payment');
      }

      // Store payment data
      sessionStorage.setItem('pending_combo', JSON.stringify({
        comboId: selectedCombo.id || selectedCombo.combo_id,
        eventIds: selectedEvents,
        amount: totalAmount,
        orderId: backendResult.payment_data.order_id,
      }));

      toast.success('Redirecting to payment gateway...', {
        duration: 1000,
        position: 'top-center',
      });

      // Redirect to payment gateway
      setTimeout(() => {
        window.location.href = backendResult.payment_url;
      }, 1000);
      
      return; // Don't proceed to success step yet - wait for payment
      const completionResult = await comboService.completeComboPayment(
        purchaseResult.purchaseId,
        transactionId
      );

      if (!completionResult.success) {
        toast.error(completionResult.error || 'Payment completion failed', {
          duration: 4000,
          position: 'top-center',
        });
        setIsSubmitting(false);
        return;
      }

      // Create admin notification
      const eventNames = selectedEventDetails
        .map((e) => e.event_name || e.name)
        .join(", ");

      await supabase.from("admin_notifications").insert({
        type: "NEW_COMBO_REGISTRATION",
        title: "New Combo Registration",
        message: `${
          userProfile?.full_name || user.email
        } registered for combo: ${selectedCombo.name || selectedCombo.combo_name}`,
        data: {
          user_id: user.id,
          user_name: userProfile?.full_name,
          user_email: user.email,
          combo_id: selectedCombo.id || selectedCombo.combo_id,
          combo_name: selectedCombo.name || selectedCombo.combo_name,
          events: selectedEvents,
          event_names: eventNames,
          total_amount: selectedCombo.price || selectedCombo.total_price,
          registration_type: "combo",
          event_count: completionResult.eventCount,
        },
        is_read: false,
      });

      // Success!
      toast.success(`Combo registration successful: ${selectedCombo.name || selectedCombo.combo_name} (${completionResult.eventCount} events)`, {
        duration: 4000,
        position: 'top-center',
      });
      setCurrentStep(5);  // Step 5 for combo success
      
    } catch (error) {
      console.error("Combo registration error:", error);
      toast.error(`Registration failed: ${error.message}`, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, userProfile, selectedCombo, selectedEvents, selectedEventDetails, isSubmitting, teamDetailsMap]);

  // Handle team registration
  const handleTeamRegistration = useCallback(async () => {
    if (isSubmitting || !teamData) return;

    try {
      setIsSubmitting(true);

      if (!user) {
        toast.error('Please login to continue', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }

      if (!userProfile) {
        toast.error('Profile not loaded. Please refresh and try again.', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }

      // Check if the event is now full (real-time capacity check)
      if (selectedEvents.length > 0) {
        const eventId = selectedEvents[0];
        const eventInfo = selectedEventDetails.find(e => (e.id || e.event_id) === eventId);
        if (eventInfo) {
          const isFull = eventInfo.current_registrations >= eventInfo.capacity;
          if (isFull) {
            toast.error(`Cannot register. Event "${eventInfo.name || eventInfo.event_name}" is now full.`, {
              duration: 5000,
              position: 'top-center',
            });
            setIsSubmitting(false);
            // Reload events to update UI
            const result = await eventConfigService.getEventsWithStats();
            if (result.success) {
              const eventsWithAutoClose = result.data.map(event => {
                const isFull = event.current_registrations >= event.capacity;
                if (isFull && event.is_open) {
                  return { ...event, is_open: false };
                }
                return event;
              });
              setEvents(eventsWithAutoClose);
            }
            return;
          }
        }
      }

      // Get team leader (first member or user)
      const teamLeader = teamData.teamMembers.find(m => m.is_leader) || teamData.teamMembers[0];
      
      // Prompt for team leader mobile number if not available
      let teamLeaderMobile = userProfile.mobile_number;
      if (!teamLeaderMobile) {
        const mobile = prompt('Enter team leader\'s mobile number for payment:');
        if (!mobile || !/^\d{10}$/.test(mobile)) {
          toast.error('Valid mobile number required for payment', {
            duration: 3000,
            position: 'top-center',
          });
          setIsSubmitting(false);
          return;
        }
        teamLeaderMobile = mobile;
      }

      const eventDetails = selectedEventDetails[0];
      const bookingId = `TEAM_${teamData.teamId}_${Date.now()}`;

      // Initiate payment via backend (backend will compute amount for unpaid members)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const backendResponse = await fetch(`${API_URL}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          booking_id: bookingId,
          booking_type: 'team',
          team_id: teamData.teamId,
          team_name: teamData.teamName,
          team_leader_mobile: teamLeaderMobile,
          member_count: teamData.memberCount,
          event_id: selectedEvents[0]
        }),
      });

      const backendResult = await backendResponse.json();

      if (!backendResult.success) {
        throw new Error(backendResult.error || 'Failed to prepare payment');
      }

      // Update calculated amount for display (this will update totalAmount via useMemo)
      setCalculatedTeamAmount(backendResult.calculated_amount);

      // Store payment data with calculated amount
      sessionStorage.setItem('pending_team', JSON.stringify({
        teamId: teamData.teamId,
        teamName: teamData.teamName,
        eventId: selectedEvents[0],
        memberCount: teamData.memberCount,
        orderId: backendResult.payment_data.order_id,
        calculatedAmount: backendResult.calculated_amount // Amount calculated by backend
      }));

      toast.success('Redirecting to payment gateway...', {
        duration: 1000,
        position: 'top-center',
      });

      // Redirect to payment gateway
      setTimeout(() => {
        window.location.href = backendResult.payment_url;
      }, 1000);
      
      return; // Don't proceed - wait for payment
      
      // OLD CODE - keeping for reference but unreachable:
      const tempPaymentId = `TEAM_${teamData.teamId}_${Date.now()}`;
      
      const registrations = teamData.teamMembers.map(member => ({
        user_id: member.id,
        event_id: selectedEvents[0],
        team_id: teamData.teamId,
        payment_status: 'PENDING',
        payment_id: tempPaymentId,
        registration_type: 'team'
      }));

      const { error: regError } = await supabase
        .from('registrations')
        .insert(registrations);

      if (regError) {
        // Check for duplicate registration
        if (regError.code === '23505' || regError.message?.includes('duplicate') || regError.message?.includes('unique')) {
          toast.error('Team already registered for this event', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#DC2626',
              color: '#fff',
            },
          });
          setIsSubmitting(false);
          return;
        }
        throw regError;
      }

      // Create admin notification in background (don't await - faster UX)
      supabase.from("admin_notifications").insert({
        type: "NEW_REGISTRATION",
        title: "New Team Registration",
        message: `Team "${teamData.teamName}" registered for: ${eventDetails?.name || eventDetails?.event_name}`,
        data: {
          team_id: teamData.teamId,
          team_name: teamData.teamName,
          event_id: selectedEvents[0],
          event_name: eventDetails?.name || eventDetails?.event_name,
          member_count: teamData.memberCount,
          total_amount: (eventDetails?.price || 0) * teamData.memberCount,
          registration_type: "team",
        },
        is_read: false,
      }).then(() => console.log('Admin notification sent')).catch(e => console.warn('Notification failed:', e));

      toast.success(`Team Registration Successful! ${teamData.teamName} - ${teamData.memberCount} Members`, {
        duration: 5000,
        position: 'top-center',
      });
      setCurrentStep(4);
    } catch (error) {
      console.error("Team registration error:", error);
      toast.error(`Registration failed: ${error.message}`, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, userProfile, teamData, selectedEvents, selectedEventDetails, isSubmitting]);

  // Handle next step navigation

  // Determine if a selected event is a team event
  const isTeamEvent = useCallback((eventId) => {
    const event = events.find(e => e.id === eventId || e.event_id === eventId);
    if (!event) return false;
    const minSize = event.min_team_size || 0;
    const maxSize = event.max_team_size || 0;
    return minSize > 1 || maxSize > 1;
  }, [events]);

  // Handle Team Details Inputs
  const handleTeamDetailsChange = (eventId, field, value) => {
    console.log(`📝 Team details changed: eventId=${eventId}, field=${field}, value=${value}`);
    setTeamDetailsMap(prev => {
      const newMap = {
        ...prev,
        [eventId]: {
          ...prev[eventId],
          [field]: value
        }
      };
      console.log('📋 Updated teamDetailsMap:', newMap);
      return newMap;
    });
  };

  const handleNext = useCallback(async () => {
    if (currentStep === 4 && registrationMode === "combo") {
      handleComboRegistration();
    } else if (currentStep === 3 && registrationMode === "individual") {
      handleIndividualRegistration();
    } else if (currentStep === 3 && registrationMode === "team") {
      handleTeamRegistration();
    } else if (currentStep < steps.length) {
      // Logic when moving from Selection (Step 2) to Review (Step 3) in "individual" mode
      if (currentStep === 2 && registrationMode === "individual") {
         // Initialize default counts for any selected team events
         const newDetails = { ...teamDetailsMap };
         selectedEventDetails.forEach(e => {
            const isTeam = (e.min_team_size > 1 || e.max_team_size > 1);
            if (isTeam) {
               const eventId = e.id || e.event_id;
               if (!newDetails[eventId]) {
                  newDetails[eventId] = {
                     teamName: '',
                     memberCount: e.min_team_size || 2 // Default to min size
                  };
               }
            }
         });
         setTeamDetailsMap(newDetails);
      }
      // Logic when moving from Selection (Step 3) to Review (Step 4) in "combo" mode
      if (currentStep === 3 && registrationMode === "combo") {
         // Initialize default counts for any selected team events in combo
         const newDetails = { ...teamDetailsMap };
         selectedEventDetails.forEach(e => {
            const isTeam = (e.min_team_size > 1 || e.max_team_size > 1);
            if (isTeam) {
               const eventId = e.id || e.event_id;
               if (!newDetails[eventId]) {
                  newDetails[eventId] = {
                     teamName: '',
                     memberCount: e.min_team_size || 2 // Default to min size
                  };
               }
            }
         });
         setTeamDetailsMap(newDetails);
      }
      setCurrentStep((prev) => prev + 1);
    }
  }, [
    currentStep,
    registrationMode,
    steps.length,
    handleComboRegistration,
    handleIndividualRegistration,
    handleTeamRegistration,
    teamData,
    selectedEvents,
    selectedEventDetails,
    teamDetailsMap
  ]);

  // Memoized check for next button
  const canProceedToNext = useMemo(() => {
    if (currentStep === 1) return registrationMode !== "";
    if (currentStep === 2 && registrationMode === "combo")
      return selectedCombo !== null;
    if (currentStep === 2 && registrationMode === "individual")
      return selectedEvents.length > 0;
    if (currentStep === 2 && registrationMode === "team")
      return selectedEvents.length > 0;
    if (currentStep === 3 && registrationMode === "combo")
      return selectedEvents.length > 0;
    if (currentStep === 3 && registrationMode === "team")
      return teamData !== null;
    // On confirmation step, require terms acceptance
    if ((currentStep === 3 && registrationMode !== "combo") || 
        (currentStep === 4 && registrationMode === "combo")) {
      return termsAccepted;
    }
    return true;
  }, [currentStep, registrationMode, selectedCombo, selectedEvents.length, teamData, termsAccepted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading events...</p>
          {loadingTimeout && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg max-w-md text-center">
              <p className="text-red-400 font-semibold mb-2">⚠️ Loading is taking longer than expected</p>
              <p className="text-gray-400 text-sm mb-3">
                The database connection might be slow or unavailable. 
                The events table may not exist or RLS policies may be blocking access.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-sm"
                >
                  Force Refresh
                </button>
                <button
                  onClick={() => {
                    setLoading(false);
                    setEvents([]);
                  }}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Stop Loading
                </button>
              </div>
            </div>
          )}
          {!loadingTimeout && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-sm"
            >
              Refresh Page
            </button>
          )}
        </div>
      </div>
    );
  }

  // If no events loaded but not loading anymore, show error message
  if (!loading && events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white">No Events Available</h2>
          <p className="text-gray-400">
            Unable to load events. This might be due to a database connection issue.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                console.log('Retry loading events');
                setLoading(true);
                window.location.reload();
              }}
              className="px-6 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors font-bold"
            >
              Try Again
            </button>
            <button
              onClick={() => window.open('https://ltmyqtcirhsgfyortgfo.supabase.co', '_blank')}
              className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Check Database
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={`step-${step.number}`}
              className="flex items-center flex-1"
            >
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor:
                      currentStep >= step.number ? "#3b82f6" : "#1f2937",
                    scale: currentStep === step.number ? 1.1 : 1,
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    currentStep >= step.number ? "ring-4 ring-blue-500/30" : ""
                  }`}
                >
                  <step.icon size={24} className="text-white" />
                </motion.div>
                <p
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number
                      ? "text-blue-400"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  key={`connector-${step.number}`}
                  className="flex-1 h-1 mx-4 bg-gray-800 rounded-full overflow-hidden"
                >
                  <motion.div
                    initial={false}
                    animate={{
                      width: currentStep > step.number ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Choose Registration Type */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Choose Your Registration Type
              </h2>
              <p className="text-gray-400 text-lg">
                Register for individual events, save with combos, or register as a team
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Own Combo (Formerly Individual) */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelect("individual")}
                className={`relative p-8 rounded-3xl border-2 cursor-pointer transition-all ${
                  registrationMode === "individual"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 hover:border-blue-400 bg-gray-800/50"
                }`}
              >
                <div className="absolute top-4 right-4">
                  <Calendar className="text-blue-400" size={32} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">
                    Own Combo
                  </h3>
                  <p className="text-gray-400">
                    Create your own schedule! Pick and choose from ALL events (Individual & Team).
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-2" size={20} />
                      Full flexibility
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-2" size={20} />
                      Includes Team Events
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-2" size={20} />
                      Single Checkout
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Combo Packages Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelect("combo")}
                className={`relative p-8 rounded-3xl border-2 cursor-pointer transition-all ${
                  registrationMode === "combo"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-gray-700 hover:border-purple-400 bg-gray-800/50"
                }`}
              >
                <div className="absolute top-4 right-4">
                  <Package className="text-purple-400" size={32} />
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                    BEST VALUE
                  </span>
                </div>
                <div className="space-y-4 mt-8">
                  <h3 className="text-2xl font-bold text-white">
                    Combo Packages
                  </h3>
                  <p className="text-gray-400">
                    Save money with our specially curated event bundles and get
                    exclusive benefits.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-2" size={20} />
                      Up to 40% discount
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-2" size={20} />
                      Pre-selected bundles
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-2" size={20} />
                      Exclusive perks
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Team Events Card - REMOVED per requirements */}
              {/* 
              <motion.div ...> 
                ...
              </motion.div>
              */}

              {/* Accommodation Card - Below Individual */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative p-8 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900/30 to-blue-950/30 border-2 border-blue-500/30 cursor-pointer"
                onClick={() => navigate('/dashboard/bookings')}
              >
                <div className="absolute top-4 right-4">
                  <Building className="text-blue-400" size={32} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">
                    Accommodation
                  </h3>
                  <p className="text-blue-200 font-semibold">Rs. 350 per day</p>
                  <p className="text-gray-400 text-sm">
                    Dinner only. No breakfast included.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-300 text-sm">
                      <Calendar className="text-blue-400 mr-2" size={16} />
                      February 12 Evening Stay (Dinner only)
                    </li>
                    <li className="flex items-center text-gray-300 text-sm">
                      <Calendar className="text-blue-400 mr-2" size={16} />
                      February 13 Night Stay (Dinner only)
                    </li>
                    <li className="flex items-center text-gray-300 text-sm">
                      <Calendar className="text-blue-400 mr-2" size={16} />
                      February 14 Stay (Dinner only)
                    </li>
                  </ul>
                  <button className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg">
                    BOOK NOW
                  </button>
                </div>
              </motion.div>

              {/* Lunch Card - Command Line Style 
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative p-6 rounded-2xl overflow-hidden bg-gray-800/50 border border-gray-700 hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <UtensilsCrossed className="w-8 h-8 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white font-orbitron">Lunch</h2>
                    <p className="text-gray-400 text-sm">Rs. 100 per lunch</p>
                  </div>
                </div>

                
                <div className="bg-black/60 border border-gray-600 rounded-lg p-4 font-mono text-sm mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <span className="text-gray-400 text-xs">lunch-booking-terminal</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-green-400">
                      <span className="text-blue-400">user@dakshaa</span>
                      <span className="text-white">:</span>
                      <span className="text-purple-400">~</span>
                      <span className="text-white">$ </span>
                      <span className="text-yellow-400">lunch --info</span>
                    </div>
                    <div className="text-gray-300 pl-4">
                      <div>Available: Feb 12, 13, 14</div>
                      <div>Price: Rs. 100 per lunch</div>
                      <div>Status: Booking Open</div>
                    </div>
                    
                    <div className="text-green-400 mt-3">
                      <span className="text-blue-400">user@dakshaa</span>
                      <span className="text-white">:</span>
                      <span className="text-purple-400">~</span>
                      <span className="text-white">$ </span>
                      <span className="text-yellow-400">lunch --reserve</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Only Lunch will be provided for <strong>12th, 13th and 14th February</strong>. Register here to reserve your meals.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar size={16} />
                      <span>February 12 Lunch</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar size={16} />
                      <span>February 13 Lunch</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar size={16} />
                      <span>February 14 Lunch</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/dashboard/bookings')}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-orange-500/50"
                >
                  RESERVE NOW
                </button>
              </motion.div>
              */}
            </div>
            
            {/* Special Events Section */}
            {specialEvents.length > 0 && (
              <div className="mt-16 space-y-6">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="text-yellow-400" size={28} />
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 text-transparent bg-clip-text">
                      Special Events
                    </h3>
                    <Sparkles className="text-yellow-400" size={28} />
                  </div>
                  <p className="text-gray-400 text-lg">
                    Premium events with exclusive benefits. Not included in
                    combo packages.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {specialEvents.map((event) => (
                    <motion.div
                      key={event.id || event.event_id}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => handleSpecialEventSelect(event)}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
                      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl border-2 border-red-500/50 hover:border-red-400 transition-all">
                        {/* Premium Badge */}
                        <div className="absolute -top-3 -right-3">
                          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-full shadow-lg">
                            <Star className="text-white" size={20} />
                          </div>
                        </div>

                        {/* Event Icon */}
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                            <Trophy className="text-white" size={32} />
                          </div>
                        </div>

                        {/* Event Details */}
                        <h4 className="text-xl font-bold text-white mb-2 line-clamp-2">
                          {event.event_name}
                        </h4>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                          {event.description ||
                            "Exclusive special event with premium benefits"}
                        </p>

                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-white">
                              ₹{event.price || 0}
                            </p>
                            <p className="text-xs text-gray-400">per person</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-full flex items-center gap-2"
                          >
                            Register
                            <Zap size={16} />
                          </motion.button>
                        </div>

                        {/* Capacity Indicator */}
                        {event.max_registrations && (
                          <div className="mt-4 space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>
                                {event.current_registrations || 0} registered
                              </span>
                              <span>{event.max_registrations} max</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(
                                    100,
                                    ((event.current_registrations || 0) /
                                      event.max_registrations) *
                                      100
                                  )}%`,
                                }}
                                className="h-full bg-gradient-to-r from-red-500 to-pink-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Select Combo or Events */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {registrationMode === "combo" ? (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white">
                    Choose Your Combo Package
                  </h2>
                  <p className="text-gray-400">
                    Select a combo package that suits your interests
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {combos.map((combo, index) => {
                    console.log('🎯 Rendering combo:', combo.title || combo.name, combo);
                    return (
                      <ComboCard
                        key={combo.combo_id || combo.id || `combo-${index}`}
                        combo={combo}
                        isSelected={selectedCombo?.id === combo.id || selectedCombo?.combo_id === combo.combo_id}
                        onSelect={() => handleComboSelect(combo)}
                        userPurchasedCombos={userPurchasedCombos}
                      />
                    );
                  })}
                </div>

                {combos.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="mx-auto text-gray-600 mb-4" size={64} />
                    <p className="text-gray-400">
                      No combo packages available at the moment
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white">
                    {registrationMode === "team" ? "Select Team Event" : "Select Your Events"}
                  </h2>
                  <p className="text-gray-400">
                    {registrationMode === "team" 
                      ? "Choose a team-based event that requires collaboration" 
                      : "Choose the events you want to attend"
                    }
                  </p>
                </div>

                {/* Search and Filter - Hide for team mode */}
                {registrationMode !== "team" && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative z-50" ref={searchContainerRef}>
                      <Search
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={24}
                      />
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full pl-14 pr-6 py-4 text-lg bg-gray-800 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-lg transition-all"
                      />
                      
                      {/* Search Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && searchTerm && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scaleY: 0.95 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: 10, scaleY: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl max-h-80 overflow-y-auto overflow-x-hidden z-[100]"
                          >
                            {events
                              .filter(e => {
                                const eventName = (e.name || e.event_name || "").toLowerCase();
                                return (categoryFilter === "ALL" || e.category === categoryFilter) &&
                                  eventName.includes(searchTerm.toLowerCase());
                              })
                              .length > 0 ? (
                              events
                                .filter(e => {
                                  const eventName = (e.name || e.event_name || "").toLowerCase();
                                  return (categoryFilter === "ALL" || e.category === categoryFilter) &&
                                    eventName.includes(searchTerm.toLowerCase());
                                })
                                .map((event) => (
                                  <div
                                    key={event.id}
                                    onClick={() => {
                                      setSearchTerm(event.name || event.event_name);
                                      setShowSuggestions(false);
                                    }}
                                    className="px-6 py-4 hover:bg-white/5 cursor-pointer border-b border-gray-800 last:border-0 flex justify-between items-center group transition-colors"
                                  >
                                    <span className="text-gray-300 group-hover:text-white font-semibold transition-colors">
                                      {event.name || event.event_name}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${
                                      event.category === 'Technical' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                      event.category === 'Non-Technical' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                                      event.category === 'Workshop' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                                      'bg-gray-800 border-gray-700 text-gray-400'
                                    }`}>
                                      {event.category || 'Event'}
                                    </span>
                                  </div>
                                ))
                            ) : (
                              <div className="px-6 py-8 text-center">
                                <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No matching events found</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Category Dropdown */}
                    <div className="relative min-w-[200px] z-40" ref={categoryDropdownRef}>
                      <button
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        className="w-full px-4 py-4 bg-gray-800 border-2 border-gray-700 rounded-2xl text-white flex justify-between items-center hover:border-blue-500 transition-colors"
                      >
                        <span className="font-medium truncate">
                          {categoryFilter === "ALL" ? "All Categories" : categoryFilter}
                        </span>
                        <ChevronDown size={20} className={`transform transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isCategoryDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scaleY: 0.95 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: 10, scaleY: 0.95 }}
                            className="absolute top-full right-0 mt-2 w-full sm:w-64 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-64 overflow-y-auto"
                          >
                            <div className="p-2 space-y-1">
                              <button
                                onClick={() => {
                                  setCategoryFilter("ALL");
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left rounded-xl transition-all ${
                                  categoryFilter === "ALL"
                                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30"
                                    : "text-gray-300 hover:bg-white/5"
                                }`}
                              >
                                All Events
                              </button>
                              {categories
                                .filter((cat) => cat !== "ALL")
                                .map((cat, index) => {
                                  // Display proper names for categories
                                  const displayName = cat === "Technical" ? "TECH" :
                                                    cat === "Non-Technical" ? "NON-TECH" :
                                                    cat === "Team Events" ? "TEAM EVENTS" :
                                                    cat === "Hackathon" ? "HACKATHON" :
                                                    cat === "Conference" ? "CONFERENCE" :
                                                    cat === "Workshop" ? "WORKSHOP" :
                                                    cat === "Sports" ? "SPORTS" :
                                                    cat === "Cultural" ? "CULTURAL" :
                                                    cat.toUpperCase();
                                  
                                  return (
                                    <button
                                      key={`cat-dropdown-${cat}-${index}`}
                                      onClick={() => {
                                        setCategoryFilter(cat);
                                        setIsCategoryDropdownOpen(false);
                                      }}
                                      className={`w-full px-4 py-3 text-left rounded-xl transition-all ${
                                      categoryFilter === cat
                                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30"
                                        : "text-gray-300 hover:bg-white/5"
                                    }`}
                                    >
                                      {displayName}
                                    </button>
                                  );
                                })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Department Dropdown */}
                    <div className="relative min-w-[200px] z-40" ref={deptDropdownRef}>
                      <button
                        onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                        className="w-full px-4 py-4 bg-gray-800 border-2 border-gray-700 rounded-2xl text-white flex justify-between items-center hover:border-blue-500 transition-colors"
                      >
                        <span className="font-medium truncate">
                          {deptFilter === "ALL" ? "All Depts" : deptFilter}
                        </span>
                        <ChevronDown size={20} className={`transform transition-transform ${isDeptDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isDeptDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scaleY: 0.95 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: 10, scaleY: 0.95 }}
                            className="absolute top-full right-0 mt-2 w-full sm:w-64 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-64 overflow-y-auto"
                          >
                            <div className="p-2 space-y-1">
                              {departments.map((dept, index) => (
                                <button
                                  key={`dept-dropdown-${dept}-${index}`}
                                  onClick={() => {
                                    setDeptFilter(dept);
                                    setIsDeptDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left rounded-xl transition-all ${
                                    deptFilter === dept
                                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30"
                                      : "text-gray-300 hover:bg-white/5"
                                  }`}
                                >
                                  {dept === "ALL" ? "All Departments" : dept}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event, index) => {
                    const eventId = event.id || event.event_id;
                    const isFull = event.current_registrations >= event.capacity;
                    const isOpen = event.is_open !== false;
                    const isAlreadyRegistered = registeredEventIds.has(eventId);
                    const isPendingPayment = pendingPaymentEvents.has(eventId);
                    // Allow selecting pending payment events so user can retry payment
                    const isQuotaBlocked = !canSelectEvent(eventId);
                    const isEventDisabled = isFull || !isOpen || isAlreadyRegistered || isQuotaBlocked;
                    
                    return (
                      <EventCard
                        key={eventId || `event-${index}`}
                        event={event}
                        isSelected={selectedEvents.includes(eventId)}
                        isDisabled={isEventDisabled}
                        isAlreadyRegistered={isAlreadyRegistered}
                        isPendingPayment={isPendingPayment}
                        allowTeamSelection={registrationMode === 'individual'}
                        onSelect={() =>
                          handleEventToggle(eventId)
                        }
                      />
                    );
                  })}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar
                      className="mx-auto text-gray-600 mb-4"
                      size={64}
                    />
                    <p className="text-gray-400">
                      No events found matching your criteria
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Step 3: Select Events from Combo or Review */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {registrationMode === "combo" && selectedCombo ? (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white">
                    Select Events from {selectedCombo.name || selectedCombo.combo_name}
                  </h2>
                  <p className="text-gray-400">
                    Search and select events based on your quota limits
                  </p>
                </div>

                {/* Category Quotas Display with Selection Counter */}
                <div className="bg-gray-800/50 rounded-2xl p-4 sm:p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Your Quotas
                    </h3>
                    <div className="text-sm text-blue-400 font-medium">
                      {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} selected
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {processedCategoryQuotas.map(
                      ({ category, categoryKey, quotaCount, isSpecificEvent, specificEventId, eventName }) => {
                        // For specific events, check if that event is selected
                        const selected = isSpecificEvent 
                          ? (selectedEvents.includes(specificEventId) ? 1 : 0)
                          : (selectedCountByCategory[categoryKey] || 0);
                        const remaining = quotaCount - selected;
                        const isExceeded = remaining < 0;
                        const isFull = remaining <= 0;
                        
                        return (
                          <div
                            key={category}
                            className={`bg-gray-900 rounded-xl p-3 sm:p-4 border-2 transition-all ${
                              isExceeded ? 'border-red-500' : isFull ? 'border-green-500' : 'border-gray-700'
                            }`}
                          >
                            <p className="text-gray-400 text-xs sm:text-sm capitalize">{category}</p>
                            {isSpecificEvent ? (
                              <>
                                <p className="text-white font-medium text-sm mt-1 line-clamp-2" title={eventName}>
                                  {eventName}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className={`text-lg font-bold ${selected ? 'text-green-400' : 'text-gray-400'}`}>
                                    {selected ? '✓ Selected' : 'Not selected'}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-baseline justify-between">
                                  <p className={`text-xl sm:text-2xl font-bold ${isExceeded ? 'text-red-400' : 'text-white'}`}>
                                    {selected} / {quotaCount}
                                  </p>
                                  {isFull && !isExceeded && (
                                    <Check className="text-green-400" size={16} />
                                  )}
                                </div>
                                <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${
                                      isExceeded ? 'bg-red-500' : isFull ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(100, (selected / quotaCount) * 100)}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Search and Filter - Same as Individual Events */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={24}
                    />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 text-lg bg-gray-800 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-lg transition-all"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <button
                      onClick={() => setCategoryFilter("ALL")}
                      className={`px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
                        categoryFilter === "ALL"
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      All Events
                    </button>
                    {/* Only show categories that are in the combo quotas */}
                    {Object.keys(selectedCombo?.category_quotas || {})
                      .filter(cat => ["Technical", "Non-Technical", "Workshop", "Conference", "Team Events", "Hackathon", "Sports", "Cultural"].includes(cat))
                      .map((cat, index) => {
                        // Display proper names for categories
                        const displayName = cat === "Technical" ? "TECH" :
                                          cat === "Non-Technical" ? "NON-TECH" :
                                          cat === "Team Events" ? "TEAM EVENTS" :
                                          cat === "Hackathon" ? "HACKATHON" :
                                          cat === "Conference" ? "CONFERENCE" :
                                          cat === "Workshop" ? "WORKSHOP" :
                                          cat === "Sports" ? "SPORTS" :
                                          cat === "Cultural" ? "CULTURAL" :
                                          cat === "Conference" ? "CONFERENCE" :
                                          cat.toUpperCase();
                        
                        return (
                          <button
                            key={`combo-cat-${cat}-${index}`}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
                              categoryFilter === cat
                                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                            }`}
                          >
                            {displayName}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Events Grid - All Events with Search/Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event, index) => {
                    const eventId = event.id || event.event_id;
                    const isFull = event.current_registrations >= event.capacity;
                    const isOpen = event.is_open !== false;
                    const isAlreadyRegistered = registeredEventIds.has(eventId);
                    
                    // Check if this is a specific required event from combo
                    const isRequiredEvent = selectedCombo?.category_quotas && Object.values(selectedCombo.category_quotas).some(quota => {
                      const isEventId = typeof quota === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quota);
                      return isEventId && quota === eventId;
                    });
                    
                    const isQuotaBlocked = !canSelectEvent(eventId);
                    const isEventDisabled = isFull || !isOpen || isAlreadyRegistered || isQuotaBlocked;
                    
                    return (
                      <div key={eventId || `combo-event-${index}`} className="relative">
                        {isRequiredEvent && (
                          <div className="absolute -top-2 -right-2 z-10 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg">
                            <span className="text-xs font-bold text-white">✓ Required</span>
                          </div>
                        )}
                        <EventCard
                          event={event}
                          isSelected={selectedEvents.includes(eventId)}
                          isDisabled={isEventDisabled || isRequiredEvent}
                          isAlreadyRegistered={isAlreadyRegistered}
                          onSelect={() =>
                            handleEventToggle(eventId)
                          }
                          showPrice={false}
                        />
                      </div>
                    );
                  })}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar
                      className="mx-auto text-gray-600 mb-4"
                      size={64}
                    />
                    <p className="text-gray-400">
                      No events found matching your criteria
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white">
                    {registrationMode === "team" ? "Review Team Registration" : "Review Your Registration"}
                  </h2>
                  <p className="text-gray-400">
                    {registrationMode === "team" 
                      ? "Confirm team details and event to complete registration"
                      : "Confirm your event selections to complete registration"
                    }
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Team Details - Only for team registration */}
                  {registrationMode === "team" && teamData && (
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users size={24} className="text-green-400" />
                        Team: {teamData.teamName}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Team Members</span>
                          <span className="text-white font-bold">{teamData.memberCount} members</span>
                        </div>
                        <div className="bg-gray-900/50 rounded-xl p-4">
                          <p className="text-sm text-gray-400 mb-2">Members:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {teamData.teamMembers?.map((member, idx) => (
                              <div key={idx} className="text-sm text-white flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                {member.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Events Summary */}
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Calendar size={24} />
                      {selectedEvents.length}{" "}
                      {selectedEvents.length === 1 ? "Event" : "Events"}{" "}
                      Selected
                    </h3>
                    <div className="space-y-3">
                      {selectedEventDetails.map((event) => {
                        const eventId = event.id || event.event_id;
                        const isTeam = (event.min_team_size > 1 || event.max_team_size > 1);
                        const showTeamDetails = isTeam && (registrationMode === "individual" || registrationMode === "combo");
                        const isConference = (event.category || '').toLowerCase() === 'conference';
                        const memberCount = teamDetailsMap[eventId]?.memberCount || event.min_team_size || 1;
                        
                        // Calculate price with conference discount
                        const calculateEventPrice = () => {
                          if (registrationMode === "combo") return "Included";
                          const price = event.price || 0;
                          if (isTeam && showTeamDetails) {
                            if (isConference && memberCount > 1) {
                              // First person full price + additional people 50% off
                              const firstPersonPrice = price;
                              const additionalPeoplePrice = price * 0.5 * (memberCount - 1);
                              return `₹${firstPersonPrice + additionalPeoplePrice}`;
                            }
                            return `₹${price * memberCount}`;
                          }
                          return `₹${price}`;
                        };
                        
                        return (
                          <div
                            key={eventId}
                            className="bg-gray-900 rounded-xl p-4"
                          >
                           <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="font-bold text-white">
                                  {event.name || event.event_name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {event.category} {isTeam && <span className="text-green-400 font-bold ml-2">(Team Event)</span>}
                                </p>
                                {/* Show conference discount info */}
                                {isConference && isTeam && showTeamDetails && memberCount > 1 && (
                                  <p className="text-xs text-yellow-400 mt-1">
                                    💰 Conference Discount: 1st person ₹{event.price}, additional @ 50% off (₹{Math.round(event.price * 0.5)} each)
                                  </p>
                                )}
                              </div>
                              <p className="text-xl font-bold text-green-400">
                                {calculateEventPrice()}
                              </p>
                            </div>
                            
                            {/* Team Details Inputs for Individual/Combo Mode with Team Events */}
                            {showTeamDetails && (
                              <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                   <label className="text-xs text-gray-400 block mb-1">Team Name</label>
                                   <input 
                                     type="text"
                                     className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                     placeholder="Enter Team Name"
                                     value={teamDetailsMap[eventId]?.teamName || ''}
                                     onChange={(e) => handleTeamDetailsChange(eventId, 'teamName', e.target.value)}
                                   />
                                </div>
                                <div>
                                   <label className="text-xs text-gray-400 block mb-1">
                                      Member Count (Max: {event.max_team_size || 4})
                                   </label>
                                   <select 
                                     className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                     value={teamDetailsMap[eventId]?.memberCount || (event.min_team_size || 2)}
                                     onChange={(e) => handleTeamDetailsChange(eventId, 'memberCount', e.target.value)}
                                   >
                                      {Array.from({length: (event.max_team_size || 4) - (event.min_team_size || 2) + 1}, (_, i) => i + (event.min_team_size || 2)).map(num => (
                                          <option key={num} value={num}>{num} Members</option>
                                      ))}
                                      {/* Fallback if range is weird */}
                                      {(!event.min_team_size) && <option value="1">1 Member</option>}
                                   </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/50 rounded-2xl p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 mb-1">
                          {registrationMode === "team" && calculatedTeamAmount !== null 
                            ? "Total Amount" 
                            : registrationMode === "team" ? "Per Person Price" : "Total Amount"}
                        </p>
                        <p className="text-4xl font-bold text-white">
                          ₹{totalAmount}
                        </p>
                        {registrationMode === "team" && (
                          <p className="text-xs text-yellow-400 mt-2">
                            {calculatedTeamAmount !== null 
                              ? teamData?.isPartialPayment 
                                ? `💵 Payment for ${teamData.memberCount - teamData.registeredCount} new ${teamData.memberCount - teamData.registeredCount === 1 ? 'member' : 'members'}`
                                : `💵 For ${teamData?.memberCount || 0} members` 
                              : '💡 Final amount will be calculated for unpaid members only'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          Registration Fee
                        </p>
                        <p className="text-xs text-green-400">
                          {registrationMode === "team" && calculatedTeamAmount !== null
                            ? teamData?.isPartialPayment
                              ? `₹${selectedEventDetails[0]?.price || 0} × ${teamData.memberCount - teamData.registeredCount} new ${teamData.memberCount - teamData.registeredCount === 1 ? 'member' : 'members'}`
                              : `₹${selectedEventDetails[0]?.price || 0} × ${teamData?.memberCount || 0} ${teamData?.memberCount === 1 ? 'member' : 'members'}`
                            : registrationMode === "team" ? "Per member" : "Includes all events"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Terms and Conditions Checkbox */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-900 cursor-pointer"
                        />
                      </label>
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm leading-relaxed">
                          I have read and agree to the{' '}
                          <a
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Payment Terms & Conditions
                          </a>
                          , including the <strong className="text-red-400">no refund policy</strong>.
                          <br />
                          <strong className="text-orange-400 block mt-2">
                             ⚠️ Warning: Do not change the payment amount. Any modification will be detected.
                          </strong>
                        </p>
                        {!termsAccepted && (
                          <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                            <span>⚠️</span>
                            You must accept the terms to proceed with registration
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Step 4: Review for Combo OR Success for Individual/Team */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {registrationMode === "combo" && selectedCombo ? (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white">
                    Review Your Combo Registration
                  </h2>
                  <p className="text-gray-400">
                    Confirm your selections to complete registration
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Combo Info */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {selectedCombo.name || selectedCombo.combo_name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {selectedEvents.length} events selected from this combo
                    </p>
                  </div>

                  {/* Selected Events Summary with Team Details */}
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Calendar size={24} />
                      {selectedEvents.length}{" "}
                      {selectedEvents.length === 1 ? "Event" : "Events"}{" "}
                      Selected
                    </h3>
                    <div className="space-y-3">
                      {selectedEventDetails.map((event) => {
                        const eventId = event.id || event.event_id;
                        const isTeam = (event.min_team_size > 1 || event.max_team_size > 1);
                        
                        return (
                          <div
                            key={eventId}
                            className="bg-gray-900 rounded-xl p-4"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="font-bold text-white">
                                  {event.name || event.event_name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {event.category} {isTeam && <span className="text-green-400 font-bold ml-2">(Team Event)</span>}
                                </p>
                              </div>
                              <p className="text-xl font-bold text-blue-400">
                                Included
                              </p>
                            </div>
                            
                            {/* Team Details Inputs for Combo Mode */}
                            {isTeam && (
                              <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                   <label className="text-xs text-gray-400 block mb-1">Team Name *</label>
                                   <input 
                                     type="text"
                                     className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                     placeholder="Enter Team Name"
                                     value={teamDetailsMap[eventId]?.teamName || ''}
                                     onChange={(e) => handleTeamDetailsChange(eventId, 'teamName', e.target.value)}
                                   />
                                </div>
                                <div>
                                   <label className="text-xs text-gray-400 block mb-1">
                                      Member Count (Max: {event.max_team_size || 4}) *
                                   </label>
                                   <select 
                                     className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                     value={teamDetailsMap[eventId]?.memberCount || (event.min_team_size || 2)}
                                     onChange={(e) => handleTeamDetailsChange(eventId, 'memberCount', e.target.value)}
                                   >
                                      {Array.from({length: (event.max_team_size || 4) - (event.min_team_size || 2) + 1}, (_, i) => i + (event.min_team_size || 2)).map(num => (
                                          <option key={num} value={num}>{num} Members</option>
                                      ))}
                                   </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/50 rounded-2xl p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 mb-1">Total Amount</p>
                        <p className="text-4xl font-bold text-white">
                          ₹{selectedCombo.price || selectedCombo.total_price || 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          Combo Package
                        </p>
                        <p className="text-xs text-green-400">
                          Includes all selected events
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Terms and Conditions Checkbox */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-900 cursor-pointer"
                        />
                      </label>
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm leading-relaxed">
                          I have read and agree to the{' '}
                          <a
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Payment Terms & Conditions
                          </a>
                          , including the <strong className="text-red-400">no refund policy</strong>.
                          <br />
                          <strong className="text-orange-400 block mt-2">
                             ⚠️ Warning: Do not change the amount in the payment gateway. If detected, your registration will be canceled.
                          </strong>
                        </p>
                        {!termsAccepted && (
                          <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                            <span>⚠️</span>
                            You must accept the terms to proceed with registration
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-block"
                >
                  <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <Check size={48} className="text-white" />
                  </div>
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-4xl font-bold text-white">
                    Registration Successful!
                  </h2>
                  <p className="text-gray-400 text-lg">
                    You've successfully registered for {selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="max-w-md mx-auto bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <p className="text-sm text-gray-400 mb-4">
                    A confirmation email has been sent to your registered email
                    address with all the event details.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (window.location.href = "/dashboard")}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full"
                  >
                    Go to Dashboard
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Step 5: Success for Combo */}
        {currentStep === 5 && registrationMode === "combo" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <Check size={48} className="text-white" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-white">
                Registration Successful!
              </h2>
              <p className="text-gray-400 text-lg">
                You've successfully registered for the {selectedCombo?.name || selectedCombo?.combo_name} package
              </p>
            </div>

            <div className="max-w-md mx-auto bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <p className="text-sm text-gray-400 mb-4">
                A confirmation email has been sent to your registered email
                address with all the event details.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full"
              >
                Go to Dashboard
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons - Hidden when footer is visible or on success screens */}
      <AnimatePresence mode="wait">
        {((currentStep < 4) || (currentStep === 4 && registrationMode === "combo")) && !isFooterVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 right-0 bg-gray-900 border-t border-gray-800 z-[110] bottom-16 md:bottom-0"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="max-w-4xl mx-auto flex justify-between items-center p-4 sm:p-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Back</span>
              </motion.button>

              <motion.button
                whileHover={{
                  scale: canProceedToNext && !isSubmitting ? 1.02 : 1,
                }}
                whileTap={{ scale: canProceedToNext && !isSubmitting ? 0.98 : 1 }}
                onClick={handleNext}
                disabled={!canProceedToNext || isSubmitting}
                className="px-5 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-full flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base shadow-lg shadow-purple-500/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      {(currentStep === 3 && registrationMode !== "combo") || (currentStep === 4 && registrationMode === "combo") ? "Confirm Registration" : "Next"}
                    </span>
                    <span className="sm:hidden">
                      {(currentStep === 3 && registrationMode !== "combo") || (currentStep === 4 && registrationMode === "combo") ? "Confirm" : "Next"}
                    </span>
                    <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from being hidden behind fixed navigation */}
      {((currentStep < 4) || (currentStep === 4 && registrationMode === "combo")) && !isFooterVisible && <div className="h-24 md:h-20" />}
    </div>
  );
};

export default RegistrationForm;
