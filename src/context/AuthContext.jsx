import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { translateError } from '../lib/errors.js'

const AuthContext = createContext(null)

// Papel derivado do JWT (app_metadata é escrito só pelo servidor)
export function roleOf(user) {
  if (!user) return 'guest'
  if (user.app_metadata?.role === 'admin') return 'admin'
  if (user.app_metadata?.pharmacy_id != null) return 'staff'
  return 'client'
}

// Para onde enviar cada papel depois do login
export function homeFor(user) {
  return { admin: '/admin', staff: '/dashboard', client: '/', guest: '/' }[roleOf(user)]
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const register = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { ok: false, error: translateError(error.message) }
    // Sem sessão → o projeto exige confirmação de email
    return { ok: true, user: data.user, needsConfirmation: !data.session }
  }

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: translateError(error.message) }
    return { ok: true, user: data.user }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Pede um novo access token — necessário depois de o admin alterar app_metadata
  // (ex.: aprovação de farmácia atribui pharmacy_id sem o utilizador fazer logout)
  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) return { ok: false, error: translateError(error.message) }
    setUser(data.user ?? null)
    return { ok: true, user: data.user }
  }, [])

  const updateProfile = async ({ name, email }) => {
    const updates = {}
    if (email && email !== user?.email) updates.email = email
    if (name !== undefined) updates.data = { name }

    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) return { ok: false, error: translateError(error.message) }
    setUser(data.user)
    return { ok: true }
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, error: translateError(error.message) }
    return { ok: true }
  }

  const role = roleOf(user)
  const isAdmin = role === 'admin'
  const pharmacyId = user?.app_metadata?.pharmacy_id ?? null
  const isPharmacyStaff = isAdmin || pharmacyId != null

  return (
    <AuthContext.Provider value={{
      user, loading, role, isAdmin, isPharmacyStaff, pharmacyId,
      register, login, logout, refreshSession, updateProfile, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
