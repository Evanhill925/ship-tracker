import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// Simple coordinate projection for Asia-Pacific region
const projectCoordinates = (lat, lng, mapWidth, mapHeight) => {
  // Asia-Pacific bounds where ships are located
  const minLat = -10, maxLat = 60, minLng = 95, maxLng = 155
  
  // Clamp coordinates to region
  const clampedLat = Math.max(minLat, Math.min(maxLat, lat))
  const clampedLng = Math.max(minLng, Math.min(maxLng, lng))
  
  // Convert to map coordinates with padding
  const padding = 30
  const x = padding + ((clampedLng - minLng) / (maxLng - minLng)) * (mapWidth - 2 * padding)
  const y = padding + ((maxLat - clampedLat) / (maxLat - minLat)) * (mapHeight - 2 * padding)
  
  return { x, y }
}

// Simple clustering algorithm
const clusterShips = (ships, zoomLevel, mapWidth, mapHeight) => {
  if (zoomLevel > 8) return { clusters: [], ships: ships } // No clustering at high zoom
  
  const clusterRadius = Math.max(40, 100 - (zoomLevel * 10))
  const clusters = []
  const clusteredShips = new Set()
  
  ships.forEach((ship, index) => {
    if (clusteredShips.has(index)) return
    
    const shipPos = projectCoordinates(ship.location.lat, ship.location.lng, mapWidth, mapHeight)
    const cluster = {
      id: `cluster-${index}`,
      position: shipPos,
      ships: [ship],
      center: { lat: ship.location.lat, lng: ship.location.lng }
    }
    
    // Find nearby ships
    ships.forEach((otherShip, otherIndex) => {
      if (otherIndex <= index || clusteredShips.has(otherIndex)) return
      
      const otherPos = projectCoordinates(otherShip.location.lat, otherShip.location.lng, mapWidth, mapHeight)
      const distance = Math.sqrt(Math.pow(shipPos.x - otherPos.x, 2) + Math.pow(shipPos.y - otherPos.y, 2))
      
      if (distance < clusterRadius) {
        cluster.ships.push(otherShip)
        clusteredShips.add(otherIndex)
        
        // Update cluster center (average position)
        const totalLat = cluster.ships.reduce((sum, s) => sum + s.location.lat, 0)
        const totalLng = cluster.ships.reduce((sum, s) => sum + s.location.lng, 0)
        cluster.center = {
          lat: totalLat / cluster.ships.length,
          lng: totalLng / cluster.ships.length
        }
        cluster.position = projectCoordinates(cluster.center.lat, cluster.center.lng, mapWidth, mapHeight)
      }
    })
    
    if (cluster.ships.length > 1) {
      clusters.push(cluster)
      clusteredShips.add(index)
    }
  })
  
  // Return unclustered ships
  const unclustered = ships.filter((_, index) => !clusteredShips.has(index))
  
  return { clusters, ships: unclustered }
}

