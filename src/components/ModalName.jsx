import React, { useState } from 'react';
import { useWebRTC } from '../context/WebRTCContext';
import { X } from 'lucide-react';

export default function ModalName({ actionType, onClose }) {
  const [name, setName] = useState(() => sessionStorage.getItem('klicks_username') || '');
  const [size, setSize] = useState(2);
  const [allowLateJoiners, setAllowLateJoiners] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { engine } = useWebRTC();

  const handleContinue = () => {
    const finalName = name.trim().toUpperCase();
    if (!finalName) {
      setErrorMsg('Name cannot be empty. Please enter your name.');
      return;
    }
    setErrorMsg('');
    sessionStorage.setItem('klicks_username', finalName);
    engine.setLocalName(finalName);
    
    if (actionType === 'create') {
      engine.selectedSize = parseInt(size, 10);
      engine.allowLateJoinersSetting = allowLateJoiners;
      engine.createRoom();
    }
    
    onClose(finalName);
  };

  return (
    <div className="fixed inset-0 bg-brand-inverseSurface/80 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-brand-surface p-8 shadow-[8px_8px_0px_#d3cabc] max-w-sm w-full border-2 border-brand-inverseSurface relative pt-12">
        <button 
          onClick={() => onClose(null)}
          className="absolute top-2 right-2 text-brand-primary/50 hover:text-brand-primary transition-colors p-1"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest flex items-center justify-center font-display text-[8px] uppercase">
          Identity.sys
        </div>

        <h3 className="font-display text-sm mb-2 text-brand-onSurface uppercase font-bold text-center">AUTHENTICATE_NODE</h3>
        <p className="text-[10px] text-brand-primary/50 uppercase text-center mb-6 font-mono">Set callsign for the encrypted session</p>
        
        <div className={`bg-brand-surfaceHighest p-3 ${actionType === 'create' ? 'mb-2' : 'mb-4'} border-2 border-brand-outlineVariant/30`}>
          <input 
            autoFocus
            type="text" 
            placeholder="ENTER CALLSIGN..." 
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            className="bg-transparent border-none outline-none w-full font-display text-xs uppercase placeholder-brand-primary/20 text-brand-onSurface text-center" 
          />
        </div>

        {errorMsg && (
          <p id="name-error" className="font-mono text-[9px] text-red-500 uppercase tracking-widest text-center mb-4">
            {errorMsg}
          </p>
        )}

        {actionType === 'create' && (
          <>
            <div className="bg-brand-surfaceHighest p-3 mb-4 border-2 border-brand-outlineVariant/30 flex justify-between items-center">
              <span className="font-display text-[10px] uppercase text-brand-primary/50">MAX MEMBERS</span>
              <select 
                value={size} 
                onChange={(e) => setSize(e.target.value)}
                className="bg-transparent border-none outline-none font-display text-[10px] font-bold uppercase text-brand-onSurface cursor-pointer"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n} className="bg-brand-surfaceHighest">{n} PEERS</option>
                ))}
              </select>
            </div>

            <div className="bg-brand-surfaceHighest p-3 mb-6 border-2 border-brand-outlineVariant/30 flex justify-between items-center">
              <div className="flex flex-col text-left">
                <span className="font-display text-[9px] uppercase text-brand-primary">LATE JOINER FILES</span>
                <span className="font-mono text-[7px] text-brand-primary/50 uppercase mt-0.5">Let late joiners see previous files</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowLateJoiners(!allowLateJoiners)}
                className={`w-10 h-5 border-2 border-brand-outlineVariant bg-brand-surfaceHighest relative transition-colors duration-150 ${allowLateJoiners ? 'bg-brand-secondaryContainer border-brand-secondary' : ''}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 transition-all duration-150 ${allowLateJoiners ? 'right-0.5 bg-brand-secondary' : 'left-0.5 bg-brand-outlineVariant'}`}></span>
              </button>
            </div>
          </>
        )}

        <button 
          onClick={handleContinue}
          className="w-full bg-brand-tertiary text-brand-inverseSurface font-display text-xs py-4 uppercase shadow-[4px_4px_0px_#ff880066] transition-brutal hover:bg-brand-tertiary/90 font-bold"
        >
          {actionType === 'create' ? 'INITIALIZE_HOST' : 'ESTABLISH_UPLINK'}
        </button>

        <p className="mt-4 text-center text-[8px] font-mono opacity-30 uppercase">Secure handshake will follow</p>
      </div>
    </div>
  );
}
