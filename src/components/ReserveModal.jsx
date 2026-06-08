import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, MapPin, CheckCircle2, LogIn, Navigation, QrCode,
  Smartphone, ShieldCheck, Loader2, Receipt as ReceiptIcon,
} from 'lucide-react'
import Modal from './ui/Modal.jsx'
import Button from './ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useReservations } from '../context/ReservationsContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { supabase } from '../lib/supabase.js'
import { calculateCommission, calculateTotal, formatMT } from '../lib/commission.js'
import ReservationQR from './ReservationQR.jsx'
import Receipt from './Receipt.jsx'

const METHODS = [
  { id: 'mpesa', label: 'M-Pesa', color: 'from-red-500 to-red-700', shortLabel: 'M' },
  { id: 'emola', label: 'e-Mola', color: 'from-orange-500 to-orange-700', shortLabel: 'e' },
]

export default function ReserveModal({ open, onClose, medicine, pharmacy }) {
  const { user } = useAuth()
  const { addReservation } = useReservations()
  const { t } = useI18n()
  const navigate = useNavigate()

  const [step, setStep] = useState('summary') // summary | paying | done
  const [method, setMethod] = useState('mpesa')
  const [confirmedReservation, setConfirmedReservation] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    if (!open) {
      // Reset state when closed
      setTimeout(() => {
        setStep('summary')
        setConfirmedReservation(null)
        setShowQR(false)
        setShowReceipt(false)
      }, 200)
    }
  }, [open])

  if (!medicine || !pharmacy) return null

  const price = Number(medicine.price) || 0
  const commission = calculateCommission(price)
  const total = calculateTotal(price)

  const handleConfirm = async () => {
    setStep('paying')

    // Cria reserva primeiro
    const res = await addReservation({
      medicineId: medicine.id,
      medicineName: medicine.name,
      price,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      pharmacyAddress: pharmacy.address,
    })

    if (!res.ok) {
      toast.error(res.error)
      setStep('summary')
      return
    }

    // Simula tempo do gateway de pagamento (1.5s)
    await new Promise((r) => setTimeout(r, 1500))

    // Chama a RPC de processamento (split: farmácia + plataforma)
    const { data: paymentResult, error } = await supabase.rpc('process_reservation_payment', {
      p_reservation_id: res.reservation.id,
      p_method: method,
      p_commission: commission,
      p_total: total,
    })

    if (error) {
      console.error(error)
      toast.error('Erro no pagamento. Tente novamente.')
      setStep('summary')
      return
    }

    const finalReservation = {
      ...res.reservation,
      commission,
      total_paid: total,
      payment_method: method,
      payment_status: 'completed',
    }
    setConfirmedReservation(finalReservation)
    setStep('done')
    toast.success('Pagamento confirmado!')
  }

  const handleClose = () => {
    if (step !== 'paying') {
      onClose()
    }
  }

  const methodCfg = METHODS.find((m) => m.id === method)

  return (
    <Modal open={open} onClose={handleClose} title={step === 'done' ? null : 'Pagamento e reserva'}>
      {!user ? (
        <SignInPrompt onClose={onClose} onNavigate={() => { onClose(); navigate('/login') }} t={t} />
      ) : step === 'paying' ? (
        <PayingView method={methodCfg} total={total} />
      ) : step === 'done' && confirmedReservation ? (
        <DoneView
          reservation={confirmedReservation}
          pharmacy={pharmacy}
          onShowQR={() => setShowQR(true)}
          onShowReceipt={() => setShowReceipt(true)}
          onClose={handleClose}
          t={t}
        />
      ) : (
        <SummaryView
          medicine={medicine}
          pharmacy={pharmacy}
          price={price}
          commission={commission}
          total={total}
          method={method}
          setMethod={setMethod}
          onConfirm={handleConfirm}
          onClose={handleClose}
          t={t}
        />
      )}

      <ReservationQR
        open={showQR}
        onClose={() => setShowQR(false)}
        reservation={confirmedReservation}
      />
      <Receipt
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        reservation={confirmedReservation}
      />
    </Modal>
  )
}

