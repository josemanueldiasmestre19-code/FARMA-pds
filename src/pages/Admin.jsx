import { useState } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Pill, Store, Plus, Pencil, Trash2, X, Save, Shield } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import { supabase } from '../lib/supabase.js'
import { useData } from '../context/DataContext.jsx'

const TABS = [
  { id: 'medicines', label: 'Medicamentos', icon: Pill },
  { id: 'pharmacies', label: 'Farmácias', icon: Store },
]

const emptyMedicine = { name: '', category: '', price: '' }
const emptyPharmacy = { name: '', address: '', phone: '', hours: '', lat: '', lng: '' }

export default function Admin() {
  const { medicines, pharmacies } = useData()
  const [tab, setTab] = useState('medicines')
  const [modal, setModal] = useState(null) // { type, item }
  const [saving, setSaving] = useState(false)

  const openCreate = (type) =>
    setModal({ type, item: type === 'medicines' ? { ...emptyMedicine } : { ...emptyPharmacy } })

  const openEdit = (type, item) => setModal({ type, item: { ...item } })

  const close = () => setModal(null)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)

    const isNew = !modal.item.id
    const table = modal.type

    let payload = { ...modal.item }
    if (table === 'medicines') {
      payload.price = Number(payload.price)
    } else {
      payload.lat = Number(payload.lat)
      payload.lng = Number(payload.lng)
      payload.rating = payload.rating ?? 0
    }

    const query = isNew
      ? supabase.from(table).insert(payload)
      : supabase.from(table).update(payload).eq('id', payload.id)

    const { error } = await query
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(isNew ? 'Criado com sucesso!' : 'Actualizado!')
    close()
    window.location.reload() // recarrega dados do DataContext
  }

  const remove = async (type, id, name) => {
    if (!confirm(`Apagar "${name}"? Esta acção é irreversível.`)) return
    const { error } = await supabase.from(type).delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Removido!')
    window.location.reload()
  }

  const items = tab === 'medicines' ? medicines : pharmacies
  const tabCfg = TABS.find((t) => t.id === tab)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 font-semibold">Painel Administrativo</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Gestão</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 flex gap-1 mb-6 overflow-x-auto scrollbar-thin">
        {TABS.map((tb) => {
          const Icon = tb.icon
          const isActive = tab === tb.id
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" /> {tb.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {tab === tb.id ? items.length : (tb.id === 'medicines' ? medicines.length : pharmacies.length)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 dark:text-white">{tabCfg.label}</h2>
        <Button onClick={() => openCreate(tab)}>
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {tab === 'medicines'
                    ? `${item.category} • ${item.price} MT`
                    : item.address}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="secondary" onClick={() => openEdit(tab, item)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(tab, item.id, item.name)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Nada por aqui ainda.
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={!!modal} onClose={close} title={modal?.item?.id ? 'Editar' : 'Criar novo'}>
        {modal && (
          <form onSubmit={save} className="space-y-3">
            {modal.type === 'medicines' ? (
              <>
                <Field label="Nome" value={modal.item.name} onChange={(v) => setModal({ ...modal, item: { ...modal.item, name: v } })} required />
                <Field label="Categoria" value={modal.item.category} onChange={(v) => setModal({ ...modal, item: { ...modal.item, category: v } })} required />
                <Field label="Preço (MT)" type="number" value={modal.item.price} onChange={(v) => setModal({ ...modal, item: { ...modal.item, price: v } })} required />
              </>
            ) : (
              <>
                <Field label="Nome" value={modal.item.name} onChange={(v) => setModal({ ...modal, item: { ...modal.item, name: v } })} required />
                <Field label="Morada" value={modal.item.address} onChange={(v) => setModal({ ...modal, item: { ...modal.item, address: v } })} required />
                <Field label="Telefone" value={modal.item.phone} onChange={(v) => setModal({ ...modal, item: { ...modal.item, phone: v } })} required />
                <Field label="Horário" value={modal.item.hours} onChange={(v) => setModal({ ...modal, item: { ...modal.item, hours: v } })} required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Latitude" type="number" step="0.0001" value={modal.item.lat} onChange={(v) => setModal({ ...modal, item: { ...modal.item, lat: v } })} required />
                  <Field label="Longitude" type="number" step="0.0001" value={modal.item.lng} onChange={(v) => setModal({ ...modal, item: { ...modal.item, lng: v } })} required />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={close} className="flex-1">
                <X className="w-4 h-4" /> Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                <Save className="w-4 h-4" /> {saving ? 'A guardar...' : 'Guardar'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, step }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type={type}
        step={step}
        required={required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-brand-300 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100 transition"
      />
    </div>
  )
}
