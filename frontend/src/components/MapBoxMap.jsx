import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl'
import Supercluster from 'supercluster'

// Ship marker colors based on violation severity
const SEVERITY_COLORS = {
  danger: '#dc3545',
  warning: '#ffc107', 
  info: '#0dcaf0',
  secondary: '#6c757d'
}

// Create ship marker component
const ShipMarker = ({ ship, onClick, isSelected }) => {
  const severity = ship.violation?.severity || 'secondary'
  const color = SEVERITY_COLORS[severity]
  const size = isSelected ? 32 : 24

  return (
    <Marker
      longitude={ship.location.lng}
      latitude={ship.location.lat}
      anchor="center"
    >
      <div
        className="ship-marker"
        onClick={(e) => {
          e.stopPropagation()
          onClick(ship)
        }}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          border: '3px solid white',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size * 0.5}px`,
          boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease',
          zIndex: isSelected ? 1000 : 100
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.3)'
          e.target.style.boxShadow = '0 5px 10px rgba(0,0,0,0.5)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)'
          e.target.style.boxShadow = '0 3px 6px rgba(0,0,0,0.4)'
        }}
      >
        🚢
      </div>
    </Marker>
  )
}

// Cluster marker component
const ClusterMarker = ({ cluster, onClick }) => {
  const [longitude, latitude] = cluster.geometry.coordinates
  const { point_count } = cluster.properties
  
  // Determine cluster color based on size
  let clusterColor = '#1976d2'
  let textColor = 'white'
  
  if (point_count >= 100) {
    clusterColor = '#f44336'
  } else if (point_count >= 50) {
    clusterColor = '#ff9800'
  } else if (point_count >= 10) {
    clusterColor = '#2196f3'
  }

  const size = Math.min(40 + (point_count / 10) * 5, 60)

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <div
        className="cluster-marker"
        onClick={onClick}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: clusterColor,
          border: '3px solid white',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: textColor,
          boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)'
        }}
      >
        {point_count}
      </div>
    </Marker>
  )
}

// Map legend component
const MapLegend = ({ ships }) => {
  const violationCounts = ships.reduce((acc, ship) => {
    const severity = ship.violation?.severity || 'secondary'
    acc[severity] = (acc[severity] || 0) + 1
    return acc
  }, {})

  return (
    <div className="map-legend">
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
                backgroundColor: SEVERITY_COLORS[severity],
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

const MapBoxMap = ({ ships = [], onShipClick, loading }) => {
  const [selectedShip, setSelectedShip] = useState(null)
  const [popupInfo, setPopupInfo] = useState(null)
  const [viewState, setViewState] = useState({
    longitude: 125,
    latitude: 25,
    zoom: 4,
    pitch: 0,
    bearing: 0
  })
  
  const mapRef = useRef()

  // Initialize supercluster for clustering
  const cluster = useMemo(() => {
    const supercluster = new Supercluster({
      radius: 60,
      maxZoom: 12,
      minZoom: 0,
      minPoints: 2
    })
    
    // Convert ships to GeoJSON points
    const points = ships
      .filter(ship => ship.location && ship.location.lat && ship.location.lng)
      .map(ship => ({
        type: 'Feature',
        properties: {
          cluster: false,
          shipId: ship.id,
          ship: ship
        },
        geometry: {
          type: 'Point',
          coordinates: [ship.location.lng, ship.location.lat]
        }
      }))
    
    supercluster.load(points)
    return supercluster
  }, [ships])

  // Get clusters and points for current view
  const { clusters, points } = useMemo(() => {
    if (!mapRef.current) return { clusters: [], points: [] }
    
    const map = mapRef.current
    const bounds = map.getBounds()
    
    if (!bounds) return { clusters: [], points: [] }
    
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(), 
      bounds.getEast(),
      bounds.getNorth()
    ]
    
    const zoom = Math.floor(map.getZoom())
    const clusters = cluster.getClusters(bbox, zoom)
    
    return {
      clusters: clusters.filter(cluster => cluster.properties.cluster),
      points: clusters.filter(cluster => !cluster.properties.cluster)
    }
  }, [cluster, viewState])

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
    setPopupInfo({
      longitude: ship.location.lng,
      latitude: ship.location.lat,
      ship: ship
    })
    if (onShipClick) {
      onShipClick(ship)
    }
  }, [onShipClick])

  const handleClusterClick = useCallback((cluster) => {
    const [longitude, latitude] = cluster.geometry.coordinates
    const zoomLevel = Math.min(cluster.properties.expansion_zoom || viewState.zoom + 2, 20)
    
    setViewState(prev => ({
      ...prev,
      longitude,
      latitude, 
      zoom: zoomLevel,
      transitionDuration: 500
    }))
  }, [viewState.zoom])

  // Auto-fit bounds when ships change
  useEffect(() => {
    if (!mapRef.current || !ships.length) return

    const validShips = ships.filter(ship => 
      ship.location && ship.location.lat && ship.location.lng
    )
    
    if (validShips.length === 0) return

    const coordinates = validShips.map(ship => [ship.location.lng, ship.location.lat])
    
    // Calculate bounds
    const bounds = coordinates.reduce((bounds, coord) => {
      return [
        [Math.min(coord[0], bounds[0][0]), Math.min(coord[1], bounds[0][1])],
        [Math.max(coord[0], bounds[1][0]), Math.max(coord[1], bounds[1][1])]
      ]
    }, [coordinates[0], coordinates[0]])

    mapRef.current.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 12
    })
  }, [ships])

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
        
        .ship-marker {
          cursor: pointer;
        }
        
        .cluster-marker {
          cursor: pointer;
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
        
        .legend-text {
          color: #666;
        }
        
        .legend-total {
          font-size: 11px;
          color: #333;
        }
        
        .ship-popup-content {
          font-size: 13px;
          padding: 8px;
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
        
        .map-status-info {
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
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="https://api.maptiler.com/maps/openstreetmap/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL"
          mapboxAccessToken="" // Not needed for OpenStreetMap
          attributionControl={true}
          cooperativeGestures={false}
        >
          {/* Navigation Controls */}
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />
          <ScaleControl />

          {/* Render clusters */}
          {clusters.map((cluster, index) => (
            <ClusterMarker
              key={`cluster-${index}`}
              cluster={cluster}
              onClick={() => handleClusterClick(cluster)}
            />
          ))}

          {/* Render individual ship markers */}
          {points.map((point) => {
            const ship = point.properties.ship
            return (
              <ShipMarker
                key={`ship-${ship.id}`}
                ship={ship}
                onClick={handleShipClick}
                isSelected={selectedShip?.id === ship.id}
              />
            )
          })}

          {/* Ship Popup */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              onClose={() => setPopupInfo(null)}
              closeButton={true}
              closeOnClick={false}
              anchor="bottom"
            >
              <div className="ship-popup-content">
                <div className="ship-popup-title">
                  {popupInfo.ship.name || 'Unknown Vessel'}
                </div>
                
                {popupInfo.ship.violation && (
                  <div className={`violation-badge violation-${popupInfo.ship.violation.severity || 'secondary'}`}>
                    {popupInfo.ship.violation.label}
                  </div>
                )}
                
                <div className="ship-popup-detail">
                  <strong>Location:</strong> {popupInfo.ship.location.name || formatCoordinates(popupInfo.ship.location.lat, popupInfo.ship.location.lng)}
                </div>
                
                <div className="ship-popup-detail">
                  <strong>Coordinates:</strong> {formatCoordinates(popupInfo.ship.location.lat, popupInfo.ship.location.lng)}
                </div>
                
                {popupInfo.ship.speed && (
                  <div className="ship-popup-detail">
                    <strong>Speed:</strong> {popupInfo.ship.speed} knots
                  </div>
                )}
                
                {popupInfo.ship.direction !== undefined && (
                  <div className="ship-popup-detail">
                    <strong>Course:</strong> {popupInfo.ship.direction.toFixed(0)}°
                  </div>
                )}
                
                {popupInfo.ship.callSign && (
                  <div className="ship-popup-detail">
                    <strong>Call Sign:</strong> {popupInfo.ship.callSign}
                  </div>
                )}
                
                {popupInfo.ship.timeDetected && (
                  <div className="ship-popup-detail">
                    <strong>Detected:</strong> {formatTimeAgo(popupInfo.ship.timeDetected)}
                  </div>
                )}
              </div>
            </Popup>
          )}
        </Map>

        {/* Legend */}
        <MapLegend ships={ships.filter(ship => ship.location && ship.location.lat && ship.location.lng)} />

        {/* Status Info */}
        <div className="map-status-info">
          <i className="bi bi-geo-alt-fill me-1"></i>
          Maritime Tracking • {ships.filter(ship => ship.location && ship.location.lat && ship.location.lng).length} ships • Live AIS Data
        </div>
      </div>
    </>
  )
}

export default MapBoxMap