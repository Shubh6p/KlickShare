import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { KlicksEngine } from '../lib/klicks-engine';

const WebRTCContext = createContext(null);

export const useWebRTC = () => useContext(WebRTCContext);

export const WebRTCProvider = ({ children }) => {
    const [appState, setAppState] = useState('landing'); // landing, waiting, workspace
    const [roomCode, setRoomCode] = useState(null);
    const [peerList, setPeerList] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [activeTransfers, setActiveTransfers] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Keep references to state setters so engine can call them without stale closures
    const setters = useRef({
        setAppState,
        setRoomCode,
        setPeerList,
        setChatMessages,
        setActiveTransfers,
        setSharedFiles,
        setIsHost
    });

    // Initialize engine once
    const [engine] = useState(() => new KlicksEngine({
        onStateChange: (state, code) => {
            setters.current.setAppState(state);
            if (code) setters.current.setRoomCode(code);
            // After state change, engine.isHost should be set, so update context
            setters.current.setIsHost(engine.isHost);
        },
        onPeerListUpdate: (peers) => {
            setters.current.setPeerList([...peers]);
        },
        onSystemMessage: (msg) => {
            setters.current.setChatMessages(prev => [...prev, msg]);
        },
        onFileProgress: (transfers) => {
            setters.current.setActiveTransfers([...transfers]);
        },
        onFileComplete: (files) => {
            setters.current.setSharedFiles([...files]);
        }
    }));

    useEffect(() => {
        window.showToast = (message, type = 'info', duration = 3500) => {
            const id = Math.random().toString(36).substring(2, 9);
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        };
        return () => {
            delete window.showToast;
            engine.cancelRoom();
        };
    }, [engine]);

    useEffect(() => {
        const saved = sessionStorage.getItem('klicks_session');
        if (saved) {
            try {
                const session = JSON.parse(saved);
                const age = Date.now() - session.timestamp;
                if (session.roomCode && session.name && age < 30 * 60 * 1000) {
                    engine.attemptSessionRecovery(session.roomCode, session.name);
                } else {
                    sessionStorage.removeItem('klicks_session');
                }
            } catch (e) {
                sessionStorage.removeItem('klicks_session');
            }
        }
    }, [engine]);

    const value = {
        appState,
        roomCode,
        peerList,
        chatMessages,
        activeTransfers,
        sharedFiles,
        isHost,
        engine,
        toasts,
        setToasts
    };

    return (
        <WebRTCContext.Provider value={value}>
            {children}
        </WebRTCContext.Provider>
    );
};
