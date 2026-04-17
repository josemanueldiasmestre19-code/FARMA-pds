import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { useI18n } from '../context/I18nContext.jsx'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold text-brand-600 dark:text-brand-400 mb-4">404</div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">{t('notfound_title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {t('notfound_desc')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button>
              <Home className="w-4 h-4" /> {t('notfound_home')}
            </Button>
          </Link>
          <Link to="/pesquisa">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4" /> {t('notfound_search')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
