import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  Package, 
  MapPin, 
  Search, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Loader2,
  Coffee,
  Gift,
  Utensils,
  ShieldCheck,
  Info
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
  
  const html5QrCodeRef = useRef(null);

  const kitTypes = [
    { id: 'welcome_kit', label: 'Welcome Kit', icon: Gift, color: 'purple' },
    { id: 'lunch', label: 'Lunch', icon: Utensils, color: 'green' },
    { id: 'snacks', label: 'Snacks', icon: Coffee, color: 'orange' },
    { id: 'merchandise', label: 'Merchandise', icon: Package, color: 'blue' }
  ];

  const [selectedKitType, setSelectedKitType] = useState('welcome_kit');

  useEffect(() => {
    fetchVenues();
    getCameras(); // Request camera permission on mount
    
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
    console.log('QR Scanned:', decodedText);
    vibrate(100);
    await stopScanning();

    if (mode === 'gate') {
      await verifyGatePass(decodedText);
    } else if (mode === 'kit') {
      await deliverKit(decodedText);
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
      let allRegistrations = null;
      
      // Strategy 1: PRIMARY - Try as registration_id (DAK26-XXXX format)
      // This is the main flow for volunteers verifying gate passes
      console.log('🔍 PRIMARY: Trying as registration_id:', registrationCode);
      
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select(`
          *,
          profiles!registrations_user_id_fkey(*),
          events(*)
        `)
        .eq('registration_id', registrationCode)
        .single();

      if (!regError && registration) {
        profile = registration.profiles;
        console.log('✅ Found registration:', registration.registration_id);
        console.log('   Payment Status:', registration.payment_status);
        console.log('   Event:', registration.events?.event_name);
        
        // Get all registrations for this user to show complete picture
        const { data: regs } = await supabase
          .from('registrations')
          .select('*, events(*)')
          .eq('user_id', registration.user_id);
          
        allRegistrations = regs || [registration];
      }
      
      // Strategy 2: FALLBACK - If UUID format, treat as user_id
      if (!profile && isUUID) {
        console.log('🔍 FALLBACK: Trying as user ID (UUID):', cleanedContent);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cleanedContent)
          .single();
          
        if (!profileError && profileData) {
          profile = profileData;
          console.log('✅ Found profile by user ID:', profile.full_name);
          
          // Get all registrations for this user
          const { data: regs } = await supabase
            .from('registrations')
            .select('*, events(*)')
            .eq('user_id', cleanedContent);
            
          allRegistrations = regs || [];
        }
      }
      
      // Strategy 3: Final attempt - try as user_id for non-UUID formats
      if (!profile) {
        console.log('🔍 Final attempt - trying as user_id:', cleanedContent);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cleanedContent)
          .single();
          
        if (!profileError && profileData) {
          profile = profileData;
          console.log('✅ Found profile on final attempt:', profile.full_name);
          
          const { data: regs } = await supabase
            .from('registrations')
            .select('*, events(*)')
            .eq('user_id', cleanedContent);
            
          allRegistrations = regs || [];
        }
      }
      
      // If still no profile found, show error
      if (!profile) {
        console.error('❌ No profile found for QR:', qrContent);
        playBuzzSound();
        showFailureNotification('INVALID QR CODE', 'User or registration not found');
        return;
      }
      
      // Show all registered events for this user
      playTingSound();
      showRegisteredEvents(profile, allRegistrations || []);
      
    } catch (error) {
      console.error('Error verifying gate pass:', error);
      playBuzzSound();
      showFailureNotification('ERROR', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deliverKit = async (qrContent) => {
    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const volunteer = session?.user;

      console.log('Kit QR Content:', qrContent);
      
      // Clean the QR content
      const cleanedContent = qrContent.trim();
      
      // Check if it's a UUID format (user ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(cleanedContent);
      
      // Parse QR code content for multi-line format
      let registrationCode = cleanedContent;
      if (cleanedContent.includes('\n')) {
        const lines = cleanedContent.split('\n');
        registrationCode = lines[1]?.trim() || lines[0]?.trim();
      }
      
      console.log('Is UUID:', isUUID, 'Registration Code:', registrationCode);
      
      let userId = null;
      let profile = null;
      
      // Strategy 1: If UUID format, use as user_id directly
      if (isUUID) {
        console.log('🔍 Trying as user ID (UUID):', cleanedContent);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cleanedContent)
          .single();
          
        if (!profileError && profileData) {
          userId = cleanedContent;
          profile = profileData;
          console.log('✅ Found profile by user ID:', profile.full_name);
        }
      }
      
      // Strategy 2: Try as registration_id
      if (!userId) {
        console.log('🔍 Trying as registration_id:', registrationCode);
        
        const { data: registration, error: regError } = await supabase
          .from('registrations')
          .select(`*, profiles!registrations_user_id_fkey(*)`)
          .eq('registration_id', registrationCode)
          .single();

        if (!regError && registration) {
          userId = registration.user_id;
          profile = registration.profiles;
          console.log('✅ Found via registration_id, user:', profile?.full_name);
        }
      }
      
      // Strategy 3: Final attempt - try as user_id
      if (!userId) {
        console.log('🔍 Final attempt - trying as user_id:', cleanedContent);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cleanedContent)
          .single();
          
        if (!profileError && profileData) {
          userId = cleanedContent;
          profile = profileData;
          console.log('✅ Found on final attempt:', profile.full_name);
        }
      }

      if (!userId || !profile) {
        console.error('❌ User not found for QR:', qrContent);
        playBuzzSound();
        showFailureNotification('INVALID QR CODE', 'User not found');
        return;
      }

      // Check if kit already delivered
      const { data: existingKit } = await supabase
        .from('kit_distribution')
        .select('*')
        .eq('user_id', userId)
        .eq('kit_type', selectedKitType)
        .single();

      if (existingKit) {
        playBuzzSound();
        showFailureNotification('ALREADY TAKEN', `${selectedKitType.replace('_', ' ')} already delivered`);
        return;
      }

      // Deliver kit
      const { error: kitError } = await supabase
        .from('kit_distribution')
        .insert({
          user_id: userId,
          kit_type: selectedKitType,
          delivered_by: volunteer.id
        });

      if (kitError) throw kitError;

      // Update profile kit_delivered flag
      await supabase
        .from('profiles')
        .update({ kit_delivered: true })
        .eq('id', userId);

      playTingSound();
      showSuccessNotification(
        'KIT DELIVERED',
        profile.full_name,
        selectedKitType.replace('_', ' ').toUpperCase()
      );
    } catch (error) {
      console.error('Error delivering kit:', error);
      playBuzzSound();
      showFailureNotification('ERROR', error.message);
    } finally {
      setSubmitting(false);
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

  const showRegisteredEvents = (profile, registrations) => {
    const notification = document.createElement('div');
    notification.className = 'fixed inset-0 bg-slate-900/95 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto';
    
    // Show only PAID events
    const paidRegistrations = registrations.filter(r => r.payment_status?.toUpperCase() === 'PAID');
    const totalRegistrations = registrations.length;
    const pendingCount = totalRegistrations - paidRegistrations.length;
    
    notification.innerHTML = `
      <div class="bg-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden">
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
          
          <div class="flex justify-center gap-4 text-sm">
            <div class="bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30">
              <span class="text-green-400 font-bold">${paidRegistrations.length}</span>
              <span class="text-gray-300 ml-1">Paid Events</span>
            </div>
            ${pendingCount > 0 ? `
              <div class="bg-gray-500/20 px-3 py-2 rounded-full border border-gray-500/30">
                <span class="text-gray-400 text-xs">${pendingCount} pending</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Paid Events List -->
        <div class="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
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
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-bold text-white text-sm mb-1">${reg.events?.event_name || reg.event_name || 'Event'}</h3>
                  <p class="text-xs text-gray-400 mb-2">${reg.events?.event_type || 'Type: N/A'} • ${reg.events?.category || ''}</p>
                  <p class="text-xs text-gray-500">ID: ${reg.registration_id || reg.id}</p>
                  ${reg.team_name ? `<p class="text-xs text-purple-400 mt-1">Team: ${reg.team_name}</p>` : ''}
                </div>
                <div class="text-right">
                  <span class="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">✓ PAID</span>
                  ${reg.amount ? `<p class="text-xs text-gray-400 mt-1">₹${reg.amount}</p>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Footer -->
        <div class="p-4 border-t border-white/10">
          <button onclick="this.closest('.fixed').remove()" class="w-full py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold rounded-2xl transition-all border border-green-500/20">
            Close • Verified Paid Events
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
          { id: 'kit', label: 'Kit Distribution', icon: Package },
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
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-[2.5rem] p-8 text-center">
                <ShieldCheck className="mx-auto text-green-500 mb-4" size={56} />
                <h3 className="text-2xl font-bold mb-2">Student Registration Scanner</h3>
                <p className="text-gray-400 mb-1">View Student's Paid Events Only</p>
                <p className="text-sm text-gray-500">Shows verified paid registrations for venue access</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                {!scanning ? (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-secondary/10 rounded-[2rem] flex items-center justify-center border-4 border-secondary/20">
                      <Camera className="text-secondary" size={64} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">Ready to Scan</h3>
                      <p className="text-gray-400">Scan student's QR code to verify paid events</p>
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

          {/* KIT DISTRIBUTION */}
          {activeTab === 'kit' && (
            <motion.div
              key="kit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-[2.5rem] p-8 text-center">
                <Package className="mx-auto text-purple-500 mb-4" size={56} />
                <h3 className="text-2xl font-bold mb-2">Kit Distribution</h3>
                <p className="text-gray-400">Track and distribute welcome kits, lunch, etc.</p>
              </div>

              {/* Kit Type Selection */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="font-bold mb-4">Select Kit Type</h4>
                <div className="grid grid-cols-2 gap-3">
                  {kitTypes.map(kit => (
                    <button
                      key={kit.id}
                      onClick={() => setSelectedKitType(kit.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedKitType === kit.id
                          ? `border-${kit.color}-500 bg-${kit.color}-500/10`
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <kit.icon 
                        className={`mx-auto mb-2 ${
                          selectedKitType === kit.id ? `text-${kit.color}-500` : 'text-gray-400'
                        }`} 
                        size={32} 
                      />
                      <p className={`text-sm font-bold ${
                        selectedKitType === kit.id ? `text-${kit.color}-500` : 'text-gray-400'
                      }`}>
                        {kit.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scanner */}
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                {(!scanning || scanMode !== 'kit') ? (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-purple-500/10 rounded-[2rem] flex items-center justify-center border-4 border-purple-500/20">
                      <Camera className="text-purple-500" size={64} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">Ready to Distribute</h3>
                      <p className="text-gray-400">
                        Currently distributing: <span className="text-secondary font-bold">
                          {kitTypes.find(k => k.id === selectedKitType)?.label}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => startScanning('kit')}
                      className="w-full py-5 bg-purple-500 text-white font-bold text-lg rounded-2xl hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3"
                    >
                      <Camera size={24} />
                      Start Kit Scanner
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                      <p className="text-sm text-gray-400">Scanning for</p>
                      <p className="font-bold text-purple-500">
                        {kitTypes.find(k => k.id === selectedKitType)?.label}
                      </p>
                    </div>
                    {cameraError ? (
                      <div className="p-6 bg-red-900/20 border border-red-500/20 rounded-2xl text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-400 mb-4">{cameraError}</p>
                        <button
                          onClick={() => startScanning('kit')}
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
      </div>
    </div>
  );
};

export default VolunteerDashboard;
