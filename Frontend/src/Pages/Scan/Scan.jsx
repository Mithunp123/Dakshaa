import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../supabase';
import { CheckCircle, XCircle, Camera, RefreshCw } from 'lucide-react';
import {
  checkCameraSupport,
  getCameraErrorMessage,
  getCameraConfig,
  selectBestCamera,
  requestCameraPermission,
  vibrate
} from '../../utils/scannerConfig';

const Scan = () => {
  const [data, setData] = useState('No result');
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraId, setCameraId] = useState(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    getCameras();
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (cameraId && scanning) {
      startScanner();
    }
  }, [cameraId, scanning]);

  const getCameras = async () => {
    const support = checkCameraSupport();
    if (!support.isSecureContext) {
      const error = getCameraErrorMessage({ message: 'HTTPS required' });
      setCameraError(error.message);
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
        const error = getCameraErrorMessage({ message: 'No cameras found' });
        setCameraError(error.message);
        return;
      }

      const bestCameraId = selectBestCamera(devices);
      setCameraId(bestCameraId);
      setScanning(true);
    } catch (error) {
      console.error("Error getting cameras:", error);
      const errorInfo = getCameraErrorMessage(error);
      setCameraError(errorInfo.message);
    }
  };

  const startScanner = async () => {
    try {
      setCameraError(null);
      
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader", {
          verbose: false
        });
      }

      const support = checkCameraSupport();
      const config = getCameraConfig(support.isMobile);

      // Force back camera on mobile devices
      const isMobileDevice = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const cameraConfig = cameraId 
        ? cameraId 
        : isMobileDevice
          ? { facingMode: { exact: "environment" } }
          : { facingMode: "user" };

      await html5QrCodeRef.current.start(
        cameraConfig,
        config,
        onScanSuccess,
        () => {} // Silent error handler
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      const errorInfo = getCameraErrorMessage(error);
      setCameraError(errorInfo.message);
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
  };

  const onScanSuccess = async (decodedText) => {
    vibrate(100);
    setData(decodedText);
    setScanning(false);
    await stopScanner();
    validateTicket(decodedText);
  };

  const validateTicket = async (qrString) => {
    setStatus('loading');
    try {
      // Format: userId-eventId-timestamp
      const [userId, eventId] = qrString.split('-');
      
      const { data: registration, error } = await supabase
        .from('registrations')
        .select('*, events(title)')
        .eq('qr_code_string', qrString)
        .single();

      if (error || !registration) {
        setStatus('error');
        setMessage('Invalid Ticket or Registration not found.');
        return;
      }

      // Here you could also check if the current user (coordinator) 
      // is authorized for this specific eventId
      
      setStatus('success');
      setMessage(`Valid Ticket for ${registration.events.title}`);
    } catch (err) {
      setStatus('error');
      setMessage('Error validating ticket.');
    }
  };

  const resetScanner = () => {
    setStatus('idle');
    setData('No result');
    setMessage('');
    setCameraError(null);
    startScanner();
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Camera className="text-blue-500" /> Coordinator Scanner
      </h1>

      <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden border-4 border-gray-800 relative">
        {cameraError ? (
          <div className="w-full p-8 text-center bg-red-900/20">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-400">{cameraError}</p>
            <button 
              onClick={getCameras}
              className="mt-4 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : scanning ? (
          <div id="qr-reader" className="w-full"></div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {status === 'success' && (
              <>
                <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-green-500">Access Granted</h2>
                <p className="mt-2 text-gray-300">{message}</p>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-20 h-20 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
                <p className="mt-2 text-gray-300">{message}</p>
              </>
            )}
            <button 
              onClick={resetScanner}
              className="mt-8 px-6 py-2 bg-blue-600 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"
            >
              <RefreshCw className="w-5 h-5" /> Scan Next
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-gray-400 text-sm">
        Point the camera at the student's QR code
      </div>
    </div>
  );
};

export default Scan;
