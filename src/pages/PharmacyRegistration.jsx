import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Building2, MapPin, Phone, Clock, FileText, User, Mail, Send, CheckCircle2,
  Clock as ClockIcon, XCircle, MousePointer2, Loader2, RefreshCw, LayoutDashboard,
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { translateError } from '../lib/errors.js'
import { formatDateTime, parseMzPhone } from '../lib/format.js'
import usePageTitle from '../hooks/usePageTitle.js'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#dc2626;border:3px solid white;box-shadow:0 4px 12px rgba(220,38,38,0.5);"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const MAPUTO_CENTER = [-25.9655, 32.5832]

function ClickToPin({ onPick }) {
  useMapEvents({ click(e) { onPick([e.latlng.lat, e.latlng.lng]) } })
  return null
}

const EMPTY_FORM = {
  pharmacy_name: '', address: '', phone: '', hours: '', license_number: '', owner_name: '', owner_phone: '', notes: '',
}

function validate(form, coords) {
  const errors = {}
  if (form.pharmacy_name.trim().length < 3) errors.pharmacy_name = 'Indique o nome da farmácia.'
  if (form.address.trim().length < 8) errors.address = 'Indique a morada completa (rua, bairro, cidade).'
  if (!parseMzPhone(form.phone)) errors.phone = 'Telefone inválido. Ex.: 84 123 4567.'
  if (!form.hours.trim()) errors.hours = 'Indique o horário. Ex.: 07:00 - 21:00.'
  if (form.license_number.trim().length < 6) errors.license_number = 'Indique o NUIT ou o número de alvará.'
  if (form.owner_name.trim().length < 3) errors.owner_name = 'Indique o nome do responsável.'
  if (!parseMzPhone(form.owner_phone)) errors.owner_phone = 'Telefone inválido. Ex.: 84 123 4567.'
  if (Math.abs(coords[0] - MAPUTO_CENTER[0]) < 1e-6 && Math.abs(coords[1] - MAPUTO_CENTER[1]) < 1e-6) {
    errors.coords = 'Marque a localização exacta da farmácia no mapa.'
  }
  return errors
}

