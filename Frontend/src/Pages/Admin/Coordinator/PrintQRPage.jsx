import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../../supabase";
import { toast } from "react-hot-toast";
import { Camera, Printer, RefreshCw, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrintQRPage = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [paidEvents, setPaidEvents] = useState([]);
  const [scanError, setScanError] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const scannerRef = useRef(null);
  const [cameraId, setCameraId] = useState(null);

  const isProcessingRef = useRef(false);

  // Auto-print effect
  useEffect(() => {
    let timer;
    if (!scanning && !loading && userData) {
       // Wait for render, then use iframe print
       timer = setTimeout(() => {
           handlePrint();
       }, 500);
    }
    return () => clearTimeout(timer);
  }, [scanning, loading, userData]);

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      // Cleanup previous instance if exists to be safe
      if (scannerRef.current) {
        try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
        } catch (e) {
            console.log("Cleanup error", e);
        }
        scannerRef.current = null;
      }

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          // Prefer back camera on mobile
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("rear") || 
            d.label.toLowerCase().includes("environment")
          );
          const selectedCamera = backCamera ? backCamera.id : devices[devices.length - 1].id;
          setCameraId(selectedCamera);
          
          html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
               if (isProcessingRef.current) return;
                handleScan(decodedText);
            },
            (errorMessage) => {
              // ignore errors
            }
          );
        } else {
          setScanError("No cameras found");
        }
      } catch (err) {
        setScanError("Error accessing camera: " + err.message);
      }
    };

    if (scanning) {
        isProcessingRef.current = false;
        // Small delay to ensure previous cleanup finished if any
        const timer = setTimeout(() => {
             startScanner();
        }, 300);
        return () => clearTimeout(timer);
    } else {
        // If not scanning, ensure we stop
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                scannerRef.current.clear();
                scannerRef.current = null;
            }).catch(err => console.error("Stop error", err));
        }
    }

    return () => {
      // Unmount cleanup
      if (scannerRef.current) {
         // We can't await here, but we can try to stop
         try {
             if (scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
             }
         } catch(e) {}
      }
    };
  }, [scanning]);

  const handleScan = async (qrString) => {
    if (loading || isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    // 1. STOP Scanner logic FIRST
    try {
        if (scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            scannerRef.current = null;
        }
    } catch (e) {
        console.warn("Error stopping scanner", e);
    }
    
      // 2. Update state to unmount scanner view
    // Note: We don't wait for stop here, we update state immediately to show "Processing..." UI
    // The previous stop attempt was 'fire and forget' (with await) but might have failed or timed out.
    // Crucially, we set scanning=false so the UI unmounts the <div id="reader"> which html5qrcode needs.
    setScanning(false);
    setLoading(true);
    setScanError(null);
    setQrValue(qrString); 

    try {

       // Parse Logic 
       let userId = qrString;
       try {
         const qrData = JSON.parse(qrString);
         if (qrData.userId) {
             userId = qrData.userId;
         }
       } catch (e) {
         userId = qrString;
       }

       // Sanitize
       userId = userId ? userId.trim() : "";

        if (!userId || userId.length < 10) { 
             throw new Error("Invalid QR Code: " + userId);
        }

      // 1. Fetch User Profile
      // Allow fetching any profile regardless of event assignment
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
          throw new Error("User not found or access denied.");
      }
      
      setUserData(profile);

      // 2. Fetch Paid Events (Optional - don't block if fails)
      try {
          const { data: registrations } = await supabase
            .from("event_registrations_config")
            .select(`
            payment_status,
            events:event_id (
                name,
                category,
                event_id
            )
            `)
            .eq("user_id", userId)
            // Relaxed payment check or just fetch all
            // .in("payment_status", ["paid", "PAID", "completed"]); 
            
          if (registrations) {
             const events = registrations
                .map(r => r.events)
                .filter(e => e); 
             setPaidEvents(events);
          } else {
              setPaidEvents([]);
          }
      } catch (evtError) {
          console.warn("Could not fetch events:", evtError);
          setPaidEvents([]);
      }

      toast.success("User found!");

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error.message);
      // Logic for retry:
      isProcessingRef.current = false;
      // Note: We must allow time for the previous state transition to complete before re-enabling scanner
      setTimeout(() => setScanning(true), 100);
    } finally {
      if (isProcessingRef.current) {
          setLoading(false);
          isProcessingRef.current = false;
      }
    }
  };

  const handlePrint = () => {
    const printArea = document.getElementById("print-badge");
    if (!printArea) return;

    // Clone the badge content
    const badgeHTML = printArea.innerHTML;

    // Create a hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "10cm";
    iframe.style.height = "3.5cm";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: 10cm 3.5cm; margin: 0; }
  html, body {
    margin: 0; padding: 0;
    width: 10cm; height: 3.5cm;
    overflow: hidden;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .badge {
    width: 10cm; height: 3.5cm;
    padding: 8mm 2mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 4mm;
    overflow: hidden;
    background: white;
  }
  .left-col {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40%;
    height: 100%;
  }
  .right-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    width: 60%;
    height: 100%;
    padding-left: 12mm;
    padding-top: 1mm;
  }
  .qr-box {
    width: 28mm; height: 28mm;
    padding-top: 3mm;
    padding-bottom: 3mm;
  }
  .qr-box svg {
    width: 100% !important;
    height: 100% !important;
  }
  .user-name {
    font-size: 11pt;
    font-weight: bold;
    color: black;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 1mm;
    width: 100%;
  }
  .user-id {
    font-size: 11pt;
    font-family: monospace;
    color: black;
    margin-bottom: 1mm;
  }
  .events-section {
    display: flex;
    flex-direction: column;
    gap: 0.5mm;
    width: 100%;
    overflow: hidden;
  }
  .event-item {
    font-size: 9pt;
    color: black;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
</style>
</head>
<body>
  <div class="badge">${badgeHTML}</div>
</body>
</html>`);
    doc.close();

    // Wait for iframe content (especially SVG) to render, then print
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      // Cleanup after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 300);
  };

  const handleReset = () => {
    setUserData(null);
    setPaidEvents([]);
    setQrValue("");
    isProcessingRef.current = false;
    // Don't restart immediately to avoid race conditions with unmounting
    setTimeout(() => setScanning(true), 100);
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col print-page-root">
      {/* Header - Hidden when printing */}
      <div className="bg-white shadow-sm p-4 no-print">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Go Back"
             >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
             </button>
             <h1 className="text-xl font-bold text-gray-800">Print QR Badge</h1>
          </div>
          {userData && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Scan New
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center no-print">
        
        {/* Scanner View */}
        {scanning && (
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-800 text-white text-center">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <h2 className="text-lg font-medium">Scan User QR Code</h2>
            </div>
            <div className="p-6">
                <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-dashed border-gray-300"></div>
                {scanError && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                    {scanError}
                </div>
                )}
            </div>
            </div>
        )}

        {/* Loading State */}
        {loading && (
             <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500">Fetching user details...</p>
             </div>
        )}

        {/* Print Controls - Hidden on Print */}
        {!scanning && !loading && userData && (
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-4 w-full max-w-lg">
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition shadow-lg"
                    >
                        <Printer className="w-5 h-5" />
                        Print Badge
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Printable Badge - Always in DOM when data exists, hidden on screen, printed via iframe */}
      {userData && (
        <div id="print-badge" className="print-area">
            <div className="left-col">
                <div className="qr-box">
                     <QRCodeSVG value={qrValue} size={250} level="H" />
                </div>
            </div>
            <div className="right-col">
                <div className="user-name">{userData.full_name}</div>
                <div className="user-id">ID: {userData.id.slice(0, 8)}</div>
                <div className="events-section">
                    {paidEvents.length > 0 ? (
                        paidEvents.map((event, index) => (
                            <div key={index} className="event-item">
                                {event.name}
                            </div>
                        ))
                    ) : (
                        <div className="event-item" style={{color: '#999', fontStyle: 'italic'}}>No events</div>
                    )}
                </div>
            </div>
        </div>
      )}

      <style>{`
        /* Screen only: hide the badge on screen */
        .print-area {
          position: fixed;
          left: 0;
          top: 0;
          width: 10cm;
          height: 3.5cm;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PrintQRPage;
