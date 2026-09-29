import { MapPin, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../context/I18nContext.jsx'
import { formatMT } from '../lib/format.js'

export default function MedicineCard({ medicine, pharmacy, distance, stock, onReserve }) {
  const available = stock?.available
  const { t } = useI18n()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group min-w-0 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full">
              {medicine.category}
            </span>
            {available ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('common_available')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                <XCircle className="w-3.5 h-3.5" /> {t('common_unavailable')}
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white truncate">{medicine.name}</h3>
          {available && stock?.qty > 0 && stock.qty <= 5 && (
            <span className="text-[11px] font-semibold text-amber-600">Só {stock.qty} {stock.qty === 1 ? 'unidade' : 'unidades'}</span>
          )}
          <Link to={`/farmacia/${pharmacy.id}`} className="text-sm text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 mt-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{pharmacy.name}</span>
          </Link>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} • {pharmacy.hours}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-extrabold text-slate-900 dark:text-white">{formatMT(medicine.price)}</div>
          <button
            disabled={!available}
            onClick={() => onReserve?.(medicine, pharmacy)}
            aria-label={`${t('common_reserve')} ${medicine.name} — ${pharmacy.name}`}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 hover:scale-105 active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed disabled:hover:scale-100 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> {t('common_reserve')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
