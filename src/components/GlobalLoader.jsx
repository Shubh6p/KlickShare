import React, { useState, useEffect } from 'react';

const GlobalLoader = ({ message, isServerWarmup }) => {
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const spinners = ['[ - ]', '[ \\ ]', '[ | ]', '[ / ]'];

  useEffect(() => {
    const interval = setInterval(() => {
      setSpinnerIdx((prev) => (prev + 1) % spinners.length);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-brand-inverseSurface/95 z-[9999] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="scanlines pointer-events-none fixed inset-0 z-50 opacity-50"></div>
      
      <div className="bg-brand-surface p-8 shadow-[10px_10px_0px_#d3cabc] flex flex-col items-center border-4 border-brand-inverseSurface relative max-w-lg w-full">
        {/* Terminal Header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-8 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest flex items-center justify-center font-display text-[8px] uppercase text-brand-primary/60">
          SYS_LOADER.exe
        </div>
        
        <div className="mt-8 mb-6 font-display text-xs text-brand-primary uppercase tracking-widest flex items-center gap-3">
          <span className="text-brand-secondary">{spinners[spinnerIdx]}</span>
          {isServerWarmup ? 'SERVER REBOOTING - CONNECTING...' : message}
        </div>

        {isServerWarmup && (
          <div className="font-mono text-[10px] text-brand-onSurface/70 tracking-tighter text-center mt-2 border-t border-brand-outlineVariant/30 pt-4">
            The signaling server is hosted on Render free tier.
            <br />
            It may take up to 30 seconds to wake up from sleep.
            <br />
            Please stand by...
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;
