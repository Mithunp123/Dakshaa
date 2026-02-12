import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  UserCheck, 
  Users, 
  CheckCircle2,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { Html5Qrcode } from 'html5-qrcode';
import toast, { Toaster } from 'react-hot-toast';
import {
  checkCameraSupport,
  getCameraErrorMessage,
  getCameraConfig,
  selectBestCamera,
  requestCameraPermission,
  vibrate
} from '../../../utils/scannerConfig';

const formatDakshaaId = (uuid) => {
  if (!uuid) return 'N/A';
  return `DK-${uuid.substring(0, 8).toUpperCase()}`;
};

const GlobalScannerPage = () => {
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraId, setCameraId] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    fetchAssignedEvents();
    getCameras();
    return () => {
      stopScanning();
    };
  }, []);

  const fetchAssignedEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: coords } = await supabase
        .from('event_coordinators')
        .select('event_id')
        .eq('user_id', user.id);
      
      const assignedEventIds = coords?.map(c => c.event_id) || [];
      
      if (assignedEventIds.length > 0) {
        const { data: events } = await supabase
          .from('events_config')
          .select('*')
          .in('id', assignedEventIds);
        setAssignedEvents(events || []);
      }
    } catch (error) {
      console.error('Error fetching assigned events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCameras = async () => {
    const support = checkCameraSupport();
    if (!support.isSecureContext) {
      setCameraError('HTTPS required for camera access');
      return;
    }

    const permissionResult = await requestCameraPermission();
    if (!permissionResult.success) {
      setCameraError(permissionResult.error.message);
      return;
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError('No cameras found');
        return;
      }
      
      // Select best camera (back camera on mobile)
      const bestCameraId = selectBestCamera(devices);
      setCameraId(bestCameraId);
      console.log('📷 Selected camera:', bestCameraId, devices);
    } catch (error) {
      const errorInfo = getCameraErrorMessage(error);
      setCameraError(errorInfo.message);
    }
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      setCameraError(null);
      
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-scanner", { verbose: false });
      }

      const support = checkCameraSupport();
      
      // Check if we're in a secure context
      if (!support.isSecureContext) {
        throw new Error('Camera access requires HTTPS. Please use https:// or localhost');
      }
      
      const config = getCameraConfig(support.isMobile);
      const isMobile = support.isMobile;
      
      // Priority: camera ID (most reliable) > exact environment > environment > user (front as last resort)
      let cameraStarted = false;
      
      // Method 1: Try using selected camera ID (most reliable method)
      if (cameraId && !cameraStarted) {
        try {
          console.log('📸 Trying selected camera ID:', cameraId);
          await html5QrCodeRef.current.start(
            cameraId,
            config,
            onScanSuccess,
            () => {}
          );
          console.log('✅ Camera started with ID');
          cameraStarted = true;
        } catch (error) {
          console.log('⚠️ Camera ID failed:', error.message);
        }
      }
      
      // Method 2: Try exact facingMode environment (FORCES back camera on mobile)
      if (isMobile && !cameraStarted) {
        try {
          console.log('📸 [Mobile] Trying exact facingMode: environment');
          await html5QrCodeRef.current.start(
            { facingMode: { exact: "environment" } },
            config,
            onScanSuccess,
            () => {}
          );
          console.log('✅ Back camera started (exact)');
          cameraStarted = true;
        } catch (error) {
          console.log('⚠️ Exact back camera failed:', error.message);
        }
      }

      // Method 3: Try facingMode environment (back camera)
      if (!cameraStarted) {
        try {
          console.log('📸 Trying facingMode: environment');
          await html5QrCodeRef.current.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            () => {}
          );
          console.log('✅ Back camera started');
          cameraStarted = true;
        } catch (error) {
          console.log('⚠️ Back camera failed:', error.message);
        }
      }

      // Method 4: Last resort - front camera
      if (!cameraStarted) {
        try {
          console.log('📸 Trying facingMode: user (front camera - last resort)');
          await html5QrCodeRef.current.start(
            { facingMode: "user" },
            config,
            onScanSuccess,
            () => {}
          );
          console.log('✅ Front camera started');
          cameraStarted = true;
        } catch (error) {
          console.error('❌ All camera methods failed');
          throw error;
        }
      }
    } catch (error) {
      console.error('Scanner start error:', error);
      const errorInfo = getCameraErrorMessage(error);
      setCameraError(errorInfo.message);
      setScanning(false);
      toast.error(errorInfo.message || 'Failed to start camera');
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      setScanning(false);
    } catch (error) {
      console.error('Error stopping scanner:', error);
      setScanning(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    vibrate(100);
    await stopScanning();
    await markGlobalAttendance(decodedText);
    
    setTimeout(() => {
      startScanning();
    }, 1000);
  };

  const markGlobalAttendance = async (decodedText) => {
    try {
      setSubmitting(true);

      // Parse QR code data - can be JSON or plain UUID
      let userId;
      
      try {
        // Try to parse as JSON (legacy QR format)
        const qrData = JSON.parse(decodedText);
        userId = qrData.userId || qrData.id;
        console.log('📱 Parsed JSON QR, extracted userId:', userId);
      } catch (e) {
        // Plain UUID format (current format)
        userId = decodedText;
        console.log('📱 Using plain UUID:', userId);
      }

      if (!userId) {
        toast.error('Invalid QR code format');
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        toast.error('Invalid participant ID in QR code');
        return;
      }

      // Fetch participant profile
      const { data: participant, error: participantError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, college')
        .eq('id', userId)
        .single();

      if (participantError || !participant) {
        toast.error('Participant not found');
        return;
      }

      const assignedEventIds = assignedEvents.map(event => event.id);
      
      // Fetch ALL registrations for this user (to show what they're registered for)
      const { data: allRegistrations, error: allRegError } = await supabase
        .from('event_registrations_config')
        .select(`
          *,
          events_config:event_id (id, name, event_key)
        `)
        .eq('user_id', userId)
        .in('payment_status', ['PAID', 'completed']);

      if (allRegError) {
        toast.error('Error checking registrations');
        return;
      }

      // Get event names the student is registered for
      const registeredEventNames = allRegistrations?.map(r => r.events_config?.name).filter(Boolean) || [];

      // Check if student has any paid registrations
      if (!allRegistrations || allRegistrations.length === 0) {
        toast.error(`${participant.full_name} has no paid registrations`);
        return;
      }

      // Filter to only coordinator's assigned events
      const registrations = allRegistrations?.filter(r => assignedEventIds.includes(r.event_id)) || [];

      // Get current user for marking attendance
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // If coordinator has NO matching assigned events - just show info (blue toast)
      if (!registrations || registrations.length === 0) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-blue-500 shadow-lg rounded-2xl pointer-events-auto p-4`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <UserCheck className="text-blue-500" size={28} />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-lg">{participant.full_name}</p>
                <p className="text-white/80 text-sm">{formatDakshaaId(participant.id)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white/90 text-xs font-medium">⚠️ Not your assigned event</p>
              <p className="text-white/90 text-xs font-medium">Registered events:</p>
              {registeredEventNames.map((name, idx) => (
                <div key={idx} className="text-white/80 text-xs px-2 py-1 bg-white/20 rounded">
                  • {name}
                </div>
              ))}
            </div>
          </div>
        ), { duration: 4000 });
        return;
      }

      // Coordinator IS assigned to this event - mark attendance
      const eventToMark = registrations[0].events_config;

      // Mark attendance using RPC
      const { data: attendanceResult, error: attendanceError } = await supabase.rpc("mark_event_attendance", {
        p_user_id: userId,
        p_event_id: eventToMark?.id || registrations[0].event_id,
        p_scanned_by: currentUser?.id,
        p_scan_location: null
      });

      // Show success with attendance marked info
      const eventName = eventToMark?.name || 'Event';
      let isAlreadyAttended = attendanceResult?.already_attended;

      // Helper to detect duplicate key errors from any shape
      const isDuplicate = (obj) => {
        if (!obj) return false;
        const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
        return str.includes('duplicate key') || str.includes('attendance_user_id_event_id_key') || str.includes('23505') || str.includes('already marked');
      };

      // Handle duplicate attendance error
      if (attendanceError) {
        console.error('Attendance error:', attendanceError);
        if (isDuplicate(attendanceError)) {
          isAlreadyAttended = true;
        } else {
          toast.error(attendanceError.message || 'Failed to mark attendance');
          return;
        }
      }

      // Also check if the RPC returned success but with error/warning status containing duplicate key
      if (!attendanceError && isDuplicate(attendanceResult)) {
        isAlreadyAttended = true;
      }

      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full ${isAlreadyAttended ? 'bg-orange-500' : 'bg-green-500'} shadow-lg rounded-2xl pointer-events-auto p-4`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <UserCheck className={isAlreadyAttended ? 'text-orange-500' : 'text-green-500'} size={28} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">{participant.full_name}</p>
              <p className="text-white/80 text-sm font-mono">{formatDakshaaId(participant.id)}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-white" size={16} />
              <p className="text-white font-medium">
                {isAlreadyAttended ? '⚠️ Duplicate Entry - Already Marked' : '✓ Attendance Marked'}: {eventName}
              </p>
            </div>
            {registeredEventNames.length > 1 && (
              <div className="mt-2">
                <p className="text-white/90 text-xs font-medium">Also registered for:</p>
                {registeredEventNames.filter(n => n !== eventName).map((name, idx) => (
                  <div key={idx} className="text-white/70 text-xs">
                    • {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ), { duration: 4000 });

    } catch (error) {
      console.error('Error in global scan:', error);
      
      const errStr = typeof error === 'string' ? error : JSON.stringify(error);
      if (errStr.includes('duplicate key') || errStr.includes('attendance_user_id_event_id_key') || errStr.includes('23505')) {
        toast('⚠️ Already marked for this session', { 
          duration: 2000, 
          icon: '⚠️', 
          style: { background: '#fed7aa', color: '#92400e' } 
        });
      } else if (error?.code === 'DUPLICATE_SESSION' || error?.status === 'duplicate') {
        toast('⚠️ Already marked for this session', { 
          duration: 2000, 
          icon: '⚠️', 
          style: { background: '#fed7aa', color: '#92400e' } 
        });
      } else {
        toast.error('Error processing scan');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8">
      <Toaster position="top-right" />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white font-orbitron mb-2">
            Global Scanner
          </h1>
          <p className="text-gray-400">
            Universal QR code scanner for participant verification
          </p>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8">
          {cameraError && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-amber-400 font-medium text-sm mb-1">Camera Unavailable</p>
                  <p className="text-amber-300/80 text-xs">{cameraError}</p>
                </div>
              </div>
            </div>
          )}

          {!scanning ? (
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto bg-secondary/10 rounded-[2rem] flex items-center justify-center border-4 border-secondary/20">
                <QrCode className="text-secondary" size={64} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <Users className="mx-auto text-blue-500 mb-2" size={24} />
                  <p className="text-blue-500 font-bold text-lg">
                    {assignedEvents.reduce((acc, event) => acc + (event.registeredCount || 0), 0)}
                  </p>
                  <p className="text-gray-400 text-xs">Total Registered</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <CheckCircle2 className="mx-auto text-green-500 mb-2" size={24} />
                  <p className="text-green-500 font-bold text-lg">
                    {assignedEvents.reduce((acc, event) => acc + (event.attendedCount || 0), 0)}
                  </p>
                  <p className="text-gray-400 text-xs">Total Attended</p>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Scan</h3>
                <p className="text-gray-400 mb-6">Universal participant verification across your assigned events</p>
                
                <button
                  onClick={startScanning}
                  disabled={cameraError}
                  className="px-8 py-4 bg-secondary text-white font-bold text-lg rounded-2xl hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
                >
                  <Camera size={24} />
                  Start Global Scanner
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/30">
                <p className="text-xs text-gray-400 uppercase mb-1">Global Scanning Mode Active</p>
                <p className="text-secondary font-bold">Scanning for any participant in your assigned events</p>
              </div>
              
              <div 
                id="qr-scanner" 
                className="rounded-2xl overflow-hidden bg-black min-h-[400px]"
              />
              
              <p className="text-sm text-gray-400">
                Point camera at any participant QR code • Global verification enabled
              </p>
              
              <button
                onClick={stopScanning}
                disabled={submitting}
                className="px-6 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto"
              >
                {submitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <X size={20} />
                )}
                {submitting ? 'Processing...' : 'Stop Scanner'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GlobalScannerPage;