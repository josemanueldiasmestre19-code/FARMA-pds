import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Filter, SlidersHorizontal, PackageSearch, X, MapPin, Crosshair, Loader2 } from 'lucide-react'
import MedicineCard from '../components/MedicineCard.jsx'
import ReserveModal from '../components/ReserveModal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { MedicineCardSkeleton } from '../components/ui/Skeleton.jsx'
import Button from '../components/ui/Button.jsx'
import { distanceKm } from '../data/mockData.js'
import { useData } from '../context/DataContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import useUserLocation from '../hooks/useUserLocation.js'
import usePageTitle from '../hooks/usePageTitle.js'
import { normalize } from '../lib/format.js'

const PAGE_SIZE = 10

export default function Search() {
  const { medicines, pharmacies, loading: dataLoading } = useData()
  const { t } = useI18n()
  usePageTitle(t('search_title'))
  const { location: userLocation, hasPermission, loading: locLoading, requestLocation } = useUserLocation()

  const SORT_OPTIONS = [
    { value: 'distance', label: t('sort_distance') },
    { value: 'price-asc', label: t('sort_price_asc') },
    { value: 'price-desc', label: t('sort_price_desc') },
    { value: 'name', label: t('sort_name') },
  ]
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [onlyAvailable, setOnlyAvailable] = useState(params.get('disponiveis') === '1')
  const [category, setCategory] = useState(params.get('cat') || '')
  const [sortBy, setSortBy] = useState('distance')
  const [page, setPage] = useState(1)
  const [debouncing, setDebouncing] = useState(false)
  const [reserveTarget, setReserveTarget] = useState(null)

  const categories = useMemo(() => [...new Set(medicines.map((m) => m.category))].sort(), [medicines])

  // Sincroniza o URL (partilhável) e faz um pequeno debounce visual
  useEffect(() => {
    const next = {}
    if (query) next.q = query
    if (category) next.cat = category
    if (onlyAvailable) next.disponiveis = '1'
    setParams(next, { replace: true })
    setPage(1)
    setDebouncing(true)
    const id = setTimeout(() => setDebouncing(false), 250)
    return () => clearTimeout(id)
  }, [query, category, onlyAvailable, setParams])

  useEffect(() => { setPage(1) }, [sortBy])

  const { results, hiddenOutOfStock } = useMemo(() => {
    if (dataLoading) return { results: [], hiddenOutOfStock: 0 }
    const q = normalize(query)
    const list = []
    let hidden = 0
    medicines.forEach((m) => {
      if (q && !normalize(m.name).includes(q) && !normalize(m.category).includes(q)) return
      if (category && m.category !== category) return
      pharmacies.forEach((p) => {
        const stock = p.stock[m.id]
        if (onlyAvailable && !stock?.available) { hidden++; return }
        list.push({ medicine: m, pharmacy: p, stock, distance: distanceKm(userLocation, p.coords) })
      })
    })

    list.sort((a, b) => {
      // Disponíveis sempre primeiro
      if (!!a.stock?.available !== !!b.stock?.available) return a.stock?.available ? -1 : 1
      switch (sortBy) {
        case 'price-asc': return a.medicine.price - b.medicine.price
        case 'price-desc': return b.medicine.price - a.medicine.price
        case 'name': return a.medicine.name.localeCompare(b.medicine.name, 'pt')
        default: return a.distance - b.distance
      }
    })
    return { results: list, hiddenOutOfStock: hidden }
  }, [query, onlyAvailable, category, sortBy, medicines, pharmacies, dataLoading, userLocation])

  const availableCount = useMemo(() => results.filter((r) => r.stock?.available).length, [results])
  const totalPages = Math.ceil(results.length / PAGE_SIZE)
  const paginatedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearFilters = () => {
    setQuery('')
    setOnlyAvailable(false)
    setCategory('')
    setSortBy('distance')
  }

  const hasFilters = query || onlyAvailable || category || sortBy !== 'distance'
  const isLoading = debouncing || dataLoading
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
            type="search"
            aria-label={t('search_title')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="flex-1 py-3 px-3 bg-transparent outline-none text-slate-800 dark:text-slate-100 min-w-0"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Limpar pesquisa" className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setOnlyAvailable(!onlyAvailable)}
          aria-pressed={onlyAvailable}
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
          <label htmlFor="search-cat" className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('search_category')}</label>
          <select id="search-cat" value={category} onChange={(e) => setCategory(e.target.value)}
            className="bg-transparent outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 pr-2 cursor-pointer">
            <option value="">{t('search_all')}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
          <label htmlFor="search-sort" className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('search_sort')}</label>
          <select id="search-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 pr-2 cursor-pointer">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button
          onClick={requestLocation}
          disabled={locLoading}
          title="Usar a minha localização para ordenar por distância"
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition ${
            hasPermission
              ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          {locLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasPermission ? <Crosshair className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
          {hasPermission ? 'A usar a sua localização' : 'Distâncias a partir da Baixa'}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition">
            <X className="w-3.5 h-3.5" /> {t('search_clear')}
          </button>
        )}
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2" aria-live="polite">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {isLoading ? t('search_loading') : (
            <>
              <span className="font-bold text-slate-900 dark:text-white">{results.length}</span> {t('search_results')}
              {results.length > 0 && (
                <span className="text-slate-400"> · {availableCount} em stock</span>
              )}
            </>
          )}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <SlidersHorizontal className="w-4 h-4" /> {sortLabel}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <MedicineCardSkeleton key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={onlyAvailable && hiddenOutOfStock > 0 ? 'Sem stock neste momento' : t('search_no_results_title')}
          description={
            onlyAvailable && hiddenOutOfStock > 0
              ? `Encontrámos ${hiddenOutOfStock} ${hiddenOutOfStock === 1 ? 'farmácia' : 'farmácias'} com este medicamento, mas sem stock. Desactive o filtro para as ver.`
              : t('search_no_results_desc')
          }
          action={<Button variant="secondary" onClick={onlyAvailable ? () => setOnlyAvailable(false) : clearFilters}>
            {onlyAvailable && hiddenOutOfStock > 0 ? 'Mostrar também sem stock' : t('search_clear')}
          </Button>}
        />
      ) : (
        <>
          {availableCount === 0 && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              Nenhuma farmácia tem este medicamento em stock neste momento. Tente mais tarde ou pesquise uma alternativa.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedResults.map((r) => (
              <MedicineCard
                key={`${r.medicine.id}-${r.pharmacy.id}`}
                {...r}
                onReserve={(med, pharm) => setReserveTarget({ medicine: med, pharmacy: pharm })}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginação">
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
                        aria-current={n === page ? 'page' : undefined}
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
            </nav>
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
