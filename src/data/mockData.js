// Mock data: farmácias e medicamentos simulados em Maputo
export const medicines = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Analgésico', price: 85 },
  { id: 2, name: 'Amoxicilina 500mg', category: 'Antibiótico', price: 320 },
  { id: 3, name: 'Losartan 50mg', category: 'Hipertensão', price: 450 },
  { id: 4, name: 'Insulina Humana', category: 'Diabetes', price: 1200 },
  { id: 5, name: 'Ibuprofeno 400mg', category: 'Anti-inflamatório', price: 150 },
  { id: 6, name: 'Omeprazol 20mg', category: 'Gastro', price: 220 },
  { id: 7, name: 'Metformina 850mg', category: 'Diabetes', price: 180 },
  { id: 8, name: 'Salbutamol Inalador', category: 'Respiratório', price: 550 },
]

export const pharmacies = [
  {
    id: 1,
    name: 'Farmácia Central Maputo',
    address: 'Av. 25 de Setembro, Baixa, Maputo',
    phone: '+258 21 123 456',
    hours: '07:00 - 22:00',
    coords: [-25.9692, 32.5732],
    rating: 4.8,
    stock: {
      1: { available: true, qty: 120 },
      2: { available: true, qty: 45 },
      3: { available: true, qty: 30 },
      4: { available: false, qty: 0 },
      5: { available: true, qty: 80 },
      6: { available: true, qty: 60 },
      7: { available: false, qty: 0 },
      8: { available: true, qty: 15 },
    },
  },
  {
    id: 2,
    name: 'Farmácia Sommerschield',
    address: 'Av. Kim Il Sung, Sommerschield, Maputo',
    phone: '+258 21 491 234',
    hours: '08:00 - 21:00',
    coords: [-25.9553, 32.5912],
    rating: 4.6,
    stock: {
      1: { available: true, qty: 90 },
      2: { available: false, qty: 0 },
      3: { available: true, qty: 25 },
      4: { available: true, qty: 8 },
      5: { available: true, qty: 50 },
      6: { available: true, qty: 40 },
      7: { available: true, qty: 35 },
      8: { available: false, qty: 0 },
    },
  },
  {
    id: 3,
    name: 'Farmácia Polana',
    address: 'Av. Julius Nyerere, Polana, Maputo',
    phone: '+258 21 490 888',
    hours: '24 horas',
    coords: [-25.9633, 32.6008],
    rating: 4.9,
    stock: {
      1: { available: true, qty: 200 },
      2: { available: true, qty: 70 },
      3: { available: true, qty: 55 },
      4: { available: true, qty: 20 },
      5: { available: true, qty: 100 },
      6: { available: false, qty: 0 },
      7: { available: true, qty: 60 },
      8: { available: true, qty: 25 },
    },
  },
  {
    id: 4,
    name: 'Farmácia Matola',
    address: 'Av. das Indústrias, Matola',
    phone: '+258 21 720 555',
    hours: '07:30 - 20:00',
    coords: [-25.9622, 32.4589],
    rating: 4.4,
    stock: {
      1: { available: true, qty: 65 },
      2: { available: true, qty: 30 },
      3: { available: false, qty: 0 },
      4: { available: false, qty: 0 },
      5: { available: true, qty: 40 },
      6: { available: true, qty: 20 },
      7: { available: true, qty: 45 },
      8: { available: true, qty: 10 },
    },
  },
]

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