export default function PharmacyRegistration() {
  const { user, isPharmacyStaff, refreshSession } = useAuth()
  const navigate = useNavigate()
  usePageTitle('Registar farmácia')
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [touched, setTouched] = useState({})
  const [form, setForm] = useState({ ...EMPTY_FORM, owner_name: user?.user_metadata?.name || '' })
  const [coords, setCoords] = useState(MAPUTO_CENTER)

  const errors = validate(form, coords)
  const showError = (k) => touched[k] && errors[k]

  // Carrega o pedido mais recente e fica a ouvir alterações (aprovação/rejeição pelo admin)
  useEffect(() => {
    if (!user) { setLoading(false); return }

    let cancelled = false
    supabase
      .from('pharmacy_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) { setExisting(data); setLoading(false) } })

    const channel = supabase
      .channel(`my-application-${user.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pharmacy_applications', filter: `user_id=eq.${user.id}` },
        (payload) => setExisting(payload.new))
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [user])

  // Aprovado → o JWT ainda não tem pharmacy_id. Renovar sessão e entrar no dashboard.
  useEffect(() => {
    if (existing?.status !== 'approved' || isPharmacyStaff) return
    let active = true
    ;(async () => {
      setRefreshing(true)
      const res = await refreshSession()
      if (!active) return
      setRefreshing(false)
      if (res.ok && res.user?.app_metadata?.pharmacy_id != null) {
        toast.success('Farmácia aprovada! Bem-vindo ao dashboard.')
        navigate('/dashboard', { replace: true })
      }
    })()
    return () => { active = false }
  }, [existing?.status, isPharmacyStaff, refreshSession, navigate])

  const submit = async (e) => {
    e.preventDefault()
    setTouched(Object.fromEntries([...Object.keys(EMPTY_FORM), 'coords'].map((k) => [k, true])))
    if (Object.keys(errors).length > 0 || submitting) return

    setSubmitting(true)
    const payload = {
      user_id: user.id,
      ...form,
      pharmacy_name: form.pharmacy_name.trim(),
      address: form.address.trim(),
      phone: '+258 ' + parseMzPhone(form.phone).replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3'),
      owner_phone: '+258 ' + parseMzPhone(form.owner_phone).replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3'),
      notes: form.notes.trim() || null,
      lat: coords[0],
      lng: coords[1],
    }

    const { data, error } = await supabase.from('pharmacy_applications').insert(payload).select().single()
    setSubmitting(false)
    if (error) {
      toast.error(translateError(error.message))
      return
    }
    toast.success('Pedido enviado! Aguarde aprovação.')
    setExisting(data)
  }

  const cancelApplication = async () => {
    if (!existing || existing.status !== 'pending') return
    const { error } = await supabase.from('pharmacy_applications').delete().eq('id', existing.id)
    if (error) { toast.error(translateError(error.message)); return }
    toast.success('Pedido cancelado')
    setExisting(null)
  }

  if (isPharmacyStaff) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Já tem acesso</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">A sua conta já está ligada a uma farmácia.</p>
        <Button onClick={() => navigate('/dashboard')}><LayoutDashboard className="w-4 h-4" /> Ir para o Dashboard</Button>
      </div>
    )
  }

  if (loading) {
    return <div className="py-20 text-center" role="status"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>
  }

  if (existing?.status === 'approved') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Farmácia aprovada!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            <strong>{existing.pharmacy_name}</strong> já faz parte da Vonamed. A activar o seu acesso...
          </p>
          <Button className="mt-6" disabled={refreshing} onClick={async () => {
            setRefreshing(true)
            const res = await refreshSession()
            setRefreshing(false)
            if (res.ok && res.user?.app_metadata?.pharmacy_id != null) navigate('/dashboard', { replace: true })
            else toast.error('Ainda não foi possível activar. Termine sessão e volte a entrar.')
          }}>
            {refreshing ? <><Loader2 className="w-4 h-4 animate-spin" /> A activar...</> : <><RefreshCw className="w-4 h-4" /> Entrar no Dashboard</>}
          </Button>
        </div>
      </div>
    )
  }

  if (existing?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <ClockIcon className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Pedido em análise</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            O pedido para registar <strong>{existing.pharmacy_name}</strong> está a ser revisto pela nossa equipa.
            Esta página actualiza-se automaticamente quando houver decisão.
          </p>
          <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left text-sm space-y-1 text-slate-700 dark:text-slate-200">
            <div><strong>Submetido:</strong> {formatDateTime(existing.created_at)}</div>
            <div><strong>Morada:</strong> {existing.address}</div>
            <div><strong>NUIT/Alvará:</strong> {existing.license_number}</div>
          </div>
          <button onClick={cancelApplication} className="mt-6 text-sm text-rose-600 hover:text-rose-700 font-semibold">
            Cancelar pedido
          </button>
        </motion.div>
      </div>
    )
  }

  const wasRejected = existing?.status === 'rejected'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Registar farmácia</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Preencha com os dados oficiais da sua farmácia. A nossa equipa revê o pedido em 24–48h.
        </p>
      </div>

      {wasRejected && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4" role="alert">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-bold text-rose-900 dark:text-rose-200">Pedido anterior rejeitado</div>
              {existing.rejection_reason && <div className="text-rose-700 dark:text-rose-300 mt-1">Motivo: {existing.rejection_reason}</div>}
              <div className="text-rose-600 dark:text-rose-400 mt-1 text-xs">Pode submeter um novo pedido com as correcções.</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <Section title="Informação da farmácia" icon={Building2}>
          <Field id="pharmacy_name" label="Nome da farmácia" icon={Building2} value={form.pharmacy_name} error={showError('pharmacy_name')}
            onChange={(v) => setForm({ ...form, pharmacy_name: v })} onBlur={() => setTouched({ ...touched, pharmacy_name: true })} placeholder="Farmácia ..." />
          <Field id="address" label="Morada completa" icon={MapPin} value={form.address} error={showError('address')}
            onChange={(v) => setForm({ ...form, address: v })} onBlur={() => setTouched({ ...touched, address: true })} placeholder="Av. ..., nº, bairro, cidade" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field id="phone" label="Telefone" icon={Phone} type="tel" prefix="+258" value={form.phone} error={showError('phone')}
              onChange={(v) => setForm({ ...form, phone: v })} onBlur={() => setTouched({ ...touched, phone: true })} placeholder="84 123 4567" />
            <Field id="hours" label="Horário" icon={Clock} value={form.hours} error={showError('hours')}
              onChange={(v) => setForm({ ...form, hours: v })} onBlur={() => setTouched({ ...touched, hours: true })} placeholder="07:00 - 21:00" />
          </div>
          <Field id="license_number" label="NUIT / Número de alvará" icon={FileText} value={form.license_number} error={showError('license_number')}
            onChange={(v) => setForm({ ...form, license_number: v })} onBlur={() => setTouched({ ...touched, license_number: true })} placeholder="Documento oficial" />
        </Section>

        <Section title="Localização no mapa" icon={MapPin}>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <MousePointer2 className="w-3 h-3" /> Toque no mapa para marcar a localização exacta
          </p>
          <div className={`h-64 rounded-xl overflow-hidden border ${showError('coords') ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'}`}>
            <MapContainer center={coords} zoom={13} className="h-full w-full">
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickToPin onPick={(c) => { setCoords(c); setTouched({ ...touched, coords: true }) }} />
              <Marker position={coords} icon={pinIcon} />
            </MapContainer>
          </div>
          {showError('coords') ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">{errors.coords}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <div>Latitude: <span className="font-mono text-slate-700 dark:text-slate-200">{coords[0].toFixed(5)}</span></div>
              <div className="text-right">Longitude: <span className="font-mono text-slate-700 dark:text-slate-200">{coords[1].toFixed(5)}</span></div>
            </div>
          )}
        </Section>

        <Section title="Responsável" icon={User}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field id="owner_name" label="Nome do responsável" icon={User} value={form.owner_name} error={showError('owner_name')}
              onChange={(v) => setForm({ ...form, owner_name: v })} onBlur={() => setTouched({ ...touched, owner_name: true })} placeholder="Nome completo" />
            <Field id="owner_phone" label="Telefone do responsável" icon={Phone} type="tel" prefix="+258" value={form.owner_phone} error={showError('owner_phone')}
              onChange={(v) => setForm({ ...form, owner_phone: v })} onBlur={() => setTouched({ ...touched, owner_phone: true })} placeholder="84 123 4567" />
          </div>
          <Field id="email" label="Email da conta" icon={Mail} value={user.email} disabled />
        </Section>

        <Section title="Notas adicionais" icon={FileText}>
          <textarea
            id="notes"
            aria-label="Notas adicionais"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Informação extra (opcional)"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-brand-300 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100 resize-none transition"
          />
        </Section>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
          Após aprovação, terá acesso imediato ao Dashboard para gerir stock, reservas e a carteira da farmácia.
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> A enviar...</> : <><Send className="w-4 h-4" /> Submeter pedido</>}
        </Button>
      </form>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <fieldset>
      <legend className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-brand-600" />
        <span className="font-bold text-slate-900 dark:text-white text-sm">{title}</span>
      </legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  )
}

function Field({ id, label, icon: Icon, value, onChange, onBlur, placeholder, disabled, error, type = 'text', prefix }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className={`mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 border transition focus-within:ring-2 focus-within:ring-brand-300 ${
        error ? 'border-rose-300 dark:border-rose-700' : 'border-transparent'
      } ${disabled ? 'opacity-60' : ''}`}>
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        {prefix && <span className="ml-3 text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">{prefix}</span>}
        <input
          id={id}
          type={type}
          inputMode={type === 'tel' ? 'numeric' : undefined}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="flex-1 py-2.5 px-3 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 min-w-0"
        />
      </div>
      {error && <p id={`${id}-error`} className="text-xs text-rose-600 dark:text-rose-400 mt-1 pl-1">{error}</p>}
    </div>
  )
}
