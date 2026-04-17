import { useState, useEffect, useCallback } from 'react'

const MAPUTO_CENTER = [-25.9655, 32.5832]

export default function useUserLocation() {
  const [location, setLocation] = useState(MAPUTO_CENTER)
  const [loading, setLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude])
        setHasPermission(true)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setHasPermission(false)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  return { location, loading, hasPermission, error, requestLocation, MAPUTO_CENTER }
}
