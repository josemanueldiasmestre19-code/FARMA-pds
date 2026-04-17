import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      toast.error(t('protected_signin_required'))
    }
  }, [loading, user, t])

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
