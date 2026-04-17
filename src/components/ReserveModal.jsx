import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Pill, MapPin, CheckCircle2, LogIn, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import Modal from './ui/Modal.jsx'
import Button from './ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useReservations } from '../context/ReservationsContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'

export default function ReserveModal({ open, onClose, medicine, pharmacy }) {
  const { user } = useAuth()
  const { addReservation } = useReservations()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!medicine || !pharmacy) return null

  const handleConfirm = async () => {
    setLoading(true)
    const res = await addReservation({
      medicineId: medicine.id,
      medicineName: medicine.name,
      price: medicine.price,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      pharmacyAddress: pharmacy.address,
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      toast.success(t('reserve_success_toast'))
    } else {
      toast.error(res.error)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setDone(false)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={done ? null : t('reserve_confirm_title')}>
      {!user ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
            <LogIn className="w-7 h-7 text-amber-600" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">{t('reserve_signin_needed')}</h4>
          <p className="text-sm text-slate-500 mt-1">{t('reserve_signin_desc')}</p>
          <div className="flex gap-2 mt-5 justify-center">
            <Button variant="secondary" onClick={onClose}>{t('common_cancel')}</Button>
            <Button onClick={() => { onClose(); navigate('/login') }}>{t('auth_signin_link')}</Button>
          </div>
        </div>
      ) : done ? (
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3 animate-pulse">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('reserve_confirmed')}</h4>
          <p className="text-sm text-slate-500 mt-1">{t('reserve_redirecting')}</p>
          <Link
            to={`/mapa?route=${pharmacy.id}`}
            onClick={handleClose}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-blue-500 text-white font-semibold text-sm rounded-xl hover:bg-blue-600 transition"
          >
            <Navigation className="w-4 h-4" /> Ver rota até à farmácia
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center">
                <Pill className="w-5 h-5 text-brand-700" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('reserve_medicine')}</div>
                <div className="font-bold text-slate-900 dark:text-white">{medicine.name}</div>
              </div>
              <div className="font-extrabold text-slate-900 dark:text-white">{medicine.price} MT</div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('reserve_pharmacy')}</div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">{pharmacy.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{pharmacy.address}</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
            {t('reserve_note')}
          </p>
          <div className="flex gap-2 mt-5">
            <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={loading}>
              {t('common_cancel')}
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={loading}>
              {loading ? t('reserve_confirming') : t('reserve_confirm')}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
