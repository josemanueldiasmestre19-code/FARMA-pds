import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Building2, MapPin, Phone, Clock, FileText, User, Mail, Send, CheckCircle2, Clock as ClockIcon, XCircle, MousePointer2 } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#dc2626;border:3px solid white;box-shadow:0 4px 12px rgba(220,38,38,0.5);"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function ClickToPin({ onPick }) {
  useMapEvents({ click(e) { onPick([e.latlng.lat, e.latlng.lng]) } })
  return null
}

export default function PharmacyRegistration() {
  const { user, isPharmacyStaff } = useAuth()
  const navigate = useNavigate()
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    pharmacy_name: '',
    address: '',
    phone: '',
    hours: '',
    license_number: '',
    owner_name: user?.user_metadata?.name || '',
    owner_phone: '',
    notes: '',
  })
  const [coords, setCoords] = useState([-25.9655, 32.5832])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchExisting() {
      const { data } = await supabase
        .from('pharmacy_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setExisting(data)
      setLoading(false)
    }

    fetchExisting()
  }, [user])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      user_id: user.id,
      ...form,
      lat: coords[0],
      lng: coords[1],
    }

    const { data, error } = await supabase
      .from('pharmacy_applications')
      .insert(payload)
      .select()
      .single()

    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Pedido enviado! Aguarde aprovação.')
    setExisting(data)
  }

  const cancelApplication = async () => {
    if (!existing || existing.status !== 'pending') return
    if (!confirm('Cancelar este pedido?')) return
    await supabase.from('pharmacy_applications').delete().eq('id', existing.id)
    toast.success('Pedido cancelado')
    setExisting(null)
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Inicie sessão</h1>
        <p className="text-slate-500 mb-6">Precisa de ter conta para registar a sua farmácia.</p>
        <Button onClick={() => navigate('/login')}>Iniciar sessão</Button>
      </div>
    )
  }

  if (isPharmacyStaff) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Já tem acesso</h1>
        <p className="text-slate-500 mb-6">A sua conta já está ligada a uma farmácia.</p>
        <Button onClick={() => navigate('/dashboard')}>Ir para Dashboard</Button>
      </div>
    )
  }

  if (loading) return null

  // Status: pending
  if (existing?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <ClockIcon className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Pedido em análise</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            O seu pedido para registar a farmácia <strong>{existing.pharmacy_name}</strong> está a ser revisto pela nossa equipa. Entraremos em contacto em breve.
          </p>
          <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left text-sm space-y-1">
            <div><strong>Submetido:</strong> {new Date(existing.created_at).toLocaleString('pt-PT')}</div>
            <div><strong>Morada:</strong> {existing.address}</div>
            <div><strong>NUIT/Alvará:</strong> {existing.license_number}</div>
          </div>
          <button
            onClick={cancelApplication}
            className="mt-6 text-sm text-rose-600 hover:text-rose-700 font-semibold"
          >
            Cancelar pedido
          </button>
        </div>
      </div>
    )
  }

  // Status: rejected (mostrar mas permitir novo pedido)
  const wasRejected = existing?.status === 'rejected'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Registar farmácia</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Preencha o formulário com os dados oficiais da sua farmácia. A nossa equipa irá rever o pedido.
        </p>
      </div>

      {wasRejected && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-bold text-rose-900 dark:text-rose-200">Pedido anterior rejeitado</div>
              {existing.rejection_reason && (
                <div className="text-rose-700 dark:text-rose-300 mt-1">Motivo: {existing.rejection_reason}</div>
              )}
              <div className="text-rose-600 dark:text-rose-400 mt-1 text-xs">Pode submeter novo pedido com correcções.</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <Section title="Informação da farmácia" icon={Building2}>
          <Field label="Nome da farmácia" icon={Building2} value={form.pharmacy_name} onChange={(v) => setForm({ ...form, pharmacy_name: v })} required placeholder="Farmácia ..." />
          <Field label="Morada completa" icon={MapPin} value={form.address} onChange={(v) => setForm({ ...form, address: v })} required placeholder="Av. ..., nº, bairro, cidade" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Telefone" icon={Phone} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required placeholder="+258 ..." />
            <Field label="Horário" icon={Clock} value={form.hours} onChange={(v) => setForm({ ...form, hours: v })} required placeholder="07:00 - 21:00" />
          </div>
          <Field label="NUIT / Número de alvará" icon={FileText} value={form.license_number} onChange={(v) => setForm({ ...form, license_number: v })} required placeholder="Documento oficial" />
        </Section>

        <Section title="Localização no mapa" icon={MapPin}>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <MousePointer2 className="w-3 h-3" /> Clique no mapa para marcar a localização exacta
          </p>
          <div className="h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <MapContainer center={coords} zoom={13} className="h-full w-full">
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <ClickToPin onPick={setCoords} />
              <Marker position={coords} icon={pinIcon} />
            </MapContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Latitude: <span className="font-mono text-slate-700 dark:text-slate-200">{coords[0].toFixed(5)}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
              Longitude: <span className="font-mono text-slate-700 dark:text-slate-200">{coords[1].toFixed(5)}</span>
            </div>
          </div>
        </Section>

        <Section title="Responsável" icon={User}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nome do responsável" icon={User} value={form.owner_name} onChange={(v) => setForm({ ...form, owner_name: v })} required placeholder="Nome completo" />
            <Field label="Telefone do responsável" icon={Phone} value={form.owner_phone} onChange={(v) => setForm({ ...form, owner_phone: v })} required placeholder="+258 ..." />
          </div>
          <Field label="Email da conta" icon={Mail} value={user.email} disabled />
        </Section>

        <Section title="Notas adicionais" icon={FileText}>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Informação extra (opcional)"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-brand-300 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100 resize-none transition"
          />
        </Section>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
          ℹ️ Após aprovação, terá acesso ao Dashboard para gerir o stock da sua farmácia.
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          <Send className="w-4 h-4" /> {submitting ? 'A enviar...' : 'Submeter pedido'}
        </Button>
      </form>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-brand-600" />
        <h2 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, icon: Icon, value, onChange, required, placeholder, disabled }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className={`mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition ${disabled ? 'opacity-60' : ''}`}>
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        <input
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="flex-1 py-2.5 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100"
        />
      </div>
    </div>
  )
}
