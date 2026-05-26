import { io } from 'socket.io-client';

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : window.location.origin);

export class KlicksEngine {
    constructor(callbacks) {
        this.socket = null;
        this.peerConnections = new Map();
        this.iceCandidateBuffer = new Map();
        this.iceServers = [];
        this.roomCode = null;
        this.isHost = false;
        
        // File Handling State
        this.chatChannels = new Map();
        this.fileChannels = new Map();
        this.incomingFiles = new Map();
        this.sendQueue = [];
        this.isSending = false;
        this.CHUNK_SIZE = 16 * 1024;
        this.MAX_BUFFER = 1 * 1024 * 1024;

        this.callbacks = callbacks || {
            onStateChange: () => {},
            onPeerListUpdate: () => {},
            onSystemMessage: () => {},
            onFileProgress: () => {},
            onFileComplete: () => {}
        };
        
        this.localName = sessionStorage.getItem('klicks_username') || 'Anonymous';
        this.localColor = '';
        this.selectedSize = 2;
        this.peerList = [];
        
        this.activeTransfers = new Map();
        this.sharedFiles = [];
        this.generatedUrls = new Set();
    }

    setLocalName(name) {
        this.localName = name;
        sessionStorage.setItem('klicks_username', name);
    }

    connectSocket(callback) {
        if (!this.socket) {
            this.socket = io(SIGNALING_SERVER, {
                transports: ['websocket', 'polling'],
                autoConnect: true
            });

            this.socket.on('connect', () => {
                console.log('Connected to signaling server');
                if (callback) callback();
            });

            this.socket.on('peer-list-updated', (data) => {
                this.peerList = data.peerList;
                this.callbacks.onPeerListUpdate(this.peerList);
            });

            this.socket.on('peer-joined', (data) => {
                this.callbacks.onSystemMessage({
                    sender: 'SYSTEM',
                    text: `[${data.name}] connected.`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: 'system'
                });
                this.handlePeerJoined(data);
            });

            this.socket.on('peer-left', (data) => {
                const peer = this.peerList.find(p => p.peerId === data.peerId);
                if (peer) {
                    this.callbacks.onSystemMessage({
                        sender: 'SYSTEM',
                        text: `[${peer.name}] disconnected.`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: 'system'
                    });
                }
                this.handlePeerLeft(data);
            });

            this.socket.on('signal-offer', this.handleOffer.bind(this));
            this.socket.on('signal-answer', this.handleAnswer.bind(this));
            this.socket.on('signal-ice-candidate', this.handleIceCandidate.bind(this));
            this.socket.on('error-message', (data) => window.showToast(data.message, 'error'));
            
            this.socket.on('room-killed', () => {
                window.showToast("Session killed by host.", 'info');
                this.cancelRoom();
            });
        } else if (this.socket.connected && callback) {
            callback();
        }
    }

    createRoom() {
        this.connectSocket(() => {
            const allowLateJoiners = this.allowLateJoinersSetting || false;
            this.socket.emit('create-room', { name: this.localName, maxSize: this.selectedSize, allowLateJoinerFiles: allowLateJoiners }, (response) => {
                if (response.success) {
                    this.roomCode = response.roomCode;
                    this.isHost = true;
                    this.iceServers = response.iceServers;
                    this.localColor = response.peerColor;
                    sessionStorage.setItem('klicks_session', JSON.stringify({
                        roomCode: this.roomCode,
                        name: this.localName,
                        timestamp: Date.now()
                    }));
                    this.callbacks.onStateChange('waiting', this.roomCode);
                } else {
                    window.showToast(response.error, 'error');
                }
            });
        });
    }

    joinRoom(code) {
        this.connectSocket(() => {
            this.socket.emit('join-room', { roomCode: code, name: this.localName }, (response) => {
                if (response.success) {
                    this.roomCode = response.roomCode;
                    this.isHost = false;
                    this.iceServers = response.iceServers;
                    this.localColor = response.peerColor;
                    sessionStorage.setItem('klicks_session', JSON.stringify({
                        roomCode: this.roomCode,
                        name: this.localName,
                        timestamp: Date.now()
                    }));
                    this.callbacks.onStateChange('workspace', this.roomCode);
                } else {
                    window.showToast(response.error, 'error');
                }
            });
        });
    }

