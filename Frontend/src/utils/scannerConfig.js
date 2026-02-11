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
      fps: 10, // Lower FPS allows more time for focus and processing per frame
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0, 
      disableFlip: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      // Use back camera by default on mobile
      facingMode: { ideal: "environment" },
      focusMode: "continuous" // Attempt to force continuous focus
    };
  }
  
  // Desktop gets higher quality settings
  return {
    fps: 15, // Optimal for desktop
    qrbox: { width: 300, height: 300 },
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
  
  console.log('📷 Available cameras:', cameras.map(c => ({ id: c.id, label: c.label })));
  
  if (isMobile) {
    // On mobile, ALWAYS prefer back/rear/environment camera
    // Check various label patterns used by different devices
    const backCamera = cameras.find(d => {
      const label = d.label.toLowerCase();
      return label.includes('back') || 
             label.includes('rear') ||
             label.includes('environment') ||
             label.includes('facing back') ||
             label.includes('camera 0') ||  // Some devices use "camera 0" for back
             label.includes('camera2') ||   // Some Android devices
             (label.includes('0,') && !label.includes('front')); // Pattern like "0, facing back"
    });
    
    if (backCamera) {
      console.log('✅ Mobile detected - using back camera:', backCamera.label);
      return backCamera.id;
    }
    
    // If no back camera found by label, try to avoid front camera
    const nonFrontCamera = cameras.find(d => {
      const label = d.label.toLowerCase();
      return !label.includes('front') && !label.includes('user') && !label.includes('selfie');
    });
    
    if (nonFrontCamera) {
      console.log('✅ Mobile - using non-front camera:', nonFrontCamera.label);
      return nonFrontCamera.id;
    }
    
    // If multiple cameras and none identified, use last one (often back camera on mobile)
    if (cameras.length > 1) {
      console.log('⚠️ Using last camera (likely back):', cameras[cameras.length - 1].label);
      return cameras[cameras.length - 1].id;
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
    let stream = null;
    
    if (isMobile) {
      // On mobile, explicitly request BACK camera with exact constraint
      try {
        // First try exact constraint (forces back camera)
        console.log('📱 Requesting back camera permission (exact)...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } }
        });
        console.log('✅ Back camera permission granted');
      } catch (exactError) {
        // If exact fails, try ideal as fallback
        console.log('⚠️ Exact back camera failed, trying ideal...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        });
      }
    } else {
      // Desktop - any camera is fine
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    }
    
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
