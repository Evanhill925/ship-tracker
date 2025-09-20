import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ShipTable from './ShipTable'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorAlert from './ErrorAlert'
import ApiService, { ApiError, getConnectionStatus, getErrorMessage } from '../services/apiService'

const ShipsListPage = () => {
  const [ships, setShips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [viewMode, setViewMode] = useState('list')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Fetch ships from API
  const fetchShipsFromAPI = useCallback(async (options = {}) => {
    try {
      const response = await ApiService.fetchActiveShips({
        limit: 100, // Get more ships for the ships list page
        offset: 0,
        ...options
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch ships:', error);
      throw error;
    }
  }, [])

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
          message: err.message || 'Failed to load ships data',
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
    }, 45000) // Update every 45 seconds

    return () => clearInterval(interval)
  }, [connectionStatus, fetchShipsFromAPI, error])

  // Apply sorting to ships
  const sortedShips = [...ships].sort((a, b) => {
    if (!sortConfig.key) return 0
    
    let aValue, bValue
    
    if (sortConfig.key === 'timeDetected') {
      aValue = new Date(a[sortConfig.key] || 0).getTime()
      bValue = new Date(b[sortConfig.key] || 0).getTime()
    } else if (sortConfig.key === 'name') {
      aValue = a.name?.toLowerCase() || ''
      bValue = b.name?.toLowerCase() || ''
    } else if (sortConfig.key === 'violation') {
      aValue = a.violation?.label?.toLowerCase() || ''
      bValue = b.violation?.label?.toLowerCase() || ''
    } else {
      aValue = a[sortConfig.key] || ''
      bValue = b[sortConfig.key] || ''
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }))
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
        announcer.textContent = `Ships data refreshed. ${ships.length} ships loaded.`
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
  const totalPages = Math.ceil(sortedShips.length / itemsPerPage)
  const paginatedShips = sortedShips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading && ships.length === 0) {
    return <LoadingState message="Loading ships data..." />
  }

  // Count violations for display - all ships are now "monitoring" status
  const violationCount = 0 // Since all ships are now just monitoring, no violations

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
          {/* Main Content Area - Full width without sidebar */}
          <div className="col-12">
            {/* Error Alert */}
            {error && (
              <ErrorAlert
                error={error}
                onRetry={refreshData}
                className="mb-3"
              />
            )}

            {/* Header Section */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
              <div>
                <h1 className="h4 h-md-2 mb-1">
                  All Ships
                  <span className="badge bg-primary ms-2" aria-label={`${ships.length} ships`}>
                    {ships.length}
                  </span>
                  {violationCount > 0 && (
                    <span className="badge bg-danger ms-1" aria-label={`${violationCount} violations`}>
                      {violationCount} violations
                    </span>
                  )}
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

              {/* Quick Actions */}
              <div className="d-flex gap-2">
                <Link to="/" className="btn btn-outline-primary">
                  <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
                  Map View
                </Link>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="d-flex gap-2 justify-content-end">
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
                    aria-label="Refresh ships data"
                  >
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spinner-grow spinner-grow-sm' : ''}`} aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Based on State */}
            {/* Content Based on State */}
            {ships.length === 0 && !loading ? (
              <EmptyState type="no_ships" />
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
          </div>
        </div>
      </div>
    </>
  )
}

export default ShipsListPage