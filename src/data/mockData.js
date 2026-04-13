// Utilitários de geolocalização

// Calcula distância aproximada (km) entre dois pontos lat/lng
export function distanceKm(a, b) {
  const R = 6371
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Localização simulada do utilizador (Baixa de Maputo)
export const userLocation = [-25.9655, 32.5832]
