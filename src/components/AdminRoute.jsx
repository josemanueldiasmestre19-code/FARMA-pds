import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error('Acesso restrito a administradores')
    }
  }, [loading, user, isAdmin])

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return children
}
