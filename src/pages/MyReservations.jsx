import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Pill, MapPin, Calendar, Trash2, ShoppingBag } from 'lucide-react'
import { useReservations } from '../context/ReservationsContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Button from '../components/ui/Button.jsx'

export default function MyReservations() {
  const { user } = useAuth()
  const { reservations, cancelReservation } = useReservations()

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Inicie sessão para ver as suas reservas"
          description="Acompanhe os seus medicamentos reservados em qualquer farmácia."
          action={
            <Link to="/login">
              <Button>Iniciar sessão</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleCancel = (id) => {
    cancelReservation(id)
    toast.success('Reserva cancelada')
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Minhas Reservas</h1>
        <p className="mt-2 text-slate-600">
          {reservations.length} {reservations.length === 1 ? 'reserva activa' : 'reservas activas'}
        </p>
      </div>

      {reservations.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Ainda não tem reservas"
          description="Pesquise um medicamento e reserve numa farmácia próxima."
          action={
            <Link to="/pesquisa">
              <Button>Pesquisar medicamento</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {reservations.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6 text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900">{r.medicine_name}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
                      {r.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {r.pharmacy_name}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" /> {new Date(r.created_at).toLocaleString('pt-PT')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900">{r.price} MT</div>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleCancel(r.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
