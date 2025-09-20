import React from 'react'
import { Link } from 'react-router-dom'

const EmptyState = ({ type, searchTerm, onClearFilters }) => {
  if (type === 'all_clear') {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }} aria-hidden="true"></i>
        </div>
        <h2 className="h3 text-success mb-3">All Clear!</h2>
        <p className="text-muted mb-4">No ships are currently violating their designated routes.</p>
        
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card bg-light border-0">
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-4">
                    <h3 className="h6 text-muted mb-1">Ships Tracked</h3>
                    <h4 className="text-primary mb-0">1,247</h4>
                  </div>
                  <div className="col-4">
                    <h3 className="h6 text-muted mb-1">Last Violation</h3>
                    <h4 className="mb-0">3 hours ago</h4>
                  </div>
                  <div className="col-4">
                    <h3 className="h6 text-muted mb-1">System Status</h3>
                    <span className="badge bg-success fs-6">Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Link to="/historical" className="btn btn-outline-primary me-2">
            <i className="bi bi-clock-history me-1" aria-hidden="true"></i> 
            View Historical Data
          </Link>
          <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i> 
            Refresh
          </button>
        </div>
      </div>
    )
  }

  if (type === 'no_results') {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }} aria-hidden="true"></i>
        </div>
        <h2 className="h4 mb-3">
          {searchTerm 
            ? `No ships found matching "${searchTerm}"` 
            : 'No violations match your filters'
          }
        </h2>
        <p className="text-muted mb-4">Try adjusting your search criteria or filters</p>
        
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="list-group list-group-flush border-0">
              <div className="list-group-item border-0 bg-transparent">
                <i className="bi bi-calendar-range text-primary me-2" aria-hidden="true"></i>
                Try expanding your date range
              </div>
              <div className="list-group-item border-0 bg-transparent">
                <i className="bi bi-funnel text-primary me-2" aria-hidden="true"></i>
                Clear active filters
              </div>
              <div className="list-group-item border-0 bg-transparent">
                <i className="bi bi-geo-alt text-primary me-2" aria-hidden="true"></i>
                Search in different regions
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          {onClearFilters && (
            <button className="btn btn-primary me-2" onClick={onClearFilters}>
              <i className="bi bi-x-circle me-1" aria-hidden="true"></i> 
              Clear All Filters
            </button>
          )}
          <Link to="/historical" className="btn btn-outline-secondary">
            <i className="bi bi-clock-history me-1" aria-hidden="true"></i> 
            Try Historical Data
          </Link>
        </div>

        {/* Search Suggestions */}
        <div className="mt-4">
          <div className="card bg-light border-0">
            <div className="card-body">
              <h3 className="h6 card-title mb-3">Popular searches:</h3>
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => console.log('Search: MV')}>
                  Ships starting with "MV"
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => console.log('Search: Atlantic')}>
                  Atlantic region
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => console.log('Search: cargo')}>
                  Cargo ships
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'no_historical_data') {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i className="bi bi-calendar-x text-muted" style={{ fontSize: '4rem' }} aria-hidden="true"></i>
        </div>
        <h2 className="h4 mb-3">No Historical Data Found</h2>
        <p className="text-muted mb-4">No violations were recorded during the selected time period.</p>
        
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="list-group list-group-flush border-0">
              <div className="list-group-item border-0 bg-transparent">
                <i className="bi bi-calendar-range text-primary me-2" aria-hidden="true"></i>
                Try expanding your date range
              </div>
              <div className="list-group-item border-0 bg-transparent">
                <i className="bi bi-funnel text-primary me-2" aria-hidden="true"></i>
                Clear active filters
              </div>
              <div className="list-group-item border-0 bg-transparent">
                <i className="bi bi-geo-alt text-primary me-2" aria-hidden="true"></i>
                Search in different regions
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button className="btn btn-primary me-2" onClick={() => console.log('Expand date range')}>
            <i className="bi bi-calendar-plus me-1" aria-hidden="true"></i> 
            Expand Date Range
          </button>
          {onClearFilters && (
            <button className="btn btn-outline-primary" onClick={onClearFilters}>
              <i className="bi bi-x-circle me-1" aria-hidden="true"></i> 
              Clear Filters
            </button>
          )}
        </div>
      </div>
    )
  }

  if (type === 'first_time') {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i className="bi bi-compass text-primary" style={{ fontSize: '4rem' }} aria-hidden="true"></i>
        </div>
        <h2 className="h3 mb-3">Welcome to Ship Tracker</h2>
        <p className="text-muted mb-4">Your maritime violation monitoring system is initializing...</p>
        
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0">
              <div className="card-body">
                <h3 className="h6 card-title mb-3">Setting up your dashboard</h3>
                <div className="progress mb-3" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated" 
                    role="progressbar" 
                    style={{ width: '75%' }}
                    aria-valuenow="75"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <span className="visually-hidden">75% complete</span>
                  </div>
                </div>
                <ul className="list-unstyled mb-0 text-start">
                  <li className="d-flex align-items-center mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2" aria-hidden="true"></i>
                    <small>Connecting to ship databases</small>
                  </li>
                  <li className="d-flex align-items-center mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2" aria-hidden="true"></i>
                    <small>Loading maritime routes</small>
                  </li>
                  <li className="d-flex align-items-center mb-2">
                    <i className="bi bi-arrow-clockwise text-primary me-2" aria-hidden="true"></i>
                    <small>Initializing real-time monitoring</small>
                  </li>
                  <li className="d-flex align-items-center">
                    <i className="bi bi-circle text-muted me-2" aria-hidden="true"></i>
                    <small>Ready for tracking</small>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default empty state
  return (
    <div className="text-center py-5">
      <div className="mb-4">
        <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }} aria-hidden="true"></i>
      </div>
      <h2 className="h4 mb-3">No Data Available</h2>
      <p className="text-muted mb-4">There's no data to display at the moment.</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>
        <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i> 
        Try Again
      </button>
    </div>
  )
}

export default EmptyState