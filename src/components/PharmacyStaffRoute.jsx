import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function PharmacyStaffRoute({ children }) {
  const { user, isPharmacyStaff, loading } = useAuth()
  const { t } = useI18n()

  useEffect(() => {
    if (!loading && user && !isPharmacyStaff) {
      toast.error(t('staff_access_denied'))
    }
  }, [loading, user, isPharmacyStaff, t])

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!isPharmacyStaff) return <Navigate to="/" replace />

  return children
}
