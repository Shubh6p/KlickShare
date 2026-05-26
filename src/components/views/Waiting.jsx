import React, { useState } from 'react';
import { Copy, Check, Loader2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

export default function Waiting({ roomCode, onCancel }) {
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareUrl = `${window.location.origin}?room=${roomCode}`;

    return (
        <div className="bg-brand-surface shadow-[8px_8px_0px_0px_#d3cabc] border border-brand-outlineVariant/20 p-6 md:p-10 max-w-2xl mx-auto relative mt-4 animate-view-fade">
            <div className="absolute top-0 left-6 w-16 h-8 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest"></div>

            <div className="flex items-center justify-between border-b-2 border-brand-outlineVariant/30 pb-4 mt-8">
                <h1 className="text-xl font-display font-bold text-brand-onSurface uppercase tracking-tight">HOST SESSION</h1>
                <button
                    onClick={onCancel}
                    className="bg-red-600/10 text-red-600 border border-red-600 font-display text-[10px] px-3 py-1 uppercase transition-brutal shadow-sm hover:bg-red-600 hover:text-white"
                >
                    ABORT
                </button>
            </div>

            <div className="bg-brand-surfaceHighest border border-brand-outlineVariant/20 shadow-[4px_4px_0px_0px_#d3cabc] p-6 text-center mt-8">
                <p className="text-xs font-display text-brand-onSurface mb-4 uppercase font-bold">
                    DISTRIBUTE THIS ACCESS CODE
                </p>
                <div className="flex items-center justify-center gap-3 mb-6">
                    <span className="text-3xl md:text-4xl font-display font-bold tracking-[0.2em] text-brand-tertiary bg-white px-4 py-2 border-2 border-brand-outlineVariant/50">
                        {roomCode}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="p-3 bg-brand-inverseSurface hover:bg-black transition-colors shadow-[4px_4px_0px_0px_#d3cabc] active:translate-x-1 active:translate-y-1"
                        title="Copy code"
                    >
                        {copied
                            ? <Check className="w-6 h-6 text-brand-secondary" />
                            : <Copy className="w-6 h-6 text-white" />
                        }
                    </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                        type="button"
                        onClick={() => setShowQR(!showQR)}
                        className="flex-grow text-center bg-brand-inverseSurface text-brand-tertiary font-display text-xs py-3 uppercase transition-transform shadow-[4px_4px_0px_0px_#d3cabc] hover:text-white"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <QrCode className="w-4 h-4" />
                            {showQR ? 'HIDE QR CODE' : 'GENERATE QR CODE'}
                        </span>
                    </button>
                    
                    <button
                        id="btn-share-link"
                        type="button"
                        onClick={async () => {
                            const copyToClipboard = async (text) => {
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                    try {
                                        await navigator.clipboard.writeText(text);
                                        return true;
                                    } catch (e) {}
                                }
                                try {
                                    const textArea = document.createElement("textarea");
                                    textArea.value = text;
                                    textArea.style.top = "0";
                                    textArea.style.left = "0";
                                    textArea.style.position = "fixed";
                                    textArea.style.opacity = "0";
                                    document.body.appendChild(textArea);
                                    textArea.focus();
                                    textArea.select();
                                    const successful = document.execCommand("copy");
                                    document.body.removeChild(textArea);
                                    return !!successful;
                                } catch (err) {
                                    return false;
                                }
                            };
                            const success = await copyToClipboard(shareUrl);
                            if (success) {
                                window.showToast('Room link copied to clipboard!', 'success');
                            } else {
                                window.showToast('Could not copy link.', 'error');
                            }
                        }}
                        className="flex-grow text-center bg-brand-inverseSurface text-brand-tertiaryFixed border border-brand-tertiaryFixed font-display text-xs py-3 uppercase shadow-[4px_4px_0px_0px_#875400] hover:text-white transition-colors"
                    >
                        [ COPY ROOM LINK ]
                    </button>
                </div>

                {showQR && (
                    <div className="mt-4 p-4 bg-white border-2 border-brand-outlineVariant/50 flex flex-col justify-center items-center">
                        <canvas ref={el => el && roomCode && QRCode.toCanvas(el, shareUrl, { width: 180, margin: 1, color: { dark: '#000000', light: '#ffffff' } })}></canvas>
                        <p className="mt-3 text-[10px] font-display text-brand-primary/50 uppercase">Scan to connect directly</p>
                    </div>
                )}
                
                <div className="flex items-center justify-center gap-2 mt-8 text-[10px] md:text-xs font-display text-brand-primary/50 uppercase">
                    <Loader2 className="w-3 h-3 animate-spin text-brand-tertiary" />
                    AWAITING TARGET CONNECTION...
                </div>
            </div>

            <div className="mt-8 pt-4 border-t-2 border-brand-outlineVariant/40 flex justify-between items-end">
                <div className="font-display text-[10px] text-brand-primary/70 uppercase">
                    <div>OPERATION</div>
                    <div className="text-brand-onSurface">WAITING.BIN</div>
                </div>
                <div className="w-4 h-4 bg-brand-tertiary"></div>
            </div>
        </div>
    );
}
