import { MapPin, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function MedicineCard({ medicine, pharmacy, distance, stock, onReserve }) {
  const available = stock?.available
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-400 hover:shadow-xl hover:shadow-brand-500/10 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
              {medicine.category}
            </span>
            {available ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Disponível
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                <XCircle className="w-3.5 h-3.5" /> Indisponível
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-900 truncate">{medicine.name}</h3>
          <Link to={`/farmacia/${pharmacy.id}`} className="text-sm text-slate-600 hover:text-brand-600 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" /> {pharmacy.name}
          </Link>
          <div className="text-xs text-slate-500 mt-1">
            {distance.toFixed(1)} km de distância • {pharmacy.hours}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-extrabold text-slate-900">{medicine.price} MT</div>
          <button
            disabled={!available}
            onClick={() => onReserve?.(medicine, pharmacy)}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 hover:scale-105 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Reservar
          </button>
        </div>
      </div>
    </motion.div>
  )
}
