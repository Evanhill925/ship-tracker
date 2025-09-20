import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ShipTable from './ShipTable'
import FilterSidebar from './FilterSidebar'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorAlert from './ErrorAlert'
import ApiService, { ApiError, getConnectionStatus, getErrorMessage } from '../services/apiService'

const HistoricalData = () => {
  const [ships, setShips] = useState([])
  const [filteredShips, setFilteredShips] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    violationType: [],
    location: '',
    timeRange: '30d',
    severity: 'all'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'timeDetected', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [statistics, setStatistics] = useState({
    totalShips: 0,
    monitoring: 0,
    activeTracking: 0,
    recentActivity: 0
  })
  const itemsPerPage = 20

  // Fetch ships from API for recent activity display
  const fetchRecentActivity = async () => {
    try {
      const response = await ApiService.fetchActiveShips({
        limit: 100,
        offset: 0
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      throw error;
    }
  }

  // Load recent activity data
  const loadHistoricalData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const ships = await fetchRecentActivity()
      setShips(ships)
      
      // Update statistics
      setStatistics({
        totalShips: ships.length,
        monitoring: ships.length, // All ships are in monitoring status
        activeTracking: ships.length,
        recentActivity: ships.length
      })
      
    } catch (err) {
      console.error('Load historical data error:', err)
      setError({
        type: err.code || 'api_error',
        message: err.message || 'Failed to load recent activity',
        description: getErrorMessage(err)
      })
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and date range changes
  useEffect(() => {
    loadHistoricalData()
  }, [dateRange])

  // Apply filters and search
  useEffect(() => {
    let filtered = [...ships]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ship => 
        ship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ship.location.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(ship =>
        ship.location.name.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Apply time range filter
    const now = new Date()
    const timeRanges = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }
    
    if (timeRanges[filters.timeRange]) {
      filtered = filtered.filter(ship => 
        now - ship.timeDetected <= timeRanges[filters.timeRange]
      )
    }

    // Apply date range filter
    const startDate = new Date(dateRange.startDate)
    const endDate = new Date(dateRange.endDate)
    endDate.setHours(23, 59, 59, 999) // End of day
    
    filtered = filtered.filter(ship => {
      const shipDate = new Date(ship.timeDetected)
      return shipDate >= startDate && shipDate <= endDate
    })

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue
        
        if (sortConfig.key === 'timeDetected') {
          aValue = new Date(a[sortConfig.key]).getTime()
          bValue = new Date(b[sortConfig.key]).getTime()
        } else if (sortConfig.key === 'name') {
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
        } else if (sortConfig.key === 'violation') {
          aValue = a.violation.label.toLowerCase()
          bValue = b.violation.label.toLowerCase()
        } else {
          aValue = a[sortConfig.key]
          bValue = b[sortConfig.key]
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredShips(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [ships, searchTerm, filters, sortConfig, dateRange])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleDateRangeChange = (range) => {
    setDateRange(range)
  }

  const refreshData = () => {
    loadHistoricalData()
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredShips.length / itemsPerPage)
  const paginatedShips = filteredShips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading && ships.length === 0) {
    return <LoadingState message="Loading recent ship activity..." />
  }

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="container-fluid bg-light border-bottom">
        <div className="container py-2">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/" className="text-decoration-none">
                  <i className="bi bi-house-fill" aria-hidden="true"></i> Home
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Recent Activity
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid py-2 py-md-4">
        <div className="row g-3">
          {/* Filter Sidebar */}
          <div className="col-md-3 d-none d-md-block">
            <FilterSidebar 
              filters={filters}
              onFilterChange={handleFilterChange}
              className="sticky-top"
              style={{ top: '1rem' }}
            />
            
            {/* Date Range Picker */}
            <div className="card mt-3">
              <div className="card-header">
                <h6 className="card-title mb-0">
                  <i className="bi bi-calendar-range me-2" aria-hidden="true"></i>
                  Date Range
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="startDate" className="form-label small">From</label>
                  <input 
                    type="date" 
                    id="startDate"
                    className="form-control form-control-sm" 
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange({...dateRange, startDate: e.target.value})}
                    max={dateRange.endDate}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="form-label small">To</label>
                  <input 
                    type="date" 
                    id="endDate"
                    className="form-control form-control-sm" 
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange({...dateRange, endDate: e.target.value})}
                    min={dateRange.startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="card mt-3">
              <div className="card-header">
                <h6 className="card-title mb-0">
                  <i className="bi bi-bar-chart me-2" aria-hidden="true"></i>
                  Activity Summary
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-2 text-center">
                  <div className="col-6">
                    <div className="border rounded p-2">
                      <div className="h5 mb-0 text-primary">{statistics.totalShips}</div>
                      <small className="text-muted">Total Ships</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-2">
                      <div className="h5 mb-0 text-info">{statistics.monitoring}</div>
                      <small className="text-muted">Monitoring</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-2">
                      <div className="h5 mb-0 text-success">{statistics.activeTracking}</div>
                      <small className="text-muted">Active</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-2">
                      <div className="h5 mb-0 text-secondary">{statistics.recentActivity}</div>
                      <small className="text-muted">Recent</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-12 col-md-9">
            {/* Error Alert */}
            {error && (
              <ErrorAlert 
                error={error}
                onRetry={refreshData}
                className="mb-3"
              />
            )}

            {/* Mobile Filter Toggle */}
            <div className="d-md-none mb-3">
              <button 
                className="btn btn-outline-primary w-100" 
                data-bs-toggle="offcanvas" 
                data-bs-target="#filtersOffcanvas"
                aria-controls="filtersOffcanvas"
              >
                <i className="bi bi-funnel" aria-hidden="true"></i> Show Filters & Date Range
              </button>
            </div>

            {/* Header Section */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
              <div>
                <h1 className="h4 h-md-2 mb-1">
                  Recent Ship Activity 
                  <span className="badge bg-info ms-2" aria-label={`${filteredShips.length} records`}>
                    {filteredShips.length}
                  </span>
                </h1>
                <small className="text-muted">
                  From {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
                </small>
              </div>

              {/* Export and Refresh */}
              <div className="d-flex gap-2">
                <div className="dropdown">
                  <button className="btn btn-outline-success btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="bi bi-download" aria-hidden="true"></i>
                    <span className="d-none d-md-inline ms-1">Export</span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a className="dropdown-item" href="#" onClick={() => console.log('Export CSV')}>
                      <i className="bi bi-filetype-csv" aria-hidden="true"></i> CSV
                    </a></li>
                    <li><a className="dropdown-item" href="#" onClick={() => console.log('Export JSON')}>
                      <i className="bi bi-filetype-json" aria-hidden="true"></i> JSON
                    </a></li>
                  </ul>
                </div>
                
                <button 
                  className="btn btn-outline-primary btn-sm" 
                  onClick={refreshData}
                  disabled={loading}
                  aria-label="Refresh data"
                >
                  <i className={`bi bi-arrow-clockwise ${loading ? 'spinner-grow spinner-grow-sm' : ''}`} aria-hidden="true"></i>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text d-none d-sm-inline-flex">
                    <i className="bi bi-search" aria-hidden="true"></i>
                  </span>
                  <input 
                    type="search"
                    className="form-control" 
                    placeholder="Search ships by name or location..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    aria-label="Search ships"
                  />
                </div>
              </div>
            </div>

            {/* Content Based on State */}
            {filteredShips.length === 0 && !loading ? (
              searchTerm || filters.location ? (
                <EmptyState 
                  type="no_results" 
                  searchTerm={searchTerm}
                  onClearFilters={() => {
                    setSearchTerm('')
                    setFilters({
                      violationType: [],
                      location: '',
                      timeRange: '30d',
                      severity: 'all'
                    })
                  }}
                />
              ) : (
                <EmptyState type="no_historical" />
              )
            ) : (
              <ShipTable 
                ships={paginatedShips}
                sortConfig={sortConfig}
                onSort={handleSort}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                viewMode="list"
              />
            )}

            {/* Mobile Filter Offcanvas */}
            <div className="offcanvas offcanvas-start" tabIndex="-1" id="filtersOffcanvas">
              <div className="offcanvas-header">
                <h5 className="offcanvas-title">Filter & Date Range</h5>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
              </div>
              <div className="offcanvas-body">
                <FilterSidebar 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  isMobile={true}
                />
                
                <hr />
                
                {/* Mobile Date Range */}
                <h6>Date Range</h6>
                <div className="mb-3">
                  <label htmlFor="mobileStartDate" className="form-label small">From</label>
                  <input 
                    type="date" 
                    id="mobileStartDate"
                    className="form-control" 
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange({...dateRange, startDate: e.target.value})}
                    max={dateRange.endDate}
                  />
                </div>
                <div>
                  <label htmlFor="mobileEndDate" className="form-label small">To</label>
                  <input 
                    type="date" 
                    id="mobileEndDate"
                    className="form-control" 
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange({...dateRange, endDate: e.target.value})}
                    min={dateRange.startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HistoricalData