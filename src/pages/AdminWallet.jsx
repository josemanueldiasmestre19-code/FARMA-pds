import { useState, useEffect } from 'react'
import { Wallet, ShieldCheck } from 'lucide-react'
import WalletView from '../components/WalletView.jsx'
import { supabase } from '../lib/supabase.js'

export default function AdminWallet() {
  const [stats, setStats] = useState({ reservations: 0, completed: 0, pharmacies: 0, users: '—' })

  useEffect(() => {
    async function loadStats() {
      const [resAll, resDone, pharms] = await Promise.all([
        supabase.from('reservations').select('id', { count: 'exact', head: true }),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'concluida'),
        supabase.from('pharmacies').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        reservations: resAll.count ?? 0,
        completed: resDone.count ?? 0,
        pharmacies: pharms.count ?? 0,
        users: '—',
      })
    }
    loadStats()

    const channel = supabase
      .channel('admin-wallet-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, loadStats)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-brand-900 flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 font-semibold">Plataforma</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Carteira Vonamed</h1>
        </div>
      </div>

      <WalletView kind="platform" stats={stats} />
    </div>
  )
}
