import React from 'react';
import { Heart, Shield, Zap, Info } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="mt-12 pt-8 border-t-4 border-brand-outlineVariant/50 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left font-display text-brand-primary/70 uppercase text-[10px] md:text-xs">
            <div className="flex-1 max-w-2xl space-y-4">
                <p className="flex items-center justify-center md:justify-start gap-2 text-brand-onSurface">
                    <Info className="w-4 h-4 text-brand-tertiary" />
                    <strong>KLICKS P2P PROTOCOL</strong>
                </p>
                <p className="leading-relaxed font-mono normal-case text-xs md:text-sm text-brand-onSurface">
                    Engineered to help students seamlessly share files between devices across any network constraint. Datablocks are transferred strictly via a secure, peer-to-peer WebRTC tunnel.
                    <br /><br />
                    <strong>Zero server storage.</strong> Absolutely no retention. <strong>End-to-End Encrypted</strong> under the DTLS standard. Fast, brutal, and totally free.
                </p>
                <div className="flex items-center justify-center md:justify-start gap-6 pt-2 text-brand-onSurface">
                    <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-brand-secondary" /> E2EE SECURE</span>
                    <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-brand-tertiary" /> MAX BANDWIDTH</span>
                </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3 border-t-4 border-brand-outlineVariant/50 md:border-t-0 md:border-l-4 md:pl-8 pt-6 md:pt-0 w-full md:w-auto">
                <div className="bg-brand-surfaceHighest border-2 border-brand-outlineVariant p-4 shadow-[4px_4px_0px_#d3cabc] text-brand-onSurface flex items-center justify-center gap-2">
                    <span>MADE WITH</span>
                    <Heart className="w-4 h-4 text-red-600 animate-pulse fill-red-600" />
                    <span>BY AB</span>
                </div>
                <p className="opacity-70 font-mono mt-2 tracking-widest text-[#787878]">SYS.VER 1.1.2</p>
                <p className="opacity-70 font-mono tracking-widest text-[#787878]">INIT 2026</p>
            </div>
        </footer>
    );
}