const SimpleInteractiveMap = ({ ships = [], onShipClick, loading }) => {
  const [selectedShip, setSelectedShip] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(4)
  const [center, setCenter] = useState({ lat: 25, lng: 125 })
  const [tooltip, setTooltip] = useState(null)
  const mapRef = useRef()
  
  const mapWidth = 1000
  const mapHeight = 600

  // Filter valid ships
  const validShips = ships.filter(ship => 
    ship.location && 
    ship.location.lat && 
    ship.location.lng &&
    !isNaN(ship.location.lat) && 
    !isNaN(ship.location.lng)
  )

  // Get clustered data
  const { clusters, ships: unclustered } = useMemo(() => 
    clusterShips(validShips, zoomLevel, mapWidth, mapHeight), 
    [validShips, zoomLevel]
  )

  // Format helpers
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

  const handleShipClick = useCallback((ship, event) => {
    event.stopPropagation()
    setSelectedShip(ship)
    if (onShipClick) {
      onShipClick(ship)
    }
    
    // Show tooltip
    setTooltip({
      ship,
      x: event.clientX,
      y: event.clientY
    })
  }, [onShipClick])

  const handleClusterClick = useCallback((cluster, event) => {
    event.stopPropagation()
    setZoomLevel(prev => Math.min(prev + 2, 12))
    setCenter(cluster.center)
  }, [])

  const handleZoom = useCallback((delta) => {
    setZoomLevel(prev => Math.max(1, Math.min(12, prev + delta)))
  }, [])

  const handleMapClick = useCallback(() => {
    setTooltip(null)
    setSelectedShip(null)
  }, [])

  if (loading) {
    return (
      <div className="map-container" style={{ height: `${mapHeight}px`, width: '100%', maxWidth: `${mapWidth}px`, margin: '0 auto', position: 'relative' }}>
        <div className="map-loading">
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading map...</span>
            </div>
            <p>Loading maritime tracking data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .interactive-map-container {
          position: relative;
          width: 100%;
          max-width: ${mapWidth}px;
          margin: 0 auto;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .interactive-map {
          position: relative;
          width: 100%;
          height: ${mapHeight}px;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 30%, #90caf9 60%, #64b5f6 100%);
          background-image: 
            /* Ocean texture */
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
            radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px),
            /* Land masses - more detailed for Asia-Pacific */
            radial-gradient(ellipse 150px 100px at 12% 65%, #81c784 40%, transparent 41%),
            radial-gradient(ellipse 120px 80px at 18% 60%, #a5d6a7 40%, transparent 41%),
            radial-gradient(ellipse 100px 70px at 15% 72%, #c8e6c9 40%, transparent 41%),
            /* Japan/Korea */
            radial-gradient(ellipse 90px 50px at 82% 22%, #81c784 40%, transparent 41%),
            radial-gradient(ellipse 70px 40px at 85% 32%, #a5d6a7 40%, transparent 41%),
            /* Taiwan/Philippines */
            radial-gradient(ellipse 60px 80px at 80% 52%, #c8e6c9 40%, transparent 41%),
            radial-gradient(ellipse 80px 100px at 85% 72%, #81c784 40%, transparent 41%),
            /* China coast */
            radial-gradient(ellipse 120px 140px at 70% 32%, #a5d6a7 40%, transparent 41%),
            /* Australia */
            radial-gradient(ellipse 200px 120px at 75% 85%, #81c784 40%, transparent 41%);
          cursor: grab;
          overflow: hidden;
        }
        
        .interactive-map:active {
          cursor: grabbing;
        }
        
        .map-loading {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 30%, #90caf9 60%, #64b5f6 100%);
        }
        
        .ship-marker {
          position: absolute;
          border-radius: 50%;
          border: 3px solid white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
          z-index: 10;
        }
        
        .ship-marker:hover {
          transform: translate(-50%, -50%) scale(1.3);
          z-index: 20;
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
        }
        
        .ship-marker.selected {
          transform: translate(-50%, -50%) scale(1.4);
          z-index: 25;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
        }
        
        .cluster-marker {
          position: absolute;
          border-radius: 50%;
          border: 3px solid white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
          z-index: 15;
        }
        
        .cluster-marker:hover {
          transform: translate(-50%, -50%) scale(1.2);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
        }
        
        .map-controls {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          z-index: 1000;
        }
        
        .zoom-btn {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          font-weight: bold;
          color: #333;
          transition: all 0.2s ease;
          user-select: none;
        }
        
        .zoom-btn:hover {
          background: white;
          transform: scale(1.05);
        }
        
        .zoom-btn:active {
          transform: scale(0.95);
        }
        
        .map-legend {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 6px;
          padding: 12px;
          font-size: 12px;
          min-width: 200px;
          max-width: 250px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        
        .legend-content h6 {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: bold;
          color: #333;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
          font-size: 11px;
        }
        
        .legend-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          margin-right: 8px;
          flex-shrink: 0;
        }
        
        .legend-text {
          color: #666;
        }
        
        .legend-total {
          font-size: 11px;
          color: #333;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #ddd;
        }
        
        .ship-tooltip {
          position: fixed;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 12px;
          pointer-events: none;
          z-index: 2000;
          max-width: 280px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          transform: translate(-50%, -120%);
        }
        
        .tooltip-title {
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 6px;
        }
        
        .tooltip-detail {
          margin-bottom: 3px;
          font-size: 11px;
        }
        
        .violation-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
          color: white;
          margin-bottom: 4px;
        }
        
        .map-status {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          color: #666;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        
        .zoom-indicator {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.95);
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
          color: #666;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          .interactive-map {
            height: 400px;
          }
          
          .ship-marker, .cluster-marker {
            font-size: 10px;
          }
          
          .map-legend {
            padding: 8px;
            font-size: 11px;
            min-width: 150px;
          }
        }
      `}</style>

      <div className="interactive-map-container">
        <div className="interactive-map" ref={mapRef} onClick={handleMapClick}>
          {/* Render clusters */}
          {clusters.map((cluster) => {
            const severity = cluster.ships.reduce((prev, ship) => {
              const shipSeverity = ship.violation?.severity || 'secondary'
              if (shipSeverity === 'danger') return 'danger'
              if (shipSeverity === 'warning' && prev !== 'danger') return 'warning'
              if (shipSeverity === 'info' && prev !== 'danger' && prev !== 'warning') return 'info'
              return prev
            }, 'secondary')
            
            const colors = {
              danger: '#dc3545',
              warning: '#ffc107',
              info: '#0dcaf0',
              secondary: '#1976d2'
            }
            
            const size = Math.min(30 + cluster.ships.length * 2, 50)
            
            return (
              <div
                key={cluster.id}
                className="cluster-marker"
                style={{
                  left: `${cluster.position.x}px`,
                  top: `${cluster.position.y}px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: colors[severity],
                  fontSize: cluster.ships.length > 99 ? '10px' : '12px'
                }}
                onClick={(e) => handleClusterClick(cluster, e)}
                title={`${cluster.ships.length} ships in this area`}
              >
                {cluster.ships.length}
              </div>
            )
          })}

          {/* Render individual ships */}
          {unclustered.map((ship) => {
            const position = projectCoordinates(ship.location.lat, ship.location.lng, mapWidth, mapHeight)
            const severity = ship.violation?.severity || 'secondary'
            const colors = {
              danger: '#dc3545',
              warning: '#ffc107',
              info: '#0dcaf0',
              secondary: '#6c757d'
            }
            
            const isSelected = selectedShip?.id === ship.id
            const size = isSelected ? 28 : 22
            
            return (
              <div
                key={ship.id}
                className={`ship-marker ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: colors[severity],
                  fontSize: `${size * 0.45}px`
                }}
                onClick={(e) => handleShipClick(ship, e)}
                title={`${ship.name} - ${ship.violation?.label || 'Monitoring'}`}
              >
                🚢
              </div>
            )
          })}

          {/* Map Controls */}
          <div className="map-controls">
            <div className="zoom-btn" onClick={() => handleZoom(1)} title="Zoom In">
              +
            </div>
            <div className="zoom-btn" onClick={() => handleZoom(-1)} title="Zoom Out">
              −
            </div>
          </div>

          {/* Legend */}
          <div className="map-legend">
            <div className="legend-content">
              <h6>Ship Status</h6>
              {Object.entries({
                danger: 'Critical Violations',
                warning: 'Route Violations',
                info: 'Area Restrictions',
                secondary: 'Monitoring'
              }).map(([severity, label]) => {
                const count = validShips.filter(ship => 
                  (ship.violation?.severity || 'secondary') === severity
                ).length
                
                return (
                  <div key={severity} className="legend-item">
                    <div 
                      className="legend-marker"
                      style={{
                        backgroundColor: {
                          danger: '#dc3545',
                          warning: '#ffc107',
                          info: '#0dcaf0',
                          secondary: '#6c757d'
                        }[severity]
                      }}
                    />
                    <span className="legend-text">
                      {label} ({count})
                    </span>
                  </div>
                )
              })}
              <div className="legend-total">
                <strong>Total Ships: {validShips.length}</strong>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="map-status">
            <i className="bi bi-geo-alt-fill me-1"></i>
            Maritime Tracking • {validShips.length} ships • Live AIS Data
          </div>

          {/* Zoom Indicator */}
          <div className="zoom-indicator">
            Zoom: {zoomLevel}/12
          </div>
        </div>

        {/* Ship Tooltip */}
        {tooltip && (
          <div 
            className="ship-tooltip"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`
            }}
          >
            <div className="tooltip-title">{tooltip.ship.name || 'Unknown Vessel'}</div>
            
            {tooltip.ship.violation && (
              <div 
                className="violation-badge"
                style={{
                  backgroundColor: {
                    danger: '#dc3545',
                    warning: '#ffc107',
                    info: '#0dcaf0',
                    secondary: '#6c757d'
                  }[tooltip.ship.violation.severity || 'secondary']
                }}
              >
                {tooltip.ship.violation.label}
              </div>
            )}
            
            <div className="tooltip-detail">
              <strong>Location:</strong> {tooltip.ship.location.name || formatCoordinates(tooltip.ship.location.lat, tooltip.ship.location.lng)}
            </div>
            
            <div className="tooltip-detail">
              <strong>Coordinates:</strong> {formatCoordinates(tooltip.ship.location.lat, tooltip.ship.location.lng)}
            </div>
            
            {tooltip.ship.speed && (
              <div className="tooltip-detail">
                <strong>Speed:</strong> {tooltip.ship.speed} knots
              </div>
            )}
            
            {tooltip.ship.direction !== undefined && (
              <div className="tooltip-detail">
                <strong>Course:</strong> {tooltip.ship.direction.toFixed(0)}°
              </div>
            )}
            
            {tooltip.ship.callSign && (
              <div className="tooltip-detail">
                <strong>Call Sign:</strong> {tooltip.ship.callSign}
              </div>
            )}
            
            {tooltip.ship.timeDetected && (
              <div className="tooltip-detail">
                <strong>Detected:</strong> {formatTimeAgo(tooltip.ship.timeDetected)}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default SimpleInteractiveMap