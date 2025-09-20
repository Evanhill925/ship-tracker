import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'

// Fix for default markers not showing
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom ship marker icons for different violation severities
const createShipIcon = (severity, isSelected = false) => {
  const colors = {
    danger: '#dc3545',
    warning: '#ffc107', 
    info: '#0dcaf0',
    secondary: '#6c757d'
  }
  
  const color = colors[severity] || colors.secondary
  const size = isSelected ? 32 : 24
  
  return L.divIcon({
    className: 'custom-ship-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.5}px;
        transition: all 0.3s ease;
        z-index: ${isSelected ? 1000 : 100};
      ">
        🚢
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  })
}

// Component to fit map bounds to show all ships
const FitBounds = ({ ships }) => {
  const map = useMap()
  
  useEffect(() => {
    if (!ships || ships.length === 0) return
    
    // Extract coordinates from ships
    const coordinates = ships
      .filter(ship => ship.location && ship.location.lat && ship.location.lng)
      .map(ship => [ship.location.lat, ship.location.lng])
    
    if (coordinates.length === 0) return
    
    // Create bounds
    const bounds = L.latLngBounds(coordinates)
    
    // Fit bounds with padding
    map.fitBounds(bounds, {
      padding: [20, 20],
      maxZoom: 12 // Prevent zooming too far in
    })
  }, [map, ships])
  
  return null
}

// Map legend component
const MapLegend = ({ ships }) => {
  const violationCounts = ships.reduce((acc, ship) => {
    const severity = ship.violation?.severity || 'secondary'
    acc[severity] = (acc[severity] || 0) + 1
    return acc
  }, {})

  return (
    <div className="leaflet-control leaflet-control-custom map-legend">
      <div className="legend-content">
        <h6 className="mb-2">Ship Status</h6>
        {Object.entries({
          danger: 'Critical Violations',
          warning: 'Route Violations', 
          info: 'Area Restrictions',
          secondary: 'Monitoring'
        }).map(([severity, label]) => (
          <div key={severity} className="legend-item">
            <div 
              className="legend-marker"
              style={{
                backgroundColor: {
                  danger: '#dc3545',
                  warning: '#ffc107',
                  info: '#0dcaf0', 
                  secondary: '#6c757d'
                }[severity],
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: '2px solid white',
                marginRight: '8px',
                flexShrink: 0
              }}
            />
            <span className="legend-text">
              {label} ({violationCounts[severity] || 0})
            </span>
          </div>
        ))}
        <div className="legend-total mt-2 pt-2" style={{borderTop: '1px solid #ddd'}}>
          <strong>Total Ships: {ships.length}</strong>
        </div>
      </div>
    </div>
  )
}

