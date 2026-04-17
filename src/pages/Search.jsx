import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Filter, SlidersHorizontal, PackageSearch, X } from 'lucide-react'
import MedicineCard from '../components/MedicineCard.jsx'
import ReserveModal from '../components/ReserveModal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { MedicineCardSkeleton } from '../components/ui/Skeleton.jsx'
import Button from '../components/ui/Button.jsx'
import { distanceKm, userLocation } from '../data/mockData.js'
import { useData } from '../context/DataContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'

const PAGE_SIZE = 10

export default function Search() {
  const { medicines, pharmacies, loading: dataLoading } = useData()
  const { t } = useI18n()

  const SORT_OPTIONS = [
    { value: 'distance', label: t('sort_distance') },
    { value: 'price-asc', label: t('sort_price_asc') },
    { value: 'price-desc', label: t('sort_price_desc') },
    { value: 'name', label: t('sort_name') },
  ]
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('distance')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reserveTarget, setReserveTarget] = useState(null)

  // Extrair categorias únicas
  const categories = useMemo(() => {
    return [...new Set(medicines.map((m) => m.category))].sort()
  }, [medicines])

  useEffect(() => {
    setParams(query ? { q: query } : {})
    setPage(1)
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(t)
  }, [query, setParams])

  useEffect(() => {
    setPage(1)
  }, [onlyAvailable, category, sortBy])

  const results = useMemo(() => {
    if (dataLoading) return []
    const q = query.trim().toLowerCase()
    const list = []
    medicines.forEach((m) => {
      if (q && !m.name.toLowerCase().includes(q) && !m.category.toLowerCase().includes(q)) return
      if (category && m.category !== category) return
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

    // Ordenar
    return list.sort((a, b) => {
      // Disponíveis sempre primeiro
      if (a.stock?.available !== b.stock?.available) return a.stock?.available ? -1 : 1

      switch (sortBy) {
        case 'price-asc':
          return a.medicine.price - b.medicine.price
        case 'price-desc':
          return b.medicine.price - a.medicine.price
        case 'name':
          return a.medicine.name.localeCompare(b.medicine.name)
        case 'distance':
        default:
          return a.distance - b.distance
      }
    })
  }, [query, onlyAvailable, category, sortBy, medicines, pharmacies, dataLoading])

  const totalPages = Math.ceil(results.length / PAGE_SIZE)
  const paginatedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearFilters = () => {
    setQuery('')
    setOnlyAvailable(false)
    setCategory('')
    setSortBy('distance')
  }

  const hasFilters = query || onlyAvailable || category || sortBy !== 'distance'
  const isLoading = loading || dataLoading

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{t('search_title')}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{t('search_subtitle')}</p>
      </div>

      {/* Search bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-3 flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
          <SearchIcon className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="flex-1 py-3 px-3 bg-transparent outline-none text-slate-800 dark:text-slate-100 min-w-0"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setOnlyAvailable(!onlyAvailable)}
          className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95 ${
            onlyAvailable ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Filter className="w-4 h-4" /> {t('search_only_available')}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('search_category')}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-transparent outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 pr-2 cursor-pointer"
          >
            <option value="">{t('search_all')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('search_sort')}</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 pr-2 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <X className="w-3.5 h-3.5" /> {t('search_clear')}
          </button>
        )}
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {isLoading ? t('search_loading') : (
            <><span className="font-bold text-slate-900 dark:text-white">{results.length}</span> {t('search_results')}</>
          )}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <SlidersHorizontal className="w-4 h-4" /> {sortLabel}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <MedicineCardSkeleton key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={t('search_no_results_title')}
          description={t('search_no_results_desc')}
          action={<Button variant="secondary" onClick={clearFilters}>{t('search_clear')}</Button>}
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {paginatedResults.map((r) => (
              <MedicineCard
                key={`${r.medicine.id}-${r.pharmacy.id}`}
                {...r}
                onReserve={(med, pharm) => setReserveTarget({ medicine: med, pharmacy: pharm })}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t('search_prev')}
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .map((n, i, arr) => (
                    <div key={n} className="flex items-center">
                      {i > 0 && arr[i - 1] !== n - 1 && <span className="text-slate-400 px-1">…</span>}
                      <button
                        onClick={() => setPage(n)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                          n === page ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {n}
                      </button>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t('search_next')}
              </button>
            </div>
          )}
        </>
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
