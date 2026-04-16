import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Mail, Lock, Pill, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/'
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(form)
    setLoading(false)
    if (res.ok) {
      toast.success('Sessão iniciada!')
      navigate(redirectTo, { replace: true })
    } else {
      toast.error(res.error)
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
          <h1 className="text-3xl font-extrabold text-slate-900">Bem-vindo de volta</h1>
          <p className="text-slate-500 mt-1">Inicie sessão na sua conta</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Email</label>
            <div className="mt-1 flex items-center bg-slate-50 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="o.seu@email.com"
                className="flex-1 py-3 px-3 bg-transparent outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Palavra-passe</label>
            <div className="mt-1 flex items-center bg-slate-50 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="flex-1 py-3 px-3 bg-transparent outline-none text-sm"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="p-1 text-slate-400 hover:text-slate-600 transition">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'A entrar...' : (<>Entrar <ArrowRight className="w-4 h-4" /></>)}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Ainda não tem conta?{' '}
          <Link to="/registo" className="text-brand-700 font-semibold hover:underline">Registar</Link>
        </p>
      </motion.div>
    </div>
  )
}
