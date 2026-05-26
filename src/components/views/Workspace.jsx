import React, { useRef, useState, useCallback } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { Send, File, MessageSquare, Users, Download, ShieldCheck, X, Upload, RefreshCw, Check, Copy } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const copyToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn("navigator.clipboard failed, trying fallback", e);
    }
  }
  
  // Fallback method
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
    console.error("Fallback copy failed", err);
    return false;
  }
};

export default function Workspace({ onShowQR }) {
  const { roomCode, peerList, chatMessages, activeTransfers, sharedFiles, isHost, engine } = useWebRTC();
  const [msgInput, setMsgInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    engine.sendChatMessage(msgInput);
    setMsgInput('');
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });

  const handleDispatch = () => {
    if (selectedFile) {
      engine.sendFile(selectedFile);
      setSelectedFile(null);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full animate-view-fade pb-12">
      
      {/* Left Column: Peer List & Actions */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-brand-surface shadow-[6px_6px_0px_0px_#d3cabc] border border-brand-outlineVariant/20 p-4 relative pt-10">
          <div className="absolute top-0 left-4 w-12 h-6 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest"></div>
          <div className="flex items-center gap-2 mb-4 border-b border-brand-outlineVariant/30 pb-2">
            <Users className="w-4 h-4 text-brand-secondary" />
            <h2 className="font-display text-[10px] uppercase font-bold">Uplink Status</h2>
          </div>
          
          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
            {peerList.map(peer => {
              const isLocal = peer.peerId === engine.socket?.id;
              const pc = engine.peerConnections.get(peer.peerId);
              const isHandshaking = !isLocal && pc && (
                pc.connectionState === 'connecting' || 
                pc.connectionState === 'new' || 
                pc.iceConnectionState === 'checking' || 
                pc.iceConnectionState === 'new'
              );
              
              let statusLabel = 'CONNECTED';
              let statusClass = 'text-green-600';
              let extraAttrs = {};

              if (isLocal) {
                statusLabel = 'ACTIVE';
                statusClass = 'bg-brand-secondary/10 px-1 italic text-brand-secondary';
              } else if (isHandshaking) {
                statusLabel = 'CONNECTING';
                statusClass = 'text-brand-tertiary';
                extraAttrs = { 'data-connecting': 'true' };
              }

              return (
                <div key={peer.peerId} className="flex items-center justify-between text-[10px] font-display">
                  <span className={`truncate ${isLocal ? 'text-brand-secondary font-bold' : ''}`}>
                    {peer.isHost && <span className="text-brand-tertiary mr-1 font-bold">[HOST]</span>}
                    {peer.name || 'ANON_PEER'} {isLocal && '(YOU)'}
                  </span>
                  <span 
                    className={`text-[8px] ${statusClass}`}
                    {...extraAttrs}
                  >
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <button 
            onClick={onShowQR}
            className="w-full mt-6 bg-brand-inverseSurface text-brand-tertiary font-display text-[10px] py-3 uppercase shadow-[4px_4px_0px_0px_#d3cabc] transition-brutal hover:text-white"
          >
            Show Uplink QR
          </button>
        </div>

        <div className="bg-brand-surface shadow-[6px_6px_0px_0px_#d3cabc] border border-brand-outlineVariant/20 p-4 relative pt-10">
          <div className="absolute top-0 left-4 w-12 h-6 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest"></div>
          <div className="flex items-center gap-2 mb-4 border-b border-brand-outlineVariant/30 pb-2">
            <ShieldCheck className="w-4 h-4 text-brand-secondary" />
            <h2 className="font-display text-[10px] uppercase font-bold">Protocol Info</h2>
          </div>
          <div className="space-y-2 text-[9px] font-mono text-brand-primary/60 uppercase">
            <p className="flex items-center gap-2">
              ID: {roomCode}
              <button onClick={async () => {
                  const success = await copyToClipboard(roomCode);
                  if (success) {
                      window.showToast("Room ID copied to clipboard!", "success");
                  } else {
                      window.showToast("Copy failed.", "error");
                  }
              }} className="text-brand-secondary hover:text-brand-tertiary transition-colors" title="Copy Room ID">
                <Copy className="w-3 h-3" />
              </button>
            </p>
            <p className="flex items-center gap-2 truncate max-w-full">
              LINK: {`${window.location.origin}?room=${roomCode}`}
              <button onClick={async () => {
                  const success = await copyToClipboard(`${window.location.origin}?room=${roomCode}`);
                  if (success) {
                      window.showToast("Share link copied to clipboard!", "success");
                  } else {
                      window.showToast("Copy failed.", "error");
                  }
              }} className="text-brand-secondary hover:text-brand-tertiary transition-colors shrink-0" title="Copy Share Link">
                <Copy className="w-3 h-3" />
              </button>
            </p>
            <p>ENC: DTLS-SRTP</p>
            <p>MODE: FULL-MESH</p>
          </div>
          {isHost ? (
            <button 
              onClick={() => { engine.killRoom(); engine.cancelRoom(); window.location.reload(); }}
              className="w-full mt-6 border-2 border-red-600 text-red-600 font-display text-[10px] py-2 uppercase transition-brutal hover:bg-red-600 hover:text-white"
            >
              Kill Session
            </button>
          ) : (
            <button 
              onClick={() => { engine.cancelRoom(); window.location.reload(); }}
              className="w-full mt-6 border-2 border-brand-tertiary text-brand-tertiary font-display text-[10px] py-2 uppercase transition-brutal hover:bg-brand-tertiary hover:text-white"
            >
              Leave Session
            </button>
          )}
        </div>
      </div>

      {/* Center Column: Chat & Log */}
      <div className="lg:col-span-5 flex flex-col h-[600px]">
        <div className="bg-brand-inverseSurface shadow-[6px_6px_0px_0px_#d3cabc] border-2 border-brand-inverseSurface flex flex-col h-full overflow-hidden">
          <div className="bg-brand-inverseSurface px-4 py-2 border-b border-brand-tertiary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3 h-3 text-brand-tertiary" />
              <span className="font-display text-[10px] text-brand-tertiary uppercase">Comm-Log.sys</span>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-3 font-mono text-xs custom-scrollbar">
            {chatMessages.map((msg, i) => (
              <div key={`${msg.time}-${i}`} className={`flex flex-col ${msg.type === 'system' ? 'items-center opacity-50' : ''}`}>
                {msg.type === 'system' ? (
                  <span className="text-[10px] bg-brand-tertiary/10 px-2 py-1 italic text-brand-tertiary text-center">
                    *** {msg.text} ***
                  </span>
                ) : (
                  <>
                    <span className="text-[10px] text-brand-tertiary font-bold mb-1">
                      [{msg.sender}] {msg.time}
                    </span>
                    <span className="text-brand-surfaceLowest break-all leading-relaxed">
                      {msg.text}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="p-3 bg-brand-inverseSurface border-t border-brand-tertiary/20 flex gap-2">
            <input 
              type="text" 
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder="Type command..."
              className="flex-grow bg-brand-surfaceHigh/10 border border-brand-tertiary/30 p-2 text-brand-surfaceLowest font-mono text-xs outline-none focus:border-brand-tertiary transition-colors"
            />
            <button type="submit" className="bg-brand-tertiary text-brand-inverseSurface p-2 px-4 transition-brutal active:scale-95">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: File Transfers */}
      <div className="lg:col-span-4 space-y-6 flex flex-col h-[600px]">
        <div className="bg-brand-surface shadow-[6px_6px_0px_0px_#d3cabc] border border-brand-outlineVariant/20 p-4 flex flex-col h-full relative pt-10">
          <div className="absolute top-0 right-4 w-12 h-6 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest"></div>
          <div className="flex items-center justify-between mb-4 border-b border-brand-outlineVariant/30 pb-2">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-brand-secondary" />
              <h2 className="font-display text-[10px] uppercase font-bold">Data Transfer</h2>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-2 mb-4">
            {activeTransfers.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="font-display text-[8px] text-brand-tertiary uppercase mb-2">Live Stream</h3>
                {activeTransfers.map(transfer => (
                  <div key={transfer.id} className="bg-brand-surfaceHighest p-3 border border-brand-outlineVariant/30 shadow-sm animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-display truncate max-w-[150px] uppercase">{transfer.name}</span>
                      <span className="text-[9px] font-mono">{transfer.progress}%</span>
                    </div>
                    <div className="h-4 bg-brand-inverseSurface p-[2px]">
                      <div className="h-full bg-brand-secondary transition-all duration-300" style={{ width: `${transfer.progress}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-[8px] font-mono opacity-50 uppercase">{transfer.type}</span>
                        {transfer.size && <span className="text-[8px] font-mono opacity-50 uppercase">{formatSize(transfer.size)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-display text-[8px] text-brand-secondary uppercase mb-2">Transferred Data</h3>
              {sharedFiles.length === 0 && !activeTransfers.length && (
                <div className="text-center py-8 border-2 border-dashed border-brand-outlineVariant/20 opacity-30">
                  <span className="font-display text-[9px] uppercase">No Data Transferred</span>
                </div>
              )}
              {[...sharedFiles].reverse().map((file, revIndex) => {
                const i = sharedFiles.length - 1 - revIndex;
                if (file.isBeforeJoined) {
                  return (
                    <div key={`${file.name}-${i}`} className="flex flex-col bg-brand-surfaceHighest/40 p-4 border-2 border-dashed border-brand-outlineVariant/30 transition-colors gap-3 opacity-60 transfer-item">
                      {/* Top Row: Full Filename */}
                      <div className="w-full">
                        <span className="text-[11px] font-display font-bold uppercase break-all text-brand-primary/50">{file.name}</span>
                      </div>

                      {/* Bottom Row: Details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 mt-1">
                        <div className="flex items-center gap-3">
                          <File className="w-6 h-6 text-brand-primary/30 shrink-0" />
                          <span className="text-[9px] font-mono opacity-50 uppercase pt-1">
                            {formatSize(file.size)} • BY {file.sender} • {file.time && `${file.time}`}
                          </span>
                        </div>
                        <div className="border-2 border-dashed border-brand-outlineVariant/30 text-brand-primary/40 font-display text-[8px] font-bold px-2 py-1.5 uppercase flex items-center bg-brand-surfaceHighest/10 select-none">
                          BEFORE JOIN
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`${file.name}-${i}`} className="flex flex-col bg-brand-surfaceHighest p-4 border border-brand-outlineVariant/20 transition-colors gap-3 transfer-item">
                    
                    {/* Top Row: Full Filename & Discard Button */}
                    <div className="flex items-start justify-between w-full gap-2">
                      <span className="text-[11px] font-display font-bold uppercase break-all">{file.name}</span>
                      <button 
                        onClick={() => engine.removeSharedFile(i)}
                        className="text-brand-primary/40 hover:text-red-600 transition-colors shrink-0 p-0.5"
                        title="Discard and Free Memory"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom Row: Icon, Size, and Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 mt-1">
                      
                      <div className="flex items-center gap-3">
                        <File className="w-6 h-6 text-brand-secondary shrink-0" />
                        <span className="text-[9px] font-mono opacity-60 uppercase pt-1">
                            {formatSize(file.size)} • {file.sender === 'You' ? 'SENT' : 'RECEIVED'} {file.time && `• ${file.time}`}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                          {file.sender === 'You' ? (
                              <>
                                  <button 
                                    onClick={() => {
                                        if (file.originalFile) {
                                            engine.sendFile(file.originalFile);
                                        } else {
                                            window.showToast("Original file data lost. Cannot resend.", "error");
                                        }
                                    }}
                                    className="bg-brand-tertiary text-brand-surfaceLowest font-display text-[8px] font-bold px-2 py-2 uppercase transition-brutal hover:opacity-90 flex items-center gap-1 shadow-[2px_2px_0px_#000]"
                                  >
                                    <RefreshCw className="w-3 h-3" /> SEND AGAIN
                                  </button>
                                  <button 
                                    onClick={() => engine.unsendFile(file.name)}
                                    className="border-2 border-red-600 text-red-600 font-mono text-[9px] uppercase tracking-widest px-2 py-1.5 hover:bg-red-600 hover:text-brand-surfaceLowest transition-colors duration-150 btn-unsend font-bold"
                                  >
                                    ↩ UNDO
                                  </button>
                              </>
                          ) : (
                              <button 
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = file.url;
                                    a.download = file.name;
                                    a.click();
                                }}
                                className="bg-brand-secondary text-brand-surfaceLowest font-display text-[10px] font-bold px-4 py-2 uppercase transition-brutal hover:opacity-90 flex items-center gap-1 shadow-[2px_2px_0px_#000]"
                              >
                                <Download className="w-3 h-3" /> DOWNLOAD
                              </button>
                          )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-brand-outlineVariant/30 space-y-4">
            {!selectedFile ? (
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors dropzone-pulse ${isDragActive ? 'border-brand-tertiary bg-brand-tertiary/5 dropzone-pulse-active' : 'border-brand-outlineVariant/30 hover:border-brand-outlineVariant'}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-6 h-6 mx-auto mb-2 text-brand-primary/30" />
                  <p className="font-display text-[8px] uppercase text-brand-primary/50 leading-tight">
                    DRAG DATABLOCK HERE<br/>OR CLICK TO BROWSE
                  </p>
                </div>
            ) : (
                <div className="bg-brand-surfaceHighest p-3 border-2 border-brand-secondary/50 relative group">
                    <button 
                        onClick={() => setSelectedFile(null)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 shadow-[2px_2px_0px_0px_#000] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-3">
                        <File className="w-6 h-6 text-brand-secondary" />
                        <div className="overflow-hidden">
                            <p className="font-display text-[9px] uppercase truncate">{selectedFile.name}</p>
                            <p className="font-mono text-[8px] opacity-60 uppercase">{formatSize(selectedFile.size)}</p>
                        </div>
                    </div>
                </div>
            )}
            
            <button 
              disabled={!selectedFile}
              onClick={handleDispatch}
              className={`w-full font-display text-[10px] py-4 uppercase shadow-[4px_4px_0px_0px_#4d5d3666] transition-brutal ${selectedFile ? 'bg-brand-secondary text-brand-surfaceLowest hover:bg-brand-secondaryDim' : 'bg-brand-surfaceHighest text-brand-primary/20 cursor-not-allowed shadow-none border border-brand-outlineVariant/10'}`}
            >
              Dispatch Datablock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
