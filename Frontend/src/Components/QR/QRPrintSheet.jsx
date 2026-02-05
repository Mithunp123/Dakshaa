import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import PropTypes from "prop-types";
import "./QRPrintSheet.css";

/**
 * QRPrintSheet Component
 * 
 * Generates minimal printable QR codes for PAID participants only
 * Each page contains only:
 * - QR Code
 * - Participant Name
 * - DAK26-ID
 * 
 * Uses React Portal to render directly into document.body
 * This bypasses the app layout for clean printing
 */
const QRPrintSheet = ({ participants, onPrintComplete }) => {
  const printRef = useRef(null);
  const hasPrinted = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (hasPrinted.current) {
      console.log('🖨️ QRPrintSheet - Already triggered print, skipping');
      return;
    }
    
    console.log('🖨️ QRPrintSheet - Component mounted with participants:', participants?.length);
    
    // Auto-trigger print dialog when component mounts
    const timer = setTimeout(() => {
      if (hasPrinted.current) return;
      hasPrinted.current = true;
      
      console.log('🖨️ QRPrintSheet - Triggering print dialog');
      window.print();
      
      // Call completion callback after print dialog closes
      if (onPrintComplete) {
        onPrintComplete();
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - only run once on mount

  if (!participants || participants.length === 0) {
    return null;
  }

  console.log('🖨️ QRPrintSheet - RENDERING with participants:', participants);
  
  // Filter out any invalid participants
  const validParticipants = participants.filter(p => 
    p && p.userId && p.name && p.regId
  );
  
  console.log('🖨️ QRPrintSheet - Valid participants count:', validParticipants.length);
  
  if (validParticipants.length === 0) {
    console.error('❌ QRPrintSheet - No valid participants to print!');
    return null;
  }

  // Create the print content
  const printContent = (
    <div ref={printRef} className="qr-print-container">
      {validParticipants.map((participant, index) => {
        console.log(`🖨️ QRPrintSheet - Rendering page ${index + 1} for:`, participant.name);
        return (
          <div key={participant.id || participant.userId || index} className="qr-print-page">
            {/* QR Code - Use plain UUID format (old format) for compatibility */}
            <div className="qr-print-qr-wrapper">
              <QRCodeCanvas
                value={participant.userId || participant.id}
                size={280}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Name */}
            <div className="qr-print-name">{participant.name}</div>

            {/* DAK26-ID */}
            <div className="qr-print-id">{participant.regId}</div>
          </div>
        );
      })}
    </div>
  );

  // Use portal to render directly into document.body
  // This bypasses the entire app layout for clean printing
  return createPortal(printContent, document.body);
};

QRPrintSheet.propTypes = {
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      userId: PropTypes.string,
      name: PropTypes.string.isRequired,
      regId: PropTypes.string.isRequired,
      registeredEvents: PropTypes.arrayOf(PropTypes.string)
    })
  ).isRequired,
  onPrintComplete: PropTypes.func
};

export default QRPrintSheet;
