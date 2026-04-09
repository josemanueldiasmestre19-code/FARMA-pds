import { useState } from 'react'
import { pharmacies as initialPharmacies, medicines } from '../data/mockData.js'
import { Package, TrendingUp, AlertCircle, CheckCircle2, Store } from 'lucide-react'

export default function Dashboard() {
  const [selectedId, setSelectedId] = useState(initialPharmacies[0].id)
  // Clone do stock para permitir actualizar localmente (mock)
  const [stocks, setStocks] = useState(() =>
    Object.fromEntries(initialPharmacies.map((p) => [p.id, { ...p.stock }]))
  )

  const pharmacy = initialPharmacies.find((p) => p.id === selectedId)
  const currentStock = stocks[selectedId]

  const toggleAvailable = (medId) => {
    setStocks((s) => ({
      ...s,
      [selectedId]: {
        ...s[selectedId],
        [medId]: {
          ...s[selectedId][medId],
          available: !s[selectedId][medId].available,
        },
      },
    }))
  }

  const updateQty = (medId, qty) => {
    setStocks((s) => ({
      ...s,
      [selectedId]: {
        ...s[selectedId],
        [medId]: {
          qty: Number(qty),
          available: Number(qty) > 0,
        },
      },
    }))
  }

  const totalAvailable = Object.values(currentStock).filter((x) => x.available).length
  const totalUnits = Object.values(currentStock).reduce((a, b) => a + b.qty, 0)
  const lowStock = Object.entries(currentStock).filter(([_, v]) => v.available && v.qty < 20).length

  const metrics = [
    { label: 'Medicamentos disponíveis', value: `${totalAvailable}/${medicines.length}`, icon: CheckCircle2, color: 'emerald' },
    { label: 'Unidades em stock', value: totalUnits, icon: Package, color: 'blue' },
    { label: 'Stock baixo', value: lowStock, icon: AlertCircle, color: 'amber' },
    { label: 'Rating', value: pharmacy.rating, icon: TrendingUp, color: 'brand' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 font-semibold">Painel de Gestão</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Dashboard da Farmácia</h1>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Store className="w-4 h-4 text-brand-600" />
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="bg-transparent outline-none text-sm font-semibold text-slate-800 pr-2"
          >
            {initialPharmacies.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
              <m.icon className="w-5 h-5 text-brand-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{m.value}</div>
            <div className="text-xs text-slate-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Stock management */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Gestão de Stock</h2>
          <span className="text-xs text-slate-500">Actualize em tempo real</span>
        </div>
        <div className="divide-y divide-slate-100">
          {medicines.map((m) => {
            const s = currentStock[m.id]
            return (
              <div key={m.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.category} • {m.price} MT</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Qtd:</label>
                  <input
                    type="number"
                    min="0"
                    value={s.qty}
                    onChange={(e) => updateQty(m.id, e.target.value)}
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500"
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
                  {s.available ? 'Disponível' : 'Indisponível'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        * Este é um painel simulado para fins académicos. As alterações são apenas locais.
      </p>
    </div>
  )
}
