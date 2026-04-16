import { motion } from 'framer-motion'
import { PackageSearch } from 'lucide-react'

export default function EmptyState({ icon: Icon = PackageSearch, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center"
    >
      <div className="inline-flex w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/30 items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-brand-600 dark:text-brand-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}