function SignInPrompt({ onClose, onNavigate, t }) {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
        <LogIn className="w-7 h-7 text-amber-600" />
      </div>
      <h4 className="font-bold text-slate-900 dark:text-white">{t('reserve_signin_needed')}</h4>
      <p className="text-sm text-slate-500 mt-1">{t('reserve_signin_desc')}</p>
      <div className="flex gap-2 mt-5 justify-center">
        <Button variant="secondary" onClick={onClose}>{t('common_cancel')}</Button>
        <Button onClick={onNavigate}>{t('auth_signin_link')}</Button>
      </div>
    </div>
  )
}

function SummaryView({ medicine, pharmacy, price, commission, total, method, setMethod, onConfirm, onClose, t }) {
  return (
    <>
      {/* Item resumo */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center">
            <Pill className="w-5 h-5 text-brand-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('reserve_medicine')}</div>
            <div className="font-bold text-slate-900 dark:text-white truncate">{medicine.name}</div>
          </div>
          <div className="font-extrabold text-slate-900 dark:text-white">{formatMT(price)}</div>
        </div>
        <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('reserve_pharmacy')}</div>
            <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{pharmacy.name}</div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-4 px-1 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span>Preço do medicamento</span>
          <span>{formatMT(price)}</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            Comissão Vonamed
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
          </span>
          <span>{formatMT(commission)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="font-bold text-slate-900 dark:text-white">Total a pagar</span>
          <span className="text-xl font-extrabold text-brand-700 dark:text-brand-400">{formatMT(total)}</span>
        </div>
      </div>

      {/* Método */}
      <div className="mt-5">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Método de pagamento</div>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((m) => {
            const isActive = method === m.id
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition ${
                  isActive
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white font-extrabold text-lg shadow-md`}>
                  {m.shortLabel}
                </div>
                <span className={`text-sm font-semibold ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {m.label}
                </span>
                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
        Ao confirmar, será simulado um pagamento via {METHODS.find((m) => m.id === method)?.label}.
        A reserva é válida por 24h após aprovação da farmácia.
      </p>

      <div className="flex gap-2 mt-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          {t('common_cancel')}
        </Button>
        <Button className="flex-1" onClick={onConfirm}>
          <Smartphone className="w-4 h-4" /> Pagar {formatMT(total)}
        </Button>
      </div>
    </>
  )
}

function PayingView({ method, total }) {
  return (
    <div className="py-8 text-center">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className={`inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br ${method?.color} items-center justify-center text-white text-3xl font-extrabold shadow-xl mb-5`}
      >
        {method?.shortLabel}
      </motion.div>
      <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
        A processar pagamento...
      </h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        {method?.label} • {formatMT(total)}
      </p>
      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Aguarde, não feche esta janela</span>
      </div>
    </div>
  )
}

function DoneView({ reservation, pharmacy, onShowQR, onShowReceipt, onClose, t }) {
  return (
    <div className="text-center py-2">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </motion.div>
      <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
        Pagamento concluído!
      </h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
        Pagou {formatMT(reservation.total_paid)} via {reservation.payment_method === 'mpesa' ? 'M-Pesa' : 'e-Mola'}.
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Apresente o QR na farmácia para levantar.
      </p>

      <div className="flex flex-col gap-2 mt-5">
        <button
          onClick={onShowQR}
          className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-brand-600 text-white font-semibold text-sm rounded-xl hover:bg-brand-700 shadow-md shadow-brand-500/30 transition"
        >
          <QrCode className="w-4 h-4" /> Ver QR da reserva
        </button>
        <button
          onClick={onShowReceipt}
          className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <ReceiptIcon className="w-4 h-4" /> Ver recibo
        </button>
        <Link
          to={`/mapa?route=${pharmacy.id}`}
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-blue-500 text-white font-semibold text-sm rounded-xl hover:bg-blue-600 transition"
        >
          <Navigation className="w-4 h-4" /> Ver rota
        </Link>
      </div>
    </div>
  )
}
