import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Filter, SlidersHorizontal } from 'lucide-react'
import MedicineCard from '../components/MedicineCard.jsx'
import { medicines, pharmacies, distanceKm, userLocation } from '../data/mockData.js'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  useEffect(() => {
    setParams(query ? { q: query } : {})
  }, [query, setParams])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = []
    medicines.forEach((m) => {
      if (q && !m.name.toLowerCase().includes(q) && !m.category.toLowerCase().includes(q)) return
      pharmacies.forEach((p) => {
        const stock = p.stock[m.id]
        if (onlyAvailable && !stock?.available) return
        list.push({
          medicine: m,
          pharmacy: p,
          stock,
          distance: distanceKm(userLocation, p.coords),
        })
      })
    })
    return list.sort((a, b) => {
      if (a.stock?.available !== b.stock?.available) return a.stock?.available ? -1 : 1
      return a.distance - b.distance
    })
  }, [query, onlyAvailable])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Pesquisar medicamentos</h1>
        <p className="mt-2 text-slate-600">Encontre onde está disponível em Maputo</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-3 flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4">
          <SearchIcon className="w-5 h-5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome do medicamento ou categoria..."
            className="flex-1 py-3 px-3 bg-transparent outline-none text-slate-800"
          />
        </div>
        <button
          onClick={() => setOnlyAvailable(!onlyAvailable)}
          className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${
            onlyAvailable ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Filter className="w-4 h-4" /> Só disponíveis
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">
          <span className="font-bold text-slate-900">{results.length}</span> resultados encontrados
        </div>
        <div className="text-sm text-slate-500 flex items-center gap-1">
          <SlidersHorizontal className="w-4 h-4" /> Ordenado por distância
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {results.map((r, i) => (
          <MedicineCard key={`${r.medicine.id}-${r.pharmacy.id}`} {...r} />
        ))}
      </div>

      {results.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="text-slate-400 text-lg">Nenhum resultado encontrado.</div>
        </div>
      )}
    </div>
  )
}
