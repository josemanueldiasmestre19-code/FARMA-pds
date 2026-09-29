import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, closable = true }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape' || !closable) return
      // Uma camada por cima (QR/recibo) trata o Escape primeiro
      if (document.querySelector('[data-overlay]')) return
      onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, closable, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={closable ? onClose : undefined}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22 }}
            role="dialog"
            aria-modal="true"
            aria-label={title || undefined}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            {closable && (
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {title && <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 pr-8">{title}</h3>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
