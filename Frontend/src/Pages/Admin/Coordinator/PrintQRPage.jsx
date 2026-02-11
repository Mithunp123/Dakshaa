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
       // Wait for render
       timer = setTimeout(() => {
           window.print();
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
    window.print();
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

      {/* Printable Badge - Always in DOM when data exists, hidden on screen, visible on print */}
      {userData && (
        <div className="print-area">
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
        /* Screen: hide the print-area on screen */
        .print-area {
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: 10cm;
          height: 3.5cm;
          overflow: hidden;
        }

        @media print {
          @page {
             size: 10cm 3.5cm;
             margin: 0;
          }

          /* Hide everything that should not print */
          .no-print,
          .print-page-root > .no-print,
          .print-page-root > div.no-print {
            display: none !important;
          }

          /* Reset page */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 10cm !important;
            height: 3.5cm !important;
            overflow: hidden !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-page-root {
            margin: 0 !important;
            padding: 0 !important;
            min-height: unset !important;
            height: 3.5cm !important;
            width: 10cm !important;
            background: white !important;
            display: block !important;
          }

          /* Show the print area */
          .print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 10cm !important;
            height: 3.5cm !important;
            margin: 0 !important;
            padding: 6mm 2mm 6mm 2mm !important;
            box-sizing: border-box !important;
            background: white !important;
            z-index: 99999 !important;
            
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: flex-start !important;
            gap: 4mm !important;
            overflow: hidden !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Left Column */
          .left-col {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 40% !important;
            height: 100% !important;
          }

          /* Right Column */
          .right-col {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            width: 60% !important;
            height: 100% !important;
            padding-left: 12mm !important;
            padding-top: 1mm !important;
          }
          
          /* QR Code Box */
          .qr-box {
             padding-top: 1mm !important;
             border: none !important;
             background: transparent !important;
             width: 32mm !important;
             height: 32mm !important;
             margin-bottom: 0 !important;
          }
          
          .qr-box svg {
             width: 100% !important;
             height: 100% !important;
          }

          /* Name */
          .user-name {
             font-size: 11pt !important;
             font-weight: bold !important;
             color: black !important;
             text-align: left !important;
             line-height: 1.1 !important;
             width: 100% !important;
             white-space: nowrap !important;
             overflow: hidden !important;
             text-overflow: ellipsis !important;
             margin-bottom: 1mm !important;
          }
          
          /* User ID */
          .user-id {
             font-size: 11pt !important;
             font-family: monospace !important; 
             color: black !important;
             font-weight: normal !important;
             margin-bottom: 1mm !important;
             display: block !important;
             margin-top: 0 !important;
          }

          /* Events List */
          .events-section {
             display: flex !important;
             flex-direction: column !important;
             align-items: flex-start !important;
             width: 100% !important;
             gap: 0.5mm !important;
             overflow: hidden !important;
          }
          
          .event-item {
             font-size: 9pt !important;
             color: black !important;
             font-weight: normal !important;
             line-height: 1.2 !important;
             white-space: nowrap !important;
             overflow: hidden !important;
             text-overflow: ellipsis !important;
             width: 100% !important;
             text-align: left !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintQRPage;
