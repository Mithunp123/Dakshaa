import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase';

export default function SupabaseHealthCheck({ children }) {
  const [isHealthy, setIsHealthy] = useState(true);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(true);

  const checkHealth = async () => {
    setChecking(true);
    try {
      // Try to fetch from a simple table
      const { error: healthError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (healthError) {
        console.error('🔥health check failed:', healthError);
        setIsHealthy(false);
        setError(healthError.message);
      } else {
        setIsHealthy(true);
        setError(null);
      }
    } catch (err) {
      console.error('❌health check error:', err);
      setIsHealthy(false);
      setError(err.message || 'Unknown error');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Re-check every 30 seconds if unhealthy
    const interval = setInterval(() => {
      if (!isHealthy) {
        checkHealth();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isHealthy]);

  // If healthy, render children normally
  if (isHealthy) {
    return children;
  }

  // Show error overlay if unhealthy
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-red-900/20 border-2 border-red-500 rounded-2xl p-8">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-red-400 mb-2">
              Database Connection Error
            </h1>
            <p className="text-gray-300 text-lg">
              Cannot connect to Supabase server
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-black/40 rounded-xl p-6 text-left">
            <p className="text-red-300 font-mono text-sm break-words mb-4">
              {error || 'Failed to fetch'}
            </p>
            
            <div className="space-y-2 text-gray-400 text-sm">
              <p className="font-semibold text-amber-400">🔍 Possible Causes:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Supabase project is <strong>paused</strong> (free tier inactivity)</li>
                <li>CORS not configured for: <code className="text-blue-400">{window.location.origin}</code></li>
                <li>API key is invalid or expired</li>
                <li>Network/firewall blocking connection</li>
                <li>Supabase service outage</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={checkHealth}
              disabled={checking}
              className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking Connection...' : 'Retry Connection'}
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://supabase.com/dashboard/projects"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open Supabase Dashboard
              </a>
              
              <a
                href="https://status.supabase.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Check Service Status
              </a>
            </div>
          </div>

          {/* Admin Instructions */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-left">
            <p className="text-blue-400 font-semibold mb-2">📋 Admin: Quick Fix Steps</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
              <li>Check if Supabase project is <strong>paused</strong> → Resume it</li>
              <li>Add <code className="text-blue-400">{window.location.origin}</code> to CORS origins</li>
              <li>Verify API keys in Settings → API</li>
              <li>Check Row Level Security policies</li>
              <li>See <code className="text-amber-400">SUPABASE_403_FIX_GUIDE.md</code> for details</li>
            </ol>
          </div>

          {/* Auto-retry indicator */}
          <p className="text-gray-500 text-xs">
            🔄 Automatically checking connection every 30 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
