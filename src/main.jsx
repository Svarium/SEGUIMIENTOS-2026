import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#020617',
            color: '#e5e7eb',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148,163,184,0.4)',
            fontSize: '0.85rem',
          },
        }}
      />
      <App />
    </>
  </StrictMode>,
)
