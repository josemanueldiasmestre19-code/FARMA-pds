import { useState, useEffect, useMemo, useCallback } from 'react'
import { ShieldCheck, ShoppingBag, Package, Store, Users, TrendingUp, Percent, Loader2, RefreshCw } from 'lucide-react'
import WalletView from '../components/WalletView.jsx'
import BarChart from '../components/charts/BarChart.jsx'
import Button from '../components/ui/Button.jsx'
import { supabase } from '../lib/supabase.js'
import { formatMT } from '../lib/format.js'
import { translateError } from '../lib/errors.js'
import usePageTitle from '../hooks/usePageTitle.js'

const DAYS = 14

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10)
}

export default function AdminWallet() {
  usePageTitle('Finanças')
  const [state, setState] = useState({ loading: true, error: null, reservations: [], pharmacies: 0, users: 0 })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const since = new Date(Date.now() - (DAYS - 1) * 86400000)
    since.setHours(0, 0, 0, 0)
    const [res, pharms, apps] = await Promise.all([
      supabase.from('reservations').select('id, status, price, commission, total_paid, payment_status, created_at').order('created_at', { ascending: false }),
      supabase.from('pharmacies').select('id', { count: 'exact', head: true }),
      supabase.from('pharmacy_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    const err = res.error || pharms.error || apps.error
    if (err) { setState((s) => ({ ...s, loading: false, error: translateError(err.message) })); return }
    setState({ loading: false, error: null, reservations: res.data || [], pharmacies: pharms.count ?? 0, pendingApps: apps.count ?? 0, since })
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('admin-wallet-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const { reservations } = state
  const summary = useMemo(() => {
    const paid = reservations.filter((r) => r.payment_status === 'completed')
    const users = new Set(reservations.map((r) => r.user_id)).size
    return {
      total: reservations.length,
      completed: reservations.filter((r) => r.status === 'concluida').length,
      gmv: paid.reduce((a, r) => a + Number(r.price || 0), 0),
      commissions: paid.reduce((a, r) => a + Number(r.commission || 0), 0),
      users,
    }
  }, [reservations])

  const series = useMemo(() => {
    const days = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (DAYS - 1 - i))
      return d
    })
    const byDay = new Map(days.map((d) => [dayKey(d), { count: 0, gmv: 0, commission: 0 }]))
    for (const r of reservations) {
      const k = dayKey(r.created_at)
      const b = byDay.get(k)
      if (!b) continue
      b.count++
      if (r.payment_status === 'completed') {
        b.gmv += Number(r.price || 0)
        b.commission += Number(r.commission || 0)
      }
    }
    const label = (d) => d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit' })
    const hint = (d) => d.toLocaleDateString('pt-MZ', { weekday: 'short', day: '2-digit', month: 'short' })
    return {
      count: days.map((d) => ({ label: label(d), hint: hint(d), value: byDay.get(dayKey(d)).count })),
      gmv: days.map((d) => ({ label: label(d), hint: hint(d), value: byDay.get(dayKey(d)).gmv })),
      commission: days.map((d) => ({ label: label(d), hint: hint(d), value: byDay.get(dayKey(d)).commission })),
    }
  }, [reservations])

  const stats = [
    { icon: ShoppingBag, label: 'Reservas', value: summary.total, color: 'brand' },
    { icon: Package, label: 'Levantadas', value: summary.completed, color: 'emerald' },
    { icon: TrendingUp, label: 'Volume pago', value: formatMT(summary.gmv), color: 'blue' },
    { icon: Percent, label: 'Comissões', value: formatMT(summary.commissions), color: 'amber' },
    { icon: Store, label: 'Farmácias', value: state.pharmacies, color: 'brand', sub: state.pendingApps ? `${state.pendingApps} pedido(s) pendente(s)` : null },
    { icon: Users, label: 'Clientes activos', value: summary.users, color: 'emerald' },
  ]
  const colors = {
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-brand-900 flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 font-semibold">Plataforma</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Finanças</h1>
        </div>
      </div>

      {state.error ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">{state.error}</p>
          <Button className="mt-4" onClick={load}><RefreshCw className="w-4 h-4" /> Tentar novamente</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[s.color]}`}><s.icon className="w-4 h-4" /></div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums truncate">
                  {state.loading && reservations.length === 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : s.value}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{s.label}</div>
                {s.sub && <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">{s.sub}</div>}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-8 text-slate-700 dark:text-slate-200">
            <Card><BarChart title={`Reservas por dia (${DAYS} dias)`} data={series.count} color="#059669" /></Card>
            <Card><BarChart title="Volume pago por dia" data={series.gmv} format={formatMT} color="#2563eb" /></Card>
            <Card><BarChart title="Comissões Vonamed por dia" data={series.commission} format={formatMT} color="#d97706" /></Card>
          </div>
        </>
      )}

      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Carteira Vonamed</h2>
      <WalletView kind="platform" />
    </div>
  )
}

function Card({ children }) {
  return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">{children}</div>
}
