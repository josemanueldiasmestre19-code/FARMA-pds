import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Inbox, CheckCircle2, XCircle, Clock, Package,
  Calendar, Hash, Pill, Loader2, Search
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'

const TABS = [
  { id: 'pendente', label: 'Pendentes', icon: Clock, color: 'amber' },
  { id: 'aprovada', label: 'Aprovadas', icon: Package, color: 'blue' },
  { id: 'concluida', label: 'Levantadas', icon: CheckCircle2, color: 'emerald' },
  { id: 'cancelada', label: 'Canceladas', icon: XCircle, color: 'rose' },
]

const STATUS_LABEL = {
  pendente: { text: 'Pendente', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  aprovada: { text: 'Aprovada', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  concluida: { text: 'Levantada', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  cancelada: { text: 'Cancelada', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
}

export default function PharmacyReservations() {
  const { isAdmin, pharmacyId } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pendente')
  const [query, setQuery] = useState('')
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    fetchReservations()

    const channel = supabase
      .channel('staff-reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchReservations()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [pharmacyId, isAdmin])

  async function fetchReservations() {
    setLoading(true)
    let query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })

    if (!isAdmin && pharmacyId != null) {
      query = query.eq('pharmacy_id', pharmacyId)
    }

    const { data, error } = await query
    if (error) {
      toast.error('Erro ao carregar reservas')
    } else {
      setReservations(data || [])
    }
    setLoading(false)
  }

  const counts = useMemo(() => {
    return {
      pendente: reservations.filter((r) => r.status === 'pendente').length,
      aprovada: reservations.filter((r) => r.status === 'aprovada').length,
      concluida: reservations.filter((r) => r.status === 'concluida').length,
      cancelada: reservations.filter((r) => r.status === 'cancelada').length,
    }
  }, [reservations])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reservations
      .filter((r) => r.status === activeTab)
      .filter((r) => {
        if (!q) return true
        return (
          r.medicine_name?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q) ||
          r.pharmacy_name?.toLowerCase().includes(q)
        )
      })
  }, [reservations, activeTab, query])

  const updateStatus = async (id, status, successMsg) => {
    setProcessing(id)
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
    setProcessing(null)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(successMsg)
  }

  const totalRevenue = useMemo(() => {
    return reservations
      .filter((r) => r.status === 'concluida')
      .reduce((sum, r) => sum + Number(r.price || 0), 0)
  }, [reservations])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Inbox className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">Gestão</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Reservas Recebidas</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Pendentes" value={counts.pendente} icon={Clock} color="amber" highlight />
        <StatCard label="Aprovadas" value={counts.aprovada} icon={Package} color="blue" />
        <StatCard label="Levantadas" value={counts.concluida} icon={CheckCircle2} color="emerald" />
        <StatCard label="Receita" value={`${totalRevenue} MT`} icon={CheckCircle2} color="brand" />
      </div>

      {/* Tabs + search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 mb-4">
        <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-thin">
          {TABS.map((tb) => {
            const Icon = tb.icon
            const isActive = activeTab === tb.id
            return (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tb.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {counts[tb.id]}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por código, medicamento..."
            className="flex-1 px-2 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <Inbox className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {query ? 'Nenhum resultado para a pesquisa.' : 'Nenhuma reserva nesta categoria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                processing={processing === r.id}
                onApprove={() => updateStatus(r.id, 'aprovada', 'Reserva aprovada')}
                onPickup={() => updateStatus(r.id, 'concluida', 'Marcada como levantada')}
                onCancel={() => updateStatus(r.id, 'cancelada', 'Reserva cancelada')}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color = 'brand', highlight }) {
  const colors = {
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300',
  }
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${highlight && value > 0 ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-200 dark:ring-amber-900/50' : 'border-slate-200 dark:border-slate-800'} p-4`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-extrabold text-slate-900 dark:text-white">{value}</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}

function ReservationCard({ reservation, onApprove, onPickup, onCancel, processing }) {
  const r = reservation
  const status = STATUS_LABEL[r.status] || STATUS_LABEL.pendente
  const shortId = r.id.slice(0, 8).toUpperCase()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
          <Pill className="w-6 h-6 text-brand-700 dark:text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 dark:text-white">{r.medicine_name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${status.cls}`}>
              {status.text}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
              <Hash className="w-3 h-3" /> {shortId}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {new Date(r.created_at).toLocaleString('pt-PT')}
            </span>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className="text-lg font-extrabold text-slate-900 dark:text-white">{r.price} MT</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {r.status === 'pendente' && (
          <>
            <Button onClick={onApprove} disabled={processing} className="flex-1 sm:flex-none">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
            </Button>
            <Button variant="danger" onClick={onCancel} disabled={processing} className="flex-1 sm:flex-none">
              <XCircle className="w-3.5 h-3.5" /> Cancelar
            </Button>
          </>
        )}
        {r.status === 'aprovada' && (
          <>
            <Button onClick={onPickup} disabled={processing} className="flex-1 sm:flex-none">
              <Package className="w-3.5 h-3.5" /> Marcar como levantada
            </Button>
            <Button variant="danger" onClick={onCancel} disabled={processing} className="flex-1 sm:flex-none">
              <XCircle className="w-3.5 h-3.5" /> Cancelar
            </Button>
          </>
        )}
        {(r.status === 'concluida' || r.status === 'cancelada') && (
          <p className="text-xs text-slate-400 dark:text-slate-500">Esta reserva está fechada.</p>
        )}
      </div>
    </motion.div>
  )
}
