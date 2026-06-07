import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const NotificationsContext = createContext(null)
const MAX_NOTIFICATIONS = 50

export function NotificationsProvider({ children }) {
  const { user, isPharmacyStaff, pharmacyId, isAdmin } = useAuth()
  const [notifications, setNotifications] = useState([])

  const storageKey = user ? `vonamed_notifications_${user.id}` : null

  // Load from localStorage when user changes
  useEffect(() => {
    if (!storageKey) {
      setNotifications([])
      return
    }
    try {
      const stored = localStorage.getItem(storageKey)
      setNotifications(stored ? JSON.parse(stored) : [])
    } catch {
      setNotifications([])
    }
  }, [storageKey])

  // Persist
  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications))
    } catch {}
  }, [notifications, storageKey])

  const addNotification = useCallback((notif) => {
    const id = notif.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setNotifications((prev) => {
      // Dedup: skip if reservationId already produced same type recently
      if (notif.reservationId) {
        const recent = prev.find(
          (n) => n.reservationId === notif.reservationId && n.type === notif.type
        )
        if (recent) return prev
      }
      return [
        { id, read: false, createdAt: new Date().toISOString(), ...notif },
        ...prev,
      ].slice(0, MAX_NOTIFICATIONS)
    })
  }, [])

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => setNotifications([]), [])

  // Realtime: client own reservations
  useEffect(() => {
    if (!user) return

    const clientChannel = supabase
      .channel(`notif-client-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations', filter: `user_id=eq.${user.id}` },
        (payload) => {
          addNotification({
            type: 'reservation_created',
            title: 'Reserva criada',
            body: `${payload.new.medicine_name} em ${payload.new.pharmacy_name}`,
            link: '/reservas',
            reservationId: payload.new.id,
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reservations', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const oldStatus = payload.old?.status
          const newStatus = payload.new?.status
          if (oldStatus === newStatus) return

          if (newStatus === 'aprovada') {
            addNotification({
              type: 'reservation_approved',
              title: 'Reserva aprovada',
              body: `${payload.new.medicine_name} está pronta para levantamento em ${payload.new.pharmacy_name}.`,
              link: '/reservas',
              reservationId: payload.new.id,
            })
          } else if (newStatus === 'cancelada') {
            addNotification({
              type: 'reservation_cancelled',
              title: 'Reserva cancelada',
              body: `A reserva de ${payload.new.medicine_name} foi cancelada.`,
              link: '/reservas',
              reservationId: payload.new.id,
            })
          } else if (newStatus === 'concluida') {
            addNotification({
              type: 'reservation_completed',
              title: 'Levantamento confirmado',
              body: `Levantou ${payload.new.medicine_name}. Obrigado!`,
              link: '/reservas',
              reservationId: payload.new.id,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(clientChannel)
    }
  }, [user, addNotification])

  // Realtime: pharmacy staff (or admin) - new + cancellations on their pharmacy
  useEffect(() => {
    if (!user) return
    if (!isPharmacyStaff && !isAdmin) return

    const filter = pharmacyId != null ? `pharmacy_id=eq.${pharmacyId}` : undefined

    const staffChannel = supabase
      .channel(`notif-staff-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          // Don't notify the staff if they are also the buyer
          if (payload.new.user_id === user.id) return
          addNotification({
            type: 'new_reservation',
            title: 'Nova reserva recebida',
            body: `${payload.new.medicine_name} • ${payload.new.price} MT`,
            link: '/dashboard/reservas',
            reservationId: payload.new.id,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          const oldStatus = payload.old?.status
          const newStatus = payload.new?.status
          if (oldStatus === newStatus) return
          if (payload.new.user_id === user.id) return

          if (oldStatus !== 'cancelada' && newStatus === 'cancelada') {
            addNotification({
              type: 'reservation_cancelled_by_client',
              title: 'Reserva cancelada pelo cliente',
              body: `${payload.new.medicine_name} • ${payload.new.price} MT`,
              link: '/dashboard/reservas',
              reservationId: payload.new.id,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(staffChannel)
    }
  }, [user, isPharmacyStaff, isAdmin, pharmacyId, addNotification])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markRead,
        markAllRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
