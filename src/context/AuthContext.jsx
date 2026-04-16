import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { translateError } from '../lib/errors.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Ouvir mudanças de autenticação
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
    return { ok: true, user: data.user }
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

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateProfile, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
