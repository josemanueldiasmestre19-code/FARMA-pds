import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pharmacies, medicines } from '../data/mockData.js'
import { MapPin, Phone, Clock, Star, ArrowLeft, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react'
import ReserveModal from '../components/ReserveModal.jsx'

export default function PharmacyDetail() {
  const { id } = useParams()
  const pharmacy = pharmacies.find((p) => p.id === Number(id))
  const [reserveMed, setReserveMed] = useState(null)

  if (!pharmacy) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold">Farmácia não encontrada</h2>
        <Link to="/mapa" className="text-brand-600 mt-4 inline-block">Voltar ao mapa</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link to="/mapa" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div className="bg-gradient-to-br from-brand-600 to-emerald-700 rounded-3xl p-8 md:p-10 text-white shadow-xl">
        <div className="flex items-center gap-1 text-amber-300 text-sm font-semibold mb-2">
          <Star className="w-4 h-4 fill-amber-300" /> {pharmacy.rating} / 5.0
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold">{pharmacy.name}</h1>
        <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="text-brand-50">{pharmacy.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="text-brand-50">{pharmacy.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-brand-50">{pharmacy.hours}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Medicamentos disponíveis</h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {medicines.map((m) => {
            const stock = pharmacy.stock[m.id]
            return (
              <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{m.name}</h3>
                    <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                      {m.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {stock?.available ? `${stock.qty} unidades em stock` : 'Fora de stock'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{m.price} MT</div>
                  {stock?.available ? (
                    <div className="text-xs flex items-center gap-1 text-emerald-600 font-semibold justify-end">
                      <CheckCircle2 className="w-3 h-3" /> Disponível
                    </div>
                  ) : (
                    <div className="text-xs flex items-center gap-1 text-rose-500 font-semibold justify-end">
                      <XCircle className="w-3 h-3" /> Indisponível
                    </div>
                  )}
                </div>
                <button
                  disabled={!stock?.available}
                  onClick={() => setReserveMed(m)}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 hover:scale-105 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5 transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Reservar
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <ReserveModal
        open={!!reserveMed}
        onClose={() => setReserveMed(null)}
        medicine={reserveMed}
        pharmacy={pharmacy}
      />
    </div>
  )
}
