import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Pill, MapPin, CheckCircle2, LogIn } from 'lucide-react'
import Modal from './ui/Modal.jsx'
import Button from './ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useReservations } from '../context/ReservationsContext.jsx'

export default function ReserveModal({ open, onClose, medicine, pharmacy }) {
  const { user } = useAuth()
  const { addReservation } = useReservations()
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
      toast.success('Reserva confirmada com sucesso!')
      setTimeout(() => {
        setDone(false)
        onClose()
        navigate('/reservas')
      }, 1400)
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
    <Modal open={open} onClose={handleClose} title={done ? null : 'Confirmar reserva'}>
      {!user ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
            <LogIn className="w-7 h-7 text-amber-600" />
          </div>
          <h4 className="font-bold text-slate-900">Inicie sessão para reservar</h4>
          <p className="text-sm text-slate-500 mt-1">Precisa de uma conta para reservar medicamentos.</p>
          <div className="flex gap-2 mt-5 justify-center">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { onClose(); navigate('/login') }}>Iniciar sessão</Button>
          </div>
        </div>
      ) : done ? (
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3 animate-pulse">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h4 className="text-xl font-extrabold text-slate-900">Reserva confirmada!</h4>
          <p className="text-sm text-slate-500 mt-1">A redirigir para as suas reservas...</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center">
                <Pill className="w-5 h-5 text-brand-700" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500">Medicamento</div>
                <div className="font-bold text-slate-900">{medicine.name}</div>
              </div>
              <div className="font-extrabold text-slate-900">{medicine.price} MT</div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500">Farmácia</div>
                <div className="font-semibold text-slate-900 text-sm">{pharmacy.name}</div>
                <div className="text-xs text-slate-500">{pharmacy.address}</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Ao confirmar, a reserva ficará disponível na farmácia por 24h. Levante directamente no balcão.
          </p>
          <div className="flex gap-2 mt-5">
            <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={loading}>
              {loading ? 'A confirmar...' : 'Confirmar reserva'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
