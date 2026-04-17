import { useState, useEffect } from 'react'
import { Package, TrendingUp, AlertCircle, CheckCircle2, Store } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { supabase } from '../lib/supabase.js'
import { useI18n } from '../context/I18nContext.jsx'

export default function Dashboard() {
  const { pharmacies, medicines, loading: dataLoading } = useData()
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState(null)
  const [stocks, setStocks] = useState({})

  // Inicializar quando os dados carregam
  useEffect(() => {
    if (pharmacies.length > 0 && !selectedId) {
      setSelectedId(pharmacies[0].id)
      setStocks(Object.fromEntries(pharmacies.map((p) => [p.id, { ...p.stock }])))
    }
  }, [pharmacies, selectedId])

  if (dataLoading || !selectedId) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-slate-500">{t('dashboard_loading')}</p>
      </div>
    )
  }

  const pharmacy = pharmacies.find((p) => p.id === selectedId)
  const currentStock = stocks[selectedId] || {}

  const toggleAvailable = async (medId) => {
    const newAvailable = !currentStock[medId].available
    setStocks((s) => ({
      ...s,
      [selectedId]: {
        ...s[selectedId],
        [medId]: { ...s[selectedId][medId], available: newAvailable },
      },
    }))
    await supabase
      .from('pharmacy_stock')
      .update({ available: newAvailable })
      .eq('pharmacy_id', selectedId)
      .eq('medicine_id', medId)
  }

  const updateQty = async (medId, qty) => {
    const numQty = Number(qty)
    const newAvailable = numQty > 0
    setStocks((s) => ({
      ...s,
      [selectedId]: {
        ...s[selectedId],
        [medId]: { qty: numQty, available: newAvailable },
      },
    }))
    await supabase
      .from('pharmacy_stock')
      .update({ qty: numQty, available: newAvailable })
      .eq('pharmacy_id', selectedId)
      .eq('medicine_id', medId)
  }

  const totalAvailable = Object.values(currentStock).filter((x) => x.available).length
  const totalUnits = Object.values(currentStock).reduce((a, b) => a + b.qty, 0)
  const lowStock = Object.entries(currentStock).filter(([_, v]) => v.available && v.qty < 20).length

  const metrics = [
    { label: t('dashboard_meds_available'), value: `${totalAvailable}/${medicines.length}`, icon: CheckCircle2, color: 'emerald' },
    { label: t('dashboard_units_stock'), value: totalUnits, icon: Package, color: 'blue' },
    { label: t('dashboard_low_stock'), value: lowStock, icon: AlertCircle, color: 'amber' },
    { label: t('dashboard_rating'), value: pharmacy?.rating, icon: TrendingUp, color: 'brand' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 font-semibold">{t('dashboard_panel')}</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{t('dashboard_title')}</h1>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
          <Store className="w-4 h-4 text-brand-600" />
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="bg-transparent outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 pr-2"
          >
            {pharmacies.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
              <m.icon className="w-5 h-5 text-brand-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{m.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Stock management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white">{t('dashboard_stock_mgmt')}</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard_update_realtime')}</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {medicines.map((m) => {
            const s = currentStock[m.id]
            if (!s) return null
            return (
              <div key={m.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white">{m.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{m.category} • {m.price} MT</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard_qty')}</label>
                  <input
                    type="number"
                    min="0"
                    value={s.qty}
                    onChange={(e) => updateQty(m.id, e.target.value)}
                    className="w-20 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  onClick={() => toggleAvailable(m.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    s.available
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                >
                  {s.available ? t('common_available') : t('common_unavailable')}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        {t('dashboard_realtime_note')}
      </p>
    </div>
  )
}
