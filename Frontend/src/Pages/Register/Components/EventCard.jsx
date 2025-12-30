import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UserCheck,
  UsersRound,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const EventCard = ({ event, onSelect, isSelected, isDisabled }) => {
  const capacityPercentage =
    (event.current_registrations / event.capacity) * 100;
  const isNearlyFull = capacityPercentage >= 80;
  const isFull = event.current_registrations >= event.capacity;
  const isOpen = event.is_open && !isFull;

  const getStatusConfig = () => {
    if (!event.is_open) {
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
  const TypeIcon = event.type === "TEAM" ? UsersRound : UserCheck;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isDisabled && isOpen ? { y: -5 } : {}}
      onClick={() => !isDisabled && isOpen && onSelect && onSelect()}
      className={`group relative bg-gradient-to-br from-white/5 to-white/[0.02] border rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer ${
        isSelected
          ? "border-secondary shadow-lg shadow-secondary/20 scale-[1.02]"
          : isDisabled || !isOpen
          ? "border-white/5 opacity-50 cursor-not-allowed"
          : "border-white/10 hover:border-white/20 hover:shadow-xl"
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
              {event.name}
            </h3>
            {event.description && (
              <p className="text-sm text-gray-400 line-clamp-2">
                {event.description}
              </p>
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
            <DollarSign size={16} className="text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Price</p>
              <p className="font-bold text-white truncate">₹{event.price}</p>
            </div>
          </div>

          {/* Type */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
            <TypeIcon size={16} className="text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Type</p>
              <p className="font-bold text-white truncate">{event.type}</p>
            </div>
          </div>
        </div>

        {/* Capacity Bar */}
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
              {event.current_registrations} / {event.capacity}
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

        {/* Status Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${status.bgColor} ${status.borderColor}`}
        >
          <StatusIcon size={16} className={status.textColor} />
          <span className={`text-sm font-bold ${status.textColor}`}>
            {status.text}
          </span>
        </div>

        {/* Premium/Featured Badge (if price > 500) */}
        {event.price > 500 && (
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} className="text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">Premium</span>
            </div>
          </div>
        )}
      </div>

      {/* Hover Effect Border */}
      {!isDisabled && isOpen && !isSelected && (
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/30 rounded-3xl transition-all pointer-events-none" />
      )}
    </motion.div>
  );
};

export default EventCard;
