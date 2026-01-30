import React, { useState, useEffect, useRef, useCallback } from "react";
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
  X,
  ChevronRight,
  User,
  Phone,
  Mail,
  Building,
  Hash,
  Zap,
  Scan,
  Copy
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../../../supabase";
import {
  checkCameraSupport,
  getCameraErrorMessage,
  getCameraConfig,
  selectBestCamera,
  requestCameraPermission,
  vibrate,
  playSound
} from "../../../utils/scannerConfig";

const AttendanceScanner = () => {
  // Scanner states
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualId, setManualId] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraId, setCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  
  // User and event selection states
  const [scannedUser, setScannedUser] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showEventSelection, setShowEventSelection] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  
  // Coordinator's assigned events
  const [assignedEventIds, setAssignedEventIds] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const html5QrCodeRef = useRef(null);

  // Audio refs for feedback
  const successAudio = useRef(null);
  const errorAudio = useRef(null);

  useEffect(() => {
    // Initialize audio
    successAudio.current = new Audio("/success.mp3");
    errorAudio.current = new Audio("/error.mp3");
    
    getCameras();
    fetchAssignedEvents();

    return () => {
      stopScanner();
    };
  }, []);

  // Fetch coordinator's assigned events
  const fetchAssignedEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Get user's profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'super_admin') {
        // Super admins can scan for all events
        setIsSuperAdmin(true);
        return;
      }

      // Get coordinator's assigned event IDs
      const { data: coords } = await supabase
        .from('event_coordinators')
        .select('event_id')
        .eq('user_id', user.id);

      const eventIds = coords?.map(c => c.event_id) || [];
      setAssignedEventIds(eventIds);
    } catch (error) {
      console.error("Error fetching assigned events:", error);
    }
  };

  const getCameras = async () => {
    try {
      // Check camera support
      const support = checkCameraSupport();
      
      if (!support.isSecureContext) {
        const error = getCameraErrorMessage({ message: 'HTTPS required' });
        setCameraError(error.message);
        return;
      }

      if (!support.hasMediaDevices || !support.hasGetUserMedia) {
        setCameraError(
          "Camera API not available in your browser. Please use Chrome, Firefox, or Safari, or try manual ID entry."
        );
        return;
      }

      // Request permission first
      const permissionResult = await requestCameraPermission();
      if (!permissionResult.success) {
        setCameraError(permissionResult.error.message);
        return;
      }
      
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      
      // Select best camera for device
      const bestCameraId = selectBestCamera(devices);
      if (bestCameraId) {
        setCameraId(bestCameraId);
      }
      
      setCameraError(null);
    } catch (error) {
      console.error("Error getting cameras:", error);
      const errorInfo = getCameraErrorMessage(error);
      setCameraError(errorInfo.message);
    }
  };

  const startScanner = async () => {
    try {
      console.log('\u{1F680} Starting scanner...');
      setCameraError(null);
      
      if (!html5QrCodeRef.current) {
        console.log('\u{1F4E6} Creating Html5Qrcode instance');
        html5QrCodeRef.current = new Html5Qrcode("qr-reader", {
          verbose: false
        });
      }

      // Get device-optimized config
      const support = checkCameraSupport();
      const config = getCameraConfig(support.isMobile);

      // Force back camera on mobile devices (regardless of viewport/desktop mode)
      const isMobileDevice = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const cameraConfig = cameraId 
        ? cameraId 
        : isMobileDevice
          ? { facingMode: { exact: "environment" } } // Force back camera on mobile
          : { facingMode: "user" }; // Desktop default

      console.log('\u{1F4F8} Scanner configuration:', {
        isMobile: isMobileDevice,
        cameraId: cameraId,
        cameraConfig: cameraConfig,
        qrConfig: config
      });

      console.log('\u{23F3} Starting camera...');
      await html5QrCodeRef.current.start(
        cameraConfig,
        config,
        onScanSuccess,
        () => {} // Silent error handler
      );

      console.log('\u{2705} Scanner started successfully!');
      setScanning(true);
    } catch (error) {
      console.error("\u{1F525} SCANNER START ERROR:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cameraId: cameraId
      });
      const errorInfo = getCameraErrorMessage(error);
      const errorMessage = errorInfo.message || error.message;
      console.error('\u{1F4AC} User-friendly error:', errorMessage);
      setCameraError(`\u{1F6A8} ${errorMessage}`);
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

  const onScanSuccess = useCallback(async (decodedText) => {
    // Vibrate on scan using utility
    vibrate(100);
    
    // Stop scanner temporarily
    await stopScanner();
    
    // Process the scanned user ID
    await processScannedUser(decodedText);
  }, []);

  const processScannedUser = async (userId) => {
    setLoading(true);
    setScannedUser(null);
    setUserEvents([]);
    setShowEventSelection(false);

    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .rpc("get_user_profile_for_scanner", { p_user_id: userId });

      if (profileError || profileData?.error) {
        throw new Error(profileData?.message || "User not found");
      }

      setScannedUser(profileData);

      // Get user's registered events
      const { data: eventsData, error: eventsError } = await supabase
        .rpc("get_user_registered_events", { p_user_id: userId });

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        setScanResult({
          status: "error",
          message: "No registered events found for this user",
          code: "NO_EVENTS",
          student_name: profileData.full_name,
          student_dept: profileData.department
        });
        errorAudio.current?.play().catch(() => {});
        navigator.vibrate?.(500);
        return;
      }

      // Filter events based on coordinator's assignments (unless super admin)
      let filteredEventsData = eventsData;
      if (!isSuperAdmin && assignedEventIds.length > 0) {
        // Check if assignedEventIds are UUIDs or text event_keys
        const isUUID = assignedEventIds[0]?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        
        if (isUUID) {
          // Compare by UUID event_id
          filteredEventsData = eventsData.filter((e) => 
            assignedEventIds.includes(e.event_id)
          );
        } else {
          // Compare by text event_key
          filteredEventsData = eventsData.filter((e) => 
            assignedEventIds.includes(e.event_key)
          );
        }
        
        if (filteredEventsData.length === 0) {
          setScanResult({
            status: "warning",
            message: "Student is not registered for your assigned events",
            code: "NOT_YOUR_EVENT",
            student_name: profileData.full_name,
            student_dept: profileData.department
          });
          errorAudio.current?.play().catch(() => {});
          return;
        }
      }

      // Filter pending events (not yet attended)
      const pendingEvents = filteredEventsData.filter((e) => !e.already_attended);
      
      setUserEvents(filteredEventsData);

      if (pendingEvents.length === 0) {
        // All events already attended
        setScanResult({
          status: "warning",
          message: "Already attended all registered events",
          code: "ALL_ATTENDED",
          student_name: profileData.full_name,
          student_dept: profileData.department
        });
        errorAudio.current?.play().catch(() => {});
        return;
      } else if (pendingEvents.length === 1) {
        // Only one pending event - mark directly
        await markAttendance(userId, pendingEvents[0].event_id, pendingEvents[0].event_name);
      } else {
        // Multiple events - show selection
        setShowEventSelection(true);
        setSelectedEventId(null);
      }
    } catch (error) {
      console.error("Error processing scan:", error);
      setScanResult({
        status: "error",
        message: error.message || "Failed to process scan",
        code: "PROCESS_ERROR"
      });
      errorAudio.current?.play().catch(() => {});
      navigator.vibrate?.(500);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (userId, eventId, eventName) => {
    setMarkingAttendance(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      const { data, error } = await supabase.rpc("mark_event_attendance", {
        p_user_id: userId,
        p_event_id: eventId,
        p_scanned_by: user?.id,
        p_scan_location: null
      });

      if (error) throw error;

      setScanResult({
        ...data,
        event_name: eventName || data.event_name
      });

      if (data.status === "success") {
        successAudio.current?.play().catch(() => {});
        navigator.vibrate?.(200);
      } else {
        errorAudio.current?.play().catch(() => {});
        navigator.vibrate?.(500);
      }

      setShowEventSelection(false);
    } catch (error) {
      console.error("Error marking attendance:", error);
      setScanResult({
        status: "error",
        message: error.message || "Failed to mark attendance",
        code: "MARK_ERROR"
      });
      errorAudio.current?.play().catch(() => {});
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleEventSelect = async (event) => {
    if (event.already_attended) return;
    setSelectedEventId(event.event_id);
    await markAttendance(scannedUser.id, event.event_id, event.event_name);
  };

  const handleManualEntry = async () => {
    if (!manualId.trim()) return;
    setManualEntry(false);
    await processScannedUser(manualId.trim());
    setManualId("");
  };

  const switchCamera = async () => {
    const currentIndex = cameras.findIndex((cam) => cam.id === cameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    await stopScanner();
    setCameraId(nextCamera.id);
    
    setTimeout(() => {
      startScanner();
    }, 300);
  };

  const resetScanner = () => {
    setScanResult(null);
    setScannedUser(null);
    setUserEvents([]);
    setShowEventSelection(false);
    setSelectedEventId(null);
  };

  const continueScanning = () => {
    resetScanner();
    startScanner();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2 pt-2"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary mb-2">
            <Scan className="text-white" size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            Attendance Scanner
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Scan student QR to mark attendance</p>
        </motion.div>

        {/* Main Scanner Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden"
        >
          {/* Scanner View */}
          {!scanning && !loading && !showEventSelection && !scanResult ? (
            <div className="p-6 sm:p-8 text-center space-y-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-secondary/20 to-primary/20 rounded-3xl flex items-center justify-center">
                <Camera className="text-secondary" size={48} />
              </div>
              
              {cameraError ? (
                <div className="bg-red-900/30 border-2 border-red-500 rounded-2xl p-6 text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-400 mb-3">Camera Error</h3>
                  <div className="bg-black/40 rounded-lg p-4 mb-4">
                    <p className="text-amber-300 text-sm font-mono break-words">{cameraError}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Device: ${navigator.userAgent}\nError: ${cameraError}`);
                      alert('Error details copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm mb-3"
                  >
                    Copy Error Details
                  </button>
                  <div className="text-gray-400 text-xs space-y-2 text-left">
                    <p><strong>Troubleshooting:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Check browser console (F12) for detailed logs</li>
                      <li>Ensure camera permissions are granted</li>
                      <li>Try refreshing the page</li>
                      <li>Use HTTPS or localhost</li>
                      <li>Close other apps using camera</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setCameraError(null);
                      getCameras();
                    }}
                    className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-5 h-5" /> Retry Camera
                  </button>
                </div>
              ) : cameraError ? (
                <div className="space-y-4">
                  {/* Prominent Error Display */}
                  <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <AlertTriangle className="text-red-400 animate-pulse" size={48} />
                      <div>
                        <p className="text-red-400 font-bold text-lg mb-2">Camera Error</p>
                        <div className="bg-black/40 rounded-lg p-4 mb-3">
                          <p className="text-amber-300 text-base font-mono break-words">{cameraError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Troubleshooting Guide */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-400 font-semibold text-sm mb-2">📋 Troubleshooting:</p>
                    <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside text-left">
                      <li>Open browser console (F12) for detailed logs</li>
                      <li>Ensure camera permission is granted</li>
                      <li>Close other apps using the camera</li>
                      <li>Use HTTPS or localhost URL</li>
                      <li>Try refreshing the page</li>
                    </ul>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        console.log('🔄 User clicked Retry Camera');
                        setCameraError(null);
                        getCameras();
                      }}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl transition-colors flex items-center gap-2 font-bold"
                    >
                      <RefreshCw size={18} />
                      <span>Retry Camera</span>
                    </button>
                    <button
                      onClick={() => {
                        const errorDetails = `Device: ${navigator.userAgent}\nPlatform: ${navigator.platform}\nError: ${cameraError}\nURL: ${window.location.href}\nSecure: ${window.isSecureContext}`;
                        navigator.clipboard.writeText(errorDetails);
                        alert('✅ Error details copied to clipboard!');
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Copy size={18} />
                      <span>Copy Error</span>
                    </button>
                    <button
                      onClick={() => setManualEntry(true)}
                      className="px-6 py-3 bg-gradient-to-r from-secondary to-primary rounded-xl font-bold text-white flex items-center gap-2"
                    >
                      <Keyboard size={18} />
                      <span>Manual Entry</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Ready to Scan</h3>
                    <p className="text-gray-400 text-sm sm:text-base">
                      Point your camera at the student's QR code
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={startScanner}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-secondary to-primary rounded-xl sm:rounded-2xl font-bold text-white hover:shadow-2xl hover:shadow-secondary/50 transition-all text-base sm:text-lg touch-manipulation"
                    >
                      Start Camera
                    </button>
                    <button
                      onClick={() => setManualEntry(true)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 touch-manipulation"
                    >
                      <Keyboard size={20} />
                      <span>Manual Entry</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : scanning ? (
            <div className="relative">
              {/* QR Reader Container */}
              <div 
                id="qr-reader" 
                className="w-full aspect-square max-h-[70vh]"
                style={{ 
                  minHeight: '280px',
                  background: '#000'
                }}
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-secondary rounded-2xl relative">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-secondary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-secondary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-secondary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-secondary rounded-br-lg" />
                  
                  {/* Scanning line animation */}
                  <motion.div 
                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent"
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Camera Controls */}
              <div className="absolute top-4 right-4 flex gap-2">
                {cameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="p-3 bg-black/60 backdrop-blur rounded-xl hover:bg-black/80 transition-colors touch-manipulation"
                    aria-label="Switch camera"
                  >
                    <SwitchCamera className="text-white" size={22} />
                  </button>
                )}
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
                <button
                  onClick={stopScanner}
                  className="px-5 py-3 bg-red-500/80 backdrop-blur rounded-xl transition-colors flex items-center gap-2 font-medium touch-manipulation"
                >
                  <CameraOff size={18} />
                  <span>Stop</span>
                </button>
                <button
                  onClick={() => {
                    stopScanner();
                    setManualEntry(true);
                  }}
                  className="px-5 py-3 bg-black/60 backdrop-blur rounded-xl transition-colors flex items-center gap-2 touch-manipulation"
                >
                  <Keyboard size={18} />
                  <span>Manual</span>
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="p-8 sm:p-12 text-center">
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-secondary mx-auto mb-4" />
              <p className="text-gray-400">Processing scan...</p>
            </div>
          ) : null}
        </motion.div>

        {/* Event Selection Modal */}
        <AnimatePresence>
          {showEventSelection && scannedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
              onClick={() => {
                setShowEventSelection(false);
                resetScanner();
              }}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-lg max-h-[90vh] bg-gray-900 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden"
              >
                {/* User Header */}
                <div className="bg-gradient-to-r from-secondary/20 to-primary/20 p-4 sm:p-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center flex-shrink-0">
                      <User className="text-white" size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                        {scannedUser.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <Building size={14} />
                        <span className="truncate">{scannedUser.department || "N/A"}</span>
                      </div>
                      {scannedUser.roll_no && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Hash size={14} />
                          <span>{scannedUser.roll_no}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Events List */}
                <div className="p-4 sm:p-6">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Select Event to Mark Attendance
                  </h4>
                  
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
                    {userEvents.map((event) => (
                      <motion.button
                        key={event.event_id}
                        whileHover={{ scale: event.already_attended ? 1 : 1.01 }}
                        whileTap={{ scale: event.already_attended ? 1 : 0.98 }}
                        onClick={() => handleEventSelect(event)}
                        disabled={event.already_attended || markingAttendance}
                        className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 touch-manipulation ${
                          event.already_attended
                            ? "bg-gray-800/50 opacity-60 cursor-not-allowed"
                            : selectedEventId === event.event_id
                            ? "bg-secondary/20 border-2 border-secondary"
                            : "bg-white/5 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          event.already_attended 
                            ? "bg-green-500/20" 
                            : "bg-gradient-to-br from-secondary/30 to-primary/30"
                        }`}>
                          {event.already_attended ? (
                            <CheckCircle2 className="text-green-400" size={20} />
                          ) : (
                            <Calendar className="text-secondary" size={20} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">
                            {event.event_name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            {event.venue && (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {event.venue}
                              </span>
                            )}
                            {event.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {event.start_time}
                              </span>
                            )}
                          </div>
                          {event.already_attended && (
                            <p className="text-xs text-green-400 mt-1">
                              ✓ Attended at {new Date(event.attendance_time).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        
                        {!event.already_attended && (
                          <ChevronRight className="text-gray-500 flex-shrink-0" size={20} />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 safe-area-bottom">
                  <button
                    onClick={() => {
                      setShowEventSelection(false);
                      resetScanner();
                    }}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-semibold touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Modal */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => {}}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`max-w-md w-full rounded-3xl p-6 sm:p-8 text-center space-y-5 ${
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
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={40} />
                    </div>
                  ) : scanResult.status === "warning" ? (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="text-white" size={40} />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-500 rounded-full flex items-center justify-center">
                      <XCircle className="text-white" size={40} />
                    </div>
                  )}
                </motion.div>

                {/* Status */}
                <div className="space-y-2">
                  <h3
                    className={`text-2xl sm:text-3xl font-bold ${
                      scanResult.status === "success"
                        ? "text-green-400"
                        : scanResult.status === "warning"
                        ? "text-orange-400"
                        : "text-red-400"
                    }`}
                  >
                    {scanResult.status === "success"
                      ? "Success!"
                      : scanResult.status === "warning"
                      ? "Already Done"
                      : "Error"}
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base">{scanResult.message}</p>
                </div>

                {/* Student & Event Details */}
                {(scanResult.student_name || scanResult.event_name) && (
                  <div className="bg-white/10 rounded-2xl p-4 sm:p-5 space-y-3 text-left">
                    {scanResult.student_name && (
                      <div className="flex items-center gap-3">
                        <User className="text-gray-400 flex-shrink-0" size={18} />
                        <div>
                          <p className="text-xs text-gray-400">Student</p>
                          <p className="font-semibold text-white">{scanResult.student_name}</p>
                        </div>
                      </div>
                    )}
                    {scanResult.student_dept && (
                      <div className="flex items-center gap-3">
                        <Building className="text-gray-400 flex-shrink-0" size={18} />
                        <div>
                          <p className="text-xs text-gray-400">Department</p>
                          <p className="font-semibold text-white">{scanResult.student_dept}</p>
                        </div>
                      </div>
                    )}
                    {scanResult.student_roll_no && (
                      <div className="flex items-center gap-3">
                        <Hash className="text-gray-400 flex-shrink-0" size={18} />
                        <div>
                          <p className="text-xs text-gray-400">Roll No</p>
                          <p className="font-semibold text-white">{scanResult.student_roll_no}</p>
                        </div>
                      </div>
                    )}
                    {scanResult.event_name && (
                      <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                        <Calendar className="text-secondary flex-shrink-0" size={18} />
                        <div>
                          <p className="text-xs text-gray-400">Event</p>
                          <p className="font-semibold text-secondary">{scanResult.event_name}</p>
                        </div>
                      </div>
                    )}
                    {scanResult.first_entry_time && (
                      <div className="flex items-center gap-3">
                        <Clock className="text-orange-400 flex-shrink-0" size={18} />
                        <div>
                          <p className="text-xs text-gray-400">First Entry</p>
                          <p className="font-semibold text-orange-400">
                            {new Date(scanResult.first_entry_time).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={continueScanning}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-semibold touch-manipulation"
                >
                  Scan Next
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
              onClick={() => setManualEntry(false)}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-md bg-gray-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Manual Entry</h3>
                  <button
                    onClick={() => setManualEntry(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors touch-manipulation"
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
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-secondary text-base touch-manipulation"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleManualEntry}
                    disabled={!manualId.trim() || loading}
                    className="w-full py-3.5 bg-gradient-to-r from-secondary to-primary rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Verify & Continue"
                    )}
                  </button>
                </div>
                
                <div className="safe-area-bottom" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AttendanceScanner;
