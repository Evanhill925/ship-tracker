import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Navigation = () => {
  const location = useLocation()

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top" aria-label="Main navigation" style={{ backgroundColor: '#0d47a1' }}>
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <i className="bi bi-geo-alt-fill me-2"></i>
          Ship Tracker
        </Link>
        
        {/* Mobile toggle */}
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation menu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        {/* Navigation items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto" role="menubar">
            <li className="nav-item" role="none">
              <Link 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} 
                to="/" 
                role="menuitem"
                aria-current={location.pathname === '/' ? 'page' : undefined}
              >
                Home
              </Link>
            </li>
            <li className="nav-item" role="none">
              <Link
                className={`nav-link ${location.pathname === '/ships' ? 'active' : ''}`}
                to="/ships"
                role="menuitem"
                aria-current={location.pathname === '/ships' ? 'page' : undefined}
              >
                Ships List
              </Link>
            </li>
            <li className="nav-item" role="none">
              <Link
                className={`nav-link ${location.pathname === '/historical' ? 'active' : ''}`}
                to="/historical"
                role="menuitem"
                aria-current={location.pathname === '/historical' ? 'page' : undefined}
              >
                Historical Data
              </Link>
            </li>
            <li className="nav-item dropdown" role="none">
              <a 
                className="nav-link dropdown-toggle" 
                href="#" 
                role="menuitem"
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                Tools
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#export" role="menuitem">
                  <i className="bi bi-download me-2"></i>Export Data
                </a></li>
                <li><a className="dropdown-item" href="#alerts" role="menuitem">
                  <i className="bi bi-bell me-2"></i>Set Alerts
                </a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#about" role="menuitem">
                  <i className="bi bi-info-circle me-2"></i>About
                </a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navigation