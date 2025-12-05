import React from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.jsx'

// Render without StrictMode to preserve animation timing exactly as original
createRoot(document.getElementById('root')).render(
  <App />
)
