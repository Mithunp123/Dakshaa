import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  MapPin, 
  Search, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Loader2,
  Utensils,
  ShieldCheck,
  Info,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { Html5Qrcode } from 'html5-qrcode';
import {
  checkCameraSupport,
  getCameraErrorMessage,
  getCameraConfig,
  selectBestCamera,
  requestCameraPermission,
  vibrate
} from '../../../utils/scannerConfig';

// Event dates for DaKshaa 2026
const EVENT_DATES = {
  day1: new Date('2026-02-12'),
  day2: new Date('2026-02-13'),
  day3: new Date('2026-02-14')
};

// Get current day based on today's date
const getCurrentDay = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Compare with event dates
  for (const [day, eventDate] of Object.entries(EVENT_DATES)) {
    const compareDate = new Date(eventDate);
    compareDate.setHours(0, 0, 0, 0);
    if (today.getTime() === compareDate.getTime()) {
      return day;
    }
  }
  
  // Default to day1 if not an event day
  return 'day1';
};

const VolunteerDashboard = () => {
  const [activeTab, setActiveTab] = useState('gate');
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [cameraId, setCameraId] = useState(null);
  const [scanMode, setScanMode] = useState(null);
  const [foodRecords, setFoodRecords] = useState([]);
  const [loadingFoodRecords, setLoadingFoodRecords] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);
  const [showUserConfirm, setShowUserConfirm] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState(null);
  
  const html5QrCodeRef = useRef(null);
  
  // Get current day automatically
  const currentDay = getCurrentDay();

  useEffect(() => {
    fetchVenues();
    getCameras(); // Request camera permission on mount
    fetchFoodRecords();
    
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, []);

  // Auto-dismiss delivery result modal after 3 seconds
  useEffect(() => {
    if (deliveryResult) {
      const timer = setTimeout(() => {
        resetLunchScanner();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [deliveryResult]);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('event_venues')
        .select('*');

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodRecords = async () => {
    try {
      setLoadingFoodRecords(true);
      const { data, error } = await supabase
        .from('food_tracking')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            mobile_number,
            college_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFoodRecords(data || []);
    } catch (error) {
      console.error('Error fetching food records:', error);
    } finally {
      setLoadingFoodRecords(false);
    }
  };

  const getCameras = async () => {
    const support = checkCameraSupport();
    if (!support.isSecureContext) {
      const error = getCameraErrorMessage({ message: 'HTTPS required' });
      setCameraError(error.message);
      return false;
    }

    const permissionResult = await requestCameraPermission();
    if (!permissionResult.success) {
      setCameraError(permissionResult.error.message);
      return false;
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        const error = getCameraErrorMessage({ message: 'No cameras found' });
        setCameraError(error.message);
        return false;
      }

      const bestCameraId = selectBestCamera(devices);
      setCameraId(bestCameraId);
      return true;
    } catch (error) {
      console.error("Error getting cameras:", error);
      const errorInfo = getCameraErrorMessage(error);
      setCameraError(errorInfo.message);
      return false;
    }
  };

  const startScanning = async (mode) => {
    setScanMode(mode);
    setCameraError(null);

    try {
      // Stop any existing scanner first
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
        html5QrCodeRef.current = null;
      }

      const hasCamera = await getCameras();
      if (!hasCamera) {
        setScanning(false);
        return;
      }

      // Set scanning to true first to trigger React re-render
      setScanning(true);

      // Wait longer for React to commit DOM changes and element to be available
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if the element exists before initializing scanner
      const qrReaderElement = document.getElementById("volunteer-qr-reader");
      if (!qrReaderElement) {
        throw new Error('QR reader element not found in DOM. Please try again.');
      }
      
      html5QrCodeRef.current = new Html5Qrcode("volunteer-qr-reader", {
        verbose: false
      });

      const support = checkCameraSupport();
      
      // Check if we're in a secure context
      if (!support.isSecureContext) {
        throw new Error('Camera access requires HTTPS. Please use https:// or localhost');
      }
      
      const config = getCameraConfig(support.isMobile);

      // Try back camera using different methods
      // MOBILE: exact environment > environment > camera ID > user (front)
      // DESKTOP: camera ID > environment > user (front)
      let cameraStarted = false;
      const isMobile = support.isMobile;
      
      // Method 1: For MOBILE - Try exact facingMode environment FIRST (FORCES back camera)
      if (isMobile && !cameraStarted) {
        try {
          console.log('📸 [Mobile] Trying EXACT facingMode: environment (Priority #1)');
          await html5QrCodeRef.current.start(
            { facingMode: { exact: "environment" } },
            config,
            (decodedText) => onScanSuccess(decodedText, mode),
            () => {}
          );
          console.log('✅ Back camera started (exact environment)');
          cameraStarted = true;
        } catch (error) {
          console.log('⚠️ Exact back camera failed:', error.message);
        }
      }

      // Method 2: Try general facingMode environment (back camera)
      if (!cameraStarted) {
        try {
          console.log('📸 Trying facingMode: environment');
          await html5QrCodeRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText) => onScanSuccess(decodedText, mode),
            () => {}
          );
          console.log('✅ Back camera started (environment)');
          cameraStarted = true;
        } catch (error) {
          console.log('⚠️ Back camera (environment) failed:', error.message);
        }
      }
      
      // Method 3: Try using detected camera ID (fallback for desktop/specific devices)
      if (cameraId && !cameraStarted) {
        try {
          console.log('📸 Trying selected camera ID:', cameraId);
          await html5QrCodeRef.current.start(
            cameraId,
            config,
            (decodedText) => onScanSuccess(decodedText, mode),
            () => {}
          );
          console.log('✅ Camera started with ID');
          cameraStarted = true;
        } catch (error) {
          console.log('⚠️ Camera ID failed:', error.message);
        }
      }

      // Method 4: Last resort - front camera
      if (!cameraStarted) {
        try {
          console.log('📸 Trying facingMode: user (front camera - last resort)');
          await html5QrCodeRef.current.start(
            { facingMode: "user" },
            config,
            (decodedText) => onScanSuccess(decodedText, mode),
            () => {}
          );
          console.log('✅ Front camera started');
          cameraStarted = true;
        } catch (error) {
          console.error('❌ All camera methods failed');
          throw new Error('Failed to start camera. Please check permissions.');
        }
      }

    } catch (error) {
      console.error('Scanner error:', error);
      const errorInfo = getCameraErrorMessage(error);
      setCameraError(errorInfo.message);
      setScanning(false);
      
      // Cleanup on error
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setScanning(false);
    setScanMode(null);
    setCameraError(null);
  };

  const onScanSuccess = async (decodedText, mode) => {
    // Prevent duplicate scans if already processing
    if (submitting) return;

    console.log('QR Scanned:', decodedText);
    vibrate(100);

    if (mode === 'gate') {
      await stopScanning();
      await verifyGatePass(decodedText);
    } else if (mode === 'lunch') {
      // Pause scanner to freeze frame instead of stopping it completely
      try {
        if (html5QrCodeRef.current) {
          html5QrCodeRef.current.pause(true); 
        }
      } catch (e) { 
        console.error('Pause error:', e); 
      }

      // Process plain UUID from QR code
      const userId = decodedText.trim();
      await processLunchDelivery(userId);
    }
  };

  const onScanError = (errorMessage) => {
    // Silent error handling - QR not detected yet
  };

  const verifyGatePass = async (qrContent) => {
    try {
      setSubmitting(true);

      console.log('QR Content:', qrContent);
      
      // Clean the QR content
      const cleanedContent = qrContent.trim();
      
      // Parse QR code content for multi-line format (e.g., "DEVAPRAKASH\nDAK26-9852F679")
      let registrationCode = cleanedContent;
      if (cleanedContent.includes('\n')) {
        // QR contains multiple lines, extract registration code (second line)
        const lines = cleanedContent.split('\n');
        registrationCode = lines[1]?.trim() || lines[0]?.trim();
      }
      
      // Check if it looks like a DAK registration ID (DAK26-XXXX format)
      const isDakRegId = /^DAK\d{2}-[A-Z0-9]+$/i.test(registrationCode);
      
      // Check if it's a UUID format (user ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(cleanedContent);
      
      console.log('Is DAK Registration ID:', isDakRegId, 'Is UUID:', isUUID, 'Code:', registrationCode);
      
      let profile = null;
      let paidRegistrations = null;
      
      // Strategy 1: PRIMARY - Try as registration_id (DAK26-XXXX format)
      console.log('🔍 PRIMARY: Trying as registration_id:', registrationCode);
      
      // First check if this registration code exists in the old registrations table
      const { data: oldRegistration, error: oldRegError } = await supabase
        .from('registrations')
        .select('user_id, registration_id')
        .eq('registration_id', registrationCode)
        .single();

      let userId = null;

      if (!oldRegError && oldRegistration) {
        userId = oldRegistration.user_id;
        console.log('✅ Found registration code, user_id:', userId);
      }
      
      // Strategy 2: FALLBACK - If UUID format, treat as user_id
      if (!userId && isUUID) {
        console.log('🔍 FALLBACK: Trying as user ID (UUID):', cleanedContent);
        userId = cleanedContent;
      }
      
      // Strategy 3: Final attempt - try as user_id for non-UUID formats
      if (!userId) {
        console.log('🔍 Final attempt - trying as user_id:', cleanedContent);
        userId = cleanedContent;
      }

      // Get user profile
      if (userId) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (!profileError && profileData) {
          profile = profileData;
          console.log('✅ Found profile:', profile.full_name);
          
          // Get ONLY PAID registrations from event_registrations_config
          const { data: paidRegs, error: regsError } = await supabase
            .from('event_registrations_config')
            .select(`
              *,
              events:event_id(*)
            `)
            .eq('user_id', userId)
            .eq('payment_status', 'PAID');
            
          if (!regsError && paidRegs) {
            console.log('✅ Found paid registrations:', paidRegs.length);
            
            // For each registration, check if it's a team event and get team details
            const registrationsWithTeams = await Promise.all(
              paidRegs.map(async (reg) => {
                const event = reg.events;
                
                // Check if this is a team event (has max_team_size > 1)
                if (event?.max_team_size > 1) {
                  // First, find if user is in any team for this event
                  const { data: teamMembership } = await supabase
                    .from('team_members')
                    .select('team_id')
                    .eq('user_id', userId);
                    
                  if (teamMembership && teamMembership.length > 0) {
                    // Find the team for this specific event
                    const { data: eventTeam } = await supabase
                      .from('teams')
                      .select('id, team_name')
                      .eq('event_id', event.id)
                      .in('id', teamMembership.map(tm => tm.team_id))
                      .single();
                      
                    if (eventTeam) {
                      // Get all team members for this team
                      const { data: allMembers } = await supabase
                        .from('team_members')
                        .select(`
                          profiles:user_id(
                            full_name,
                            email
                          )
                        `)
                        .eq('team_id', eventTeam.id);
                        
                      console.log('✅ Found team for event:', event.event_name, 'Team:', eventTeam.team_name);
                      return {
                        ...reg,
                        teamInfo: {
                          team_name: eventTeam.team_name,
                          team_members: allMembers?.map(member => member.profiles?.full_name).filter(Boolean) || []
                        }
                      };
                    }
                  }
                }
                
                return reg;
              })
            );
            
            paidRegistrations = registrationsWithTeams;
          }
        }
      }
      
      // If still no profile found, show error
      if (!profile) {
        console.error('❌ No profile found for QR:', qrContent);
        playBuzzSound();
        showFailureNotification('INVALID QR CODE', 'User or registration not found');
        return;
      }
      
      // Show only paid registered events for this user
      playTingSound();
      showRegisteredEvents(profile, paidRegistrations || []);
      
    } catch (error) {
      console.error('Error verifying gate pass:', error);
      playBuzzSound();
      showFailureNotification('ERROR', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const processLunchDelivery = async (inputCode) => {
    try {
      setSubmitting(true);
      setScannedUser(null);
      setDeliveryResult(null);
      let userId = inputCode.trim();
      
      console.log('Processing lunch delivery for code:', userId);
      
      // Clean input - handle multi-line content if any
      if (userId.includes('\n')) {
        const lines = userId.split('\n');
        userId = lines[1]?.trim() || lines[0]?.trim();
      }

      // Check if it's a DAK Registration ID (e.g. DAK26-XXXX)
      const isDakRegId = /^DAK\d{2}-[A-Z0-9]+$/i.test(userId);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(userId);

      // If it's a registration ID, resolve to User ID first
      if (isDakRegId && !isUUID) {
        console.log('🔍 Detected Registration ID. Resolving to User ID...');
        const { data: regData, error: regError } = await supabase
          .from('registrations')
          .select('user_id')
          .eq('registration_id', userId)
          .single();

        if (regError || !regData) {
          console.error('❌ Registration ID resolution failed:', regError);
          playBuzzSound();
          setDeliveryResult({
            status: 'error',
            message: 'Invalid Registration ID',
            subtitle: `Could not find user for ${userId}`
          });
          return;
        }
        userId = regData.user_id;
        console.log('✅ Resolved to User ID:', userId);
      } else if (!isUUID) {
        // Neither UUID nor valid Reg ID
        console.error('❌ Invalid format:', userId);
        playBuzzSound();
        setDeliveryResult({
          status: 'error',
          message: 'Invalid QR Format',
          subtitle: 'Please scan a valid User UUID or Registration ID'
        });
        return;
      }

      // Get user profile
      console.log('🔍 Looking up user profile:', userId);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, college_name, department, mobile_number, roll_number')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('❌ User not found:', profileError);
        playBuzzSound();
        setDeliveryResult({
          status: 'error',
          message: 'Student Not Found',
          subtitle: 'This user ID is not registered in the system'
        });
        return;
      }

      console.log('✅ Found user profile:', profile.full_name);
      
      // Show user confirmation modal
      setScannedUser(profile);
      setShowUserConfirm(true);

    } catch (error) {
      console.error('Error processing lunch delivery:', error);
      playBuzzSound();
      setDeliveryResult({
        status: 'error',
        message: 'System Error',
        subtitle: error.message || 'Please try again'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmLunchDelivery = async () => {
    try {
      setSubmitting(true);
      setShowUserConfirm(false);
      
      if (!scannedUser) return;
      
      console.log('📍 Confirming lunch delivery for:', scannedUser.full_name, 'Day:', currentDay);

      // Call the database function to record food delivery
      const { data: result, error: foodError } = await supabase
        .rpc('record_food_delivery', {
          p_user_id: scannedUser.id,
          p_day: currentDay
        });

      console.log('📍 RPC Response:', { result, error: foodError });

      if (foodError) {
        console.error('❌ RPC Error:', foodError);
        throw foodError;
      }

      if (!result) {
        console.error('❌ No result returned from RPC');
        throw new Error('No result returned from database function');
      }

      console.log('✅ Food delivery result:', result);

      if (result.already_received) {
        console.log('⚠️ Already received food');
        playBuzzSound();
        vibrate(500);
        setDeliveryResult({
          status: 'warning',
          message: 'Already Received',
          subtitle: result.message,
          userName: scannedUser.full_name
        });
      } else if (result.success) {
        console.log('✅ Food delivered successfully');
        // Refresh food records
        await fetchFoodRecords();
        
        playTingSound();
        vibrate(200);
        setDeliveryResult({
          status: 'success',
          message: 'Lunch Delivered',
          subtitle: `${scannedUser.full_name} - ${currentDay.replace('day', 'Day ')}`,
          userName: scannedUser.full_name
        });
      } else {
        console.log('❌ Delivery failed:', result.message);
        playBuzzSound();
        setDeliveryResult({
          status: 'error',
          message: 'Delivery Failed',
          subtitle: result.message || 'Failed to deliver food'
        });
      }

    } catch (error) {
      console.error('Error confirming lunch delivery:', error);
      playBuzzSound();
      setDeliveryResult({
        status: 'error',
        message: 'System Error',
        subtitle: error.message || 'Please try again'
      });
    } finally {
      setSubmitting(false);
      setScannedUser(null);
    }
  };

  const resetLunchScanner = () => {
    setScannedUser(null);
    setShowUserConfirm(false);
    setDeliveryResult(null);
    setSearchTerm('');
    setSubmitting(false);
    
    // Resume scanning if it was paused
    if (html5QrCodeRef.current && scanMode === 'lunch') {
      try {
        console.log('🔄 Resuming scanner...');
        html5QrCodeRef.current.resume();
      } catch (e) {
        console.log('Scanner resume note:', e);
      }
    }
  };

  const playTingSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyCz/LZiTUIFWi67OefTRALUKbj8LJeGwU5ktjvuXQjBSp5yO6ejD0IEWCy6OyrXBoCTqPh7K9fHQQ=');
    audio.play().catch(() => {});
  };

  const playBuzzSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
    audio.play().catch(() => {});
  };

  const showRegisteredEvents = (profile, paidRegistrations) => {
    const notification = document.createElement('div');
    notification.className = 'fixed inset-0 bg-slate-900/95 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto';
    
    console.log('Displaying paid registrations:', paidRegistrations.length);
    
    notification.innerHTML = `
      <div class="bg-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 border-b border-white/10">
          <div class="text-center mb-4">
            <div class="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-green-500/30">
              <svg class="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-white">${profile?.full_name || 'Student'}</h2>
            <p class="text-sm text-gray-300">${profile?.college_name || ''}</p>
            <p class="text-xs text-gray-400 mt-1">${profile?.email || ''}</p>
          </div>
          
          <div class="flex justify-center">
            <div class="bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30">
              <span class="text-green-400 font-bold">${paidRegistrations.length}</span>
              <span class="text-gray-300 ml-1">Paid Events</span>
            </div>
          </div>
        </div>
        
        <!-- Paid Events List -->
        <div class="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          ${paidRegistrations.length === 0 ? `
            <div class="text-center py-8">
              <svg class="w-16 h-16 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
              <p class="text-gray-400">No paid events found</p>
              <p class="text-xs text-gray-500 mt-2">Student needs to complete payment</p>
            </div>
          ` : paidRegistrations.map(reg => `
            <div class="bg-green-500/10 rounded-2xl p-4 border border-green-500/30">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h3 class="font-bold text-white text-base mb-1">${reg.events?.event_name || reg.event_name || 'Event'}</h3>
                  <p class="text-xs text-gray-400 mb-2">${reg.events?.event_type || 'Type: N/A'} • ${reg.events?.category || ''}</p>
                </div>
                <div class="text-right">
                  <span class="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">✓ PAID</span>
                  ${reg.payment_amount ? `<p class="text-xs text-gray-400 mt-1">₹${reg.payment_amount}</p>` : ''}
                </div>
              </div>
              
              ${reg.teamInfo ? `
                <div class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mt-3">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span class="text-sm font-bold text-purple-400">Team: ${reg.teamInfo.team_name}</span>
                  </div>
                  <div class="text-xs text-gray-300">
                    <p class="font-semibold mb-1">Team Members:</p>
                    <div class="space-y-1">
                      ${reg.teamInfo.team_members.map(member => `
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                          <span>${member}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        <!-- Footer -->
        <div class="p-4 border-t border-white/10">
          <button onclick="this.closest('.fixed').remove()" class="w-full py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold rounded-2xl transition-all border border-green-500/20">
            Close • Verified Paid Events Only
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  };

  const showSuccessNotification = (title, name, subtitle = '') => {
    const notification = document.createElement('div');
    notification.className = 'fixed inset-0 bg-green-500/90 z-[9999] flex items-center justify-center backdrop-blur-sm';
    notification.innerHTML = `
      <div class="text-center px-8">
        <div class="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <svg class="w-20 h-20 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-4xl font-bold text-white mb-3">${title}</h2>
        <p class="text-3xl text-white font-bold mb-2">${name}</p>
        ${subtitle ? `<p class="text-xl text-white/80">${subtitle}</p>` : ''}
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
  };

  const showFailureNotification = (title, message) => {
    const notification = document.createElement('div');
    notification.className = 'fixed inset-0 bg-red-500/90 z-[9999] flex items-center justify-center backdrop-blur-sm';
    notification.innerHTML = `
      <div class="text-center px-8">
        <div class="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <svg class="w-20 h-20 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h2 class="text-4xl font-bold text-white mb-3">${title}</h2>
        <p class="text-2xl text-white/80">${message}</p>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
  };

  const filteredVenues = venues.filter(v =>
    v.event_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 md:pb-8">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-orbitron text-secondary">VOLUNTEER</h1>
            <p className="text-xs text-gray-400">Helper Panel • Read-Only</p>
          </div>
          <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/20">
            <ShieldCheck className="text-secondary" size={24} />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="m-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-bold text-blue-500 mb-1">Helper Access</p>
          <p className="text-gray-400">You can verify registrations and distribute kits. You cannot edit data or view revenue.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 border-y border-white/10 overflow-x-auto">
        {[
          { id: 'gate', label: 'Registration Info', icon: ShieldCheck },
          { id: 'lunch', label: 'Lunch Distribution', icon: Utensils },
          { id: 'venue', label: 'Venue Guide', icon: MapPin }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              stopScanning();
            }}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'text-secondary border-b-2 border-secondary'
                : 'text-gray-400'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* GATE PASS SCANNER */}
          {activeTab === 'gate' && (
            <motion.div
              key="gate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-[2.5rem] p-8 text-center">
                <ShieldCheck className="mx-auto text-green-500 mb-4" size={56} />
                <h3 className="text-2xl font-bold mb-2">Student Registration Scanner</h3>
                <p className="text-gray-400 mb-1">View Student's Paid Events Only</p>
                <p className="text-sm text-gray-500">Shows verified paid registrations with team details</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                {!scanning ? (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-secondary/10 rounded-[2rem] flex items-center justify-center border-4 border-secondary/20">
                      <Camera className="text-secondary" size={64} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">Ready to Scan</h3>
                      <p className="text-gray-400">Scan student's QR code to view paid events & teams</p>
                    </div>
                    <button
                      onClick={() => startScanning('gate')}
                      className="w-full py-5 bg-secondary text-white font-bold text-lg rounded-2xl hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-3"
                    >
                      <Camera size={24} />
                      Start Registration Scanner
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cameraError ? (
                      <div className="p-6 bg-red-900/20 border border-red-500/20 rounded-2xl text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-400 mb-4">{cameraError}</p>
                        <button
                          onClick={() => startScanning('gate')}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                          Retry Camera
                        </button>
                      </div>
                    ) : (
                      <div 
                        id="volunteer-qr-reader" 
                        className="rounded-2xl overflow-hidden"
                      />
                    )}
                    <button
                      onClick={stopScanning}
                      className="w-full py-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <X size={20} />
                      Stop Scanner
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* LUNCH DISTRIBUTION */}
          {activeTab === 'lunch' && (
            <motion.div
              key="lunch"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-[2.5rem] p-8 text-center">
                <Utensils className="mx-auto text-green-500 mb-4" size={56} />
                <h3 className="text-2xl font-bold mb-2">Lunch Distribution</h3>
                <p className="text-gray-400">Scan QR to deliver lunch • Track daily distribution</p>
              </div>

              {/* Auto-Detected Day Display */}
              <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Auto-Detected Event Day</p>
                      <p className="text-2xl font-bold text-green-500">
                        {currentDay.replace('day', 'Day ')} - {EVENT_DATES[currentDay].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="text-green-500" size={32} />
                </div>
              </div>

              {/* Scanner Section - LARGER */}
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6">
                {(!scanning || scanMode !== 'lunch') ? (
                  <div className="space-y-6">
                    <div className="w-40 h-40 mx-auto bg-green-500/10 rounded-[2rem] flex items-center justify-center border-4 border-green-500/20">
                      <Camera className="text-green-500" size={80} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-3">Ready to Deliver Lunch</h3>
                      <p className="text-lg text-gray-400 mb-2">
                        Delivering for Today:
                      </p>
                      <p className="text-2xl font-bold text-green-500">
                        {currentDay.replace('day', 'Day ')}
                      </p>
                    </div>
                    <button
                      onClick={() => startScanning('lunch')}
                      disabled={submitting}
                      className="w-full py-6 bg-green-500 text-white font-bold text-xl rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera size={32} />
                      {submitting ? 'Processing...' : 'Start Lunch Scanner'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-400">Scanning for</p>
                      <p className="font-bold text-green-500 text-xl">
                        🍱 Lunch - {currentDay.replace('day', 'Day ')}
                      </p>
                    </div>
                    {cameraError ? (
                      <div className="p-6 bg-red-900/20 border border-red-500/20 rounded-2xl text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-400 mb-4">{cameraError}</p>
                        <button
                          onClick={() => startScanning('lunch')}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                          Retry Camera
                        </button>
                      </div>
                    ) : (
                      <div 
                        id="volunteer-qr-reader" 
                        className="rounded-2xl overflow-hidden bg-black relative"
                        style={{ 
                          width: '100%',
                          minHeight: '500px',
                        }}
                      />
                    )}
                    <button
                      onClick={stopScanning}
                      className="w-full py-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-lg"
                    >
                      <X size={24} />
                      Stop Scanner
                    </button>
                  </div>
                )}
              </div>

              {/* Food Tracking Table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="text-green-500">📊</span> Lunch Distribution Records
                  </h3>
                  <button
                    onClick={fetchFoodRecords}
                    disabled={loadingFoodRecords}
                    className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {loadingFoodRecords ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                {/* Search/Filter */}
                <div className="p-4 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {loadingFoodRecords ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-green-500" size={36} />
                    </div>
                  ) : foodRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <Utensils className="mx-auto text-gray-600 mb-3" size={48} />
                      <p className="text-gray-400">No lunch distribution records yet</p>
                      <p className="text-sm text-gray-500 mt-2">Start scanning to track lunches</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-white/5 text-xs text-gray-400 uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">Student</th>
                          <th className="px-4 py-3 text-center">Day 1</th>
                          <th className="px-4 py-3 text-center">Day 2</th>
                          <th className="px-4 py-3 text-center">Day 3</th>
                          <th className="px-4 py-3 text-center">Total</th>
                          <th className="px-4 py-3 text-left">Last Scanned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {foodRecords
                          .filter(record => {
                            if (!searchTerm) return true;
                            const search = searchTerm.toLowerCase();
                            return (
                              record.profiles?.full_name?.toLowerCase().includes(search) ||
                              record.profiles?.email?.toLowerCase().includes(search) ||
                              record.user_id?.toLowerCase().includes(search)
                            );
                          })
                          .map(record => (
                            <tr key={record.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-bold text-white">{record.profiles?.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-400">{record.profiles?.email || ''}</p>
                                  <p className="text-xs text-gray-500 font-mono">{record.user_id?.substring(0, 8)}...</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {record.day1 ? (
                                  <CheckCircle2 className="text-green-500 inline-block" size={20} />
                                ) : (
                                  <X className="text-gray-600 inline-block" size={20} />
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {record.day2 ? (
                                  <CheckCircle2 className="text-green-500 inline-block" size={20} />
                                ) : (
                                  <X className="text-gray-600 inline-block" size={20} />
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {record.day3 ? (
                                  <CheckCircle2 className="text-green-500 inline-block" size={20} />
                                ) : (
                                  <X className="text-gray-600 inline-block" size={20} />
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold">
                                  {record.total_count}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-400">
                                {record.last_scanned_at 
                                  ? new Date(record.last_scanned_at).toLocaleString('en-IN', {
                                      dateStyle: 'short',
                                      timeStyle: 'short'
                                    })
                                  : '-'
                                }
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* VENUE GUIDE */}
          {activeTab === 'venue' && (
            <motion.div
              key="venue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-[2.5rem] p-8 text-center">
                <MapPin className="mx-auto text-blue-500 mb-4" size={56} />
                <h3 className="text-2xl font-bold mb-2">Venue Guide</h3>
                <p className="text-gray-400">Help students find their event locations</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search event or building..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              {/* Venue List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-secondary" size={40} />
                </div>
              ) : filteredVenues.length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                  <MapPin className="mx-auto text-gray-600 mb-3" size={48} />
                  <p className="text-gray-400">No venues found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVenues.map(venue => (
                    <div
                      key={venue.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
                          <MapPin className="text-blue-500" size={28} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-1">{venue.venue_name}</h4>
                          <div className="space-y-1 text-sm text-gray-400">
                            <p className="text-secondary font-bold">{venue.event_key}</p>
                            <p className="flex items-center gap-2">
                              <span>Building: {venue.building}</span>
                              {venue.floor && <span>• Floor {venue.floor}</span>}
                            </p>
                            <p className="font-bold text-white">Room {venue.room_number}</p>
                            {venue.capacity && (
                              <p className="text-xs">Capacity: {venue.capacity} seats</p>
                            )}
                            {venue.notes && (
                              <p className="text-xs mt-2 text-gray-500 italic">{venue.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Confirmation Modal for Lunch */}
        <AnimatePresence>
          {showUserConfirm && scannedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowUserConfirm(false);
                setScannedUser(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-gray-900 border border-green-500/30 rounded-3xl overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 p-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                      <Utensils className="text-white" size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white truncate">
                        {scannedUser.full_name}
                      </h3>
                      {scannedUser.department && (
                        <p className="text-sm text-gray-400 truncate">
                          {scannedUser.department}
                        </p>
                      )}
                      {scannedUser.roll_number && (
                        <p className="text-xs text-gray-500">
                          Roll: {scannedUser.roll_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-400 mb-1">Delivering Lunch For</p>
                    <p className="text-2xl font-bold text-green-500">
                      {currentDay.replace('day', 'Day ')} - {EVENT_DATES[currentDay].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  {scannedUser.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail size={16} />
                      <span className="truncate">{scannedUser.email}</span>
                    </div>
                  )}
                  
                  {scannedUser.mobile_number && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone size={16} />
                      <span>{scannedUser.mobile_number}</span>
                    </div>
                  )}
                  
                  {scannedUser.college_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Building size={16} />
                      <span className="truncate">{scannedUser.college_name}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 space-y-2">
                  <button
                    onClick={confirmLunchDelivery}
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Confirm Lunch Delivery
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetLunchScanner}
                    disabled={submitting}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivery Result Modal */}
        <AnimatePresence>
          {deliveryResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={resetLunchScanner}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`max-w-md w-full rounded-3xl p-8 text-center space-y-5 ${
                  deliveryResult.status === 'success'
                    ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500'
                    : deliveryResult.status === 'warning'
                    ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-500'
                    : 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500'
                }`}
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex justify-center"
                >
                  {deliveryResult.status === 'success' ? (
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={48} />
                    </div>
                  ) : deliveryResult.status === 'warning' ? (
                    <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="text-white" size={48} />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="text-white" size={48} />
                    </div>
                  )}
                </motion.div>

                {/* Message */}
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {deliveryResult.message}
                  </h3>
                  <p className="text-lg text-gray-300">
                    {deliveryResult.subtitle}
                  </p>
                  {deliveryResult.userName && (
                    <p className="text-xl font-bold text-white mt-3">
                      {deliveryResult.userName}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={resetLunchScanner}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    deliveryResult.status === 'success'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : deliveryResult.status === 'warning'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {deliveryResult.status === 'success' ? 'Scan Next' : 'Try Again'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
