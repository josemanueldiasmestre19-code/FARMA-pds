import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const ReservationsContext = createContext(null)

export function ReservationsProvider({ children }) {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])

  // Carregar reservas do utilizador
  useEffect(() => {
    if (!user) {
      setReservations([])
      return
    }

    async function fetchReservations() {
      const { data } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setReservations(data || [])
    }

    fetchReservations()
  }, [user])

  const addReservation = async (data) => {
    if (!user) return { ok: false, error: 'Precisa de iniciar sessão.' }

    const row = {
      user_id: user.id,
      medicine_id: data.medicineId,
      medicine_name: data.medicineName,
      pharmacy_id: data.pharmacyId,
      pharmacy_name: data.pharmacyName,
      pharmacy_address: data.pharmacyAddress,
      price: data.price,
      status: 'pendente',
    }

    const { data: inserted, error } = await supabase
      .from('reservations')
      .insert(row)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }

    setReservations((prev) => [inserted, ...prev])
    return { ok: true, reservation: inserted }
  }

  const cancelReservation = async (id) => {
    await supabase.from('reservations').delete().eq('id', id)
    setReservations((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <ReservationsContext.Provider value={{ reservations, addReservation, cancelReservation }}>
      {children}
    </ReservationsContext.Provider>
  )
}

export const useReservations = () => useContext(ReservationsContext)
