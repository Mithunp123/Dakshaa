# 📱 Mobile Scanner Debug Guide

## How to View Scanner Errors on Mobile

When the scanner doesn't work on mobile devices, the app now shows comprehensive error messages and logging.

### ✅ Enhanced Error Display (NEW)

The scanner now shows errors with:
- **🔴 Large, prominent error messages** (red background, bigger text)
- **📋 Detailed error information** (black box with amber text)
- **🔧 Troubleshooting guide** (blue box with checklist)
- **🔄 Retry button** (green button to try again)
- **📋 Copy Error button** (blue button to copy all error details)
- **⌨️ Manual Entry fallback** (gradient button if camera fails)

### 📊 Console Logging

The scanner logs detailed information to browser console:

#### On Component Mount:
```
🏁 AttendanceScanner mounted
🌐 Current URL: https://...
🔒 Is Secure Context: true/false
```

#### During Camera Initialization:
```
📱 Device Info: { userAgent, platform, vendor }
🔍 Camera Support Check: { isSecureContext, hasMediaDevices, isMobile, ... }
📸 Requesting camera permission...
🔑 Permission result: { success: true/false, error: ... }
🔎 Getting available cameras...
📹 Found cameras: [{ id, label }, ...]
✅ Selected camera ID: camera-id-here
✅ Camera initialization successful
```

#### When Starting Scanner:
```
🚀 Starting scanner...
📦 Creating Html5Qrcode instance
📸 Scanner configuration: { isMobile, cameraId, cameraConfig, qrConfig }
⏳ Starting camera...
✅ Scanner started successfully!
```

#### On Errors:
```
🔥 SCANNER ERROR: { name, message, stack }
💬 User-friendly error: "message here"
```

### 🔧 How to Check Console on Mobile Devices

#### Android Chrome:
1. Connect device to computer via USB
2. Enable "USB Debugging" in Developer Options
3. Open Chrome on computer → `chrome://inspect`
4. Select your device → Click "Inspect"
5. Console tab shows all logs

#### iOS Safari:
1. Enable "Web Inspector" on iPhone:
   - Settings → Safari → Advanced → Web Inspector
2. Connect iPhone to Mac via USB
3. Open Safari on Mac → Develop menu → Select iPhone
4. Choose the webpage → Console shows logs

#### Remote Debugging Alternative:
Use **eruda** (mobile console):
Add this to `index.html` temporarily:
```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

### 🎯 Common Error Messages & Fixes

| Error Message | Cause | Fix |
|--------------|-------|-----|
| **"🔒 HTTPS required"** | Not using secure connection | Use `https://` URL or `localhost` |
| **"🚫 Camera permission denied"** | User blocked camera access | Allow permission in browser settings |
| **"📷 No cameras detected"** | No camera on device | Check hardware, try external camera |
| **"📵 Camera API not available"** | Old browser version | Update Chrome/Safari |
| **"OverconstrainedError"** | Back camera not available | Will fallback to front camera (being fixed) |
| **"NotReadableError"** | Camera in use by another app | Close other camera apps |

### 🐛 Debugging Steps

1. **Open browser console** (methods above)
2. **Click "Start Camera"** on scanner page
3. **Check console for logs**:
   - ✅ If shows "Camera initialization successful" → Camera works, check QR code
   - ❌ If shows "SCANNER ERROR" → Read error message
   - ⚠️ If shows "Permission denied" → Grant camera permission

4. **Use "Copy Error" button**:
   - Click the blue "Copy Error" button on error screen
   - Paste into notepad/message
   - Includes: Device info, browser, URL, secure context, exact error

5. **Try "Retry Camera" button**:
   - Resets scanner state
   - Requests permission again
   - May fix temporary issues

### 📝 Error Report Template

When reporting mobile scanner issues, copy this and fill in:

```
**Device**: (e.g., iPhone 14, Samsung Galaxy S21)
**Browser**: (e.g., Safari 17, Chrome 120)
**OS Version**: (e.g., iOS 17.2, Android 13)
**URL**: (https://... or http://...)
**Secure Context**: (true/false from console)
**Error Message**: (copy from red error box)
**Console Logs**: (paste relevant logs)
**Camera Permission**: (Granted/Denied/Not Asked)
```

### 🔍 Technical Details

#### Camera Selection Logic:
1. **Check if mobile device** via userAgent:
   - `/iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i`
2. **On mobile**: Force back camera with `{ facingMode: { exact: "environment" } }`
3. **On desktop**: Use front camera `{ facingMode: "user" }`
4. **If specific camera selected**: Use that camera ID

#### Error Handling Flow:
```
getCameras()
  → Check secure context (HTTPS)
  → Check camera API availability
  → Request permission (with retry)
  → Enumerate cameras
  → Select best camera
  → Set cameraError if any fail

startScanner()
  → Create Html5Qrcode instance
  → Configure camera (mobile vs desktop)
  → Start camera with config
  → Set cameraError if fails
```

### 🚀 Next Steps

If scanner still fails after checking above:
1. **Copy error details** using "Copy Error" button
2. **Take screenshot** of error display
3. **Share console logs** (from remote debugging)
4. **Test on different browser** (Chrome vs Safari)
5. **Check network** (ensure HTTPS works)

### ⚡ Quick Fixes

**Camera permission issues**:
- Android Chrome: Site settings → Clear & reset
- iOS Safari: Settings → Safari → Camera → Ask

**HTTPS issues**:
- Use ngrok/cloudflare tunnel for local testing
- Deploy to Firebase/Vercel for production

**Camera in use**:
- Restart browser
- Close other tabs with camera
- Restart device

---

**Last Updated**: 2025-01-25  
**Added**: Enhanced error display, console logging, copy error button
