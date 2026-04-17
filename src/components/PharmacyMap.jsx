import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { useEffect, useState } from 'react'

const pharmacyIcon = L.divIcon({
  className: '',
  html: `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#10b981,#047857);border:3px solid white;box-shadow:0 4px 16px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:20px;transition:transform 0.2s;">+</div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -22],
})

const selectedPharmacyIcon = L.divIcon({
  className: '',
  html: `<div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#059669,#064e3b);border:4px solid #10b981;box-shadow:0 6px 24px rgba(16,185,129,0.7);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:22px;animation:pulse 1.5s infinite;">+</div>`,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -26],
})

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 6px rgba(59,130,246,0.3),0 2px 8px rgba(0,0,0,0.2);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function FlyToLocation({ position, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 15, { duration: 1.2 })
    }
  }, [position, zoom, map])
  return null
}

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 1 })
    }
  }, [bounds, map])
  return null
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

function estimateTime(km) {
  const walkMin = Math.round((km / 5) * 60)
  const driveMin = Math.max(1, Math.round((km / 30) * 60))
  return { walkMin, driveMin }
}

function distanceKm(a, b) {
  const R = 6371
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export default function PharmacyMap({
  height = '100%',
  userLocation,
  selectedPharmacyId = null,
  onSelectPharmacy = null,
  showRoute = false,
}) {
  const { pharmacies, medicines } = useData()
  const { t } = useI18n()
  const [routeCoords, setRouteCoords] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)

  const selectedPharmacy = pharmacies.find((p) => p.id === selectedPharmacyId)

  // Fetch OSRM route when showRoute and selectedPharmacy
  useEffect(() => {
    if (!showRoute || !selectedPharmacy || !userLocation) {
      setRouteCoords(null)
      setRouteInfo(null)
      return
    }

    const [uLat, uLng] = userLocation
    const [pLat, pLng] = selectedPharmacy.coords

    async function fetchRoute() {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${pLng},${pLat}?overview=full&geometries=geojson`
        )
        const data = await res.json()
        if (data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          setRouteCoords(coords)
          const distKm = data.routes[0].distance / 1000
          const durMin = Math.round(data.routes[0].duration / 60)
          setRouteInfo({ distance: distKm, duration: durMin })
        }
      } catch {
        // Fallback: straight line
        setRouteCoords([userLocation, selectedPharmacy.coords])
        const dist = distanceKm(userLocation, selectedPharmacy.coords)
        setRouteInfo({ distance: dist, duration: estimateTime(dist).driveMin })
      }
    }

    fetchRoute()
  }, [showRoute, selectedPharmacy, userLocation])

  // Bounds for route
  const routeBounds = showRoute && routeCoords && routeCoords.length >= 2
    ? routeCoords
    : null

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 relative">
      <MapContainer
        center={userLocation || [-25.965, 32.58]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {flyTarget && <FlyToLocation position={flyTarget} zoom={16} />}
        {routeBounds && <FitBounds bounds={routeBounds} />}

        {/* User location */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-bold text-sm text-slate-900">{t('map_user_location')}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route polyline */}
        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: '#059669',
              weight: 5,
              opacity: 0.8,
              dashArray: '10 6',
              lineCap: 'round',
            }}
          />
        )}

        {/* Pharmacy markers */}
        {pharmacies.map((p) => {
          const isSelected = p.id === selectedPharmacyId
          const availableCount = Object.values(p.stock).filter((s) => s.available).length
          const dist = userLocation ? distanceKm(userLocation, p.coords) : null

          return (
            <Marker
              key={p.id}
              position={p.coords}
              icon={isSelected ? selectedPharmacyIcon : pharmacyIcon}
              eventHandlers={{
                click: () => {
                  onSelectPharmacy?.(p.id)
                  setFlyTarget(p.coords)
                },
              }}
            >
              <Popup maxWidth={280} minWidth={220}>
                <div className="min-w-[200px]">
                  <div className="font-bold text-slate-900 text-sm mb-0.5">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.address}</div>

                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="font-semibold text-brand-700">
                      {availableCount}/{medicines.length} {t('map_available_of')}
                    </span>
                    {dist != null && (
                      <span className="text-slate-500">
                        📍 {formatDistance(dist)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link
                      to={`/farmacia/${p.id}`}
                      className="flex-1 text-center px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700"
                    >
                      {t('common_reserve')}
                    </Link>
                    <button
                      onClick={() => {
                        onSelectPharmacy?.(p.id)
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
                    >
                      🗺️ Rota
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Route info overlay */}
      {showRoute && routeInfo && selectedPharmacy && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedPharmacy.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedPharmacy.address}</div>
            </div>
            <button
              onClick={() => onSelectPharmacy?.(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-900/30 rounded-xl">
              <span className="text-lg">🚗</span>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{formatDistance(routeInfo.distance)}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">~{routeInfo.duration} min</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-lg">🚶</span>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{formatDistance(routeInfo.distance)}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">~{estimateTime(routeInfo.distance).walkMin} min</div>
              </div>
            </div>
            <Link
              to={`/farmacia/${selectedPharmacy.id}`}
              className="ml-auto px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition"
            >
              {t('map_see_details')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
