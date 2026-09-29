import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Pill, ArrowRight, Eye, EyeOff, MailCheck } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import usePageTitle from '../hooks/usePageTitle.js'
import { useI18n } from '../context/I18nContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const { t } = useI18n()
  usePageTitle(t('auth_create_account'))
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(null)
  const [confirmEmail, setConfirmEmail] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    const res = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    if (res.needsConfirmation) {
      setConfirmEmail(form.email.trim())
      return
    }
    toast.success(`${t('auth_welcome_user')}, ${form.name}!`)
    navigate('/')
  }

  if (confirmEmail) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4">
            <MailCheck className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Confirme o seu email</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Enviámos um link de confirmação para <strong className="text-slate-700 dark:text-slate-200">{confirmEmail}</strong>. Abra-o para activar a conta.
          </p>
          <Link to="/login" className="inline-block mt-6"><Button>{t('auth_signin_link')}</Button></Link>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('auth_create_account')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('auth_join')}</p>
        </div>

        <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div>
            <label htmlFor="reg-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('auth_full_name')}</label>
            <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="reg-name"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="João Mucavele"
                className="flex-1 py-3 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="reg-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('auth_email')}</label>
            <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="reg-email"
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
            <label htmlFor="reg-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('auth_password')}</label>
            <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t('auth_min_6')}
                className="flex-1 py-3 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} className="p-1 text-slate-400 hover:text-slate-600 transition">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-1">{t('auth_min_6')}</p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-3 py-2">{error}</p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? t('auth_create_loading') : (<>{t('auth_create_account')} <ArrowRight className="w-4 h-4" /></>)}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          {t('auth_has_account')}{' '}
          <Link to="/login" className="text-brand-700 font-semibold hover:underline">{t('auth_signin_link')}</Link>
        </p>
      </motion.div>
    </div>
  )
}
