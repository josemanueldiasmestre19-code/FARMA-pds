import { Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import WalletView from '../components/WalletView.jsx'
import usePageTitle from '../hooks/usePageTitle.js'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'

export default function PharmacyWallet() {
  const { pharmacyId, isAdmin } = useAuth()
  usePageTitle('Minha carteira')

  // Admin sem farmácia atribuída → mensagem
  if (isAdmin && pharmacyId == null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Conta de administrador</h1>
        <p className="text-sm text-slate-500 mt-2">A carteira da plataforma está na área de finanças.</p>
        <Link to="/admin/financas" className="inline-block mt-5"><Button>Ver finanças</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 font-semibold">Financeiro</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Minha Carteira</h1>
        </div>
      </div>

      <WalletView kind="pharmacy" pharmacyId={pharmacyId} />
    </div>
  )
}
