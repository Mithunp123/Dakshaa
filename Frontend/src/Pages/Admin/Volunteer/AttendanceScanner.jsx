import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  SwitchCamera,
  Keyboard,
  X
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../../../supabase";

const AttendanceScanner = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualId, setManualId] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraId, setCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Audio for feedback
  const successAudio = useRef(new Audio("/success.mp3"));
  const errorAudio = useRef(new Audio("/error.mp3"));

  useEffect(() => {
    fetchActiveEvents();
    getCameras();

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchStats();
    }
  }, [selectedEvent, scanResult]);

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length > 0) {
        setCameraId(devices[0].id);
      }
    } catch (error) {
      console.error("Error getting cameras:", error);
    }
  };

  const fetchActiveEvents = async () => {
    try {
      const { data, error } = await supabase.rpc("get_active_events_for_scanner");
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedEvent) return;
    try {
      const { data, error } = await supabase.rpc("get_attendance_stats", {
        p_event_id: selectedEvent.id
      });
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const startScanner = async () => {
    if (!selectedEvent) {
      alert("Please select an event first");
      return;
    }

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        cameraId || { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
      );

      setScanning(true);
    } catch (error) {
      console.error("Error starting scanner:", error);
      alert("Failed to start camera. Please check permissions.");
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      setScanning(false);
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
  };

  const onScanSuccess = async (decodedText) => {
    // Temporarily stop scanning to prevent multiple scans
    await stopScanner();
    await verifyAttendance(decodedText);
  };

  const onScanError = (error) => {
    // Ignore scan errors (they happen constantly while scanning)
  };

  const verifyAttendance = async (userId) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      const { data, error } = await supabase.rpc("verify_and_mark_attendance", {
        p_user_id: userId,
        p_event_id: selectedEvent.id,
        p_scanned_by: user.id,
        p_scan_location: selectedEvent.venue
      });

      if (error) throw error;

      // Play audio and vibrate based on result
      if (data.status === "success") {
        successAudio.current.play().catch(() => {});
        navigator.vibrate?.(200);
      } else {
        errorAudio.current.play().catch(() => {});
        navigator.vibrate?.(500);
      }

      setScanResult(data);

      // Auto-clear result after 4 seconds and resume scanning
      setTimeout(() => {
        setScanResult(null);
        if (scanning) {
          startScanner();
        }
      }, 4000);
    } catch (error) {
      console.error("Error verifying attendance:", error);
      setScanResult({
        status: "error",
        message: "System error. Please try again.",
        code: "SYSTEM_ERROR"
      });
    }
  };

  const handleManualEntry = async () => {
    if (!manualId.trim()) return;
    await verifyAttendance(manualId.trim());
    setManualId("");
    setManualEntry(false);
  };

  const switchCamera = async () => {
    const currentIndex = cameras.findIndex((cam) => cam.id === cameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    await stopScanner();
    setCameraId(nextCamera.id);
    
    // Small delay before restarting with new camera
    setTimeout(() => {
      if (scanning) {
        startScanner();
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            Attendance Scanner
          </h1>
          <p className="text-gray-400">Scan QR codes for event check-in</p>
        </motion.div>

        {/* Event Selection */}
        {!selectedEvent ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {events.map((event) => (
              <motion.button
                key={event.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedEvent(event)}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left hover:bg-white/10 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center flex-shrink-0">
                    <QrCode className="text-white" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg group-hover:text-secondary transition-colors">
                      {event.event_name}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin size={14} />
                        <span>{event.venue || "TBA"}</span>
                      </div>
                      {event.start_time && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock size={14} />
                          <span>
                            {new Date(event.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.event_type === "general_entry"
                            ? "bg-blue-500/20 text-blue-400"
                            : event.event_type === "workshop"
                            ? "bg-purple-500/20 text-purple-400"
                            : event.event_type === "lunch"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-orange-500/20 text-orange-400"
                        }`}
                      >
                        {event.event_type.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Selected Event Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedEvent.event_name}</h2>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{selectedEvent.venue}</span>
                    </div>
                    {selectedEvent.start_time && (
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>
                          {new Date(selectedEvent.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    stopScanner();
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  Change Event
                </button>
              </div>

              {/* Stats */}
              {stats && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-sm text-gray-400">Registered</p>
                    <p className="text-2xl font-bold text-white">{stats.total_registered}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-sm text-gray-400">Attended</p>
                    <p className="text-2xl font-bold text-green-400">{stats.total_attended}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-sm text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-orange-400">{stats.pending}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-sm text-gray-400">Rate</p>
                    <p className="text-2xl font-bold text-secondary">{stats.attendance_rate}%</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Scanner Area */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
            >
              {!scanning ? (
                <div className="text-center space-y-6">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-secondary/20 to-primary/20 rounded-3xl flex items-center justify-center">
                    <Camera className="text-secondary" size={64} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Scan</h3>
                    <p className="text-gray-400">
                      Click the button below to start scanning QR codes
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={startScanner}
                      className="px-8 py-4 bg-gradient-to-r from-secondary to-primary rounded-2xl font-bold text-white hover:shadow-2xl hover:shadow-secondary/50 transition-all"
                    >
                      Start Camera
                    </button>
                    <button
                      onClick={() => setManualEntry(true)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Keyboard size={20} />
                      <span>Manual Entry</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Camera View */}
                  <div className="relative">
                    <div
                      id="qr-reader"
                      className="rounded-2xl overflow-hidden"
                      style={{ maxWidth: "100%" }}
                    ></div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      {cameras.length > 1 && (
                        <button
                          onClick={switchCamera}
                          className="p-3 bg-black/50 backdrop-blur-xl rounded-xl hover:bg-black/70 transition-colors"
                        >
                          <SwitchCamera className="text-white" size={20} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={stopScanner}
                      className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <CameraOff size={20} />
                      <span>Stop Scanning</span>
                    </button>
                    <button
                      onClick={() => setManualEntry(true)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Keyboard size={20} />
                      <span>Manual Entry</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Result Modal */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setScanResult(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`max-w-md w-full rounded-3xl p-8 text-center space-y-6 ${
                  scanResult.status === "success"
                    ? "bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500"
                    : scanResult.status === "warning"
                    ? "bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-500"
                    : "bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500"
                }`}
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  {scanResult.status === "success" ? (
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={48} />
                    </div>
                  ) : scanResult.status === "warning" ? (
                    <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="text-white" size={48} />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                      <XCircle className="text-white" size={48} />
                    </div>
                  )}
                </motion.div>

                {/* Message */}
                <div className="space-y-2">
                  <h3
                    className={`text-3xl font-bold ${
                      scanResult.status === "success"
                        ? "text-green-400"
                        : scanResult.status === "warning"
                        ? "text-orange-400"
                        : "text-red-400"
                    }`}
                  >
                    {scanResult.status === "success"
                      ? "Access Granted"
                      : scanResult.status === "warning"
                      ? "Already Scanned"
                      : "Access Denied"}
                  </h3>
                  <p className="text-gray-300 text-lg">{scanResult.message}</p>
                </div>

                {/* Student Details */}
                {scanResult.student_name && (
                  <div className="bg-white/10 rounded-2xl p-6 space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Student Name</p>
                      <p className="text-xl font-bold text-white">{scanResult.student_name}</p>
                    </div>
                    {scanResult.student_dept && (
                      <div>
                        <p className="text-sm text-gray-400">Department</p>
                        <p className="font-semibold text-white">{scanResult.student_dept}</p>
                      </div>
                    )}
                    {scanResult.student_roll_no && (
                      <div>
                        <p className="text-sm text-gray-400">Roll Number</p>
                        <p className="font-semibold text-white">{scanResult.student_roll_no}</p>
                      </div>
                    )}
                    {scanResult.first_entry_time && (
                      <div>
                        <p className="text-sm text-gray-400">First Entry Time</p>
                        <p className="font-semibold text-orange-400">
                          {new Date(scanResult.first_entry_time).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setScanResult(null)}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-semibold"
                >
                  Continue Scanning
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Entry Modal */}
        <AnimatePresence>
          {manualEntry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setManualEntry(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Manual Entry</h3>
                  <button
                    onClick={() => setManualEntry(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="text-white" size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Enter User ID or Roll Number
                    </label>
                    <input
                      type="text"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleManualEntry()}
                      placeholder="UUID or Roll Number"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-secondary"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleManualEntry}
                    disabled={!manualId.trim()}
                    className="w-full py-3 bg-gradient-to-r from-secondary to-primary rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-secondary/50 transition-all"
                  >
                    Verify Entry
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AttendanceScanner;
