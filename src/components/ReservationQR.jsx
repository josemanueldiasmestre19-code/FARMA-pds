import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pill, MapPin, Calendar, Hash, ShieldCheck } from 'lucide-react'
import { useI18n } from '../context/I18nContext.jsx'

export default function ReservationQR({ open, onClose, reservation }) {
  const { t, lang } = useI18n()

  if (!reservation) return null

  // Payload do QR: URL com ID para verificação pela farmácia
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const qrValue = `${origin}/reserva/${reservation.id}`

  const shortId = reservation.id.slice(0, 8).toUpperCase()
  const createdDate = new Date(reservation.created_at).toLocaleString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-brand-600 to-emerald-700 p-5 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {t('qr_header')}
                </span>
              </div>
              <h3 className="text-xl font-extrabold">{reservation.pharmacy_name}</h3>
              <p className="text-xs text-white/80 mt-0.5 truncate">{reservation.pharmacy_address}</p>
            </div>

            {/* QR Code */}
            <div className="p-6 flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100">
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin={false}
                  fgColor="#047857"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3 max-w-[260px]">
                {t('qr_instructions')}
              </p>
            </div>

            {/* Details */}
            <div className="bg-slate-50 dark:bg-slate-800 p-5 space-y-2.5 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm">
                <Pill className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 text-xs">{t('reserve_medicine')}:</span>
                <span className="font-semibold text-slate-900 dark:text-white ml-auto">{reservation.medicine_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 text-xs">{t('qr_price')}:</span>
                <span className="font-bold text-slate-900 dark:text-white ml-auto">{reservation.price} MT</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 text-xs">{t('qr_date')}:</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-auto">{createdDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <Hash className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 text-xs">{t('qr_code')}:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white ml-auto tracking-wider">{shortId}</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 text-center">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {t('qr_valid_until')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
