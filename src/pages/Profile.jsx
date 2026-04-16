import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Save, Eye, EyeOff, Calendar, ShoppingBag } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useReservations } from '../context/ReservationsContext.jsx'

export default function Profile() {
  const { user, updateProfile, updatePassword } = useAuth()
  const { reservations } = useReservations()
  const [loading, setLoading] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const [form, setForm] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
  })
  const [passForm, setPassForm] = useState({ newPassword: '', confirm: '' })

  const submitProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await updateProfile(form)
    setLoading(false)
    if (res.ok) toast.success('Perfil actualizado!')
    else toast.error(res.error)
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirm) {
      toast.error('As palavras-passe não coincidem')
      return
    }
    if (passForm.newPassword.length < 6) {
      toast.error('A palavra-passe deve ter pelo menos 6 caracteres')
      return
    }
    setLoadingPass(true)
    const res = await updatePassword(passForm.newPassword)
    setLoadingPass(false)
    if (res.ok) {
      toast.success('Palavra-passe actualizada!')
      setPassForm({ newPassword: '', confirm: '' })
    } else toast.error(res.error)
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || ''
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : '-'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header card */}
        <div className="bg-gradient-to-br from-brand-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-extrabold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold">{userName}</h1>
              <p className="text-brand-50 text-sm mt-1">{user?.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5" /> Desde {memberSince}
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
                  <ShoppingBag className="w-3.5 h-3.5" /> {reservations.length} {reservations.length === 1 ? 'reserva' : 'reservas'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Informação pessoal */}
          <form onSubmit={submitProfile} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Informação pessoal</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Actualize os seus dados</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome completo</label>
                <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="flex-1 py-3 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="flex-1 py-3 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-1">
                  Alterar o email pode exigir nova confirmação
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'A guardar...' : (<><Save className="w-4 h-4" /> Guardar alterações</>)}
              </Button>
            </div>
          </form>

          {/* Alterar palavra-passe */}
          <form onSubmit={submitPassword} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Palavra-passe</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Mantenha a sua conta segura</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nova palavra-passe</label>
                <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="flex-1 py-3 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="p-1 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirmar palavra-passe</label>
                <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passForm.confirm}
                    onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                    placeholder="Repita a palavra-passe"
                    className="flex-1 py-3 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loadingPass}>
                {loadingPass ? 'A actualizar...' : (<><Save className="w-4 h-4" /> Alterar palavra-passe</>)}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
