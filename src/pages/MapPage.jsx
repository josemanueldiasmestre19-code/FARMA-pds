import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin, Star, Clock, Navigation, Crosshair, Loader2, MousePointer2 } from 'lucide-react'
import PharmacyMap from '../components/PharmacyMap.jsx'
import { useData } from '../context/DataContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import useUserLocation from '../hooks/useUserLocation.js'

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

export default function MapPage() {
  const { pharmacies, medicines } = useData()
  const { t } = useI18n()
  const { location: userLocation, loading: locLoading, hasPermission, denied, error: locError, requestLocation } = useUserLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState(null)
  const [sortBy, setSortBy] = useState('distance')
  const [manualMode, setManualMode] = useState(false)
  const [manualLocation, setManualLocation] = useState(null)

  // Auto-select pharmacy from URL ?route=id
  useEffect(() => {
    const routeId = searchParams.get('route')
    if (routeId) {
      const id = Number(routeId)
      if (pharmacies.find((p) => p.id === id)) {
        setSelectedId(id)
        requestLocation()
      }
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, pharmacies, setSearchParams, requestLocation])

  const activeLocation = manualLocation || userLocation
  const isManuallySet = !!manualLocation

  const handleSetManualLocation = (coords) => {
    setManualLocation(coords)
    setManualMode(false)
  }

  const sortedPharmacies = useMemo(() => {
    return pharmacies
      .map((p) => ({
        ...p,
        dist: activeLocation ? distanceKm(activeLocation, p.coords) : null,
        availableCount: Object.values(p.stock).filter((s) => s.available).length,
      }))
      .sort((a, b) => {
        if (sortBy === 'distance' && a.dist != null) return a.dist - b.dist
        if (sortBy === 'rating') return b.rating - a.rating
        if (sortBy === 'stock') return b.availableCount - a.availableCount
        return 0
      })
  }, [pharmacies, userLocation, sortBy])

  const handleSelect = (id) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{t('map_title')}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{t('map_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setManualMode(!manualMode)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition ${
                  manualMode
                    ? 'bg-blue-500 text-white shadow-blue-500/30'
                    : isManuallySet
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <MousePointer2 className="w-4 h-4" />
                {manualMode ? 'Clique no mapa...' : isManuallySet ? 'Posição definida' : 'Marcar no mapa'}
              </button>
              <button
                onClick={requestLocation}
                disabled={locLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50 ${
                  hasPermission && !isManuallySet
                    ? 'bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300'
                    : denied
                    ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {locLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : hasPermission ? (
                  <Crosshair className="w-4 h-4 text-brand-600" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                GPS
              </button>
            </div>
            {manualMode && (
              <p className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold">Clique no mapa para definir a sua posição</p>
            )}
            {locError && !hasPermission && !manualMode && (
              <p className="text-[11px] text-rose-500 dark:text-rose-400 max-w-[280px] text-right">{locError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 h-[500px] sm:h-[600px]">
          <PharmacyMap
            userLocation={activeLocation}
            selectedPharmacyId={selectedId}
            onSelectPharmacy={handleSelect}
            showRoute={!!selectedId}
            onSetUserLocation={handleSetManualLocation}
            manualMode={manualMode}
          />
        </div>

        {/* Sidebar */}
        <div>
          {/* Sort controls */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 mb-4 flex gap-1 overflow-x-auto scrollbar-thin">
            {[
              { id: 'distance', label: '📍 Distância' },
              { id: 'rating', label: '⭐ Rating' },
              { id: 'stock', label: '💊 Stock' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  sortBy === s.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Pharmacy list */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
            {sortedPharmacies.map((p) => {
              const isSelected = p.id === selectedId
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className={`w-full text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border transition group ${
                    isSelected
                      ? 'border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-brand-400 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-bold text-sm ${isSelected ? 'text-brand-700 dark:text-brand-400' : 'text-slate-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400'}`}>
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {p.rating}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{p.address}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" /> {p.hours}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('map_in_stock')}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-700 dark:text-brand-400">
                        {p.availableCount}/{medicines.length}
                      </span>
                      {p.dist != null && (
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {p.dist < 1 ? `${Math.round(p.dist * 1000)}m` : `${p.dist.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick actions when selected */}
                  {isSelected && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-brand-100 dark:border-brand-900/30">
                      <Link
                        to={`/farmacia/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-center px-3 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition"
                      >
                        {t('map_see_details')}
                      </Link>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
