import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans' // MyDay's font, bundled with the app so it works offline
import './index.css'
import App from './App.tsx'
import { boot, listenForOtherTabs } from './data/storage'
import { startSync } from './sync/engine'

// Load and check the saved data before anything is shown or saved, then keep up with other tabs, and with
// your other devices if cloud sync is set up (sync/config.ts; otherwise this does nothing).
boot()
listenForOtherTabs()
startSync()

// Offline, and installable as an app: the service worker (sw/sw.js, built with each release). Only in the built app.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => { /* MyDay works without it */ }); });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
