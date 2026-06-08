import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Wallet, ArrowUpRight, ArrowDownRight, Receipt, Clock,
  TrendingUp, TrendingDown, Loader2, X, Send, ShieldCheck,
  ShoppingBag, Package, Store, Users,
} from 'lucide-react'
import Button from './ui/Button.jsx'
import Modal from './ui/Modal.jsx'
import { supabase } from '../lib/supabase.js'
import { formatMT } from '../lib/commission.js'

const TXN_CONFIG = {
  payment_in: { Icon: ArrowDownRight, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', sign: '+' },
  commission_in: { Icon: ShieldCheck, color: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300', sign: '+' },
  refund_in: { Icon: ArrowDownRight, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', sign: '+' },
  withdrawal: { Icon: ArrowUpRight, color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', sign: '−' },
  refund_out: { Icon: ArrowUpRight, color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', sign: '−' },
}

export default function WalletView({ kind = 'pharmacy', pharmacyId = null, stats = null }) {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  useEffect(() => {
    fetch()

    const channel = supabase
      .channel(`wallet-view-${kind}-${pharmacyId ?? 'platform'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, () => fetch())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [kind, pharmacyId])

  async function fetch() {
    setLoading(true)
    let q = supabase.from('wallets').select('*')
    if (kind === 'platform') {
      q = q.eq('is_platform', true)
    } else if (pharmacyId != null) {
      q = q.eq('pharmacy_id', pharmacyId)
    }

    const { data: walletData } = await q.maybeSingle()
    setWallet(walletData)

    if (walletData) {
      const { data: txns } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(100)
      setTransactions(txns || [])
    } else {
      setTransactions([])
    }
    setLoading(false)
  }

  const balance = wallet?.balance ?? 0
  const totalEarned = wallet?.total_earned ?? 0
  const totalWithdrawn = wallet?.total_withdrawn ?? 0

  return (
    <div className="space-y-6">
      {/* Balance hero card */}
      <div className={`relative rounded-3xl p-7 text-white shadow-xl overflow-hidden ${
        kind === 'platform'
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900'
          : 'bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800'
      }`}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80 mb-2">
            <Wallet className="w-4 h-4" />
            {kind === 'platform' ? 'Carteira Vonamed' : 'Carteira da farmácia'}
          </div>
          <div className="text-xs opacity-70 mb-1">Saldo disponível</div>
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {loading ? '—' : formatMT(balance)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Receita total
              </div>
              <div className="text-lg font-bold mt-0.5">{formatMT(totalEarned)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Levantado
              </div>
              <div className="text-lg font-bold mt-0.5">{formatMT(totalWithdrawn)}</div>
            </div>
          </div>
          <button
            onClick={() => setWithdrawOpen(true)}
            disabled={!wallet || balance <= 0}
            className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-100 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Levantar saldo
          </button>
        </div>
      </div>

      {/* Stats grid (admin) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox icon={ShoppingBag} label="Reservas" value={stats.reservations} color="brand" />
          <StatBox icon={Package} label="Concluídas" value={stats.completed} color="emerald" />
          <StatBox icon={Store} label="Farmácias" value={stats.pharmacies} color="blue" />
          <StatBox icon={Users} label="Clientes" value={stats.users ?? '—'} color="amber" />
        </div>
      )}

      {/* Transactions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900 dark:text-white">Histórico de transacções</h2>
          <span className="ml-auto text-xs text-slate-400">{transactions.length} {transactions.length === 1 ? 'movimento' : 'movimentos'}</span>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin text-brand-600 mx-auto" /></div>
        ) : transactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
            <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ainda sem movimentos. Os pagamentos das reservas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            <AnimatePresence initial={false}>
              {transactions.map((t) => <TxnRow key={t.id} txn={t} />)}
            </AnimatePresence>
          </div>
        )}
      </div>

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        wallet={wallet}
        onSuccess={fetch}
      />
    </div>
  )
}

function TxnRow({ txn }) {
  const cfg = TXN_CONFIG[txn.type] || TXN_CONFIG.payment_in
  const { Icon, color, sign } = cfg
  const date = new Date(txn.created_at).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{txn.description}</div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          <Clock className="w-3 h-3" /> {date}
          {txn.payment_method && (
            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase text-[10px] font-semibold tracking-wider">
              {txn.payment_method}
            </span>
          )}
        </div>
      </div>
      <div className={`text-sm font-bold shrink-0 ${sign === '+' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {sign}{formatMT(txn.amount)}
      </div>
    </motion.div>
  )
}

function StatBox({ icon: Icon, label, value, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  }
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-extrabold text-slate-900 dark:text-white">{value}</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}

function WithdrawModal({ open, onClose, wallet, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('mpesa')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (open) { setAmount(''); setProcessing(false) }
  }, [open])

  const submit = async (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      toast.error('Valor inválido')
      return
    }
    if (value > (wallet?.balance ?? 0)) {
      toast.error('Saldo insuficiente')
      return
    }
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 1200))
    const { error } = await supabase.rpc('withdraw_from_wallet', {
      p_wallet_id: wallet.id,
      p_amount: value,
      p_method: method,
    })
    setProcessing(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`${formatMT(value)} enviado para ${method === 'mpesa' ? 'M-Pesa' : 'e-Mola'}!`)
    onSuccess?.()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Levantar saldo">
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400">Saldo disponível</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatMT(wallet?.balance ?? 0)}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Valor a levantar</label>
          <div className="mt-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-brand-300 transition">
            <input
              type="number"
              required
              min="1"
              max={wallet?.balance ?? 0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="flex-1 py-3 px-2 bg-transparent outline-none text-lg font-bold text-slate-900 dark:text-slate-100"
            />
            <span className="text-sm font-bold text-slate-400">MT</span>
          </div>
          <div className="flex gap-1 mt-2">
            {[25, 50, 100].map((p) => {
              const val = Math.floor(((wallet?.balance ?? 0) * p) / 100)
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setAmount(String(val))}
                  className="flex-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {p}%
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setAmount(String(wallet?.balance ?? 0))}
              className="flex-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Tudo
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Levantar para</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { id: 'mpesa', label: 'M-Pesa', color: 'from-red-500 to-red-700', shortLabel: 'M' },
              { id: 'emola', label: 'e-Mola', color: 'from-orange-500 to-orange-700', shortLabel: 'e' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition ${
                  method === m.id
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white font-extrabold shadow-sm`}>
                  {m.shortLabel}
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={processing}>
            <X className="w-4 h-4" /> Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={processing}>
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A processar...</>
            ) : (
              <><Send className="w-4 h-4" /> Levantar</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