    killRoom() {
        if (this.socket && this.roomCode) {
            this.socket.emit('kill-room', this.roomCode);
        }
    }

    cancelRoom() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.cleanupWebRTC();
        if (this.generatedUrls) {
            for (const url of this.generatedUrls) {
                URL.revokeObjectURL(url);
            }
            this.generatedUrls.clear();
        }
        this.clearOPFSStorage();
        sessionStorage.removeItem('klicks_session');
        this.sharedFiles = [];
        this.callbacks.onStateChange('landing', null);
    }

    initWebRTC(targetPeerId, isInitiator) {
        if (this.peerConnections.has(targetPeerId)) return this.peerConnections.get(targetPeerId);

        const pc = new RTCPeerConnection({ iceServers: this.iceServers });
        this.peerConnections.set(targetPeerId, pc);
        this.iceCandidateBuffer.set(targetPeerId, []);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('signal-ice-candidate', { targetPeerId, candidate: event.candidate });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected') {
                console.log(`Connection disconnected for peer ${targetPeerId}. Attempting ICE restart...`);
                this.attemptIceRestart(targetPeerId);
            } else if (pc.connectionState === 'failed') {
                console.log(`Connection failed for peer ${targetPeerId}. Cleaning up.`);
                this.cleanupWebRTC(targetPeerId);
            }
            this.callbacks.onPeerListUpdate(this.peerList);
        };

        if (isInitiator) {
            const chatChannel = pc.createDataChannel('klicks-chat', { ordered: true });
            const fileChannel = pc.createDataChannel('klicks-files', { ordered: true });
            fileChannel.binaryType = 'arraybuffer';
            fileChannel.bufferedAmountLowThreshold = this.MAX_BUFFER / 2;
            this.setupChatChannel(targetPeerId, chatChannel);
            this.setupFileChannel(targetPeerId, fileChannel);
        } else {
            pc.ondatachannel = (event) => {
                if (event.channel.label === 'klicks-chat') {
                    this.setupChatChannel(targetPeerId, event.channel);
                } else if (event.channel.label === 'klicks-files') {
                    event.channel.binaryType = 'arraybuffer';
                    event.channel.bufferedAmountLowThreshold = this.MAX_BUFFER / 2;
                    this.setupFileChannel(targetPeerId, event.channel);
                }
            };
        }

        return pc;
    }

    async handlePeerJoined(data) {
        this.callbacks.onStateChange('workspace', this.roomCode);
        const pc = this.initWebRTC(data.peerId, true);
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.socket.emit('signal-offer', { targetPeerId: data.peerId, offer: pc.localDescription });
        } catch (err) {
            console.error('Offer error:', err);
        }
    }

    async handleOffer(data) {
        const { senderPeerId, offer } = data;
        const pc = this.initWebRTC(senderPeerId, false);
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await this.drainIceCandidates(senderPeerId);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.socket.emit('signal-answer', { targetPeerId: senderPeerId, answer: pc.localDescription });
        } catch (err) {
            console.error('Answer error:', err);
        }
    }

    async handleAnswer(data) {
        const { senderPeerId, answer } = data;
        const pc = this.peerConnections.get(senderPeerId);
        if (!pc) return;
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await this.drainIceCandidates(senderPeerId);
        } catch (err) {
            console.error('Set answer error:', err);
        }
    }

    async handleIceCandidate(data) {
        const { senderPeerId, candidate } = data;
        const pc = this.peerConnections.get(senderPeerId);
        try {
            if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                const buffer = this.iceCandidateBuffer.get(senderPeerId) || [];
                buffer.push(candidate);
                this.iceCandidateBuffer.set(senderPeerId, buffer);
            }
        } catch (err) {}
    }

    async drainIceCandidates(peerId) {
        const pc = this.peerConnections.get(peerId);
        if (!pc) return;
        const buffer = this.iceCandidateBuffer.get(peerId) || [];
        for (const candidate of buffer) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
        }
        this.iceCandidateBuffer.set(peerId, []);
    }

    handlePeerLeft(data) {
        this.cleanupWebRTC(data.peerId);
        if (this.peerConnections.size === 0) {
            this.callbacks.onStateChange('waiting', this.roomCode);
        }
    }

    cleanupWebRTC(peerId) {
        if (peerId) {
            const pc = this.peerConnections.get(peerId);
            if (pc) {
                pc.close();
                this.peerConnections.delete(peerId);
                this.iceCandidateBuffer.delete(peerId);
                this.chatChannels.delete(peerId);
                this.fileChannels.delete(peerId);
                this.incomingFiles.delete(peerId);
            }
        } else {
            for (const pc of this.peerConnections.values()) pc.close();
            this.peerConnections.clear();
            this.iceCandidateBuffer.clear();
            this.chatChannels.clear();
            this.fileChannels.clear();
            this.incomingFiles.clear();
        }
    }

    async attemptIceRestart(targetPeerId) {
        const pc = this.peerConnections.get(targetPeerId);
        if (!pc) return;
        try {
            const offer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(offer);
            this.socket.emit('signal-offer', { targetPeerId, offer: pc.localDescription });
        } catch (err) {
            console.error('ICE restart offer creation failed:', err);
            this.cleanupWebRTC(targetPeerId);
        }
    }

    attemptSessionRecovery(roomCode, name) {
        this.localName = name;
        this.connectSocket(() => {
            this.socket.emit('join-room', { roomCode, name }, (response) => {
                if (response.success) {
                    this.roomCode = response.roomCode;
                    this.isHost = false;
                    this.iceServers = response.iceServers;
                    this.localColor = response.peerColor;
                    
                    // Recover previous file logs if enabled
                    if (response.sharedFilesLog && response.sharedFilesLog.length > 0) {
                        const loggedFiles = response.sharedFilesLog.map(entry => ({
                            name: entry.name,
                            size: entry.size,
                            sender: entry.senderName,
                            isBeforeJoined: true,
                            time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }));
                        this.sharedFiles = [...loggedFiles];
                        this.callbacks.onFileComplete(this.sharedFiles);
                    }

                    sessionStorage.setItem('klicks_session', JSON.stringify({
                        roomCode: this.roomCode,
                        name: this.localName,
                        timestamp: Date.now()
                    }));
                    this.callbacks.onStateChange('workspace', this.roomCode);
                    window.showToast('Session restored.', 'success');
                } else {
                    sessionStorage.removeItem('klicks_session');
                    this.callbacks.onStateChange('landing', null);
                }
            });
        });
    }

    async clearOPFSStorage() {
        if (navigator.storage && navigator.storage.getDirectory) {
            try {
                const root = await navigator.storage.getDirectory();
                for await (const name of root.keys()) {
                    await root.removeEntry(name, { recursive: true });
                }
                console.log("OPFS sandbox storage cleared.");
            } catch (e) {
                console.warn("Failed to clear OPFS storage:", e);
            }
        }
    }

    async removeSharedFile(index) {
        if (index >= 0 && index < this.sharedFiles.length) {
            const file = this.sharedFiles[index];
            if (file.url) {
                URL.revokeObjectURL(file.url);
                this.generatedUrls.delete(file.url);
            }
            if (file.isOPFS && file.id && navigator.storage && navigator.storage.getDirectory) {
                try {
                    const root = await navigator.storage.getDirectory();
                    await root.removeEntry(file.id);
                    console.log("OPFS storage entry cleared for file ID:", file.id);
                } catch (e) {
                    console.warn("Failed to delete OPFS storage entry:", e);
                }
            }
            this.sharedFiles.splice(index, 1);
            this.callbacks.onFileComplete(this.sharedFiles);
        }
    }

    unsendFile(fileName) {
        const payload = JSON.stringify({ type: 'file-unsend', name: fileName });
        for (const channel of this.fileChannels.values()) {
            if (channel.readyState === 'open') {
                try {
                    channel.send(payload);
                } catch (e) {
                    console.error("Error sending unsend instruction:", e);
                }
            }
        }
        const index = this.sharedFiles.findIndex(f => f.name === fileName && f.sender === 'You');
        if (index !== -1) {
            this.removeSharedFile(index);
        }
    }

    setupChatChannel(peerId, channel) {
        this.chatChannels.set(peerId, channel);
        channel.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const peer = this.peerList.find(p => p.peerId === peerId);
            if (peer) {
                this.callbacks.onSystemMessage({
                    sender: peer.name,
                    text: data.text,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: 'peer'
                });
            }
        };
    }

    sendChatMessage(text) {
        this.callbacks.onSystemMessage({
            sender: 'You',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'self'
        });
        
        const payload = JSON.stringify({ text });
        for (const channel of this.chatChannels.values()) {
            if (channel.readyState === 'open') {
                channel.send(payload);
            }
        }
    }

    // -- File Handling (stripped to logic only) -- //
    setupFileChannel(peerId, channel) {
        this.fileChannels.set(peerId, channel);
        channel.onmessage = (event) => this.handleIncomingData(peerId, event);
    }

    async handleIncomingData(peerId, event) {
        if (typeof event.data === 'string') {
            const meta = JSON.parse(event.data);
            if (meta.type === 'file-metadata') {
                const state = {
                    name: meta.name,
                    size: meta.size,
                    checksum: meta.checksum,
                    receivedSize: 0,
                    chunks: [],
                    id: meta.id,
                    useOPFS: false,
                    opfsWritable: null,
                    initPromise: null
                };

                if (navigator.storage && navigator.storage.getDirectory) {
                    state.initPromise = (async () => {
                        try {
                            const root = await navigator.storage.getDirectory();
                            try { await root.removeEntry(meta.id); } catch(e) {}
                            const fileHandle = await root.getFileHandle(meta.id, { create: true });
                            state.opfsWritable = await fileHandle.createWritable();
                            state.useOPFS = true;
                            console.log("OPFS storage streams allocated for receiving:", meta.name);
                        } catch (e) {
                            console.warn("OPFS stream allocation failed, using RAM fallback:", e);
                            state.useOPFS = false;
                        }
                    })();
                }

                this.incomingFiles.set(peerId, state);
                this.updateTransferUI(meta.id, meta.name, 'Receiving', 0);
            } else if (meta.type === 'file-complete') {
                await this.assembleFile(peerId);
            } else if (meta.type === 'file-unsend') {
                const index = this.sharedFiles.findIndex(f => f.name === meta.name);
                if (index !== -1) {
                    await this.removeSharedFile(index);
                }
            }
        } else {
            const state = this.incomingFiles.get(peerId);
            if (state) {
                if (state.initPromise) {
                    await state.initPromise;
                    state.initPromise = null;
                }

                if (state.useOPFS && state.opfsWritable) {
                    try {
                        await state.opfsWritable.write(event.data);
                    } catch (writeErr) {
                        console.warn("OPFS write failed, falling back to RAM:", writeErr);
                        state.useOPFS = false;
                        try { await state.opfsWritable.close(); } catch(e) {}
                        state.opfsWritable = null;
                        state.chunks.push(event.data);
                    }
                } else {
                    state.chunks.push(event.data);
                }

                state.receivedSize += event.data.byteLength;
                const progress = Math.min(100, Math.round((state.receivedSize / state.size) * 100));
                this.updateTransferUI(state.id, state.name, 'Receiving', progress);
            }
        }
    }

    updateTransferUI(id, name, type, progress) {
        const transfer = { id, name, type, progress };
        this.activeTransfers.set(id, transfer);
        this.callbacks.onFileProgress(Array.from(this.activeTransfers.values()));
    }

    async assembleFile(peerId) {
        const state = this.incomingFiles.get(peerId);
        if (!state) return;
        
        if (state.initPromise) {
            await state.initPromise;
        }
        
        let fileBlobOrObj;
        let url;
        
        if (state.useOPFS && state.opfsWritable) {
            try {
                await state.opfsWritable.close();
                const root = await navigator.storage.getDirectory();
                const fileHandle = await root.getFileHandle(state.id);
                fileBlobOrObj = await fileHandle.getFile();
                url = URL.createObjectURL(fileBlobOrObj);
                console.log("File successfully assembled from OPFS sandbox:", state.name);
            } catch (e) {
                console.warn("OPFS assembly failed, converting RAM chunks:", e);
                fileBlobOrObj = new Blob(state.chunks);
                url = URL.createObjectURL(fileBlobOrObj);
            }
        } else {
            fileBlobOrObj = new Blob(state.chunks);
            url = URL.createObjectURL(fileBlobOrObj);
        }
        
        this.generatedUrls.add(url);
        
        const peer = this.peerList.find(p => p.peerId === peerId);
        const senderName = peer ? peer.name : 'Unknown';

        const fileRecord = { 
            name: state.name, 
            size: state.size, 
            url, 
            sender: senderName,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: state.id,
            isOPFS: state.useOPFS
        };
        this.sharedFiles.push(fileRecord);
        this.callbacks.onFileComplete(this.sharedFiles);
        
        this.callbacks.onSystemMessage({
            sender: 'SYSTEM',
            text: `[${senderName.toUpperCase()}] sent file: "${state.name}" (${this.formatSize(state.size)})`,
            time: fileRecord.time,
            type: 'system'
        });
        
        const t = this.activeTransfers.get(state.id);
        if (t) {
            t.progress = 100;
            this.callbacks.onFileProgress(Array.from(this.activeTransfers.values()));
            setTimeout(() => {
                this.activeTransfers.delete(state.id);
                this.callbacks.onFileProgress(Array.from(this.activeTransfers.values()));
            }, 3000);
        }

        this.incomingFiles.delete(peerId);
    }

    handleFilesSelect(files) {
        if (this.fileChannels.size === 0) {
            window.showToast("No peers connected.", 'error');
            return;
        }
        Array.from(files).forEach(file => this.sendQueue.push(file));
        if (!this.isSending) this.processQueue();
    }

    async processQueue() {
        this.isSending = true;
        while (this.sendQueue.length > 0) {
            const file = this.sendQueue.shift();
            await this.sendFile(file);
        }
        this.isSending = false;
    }

    async sendFile(file) {
        const id = Math.random().toString(36).substr(2, 9);
        this.updateTransferUI(id, file.name, 'Sending', 0);

        // For large files, calculating SHA-256 by loading the whole file into an ArrayBuffer causes out-of-memory crashes.
        // We omit full-file checksums and rely on SCTP's built-in reliability for chunks.
        const checksum = 'omitted-for-performance';

        const metaPayload = JSON.stringify({ type: 'file-metadata', name: file.name, size: file.size, checksum, id });
        
        for (const channel of this.fileChannels.values()) {
            if (channel.readyState === 'open') channel.send(metaPayload);
        }

        let offset = 0;
        
        const readChunk = (file, offset, size) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsArrayBuffer(file.slice(offset, offset + size));
            });
        };

        while (offset < file.size) {
            const slice = await readChunk(file, offset, this.CHUNK_SIZE);
            for (const channel of this.fileChannels.values()) {
                if (channel.readyState === 'open') {
                    if (channel.bufferedAmount > this.MAX_BUFFER) {
                        await new Promise(resolve => {
                            const listener = () => {
                                channel.removeEventListener('bufferedamountlow', listener);
                                resolve();
                            };
                            channel.addEventListener('bufferedamountlow', listener);
                        });
                    }
                    try { channel.send(slice); } catch (e) { break; }
                }
            }
            offset += this.CHUNK_SIZE;
            const progress = Math.min(100, Math.round((offset / file.size) * 100));
            this.updateTransferUI(id, file.name, 'Sending', progress);
        }

        const completePayload = JSON.stringify({ type: 'file-complete' });
        for (const channel of this.fileChannels.values()) {
            if (channel.readyState === 'open') channel.send(completePayload);
        }

        const sentUrl = URL.createObjectURL(file);
        this.generatedUrls.add(sentUrl);
        const fileRecord = { 
            name: file.name, 
            size: file.size, 
            url: sentUrl, 
            sender: 'You', 
            originalFile: file,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.sharedFiles.push(fileRecord);
        this.callbacks.onFileComplete(this.sharedFiles);

        this.callbacks.onSystemMessage({
            sender: 'SYSTEM',
            text: `[YOU] sent file: "${file.name}" (${this.formatSize(file.size)})`,
            time: fileRecord.time,
            type: 'system'
        });

        if (this.socket) {
            this.socket.emit('file-sent-log', {
                name: file.name,
                size: file.size,
                senderName: this.localName
            });
        }

        setTimeout(() => {
            this.activeTransfers.delete(id);
            this.callbacks.onFileProgress(Array.from(this.activeTransfers.values()));
        }, 3000);
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
