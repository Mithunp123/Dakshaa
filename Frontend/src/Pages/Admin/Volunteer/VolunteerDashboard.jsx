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
import { Html5QrcodeScanner } from 'html5-qrcode';

const VolunteerDashboard = () => {
  const [activeTab, setActiveTab] = useState('gate');
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const scannerRef = useRef(null);
  const html5QrCodeScannerRef = useRef(null);

  const kitTypes = [
    { id: 'welcome_kit', label: 'Welcome Kit', icon: Gift, color: 'purple' },
    { id: 'lunch', label: 'Lunch', icon: Utensils, color: 'green' },
    { id: 'snacks', label: 'Snacks', icon: Coffee, color: 'orange' },
    { id: 'merchandise', label: 'Merchandise', icon: Package, color: 'blue' }
  ];

  const [selectedKitType, setSelectedKitType] = useState('welcome_kit');

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('event_venues')
        .select('*, events(event_id)');

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const startScanning = (mode) => {
    setScanning(mode);

    setTimeout(() => {
      if (scannerRef.current && !html5QrCodeScannerRef.current) {
        try {
          const scanner = new Html5QrcodeScanner(
            "volunteer-qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
          );

          scanner.render(
            (decodedText) => onScanSuccess(decodedText, mode),
            onScanError
          );
          html5QrCodeScannerRef.current = scanner;
        } catch (error) {
          console.error('Scanner error:', error);
          alert('Camera access failed. Please allow camera permissions.');
          setScanning(false);
        }
      }
    }, 100);
  };

  const stopScanning = () => {
    if (html5QrCodeScannerRef.current) {
      html5QrCodeScannerRef.current.clear();
      html5QrCodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText, mode) => {
    console.log('QR Scanned:', decodedText);
    stopScanning();

    if (mode === 'gate') {
      await verifyGatePass(decodedText);
    } else if (mode === 'kit') {
      await deliverKit(decodedText);
    }
  };

  const onScanError = (error) => {
    // Silent error handling
  };

  const verifyGatePass = async (userId) => {
    try {
      setSubmitting(true);

      // Check if user exists and has valid registration
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, registrations(*, events(*))')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        playBuzzSound();
        showFailureNotification('INVALID QR CODE', 'User not found');
        return;
      }

      // Check if user has at least one completed registration
      const hasValidRegistration = profile.registrations?.some(
        r => r.payment_status === 'completed'
      );

      if (!hasValidRegistration) {
        playBuzzSound();
        showFailureNotification('PAYMENT NOT VERIFIED', 'No valid registration found');
        return;
      }

      // Valid!
      playTingSound();
      showSuccessNotification(
        'VALID REGISTRATION',
        profile.full_name,
        profile.college_name
      );
    } catch (error) {
      console.error('Error verifying gate pass:', error);
      playBuzzSound();
      showFailureNotification('ERROR', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deliverKit = async (userId) => {
    try {
      setSubmitting(true);
      const { data: { user: volunteer } } = await supabase.auth.getUser();

      // Check if user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
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
    v.events?.event_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          { id: 'gate', label: 'Gate Pass', icon: ShieldCheck },
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
                <h3 className="text-2xl font-bold mb-2">Global Gate Pass Scanner</h3>
                <p className="text-gray-400 mb-1">Main Gate / Fest Area Entry</p>
                <p className="text-sm text-gray-500">Verifies if student is registered</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                {!scanning ? (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-secondary/10 rounded-[2rem] flex items-center justify-center border-4 border-secondary/20">
                      <Camera className="text-secondary" size={64} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">Ready to Verify</h3>
                      <p className="text-gray-400">Scan student's QR code to check registration</p>
                    </div>
                    <button
                      onClick={() => startScanning('gate')}
                      className="w-full py-5 bg-secondary text-white font-bold text-lg rounded-2xl hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-3"
                    >
                      <Camera size={24} />
                      Start Gate Scanner
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div 
                      id="volunteer-qr-reader" 
                      ref={scannerRef}
                      className="rounded-2xl overflow-hidden"
                    />
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
                {scanning !== 'kit' ? (
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
                    <div 
                      id="volunteer-qr-reader" 
                      ref={scannerRef}
                      className="rounded-2xl overflow-hidden"
                    />
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
                          <h4 className="font-bold text-lg mb-1">{venue.events?.event_id}</h4>
                          <div className="space-y-1 text-sm text-gray-400">
                            <p className="flex items-center gap-2">
                              <span className="text-secondary font-bold">{venue.building}</span>
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
