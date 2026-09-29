import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  Pill, MapPin, CheckCircle2, LogIn, Navigation, QrCode,
  Smartphone, ShieldCheck, Loader2, Receipt as ReceiptIcon, XCircle, ArrowLeft, FlaskConical,
} from 'lucide-react'
import Modal from './ui/Modal.jsx'
import Button from './ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useReservations } from '../context/ReservationsContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { calculateCommission, calculateTotal } from '../lib/commission.js'
import { formatMT, parseMzPhone, formatPhone, PHONE_NETWORK } from '../lib/format.js'
import ReservationQR from './ReservationQR.jsx'
import Receipt from './Receipt.jsx'

export const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', color: 'from-red-500 to-red-700', shortLabel: 'M', prefixes: '84/85' },
  { id: 'emola', label: 'e-Mola', color: 'from-orange-500 to-orange-700', shortLabel: 'e', prefixes: '86/87' },
]

const PROCESSING_MS = 2500
// Simulação: números terminados em 0000 falham (ver DEMO.md)
const isSimulatedFailure = (digits) => digits.endsWith('0000')

export default function ReserveModal({ open, onClose, medicine, pharmacy }) {
  const { user } = useAuth()
  const { reserveAndPay } = useReservations()
  const { t } = useI18n()
  const navigate = useNavigate()

  const [step, setStep] = useState('summary') // summary | phone | paying | done | failed
  const [method, setMethod] = useState('mpesa')
  const [phone, setPhone] = useState('')
  const [failReason, setFailReason] = useState('')
  const [confirmedReservation, setConfirmedReservation] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        setStep('summary')
        setPhone('')
        setFailReason('')
        setConfirmedReservation(null)
        setShowQR(false)
        setShowReceipt(false)
      }, 200)
      return () => clearTimeout(id)
    }
  }, [open])

  if (!medicine || !pharmacy) return null

  const price = Number(medicine.price) || 0
  const commission = calculateCommission(price)
  const total = calculateTotal(price)
  const methodCfg = PAYMENT_METHODS.find((m) => m.id === method)

  const handlePay = async () => {
    const digits = parseMzPhone(phone)
    if (!digits) return

    setStep('paying')
    const started = Date.now()

    let result
    if (isSimulatedFailure(digits)) {
      result = { ok: false, error: `Saldo insuficiente na conta ${methodCfg.label} ${formatPhone(digits)}.` }
    } else {
      result = await reserveAndPay({ medicineId: medicine.id, pharmacyId: pharmacy.id, method, phone: digits })
    }

    // Garante um tempo mínimo "a processar" para o fluxo ser credível
    const elapsed = Date.now() - started
    if (elapsed < PROCESSING_MS) await new Promise((r) => setTimeout(r, PROCESSING_MS - elapsed))

    if (!result.ok) {
      setFailReason(result.error)
      setStep('failed')
      return
    }
    setConfirmedReservation(result.reservation)
    setStep('done')
    toast.success(t('pay_done_toast'))
  }

  const handleClose = () => {
    if (step !== 'paying') onClose()
  }

  const title = { summary: 'Pagamento e reserva', phone: 'Número de telemóvel' }[step] ?? null

  return (
    <Modal open={open} onClose={handleClose} title={title} closable={step !== 'paying'}>
      {!user ? (
        <SignInPrompt onClose={onClose} onNavigate={() => { onClose(); navigate('/login') }} t={t} />
      ) : step === 'paying' ? (
        <PayingView method={methodCfg} total={total} phone={phone} />
      ) : step === 'done' && confirmedReservation ? (
        <DoneView
          reservation={confirmedReservation}
          pharmacy={pharmacy}
          onShowQR={() => setShowQR(true)}
          onShowReceipt={() => setShowReceipt(true)}
          onClose={handleClose}
        />
      ) : step === 'failed' ? (
        <FailedView reason={failReason} method={methodCfg} onRetry={() => setStep('phone')} onClose={handleClose} />
      ) : step === 'phone' ? (
        <PhoneView
          method={methodCfg}
          phone={phone}
          setPhone={setPhone}
          total={total}
          onBack={() => setStep('summary')}
          onPay={handlePay}
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
          onContinue={() => setStep('phone')}
          onClose={handleClose}
          t={t}
        />
      )}

      <ReservationQR open={showQR} onClose={() => setShowQR(false)} reservation={confirmedReservation} />
      <Receipt open={showReceipt} onClose={() => setShowReceipt(false)} reservation={confirmedReservation} />
    </Modal>
  )
}

