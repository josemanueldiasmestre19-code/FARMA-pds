import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { userLocation } from '../data/mockData.js'
import { useData } from '../context/DataContext.jsx'

// Custom pharmacy icon using divIcon (SVG)
const pharmacyIcon = L.divIcon({
  className: '',
  html: `<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#10b981,#047857);border:3px solid white;box-shadow:0 6px 18px rgba(16,185,129,0.55);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:18px;">+</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

export default function PharmacyMap({ height = '100%' }) {
  const { pharmacies, medicines } = useData()

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
      <MapContainer center={[-25.965, 32.58]} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={userLocation} radius={8} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.7 }}>
          <Popup>A sua localização</Popup>
        </CircleMarker>
        {pharmacies.map((p) => {
          const availableCount = Object.values(p.stock).filter((s) => s.available).length
          return (
            <Marker key={p.id} position={p.coords} icon={pharmacyIcon}>
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{p.address}</div>
                  <div className="text-xs mt-2">
                    <span className="font-semibold text-brand-700">{availableCount}</span> de{' '}
                    {medicines.length} medicamentos disponíveis
                  </div>
                  <Link
                    to={`/farmacia/${p.id}`}
                    className="mt-3 block text-center px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
