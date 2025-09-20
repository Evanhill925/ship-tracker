import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import LandingPage from './components/LandingPage'
import CurrentViolations from './components/CurrentViolations'
import ShipsListPage from './components/ShipsListPage'
import HistoricalData from './components/HistoricalData'
import './App.css'

function App() {
  return (
    <div className="App">
      <Navigation />
      <main role="main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ships" element={<ShipsListPage />} />
          <Route path="/current" element={<CurrentViolations />} />
          <Route path="/historical" element={<HistoricalData />} />
        </Routes>
      </main>
      
      {/* Toast Container for notifications */}
      <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
        <div id="liveToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true">
          <div className="toast-header">
            <strong className="me-auto">Ship Tracker</strong>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div className="toast-body">
            {/* Toast content will be dynamically updated */}
          </div>
        </div>
      </div>
      
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="visually-hidden" id="statusAnnouncements"></div>
      <div aria-live="assertive" aria-atomic="true" className="visually-hidden" id="criticalAlerts"></div>
    </div>
  )
}

export default App
