import { Pill } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-xl shadow-brand-500/30 mb-4"
      >
        <Pill className="w-8 h-8 text-white" />
      </motion.div>
      <div className="font-extrabold text-slate-900 text-xl">
        Vona<span className="text-brand-600">med</span>
      </div>
      <p className="text-sm text-slate-500 mt-2">A carregar...</p>
    </div>
  )
}
