import React from 'react';
import { useWebRTC } from '../context/WebRTCContext';

export default function Header() {
  const { engine } = useWebRTC();
  const name = engine?.localName || '';

  return (
    <header className="bg-brand-inverseSurface text-brand-tertiaryFixed shadow-[6px_6px_0px_0px_#d3cabc] border-2 border-brand-inverseSurface w-full">
      <div className="px-4 py-5 flex items-center justify-between font-display text-sm md:text-xl">
        <div 
          onClick={() => window.location.href = window.location.origin}
          className="flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
        >
          <span>A:\&gt; KLICKS.EXE<span className="animate-pulse bg-brand-tertiaryFixed w-3 h-5 inline-block align-middle ml-2"></span></span>
        </div>
        <div className="flex items-center gap-4 text-xs tracking-widest uppercase font-mono">
          {name && name !== 'Anonymous' && (
            <span id="display-my-name" className="text-brand-tertiaryFixed border border-brand-tertiaryFixed px-2 py-0.5 bg-brand-tertiaryFixed/10 text-[9px] font-bold">
              NODE: {name.toUpperCase()}
            </span>
          )}
          <span className="opacity-90 hidden sm:block text-[9px] font-display">
            V1.1.2 [P2P]
          </span>
        </div>
      </div>
    </header>
  );
}
