import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const { t } = useI18n()

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error(t('admin_access_denied'))
    }
  }, [loading, user, isAdmin, t])

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return children
}
