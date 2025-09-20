import React from 'react'

const LoadingState = ({ message = "Loading...", type = "page" }) => {
  if (type === "inline") {
    return (
      <div className="d-flex align-items-center" role="status" aria-live="polite">
        <div className="spinner-border spinner-border-sm text-primary me-2" aria-hidden="true"></div>
        <span className="text-muted">{message}</span>
      </div>
    )
  }

  if (type === "table") {
    return (
      <tr>
        <td colSpan="6" className="text-center py-4">
          <div className="d-flex align-items-center justify-content-center" role="status" aria-live="polite">
            <div className="spinner-border text-primary me-3" aria-hidden="true"></div>
            <span className="text-muted">{message}</span>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <div className="mb-4" role="status" aria-live="polite">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} aria-hidden="true"></div>
            <h3 className="h5 text-muted mb-3">{message}</h3>
            <div className="progress mx-auto" style={{ maxWidth: '300px', height: '4px' }}>
              <div className="progress-bar progress-bar-striped progress-bar-animated" 
                   role="progressbar" style={{ width: '60%' }} aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
                <span className="visually-hidden">Loading 60% complete</span>
              </div>
            </div>
          </div>
          
          <div className="card bg-light border-0">
            <div className="card-body">
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
                  <small>Fetching violation data</small>
                </li>
                <li className="d-flex align-items-center">
                  <i className="bi bi-circle text-muted me-2" aria-hidden="true"></i>
                  <small>Preparing display</small>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingState