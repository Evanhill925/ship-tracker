import React from 'react'

const FilterSidebar = ({ filters, onFilterChange, isMobile = false, className = '', style = {} }) => {
  const handleViolationTypeChange = (type, checked) => {
    const newTypes = checked 
      ? [...filters.violationType, type]
      : filters.violationType.filter(t => t !== type)
    
    onFilterChange({
      ...filters,
      violationType: newTypes
    })
  }

  const handleInputChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    })
  }

  const clearAllFilters = () => {
    onFilterChange({
      violationType: [],
      location: '',
      timeRange: '24h',
      severity: 'all'
    })
    
    // Announce to screen readers
    const announcer = document.getElementById('statusAnnouncements')
    if (announcer) {
      announcer.textContent = 'All filters cleared'
    }
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.violationType.length > 0) count += filters.violationType.length
    if (filters.location) count++
    if (filters.timeRange !== '24h') count++
    if (filters.severity !== 'all') count++
    return count
  }

  return (
    <div className={`card ${className}`} style={style}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="h6 mb-0">
          Filters 
          {getActiveFilterCount() > 0 && (
            <span className="badge bg-primary ms-2" aria-label={`${getActiveFilterCount()} active filters`}>
              {getActiveFilterCount()}
            </span>
          )}
        </h3>
        <button 
          className="btn btn-sm btn-outline-secondary" 
          onClick={clearAllFilters}
          disabled={getActiveFilterCount() === 0}
          aria-label="Clear all active filters"
        >
          Clear All
        </button>
      </div>
      <div className="card-body">
        {/* Violation Type Filter */}
        <fieldset className="mb-4">
          <legend className="form-label fw-bold">Violation Type</legend>
          <div className="form-check">
            <input 
              className="form-check-input" 
              type="checkbox" 
              value="wrong-route" 
              id="wrongRouteFilter"
              checked={filters.violationType.includes('wrong-route')}
              onChange={(e) => handleViolationTypeChange('wrong-route', e.target.checked)}
              aria-describedby="wrongRouteDesc"
            />
            <label className="form-check-label" htmlFor="wrongRouteFilter">
              Wrong Route
            </label>
            <div id="wrongRouteDesc" className="form-text small">
              Ships deviating from designated lanes
            </div>
          </div>
          
          <div className="form-check">
            <input 
              className="form-check-input" 
              type="checkbox" 
              value="speed-violation" 
              id="speedViolationFilter"
              checked={filters.violationType.includes('speed-violation')}
              onChange={(e) => handleViolationTypeChange('speed-violation', e.target.checked)}
              aria-describedby="speedViolationDesc"
            />
            <label className="form-check-label" htmlFor="speedViolationFilter">
              Speed Violation
            </label>
            <div id="speedViolationDesc" className="form-text small">
              Exceeding speed limits in restricted areas
            </div>
          </div>
          
          <div className="form-check">
            <input 
              className="form-check-input" 
              type="checkbox" 
              value="area-restriction" 
              id="areaRestrictionFilter"
              checked={filters.violationType.includes('area-restriction')}
              onChange={(e) => handleViolationTypeChange('area-restriction', e.target.checked)}
              aria-describedby="areaRestrictionDesc"
            />
            <label className="form-check-label" htmlFor="areaRestrictionFilter">
              Area Restriction
            </label>
            <div id="areaRestrictionDesc" className="form-text small">
              Entering prohibited maritime zones
            </div>
          </div>
        </fieldset>

        {/* Location Filter */}
        <div className="mb-4">
          <label htmlFor="locationFilter" className="form-label fw-bold">Location</label>
          <input 
            type="text" 
            className="form-control" 
            id="locationFilter"
            placeholder="Enter coordinates or region"
            value={filters.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            aria-describedby="locationHelp"
          />
          <div id="locationHelp" className="form-text">
            e.g., "North Atlantic" or "40.7N, 74.0W"
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="mb-4">
          <label htmlFor="timeRangeFilter" className="form-label fw-bold">Time Range</label>
          <select 
            className="form-select" 
            id="timeRangeFilter"
            value={filters.timeRange}
            onChange={(e) => handleInputChange('timeRange', e.target.value)}
            aria-describedby="timeRangeHelp"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <div id="timeRangeHelp" className="form-text">
            Filter violations by detection time
          </div>
        </div>

        {/* Severity Filter */}
        <fieldset className="mb-4">
          <legend className="form-label fw-bold">Severity Level</legend>
          <div className="btn-group-vertical w-100" role="group" aria-label="Severity level options">
            <input 
              type="radio" 
              className="btn-check" 
              name="severityFilter" 
              id="allSeverity" 
              value="all"
              checked={filters.severity === 'all'}
              onChange={(e) => handleInputChange('severity', e.target.value)}
            />
            <label className="btn btn-outline-secondary" htmlFor="allSeverity">
              All Levels
            </label>
            
            <input 
              type="radio" 
              className="btn-check" 
              name="severityFilter" 
              id="highSeverity"
              value="danger"
              checked={filters.severity === 'danger'}
              onChange={(e) => handleInputChange('severity', e.target.value)}
            />
            <label className="btn btn-outline-danger" htmlFor="highSeverity">
              <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true"></i>
              High Risk
            </label>
            
            <input 
              type="radio" 
              className="btn-check" 
              name="severityFilter" 
              id="mediumSeverity"
              value="warning"
              checked={filters.severity === 'warning'}
              onChange={(e) => handleInputChange('severity', e.target.value)}
            />
            <label className="btn btn-outline-warning" htmlFor="mediumSeverity">
              <i className="bi bi-exclamation-circle me-1" aria-hidden="true"></i>
              Medium Risk
            </label>

            <input 
              type="radio" 
              className="btn-check" 
              name="severityFilter" 
              id="lowSeverity"
              value="info"
              checked={filters.severity === 'info'}
              onChange={(e) => handleInputChange('severity', e.target.value)}
            />
            <label className="btn btn-outline-info" htmlFor="lowSeverity">
              <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
              Low Risk
            </label>
          </div>
        </fieldset>

        {/* Export Options (Mobile only) */}
        {isMobile && (
          <div className="mb-3">
            <h4 className="h6 fw-bold mb-3">Export Options</h4>
            <div className="d-grid gap-2">
              <button className="btn btn-outline-success btn-sm" onClick={() => console.log('Export CSV')}>
                <i className="bi bi-filetype-csv me-2" aria-hidden="true"></i>
                Export as CSV
              </button>
              <button className="btn btn-outline-success btn-sm" onClick={() => console.log('Export JSON')}>
                <i className="bi bi-filetype-json me-2" aria-hidden="true"></i>
                Export as JSON
              </button>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div className="mb-3">
            <h4 className="h6 fw-bold mb-2">Active Filters</h4>
            <div className="d-flex flex-wrap gap-1" role="list" aria-label="Active filters">
              {filters.violationType.map(type => (
                <span key={type} className="badge bg-primary d-flex align-items-center" role="listitem">
                  {type === 'wrong-route' && 'Wrong Route'}
                  {type === 'speed-violation' && 'Speed Violation'}
                  {type === 'area-restriction' && 'Area Restriction'}
                  <button 
                    type="button" 
                    className="btn-close btn-close-white ms-1" 
                    onClick={() => handleViolationTypeChange(type, false)}
                    aria-label={`Remove ${type} filter`}
                    style={{ fontSize: '0.6em' }}
                  ></button>
                </span>
              ))}
              
              {filters.location && (
                <span className="badge bg-info d-flex align-items-center" role="listitem">
                  Location: {filters.location}
                  <button 
                    type="button" 
                    className="btn-close btn-close-white ms-1" 
                    onClick={() => handleInputChange('location', '')}
                    aria-label="Remove location filter"
                    style={{ fontSize: '0.6em' }}
                  ></button>
                </span>
              )}
              
              {filters.timeRange !== '24h' && (
                <span className="badge bg-secondary d-flex align-items-center" role="listitem">
                  Time: {filters.timeRange}
                  <button 
                    type="button" 
                    className="btn-close btn-close-white ms-1" 
                    onClick={() => handleInputChange('timeRange', '24h')}
                    aria-label="Remove time range filter"
                    style={{ fontSize: '0.6em' }}
                  ></button>
                </span>
              )}
              
              {filters.severity !== 'all' && (
                <span className="badge bg-warning d-flex align-items-center" role="listitem">
                  Severity: {filters.severity}
                  <button 
                    type="button" 
                    className="btn-close btn-close-white ms-1" 
                    onClick={() => handleInputChange('severity', 'all')}
                    aria-label="Remove severity filter"
                    style={{ fontSize: '0.6em' }}
                  ></button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div className="mb-3">
          <h4 className="h6 fw-bold mb-2">Quick Filters</h4>
          <div className="d-grid gap-1">
            <button 
              className="btn btn-outline-secondary btn-sm text-start" 
              onClick={() => onFilterChange({
                violationType: ['wrong-route'],
                location: '',
                timeRange: '1h',
                severity: 'all'
              })}
            >
              <i className="bi bi-lightning me-2 text-warning" aria-hidden="true"></i>
              Recent Wrong Routes
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm text-start" 
              onClick={() => onFilterChange({
                violationType: [],
                location: '',
                timeRange: '24h',
                severity: 'danger'
              })}
            >
              <i className="bi bi-exclamation-triangle me-2 text-danger" aria-hidden="true"></i>
              High Risk Violations
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm text-start" 
              onClick={() => onFilterChange({
                violationType: ['speed-violation'],
                location: '',
                timeRange: '7d',
                severity: 'all'
              })}
            >
              <i className="bi bi-speedometer2 me-2 text-info" aria-hidden="true"></i>
              Speed Violations This Week
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterSidebar