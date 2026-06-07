import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellRing, Check, CheckCheck, Trash2, X,
  ShoppingBag, CheckCircle2, XCircle, Package, Inbox,
} from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'

const TYPE_ICON = {
  reservation_created: { Icon: ShoppingBag, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/30' },
  reservation_approved: { Icon: Package, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  reservation_completed: { Icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  reservation_cancelled: { Icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
  new_reservation: { Icon: Inbox, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  reservation_cancelled_by_client: { Icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
}

function timeAgo(iso, lang) {
  const sec = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (lang === 'en') {
    if (sec < 60) return 'now'
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
    return `${Math.floor(sec / 86400)}d ago`
  }
  if (sec < 60) return 'agora'
  if (sec < 3600) return `há ${Math.floor(sec / 60)} min`
  if (sec < 86400) return `há ${Math.floor(sec / 3600)} h`
  return `há ${Math.floor(sec / 86400)} d`
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, removeNotification, clearAll } = useNotifications()
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClick = (n) => {
    if (!n.read) markRead(n.id)
    if (n.link) {
      navigate(n.link)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label={t('notif_title')}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-rose-500/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t('notif_title')}</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    title={t('notif_mark_all_read')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    title={t('notif_clear_all')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('notif_empty')}</p>
                </div>
              ) : (
                <ul>
                  <AnimatePresence initial={false}>
                    {notifications.map((n) => {
                      const cfg = TYPE_ICON[n.type] || TYPE_ICON.reservation_created
                      const Icon = cfg.Icon
                      return (
                        <motion.li
                          key={n.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`group relative border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                            !n.read ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleClick(n)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex gap-3"
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex-1 truncate">
                                  {n.title}
                                </h4>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                                {n.body}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                {timeAgo(n.createdAt, lang)}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeNotification(n.id) }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                            title={t('notif_remove')}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
