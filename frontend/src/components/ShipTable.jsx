import React, { useState } from 'react'
import InteractiveMap from './InteractiveMap'

const ShipTable = ({ ships, sortConfig, onSort, loading, currentPage, totalPages, onPageChange, viewMode }) => {
  const [selectedShip, setSelectedShip] = useState(null)

  const formatTimeAgo = (date) => {
    const now = new Date()
    const dateObj = new Date(date) // Ensure date is a Date object
    const diffInHours = Math.floor((now - dateObj) / (1000 * 60 * 60))
    const diffInMinutes = Math.floor((now - dateObj) / (1000 * 60))
    
    if (diffInHours >= 1) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInMinutes >= 1) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  const safeToISOString = (date) => {
    try {
      return new Date(date).toISOString()
    } catch (error) {
      return new Date().toISOString() // Fallback to current date
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

  const handleSort = (key) => {
    onSort(key)
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <i className="bi bi-arrow-down-up ms-1" aria-hidden="true"></i>
    }
    return sortConfig.direction === 'asc' 
      ? <i className="bi bi-arrow-up ms-1" aria-hidden="true"></i>
      : <i className="bi bi-arrow-down ms-1" aria-hidden="true"></i>
  }

  const openShipModal = (ship) => {
    setSelectedShip(ship)
    // Trigger Bootstrap modal
    const modal = new window.bootstrap.Modal(document.getElementById('shipDetailModal'))
    modal.show()
  }

  if (viewMode === 'map') {
    return (
      <div>
        <InteractiveMap
          ships={ships}
          onShipClick={(ship) => openShipModal(ship)}
          loading={loading}
        />
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="d-none d-md-block">
        <div className="table-responsive">
          <table className="table table-hover" role="table" aria-label="Ship violations data">
            <caption className="visually-hidden">
              List of ships currently violating maritime routes. 
              Table contains ship name, location, direction, violation type, time detected, and actions.
            </caption>
            
            <thead className="table-dark">
              <tr role="row">
                <th scope="col">
                  <button 
                    className="btn btn-link p-0 text-start text-white text-decoration-none" 
                    onClick={() => handleSort('name')}
                    aria-label="Sort by ship name"
                  >
                    Ship Name
                    {getSortIcon('name')}
                  </button>
                </th>
                <th scope="col" className="d-none d-lg-table-cell">Location</th>
                <th scope="col" className="d-none d-xl-table-cell">Direction</th>
                <th scope="col">
                  <button 
                    className="btn btn-link p-0 text-start text-white text-decoration-none" 
                    onClick={() => handleSort('violation')}
                    aria-label="Sort by violation type"
                  >
                    Violation Type
                    {getSortIcon('violation')}
                  </button>
                </th>
                <th scope="col" className="d-none d-lg-table-cell">
                  <button 
                    className="btn btn-link p-0 text-start text-white text-decoration-none" 
                    onClick={() => handleSort('timeDetected')}
                    aria-label="Sort by time detected"
                  >
                    Time Detected
                    {getSortIcon('timeDetected')}
                  </button>
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            
            <tbody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={`skeleton-${i}`} className="placeholder-glow">
                    <td><span className="placeholder col-8"></span></td>
                    <td className="d-none d-lg-table-cell"><span className="placeholder col-6"></span></td>
                    <td className="d-none d-xl-table-cell"><span className="placeholder col-4"></span></td>
                    <td><span className="placeholder col-7"></span></td>
                    <td className="d-none d-lg-table-cell"><span className="placeholder col-5"></span></td>
                    <td><span className="placeholder col-3"></span></td>
                  </tr>
                ))
              ) : (
                ships.map((ship) => (
                  <tr key={ship.id} role="row">
                    <th scope="row">
                      <strong>{ship.name}</strong>
                      {/* Mobile: Show condensed info */}
                      <div className="d-lg-none">
                        <small className="text-muted">
                          {formatCoordinates(ship.location.lat, ship.location.lng)} • 
                          {ship.direction.toFixed(0)}° • 
                          {formatTimeAgo(ship.timeDetected)}
                        </small>
                      </div>
                    </th>
                    <td className="d-none d-lg-table-cell">
                      <span aria-label={`Location: ${formatCoordinates(ship.location.lat, ship.location.lng)}`}>
                        {formatCoordinates(ship.location.lat, ship.location.lng)}
                      </span>
                      <br />
                      <small className="text-muted">{ship.location.name}</small>
                    </td>
                    <td className="d-none d-xl-table-cell">
                      <span aria-label={`${ship.direction.toFixed(0)} degrees`}>
                        {ship.direction.toFixed(0)}°
                      </span>
                    </td>
                    <td>
                      <span 
                        className={`badge ${getBadgeClass(ship.violation.severity)}`}
                        role="status" 
                        aria-label={`Violation type: ${ship.violation.label}`}
                      >
                        {ship.violation.label}
                      </span>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      <time
                        dateTime={safeToISOString(ship.timeDetected)}
                        aria-label={`Detected ${formatTimeAgo(ship.timeDetected)}`}
                      >
                        {formatTimeAgo(ship.timeDetected)}
                      </time>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => openShipModal(ship)}
                        aria-label={`View details for ${ship.name}`}
                      >
                        <i className="bi bi-eye" aria-hidden="true"></i>
                        <span className="d-none d-xl-inline ms-1">Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="d-md-none">
        <div className="row g-3">
          {loading ? (
            Array.from({ length: 3 }, (_, i) => (
              <div key={`mobile-skeleton-${i}`} className="col-12">
                <div className="card placeholder-glow">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h6 className="placeholder col-6"></h6>
                        <div className="placeholder col-8"></div>
                      </div>
                      <span className="placeholder col-3"></span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            ships.map((ship) => (
              <div key={ship.id} className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1">
                        <h6 className="card-title mb-1">{ship.name}</h6>
                        <small className="text-muted">
                          {ship.location.name}
                        </small>
                      </div>
                      <span className={`badge ${getBadgeClass(ship.violation.severity)}`}>
                        {ship.violation.label}
                      </span>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">
                        <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
                        {formatCoordinates(ship.location.lat, ship.location.lng)}
                      </small>
                      <br />
                      <small className="text-muted">
                        <i className="bi bi-compass me-1" aria-hidden="true"></i>
                        Direction: {ship.direction.toFixed(0)}° • 
                        <i className="bi bi-clock ms-2 me-1" aria-hidden="true"></i>
                        {formatTimeAgo(ship.timeDetected)}
                      </small>
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openShipModal(ship)}
                      aria-label={`View details for ${ship.name}`}
                    >
                      <i className="bi bi-eye me-1" aria-hidden="true"></i>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <nav aria-label="Ship list pagination" className="mt-4">
          <ul className="pagination justify-content-center flex-wrap">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <span aria-hidden="true">&laquo;</span>
              </button>
            </li>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1
              const isActive = pageNum === currentPage
              
              return (
                <li key={pageNum} className={`page-item ${isActive ? 'active' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => onPageChange(pageNum)}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                </li>
              )
            })}
            
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <span aria-hidden="true">&raquo;</span>
              </button>
            </li>
          </ul>
        </nav>
      )}

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
                  <div className="row">
                    <div className="col-6">
                      <strong>Ship Name:</strong><br />
                      {selectedShip.name}
                    </div>
                    <div className="col-6">
                      <strong>Current Position:</strong><br />
                      {formatCoordinates(selectedShip.location.lat, selectedShip.location.lng)}
                    </div>
                  </div>
                  <hr />
                  <div className="row">
                    <div className="col-6">
                      <strong>Current Heading:</strong><br />
                      {selectedShip.direction.toFixed(0)}°
                    </div>
                    <div className="col-6">
                      <strong>Speed:</strong><br />
                      {selectedShip.speed} knots
                    </div>
                  </div>
                  <hr />
                  <div className="row">
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
                  <hr />
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
              <button type="button" className="btn btn-primary">
                <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
                Track Ship
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ShipTable