import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

// Último recurso: um erro de render não pode deixar o ecrã em branco durante a demo.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Algo correu mal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Ocorreu um erro inesperado nesta página. Os seus dados estão seguros.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Recarregar
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <Home className="w-4 h-4" /> Página inicial
            </a>
          </div>
          {import.meta.env.DEV && (
            <pre className="mt-6 text-left text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 overflow-auto max-h-40">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
