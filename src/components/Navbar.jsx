import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Pill, Menu, X, User, LogOut, ShoppingBag, ChevronDown, UserCircle, Moon, Sun, Shield } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang, t } = useI18n()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  const links = [
    { to: '/', label: t('nav_home') },
    { to: '/pesquisa', label: t('nav_search') },
    { to: '/mapa', label: t('nav_map') },
    { to: '/dashboard', label: t('nav_dashboard') },
  ]

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || ''

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
    setOpen(false)
    toast.success('Sessão terminada')
    navigate('/')
  }

  const ThemeToggle = ({ className = '' }) => (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )

  const LangToggle = ({ className = '' }) => (
    <button
      onClick={toggleLang}
      className={`px-2.5 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition uppercase ${className}`}
      aria-label="Toggle language"
    >
      {lang === 'pt' ? 'EN' : 'PT'}
    </button>
  )

  return (
    <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white leading-tight">Vona<span className="text-brand-600 dark:text-brand-400">med</span></div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:block">Maputo • Moçambique</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}

          <LangToggle className="ml-1" />
          <ThemeToggle />

          {user ? (
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">{userName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('nav_signed_as')}</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.email}</div>
                    </div>
                    <Link to="/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                      <UserCircle className="w-4 h-4" /> {t('nav_profile')}
                    </Link>
                    <Link to="/reservas" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                      <ShoppingBag className="w-4 h-4" /> {t('nav_reservations')}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition">
                        <Shield className="w-4 h-4" /> Admin
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                      <LogOut className="w-4 h-4" /> {t('nav_logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5">
                <User className="w-4 h-4" /> {t('nav_login')}
              </Link>
              <Link
                to="/registo"
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/20 transition"
              >
                {t('nav_register')}
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile buttons */}
        <div className="flex items-center gap-1 md:hidden">
          <LangToggle />
          <ThemeToggle />
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{userName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                      </div>
                    </div>
                    <Link to="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition">
                      <UserCircle className="w-4 h-4" /> {t('nav_profile')}
                    </Link>
                    <Link to="/reservas" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition">
                      <ShoppingBag className="w-4 h-4" /> {t('nav_reservations')}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition">
                        <Shield className="w-4 h-4" /> Admin
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition">
                      <LogOut className="w-4 h-4" /> {t('nav_logout')}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-1">
                    <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition">
                      {t('nav_login')}
                    </Link>
                    <Link to="/registo" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-center bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition">
                      {t('nav_register')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
