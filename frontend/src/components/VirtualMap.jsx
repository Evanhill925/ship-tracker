import React, { useState } from 'react'

const VirtualMap = ({ ships, onShipClick, loading }) => {
  const [selectedShip, setSelectedShip] = useState(null)
  
  // Map dimensions and scaling - focused on Asia-Pacific region
  const mapWidth = 1000
  const mapHeight = 600
  
  // Convert lat/lng to map coordinates - Asia-Pacific bounds
  const coordinatesToMapPosition = (lat, lng) => {
    // Asia-Pacific bounds where ships actually exist
    const minLat = -10, maxLat = 50, minLng = 95, maxLng = 155
    
    // Clamp coordinates to our region
    const clampedLat = Math.max(minLat, Math.min(maxLat, lat))
    const clampedLng = Math.max(minLng, Math.min(maxLng, lng))
    
    // Convert to map coordinates with padding
    const padding = 50
    const x = padding + ((clampedLng - minLng) / (maxLng - minLng)) * (mapWidth - 2 * padding)
    const y = padding + ((maxLat - clampedLat) / (maxLat - minLat)) * (mapHeight - 2 * padding)
    
    return { x, y }
  }
  
  // Helper function to prevent ship stacking by adding small offsets
  const distributeShips = (ships) => {
    if (!ships || ships.length === 0) return []
    
    const distributed = [...ships]
    const minDistance = 25 // Minimum pixel distance between ships
    
    for (let i = 0; i < distributed.length; i++) {
      const pos1 = coordinatesToMapPosition(distributed[i].location.lat, distributed[i].location.lng)
      
      for (let j = i + 1; j < distributed.length; j++) {
        const pos2 = coordinatesToMapPosition(distributed[j].location.lat, distributed[j].location.lng)
        const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
        
        if (distance < minDistance) {
          // Add small offset to separate overlapping ships
          const angle = (j - i) * (2 * Math.PI / 8) // Distribute in circle
          const offsetLat = 0.008 * Math.cos(angle) // Small lat/lng offset
          const offsetLng = 0.012 * Math.sin(angle)
          
          distributed[j] = {
            ...distributed[j],
            location: {
              ...distributed[j].location,
              lat: distributed[j].location.lat + offsetLat,
              lng: distributed[j].location.lng + offsetLng
            }
          }
        }
      }
    }
    
    return distributed
  }

  const getBadgeClass = (severity) => {
    switch (severity) {
      case 'danger': return 'ship-marker-danger'
      case 'warning': return 'ship-marker-warning'  
      case 'info': return 'ship-marker-info'
      default: return 'ship-marker-secondary'
    }
  }

  const handleShipClick = (ship) => {
    setSelectedShip(ship)
    if (onShipClick) {
      onShipClick(ship)
    }
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

  // Process ships to prevent overlapping
  const processedShips = distributeShips(ships || [])

  if (loading) {
    return (
      <div className="virtual-map-container" style={{ width: '100%', maxWidth: `${mapWidth}px`, margin: '0 auto' }}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading ships...</span>
          </div>
          <p>Loading ship tracking data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .virtual-map-container {
          position: relative;
          width: 100%;
          max-width: ${mapWidth}px;
          margin: 0 auto;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .virtual-map {
          position: relative;
          width: 100%;
          height: ${mapHeight}px;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 30%, #90caf9 60%, #64b5f6 100%);
          background-image: 
            /* Ocean texture */
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
            radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px),
            /* Land masses (Southeast Asia region) */
            radial-gradient(ellipse 120px 80px at 12% 60%, #8bc34a 40%, transparent 41%),
            radial-gradient(ellipse 100px 60px at 18% 55%, #a5d6a7 40%, transparent 41%),
            radial-gradient(ellipse 80px 50px at 15% 70%, #c8e6c9 40%, transparent 41%),
            /* Japan/Korea region */
            radial-gradient(ellipse 80px 40px at 82% 20%, #8bc34a 40%, transparent 41%),
            radial-gradient(ellipse 60px 30px at 85% 30%, #a5d6a7 40%, transparent 41%),
            /* Taiwan/Philippines */
            radial-gradient(ellipse 50px 70px at 80% 50%, #c8e6c9 40%, transparent 41%),
            radial-gradient(ellipse 70px 90px at 85% 70%, #8bc34a 40%, transparent 41%),
            /* China coast */
            radial-gradient(ellipse 100px 120px at 70% 30%, #a5d6a7 40%, transparent 41%);
          overflow: hidden;
          border-radius: 8px;
        }
        
        .land-label {
          position: absolute;
          font-size: 10px;
          color: #2e7d32;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
          pointer-events: none;
        }
        
        .ship-marker {
          position: absolute;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid white;
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
          transform: translate(-50%, -50%) scale(1.4);
          z-index: 20;
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
        }
        
        .ship-marker-danger {
          background-color: #dc3545;
        }
        
        .ship-marker-warning {
          background-color: #ffc107;
          color: #000;
        }
        
        .ship-marker-info {
          background-color: #0dcaf0;
        }
        
        .ship-marker-secondary {
          background-color: #6c757d;
        }
        
        .ship-tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          pointer-events: none;
          z-index: 30;
          max-width: 250px;
          transform: translate(-50%, -120%);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          display: none;
        }
        
        .map-legend {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.95);
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 6px;
          border: 1px solid white;
        }
        
        .map-info {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 11px;
          color: #6c757d;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        @media (max-width: 768px) {
          .virtual-map {
            height: 400px;
          }
          
          .ship-marker {
            width: 22px;
            height: 22px;
            font-size: 10px;
          }
          
          .map-legend, .map-info {
            font-size: 10px;
            padding: 6px 8px;
          }
        }
      `}</style>
      
      <div className="virtual-map-container">
        <div className="virtual-map">
          {/* Geographic Labels */}
          <div className="land-label" style={{ top: '60%', left: '15%' }}>
            Southeast Asia
          </div>
          <div className="land-label" style={{ top: '22%', left: '82%' }}>
            Japan
          </div>
          <div className="land-label" style={{ top: '32%', left: '85%' }}>
            South Korea
          </div>
          <div className="land-label" style={{ top: '32%', left: '70%' }}>
            China
          </div>
          <div className="land-label" style={{ top: '52%', left: '80%' }}>
            Taiwan
          </div>
          <div className="land-label" style={{ top: '72%', left: '85%' }}>
            Philippines
          </div>

          {/* Map Legend */}
          <div className="map-legend">
            <h6 className="mb-2" style={{ fontSize: '12px', fontWeight: 'bold' }}>Violation Types</h6>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#dc3545' }}></div>
              Speed Violation
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ffc107' }}></div>
              Wrong Route
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#0dcaf0' }}></div>
              Area Restriction
            </div>
          </div>

          {/* Map Info */}
          <div className="map-info">
            <i className="bi bi-geo-alt-fill me-1"></i>
            Asia-Pacific Maritime Tracking • {processedShips.length} ships visible
          </div>

          {/* Ship Markers */}
          {processedShips.map((ship) => {
            const position = coordinatesToMapPosition(ship.location.lat, ship.location.lng)
            return (
              <div
                key={ship.id}
                className={`ship-marker ${getBadgeClass(ship.violation.severity)}`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`
                }}
                onClick={() => handleShipClick(ship)}
                onMouseEnter={(e) => {
                  const tooltip = e.target.querySelector('.ship-tooltip')
                  if (tooltip) tooltip.style.display = 'block'
                }}
                onMouseLeave={(e) => {
                  const tooltip = e.target.querySelector('.ship-tooltip')
                  if (tooltip) tooltip.style.display = 'none'
                }}
                title={`${ship.name} - ${ship.violation.label}`}
              >
                🚢
                <div className="ship-tooltip">
                  <strong>{ship.name}</strong><br />
                  <small>
                    <strong>{ship.violation.label}</strong><br />
                    {ship.location.name}<br />
                    {formatCoordinates(ship.location.lat, ship.location.lng)}<br />
                    Speed: {ship.speed} knots | Course: {ship.direction.toFixed(0)}°<br />
                    Detected: {formatTimeAgo(ship.timeDetected)}
                  </small>
                </div>
              </div>
            )
          })}
        </div>

        {/* Map Controls */}
        <div className="d-flex justify-content-between align-items-center mt-3 px-3 py-2 bg-light rounded-bottom">
          <small className="text-muted">
            <i className="bi bi-geo-alt-fill me-1"></i>
            Asia-Pacific Region • Live AIS Maritime Data
          </small>
          <div className="btn-group btn-group-sm">
            <span className="badge bg-success">
              <i className="bi bi-broadcast me-1"></i>
              {processedShips.length} Active
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default VirtualMap