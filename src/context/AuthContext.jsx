import { createContext, useContext } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.js'

const AuthContext = createContext(null)

// Provider de autenticação simulada (sem backend)
export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('fa_user', null)
  const [users, setUsers] = useLocalStorage('fa_users', [])

  const register = ({ name, email, password }) => {
    if (users.find((u) => u.email === email)) {
      return { ok: false, error: 'Este email já está registado.' }
    }
    const newUser = { id: Date.now(), name, email, password }
    setUsers([...users, newUser])
    setUser({ id: newUser.id, name, email })
    return { ok: true }
  }

  const login = ({ email, password }) => {
    const found = users.find((u) => u.email === email && u.password === password)
    if (!found) return { ok: false, error: 'Credenciais inválidas.' }
    setUser({ id: found.id, name: found.name, email: found.email })
    return { ok: true }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
