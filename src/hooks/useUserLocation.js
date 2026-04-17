import { useState, useEffect, useCallback } from 'react'

const MAPUTO_CENTER = [-25.9655, 32.5832]

export default function useUserLocation() {
  const [location, setLocation] = useState(MAPUTO_CENTER)
  const [loading, setLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState(null)
  const [denied, setDenied] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste browser')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude])
        setHasPermission(true)
        setDenied(false)
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        if (err.code === 1) {
          setDenied(true)
          setError('Permissão de localização negada. Verifique as definições do browser.')
        } else if (err.code === 2) {
          setError('Localização indisponível. A usar localização padrão.')
        } else {
          setError('Tempo expirado. Tente novamente.')
        }
        setHasPermission(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    )
  }, [])

  // Watch position for continuous updates
  useEffect(() => {
    if (!navigator.geolocation) return

    // First try
    requestLocation()

    // Then watch for updates
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude])
        setHasPermission(true)
        setDenied(false)
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [requestLocation])

  return { location, loading, hasPermission, error, denied, requestLocation, MAPUTO_CENTER }
}
