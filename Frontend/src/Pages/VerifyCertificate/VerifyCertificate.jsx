import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Camera, 
  RefreshCw,
  User,
  GraduationCap,
  Calendar,
  Award,
  Building,
  QrCode,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '../../supabase';

const VerifyCertificate = () => {
  const [certificateId, setCertificateId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraId, setCameraId] = useState(null);
  const html5QrCodeRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Start scanner when camera is selected
  useEffect(() => {
    if (cameraId && scanning) {
      startScanner();
    }
  }, [cameraId, scanning]);

  const getCameras = async () => {
    try {
      // Check for secure context
      if (!window.isSecureContext) {
        setCameraError('Camera access requires HTTPS. Please use a secure connection.');
        return;
      }

      // On mobile, directly start with back camera using facingMode
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Request camera permission first on mobile
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { ideal: 'environment' } } 
          });
          // Stop the stream as Html5Qrcode will create its own
          stream.getTracks().forEach(track => track.stop());
        } catch (permError) {
          if (permError.name === 'NotAllowedError') {
            setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
          } else if (permError.name === 'NotFoundError') {
            setCameraError('No camera found on this device.');
          } else {
            setCameraError('Could not access camera: ' + (permError.message || 'Permission denied'));
          }
          return;
        }
        
        // For mobile devices, use facingMode constraint directly
        setCameraId('environment'); // Special value to indicate back camera
        setScanning(true);
        setCameraError(null);
        return;
      }

      // Request camera permission for desktop
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (permError) {
        if (permError.name === 'NotAllowedError') {
          setCameraError('Camera permission denied. Please allow camera access.');
        } else if (permError.name === 'NotFoundError') {
          setCameraError('No camera found on this device.');
        } else {
          setCameraError('Could not access camera: ' + (permError.message || 'Unknown error'));
        }
        return;
      }

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError('No cameras found on this device.');
        return;
      }

      // Prefer back camera on mobile
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      const selectedCamera = backCamera || devices[0];
      setCameraId(selectedCamera.id);
      setScanning(true);
      setCameraError(null);
    } catch (error) {
      console.error("Error getting cameras:", error);
      setCameraError('Could not access camera: ' + (error.message || 'Unknown error'));
    }
  };

  const startScanner = async () => {
    try {
      setCameraError(null);
      
      // Wait for DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        setCameraError('Scanner container not ready. Please try again.');
        setScanning(false);
        return;
      }
      
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader", {
          verbose: false
        });
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      // Check if using facingMode for mobile
      if (cameraId === 'environment') {
        // Use facingMode constraint for mobile back camera
        try {
          await html5QrCodeRef.current.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            () => {} // Silent error handler
          );
        } catch (backCamError) {
          console.warn("Back camera failed, trying front camera:", backCamError);
          // Fallback to front camera if back camera fails
          try {
            await html5QrCodeRef.current.start(
              { facingMode: "user" },
              config,
              onScanSuccess,
              () => {}
            );
          } catch (frontCamError) {
            console.error("Both cameras failed:", frontCamError);
            setCameraError('Could not start camera. Please ensure camera permissions are granted and try again.');
            setScanning(false);
          }
        }
      } else {
        // Use camera ID for desktop
        await html5QrCodeRef.current.start(
          cameraId,
          config,
          onScanSuccess,
          () => {} // Silent error handler
        );
      }
    } catch (error) {
      console.error("Error starting scanner:", error);
      setCameraError('Could not start camera: ' + (error.message || 'Please check camera permissions'));
      setScanning(false);
    }
  };

  const stopScanner = async () => {
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
  };

  const onScanSuccess = async (decodedText) => {
    // Stop scanner first
    await stopScanner();
    
    // Extract KSRCT_ID from QR URL
    // QR URL format: https://authenticate.ksrctdigipro.in/?certid=KSRCT0226CTDOSC713
    const ksrctId = extractKsrctIdFromUrl(decodedText);
    
    if (ksrctId) {
      setCertificateId(ksrctId);
      handleSearch(ksrctId);
    } else {
      // Maybe it's just the ID directly
      setCertificateId(decodedText.toUpperCase());
      handleSearch(decodedText.toUpperCase());
    }
  };

  const extractKsrctIdFromUrl = (text) => {
    try {
      // Try to parse as URL
      if (text.includes('certid=')) {
        const url = new URL(text);
        const certId = url.searchParams.get('certid');
        return certId ? certId.toUpperCase() : null;
      }
      // Check if it's a direct KSRCT ID (format: KSRCT0226CTDOSC713 or similar)
      if (text.toUpperCase().startsWith('KSRCT')) {
        return text.toUpperCase();
      }
      return null;
    } catch (e) {
      // If URL parsing fails, check if it contains certid pattern
      const match = text.match(/certid[=:]?\s*([A-Za-z0-9]+)/i);
      if (match) {
        return match[1].toUpperCase();
      }
      // Check direct ID - starts with KSRCT
      if (text.toUpperCase().startsWith('KSRCT')) {
        return text.toUpperCase();
      }
      return null;
    }
  };

  const handleSearch = async (searchId = null) => {
    const idToSearch = searchId || certificateId.trim().toUpperCase();
    if (!idToSearch) return;

    setLoading(true);
    setSearched(true);
    setSearchResult(null);

    try {
      console.log('Searching for certificate ID:', idToSearch);
      
      const { data, error } = await supabase
        .from('certificate_data')
        .select('*')
        .eq('ksrct_id', idToSearch)
        .maybeSingle();

      if (error) {
        console.error('Error fetching certificate:', error);
        setSearchResult(null);
      } else if (data) {
        setSearchResult(data);
      } else {
        setSearchResult(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleScanner = () => {
    if (scanning) {
      stopScanner();
    } else {
      getCameras();
    }
  };

  const resetSearch = () => {
    setCertificateId('');
    setSearchResult(null);
    setSearched(false);
    setCameraError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-24 pb-32 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShieldCheck className="w-8 h-8 text-secondary" />
            <h1 className="text-3xl font-orbitron font-bold text-white">
              Verify Certificate
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Scan the QR code or enter the certificate ID to verify authenticity
          </p>
        </motion.div>

        {/* QR Scanner Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6"
        >
          {/* Scanner Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleScanner}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mb-4 transition-all ${
              scanning 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-gradient-to-r from-secondary to-cyan-500 text-white hover:opacity-90'
            }`}
          >
            {scanning ? (
              <>
                <XCircle className="w-5 h-5" />
                Stop Scanner
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Scan QR Code
              </>
            )}
          </motion.button>

          {/* QR Reader Container */}
          {scanning && (
            <div className="relative mb-4">
              <div 
                id="qr-reader" 
                className="w-full rounded-xl overflow-hidden"
                style={{ minHeight: '300px' }}
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-secondary/50 rounded-xl animate-pulse" />
              </div>
            </div>
          )}

          {/* Camera Error */}
          {cameraError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Manual Search */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Certificate ID (e.g., KSRCT0226CTDOSC713)"
                className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20 font-mono uppercase"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSearch()}
              disabled={loading || !certificateId.trim()}
              className="px-5 py-3 bg-gradient-to-r from-secondary to-cyan-500 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Results */}
        {searched && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {searchResult ? (
              <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20">
                {/* Success Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-xl font-orbitron text-emerald-400 mb-2">
                    Certificate Verified!
                  </h3>
                  <p className="text-gray-400 text-sm">
                    This certificate is authentic and valid
                  </p>
                </div>

                {/* Certificate Details */}
                <div className="space-y-4">
                  {/* Certificate ID */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/20 rounded-lg">
                        <QrCode className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Certificate ID</p>
                        <p className="text-white font-mono font-semibold">{searchResult.ksrct_id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Participant Name */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Participant Name</p>
                        <p className="text-white font-semibold">{searchResult.full_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Event Name */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Award className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Event</p>
                        <p className="text-white font-semibold">{searchResult.event_name}</p>
                        {searchResult.event_type && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                            {searchResult.event_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* College/Institution */}
                  {searchResult.college_name && (
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <Building className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">Institution</p>
                          <p className="text-white font-semibold">{searchResult.college_name}</p>
                          {(searchResult.department || searchResult.year_of_study) && (
                            <p className="text-gray-400 text-sm mt-1">
                              {[searchResult.department, searchResult.year_of_study].filter(Boolean).join(' - ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event Date */}
                  {searchResult.event_date && (
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                          <Calendar className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">Event Date</p>
                          <p className="text-white font-semibold">{searchResult.event_date}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetSearch}
                  className="w-full mt-6 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-700/70 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Verify Another Certificate
                </motion.button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4"
                  >
                    <XCircle className="w-8 h-8 text-red-400" />
                  </motion.div>
                  <h3 className="text-xl font-orbitron text-red-400 mb-2">
                    Certificate Not Found
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    No certificate found with ID: <span className="text-white font-mono">{certificateId}</span>
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    Please check the ID and try again, or scan the QR code directly from the certificate.
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetSearch}
                    className="w-full py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-700/70 transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-orbitron font-semibold text-white">
              How to Verify
            </h3>
          </div>
          
          <div className="space-y-4 text-sm text-gray-300">
            <div className="flex gap-3">
              <span className="text-secondary font-bold min-w-[24px]">1.</span>
              <p>
                <span className="font-semibold text-white">Scan QR Code:</span> Use the scanner to scan the QR code on the certificate
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="text-secondary font-bold min-w-[24px]">2.</span>
              <p>
                <span className="font-semibold text-white">Manual Entry:</span> Or enter the Certificate ID (e.g., KSRCT0226CTDOSC713) manually
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="text-secondary font-bold min-w-[24px]">3.</span>
              <p>
                <span className="font-semibold text-white">View Details:</span> If valid, you'll see the participant's name, event, and other details
              </p>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4 mt-4 border border-secondary/20">
              <p className="text-xs text-gray-400 mb-2">Note:</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  <span>Only certificates issued through <span className="text-secondary font-bold">DakshaaT26</span> can be verified</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  <span>Certificate ID format: <span className="text-white font-mono">KSRCT0226CTDOSXXXX</span></span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
