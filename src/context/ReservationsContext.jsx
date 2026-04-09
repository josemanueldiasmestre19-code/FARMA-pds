import { createContext, useContext } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.js'
import { useAuth } from './AuthContext.jsx'

const ReservationsContext = createContext(null)

export function ReservationsProvider({ children }) {
  const { user } = useAuth()
  const [all, setAll] = useLocalStorage('fa_reservations', [])

  const reservations = user ? all.filter((r) => r.userId === user.id) : []

  const addReservation = (data) => {
    if (!user) return { ok: false, error: 'Precisa de iniciar sessão.' }
    const reservation = {
      id: Date.now(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      status: 'pendente',
      ...data,
    }
    setAll([reservation, ...all])
    return { ok: true, reservation }
  }

  const cancelReservation = (id) => {
    setAll(all.filter((r) => r.id !== id))
  }

  return (
    <ReservationsContext.Provider value={{ reservations, addReservation, cancelReservation }}>
      {children}
    </ReservationsContext.Provider>
  )
}

export const useReservations = () => useContext(ReservationsContext)
