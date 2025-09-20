import React from 'react'

const ErrorAlert = ({ error, onRetry, onDismiss, className = "" }) => {
  const getAlertClass = (errorType) => {
    switch (errorType) {
      case 'connection_error':
      case 'api_error':
        return 'alert-danger'
      case 'rate_limit':
        return 'alert-warning'
      case 'partial_data':
        return 'alert-warning'
      case 'offline':
        return 'alert-secondary'
      default:
        return 'alert-danger'
    }
  }

  const getIcon = (errorType) => {
    switch (errorType) {
      case 'connection_error':
        return 'bi-wifi-off'
      case 'api_error':
        return 'bi-exclamation-triangle-fill'
      case 'rate_limit':
        return 'bi-hourglass-split'
      case 'partial_data':
        return 'bi-exclamation-triangle'
      case 'offline':
        return 'bi-wifi-off'
      default:
        return 'bi-exclamation-triangle-fill'
    }
  }

  if (error?.type === 'connection_lost') {
    return (
      <div className={`alert alert-warning alert-dismissible sticky-top ${className}`} role="alert">
        <div className="d-flex align-items-center">
          <i className="bi bi-wifi-off me-2" aria-hidden="true"></i>
          <div className="flex-grow-1">
            <strong>Connection Lost</strong>
            <div className="small">Real-time updates are paused. Attempting to reconnect...</div>
          </div>
          <div className="spinner-border spinner-border-sm ms-2" role="status">
            <span className="visually-hidden">Reconnecting...</span>
          </div>
        </div>
        <div className="mt-2">
          {onRetry && (
            <button className="btn btn-sm btn-outline-warning me-2" onClick={onRetry}>
              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
              Retry Connection
            </button>
          )}
          {onDismiss && (
            <button type="button" className="btn-close" onClick={onDismiss} aria-label="Close"></button>
          )}
        </div>
      </div>
    )
  }

  if (error?.type === 'rate_limit') {
    return (
      <div className={`alert alert-info ${className}`} role="alert">
        <div className="d-flex align-items-center">
          <i className="bi bi-hourglass-split me-2" aria-hidden="true"></i>
          <div className="flex-grow-1">
            <strong>Rate Limit Exceeded</strong>
            <div className="small">Please wait before making more requests.</div>
          </div>
        </div>
        <div className="progress mt-2" style={{ height: '4px' }}>
          <div className="progress-bar bg-info" role="progressbar" style={{ width: '60%' }}></div>
        </div>
        <small className="text-muted">Reset in 2 minutes</small>
      </div>
    )
  }

  if (error?.type === 'partial_data') {
    return (
      <div className={`alert alert-warning ${className}`} role="alert">
        <div className="d-flex align-items-start">
          <i className="bi bi-exclamation-triangle me-3 mt-1" aria-hidden="true"></i>
          <div className="flex-grow-1">
            <h4 className="alert-heading h6 mb-2">Partial Data Loaded</h4>
            <p className="mb-2">
              {error.description || 'Some ship data couldn\'t be loaded due to connectivity issues.'}
            </p>
            
            <div className="d-flex gap-2 align-items-center">
              {onRetry && (
                <button className="btn btn-sm btn-warning" onClick={onRetry}>
                  <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i> 
                  Load Missing Data
                </button>
              )}
              <div className="vr"></div>
              <button className="btn btn-sm btn-outline-warning" onClick={() => console.log('Continue with partial')}>
                Continue with Current Data
              </button>
            </div>
          </div>
          {onDismiss && (
            <button type="button" className="btn-close" onClick={onDismiss} aria-label="Close"></button>
          )}
        </div>
      </div>
    )
  }

  if (error?.type === 'offline') {
    return (
      <div className={`alert alert-secondary ${className}`} role="alert">
        <div className="d-flex align-items-center">
          <i className="bi bi-wifi-off me-2" aria-hidden="true"></i>
          <div className="flex-grow-1">
            <strong>Offline Mode</strong>
            <div className="small">Showing cached data from your last visit</div>
          </div>
          <small className="text-muted">Last updated: 2 hours ago</small>
        </div>
        <div className="mt-2">
          {onRetry && (
            <button className="btn btn-sm btn-secondary" onClick={onRetry}>
              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i> 
              Check Connection
            </button>
          )}
        </div>
      </div>
    )
  }

  if (error?.type === 'maintenance') {
    return (
      <div className={`alert alert-info border-0 shadow-sm ${className}`} role="alert">
        <div className="text-center py-4">
          <div className="mb-4">
            <i className="bi bi-tools text-info" style={{ fontSize: '3rem' }} aria-hidden="true"></i>
          </div>
          <h4 className="alert-heading h5">Scheduled Maintenance</h4>
          <p className="mb-3">Our ship tracking system is currently undergoing scheduled maintenance to improve performance.</p>
          
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-6">
                      <h6 className="text-muted mb-1">Started</h6>
                      <strong>19:00 UTC</strong>
                    </div>
                    <div className="col-6">
                      <h6 className="text-muted mb-1">Expected End</h6>
                      <strong>21:00 UTC</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-3 mb-0">
            <small className="text-muted">
              Follow <a href="#" className="alert-link">@ShipTrackerStatus</a> for updates
            </small>
          </p>
        </div>
      </div>
    )
  }

  // Default error alert
  return (
    <div className={`alert ${getAlertClass(error?.type)} ${className}`} role="alert">
      <div className="d-flex">
        <i className={`bi ${getIcon(error?.type)} me-3`} style={{ fontSize: '1.5rem' }} aria-hidden="true"></i>
        <div className="flex-grow-1">
          <h4 className="alert-heading h6 mb-1">
            {error?.message || 'An Error Occurred'}
          </h4>
          <p className="mb-2">
            {error?.description || 'Something went wrong while processing your request.'}
          </p>
          {error?.code && (
            <small className="text-muted">Error Code: {error.code}</small>
          )}
          <div className="mt-3">
            {onRetry && (
              <button className="btn btn-sm btn-danger me-2" onClick={onRetry}>
                <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i> 
                Try Again
              </button>
            )}
            <button className="btn btn-sm btn-outline-danger" onClick={() => console.log('Report issue')}>
              <i className="bi bi-bug me-1" aria-hidden="true"></i> 
              Report Issue
            </button>
          </div>
        </div>
        {onDismiss && (
          <button type="button" className="btn-close" onClick={onDismiss} aria-label="Close"></button>
        )}
      </div>
    </div>
  )
}

export default ErrorAlert