import React, { useState, useEffect } from 'react';
import { useWebRTC } from './context/WebRTCContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Landing from './components/views/Landing';
import Waiting from './components/views/Waiting';
import Workspace from './components/views/Workspace';
import ModalName from './components/ModalName';
import GlobalLoader from './components/GlobalLoader';
import QRCode from 'qrcode';

function AppContent() {
  const { appState, roomCode, engine, toasts, setToasts, isLoading, loadingMessage, serverStatus } = useWebRTC();
  const [modalAction, setModalAction] = useState(null); // 'create' or 'join'
  const [joinCodeTarget, setJoinCodeTarget] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room && appState === 'landing') {
      setJoinCodeTarget(room);
      setModalAction('join');
    }
  }, [appState]);

  const handleCreateClick = () => {
    setModalAction('create');
  };

  const handleJoinClick = (code) => {
    if (!code) return;
    setJoinCodeTarget(code);
    setModalAction('join');
  };

  const handleModalClose = (name) => {
    if (name && modalAction === 'join') {
      engine.joinRoom(joinCodeTarget);
    }
    setModalAction(null);
  };

  return (
    <div className="min-h-screen bg-brand-surfaceDim text-brand-onSurface p-4 md:p-12 flex flex-col items-center selection:bg-brand-secondaryContainer selection:text-brand-onSurface">
      {/* Scanline overlay */}
      <div className="scanlines pointer-events-none fixed inset-0 z-50"></div>

      <div className="w-full max-w-5xl flex-grow flex flex-col">
        <Header />
        
        <main className="mt-8 md:mt-12 flex-grow relative">
          {appState === 'landing' && (
            <Landing onCreateClick={handleCreateClick} onJoinClick={handleJoinClick} />
          )}

          {appState === 'waiting' && (
            <Waiting roomCode={roomCode} onCancel={() => engine.cancelRoom()} />
          )}

          {appState === 'workspace' && (
            <Workspace onShowQR={() => setShowQR(true)} />
          )}

          {modalAction && (
            <ModalName actionType={modalAction} onClose={handleModalClose} />
          )}

          {showQR && (
            <div className="fixed inset-0 bg-brand-inverseSurface/80 z-[200] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-brand-surface p-8 shadow-[10px_10px_0px_#d3cabc] flex flex-col items-center border-4 border-brand-inverseSurface relative pt-12 max-w-sm w-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest flex items-center justify-center font-display text-[8px] uppercase text-brand-primary/60">
                  QR_Link.exe
                </div>
                
                <h3 className="font-display text-[10px] mb-6 text-brand-onSurface uppercase font-bold text-center">Scan to Join Room</h3>
                
                <div className="bg-white p-6 shadow-[6px_6px_0px_#d3cabc] mb-8 border-2 border-brand-inverseSurface/10">
                  <canvas ref={el => el && roomCode && QRCode.toCanvas(el, `${window.location.origin}?room=${roomCode}`, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })}></canvas>
                </div>
                
                <div className="font-display text-2xl text-brand-tertiary tracking-[0.2em] uppercase mb-8 bg-brand-surfaceHighest px-4 py-2 border-2 border-brand-outlineVariant/30">
                  {roomCode}
                </div>
                
                <button 
                  onClick={() => setShowQR(false)} 
                  className="w-full bg-brand-inverseSurface text-brand-surfaceLowest font-display text-xs py-3 uppercase transition-brutal shadow-[4px_4px_0px_#000] hover:bg-black"
                >
                  Terminate Viewer
                </button>
              </div>
            </div>
          )}
          {toasts.length > 0 && (
            <div id="toast-container" className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
              {toasts.map(toast => (
                <div 
                  key={toast.id} 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className={`toast toast-${toast.type} cursor-pointer pointer-events-auto`}
                >
                  {toast.message}
                </div>
              ))}
            </div>
          )}

          {(isLoading || serverStatus === 'waking') && (
            <GlobalLoader 
              message={loadingMessage} 
              isServerWarmup={serverStatus === 'waking'} 
            />
          )}

        </main>

        <Footer />
      </div>
    </div>
  );
}

export default AppContent;
