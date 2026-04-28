import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, Clock, Building2, MapPin, Phone, FileText, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import Button from './ui/Button.jsx'
import Modal from './ui/Modal.jsx'
import { supabase } from '../lib/supabase.js'

const STATUS_TABS = [
  { id: 'pending', label: 'Pendentes', icon: Clock, color: 'amber' },
  { id: 'approved', label: 'Aprovadas', icon: CheckCircle2, color: 'emerald' },
  { id: 'rejected', label: 'Rejeitadas', icon: XCircle, color: 'rose' },
]

export default function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState('pending')
  const [expanded, setExpanded] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchApplications()

    const channel = supabase
      .channel('admin-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pharmacy_applications' }, () => {
        fetchApplications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchApplications() {
    setLoading(true)
    const { data } = await supabase
      .from('pharmacy_applications')
      .select('*')
      .order('created_at', { ascending: false })
    setApplications(data || [])
    setLoading(false)
  }

  const filtered = applications.filter((a) => a.status === statusTab)
  const counts = {
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }

  const approve = async (appId) => {
    if (!confirm('Aprovar este pedido? Será criada uma nova farmácia e o utilizador receberá acesso.')) return
    setProcessing(true)
    const { error } = await supabase.rpc('approve_pharmacy_application', { app_id: appId })
    setProcessing(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Pedido aprovado! Farmácia criada.')
  }

  const openReject = (app) => {
    setRejectModal(app)
    setRejectReason('')
  }

  const confirmReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast.error('Indique o motivo')
      return
    }
    setProcessing(true)
    const { error } = await supabase.rpc('reject_pharmacy_application', {
      app_id: rejectModal.id,
      reason: rejectReason.trim(),
    })
    setProcessing(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Pedido rejeitado')
    setRejectModal(null)
  }

  return (
    <>
      {/* Status sub-tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-thin">
        {STATUS_TABS.map((tb) => {
          const Icon = tb.icon
          const isActive = statusTab === tb.id
          return (
            <button
              key={tb.id}
              onClick={() => setStatusTab(tb.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-8">A carregar...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum pedido nesta categoria.
          </div>
        ) : (
          filtered.map((a) => (
            <ApplicationCard
              key={a.id}
              app={a}
              isExpanded={expanded === a.id}
              onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
              onApprove={() => approve(a.id)}
              onReject={() => openReject(a)}
              processing={processing}
            />
          ))
        )}
      </div>

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Rejeitar pedido">
        {rejectModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Indique o motivo para rejeitar <strong>{rejectModal.pharmacy_name}</strong>.
              O utilizador verá esta mensagem.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Ex: Documentação incompleta, NUIT inválido..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-rose-300"
            />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRejectModal(null)}>
                Cancelar
              </Button>
              <Button variant="danger" className="flex-1" onClick={confirmReject} disabled={processing}>
                Confirmar rejeição
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function ApplicationCard({ app, isExpanded, onToggle, onApprove, onReject, processing }) {
  const statusColor = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  }[app.status]

  return (
    <motion.div
      layout
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-brand-700 dark:text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">{app.pharmacy_name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor}`}>
              {app.status}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{app.address}</div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800">
              <div className="grid sm:grid-cols-2 gap-2 text-sm pt-3">
                <Detail icon={Phone} label="Telefone" value={app.phone} />
                <Detail icon={Calendar} label="Horário" value={app.hours} />
                <Detail icon={FileText} label="NUIT" value={app.license_number} />
                <Detail icon={MapPin} label="Coordenadas" value={`${app.lat?.toFixed(4)}, ${app.lng?.toFixed(4)}`} />
                <Detail icon={User} label="Responsável" value={app.owner_name} />
                <Detail icon={Phone} label="Tel. responsável" value={app.owner_phone} />
              </div>
              {app.notes && (
                <div className="text-xs">
                  <div className="text-slate-500 dark:text-slate-400 font-semibold">Notas:</div>
                  <div className="text-slate-700 dark:text-slate-300 mt-0.5">{app.notes}</div>
                </div>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Submetido: {new Date(app.created_at).toLocaleString('pt-PT')}
              </div>
              {app.status === 'rejected' && app.rejection_reason && (
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2 text-xs text-rose-700 dark:text-rose-300">
                  <strong>Motivo:</strong> {app.rejection_reason}
                </div>
              )}

              {app.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={onReject} disabled={processing}>
                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                  </Button>
                  <Button size="sm" className="flex-1" onClick={onApprove} disabled={processing}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</div>
        <div className="text-slate-700 dark:text-slate-200 font-semibold truncate">{value}</div>
      </div>
    </div>
  )
}
