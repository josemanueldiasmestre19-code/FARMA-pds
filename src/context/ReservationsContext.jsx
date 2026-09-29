import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'
import { translateError } from '../lib/errors.js'

const ReservationsContext = createContext(null)

export function ReservationsProvider({ children }) {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchReservations = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) setError(translateError(error.message))
    else setReservations(data || [])
    setLoading(false)
  }, [user])

  // Carregar reservas e subscrever mudanças em tempo real
  useEffect(() => {
    if (!user) {
      setReservations([])
      return
    }

    fetchReservations()

    const channel = supabase
      .channel(`reservations-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReservations((prev) =>
              prev.find((r) => r.id === payload.new.id) ? prev : [payload.new, ...prev]
            )
          } else if (payload.eventType === 'UPDATE') {
            setReservations((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)))
          } else if (payload.eventType === 'DELETE') {
            setReservations((prev) => prev.filter((r) => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchReservations])

  // Cria a reserva E processa o pagamento simulado numa única transação no servidor.
  // A comissão é calculada no Postgres; o stock é decrementado; as carteiras creditadas.
  const reserveAndPay = async ({ medicineId, pharmacyId, method, phone }) => {
    if (!user) return { ok: false, error: 'Precisa de iniciar sessão.' }

    const { data, error } = await supabase.rpc('create_and_pay_reservation', {
      p_medicine_id: medicineId,
      p_pharmacy_id: pharmacyId,
      p_method: method,
      p_phone: phone ?? null,
    })
    if (error) return { ok: false, error: translateError(error.message) }

    setReservations((prev) => (prev.find((r) => r.id === data.id) ? prev : [data, ...prev]))
    return { ok: true, reservation: data }
  }

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
    if (error) return { ok: false, error: translateError(error.message) }
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    return { ok: true }
  }

  const cancelReservation = (id) => updateStatus(id, 'cancelada')
  const completeReservation = (id) => updateStatus(id, 'concluida')

  const deleteReservation = async (id) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id)
    if (error) return { ok: false, error: translateError(error.message) }
    setReservations((prev) => prev.filter((r) => r.id !== id))
    return { ok: true }
  }

  return (
    <ReservationsContext.Provider
      value={{
        reservations, loading, error, refetch: fetchReservations,
        reserveAndPay, cancelReservation, completeReservation, deleteReservation, setReservations,
      }}
    >
      {children}
    </ReservationsContext.Provider>
  )
}

export const useReservations = () => useContext(ReservationsContext)
