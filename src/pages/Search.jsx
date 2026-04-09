import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon, Filter, SlidersHorizontal, PackageSearch } from 'lucide-react'
import MedicineCard from '../components/MedicineCard.jsx'
import ReserveModal from '../components/ReserveModal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { MedicineCardSkeleton } from '../components/ui/Skeleton.jsx'
import Button from '../components/ui/Button.jsx'
import { medicines, pharmacies, distanceKm, userLocation } from '../data/mockData.js'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reserveTarget, setReserveTarget] = useState(null)

  useEffect(() => {
    setParams(query ? { q: query } : {})
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(t)
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
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
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
          className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition active:scale-95 ${
            onlyAvailable ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Filter className="w-4 h-4" /> Só disponíveis
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">
          {loading ? 'A pesquisar...' : (
            <><span className="font-bold text-slate-900">{results.length}</span> resultados encontrados</>
          )}
        </div>
        <div className="text-sm text-slate-500 flex items-center gap-1">
          <SlidersHorizontal className="w-4 h-4" /> Ordenado por distância
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <MedicineCardSkeleton key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Nenhum medicamento encontrado"
          description="Tente outro nome ou remova o filtro de disponibilidade."
          action={
            <Button variant="secondary" onClick={() => { setQuery(''); setOnlyAvailable(false) }}>
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((r) => (
            <MedicineCard
              key={`${r.medicine.id}-${r.pharmacy.id}`}
              {...r}
              onReserve={(med, pharm) => setReserveTarget({ medicine: med, pharmacy: pharm })}
            />
          ))}
        </div>
      )}

      <ReserveModal
        open={!!reserveTarget}
        onClose={() => setReserveTarget(null)}
        medicine={reserveTarget?.medicine}
        pharmacy={reserveTarget?.pharmacy}
      />
    </div>
  )
}
