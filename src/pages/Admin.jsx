import { useState } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Pill, Store, Plus, Pencil, Trash2, X, Save, Shield, Inbox, Wallet, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import AdminApplications from '../components/AdminApplications.jsx'
import { supabase } from '../lib/supabase.js'
import { useData } from '../context/DataContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { translateError } from '../lib/errors.js'
import { formatMT, normalize } from '../lib/format.js'
import usePageTitle from '../hooks/usePageTitle.js'

const emptyMedicine = { name: '', category: '', price: '' }
const emptyPharmacy = { name: '', address: '', phone: '', hours: '', lat: '', lng: '' }

export default function Admin() {
  const { medicines, pharmacies, refetch } = useData()
  const { t } = useI18n()
  usePageTitle(t('admin_panel'))
  const [tab, setTab] = useState('applications')
  const [modal, setModal] = useState(null) // { type, item }
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null) // { type, id, name }
  const [filter, setFilter] = useState('')

  const TABS = [
    { id: 'applications', label: 'Pedidos', icon: Inbox },
    { id: 'medicines', label: t('admin_medicines'), icon: Pill },
    { id: 'pharmacies', label: t('admin_pharmacies'), icon: Store },
  ]

  const openCreate = (type) =>
    setModal({ type, item: type === 'medicines' ? { ...emptyMedicine } : { ...emptyPharmacy } })

  const openEdit = (type, item) => setModal({ type, item: { ...item } })

  const close = () => setModal(null)

  const save = async (e) => {
    e.preventDefault()
    if (saving) return
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
      toast.error(translateError(error.message))
      return
    }
    toast.success(isNew ? t('admin_created') : t('admin_updated'))
    close()
    refetch()
  }

  const confirmRemove = async () => {
    if (!deleting || saving) return
    setSaving(true)
    const { error } = await supabase.from(deleting.type).delete().eq('id', deleting.id)
    setSaving(false)
    if (error) {
      toast.error(translateError(error.message))
      return
    }
    toast.success(t('admin_removed'))
    setDeleting(null)
    refetch()
  }

  const q = normalize(filter)
  const items = (tab === 'medicines' ? medicines : pharmacies).filter((i) =>
    !q || normalize(i.name).includes(q) || normalize(i.category || i.address).includes(q)
  )
  const tabCfg = TABS.find((t) => t.id === tab)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 font-semibold">{t('admin_panel')}</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{t('admin_title')}</h1>
        </div>
        <Link
          to="/admin/financas"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:scale-105 transition shadow-md"
        >
          <Wallet className="w-4 h-4" /> Finanças
        </Link>
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
              {tb.id !== 'applications' && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {tb.id === 'medicines' ? medicines.length : pharmacies.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'applications' ? (
        <AdminApplications />
      ) : (
      <>
      {/* Actions */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className="font-bold text-slate-900 dark:text-white">{tabCfg.label}</h2>
        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input type="search" aria-label="Filtrar" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar..."
            className="flex-1 px-2 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 min-w-0" />
        </div>
        <Button onClick={() => openCreate(tab)}>
          <Plus className="w-4 h-4" /> {t('admin_new')}
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
                    ? `${item.category} • ${formatMT(item.price)}`
                    : item.address}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="secondary" onClick={() => openEdit(tab, item)} aria-label={`${t('admin_edit')} ${item.name}`}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleting({ type: tab, id: item.id, name: item.name })} aria-label={`Apagar ${item.name}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('admin_empty')}
          </div>
        )}
      </div>
      </>
      )}

      {/* Confirmação de remoção */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Apagar registo">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">{t('admin_delete_confirm').replace('{name}', deleting.name)}</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleting(null)} disabled={saving}>{t('common_cancel')}</Button>
              <Button variant="danger" className="flex-1" onClick={confirmRemove} disabled={saving}><Trash2 className="w-4 h-4" /> Apagar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal */}
      <Modal open={!!modal} onClose={close} title={modal?.item?.id ? t('admin_edit') : t('admin_create_new')}>
        {modal && (
          <form onSubmit={save} className="space-y-3">
            {modal.type === 'medicines' ? (
              <>
                <Field label={t('admin_name')} value={modal.item.name} onChange={(v) => setModal({ ...modal, item: { ...modal.item, name: v } })} required />
                <Field label={t('admin_category')} value={modal.item.category} onChange={(v) => setModal({ ...modal, item: { ...modal.item, category: v } })} required />
                <Field label={t('admin_price')} type="number" value={modal.item.price} onChange={(v) => setModal({ ...modal, item: { ...modal.item, price: v } })} required />
              </>
            ) : (
              <>
                <Field label={t('admin_name')} value={modal.item.name} onChange={(v) => setModal({ ...modal, item: { ...modal.item, name: v } })} required />
                <Field label={t('admin_address')} value={modal.item.address} onChange={(v) => setModal({ ...modal, item: { ...modal.item, address: v } })} required />
                <Field label={t('admin_phone')} value={modal.item.phone} onChange={(v) => setModal({ ...modal, item: { ...modal.item, phone: v } })} required />
                <Field label={t('admin_hours')} value={modal.item.hours} onChange={(v) => setModal({ ...modal, item: { ...modal.item, hours: v } })} required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('admin_latitude')} type="number" step="0.0001" value={modal.item.lat} onChange={(v) => setModal({ ...modal, item: { ...modal.item, lat: v } })} required />
                  <Field label={t('admin_longitude')} type="number" step="0.0001" value={modal.item.lng} onChange={(v) => setModal({ ...modal, item: { ...modal.item, lng: v } })} required />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={close} className="flex-1">
                <X className="w-4 h-4" /> {t('common_cancel')}
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                <Save className="w-4 h-4" /> {saving ? t('admin_saving') : t('admin_save')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, step }) {
  const id = 'admin-' + label.replace(/\W+/g, '-').toLowerCase()
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <input
        id={id}
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