const InteractiveMap = ({ ships = [], onShipClick, loading }) => {
  const [selectedShip, setSelectedShip] = useState(null)
  const mapRef = useRef()
  
  // Generate a stable unique key for this component instance
  const mapKey = useMemo(() => `map-${Math.random().toString(36).substring(2, 15)}`, [])

  // Format helper functions
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

  const handleShipClick = useCallback((ship) => {
    setSelectedShip(ship)
    if (onShipClick) {
      onShipClick(ship)
    }
  }, [onShipClick])

  // Filter valid ships with coordinates
  const validShips = ships.filter(ship => 
    ship.location && 
    ship.location.lat && 
    ship.location.lng &&
    !isNaN(ship.location.lat) && 
    !isNaN(ship.location.lng)
  )

  if (loading) {
    return (
      <div className="map-container" style={{ height: '600px', position: 'relative' }}>
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

  // Default center - Asia-Pacific region where ships are located
  const defaultCenter = [25, 125]
  const defaultZoom = 4

  return (
    <>
      <style>{`
        .map-container {
          height: 600px;
          width: 100%;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .map-loading {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 30%, #90caf9 60%, #64b5f6 100%);
        }
        
        .leaflet-container {
          height: 100% !important;
          width: 100% !important;
          font-family: inherit;
        }
        
        .custom-ship-marker {
          background: none !important;
          border: none !important;
        }
        
        .leaflet-control-custom {
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .map-legend {
          padding: 12px;
          font-size: 12px;
          min-width: 200px;
          max-width: 250px;
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
        
        .legend-text {
          color: #666;
        }
        
        .legend-total {
          font-size: 11px;
          color: #333;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 6px;
        }
        
        .leaflet-popup-content {
          margin: 12px 16px;
          min-width: 200px;
        }
        
        .ship-popup-content {
          font-size: 13px;
        }
        
        .ship-popup-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }
        
        .ship-popup-detail {
          margin-bottom: 4px;
          color: #666;
        }
        
        .ship-popup-detail strong {
          color: #333;
        }
        
        .violation-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          color: white;
          margin-bottom: 6px;
        }
        
        .violation-danger { background-color: #dc3545; }
        .violation-warning { background-color: #ffc107; color: #000; }
        .violation-info { background-color: #0dcaf0; }
        .violation-secondary { background-color: #6c757d; }
        
        /* Cluster styling */
        .marker-cluster-small {
          background-color: rgba(25, 118, 210, 0.6);
        }
        
        .marker-cluster-small div {
          background-color: rgba(25, 118, 210, 0.8);
        }
        
        .marker-cluster-medium {
          background-color: rgba(255, 152, 0, 0.6);
        }
        
        .marker-cluster-medium div {
          background-color: rgba(255, 152, 0, 0.8);
        }
        
        .marker-cluster-large {
          background-color: rgba(244, 67, 54, 0.6);
        }
        
        .marker-cluster-large div {
          background-color: rgba(244, 67, 54, 0.8);
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          .map-container {
            height: 400px;
          }
          
          .map-legend {
            padding: 8px;
            font-size: 11px;
            min-width: 150px;
          }
          
          .legend-content h6 {
            font-size: 12px;
          }
        }
      `}</style>
      
      <div className="map-container">
        {/* Use a unique key and only render when not loading */}
        <MapContainer
          key={mapKey}
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          worldCopyJump={true}
          maxBounds={[[-90, -180], [90, 180]]}
          attributionControl={true}
          zoomControl={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
        >
          {/* Layer Controls */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street Map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={18}
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Ocean Base">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={18}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Ship Markers with Clustering - only render when we have ships */}
          {validShips.length > 0 && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              disableClusteringAtZoom={13}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
            >
              {validShips.map((ship) => {
                const position = [ship.location.lat, ship.location.lng]
                const isSelected = selectedShip?.id === ship.id
                const severity = ship.violation?.severity || 'secondary'
                
                return (
                  <Marker
                    key={`ship-${ship.id}-${mapKey}`}
                    position={position}
                    icon={createShipIcon(severity, isSelected)}
                    eventHandlers={{
                      click: () => handleShipClick(ship),
                    }}
                  >
                    <Popup>
                      <div className="ship-popup-content">
                        <div className="ship-popup-title">{ship.name || 'Unknown Vessel'}</div>
                        
                        {ship.violation && (
                          <div className={`violation-badge violation-${severity}`}>
                            {ship.violation.label}
                          </div>
                        )}
                        
                        <div className="ship-popup-detail">
                          <strong>Location:</strong> {ship.location.name || formatCoordinates(ship.location.lat, ship.location.lng)}
                        </div>
                        
                        <div className="ship-popup-detail">
                          <strong>Coordinates:</strong> {formatCoordinates(ship.location.lat, ship.location.lng)}
                        </div>
                        
                        {ship.speed && (
                          <div className="ship-popup-detail">
                            <strong>Speed:</strong> {ship.speed} knots
                          </div>
                        )}
                        
                        {ship.direction !== undefined && (
                          <div className="ship-popup-detail">
                            <strong>Course:</strong> {ship.direction.toFixed(0)}°
                          </div>
                        )}
                        
                        {ship.callSign && (
                          <div className="ship-popup-detail">
                            <strong>Call Sign:</strong> {ship.callSign}
                          </div>
                        )}
                        
                        {ship.timeDetected && (
                          <div className="ship-popup-detail">
                            <strong>Detected:</strong> {formatTimeAgo(ship.timeDetected)}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MarkerClusterGroup>
          )}

          {/* Fit bounds to show all ships */}
          <FitBounds ships={validShips} />
        </MapContainer>

        {/* Legend - positioned absolutely over the map */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000
        }}>
          <MapLegend ships={validShips} />
        </div>

        {/* Status Info */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <i className="bi bi-geo-alt-fill me-1"></i>
          Maritime Tracking • {validShips.length} ships • Live AIS Data
        </div>
      </div>
    </>
  )
}

export default InteractiveMap