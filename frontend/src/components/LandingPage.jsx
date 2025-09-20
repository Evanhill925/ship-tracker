import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import InteractiveMap from './InteractiveMap'
import ApiService, { ApiError, getConnectionStatus, getErrorMessage } from '../services/apiService'

const LandingPage = () => {
  const [systemStats, setSystemStats] = useState({
    shipsTracked: 0,
    lastViolation: 'Loading...',
    systemStatus: 'Loading...'
  })
  const [ships, setShips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedShip, setSelectedShip] = useState(null)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  // Fetch ships from API
  const fetchShipsFromAPI = useCallback(async (options = {}) => {
    try {
      const response = await ApiService.fetchActiveShips({
        limit: 15, // Only get 15 ships for the landing page map
        offset: 0,
        ...options
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch ships:', error);
      throw error;
    }
  }, [])

  // Fetch system health stats
  const fetchSystemStats = useCallback(async () => {
    try {
      const healthResponse = await ApiService.checkHealth();
      
      if (healthResponse.success) {
        setSystemStats({
          shipsTracked: healthResponse.collections?.ships || 0,
          lastViolation: 'Real-time monitoring', // We'll calculate this from actual ship data
          systemStatus: healthResponse.status === 'healthy' ? 'Operational' : 'Degraded'
        });
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      setSystemStats(prev => ({
        ...prev,
        systemStatus: 'Connection Error'
      }));
      setConnectionStatus('disconnected');
    }
  }, [])

  // Load initial data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch both ships and system stats in parallel
        const [shipsData] = await Promise.all([
          fetchShipsFromAPI(),
          fetchSystemStats()
        ])
        
        setShips(shipsData)
        
        // Calculate last violation from real ship data
        if (shipsData.length > 0) {
          const mostRecentViolation = shipsData
            .sort((a, b) => new Date(b.timeDetected) - new Date(a.timeDetected))[0]
          
          const timeDiff = Date.now() - new Date(mostRecentViolation.timeDetected)
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
          const minutesAgo = Math.floor(timeDiff / (1000 * 60))
          
          let lastViolationText;
          if (hoursAgo >= 1) {
            lastViolationText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
          } else if (minutesAgo >= 1) {
            lastViolationText = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`
          } else {
            lastViolationText = 'Just now'
          }
          
          setSystemStats(prev => ({
            ...prev,
            lastViolation: lastViolationText
          }))
        }
        
      } catch (err) {
        console.error('Load data error:', err)
        const status = getConnectionStatus(err)
        setConnectionStatus(status)
        
        setError({
          type: err.code || 'api_error',
          message: err.message || 'Failed to load ship data',
          description: getErrorMessage(err)
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [fetchShipsFromAPI, fetchSystemStats])

  // Real-time updates from API
  useEffect(() => {
    if (connectionStatus !== 'connected') return

    const interval = setInterval(async () => {
      try {
        // Refresh both ships and stats
        const [updatedShips] = await Promise.all([
          fetchShipsFromAPI(),
          fetchSystemStats()
        ])
        
        setShips(updatedShips)
        
        // Clear any previous errors if we successfully got data
        if (error) {
          setError(null)
          setConnectionStatus('connected')
        }
      } catch (err) {
        console.error('Real-time update error:', err)
        const status = getConnectionStatus(err)
        setConnectionStatus(status)
        
        // Only set error if it's a connection issue, otherwise keep showing existing data
        if (status === 'disconnected' || status === 'timeout') {
          setError({
            type: err.code || 'update_error',
            message: 'Connection lost',
            description: 'Unable to get real-time updates. Showing last known data.'
          })
        }
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [connectionStatus, fetchShipsFromAPI, fetchSystemStats, error])

  const handleShipClick = (ship) => {
    setSelectedShip(ship)
    // Trigger Bootstrap modal
    const modal = new window.bootstrap.Modal(document.getElementById('shipDetailModal'))
    modal.show()
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInHours >= 1) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInMinutes >= 1) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  const formatCoordinates = (lat, lng) => {
    const latDir = lat >= 0 ? 'N' : 'S'
    const lngDir = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`
  }

  const getBadgeClass = (severity) => {
    switch (severity) {
      case 'danger': return 'bg-danger'
      case 'warning': return 'bg-warning'
      case 'info': return 'bg-info'
      default: return 'bg-secondary'
    }
  }

  return (
    <>
      {/* Skip navigation link */}
      <a href="#main-content" className="visually-hidden-focusable btn btn-primary position-absolute" style={{ top: '10px', left: '10px', zIndex: 1000 }}>
        Skip to main content
      </a>

      {/* Hero Section */}
      <div className="container-fluid bg-light py-3 py-md-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8 text-center">
              <h1 className="display-6 display-md-4 mb-3">Maritime Violation Tracker</h1>
              <p className="lead fs-6 fs-md-5 mb-4">
                Monitor ships not following designated routes in real-time
              </p>
              
              {/* Status Indicators */}
              <div className="row justify-content-center text-center mb-4">
                <div className="col-md-4">
                  <div className="d-flex align-items-center justify-content-center">
                    <i className={`bi ${connectionStatus === 'connected' ? 'bi-broadcast text-success' : 'bi-broadcast-off text-warning'} me-2`} style={{ fontSize: '1.2rem' }}></i>
                    <small className="text-muted">
                      {connectionStatus === 'connected' ? 'Live data updates' : 'Connection issue'}
                    </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-shield-check text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                    <small className="text-muted">
                      Currently tracking {loading ? '...' : systemStats.shipsTracked.toLocaleString()} ships
                    </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-gear-fill text-info me-2" style={{ fontSize: '1.2rem' }}></i>
                    <span className={`badge ${systemStats.systemStatus === 'Operational' ? 'bg-success' : systemStats.systemStatus === 'Loading...' ? 'bg-secondary' : 'bg-warning'}`}>
                      {systemStats.systemStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-warning alert-dismissible fade show" role="alert">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>
                      <strong>{error.message}</strong>
                      <br />
                      <small>{error.description}</small>
                    </div>
                  </div>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setError(null)}></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="main-content" className="container py-3 py-md-5">
        {/* Virtual Map Section */}
        <div className="row justify-content-center mb-5">
          <div className="col-12">
            <div className="text-center mb-4">
              <h2 className="h3 mb-3">Live Ship Tracking Map</h2>
              <p className="text-muted">
                Click on any ship to view detailed violation information
              </p>
            </div>
            
            <InteractiveMap
              ships={ships}
              onShipClick={handleShipClick}
              loading={loading}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row g-3 g-md-4 justify-content-center">
          {/* Current Violations Card */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-list-ul text-primary"
                     style={{ fontSize: '2.5rem' }}
                     aria-hidden="true"></i>
                </div>
                <h3 className="h5 card-title mb-2">Ships List View</h3>
                <p className="card-text text-muted mb-3">
                  View detailed list of all tracked ships with advanced filtering
                </p>
                
                <Link
                  to="/current"
                  className="btn btn-primary w-100"
                  aria-describedby="shipsListDesc"
                >
                  <i className="bi bi-table me-2" aria-hidden="true"></i>
                  View Ships List
                </Link>
                <div id="shipsListDesc" className="visually-hidden">
                  Navigate to detailed ships listing page
                </div>
              </div>
            </div>
          </div>
          
          {/* Historical Analysis Card */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-graph-up text-success"
                     style={{ fontSize: '2.5rem' }}
                     aria-hidden="true"></i>
                </div>
                <h3 className="h5 card-title mb-2">Historical Analysis</h3>
                <p className="card-text text-muted mb-3">
                  Analyze past violation patterns and trends over time
                </p>
                
                <Link
                  to="/historical"
                  className="btn btn-outline-success w-100"
                  aria-describedby="historicalDataDesc"
                >
                  <i className="bi bi-clock-history me-2" aria-hidden="true"></i>
                  View Historical Data
                </Link>
                <div id="historicalDataDesc" className="visually-hidden">
                  Navigate to historical ship violation analysis dashboard
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats Summary */}
        <div className="row justify-content-center mt-5">
          <div className="col-lg-8">
            <div className="card bg-light border-0">
              <div className="card-body">
                <h3 className="h6 text-center text-muted mb-3">Live System Overview</h3>
                <div className="row text-center">
                  <div className="col-4">
                    <h4 className="text-primary mb-1">
                      {loading ? (
                        <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        systemStats.shipsTracked.toLocaleString()
                      )}
                    </h4>
                    <small className="text-muted">Ships Tracked</small>
                  </div>
                  <div className="col-4">
                    <h4 className="mb-1">{systemStats.lastViolation}</h4>
                    <small className="text-muted">Last Violation</small>
                  </div>
                  <div className="col-4">
                    <div className="d-flex align-items-center justify-content-center mb-1">
                      <span className={`badge me-2 ${connectionStatus === 'connected' ? 'bg-success' : 'bg-warning'}`}>
                        <i className={`bi ${connectionStatus === 'connected' ? 'bi-wifi' : 'bi-wifi-off'} me-1`}></i>
                        {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                      </span>
                      <span className={`badge ${systemStats.systemStatus === 'Operational' ? 'bg-success' : systemStats.systemStatus === 'Loading...' ? 'bg-secondary' : 'bg-warning'}`}>
                        {systemStats.systemStatus}
                      </span>
                    </div>
                    <small className="text-muted">System Status</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ship Detail Modal */}
        <div className="modal fade" id="shipDetailModal" tabIndex="-1"
             aria-labelledby="shipDetailTitle" aria-describedby="shipDetailDescription">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="shipDetailTitle">
                  {selectedShip ? `${selectedShip.name} - Details` : 'Ship Details'}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"
                        aria-label="Close ship details"></button>
              </div>
              <div className="modal-body" id="shipDetailDescription">
                {selectedShip && (
                  <>
                    <div className="row mb-3">
                      <div className="col-6">
                        <strong>Ship Name:</strong><br />
                        {selectedShip.name}
                      </div>
                      <div className="col-6">
                        <strong>Current Position:</strong><br />
                        {formatCoordinates(selectedShip.location.lat, selectedShip.location.lng)}
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-6">
                        <strong>Current Heading:</strong><br />
                        {selectedShip.direction.toFixed(0)}°
                      </div>
                      <div className="col-6">
                        <strong>Speed:</strong><br />
                        {selectedShip.speed} knots
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-6">
                        <strong>Violation:</strong><br />
                        <span className={`badge ${getBadgeClass(selectedShip.violation.severity)}`}>
                          {selectedShip.violation.label}
                        </span>
                      </div>
                      <div className="col-6">
                        <strong>Detected:</strong><br />
                        {formatTimeAgo(selectedShip.timeDetected)}
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-12">
                        <strong>Location:</strong><br />
                        {selectedShip.location.name}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                  Close
                </button>
                <Link
                  to="/current"
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                >
                  <i className="bi bi-list me-1" aria-hidden="true"></i>
                  View All Ships
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-light py-4 mt-5">
        <div className="container">
          <div className="row">
            <div className="col-md-8">
              <small>
                <a href="#about" className="text-light text-decoration-none me-3">About</a>
                <a href="#data-sources" className="text-light text-decoration-none me-3">Data Sources</a>
                <a href="#contact" className="text-light text-decoration-none">Contact</a>
              </small>
            </div>
            <div className="col-md-4 text-md-end">
              <small className="text-muted">
                Last Updated: {new Date().toLocaleString()}
              </small>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default LandingPage