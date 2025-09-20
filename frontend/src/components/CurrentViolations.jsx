import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ShipTable from './ShipTable'
import FilterSidebar from './FilterSidebar'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorAlert from './ErrorAlert'
import ApiService, { ApiError, getConnectionStatus, getErrorMessage } from '../services/apiService'

const CurrentViolations = () => {
  const [ships, setShips] = useState([])
  const [filteredShips, setFilteredShips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [filters, setFilters] = useState({
    violationType: [],
    location: '',
    timeRange: '30d', // Changed to 30 days to capture all ships regardless of timestamp
    severity: 'all' // This will show all severities including 'info' (monitoring ships)
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [sortConfig, setSortConfig] = useState({ key: 'timeDetected', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch ships from API
  const fetchShipsFromAPI = useCallback(async (options = {}) => {
    try {
      const response = await ApiService.fetchActiveShips({
        limit: 50,
        offset: 0,
        search: searchTerm,
        ...options
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch ships:', error);
      throw error;
    }
  }, [searchTerm])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const ships = await fetchShipsFromAPI()
        setShips(ships)
        setLastUpdate(new Date())
        setConnectionStatus('connected')
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
  }, [fetchShipsFromAPI])

  // Real-time updates from API
  useEffect(() => {
    if (connectionStatus !== 'connected') return

    const interval = setInterval(async () => {
      try {
        const updatedShips = await fetchShipsFromAPI()
        setShips(updatedShips)
        setLastUpdate(new Date())
        
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
  }, [connectionStatus, fetchShipsFromAPI, error])

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

    // Apply violation type filter
    if (filters.violationType.length > 0) {
      filtered = filtered.filter(ship => 
        filters.violationType.includes(ship.violation.type)
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

    // Apply severity filter - show all severities by default including 'info' (monitoring)
    if (filters.severity !== 'all') {
      filtered = filtered.filter(ship => ship.violation.severity === filters.severity)
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = sortConfig.key === 'timeDetected' ? a[sortConfig.key].getTime() : a[sortConfig.key]
        const bValue = sortConfig.key === 'timeDetected' ? b[sortConfig.key].getTime() : b[sortConfig.key]
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredShips(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [ships, searchTerm, filters, sortConfig])

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

  const refreshData = async () => {
    setLoading(true)
    try {
      const ships = await fetchShipsFromAPI()
      setShips(ships)
      setLastUpdate(new Date())
      setError(null)
      setConnectionStatus('connected')
      
      // Announce to screen readers
      const announcer = document.getElementById('statusAnnouncements')
      if (announcer) {
        announcer.textContent = `Ship data refreshed. ${ships.length} ships loaded.`
      }
    } catch (err) {
      console.error('Refresh error:', err)
      const status = getConnectionStatus(err)
      setConnectionStatus(status)
      
      setError({
        type: err.code || 'refresh_error',
        message: err.message || 'Failed to refresh data',
        description: getErrorMessage(err)
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredShips.length / itemsPerPage)
  const paginatedShips = filteredShips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading && ships.length === 0) {
    return <LoadingState message="Loading ship violation data..." />
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
                All Ships
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
                <i className="bi bi-funnel" aria-hidden="true"></i> Show Filters
              </button>
            </div>

            {/* Header Section */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
              <div>
                <h1 className="h4 h-md-2 mb-1">
                  All Ships
                  <span className="badge bg-primary ms-2" aria-label={`${filteredShips.length} ships`}>
                    {filteredShips.length}
                  </span>
                </h1>
                <div className="d-flex align-items-center">
                  <span className={`badge me-2 ${connectionStatus === 'connected' ? 'bg-success' : 'bg-warning'}`}>
                    <i className={`bi ${connectionStatus === 'connected' ? 'bi-wifi' : 'bi-wifi-off'}`} aria-hidden="true"></i>
                    <span className="visually-hidden">Connection status: </span>
                    {connectionStatus === 'connected' ? 'Live' : 'Disconnected'}
                  </span>
                  <small className="text-muted">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </small>
                </div>
              </div>

              {/* View Toggle */}
              <div className="btn-group w-100 w-sm-auto" role="group" aria-label="View options">
                <input 
                  type="radio" 
                  className="btn-check" 
                  name="view" 
                  id="listViewRadio" 
                  checked={viewMode === 'list'}
                  onChange={() => setViewMode('list')}
                />
                <label className="btn btn-outline-secondary" htmlFor="listViewRadio">
                  <i className="bi bi-list" aria-hidden="true"></i> 
                  <span className="d-none d-sm-inline">List</span>
                </label>

                <input 
                  type="radio" 
                  className="btn-check" 
                  name="view" 
                  id="mapViewRadio" 
                  checked={viewMode === 'map'}
                  onChange={() => setViewMode('map')}
                />
                <label className="btn btn-outline-secondary" htmlFor="mapViewRadio">
                  <i className="bi bi-geo-alt" aria-hidden="true"></i>
                  <span className="d-none d-sm-inline">Map</span>
                </label>
              </div>
            </div>

            {/* Search and Actions Bar */}
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
                  <button className="btn btn-primary" type="button" onClick={() => handleSearch(searchTerm)}>
                    <i className="bi bi-search d-sm-none" aria-hidden="true"></i>
                    <span className="d-none d-sm-inline">Search</span>
                  </button>
                </div>
              </div>

              <div className="col-md-6">
                <div className="d-flex gap-2 justify-content-md-end">
                  {/* Export Dropdown */}
                  <div className="dropdown">
                    <button className="btn btn-outline-success dropdown-toggle" data-bs-toggle="dropdown">
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

                  {/* Refresh Button */}
                  <button 
                    className="btn btn-outline-primary" 
                    onClick={refreshData}
                    disabled={loading}
                    aria-label="Refresh ship data"
                  >
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spinner-grow spinner-grow-sm' : ''}`} aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Based on State */}
            {filteredShips.length === 0 && !loading ? (
              searchTerm || filters.violationType.length > 0 ? (
                <EmptyState
                  type="no_results"
                  searchTerm={searchTerm}
                  onClearFilters={() => {
                    setSearchTerm('')
                    setFilters({
                      violationType: [],
                      location: '',
                      timeRange: '24h',
                      severity: 'all'
                    })
                  }}
                />
              ) : (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <i className="bi bi-ship text-muted" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4>No Ships Found</h4>
                  <p className="text-muted">No ship data available from the API.</p>
                </div>
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
                viewMode={viewMode}
              />
            )}

            {/* Mobile Filter Offcanvas */}
            <div className="offcanvas offcanvas-start" tabIndex="-1" id="filtersOffcanvas">
              <div className="offcanvas-header">
                <h5 className="offcanvas-title">Filter Ships</h5>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
              </div>
              <div className="offcanvas-body">
                <FilterSidebar 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  isMobile={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CurrentViolations