import React, { useState } from 'react';
import { QrCode, Wifi } from 'lucide-react';

export default function Landing({ onCreateClick, onJoinClick }) {
  const [roomInput, setRoomInput] = useState('');
  const [joinStep, setJoinStep] = useState(0);

  if (joinStep === 1) {
    return (
      <div className="w-full max-w-lg mx-auto animate-view-fade">
        <div className="bg-brand-surface shadow-[6px_6px_0px_0px_#d3cabc] relative pt-12 pb-6 px-6 md:px-8 flex flex-col border border-brand-outlineVariant/20">
          {/* Floppy slider detail */}
          <div className="absolute top-0 right-6 w-16 h-8 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest"></div>

          <div className="flex-grow">
            <div className="flex justify-between items-center mb-8 border-b border-brand-outlineVariant/30 pb-4">
                <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight text-brand-onSurface uppercase">JOIN SESSION</h2>
                <div className="bg-black text-white font-display text-[10px] px-3 py-1 flex items-center gap-2">
                    <Wifi className="w-3 h-3 text-brand-primary/50" /> READY.
                </div>
            </div>
            
            <div className="bg-brand-surfaceHighest p-4 mb-4 border-2 border-brand-outlineVariant/30 shadow-inner">
              <p className="font-display text-[10px] mb-2 uppercase font-bold text-brand-onSurface">TARGET ROOM ID</p>
              <div className="flex items-center gap-2">
                  <span className="text-brand-secondary font-bold">{'>'}</span>
                  <input 
                      type="text" 
                      placeholder="XXX-XXX" 
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value)}
                      className="bg-transparent border-none outline-none w-full font-display text-sm uppercase placeholder-brand-primary/30 text-brand-onSurface" 
                  />
              </div>
            </div>

            <button
              onClick={() => onJoinClick(roomInput)}
              className="block w-full text-center bg-brand-secondary text-brand-surfaceLowest font-display text-sm py-4 md:py-5 uppercase transition-brutal shadow-[4px_4px_0px_0px_#4d5d3666] hover:bg-brand-secondaryDim mb-4"
            >
              JOIN ROOM
            </button>

            <button
              onClick={() => alert("Scanner feature coming soon")}
              className="block w-full text-center bg-black text-brand-tertiary font-display text-xs py-3 uppercase transition-brutal hover:text-white"
            >
              <span className="flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4" /> SCAN QR CODE
              </span>
            </button>
          </div>

          {/* Footer detail */}
          <div className="mt-8 pt-4 border-t-2 border-brand-outlineVariant/40 flex justify-between items-end">
            <div className="font-display text-[10px] text-brand-primary/70 uppercase">
              <div>OPERATION</div>
              <div className="text-brand-onSurface">JOIN.BIN</div>
            </div>
            <div className="w-4 h-4 bg-brand-outlineVariant"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full max-w-4xl mx-auto animate-view-fade">
      
      {/* HOST SESSION CARD */}
      <div className="bg-brand-surface shadow-[6px_6px_0px_0px_#d3cabc] relative pt-12 pb-6 px-6 md:px-8 flex flex-col h-full border border-brand-outlineVariant/20">
        {/* Floppy slider detail */}
        <div className="absolute top-0 left-6 w-16 h-8 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest"></div>

        <div className="flex-grow">
          <h2 className="font-display text-xl md:text-2xl mb-4 font-bold tracking-tight text-brand-onSurface uppercase">HOST SESSION</h2>
          <p className="text-brand-primary/70 mb-8 text-sm md:text-base leading-relaxed">
            Initiate a secure peer-to-peer data tunnel. Absolute zero server retention. E2E DTLS encryption standard.
          </p>
          
          <button
            onClick={onCreateClick}
            className="block w-full text-center bg-brand-secondary text-brand-surfaceLowest font-display text-sm py-4 md:py-5 uppercase transition-brutal shadow-[4px_4px_0px_0px_#4d5d3666] hover:bg-brand-secondaryDim"
          >
            GENERATE ROOM CODE
          </button>
        </div>

        {/* Footer detail */}
        <div className="mt-8 pt-4 border-t-2 border-brand-outlineVariant/40 flex justify-between items-end">
          <div className="font-display text-[10px] text-brand-primary/70 uppercase">
            <div>OPERATION</div>
            <div className="text-brand-onSurface">CREATE.BIN</div>
          </div>
          <div className="w-4 h-4 bg-brand-tertiary"></div>
        </div>
      </div>

      {/* JOIN SESSION CARD */}
      <div className="bg-brand-surface shadow-[6px_6px_0px_0px_#d3cabc] relative pt-12 pb-6 px-6 md:px-8 flex flex-col h-full border border-brand-outlineVariant/20">
        {/* Floppy slider detail */}
        <div className="absolute top-0 right-6 w-16 h-8 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest"></div>

        <div className="flex-grow">
          <h2 className="font-display text-xl md:text-2xl mb-4 font-bold tracking-tight text-brand-onSurface uppercase">JOIN SESSION</h2>
          <p className="text-brand-primary/70 mb-8 text-sm md:text-base leading-relaxed">
            Connect to an existing secure peer-to-peer data tunnel. Enter target room ID or scan QR code on the next screen.
          </p>
          
          <button
            onClick={() => setJoinStep(1)}
            className="block w-full text-center bg-brand-secondary text-brand-surfaceLowest font-display text-sm py-4 md:py-5 uppercase transition-brutal shadow-[4px_4px_0px_0px_#4d5d3666] hover:bg-brand-secondaryDim"
          >
            JOIN ROOM
          </button>
        </div>

        {/* Footer detail */}
        <div className="mt-8 pt-4 border-t-2 border-brand-outlineVariant/40 flex justify-between items-end">
          <div className="font-display text-[10px] text-brand-primary/70 uppercase">
            <div>OPERATION</div>
            <div className="text-brand-onSurface">JOIN.BIN</div>
          </div>
          <div className="w-4 h-4 bg-brand-outlineVariant"></div>
        </div>
      </div>

    </div>
  );
}
