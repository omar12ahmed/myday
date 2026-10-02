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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
