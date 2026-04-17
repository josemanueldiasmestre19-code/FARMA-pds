import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { useEffect, useState, useRef } from 'react'
import { Loader2, Navigation, Car, Footprints, X, ExternalLink } from 'lucide-react'

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
    if (position) map.flyTo(position, zoom || 15, { duration: 1.2 })
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

function estimateWalkTime(km) {
  return Math.max(1, Math.round((km / 5) * 60))
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
  onRequestLocation = null,
}) {
  const { pharmacies, medicines } = useData()
  const { t } = useI18n()
  const [routeCoords, setRouteCoords] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const prevSelectedRef = useRef(null)

  const selectedPharmacy = pharmacies.find((p) => p.id === selectedPharmacyId)

  useEffect(() => {
    if (!showRoute || !selectedPharmacy || !userLocation) {
      setRouteCoords(null)
      setRouteInfo(null)
      setRouteLoading(false)
      return
    }

    if (prevSelectedRef.current === selectedPharmacyId) return
    prevSelectedRef.current = selectedPharmacyId

    const [uLat, uLng] = userLocation
    const [pLat, pLng] = selectedPharmacy.coords

    async function fetchRoute() {
      setRouteLoading(true)
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${pLng},${pLat}?overview=full&geometries=geojson`
        )
        const data = await res.json()
        if (data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          setRouteCoords(coords)
          setRouteInfo({
            distance: data.routes[0].distance / 1000,
            driveDuration: Math.max(1, Math.round(data.routes[0].duration / 60)),
            walkDuration: estimateWalkTime(data.routes[0].distance / 1000),
          })
        } else {
          fallbackRoute()
        }
      } catch {
        fallbackRoute()
      }
      setRouteLoading(false)
    }

    function fallbackRoute() {
      setRouteCoords([userLocation, selectedPharmacy.coords])
      const dist = distanceKm(userLocation, selectedPharmacy.coords)
      setRouteInfo({
        distance: dist,
        driveDuration: Math.max(1, Math.round((dist / 30) * 60)),
        walkDuration: estimateWalkTime(dist),
      })
    }

    fetchRoute()
  }, [showRoute, selectedPharmacyId, selectedPharmacy, userLocation])

  useEffect(() => {
    if (!showRoute || !selectedPharmacyId) {
      prevSelectedRef.current = null
    }
  }, [showRoute, selectedPharmacyId])

  const handleSelectAndRoute = (pharmacyId) => {
    if (!userLocation || !onRequestLocation) {
      onSelectPharmacy?.(pharmacyId)
      return
    }
    onSelectPharmacy?.(pharmacyId)
    setFlyTarget(null)
  }

  const routeBounds = showRoute && routeCoords && routeCoords.length >= 2 ? routeCoords : null

  const googleMapsUrl = selectedPharmacy && userLocation
    ? `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${selectedPharmacy.coords[0]},${selectedPharmacy.coords[1]}`
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

        {/* User */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center font-bold text-sm text-slate-900">
                {t('map_user_location')}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route */}
        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: '#059669',
              weight: 5,
              opacity: 0.85,
              dashArray: '12 8',
              lineCap: 'round',
            }}
          />
        )}

        {/* Pharmacies */}
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
                  setFlyTarget(p.coords)
                },
              }}
            >
              <Popup maxWidth={280} minWidth={220}>
                <div className="min-w-[200px]">
                  <div className="font-bold text-slate-900 text-sm mb-0.5">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.address}</div>

                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="font-semibold text-emerald-700">
                      {availableCount}/{medicines.length} meds
                    </span>
                    {dist != null && (
                      <span className="text-slate-500">📍 {formatDistance(dist)}</span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Link
                      to={`/farmacia/${p.id}`}
                      className="flex-1 text-center px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                    >
                      {t('map_see_details')}
                    </Link>
                    <button
                      onClick={() => handleSelectAndRoute(p.id)}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" /> Rota
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Route loading overlay */}
      {routeLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-slate-900 rounded-xl shadow-lg px-4 py-2 flex items-center gap-2 border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">A calcular rota...</span>
        </div>
      )}

      {/* Route info panel */}
      {showRoute && routeInfo && selectedPharmacy && !routeLoading && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{selectedPharmacy.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{selectedPharmacy.address}</div>
            </div>
            <button
              onClick={() => {
                onSelectPharmacy?.(null)
                prevSelectedRef.current = null
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Car className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{formatDistance(routeInfo.distance)}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">~{routeInfo.driveDuration} min</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <Footprints className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{formatDistance(routeInfo.distance)}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">~{routeInfo.walkDuration} min</div>
              </div>
            </div>

            <div className="flex gap-2 ml-auto">
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Google Maps
                </a>
              )}
              <Link
                to={`/farmacia/${selectedPharmacy.id}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition"
              >
                {t('map_see_details')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
