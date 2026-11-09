import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="device">
      <div className="notch" aria-hidden="true" />
      <div className="screen">
        <App />
      </div>
    </div>
  </StrictMode>,
)
