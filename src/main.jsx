import React from 'react'
import ReactDOM from 'react-dom/client'
import AppContent from './App.jsx'
import { WebRTCProvider } from './context/WebRTCContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <WebRTCProvider>
    <AppContent />
  </WebRTCProvider>
)
