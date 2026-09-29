import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useLocation, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Pill, MapPin, Hash, User, Calendar,
  Loader2, PackageCheck, RefreshCw, ScanLine, LogIn,
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import ReservationQR from '../components/ReservationQR.jsx'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { translateError } from '../lib/errors.js'
import { formatMT, formatDateTime, shortId } from '../lib/format.js'
import usePageTitle from '../hooks/usePageTitle.js'

// Resposta inequívoca para o balcão: cada resultado tem cor, ícone e instrução.
const RESULTS = {
  valid: {
    Icon: CheckCircle2, tone: 'emerald',
    title: 'Reserva válida',
    hint: 'Entregue o medicamento e confirme o levantamento.',
  },
  already_used: {
    Icon: PackageCheck, tone: 'slate',
    title: 'Já levantada',
    hint: 'Este QR já foi utilizado. Não entregue novamente.',
  },
  expired: {
    Icon: Clock, tone: 'amber',
    title: 'Reserva expirada',
    hint: 'Passaram mais de 24h desde a reserva. O cliente deve fazer nova reserva.',
  },
  cancelled: {
    Icon: XCircle, tone: 'rose',
    title: 'Reserva cancelada',
    hint: 'Esta reserva foi cancelada e o valor reembolsado.',
  },
  not_paid: {
    Icon: AlertTriangle, tone: 'amber',
    title: 'Pagamento não confirmado',
    hint: 'A reserva existe mas o pagamento não foi concluído.',
  },
  not_found: {
    Icon: XCircle, tone: 'rose',
    title: 'Reserva não encontrada',
    hint: 'Este código não corresponde a nenhuma reserva.',
  },
  wrong_pharmacy: {
    Icon: AlertTriangle, tone: 'amber',
    title: 'Reserva de outra farmácia',
    hint: 'Este QR pertence a uma reserva noutra farmácia.',
  },
}

const TONES = {
  emerald: { bg: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-900', text: 'text-emerald-700 dark:text-emerald-300' },
  amber: { bg: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-900', text: 'text-amber-700 dark:text-amber-300' },
  rose: { bg: 'bg-rose-500', ring: 'ring-rose-200 dark:ring-rose-900', text: 'text-rose-700 dark:text-rose-300' },
  slate: { bg: 'bg-slate-500', ring: 'ring-slate-200 dark:ring-slate-700', text: 'text-slate-700 dark:text-slate-300' },
}

export default function ReservationCheck() {
  const { id } = useParams()
  const location = useLocation()
  const { user, loading: authLoading, isPharmacyStaff } = useAuth()
  usePageTitle('Validar reserva')

  if (authLoading) return null
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4">
          <ScanLine className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Validar reserva</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Inicie sessão com a conta da farmácia para validar este QR.</p>
        <Link to="/login" state={{ from: location.pathname }} className="inline-block mt-6">
          <Button><LogIn className="w-4 h-4" /> Iniciar sessão</Button>
        </Link>
      </div>
    )
  }

  return isPharmacyStaff ? <StaffCheck id={id} /> : <ClientCheck id={id} userId={user.id} />
}

