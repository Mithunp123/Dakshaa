import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Clock,
  MapPin,
  AlertTriangle,
  Zap,
  Calendar,
  ArrowLeft
} from "lucide-react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";

const LiveStatusBoard = () => {
  const [nowHappening, setNowHappening] = useState([]);
  const [upNext, setUpNext] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchLiveData();

    // Set up realtime subscriptions
    const eventsChannel = supabase
      .channel("events_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        fetchLiveData();
      })
      .subscribe();
      
    const registrationsChannel = supabase
      .channel("registrations_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_registrations_config" }, () => {
        fetchStats();
      })
      .subscribe();

    const announcementsChannel = supabase
      .channel("announcements_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh data every 30 seconds
    const dataInterval = setInterval(fetchLiveData, 30000);

    return () => {
      eventsChannel.unsubscribe();
      registrationsChannel.unsubscribe();
      announcementsChannel.unsubscribe();
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const fetchLiveData = async () => {
    await Promise.all([fetchEvents(), fetchAnnouncements(), fetchStats()]);
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc("get_live_stats");
      
      if (!error && data) {
        setTotalRegistrations(data.total_registrations);
      } else {
        // Fallback or retry logic could go here
        console.error("Error fetching stats:", error);
      }
    } catch (error) {
      console.error("Error calling get_live_stats:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

      if (error) throw error;

      const now = new Date();
      
      // Events currently happening
      const live = (data || []).filter(event => event.current_status === "live");
      
      // Events starting within 1 hour
      const upcoming = (data || []).filter(event => {
        if (!event.start_time || event.current_status === "live" || event.current_status === "ended") return false;
        const startTime = new Date(event.start_time);
        const diffMs = startTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours <= 1;
      });

      setNowHappening(live);
      setUpNext(upcoming);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "from-green-500 to-emerald-500";
      case "delayed":
        return "from-yellow-500 to-orange-500";
      case "scheduled":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getAnnouncementColor = (type) => {
    switch (type) {
      case "urgent":
        return "from-red-500/20 to-red-600/10 border-red-500/50";
      case "success":
        return "from-green-500/20 to-green-600/10 border-green-500/50";
      case "warning":
        return "from-yellow-500/20 to-yellow-600/10 border-yellow-500/50";
      default:
        return "from-blue-500/20 to-blue-600/10 border-blue-500/50";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 p-8 h-screen flex flex-col">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Content Container - Centered */}
        <div className="flex-1 flex flex-col justify-center items-center">
            {/* Header */}
            <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12"
            >
            <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent">
                DaKshaa 2026
            </h1>
            <p className="text-3xl text-gray-400 font-mono tracking-widest">
                LIVE STATUS
            </p>
            <p className="text-xl text-gray-500 font-mono mt-4">
                {currentTime.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
                })}{" "}
                • {currentTime.toLocaleTimeString("en-IN")}
            </p>
            
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="mt-16 flex flex-col items-center"
            >
                <div className="text-gray-400 text-2xl font-medium uppercase tracking-[0.2em] mb-4">Total Registrations</div>
                <div className="text-[12rem] leading-none font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                    {totalRegistrations.toLocaleString()}
                </div>
                <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20 text-green-400">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-semibold tracking-wider">LIVE UPDATING</span>
                </div>
            </motion.div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiveStatusBoard;

