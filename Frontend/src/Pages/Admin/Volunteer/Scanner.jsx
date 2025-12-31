import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  X, 
  CheckCircle2, 
  XCircle, 
  User, 
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../supabase';

const GlobalScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState('');

  const handleScan = async (id) => {
    setLoading(true);
    setResult(null);
    try {
      // In a real app, the ID would come from the QR scanner
      // Here we simulate fetching user data by ID
      const { data, error } = await supabase
        .from('profiles')
        .select('*, registrations(*, events(*))')
        .eq('id', id)
        .single();

      if (error) throw error;

      const hasValidTicket = data.registrations?.some(r => r.payment_status?.toUpperCase() === 'PAID');
      
      setResult({
        user: data,
        isValid: hasValidTicket,
        registrations: data.registrations || []
      });
    } catch (error) {
      setResult({
        isValid: false,
        error: 'Invalid Ticket or User Not Found'
      });
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Global Ticket Validator</h2>
        <p className="text-gray-400">Scan any student QR code to verify event eligibility</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 text-center space-y-8">
        <div className="relative mx-auto w-48 h-48">
          <div className="absolute -inset-4 bg-gradient-to-r from-secondary to-primary rounded-[2.5rem] blur-xl opacity-20"></div>
          <button 
            onClick={() => setScanning(true)}
            className="relative w-full h-full bg-slate-900 border-2 border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-secondary/50 transition-all group"
          >
            <QrCode size={64} className="text-secondary group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-widest">Tap to Scan</span>
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Or enter Registration ID</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="DAK26-XXXXXXXX"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-secondary transition-all text-center font-mono"
            />
            <button 
              onClick={() => handleScan(manualId)}
              disabled={loading || !manualId}
              className="px-8 py-4 bg-secondary text-white font-bold rounded-2xl hover:bg-secondary-dark transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify'}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-[3rem] border p-8 md:p-12 ${
              result.isValid 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                result.isValid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {result.isValid ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
              </div>

              <div>
                <h3 className={`text-3xl font-bold ${result.isValid ? 'text-green-500' : 'text-red-500'}`}>
                  {result.isValid ? 'VALID TICKET' : 'INVALID / NO TICKET'}
                </h3>
                {result.user && (
                  <div className="mt-4 space-y-1">
                    <p className="text-xl font-bold">{result.user.full_name}</p>
                    <p className="text-gray-400 font-mono">{result.user.roll_number}</p>
                    <p className="text-sm text-gray-500">{result.user.college_name}</p>
                  </div>
                )}
                {result.error && <p className="text-red-400 font-bold mt-2">{result.error}</p>}
              </div>

              {result.isValid && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {result.registrations.map((reg, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-bold text-sm">{reg.events?.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{reg.events?.category}</p>
                      </div>
                      <ShieldCheck className="text-green-500" size={20} />
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setResult(null)}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
              >
                Clear Result
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Modal Placeholder */}
      <AnimatePresence>
        {scanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full relative">
              <button 
                onClick={() => setScanning(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors z-10"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Scan Ticket</h3>
                <p className="text-gray-400">Verify student entry at the gate</p>
              </div>

              <div className="aspect-square bg-black rounded-3xl border-2 border-dashed border-secondary/50 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                <Camera size={48} className="text-secondary animate-pulse" />
                <p className="text-sm text-gray-500">Camera initialization...</p>
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-secondary/50 shadow-[0_0_15px_rgba(249,115,22,0.8)] z-20"
                />
              </div>
              
              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-4">
                <AlertTriangle className="text-blue-400 shrink-0" size={20} />
                <p className="text-xs text-blue-400 leading-relaxed">
                  Volunteers can only verify tickets. They cannot see sensitive data like phone numbers or revenue.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalScanner;
