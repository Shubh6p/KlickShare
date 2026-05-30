<div align="center">

```
A:\> KLICKS_CLIENT_REACT.EXE█
LOADING MODULES...
React 19         ✓
Vite 8           ✓
WebRTCContext    ✓
KlicksEngine     ✓
OPFS Storage     ✓
Full Mesh P2P    ✓
```

# 🖥️ Klicks — Frontend `v2`

### *We rewrote it in React. The scanlines stayed. Non-negotiable.*

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vite.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square)](https://tailwindcss.com)
[![WebRTC](https://img.shields.io/badge/WebRTC-Full%20Mesh-orange?style=flat-square)](https://webrtc.org)
[![OPFS](https://img.shields.io/badge/Storage-OPFS%20%2B%20RAM%20Fallback-green?style=flat-square)](https://web.dev/opfs)
[![No Login](https://img.shields.io/badge/Login-Still%20No-red?style=flat-square)](.)

</div>

---

## 🆕 What Changed From v1

v1 was vanilla JS. Five script tags loading in order. No framework, no build step, no module system. It was honest and it worked.

v2 is React 19 + Vite. The retro terminal aesthetic is completely unchanged — same scanlines, same Press Start 2P font, same brand color tokens, same general vibe. What changed is everything underneath.

| v1 (Vanilla JS) | v2 (React + Vite) |
|---|---|
| 5 script tags, load order matters | Proper module graph via Vite |
| `document.addEventListener` for cross-module comms | React Context (`WebRTCContext`) for shared state |
| DOM manipulation directly in JS modules | Declarative React components |
| No build step — just open `index.html` | `npm run dev` / `npm run build` |
| In-memory file assembly only (RAM) | **OPFS-first** with RAM fallback for large files |
| Single peer connection | Full mesh — `peerConnections Map<peerId, RTCPeerConnection>` |
| ICE candidates added immediately (buggy) | ICE candidate buffer + drain after `setRemoteDescription` |
| No session recovery | Page-refresh auto-rejoin from `sessionStorage` |
| `alert()` for errors | React state toast system via `window.showToast` |
| No server warmup detection | `GlobalLoader` + `/health` check on startup |
| No host identity | `[HOST]` tag in peer list, `killRoom()` for host |
| QR via `qrcodejs` CDN | QR via `qrcode` npm package, rendered on `<canvas>` |

---

## 📁 Folder Structure

```
client-react/
│
├── 📄 index.html              ← Vite entry point. Just a div#root, nothing interesting.
├── ⚙️  vite.config.js          ← Vite config. @vitejs/plugin-react. That's it.
├── 🎨 tailwind.config.js      ← Brand token definitions. Do not touch the colors.
├── 📦 package.json
│
└── src/
    ├── 🚀 main.jsx             ← ReactDOM.createRoot. Wraps app in WebRTCProvider.
    ├── 🧩 App.jsx              ← Root component. View routing, toast rendering, QR modal.
    ├── 🎨 App.css              ← Empty. Tailwind handles everything.
    ├── 🎨 index.css            ← Global base styles, scanlines, animations, scrollbar.
    │
    ├── 🧠 context/
    │   └── WebRTCContext.jsx   ← The brain. All shared state + engine instance.
    │
    ├── ⚙️  lib/
    │   └── klicks-engine.js    ← Pure JS class. All WebRTC, socket, and file logic.
    │
    └── 🧱 components/
        ├── Header.jsx          ← `A:\> KLICKS.EXE█` bar. Shows logged-in name.
        ├── Footer.jsx          ← Protocol info, credits, E2EE badge.
        ├── ModalName.jsx       ← Name entry + room size + late joiner toggle.
        ├── GlobalLoader.jsx    ← Full-screen loader. Handles server warmup state.
        │
        └── views/
            ├── Landing.jsx     ← HOST SESSION / JOIN SESSION cards. Join has 2-step flow.
            ├── Waiting.jsx     ← Room code display, QR, copy link, abort.
            └── Workspace.jsx   ← 3-panel layout: peers | chat | file transfers.
```

---

## 🏗️ Architecture — How It All Connects

```
main.jsx
  └── WebRTCProvider (WebRTCContext.jsx)
        │
        ├── KlicksEngine instance  ←─── pure JS class, lives outside React
        │     (lib/klicks-engine.js)       reads/writes via callbacks only
        │
        ├── React state (useState)
        │     appState, roomCode, peerList, chatMessages,
        │     activeTransfers, sharedFiles, isHost,
        │     toasts, isLoading, loadingMessage, serverStatus
        │
        └── App.jsx (consumes context via useWebRTC())
              │
              ├── view routing: landing / waiting / workspace
              ├── ModalName (shown over any view)
              ├── QR modal (shown over workspace)
              ├── Toast container (top-right, always)
              └── GlobalLoader (full-screen, on isLoading or serverStatus=waking)
```

### Why `KlicksEngine` is a plain JS class (not a hook)

WebRTC peer connections are stateful, long-lived objects. React's state model is not a good fit for them — you don't want React re-rendering every time a DataChannel fires a message or an ICE candidate arrives. `KlicksEngine` lives outside the React tree, holds the raw WebRTC state, and communicates back into React via **callbacks** passed in at construction time. React state only updates when something user-visible changes (peer joins, file completes, transfer progress, etc.). Everything else happens in the engine without touching React.

---

## 🧠 `WebRTCContext.jsx` — The State Hub

Every component in the app reads from this context via the `useWebRTC()` hook. Nothing goes through props.

### What's in the context

| Value | Type | What it is |
|---|---|---|
| `appState` | `'landing' \| 'waiting' \| 'workspace'` | Which view is shown |
| `roomCode` | `string \| null` | Active room code |
| `peerList` | `[{ peerId, name, color, isHost }]` | Everyone in the room |
| `chatMessages` | `[{ sender, text, time, type }]` | All chat + system messages |
| `activeTransfers` | `[{ id, name, type, progress }]` | In-progress sends/receives |
| `sharedFiles` | `[{ name, size, url, sender, time, id, isOPFS }]` | Completed transfers this session |
| `isHost` | `boolean` | Whether current user created the room |
| `engine` | `KlicksEngine` | The engine instance — call methods on this |
| `toasts` | `[{ id, message, type }]` | Active toast notifications |
| `isLoading` | `boolean` | Show `GlobalLoader` overlay |
| `loadingMessage` | `string` | Text shown in the loader |
| `serverStatus` | `'checking' \| 'waking' \| 'ready'` | Server warmup state |

### How the engine talks back to React

```javascript
// Engine is initialized once with callback functions.
// The callbacks are stored in a useRef so the engine always sees
// the latest setters without stale closure issues.

const [engine] = useState(() => new KlicksEngine({
    onStateChange: (state, code) => { setAppState(state); ... },
    onPeerListUpdate: (peers) => { setPeerList([...peers]); },
    onSystemMessage: (msg) => { setChatMessages(prev => [...prev, msg]); },
    onFileProgress: (transfers) => { setActiveTransfers([...transfers]); },
    onFileComplete: (files) => { setSharedFiles([...files]); },
    onLoadingChange: (loading, message) => { setIsLoading(loading); ... }
}));
```

### Server warmup detection

On mount, `WebRTCContext` hits `GET /health` on the signaling server. If the response takes more than 500ms, `serverStatus` switches to `'waking'` and `GlobalLoader` shows a "server is waking up from sleep" message (because the backend is on Render free tier and it cold-starts). Once the health check resolves, the loader disappears and the user can proceed normally. This is purely a UX courtesy — the socket will connect fine once the server is up.

### Session recovery on mount

```javascript
useEffect(() => {
  const saved = sessionStorage.getItem('klicks_session');
  if (saved) {
    const session = JSON.parse(saved);
    const age = Date.now() - session.timestamp;
    // Only attempt recovery if session is less than 30 minutes old
    if (session.roomCode && session.name && age < 30 * 60 * 1000) {
      engine.attemptSessionRecovery(session.roomCode, session.name);
    }
  }
}, [engine]);
```

If recovery succeeds, the user lands directly in the workspace. If the room no longer exists on the server, it silently clears the session and stays on landing. No error, no drama.

---

## ⚙️ `KlicksEngine` — The Core (`lib/klicks-engine.js`)

This is the largest and most important file. It's a pure JS class with zero React dependencies. Here's what it manages:

### WebRTC Mesh

```javascript
this.peerConnections = new Map();   // peerId → RTCPeerConnection
this.iceCandidateBuffer = new Map(); // peerId → [RTCIceCandidateInit]
this.chatChannels = new Map();       // peerId → RTCDataChannel
this.fileChannels = new Map();       // peerId → RTCDataChannel
```

When a peer joins, the existing peer creates an offer and two DataChannels (`klicks-chat` and `klicks-files`). The joiner receives them via `pc.ondatachannel`. Each peer connection is independent — in a 4-person room, each client maintains 3 simultaneous peer connections.

### ICE Candidate Buffer (fixed from v1)

```javascript
// Before: addIceCandidate called immediately → silent failures on many networks
// Now: buffer until remoteDescription is set, then drain

async handleIceCandidate({ senderPeerId, candidate }) {
    const pc = this.peerConnections.get(senderPeerId);
    if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
        this.iceCandidateBuffer.get(senderPeerId)?.push(candidate);
    }
}
// drainIceCandidates() called after setRemoteDescription in handleOffer and handleAnswer
```

### ICE Restart on Disconnect

When `pc.connectionState === 'disconnected'` (temporary network hiccup), the engine automatically attempts an ICE restart — creates a new offer with `{ iceRestart: true }` and sends it to the peer. If the connection reaches `'failed'` (hard failure), it shows an error toast and cleans up. This is a real-world reliability improvement over v1's silent failure.

### Robust ICE Server Config

The engine ships with 11 fallback ICE servers hardcoded:
- 5 Google STUN servers
- Mozilla STUN
- Metered.ca STUN + 4 TURN entries (TCP, UDP, port 80, port 443, TURNS over TCP)

These kick in if the backend's ICE server config is missing or outdated. The TURN credentials are from Metered.ca free tier. In production the backend's `/health` response provides the authoritative ICE config — the fallbacks are a safety net for when the backend hasn't woken up yet.

### OPFS File Storage (new in v2)

Large files can't always be held in RAM. v2 uses the **Origin Private File System API** to stream incoming file chunks directly to disk:

```
Receiving file-metadata
    │
    ├── navigator.storage.getDirectory() → OPFS sandbox
    ├── fileHandle.createWritable() → stream
    │
    Incoming ArrayBuffer chunks
    │
    ├── OPFS available → write chunk to stream directly (no RAM usage)
    └── OPFS fails / unavailable → push chunk to chunks[] (RAM fallback)
    │
    file-complete received
    │
    ├── OPFS: close writable → getFile() → createObjectURL
    └── RAM: new Blob(chunks) → createObjectURL
```

When the session ends (`cancelRoom()`), the engine calls `clearOPFSStorage()` which iterates and removes every entry in the OPFS sandbox. No files linger after the session is closed.

When a file is dismissed from the shared panel (`removeSharedFile()`), its object URL is revoked and the OPFS entry is individually deleted. Memory is freed as you go.

### File Transfer Queue

Files are sent one at a time via `processQueue()`. Dropping 10 files at once queues them — each starts after the previous one completes. This avoids DataChannel buffer overflow from concurrent large transfers.

### Chunk Size + Backpressure

- **Chunk size:** 16 KB (`CHUNK_SIZE = 16 * 1024`)
- **Max buffer:** 1 MB (`MAX_BUFFER = 1 * 1024 * 1024`)
- Before sending each chunk: if `channel.bufferedAmount > MAX_BUFFER`, wait for `bufferedamountlow` event
- `bufferedAmountLowThreshold` set to `MAX_BUFFER / 2` on each file channel

### Why there's no SHA-256 checksum

```javascript
// Comment from the engine source:
// For large files, calculating SHA-256 by loading the whole file into
// an ArrayBuffer causes out-of-memory crashes.
// We omit full-file checksums and rely on SCTP's built-in reliability for chunks.
const checksum = 'omitted-for-performance';
```

WebRTC DataChannel uses SCTP, which provides ordered, reliable delivery with built-in retransmission. Chunks arrive complete and in order or not at all. For typical file sizes this is sufficient. SHA-256 verification makes sense for very large files where partial corruption could go undetected — but computing it for a 2GB video would crash the browser tab before the transfer even starts.

### Unsend (Undo) Feature

```javascript
unsendFile(fileName) {
    // 1. Send 'file-unsend' JSON message over all open file channels
    // 2. Receiver handles it: removes that file from their sharedFiles list
    //    and calls removeSharedFile() to revoke the URL + delete OPFS entry
    // 3. Remove from sender's own sharedFiles list too
}
```

The `↩ UNDO` button in the workspace calls this. Only shown for files where `file.sender === 'You'`.

---

## 🧱 Components

### `App.jsx` — Root

Consumes `WebRTCContext`. Does three jobs:
1. **View routing** — renders `<Landing>`, `<Waiting>`, or `<Workspace>` based on `appState`
2. **URL param handling** — on mount, if `?room=XXX` is in the URL, auto-opens the name modal pre-filled with that code
3. **Modal/overlay management** — `ModalName`, QR modal, toast container, `GlobalLoader` are all rendered here and layered via z-index

### `Landing.jsx` — Two-step join flow

The landing page has two cards: HOST SESSION and JOIN SESSION. The join card is a 2-step flow:
- Step 0: the card shows a "JOIN ROOM" button
- Step 1: clicking it transitions to a focused input view (`animate-view-fade`) where the user types the `XXX-XXX` code and confirms

The code input auto-formats as you type: strips non-alphanumeric, uppercases, inserts the `-` after character 3. No submit required — just typing and clicking JOIN ROOM.

### `Waiting.jsx` — The host's holding room

Shows the room code in a large display with a copy button. Two action buttons sit side-by-side:
- **GENERATE QR CODE** — toggles an inline canvas QR (no external QR service, generated locally via `qrcode` npm package)
- **COPY ROOM LINK** — copies `https://your-domain.com?room=ROOMCODE` with a `document.execCommand` fallback for browsers where `navigator.clipboard` isn't available

### `ModalName.jsx` — Identity + session settings

Appears over any view before creating or joining. Contains:
- **Callsign input** — the name field. Pre-fills from `sessionStorage`. Empty name blocked with inline error. Enter key submits.
- **MAX MEMBERS** select — only shown when `actionType === 'create'`. Dropdown from 2 to 10.
- **LATE JOINER FILES toggle** — only shown when `actionType === 'create'`. Custom toggle button using Tailwind state classes.

On confirm: name saved to `sessionStorage` and `engine.localName`. If creating, sets `engine.selectedSize` and `engine.allowLateJoinersSetting` before calling `engine.createRoom()`.

### `Workspace.jsx` — Three-panel layout (CSS Grid)

```
lg:grid-cols-12

[Left: col-span-3]   [Center: col-span-5]   [Right: col-span-4]
 Uplink Status         Comm-Log.sys           Data Transfer
 Protocol Info         (Chat panel)           (Files panel)
 Kill/Leave btn        Dark terminal bg       Drop zone + queue
```

**Left panel:**
- Live peer list with connection state labels (ACTIVE / CONNECTED / CONNECTING with `data-connecting` animation)
- `[HOST]` tag on the host peer
- `(YOU)` label on the local peer
- "Show Uplink QR" button triggers QR modal in `App.jsx` via `onShowQR` prop
- Protocol Info section: Room ID + copy, share link + copy, ENC type, topology mode
- **Kill Session** button for host (calls `engine.killRoom()` + `engine.cancelRoom()` + reload) or **Leave Session** for non-hosts

**Center panel:**
- Dark `bg-brand-inverseSurface` background to distinguish it from the rest of the UI
- System messages (peer joined/left, file transferred) shown as centered italic `*** text ***`
- Chat messages show `[SENDER_NAME] HH:MM` as header with the message below
- Custom `custom-scrollbar` (dark track, green thumb, orange on hover)
- Enter to send

**Right panel:**
- **Active transfers (Live Stream section):** progress bar per in-flight transfer, animated fill, sender/receiver label
- **Completed transfers (Transferred Data section):** newest first. Two states:
  - `isBeforeJoined: true` — dashed border, `BEFORE JOIN` tag, greyed out, no download button (file data was never received)
  - Normal — shows `↩ UNDO` + `SEND AGAIN` for sent files, `DOWNLOAD` for received files
- **Drop zone** (react-dropzone): `isDragActive` triggers `dropzone-pulse-active` class. Accepts one file at a time — selecting a file shows a preview card, clicking "Dispatch Datablock" sends it.

### `GlobalLoader.jsx` — Full-screen loader

Covers the entire viewport with `bg-brand-inverseSurface/95`. Includes a scanline overlay at 50% opacity. Runs a terminal-style ASCII spinner: `[ - ]` → `[ \ ]` → `[ | ]` → `[ / ]` cycling every 150ms. Two modes:
- **Normal loading** — shows `loadingMessage` from context (e.g. "INITIALIZING ROOM...", "CONNECTING TO PEER...")
- **Server warmup** — shows "SERVER REBOOTING - CONNECTING..." + an explanatory note about Render free tier cold starts

### `Header.jsx`

The `A:\> KLICKS.EXE` bar with the blinking cursor block (`animate-pulse`). Shows `NODE: [USERNAME]` in the top right when a name is set. Clicking the logo reloads the page (`window.location.href = window.location.origin`).

---

## 🎨 Design System

The retro terminal aesthetic is defined entirely in `tailwind.config.js`. **Do not hardcode colors anywhere.** Use the tokens.

### Color Tokens

| Token | Hex | Used for |
|---|---|---|
| `brand-surface` | `#fcfaf6` | Card backgrounds |
| `brand-surfaceDim` | `#e8e4d9` | Page background |
| `brand-surfaceLowest` | `#ffffff` | Text on dark backgrounds |
| `brand-surfaceHighest` | `#e1dcd0` | Input backgrounds, code blocks |
| `brand-inverseSurface` | `#0a0a0a` | Header, dark cards, chat panel |
| `brand-primary` | `#000000` | Primary text |
| `brand-secondary` | `#4d5d36` | Success, progress, active state |
| `brand-secondaryDim` | `#3e4a2b` | Hover state for secondary |
| `brand-tertiary` | `#ff8800` | Accent, links, room code display |
| `brand-onSurface` | `#000000` | Body text |
| `brand-outlineVariant` | `#d3cabc` | Borders, dividers, box shadows |

### Typography

- `font-display` → Press Start 2P — all headings, labels, buttons, room codes
- `font-mono` → Space Mono — body text, chat messages, file names, input fields

### Animation classes (defined in `index.css`)

| Class | Animation | Used on |
|---|---|---|
| `.transition-brutal` | 0.1s ease + active translateY/X 2px | All interactive buttons |
| `.animate-view-fade` | `slideUp` 0.4s — fade in from below | Each view on mount |
| `.animate-fade-in` | `fadeIn` — opacity 0→1 | Modals, toast, loader overlays |
| `.scanlines` | Fixed-position CRT scanline overlay | Injected in `App.jsx` and `GlobalLoader` |
| `.vintage-cursor::after` | `█` with `blink` keyframe | Header cursor |
| `.dropzone-pulse` | Defined via Tailwind animate | Drop zone active state |
| `animate-pulse` | Tailwind built-in | Cursor block in header, heart in footer |
| `animate-spin` | Tailwind built-in | `Loader2` icon in Waiting view |

### The Floppy Tab Detail

Every card component has a decorative tab at the top — a small rectangle using `bg-brand-surfaceHigh border-x-2 border-b-2 border-brand-surfaceHighest`. It's positioned `absolute top-0` with the card having `relative pt-10` or `pt-12` to make room. This is the consistent design element that makes every card look like a floppy disk label. Keep it on all new cards.

---

## ⚙️ Configuration

One environment variable:

```env
VITE_SIGNALING_SERVER=https://your-backend-url.onrender.com
```

Create a `.env` file in `client-react/` root. If not set, the engine auto-detects:
- `localhost` / `127.0.0.1` → `http://localhost:3000`
- Anything else → `https://klickshare-backend.onrender.com` (the production default)

---

## 🚀 Running Locally

```bash
cd client-react
npm install
npm run dev
```

Vite starts on `http://localhost:5173` by default. Open two tabs, create a room in one, join from the other.

Make sure the backend is running at `localhost:3000` (or update `VITE_SIGNALING_SERVER`).

```bash
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint check
```

---

## 📦 Dependencies

```
react              ^19.2.6    UI framework
react-dom          ^19.2.6    DOM rendering
socket.io-client   ^4.8.3     Signaling server connection
react-dropzone     ^15.0.0    Drag-and-drop file input
qrcode             ^1.5.4     QR code generation on canvas
lucide-react       ^1.16.0    Icons (Copy, Download, Send, etc.)
uuid               ^14.0.0    Unique IDs for file transfers
```

```
vite               ^8.0.12    Build tool + dev server
tailwindcss        ^3.4.19    Utility CSS
@vitejs/plugin-react ^6.0.1   JSX transform
```

---

## 🚢 Deploying

```bash
npm run build
# Upload dist/ folder to Vercel, Netlify, Cloudflare Pages, or GitHub Pages
```

Set `VITE_SIGNALING_SERVER` as an environment variable in your hosting platform's dashboard before building.

```env
VITE_SIGNALING_SERVER=https://your-backend.onrender.com
```

This gets baked into the production bundle at build time. If you change the backend URL, rebuild and redeploy.

---

## 🧱 What This Frontend Deliberately Does Not Have

| Thing | Still Missing | Reason |
|---|---|---|
| User accounts | ✅ | Name is session-only, `sessionStorage` only, never sent to any auth system |
| File upload to server | ✅ | Files go P2P via DataChannel. This app wouldn't know what to do with a file upload endpoint. |
| Persistent file storage | ✅ | OPFS is cleared on session end. Shared files vanish when the tab closes. |
| `localStorage` for session | ✅ | `sessionStorage` only — data cleared when the tab closes |
| QR scanner | ⚠️ | "SCAN QR CODE" button in Landing is a placeholder. `alert('Scanner feature coming soon')` 👀 |
| SHA-256 file checksum | ✅ Intentionally omitted | Causes OOM crashes on large files. SCTP handles reliability. |

---

<div align="center">

```
> CLIENT v2: LOADED ✓
> FRAMEWORK: REACT 19 (the scanlines are still here)
> FILE STORAGE: OPFS → RAM → gone after session
> CONNECTIONS: FULL MESH WebRTC
> QR SCANNER: TODO (it's on the list, okay)
> WAITING FOR ROOM CODE_
```

*Part of the [Klicks](../README.md) project.*

</div>
