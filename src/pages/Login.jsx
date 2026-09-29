import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Mail, Lock, Pill, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { useAuth, homeFor } from '../context/AuthContext.jsx'
import usePageTitle from '../hooks/usePageTitle.js'
import { useI18n } from '../context/I18nContext.jsx'

export default function Login() {
  const { login, user } = useAuth()
  const { t } = useI18n()
  usePageTitle(t('auth_signin'))
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(null)

  // Já autenticado → não mostrar o formulário
  if (user) return <Navigate to={location.state?.from || homeFor(user)} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    const res = await login({ email: form.email.trim(), password: form.password })
    setLoading(false)
    if (res.ok) {
      toast.success(t('auth_session_started'))
      // Volta para onde ia; senão, para a página inicial do papel (admin/farmácia/cliente)
      navigate(location.state?.from || homeFor(res.user), { replace: true })
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center shadow-lg shadow-brand-500/30 mb-4">
            <Pill className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('auth_welcome_back')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('auth_signin_your_account')}</p>
        </div>

        <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('auth_email')}</label>
            <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="o.seu@email.com"
                className="flex-1 py-3 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="login-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('auth_password')}</label>
            <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="flex-1 py-3 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} className="p-1 text-slate-400 hover:text-slate-600 transition">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-3 py-2">{error}</p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? t('auth_signin_loading') : (<>{t('auth_signin')} <ArrowRight className="w-4 h-4" /></>)}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          {t('auth_no_account')}{' '}
          <Link to="/registo" className="text-brand-700 font-semibold hover:underline">{t('auth_register_link')}</Link>
        </p>
      </motion.div>
    </div>
  )
}
