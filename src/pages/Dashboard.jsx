import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Package, AlertCircle, CheckCircle2, Store, Inbox, Wallet, Search, Star, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { useI18n } from '../context/I18nContext.jsx'
import { translateError } from '../lib/errors.js'
import { formatMT, normalize } from '../lib/format.js'
import usePageTitle from '../hooks/usePageTitle.js'
import EmptyState from '../components/ui/EmptyState.jsx'

const LOW_STOCK = 10
const PAGE_SIZE = 15

export default function Dashboard() {
  const { pharmacies, medicines, loading: dataLoading, refetch } = useData()
  const { isAdmin, pharmacyId } = useAuth()
  const { t } = useI18n()
  usePageTitle(t('dashboard_title'))
  const [selectedId, setSelectedId] = useState(null)
  const [stocks, setStocks] = useState({})
  const [saving, setSaving] = useState({})   // { [medId]: true }
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all') // all | available | low | out
  const [page, setPage] = useState(1)
  const timers = useRef({})

  // Pessoal de farmácia só vê a sua; admin vê todas
  const accessiblePharmacies = useMemo(() => {
    if (isAdmin) return pharmacies
    if (pharmacyId != null) return pharmacies.filter((p) => p.id === pharmacyId)
    return []
  }, [pharmacies, isAdmin, pharmacyId])

  useEffect(() => {
    if (accessiblePharmacies.length > 0 && !selectedId) setSelectedId(accessiblePharmacies[0].id)
  }, [accessiblePharmacies, selectedId])

  // Estado local espelha o DataContext (que já recebe realtime), excepto enquanto se edita
  useEffect(() => {
    setStocks(Object.fromEntries(pharmacies.map((p) => [p.id, { ...p.stock }])))
  }, [pharmacies])

  useEffect(() => { setPage(1) }, [query, filter, selectedId])

  const pharmacy = pharmacies.find((p) => p.id === selectedId)
  const currentStock = stocks[selectedId] || {}

  // Farmácia acabada de aprovar: o token já tem pharmacy_id mas a lista ainda não a inclui
  const awaitingPharmacy = pharmacyId != null && !pharmacies.some((p) => p.id === pharmacyId)
  useEffect(() => {
    if (!awaitingPharmacy) return
    const id = setTimeout(refetch, 800)
    return () => clearTimeout(id)
  }, [awaitingPharmacy, refetch, pharmacies])

  const persist = useCallback(async (medId, patch) => {
    setSaving((s) => ({ ...s, [medId]: true }))
    const { error } = await supabase
      .from('pharmacy_stock')
      .update(patch)
      .eq('pharmacy_id', selectedId)
      .eq('medicine_id', medId)
    setSaving((s) => { const n = { ...s }; delete n[medId]; return n })
    if (error) {
      toast.error('Não foi possível guardar: ' + translateError(error.message))
      // Repõe o valor do servidor
      const server = pharmacies.find((p) => p.id === selectedId)?.stock[medId]
      if (server) setStocks((s) => ({ ...s, [selectedId]: { ...s[selectedId], [medId]: server } }))
    }
  }, [selectedId, pharmacies])

  const setLocal = (medId, patch) =>
    setStocks((s) => ({ ...s, [selectedId]: { ...s[selectedId], [medId]: { ...s[selectedId][medId], ...patch } } }))

  const toggleAvailable = (medId) => {
    const next = !currentStock[medId].available
    const patch = next && currentStock[medId].qty === 0 ? { available: true, qty: 1 } : { available: next }
    setLocal(medId, patch)
    persist(medId, patch)
  }

  // Guarda 600ms depois de parar de escrever (evita um UPDATE por tecla)
  const updateQty = (medId, raw) => {
    const qty = Math.max(0, Math.floor(Number(raw) || 0))
    const patch = { qty, available: qty > 0 }
    setLocal(medId, patch)
    clearTimeout(timers.current[medId])
    timers.current[medId] = setTimeout(() => persist(medId, patch), 600)
  }

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])

  const rows = useMemo(() => {
    const q = normalize(query)
    return medicines
      .map((m) => ({ m, s: currentStock[m.id] }))
      .filter(({ m, s }) => s && (!q || normalize(m.name).includes(q) || normalize(m.category).includes(q)))
      .filter(({ s }) => {
        if (filter === 'available') return s.available
        if (filter === 'low') return s.available && s.qty <= LOW_STOCK
        if (filter === 'out') return !s.available
        return true
      })
  }, [medicines, currentStock, query, filter])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if ((dataLoading && pharmacies.length === 0) || awaitingPharmacy) {
    return (
      <div className="py-20 text-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
        {awaitingPharmacy && <p className="text-sm text-slate-500 mt-3">A preparar o dashboard da sua farmácia...</p>}
      </div>
    )
  }
  if (!pharmacy) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState icon={Store} title="Sem farmácia associada" description="A sua conta ainda não está ligada a nenhuma farmácia." />
      </div>
    )
  }

  const values = Object.values(currentStock)
  const totalAvailable = values.filter((x) => x.available).length
  const totalUnits = values.reduce((a, b) => a + (b.qty || 0), 0)
  const lowStock = values.filter((v) => v.available && v.qty <= LOW_STOCK).length
  const outOfStock = values.filter((v) => !v.available).length

  const metrics = [
    { label: t('dashboard_meds_available'), value: `${totalAvailable}/${medicines.length}`, icon: CheckCircle2, color: 'emerald' },
    { label: t('dashboard_units_stock'), value: totalUnits.toLocaleString('pt-MZ'), icon: Package, color: 'blue' },
    { label: t('dashboard_low_stock'), value: lowStock, icon: AlertCircle, color: 'amber', onClick: () => setFilter('low') },
    { label: 'Avaliação', value: pharmacy.rating > 0 ? `${Number(pharmacy.rating).toFixed(1)} / 5` : '—', icon: Star, color: 'brand' },
  ]
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300',
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 font-semibold">{t('dashboard_panel')}</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{t('dashboard_title')}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link to="/dashboard/reservas" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 shadow-md shadow-blue-500/30 transition">
              <Inbox className="w-4 h-4" /> Reservas recebidas
            </Link>
            <Link to="/dashboard/carteira" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 shadow-md shadow-brand-500/30 transition">
              <Wallet className="w-4 h-4" /> Minha carteira
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
          <Store className="w-4 h-4 text-brand-600" />
          {accessiblePharmacies.length > 1 ? (
            <select
              aria-label="Farmácia"
              value={selectedId}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="bg-transparent outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 pr-2"
            >
              {accessiblePharmacies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 pr-2">{pharmacy.name}</span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {metrics.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={m.onClick}
            disabled={!m.onClick}
            className={`text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 transition ${m.onClick ? 'hover:border-amber-300 hover:shadow-lg cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[m.color]}`}>
              <m.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{m.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.label}</div>
          </button>
        ))}
      </div>

      {/* Stock management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h2 className="font-bold text-slate-900 dark:text-white">{t('dashboard_stock_mgmt')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">As alterações ficam visíveis aos clientes imediatamente.</p>
          </div>
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="search"
              aria-label="Filtrar medicamentos"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar medicamentos..."
              className="flex-1 px-2 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 min-w-0"
            />
            {query && <button onClick={() => setQuery('')} aria-label="Limpar" className="text-slate-400"><X className="w-3.5 h-3.5" /></button>}
          </div>
        </div>
        <div className="px-4 sm:px-6 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-1 overflow-x-auto scrollbar-thin">
          {[
            { id: 'all', label: 'Todos', n: values.length },
            { id: 'available', label: 'Disponíveis', n: totalAvailable },
            { id: 'low', label: 'Stock baixo', n: lowStock },
            { id: 'out', label: 'Esgotados', n: outOfStock },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filter === f.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {f.label} <span className="opacity-60">{f.n}</span>
            </button>
          ))}
        </div>

        {pageRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Nenhum medicamento corresponde ao filtro.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pageRows.map(({ m, s }) => {
              const low = s.available && s.qty <= LOW_STOCK
              return (
                <div key={m.id} className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div className="w-full sm:w-auto sm:flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">{m.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>{m.category} • {formatMT(m.price)}</span>
                      {low && <span className="text-amber-600 dark:text-amber-400 font-semibold">Stock baixo</span>}
                      {saving[m.id] && <Loader2 className="w-3 h-3 animate-spin text-brand-600" aria-label="A guardar" />}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard_qty')}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      aria-label={`Quantidade de ${m.name}`}
                      value={s.qty}
                      onChange={(e) => updateQty(m.id, e.target.value)}
                      className={`w-16 sm:w-20 px-2 sm:px-3 py-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm text-center outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
                        low ? 'border-amber-300' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </label>
                  <button
                    onClick={() => toggleAvailable(m.id)}
                    aria-pressed={s.available}
                    className={`shrink-0 w-24 sm:w-28 px-2 py-2 rounded-lg text-xs font-semibold transition ${
                      s.available
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300'
                    }`}
                  >
                    {s.available ? t('common_available') : t('common_unavailable')}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{rows.length} medicamentos · página {page} de {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40">Próximo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