export function SimulationBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full ${className}`}
      title="Os pagamentos não são reais. Nenhum valor é cobrado."
    >
      <FlaskConical className="w-3 h-3" /> Ambiente de simulação
    </span>
  )
}

function SignInPrompt({ onClose, onNavigate, t }) {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-3">
        <LogIn className="w-7 h-7 text-amber-600" />
      </div>
      <h4 className="font-bold text-slate-900 dark:text-white">{t('reserve_signin_needed')}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('reserve_signin_desc')}</p>
      <div className="flex gap-2 mt-5 justify-center">
        <Button variant="secondary" onClick={onClose}>{t('common_cancel')}</Button>
        <Button onClick={onNavigate}>{t('auth_signin_link')}</Button>
      </div>
    </div>
  )
}

function SummaryView({ medicine, pharmacy, price, commission, total, method, setMethod, onContinue, onClose, t }) {
  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5 text-brand-700 dark:text-brand-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('reserve_medicine')}</div>
            <div className="font-bold text-slate-900 dark:text-white truncate">{medicine.name}</div>
          </div>
          <div className="font-extrabold text-slate-900 dark:text-white">{formatMT(price)}</div>
        </div>
        <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('reserve_pharmacy')}</div>
            <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{pharmacy.name}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 px-1 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span>{t('pay_breakdown_price')}</span>
          <span>{formatMT(price)}</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            {t('pay_breakdown_commission')} <ShieldCheck className="w-3 h-3 text-emerald-500" />
          </span>
          <span>{formatMT(commission)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="font-bold text-slate-900 dark:text-white">{t('pay_total')}</span>
          <span className="text-xl font-extrabold text-brand-700 dark:text-brand-400">{formatMT(total)}</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('pay_method')}</div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('pay_method')}>
          {PAYMENT_METHODS.map((m) => {
            const isActive = method === m.id
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setMethod(m.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition focus-visible:ring-2 focus-visible:ring-brand-400 ${
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
                {isActive && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-start justify-between gap-2 mt-4">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Ao pagar, a unidade fica reservada por 24h. Levante no balcão com o QR.
        </p>
        <SimulationBadge className="shrink-0" />
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>{t('common_cancel')}</Button>
        <Button className="flex-1" onClick={onContinue}>
          <Smartphone className="w-4 h-4" /> Continuar
        </Button>
      </div>
    </>
  )
}

function PhoneView({ method, phone, setPhone, total, onBack, onPay }) {
  const digits = parseMzPhone(phone)
  const network = digits ? PHONE_NETWORK[digits.slice(0, 2)] : null
  const touched = phone.replace(/\D/g, '').length >= 9
  const invalid = touched && !digits
  const mismatch = digits && network && network !== method.id

  const submit = (e) => {
    e.preventDefault()
    if (digits) onPay()
  }

  return (
    <form onSubmit={submit}>
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white font-extrabold text-xl shadow-md shrink-0`}>
          {method.shortLabel}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-white">{method.label}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Vai receber um pedido de confirmação no telemóvel</div>
        </div>
        <div className="font-extrabold text-brand-700 dark:text-brand-400 shrink-0">{formatMT(total)}</div>
      </div>

      <label htmlFor="pay-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mt-5 mb-1">
        Número {method.label} ({method.prefixes})
      </label>
      <div className={`flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 border-2 transition focus-within:ring-2 focus-within:ring-brand-300 ${
        invalid ? 'border-rose-300 dark:border-rose-700' : 'border-transparent'
      }`}>
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 shrink-0">+258</span>
        <input
          id="pay-phone"
          type="tel"
          inputMode="numeric"
          autoFocus
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 11))}
          placeholder="84 123 4567"
          aria-invalid={invalid}
          aria-describedby="pay-phone-hint"
          className="flex-1 py-3 px-3 bg-transparent outline-none text-lg font-bold tracking-wider text-slate-900 dark:text-slate-100 min-w-0"
        />
      </div>
      <p id="pay-phone-hint" className={`text-xs mt-1.5 pl-1 ${invalid ? 'text-rose-600 dark:text-rose-400' : mismatch ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
        {invalid
          ? 'Número inválido. Use 9 dígitos começados por 8.'
          : mismatch
          ? `Este prefixo é ${PAYMENT_METHODS.find((m) => m.id === network)?.label ?? 'de outra operadora'}. Pode continuar na mesma.`
          : 'Só para a simulação: nenhum valor será cobrado.'}
      </p>

      <div className="flex gap-2 mt-5">
        <Button type="button" variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button type="submit" className="flex-1" disabled={!digits}>
          <Smartphone className="w-4 h-4" /> Pagar {formatMT(total)}
        </Button>
      </div>
    </form>
  )
}

function PayingView({ method, total, phone }) {
  return (
    <div className="py-8 text-center" role="status" aria-live="polite">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className={`inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br ${method?.color} items-center justify-center text-white text-3xl font-extrabold shadow-xl mb-5`}
      >
        {method?.shortLabel}
      </motion.div>
      <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">A processar pagamento...</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        {method?.label} • {formatPhone(phone)} • {formatMT(total)}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Confirme o pedido no seu telemóvel</p>
      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Aguarde, não feche esta janela</span>
      </div>
    </div>
  )
}

function FailedView({ reason, method, onRetry, onClose }) {
  return (
    <div className="text-center py-2">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-20 h-20 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4"
      >
        <XCircle className="w-10 h-10 text-rose-600" />
      </motion.div>
      <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">Pagamento recusado</h4>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{reason}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Nenhuma reserva foi criada e nada foi cobrado. Verifique o saldo {method?.label} ou tente outro número.
      </p>
      <div className="flex gap-2 mt-5">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Fechar</Button>
        <Button className="flex-1" onClick={onRetry}>Tentar novamente</Button>
      </div>
    </div>
  )
}

function DoneView({ reservation, pharmacy, onShowQR, onShowReceipt, onClose }) {
  const method = PAYMENT_METHODS.find((m) => m.id === reservation.payment_method)
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
      <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">Pagamento concluído!</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
        Pagou {formatMT(reservation.total_paid)} via {method?.label ?? reservation.payment_method}.
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        A farmácia vai confirmar a reserva. Apresente o QR no balcão para levantar.
      </p>

      <div className="flex flex-col gap-2 mt-5">
        <Button onClick={onShowQR} className="w-full">
          <QrCode className="w-4 h-4" /> Ver QR da reserva
        </Button>
        <Button variant="secondary" onClick={onShowReceipt} className="w-full">
          <ReceiptIcon className="w-4 h-4" /> Ver recibo
        </Button>
        <Link
          to={`/mapa?route=${pharmacy.id}`}
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full px-5 py-2.5 text-sm font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition"
        >
          <Navigation className="w-4 h-4" /> Ver rota até à farmácia
        </Link>
      </div>
    </div>
  )
}
