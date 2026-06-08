import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, CheckCircle2, Pill } from 'lucide-react'
import { formatMT } from '../lib/commission.js'

export default function Receipt({ open, onClose, reservation }) {
  if (!reservation) return null

  const shortId = reservation.id.slice(0, 8).toUpperCase()
  const date = new Date(reservation.created_at || Date.now()).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const methodLabel = {
    mpesa: 'M-Pesa',
    emola: 'e-Mola',
  }[reservation.payment_method] || reservation.payment_method || '—'

  const print = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm print:bg-white print:p-0 print:static print:block"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative print:shadow-none print:rounded-none print:max-w-full"
            onClick={(e) => e.stopPropagation()}
            id="receipt-print"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 z-10 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-brand-600 to-emerald-700 px-6 pt-7 pb-10 text-white text-center">
              <div className="inline-flex w-14 h-14 rounded-full bg-white/20 backdrop-blur items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div className="text-2xl font-extrabold tracking-tight">Vona<span className="text-brand-200">med</span></div>
              <div className="text-xs uppercase tracking-widest text-brand-100 mt-1">Recibo digital</div>
            </div>

            {/* Status badge */}
            <div className="-mt-5 flex justify-center">
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                Pago
              </span>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500">Medicamento</div>
                  <div className="font-bold text-slate-900 truncate">{reservation.medicine_name}</div>
                </div>
              </div>

              <Row label="Farmácia" value={reservation.pharmacy_name} />
              <Row label="Código" value={shortId} mono />
              <Row label="Data" value={date} />
              <Row label="Pagamento" value={methodLabel} />

              <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
                <Row label="Preço do medicamento" value={formatMT(reservation.price)} muted />
                {reservation.commission > 0 && (
                  <Row label="Comissão Vonamed" value={formatMT(reservation.commission)} muted />
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-extrabold text-brand-700">
                    {formatMT(reservation.total_paid || reservation.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 text-center text-[10px] text-slate-500 tracking-wide border-t border-slate-100">
              ESTE RECIBO É VÁLIDO COMO COMPROVATIVO DE PAGAMENTO<br/>
              vonamed.mz • Maputo, Moçambique
            </div>

            {/* Print button */}
            <div className="p-3 border-t border-slate-100 print:hidden">
              <button
                onClick={print}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-semibold text-sm rounded-xl hover:bg-slate-800 transition"
              >
                <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Row({ label, value, mono, muted }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className={`text-xs ${muted ? 'text-slate-500' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm ${muted ? 'text-slate-600' : 'text-slate-900 font-semibold'} ${mono ? 'font-mono tracking-wider' : ''} truncate`}>
        {value}
      </span>
    </div>
  )
}