function StaffCheck({ id }) {
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const validate = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { data, error } = await supabase.rpc('validate_reservation_qr', { p_reservation_id: id })
    setState({ loading: false, data, error: error ? translateError(error.message) : null })
  }, [id])

  useEffect(() => { validate() }, [validate])

  const confirm = async () => {
    setConfirming(true)
    const { data, error } = await supabase.rpc('confirm_pickup', { p_reservation_id: id })
    setConfirming(false)
    if (error) {
      toast.error(translateError(error.message))
      return
    }
    setState({ loading: false, data, error: null })
    if (data.result === 'already_used') {
      setConfirmed(true)
      toast.success('Levantamento confirmado')
    }
  }

  if (state.loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
        <p className="text-sm text-slate-500 mt-3">A validar reserva...</p>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Não foi possível validar</h1>
        <p className="text-sm text-slate-500 mt-2">{state.error}</p>
        <Button className="mt-6" onClick={validate}><RefreshCw className="w-4 h-4" /> Tentar novamente</Button>
      </div>
    )
  }

  const { result, reservation: r, client_name, expires_at, pharmacy_name } = state.data
  const cfg = RESULTS[result] ?? RESULTS.not_found
  const tone = TONES[cfg.tone]
  const Icon = cfg.Icon
  // Depois de confirmar, o servidor devolve already_used; mostramos como sucesso
  const justConfirmed = confirmed && result === 'already_used'

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden ring-4 ${tone.ring}`}
        role="status"
        aria-live="polite"
      >
        <div className={`${tone.bg} text-white p-7 text-center`}>
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3"
          >
            <Icon className="w-10 h-10" />
          </motion.div>
          <h1 className="text-2xl font-extrabold">{justConfirmed ? 'Levantamento confirmado' : cfg.title}</h1>
          <p className="text-sm text-white/85 mt-1">{justConfirmed ? 'Obrigado. A reserva ficou fechada.' : cfg.hint}</p>
          {result === 'wrong_pharmacy' && pharmacy_name && (
            <p className="text-xs text-white/80 mt-2">Farmácia: {pharmacy_name}</p>
          )}
        </div>

        {r && (
          <div className="p-5 space-y-3 text-sm">
            <Row icon={Pill} label="Medicamento" value={r.medicine_name} strong />
            <Row icon={User} label="Cliente" value={client_name || '—'} />
            <Row icon={Hash} label="Código" value={shortId(r.id)} mono />
            <Row icon={Calendar} label="Reservado em" value={formatDateTime(r.created_at)} />
            {result === 'valid' && <Row icon={Clock} label="Válido até" value={formatDateTime(expires_at)} />}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Pago ({r.payment_method === 'mpesa' ? 'M-Pesa' : 'e-Mola'})</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">{formatMT(r.total_paid)}</span>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          {result === 'valid' && (
            <Button size="lg" className="w-full" onClick={confirm} disabled={confirming}>
              {confirming ? <><Loader2 className="w-4 h-4 animate-spin" /> A confirmar...</> : <><PackageCheck className="w-5 h-5" /> Confirmar levantamento</>}
            </Button>
          )}
          <Link to="/dashboard/reservas" className="w-full">
            <Button variant="secondary" className="w-full">Ver todas as reservas</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

// Cliente que abre o link do seu próprio QR: mostra o estado e o QR novamente
function ClientCheck({ id, userId }) {
  const [state, setState] = useState({ loading: true, reservation: null })
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    supabase.from('reservations').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
      .then(({ data }) => setState({ loading: false, reservation: data }))
  }, [id, userId])

  if (state.loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
  if (!state.reservation) return <Navigate to="/reservas" replace />

  const r = state.reservation
  const STATUS = {
    pendente: { label: 'Pendente — aguarda confirmação da farmácia', cls: 'bg-amber-100 text-amber-800' },
    aprovada: { label: 'Aprovada — pronta para levantamento', cls: 'bg-blue-100 text-blue-800' },
    concluida: { label: 'Levantada', cls: 'bg-emerald-100 text-emerald-800' },
    cancelada: { label: 'Cancelada', cls: 'bg-rose-100 text-rose-800' },
  }[r.status] ?? { label: r.status, cls: 'bg-slate-100 text-slate-700' }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6">
        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${STATUS.cls}`}>{STATUS.label}</span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">{r.medicine_name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {r.pharmacy_name}</p>
        <div className="mt-4 space-y-2 text-sm">
          <Row icon={Hash} label="Código" value={shortId(r.id)} mono />
          <Row icon={Calendar} label="Reservado em" value={formatDateTime(r.created_at)} />
        </div>
        {(r.status === 'pendente' || r.status === 'aprovada') && (
          <Button className="w-full mt-5" onClick={() => setShowQR(true)}>Mostrar QR</Button>
        )}
        <Link to="/reservas" className="block text-center text-sm font-semibold text-brand-700 dark:text-brand-300 mt-4">Todas as minhas reservas</Link>
      </div>
      <ReservationQR open={showQR} onClose={() => setShowQR(false)} reservation={r} />
    </div>
  )
}

function Row({ icon: Icon, label, value, strong, mono }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-slate-500 dark:text-slate-400 text-xs">{label}</span>
      <span className={`ml-auto text-right ${strong ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-200'} ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value}
      </span>
    </div>
  )
}
