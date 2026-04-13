import PharmacyMap from '../components/PharmacyMap.jsx'
import { Link } from 'react-router-dom'
import { MapPin, Star, Clock } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'

export default function MapPage() {
  const { pharmacies, medicines } = useData()

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Mapa de Farmácias</h1>
        <p className="mt-2 text-slate-600">Explore todas as farmácias parceiras em Maputo</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[600px]">
          <PharmacyMap />
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
          {pharmacies.map((p) => {
            const available = Object.values(p.stock).filter((s) => s.available).length
            return (
              <Link
                key={p.id}
                to={`/farmacia/${p.id}`}
                className="block bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-400 hover:shadow-lg transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-brand-700">{p.name}</h3>
                  <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {p.rating}
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {p.address}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {p.hours}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Em stock</span>
                  <span className="text-sm font-bold text-brand-700">
                    {available}/{medicines.length}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
