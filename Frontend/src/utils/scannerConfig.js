/**
 * Unified Scanner Configuration Utility
 * Handles cross-platform camera access and QR scanning
 */

/**
 * Check if camera access is supported in current environment
 */
export const checkCameraSupport = () => {
  const checks = {
    isSecureContext: window.isSecureContext || 
      window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168') ||
      window.location.hostname.includes('10.0'),
    hasMediaDevices: !!navigator.mediaDevices,
    hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
    isAndroid: /Android/i.test(navigator.userAgent)
  };

  return checks;
};

/**
 * Get user-friendly error message based on error type
 */
export const getCameraErrorMessage = (error) => {
  if (!error) return '';
  
  const errorName = error.name || '';
  const errorMessage = error.message || '';
  
  // Permission errors
  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    return {
      title: 'Camera Permission Denied',
      message: 'Please allow camera access in your browser settings and reload the page.',
      canRetry: true,
      showManualEntry: true
    };
  }
  
  // No camera found
  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return {
      title: 'No Camera Found',
      message: 'Please connect a camera or use manual ID entry below.',
      canRetry: false,
      showManualEntry: true
    };
  }
  
  // Camera in use
  if (errorName === 'NotReadableError' || errorName === 'TrackStartError' || errorName === 'AbortError') {
    return {
      title: 'Camera Busy',
      message: 'Camera is in use by another application. Close other apps and try again.',
      canRetry: true,
      showManualEntry: true
    };
  }
  
  // Unsupported constraints
  if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
    return {
      title: 'Camera Incompatible',
      message: 'Your camera doesn\'t support the required settings. Try a different camera.',
      canRetry: true,
      showManualEntry: true
    };
  }
  
  // HTTPS required
  if (!window.isSecureContext || errorMessage.includes('secure') || errorMessage.includes('HTTPS')) {
    return {
      title: 'HTTPS Required',
      message: 'Camera access requires HTTPS connection. Use manual ID entry or access via HTTPS.',
      canRetry: false,
      showManualEntry: true
    };
  }
  
  // Generic error
  return {
    title: 'Camera Error',
    message: errorMessage || 'Failed to access camera. Please try manual ID entry.',
    canRetry: true,
    showManualEntry: true
  };
};

/**
 * Get optimal camera configuration for current device
 */
export const getCameraConfig = (isMobile = false) => {
  // Mobile devices get optimized settings
  if (isMobile) {
    return {
      fps: 15,
      qrbox: { width: 220, height: 220 },
      aspectRatio: 1.0,
      disableFlip: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      // Use back camera by default on mobile
      facingMode: { ideal: "environment" }
    };
  }
  
  // Desktop gets higher quality settings
  return {
    fps: 20,
    qrbox: { width: 280, height: 280 },
    aspectRatio: 1.0,
    disableFlip: false,
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    }
  };
};

/**
 * Select best camera from available devices
 * ALWAYS prefers back camera on mobile devices (regardless of viewport/desktop mode)
 */
export const selectBestCamera = (cameras) => {
  if (!cameras || cameras.length === 0) return null;
  
  // Detect if device is mobile (check userAgent, NOT screen size)
  const isMobile = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // On mobile, ALWAYS prefer back/rear/environment camera
    // This works even if user switches to desktop viewport
    const backCamera = cameras.find(d => 
      d.label.toLowerCase().includes('back') || 
      d.label.toLowerCase().includes('rear') ||
      d.label.toLowerCase().includes('environment') ||
      d.label.toLowerCase().includes('facing back')
    );
    
    if (backCamera) {
      console.log('✅ Mobile detected - using back camera:', backCamera.label);
      return backCamera.id;
    }
    
    console.warn('⚠️ Back camera not found on mobile, using first available');
  }
  
  // Default to first available camera (desktop or fallback)
  return cameras[0]?.id || null;
};

/**
 * Request camera permission with retry logic
 * Always requests back camera on mobile devices
 */
export const requestCameraPermission = async (retryCount = 0) => {
  const MAX_RETRIES = 2;
  const isMobile = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  try {
    // Request permission - force back camera on mobile
    const constraints = isMobile 
      ? { video: { facingMode: { ideal: "environment" } } }
      : { video: true };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Stop stream immediately (we just needed permission)
    stream.getTracks().forEach(track => track.stop());
    
    return { success: true };
  } catch (error) {
    if (retryCount < MAX_RETRIES && error.name === 'NotReadableError') {
      // Camera might be busy, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return requestCameraPermission(retryCount + 1);
    }
    
    return { 
      success: false, 
      error: getCameraErrorMessage(error) 
    };
  }
};

/**
 * Vibrate device on scan (mobile)
 */
export const vibrate = (duration = 100) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

/**
 * Play audio feedback
 */
export const playSound = (type = 'success') => {
  try {
    const audio = new Audio(type === 'success' ? '/success.mp3' : '/error.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {}); // Ignore autoplay restrictions
  } catch (error) {
    console.log('Audio playback not available');
  }
};
