import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UserCheck,
  UsersRound,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const EventCard = ({ event, onSelect, isSelected, isDisabled, isAlreadyRegistered, isPendingPayment, allowTeamSelection = false }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleDescriptionClick = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const formatDescription = (text) => {
    if (!text) return [];
    let processed = text;
    // Only split on colon if followed by whitespace (avoids breaking URLs or times like 10:00)
    processed = processed.replace(/:\s+/g, ":\n");
    processed = processed.replace(/([*•])/g, "\n$1");
    return processed.split('\n').filter(line => line.trim().length > 0);
  };
  
  // Normalize event data - ensure numeric types
  const capacity = parseInt(event.capacity) || 100;
  const currentRegistrations = parseInt(event.current_registrations) || 0;
  const price = parseFloat(event.price) || 0;
  const minTeamSize = parseInt(event.min_team_size) || 1;
  const maxTeamSize = parseInt(event.max_team_size) || 1;
  const isOpen = event.is_open === true || event.is_open === 'true' || event.is_open === undefined;
  const isTeamEvent = event.is_team_event === true || event.is_team_event === 'true' || minTeamSize > 1;
  
  const capacityPercentage = (currentRegistrations / capacity) * 100;
  const isNearlyFull = capacityPercentage >= 80;
  const isFull = currentRegistrations >= capacity;
  const canRegister = isOpen && !isFull;

  const getStatusConfig = () => {
    if (isAlreadyRegistered) {
      return {
        icon: CheckCircle2,
        text: "Already Registered",
        bgColor: "bg-blue-500/10",
        textColor: "text-blue-400",
        borderColor: "border-blue-500/30",
      };
    }
    if (isPendingPayment) {
      return {
        icon: Clock,
        text: "Payment Pending",
        bgColor: "bg-purple-500/10",
        textColor: "text-purple-400",
        borderColor: "border-purple-500/30",
      };
    }
    if (!isOpen) {
      return {
        icon: XCircle,
        text: "Registration Closed",
        bgColor: "bg-red-500/10",
        textColor: "text-red-400",
        borderColor: "border-red-500/30",
      };
    }
    if (isFull) {
      return {
        icon: AlertTriangle,
        text: "Fully Booked",
        bgColor: "bg-orange-500/10",
        textColor: "text-orange-400",
        borderColor: "border-orange-500/30",
      };
    }
    if (isNearlyFull) {
      return {
        icon: Clock,
        text: "Filling Fast!",
        bgColor: "bg-yellow-500/10",
        textColor: "text-yellow-400",
        borderColor: "border-yellow-500/30",
      };
    }
    return {
      icon: CheckCircle2,
      text: "Available",
      bgColor: "bg-green-500/10",
      textColor: "text-green-400",
      borderColor: "border-green-500/30",
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;
  const TypeIcon = isTeamEvent ? UsersRound : UserCheck;

  // Handle card click - redirect to dashboard for team events
  const handleCardClick = () => {
    // Check if already registered first - allow viewing details
    if (isAlreadyRegistered) {
      setShowModal(true);
      return;
    }
    
    // Prevent interaction if disabled or not open
    if (isDisabled || !canRegister) {
      return;
    }
    
    // If it's a team event, redirect to dashboard team creation
    if (isTeamEvent && !allowTeamSelection) {
      // Prioritize title, then formatted ID
      const displayTitle = event.title || event.name || (event.event_id ? event.event_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown Event');
      
      navigate('/dashboard/teams', { 
        state: { 
          createTeam: true,
          eventId: event.event_id || event.id,
          eventName: displayTitle
        } 
      });
    } else {
      // For individual events OR team events in mixed mode, use the original onSelect handler
      if (onSelect) onSelect();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={(!isDisabled && canRegister) || isAlreadyRegistered ? { y: -5 } : {}}
      onClick={handleCardClick}
      className={`group relative bg-gradient-to-br from-white/5 to-white/[0.02] border rounded-3xl overflow-hidden transition-all duration-300 ${
        isAlreadyRegistered
          ? "border-blue-500/30 opacity-100 cursor-pointer"
          : isSelected
          ? "border-secondary shadow-lg shadow-secondary/20 scale-[1.02] cursor-pointer"
          : isDisabled || !canRegister
          ? "border-white/5 opacity-50 cursor-not-allowed"
          : "border-white/10 hover:border-white/20 hover:shadow-xl cursor-pointer"
      }`}
    >
      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${
          isSelected
            ? "from-secondary/10 to-primary/10 opacity-100"
            : "from-transparent to-transparent opacity-0 group-hover:opacity-100"
        }`}
      />

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 line-clamp-1">
              {event.name || event.title || event.event_name || "Unnamed Event"}
            </h3>
            {event.description && (
              <div 
                onClick={handleDescriptionClick} 
                className="group/desc cursor-pointer hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-colors"
                title="Click to view full description"
              >
                <p className="text-sm text-gray-400 line-clamp-2">
                  {event.description}
                </p>
                <p className="text-[10px] text-secondary font-medium opacity-0 group-hover/desc:opacity-100 transition-opacity h-0 group-hover/desc:h-auto">
                  Read more...
                </p>
              </div>
            )}
          </div>

          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-3 w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0"
            >
              <CheckCircle2 size={18} className="text-white" />
            </motion.div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Price */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
            <IndianRupee size={16} className="text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">
                {isTeamEvent ? "Per Person" : "Price"}
              </p>
              <p className="font-bold text-white truncate">₹{price}</p>
            </div>
          </div>

          {/* Type or Team Size */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
            <TypeIcon size={16} className="text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">
                {isTeamEvent ? "Team Size" : "Type"}
              </p>
              <p className="font-bold text-white truncate">
                {isTeamEvent 
                  ? `${minTeamSize}-${maxTeamSize}`
                  : event.type || "Individual"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Capacity Bar - REMOVED */}
        {/*
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              <Users size={12} className="inline mr-1" />
              Registrations
            </span>
            <span
              className={`font-bold ${
                isNearlyFull ? "text-orange-400" : "text-gray-300"
              }`}
            >
              {currentRegistrations} / {capacity}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${capacityPercentage}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`h-full rounded-full transition-all ${
                isFull
                  ? "bg-red-500"
                  : isNearlyFull
                  ? "bg-gradient-to-r from-orange-500 to-red-500"
                  : "bg-gradient-to-r from-green-500 to-blue-500"
              }`}
            />
          </div>
        </div>
        */}

        {/* Status Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${status.bgColor} ${status.borderColor}`}
        >
          <StatusIcon size={16} className={status.textColor} />
          <span className={`text-sm font-bold ${status.textColor}`}>
            {status.text}
          </span>
        </div>

        {/* Team Event Indicator */}
        {isTeamEvent && !isDisabled && canRegister && (
          <div className="mt-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-xs text-blue-400 font-semibold flex items-center gap-1.5">
              <UsersRound size={14} />
              Click to create team in dashboard
            </p>
          </div>
        )}

        {/* Premium/Featured Badge (if price > 500) */}
        {price > 500 && (
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} className="text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">Premium</span>
            </div>
          </div>
        )}
      </div>

      {/* Hover Effect Border */}
      {!isDisabled && canRegister && !isSelected && (
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/30 rounded-3xl transition-all pointer-events-none" />
      )}

      {/* Description Modal - Portal to body */}
      {createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowModal(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-white/10 flex items-start justify-between bg-gray-900/95 backdrop-blur sticky top-0 z-10">
                  <div>
                    <h3 className="text-2xl font-bold text-white font-orbitron mb-2">
                      {event.name || event.title || event.event_name}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                       <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                         {isTeamEvent ? "Team Event" : "Individual Event"}
                       </span>
                       <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-green-400">
                         ₹{price}
                       </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                   <div className="space-y-2 text-gray-300 leading-relaxed text-justify">
                      {formatDescription(event.description).map((line, i) => (
                        <p key={i} className={line.trim().startsWith('*') || line.trim().startsWith('•') ? "pl-4 text-gray-400" : ""}>
                          {line}
                        </p>
                      ))}
                   </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/10 bg-gray-900/50 flex justify-end gap-3">
                    <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Close
                    </button>
                    {isAlreadyRegistered && (
                      <button
                        disabled
                        className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg cursor-default flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        Registered
                      </button>
                    )}
                    {!isDisabled && canRegister && !isAlreadyRegistered && (
                         <button
                         onClick={() => {
                             setShowModal(false);
                             if (isTeamEvent) {
                                // Prioritize title, then formatted ID
                                const displayTitle = event.title || event.name || (event.event_id ? event.event_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown Event');
                                
                                navigate('/dashboard/teams', { 
                                  state: { 
                                    createTeam: true,
                                    eventId: event.event_id || event.id,
                                    eventName: displayTitle
                                  } 
                                });
                              } else {
                                if (onSelect) onSelect();
                              }
                         }}
                         className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-white rounded-lg transition-colors text-sm font-bold shadow-lg shadow-secondary/20"
                     >
                         {isSelected ? "Selected" : "Select Event"}
                     </button>
                    )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </motion.div>
  );
};

export default EventCard;
