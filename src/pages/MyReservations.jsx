import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Pill, MapPin, Calendar, Trash2, ShoppingBag, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useReservations } from '../context/ReservationsContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Button from '../components/ui/Button.jsx'

export default function MyReservations() {
  const { reservations, cancelReservation, completeReservation, deleteReservation } = useReservations()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('active')

  const TABS = [
    { id: 'active', label: t('reservations_tab_active'), status: ['pendente'], icon: Clock, color: 'amber' },
    { id: 'completed', label: t('reservations_tab_completed'), status: ['concluida'], icon: CheckCircle2, color: 'emerald' },
    { id: 'cancelled', label: t('reservations_tab_cancelled'), status: ['cancelada'], icon: XCircle, color: 'rose' },
  ]

  const STATUS_CONFIG = {
    pendente: { label: t('status_pending'), color: 'bg-amber-100 text-amber-700' },
    concluida: { label: t('status_completed'), color: 'bg-emerald-100 text-emerald-700' },
    cancelada: { label: t('status_cancelled'), color: 'bg-rose-100 text-rose-700' },
  }

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab)
    return reservations.filter((r) => tab?.status.includes(r.status))
  }, [reservations, activeTab])

  const counts = useMemo(() => ({
    active: reservations.filter((r) => r.status === 'pendente').length,
    completed: reservations.filter((r) => r.status === 'concluida').length,
    cancelled: reservations.filter((r) => r.status === 'cancelada').length,
  }), [reservations])

  const handleCancel = async (id) => {
    await cancelReservation(id)
    toast.success(t('reservations_cancelled_toast'))
  }

  const handleComplete = async (id) => {
    await completeReservation(id)
    toast.success(t('reservations_completed_toast'))
  }

  const handleDelete = async (id) => {
    await deleteReservation(id)
    toast.success(t('reservations_removed_toast'))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{t('reservations_title')}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{t('reservations_subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 flex gap-1 mb-6 overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {counts[tab.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={
            activeTab === 'active' ? t('reservations_empty_active_title') :
            activeTab === 'completed' ? t('reservations_empty_completed_title') :
            t('reservations_empty_cancelled_title')
          }
          description={
            activeTab === 'active'
              ? t('reservations_empty_active_desc')
              : t('reservations_empty_history')
          }
          action={
            activeTab === 'active' ? (
              <Link to="/pesquisa">
                <Button>{t('reservations_search_btn')}</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((r) => {
              const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pendente
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                    <Pill className="w-6 h-6 text-brand-700" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-white">{r.medicine_name}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{r.pharmacy_name}</span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {new Date(r.created_at).toLocaleString('pt-PT')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900 dark:text-white">{r.price} MT</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {r.status === 'pendente' && (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => handleComplete(r.id)} title="Marcar como concluída">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleCancel(r.id)} title="Cancelar">
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {(r.status === 'cancelada' || r.status === 'concluida') && (
                        <Button variant="danger" size="sm" onClick={() => handleDelete(r.id)} title="Remover do histórico">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
