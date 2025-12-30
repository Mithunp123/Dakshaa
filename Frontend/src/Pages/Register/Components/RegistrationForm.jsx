import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Calendar,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Star,
  Zap,
  Trophy,
} from "lucide-react";
import EventCard from "./EventCard";
import ComboCard from "./ComboCard";
import eventConfigService, {
  registerForEvent,
} from "../../../services/eventConfigService";
import comboService from "../../../services/comboService";
import { supabase } from "../../../supabase";
import { supabaseService } from "../../../services/supabaseService";

const RegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationMode, setRegistrationMode] = useState("");
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [events, setEvents] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  // Memoized steps configuration
  const steps = useMemo(
    () => [
      { number: 1, title: "Choose Type", icon: Package },
      {
        number: 2,
        title: registrationMode === "combo" ? "Select Combo" : "Select Events",
        icon: Calendar,
      },
      {
        number: 3,
        title: registrationMode === "combo" ? "Select Events" : "Review",
        icon: Users,
      },
      { number: 4, title: "Complete", icon: Check },
    ],
    [registrationMode]
  );

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  // Load data when user is available
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [eventsResult, combosResult] = await Promise.all([
          eventConfigService.getEventsWithStats(),
          comboService.getActiveCombosForStudents(user?.id),
        ]);
        setEvents(eventsResult?.data || []);
        setCombos(combosResult?.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  // Memoized categories - prevents recalculation on every render
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      events
        .filter(
          (e) =>
            e.category && e.category !== "Special" && e.category.trim() !== ""
        )
        .map((e) => e.category.trim())
    );
    return ["ALL", ...uniqueCategories].filter(Boolean);
  }, [events]);

  // Memoized special events
  const specialEvents = useMemo(
    () => events.filter((event) => event.category === "Special"),
    [events]
  );

  // Memoized filtered events - prevents recalculation on every render
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (event.category === "Special") return false;

      const eventName = (event.event_name || "").toLowerCase();
      const eventDescription = (event.description || "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        eventName.includes(searchLower) ||
        eventDescription.includes(searchLower);
      const matchesCategory =
        categoryFilter === "ALL" || event.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, categoryFilter]);

  // Memoized selected event details
  const selectedEventDetails = useMemo(
    () => events.filter((e) => selectedEvents.includes(e.id || e.event_id)),
    [events, selectedEvents]
  );

  // Memoized total amount
  const totalAmount = useMemo(
    () =>
      selectedEventDetails.reduce(
        (sum, e) => sum + parseFloat(e.price || 0),
        0
      ),
    [selectedEventDetails]
  );

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
    setCurrentStep(3);
  }, []);

  const handleEventToggle = useCallback((eventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep === 3 && registrationMode === "combo") {
      setSelectedEvents([]);
    } else if (currentStep === 2) {
      setRegistrationMode("");
      setSelectedCombo(null);
      setSelectedEvents([]);
    }
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, [currentStep, registrationMode]);

  const handleIndividualRegistration = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!user) {
        alert("Please login to register for events");
        return;
      }

      // Get user profile for notification
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name, email, mobile_number")
        .eq("id", user.id)
        .single();

      // Register for each selected event
      const registrationResults = await supabaseService.registerEvents(
        user.id,
        selectedEvents,
        null, // no combo
        `PAY_${Date.now()}` // payment ID placeholder
      );

      // Create admin notification for the registration
      const eventNames = selectedEventDetails
        .map((e) => e.event_name || e.name)
        .join(", ");

      await supabase.from("admin_notifications").insert({
        type: "NEW_REGISTRATION",
        title: "New Event Registration",
        message: `${
          userProfile?.full_name || user.email
        } registered for: ${eventNames}`,
        data: {
          user_id: user.id,
          user_name: userProfile?.full_name,
          user_email: user.email,
          events: selectedEvents,
          event_names: eventNames,
          total_amount: totalAmount,
          registration_type: "individual",
        },
        is_read: false,
      });

      console.log("Registration successful:", registrationResults);
      setCurrentStep(4);
    } catch (error) {
      console.error("Registration error:", error);
      // Show the actual error message if available, otherwise generic message
      const errorMessage = error.message || "Registration failed. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedEvents, selectedEventDetails, totalAmount, isSubmitting]);

  const handleComboRegistration = useCallback(async () => {
    if (isSubmitting || !selectedCombo) return;

    try {
      setIsSubmitting(true);

      if (!user) {
        alert("Please login to register for events");
        return;
      }

      // Get user profile for notification
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name, email, mobile_number")
        .eq("id", user.id)
        .single();

      const result = await comboService.purchaseCombo(
        user.id,
        selectedCombo.combo_id,
        selectedEvents
      );

      if (result.success) {
        // Get event names for notification
        const eventNames = selectedEventDetails
          .map((e) => e.event_name || e.name)
          .join(", ");

        // Create admin notification for the combo registration
        await supabase.from("admin_notifications").insert({
          type: "NEW_COMBO_REGISTRATION",
          title: "New Combo Registration",
          message: `${
            userProfile?.full_name || user.email
          } registered for combo: ${selectedCombo.combo_name}`,
          data: {
            user_id: user.id,
            user_name: userProfile?.full_name,
            user_email: user.email,
            combo_id: selectedCombo.combo_id,
            combo_name: selectedCombo.combo_name,
            events: selectedEvents,
            event_names: eventNames,
            total_amount: selectedCombo.total_price,
            registration_type: "combo",
          },
          is_read: false,
        });

        console.log("Combo registration successful:", result);
        setCurrentStep(4);
      } else {
        alert(result.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Combo registration error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedCombo, selectedEvents, selectedEventDetails, isSubmitting]);

  // Handle next step navigation
  const handleNext = useCallback(() => {
    if (currentStep === 3 && registrationMode === "combo") {
      handleComboRegistration();
    } else if (currentStep === 3 && registrationMode === "individual") {
      handleIndividualRegistration();
    } else if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [
    currentStep,
    registrationMode,
    steps.length,
    handleComboRegistration,
    handleIndividualRegistration,
  ]);

  // Memoized check for next button
  const canProceedToNext = useMemo(() => {
    if (currentStep === 1) return registrationMode !== "";
    if (currentStep === 2 && registrationMode === "combo")
      return selectedCombo !== null;
    if (currentStep === 2 && registrationMode === "individual")
      return selectedEvents.length > 0;
    if (currentStep === 3 && registrationMode === "combo")
      return selectedEvents.length > 0;
    return true;
  }, [currentStep, registrationMode, selectedCombo, selectedEvents.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto mb-12">
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
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Choose Your Registration Type
              </h2>
              <p className="text-gray-400 text-lg">
                Register for individual events or save with our combo packages
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Individual Events Card */}
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
                    Individual Events
                  </h3>
                  <p className="text-gray-400">
                    Pick and choose from our wide range of events. Pay only for
                    what you attend.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-2" size={20} />
                      Full flexibility
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-2" size={20} />
                      Choose any events
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-2" size={20} />
                      Individual pricing
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
                  {combos.map((combo) => (
                    <ComboCard
                      key={combo.combo_id}
                      combo={combo}
                      isSelected={selectedCombo?.combo_id === combo.combo_id}
                      onSelect={() => handleComboSelect(combo)}
                    />
                  ))}
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
                    Select Your Events
                  </h2>
                  <p className="text-gray-400">
                    Choose the events you want to attend
                  </p>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                      onClick={() => setCategoryFilter("ALL")}
                      className={`px-4 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
                        categoryFilter === "ALL"
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      All Events
                    </button>
                    {categories
                      .filter((cat) => cat !== "ALL")
                      .map((cat, index) => (
                        <button
                          key={`cat-${cat}-${index}`}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-4 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
                            categoryFilter === cat
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                              : "bg-gray-800 text-gray-400 hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event, index) => (
                    <EventCard
                      key={event.id || event.event_id || `event-${index}`}
                      event={event}
                      isSelected={selectedEvents.includes(
                        event.id || event.event_id
                      )}
                      onSelect={() =>
                        handleEventToggle(event.id || event.event_id)
                      }
                    />
                  ))}
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
                    Select Events from {selectedCombo.combo_name}
                  </h2>
                  <p className="text-gray-400">
                    Choose events according to your combo package quotas
                  </p>
                </div>

                {/* Category Quotas Display */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Available Quotas
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedCombo.category_quotas || {}).map(
                      ([category, quota]) => (
                        <div
                          key={category}
                          className="bg-gray-900 rounded-xl p-4"
                        >
                          <p className="text-gray-400 text-sm">{category}</p>
                          <p className="text-2xl font-bold text-white">
                            {quota}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Events from Combo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events
                    .filter((e) =>
                      selectedCombo.event_ids?.includes(e.id || e.event_id)
                    )
                    .map((event) => (
                      <EventCard
                        key={event.id || event.event_id}
                        event={event}
                        isSelected={selectedEvents.includes(
                          event.id || event.event_id
                        )}
                        onSelect={() =>
                          handleEventToggle(event.id || event.event_id)
                        }
                        showPrice={false}
                      />
                    ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white">
                    Review Your Registration
                  </h2>
                  <p className="text-gray-400">
                    Confirm your event selections before payment
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Selected Events Summary */}
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Calendar size={24} />
                      {selectedEvents.length}{" "}
                      {selectedEvents.length === 1 ? "Event" : "Events"}{" "}
                      Selected
                    </h3>
                    <div className="space-y-3">
                      {selectedEventDetails.map((event) => (
                        <div
                          key={event.id || event.event_id}
                          className="flex justify-between items-center bg-gray-900 rounded-xl p-4"
                        >
                          <div>
                            <p className="font-bold text-white">
                              {event.name || event.event_name}
                            </p>
                            <p className="text-sm text-gray-400">
                              {event.category}
                            </p>
                          </div>
                          <p className="text-xl font-bold text-blue-400">
                            ₹{event.price || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/50 rounded-2xl p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 mb-1">Total Amount</p>
                        <p className="text-4xl font-bold text-white">
                          ₹{totalAmount}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          Registration Fee
                        </p>
                        <p className="text-xs text-green-400">
                          Includes all events
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
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
                {registrationMode === "combo"
                  ? `You've successfully registered for the ${selectedCombo?.combo_name} package`
                  : `You've successfully registered for ${
                      selectedEvents.length
                    } event${selectedEvents.length > 1 ? "s" : ""}`}
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

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="px-6 py-3 bg-gray-800 text-white font-bold rounded-full flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              Back
            </motion.button>

            <motion.button
              whileHover={{
                scale: canProceedToNext && !isSubmitting ? 1.05 : 1,
              }}
              whileTap={{ scale: canProceedToNext && !isSubmitting ? 0.95 : 1 }}
              onClick={handleNext}
              disabled={!canProceedToNext || isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {currentStep === 3 ? "Proceed to Payment" : "Next"}
                  <ChevronRight size={20} />
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;
