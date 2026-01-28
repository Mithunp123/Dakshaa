import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Clock,
  ArrowLeft
} from "lucide-react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";

const LiveStatusBoard = () => {
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchLiveData();

    // Set up realtime subscriptions
    const registrationsChannel = supabase
      .channel("registrations_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_registrations_config" }, (payload) => {
        console.log('Registration change:', payload);
        // On INSERT with PAID status, increment
        if (payload.eventType === 'INSERT' && payload.new && payload.new.payment_status === 'PAID') {
          setTotalRegistrations(prev => prev + 1);
        }
        // On UPDATE from non-PAID to PAID, increment
        else if (payload.eventType === 'UPDATE' && payload.new && payload.new.payment_status === 'PAID' && 
                 payload.old && payload.old.payment_status !== 'PAID') {
          setTotalRegistrations(prev => prev + 1);
        }
      })
      .subscribe();

    const profilesChannel = supabase
      .channel("profiles_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
        // Only count if it's a student role
        if (payload.new && payload.new.role === 'student') {
          console.log('New student registered:', payload);
          setTotalRegistrations(prev => prev + 1);
        }
      })
      .subscribe();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      registrationsChannel.unsubscribe();
      profilesChannel.unsubscribe();
      clearInterval(timeInterval);
    };
  }, []);

  const fetchLiveData = async () => {
    await Promise.all([fetchStats()]);
  };

  const fetchStats = async () => {
    try {
      // Count only student registrations (exclude admin roles)
      const [studentsResult, regsResult] = await Promise.all([
        supabase.from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student'),
        supabase.from('event_registrations_config')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'PAID')
      ]);
      
      setTotalRegistrations((studentsResult.count || 0) + (regsResult.count || 0));
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to 0 if error
      setTotalRegistrations(0);
    }
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
                <div className="text-gray-400 text-2xl font-medium uppercase tracking-[0.2em] mb-4">Registered Students</div>
                <div className="text-[12rem] leading-none font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                    {totalRegistrations.toLocaleString()}
                </div>
                <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20 text-green-400">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-semibold tracking-wider">LIVE UPDATES</span>
                </div>
            </motion.div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiveStatusBoard;

