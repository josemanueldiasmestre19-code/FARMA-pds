import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, Shield, Clock, Pill, ArrowRight, CheckCircle2, Store, Building2, QrCode, Smartphone } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatMT } from '../lib/format.js'
import usePageTitle from '../hooks/usePageTitle.js'

// Extrai o bairro da morada: "Av. X, 123, Polana, Maputo" → "Polana"
function neighbourhoodOf(address) {
  const parts = String(address || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 3) return parts[parts.length - 2]
  return parts[parts.length - 1] || null
}

export default function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { pharmacies, medicines } = useData()
  const { isPharmacyStaff } = useAuth()
  const { t } = useI18n()
  usePageTitle(null)

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/pesquisa?q=${encodeURIComponent(query.trim())}`)
  }

  // Números reais, vindos da BD
  const stats = useMemo(() => {
    const neighbourhoods = new Set(pharmacies.map((p) => neighbourhoodOf(p.address)).filter(Boolean))
    const open24h = pharmacies.filter((p) => /24/.test(p.hours || '')).length
    return [
      { label: t('home_stat_partners'), value: pharmacies.length, icon: Store },
      { label: t('home_stat_medicines'), value: medicines.length, icon: Pill },
      { label: 'Bairros cobertos', value: neighbourhoods.size, icon: MapPin },
      { label: 'Abertas 24h', value: open24h, icon: Clock },
    ]
  }, [pharmacies, medicines, t])

  // Cartão do hero: um medicamento comum e as farmácias que o têm, ordenadas por preço
  const heroSample = useMemo(() => {
    const med = medicines.find((m) => /paracetamol 500/i.test(m.name)) || medicines[0]
    if (!med) return null
    const available = pharmacies.filter((p) => p.stock[med.id]?.available).slice(0, 3)
    return { med, pharmacies: available }
  }, [medicines, pharmacies])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
        <div className="absolute top-20 -right-20 w-96 h-96 bg-brand-200 dark:bg-brand-900/30 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-emerald-200 dark:bg-emerald-900/30 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20 sm:pt-16 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="animate-slide-up min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-brand-200 dark:border-brand-800 rounded-full text-xs font-semibold text-brand-700 dark:text-brand-300 mb-6 shadow-sm">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                {t('home_badge')}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.08] tracking-tight [text-wrap:balance]">
                {t('home_title_1')}{' '}
                <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">
                  {t('home_title_2')}
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                {t('home_subtitle')}
              </p>

              <form onSubmit={handleSearch} role="search" className="mt-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-brand-500/10 border border-slate-200 dark:border-slate-800 p-2 flex items-center gap-1 max-w-xl">
                <div className="pl-3 sm:pl-4 pr-1 text-slate-400 shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  aria-label={t('search_title')}
                  placeholder={t('home_search_placeholder')}
                  className="flex-1 min-w-0 py-3 px-1 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="shrink-0 px-4 sm:px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition flex items-center gap-2"
                >
                  <span className="hidden sm:inline">{t('home_find')}</span> <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                {[t('home_free'), t('home_realtime'), t('home_no_signup')].map((label) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600" /> {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual card — dados reais */}
            {heroSample && (
              <div className="relative animate-fade-in hidden sm:block">
                <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-brand-500/20 border border-slate-200 dark:border-slate-800 p-6 lg:rotate-1 lg:hover:rotate-0 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{heroSample.med.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('home_card_searched')}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full shrink-0">
                      {heroSample.pharmacies.length} {t('common_available').toLowerCase()}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {heroSample.pharmacies.map((p) => (
                      <Link key={p.id} to={`/farmacia/${p.id}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-brand-50 dark:hover:bg-slate-700 transition">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" /> {neighbourhoodOf(p.address)} · {p.hours}
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-3">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{formatMT(heroSample.med.price)}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">{p.stock[heroSample.med.id].qty} {t('home_card_in_stock').toLowerCase()}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link to={`/pesquisa?q=${encodeURIComponent(heroSample.med.name.split(' ')[0])}`} className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400">
                    {t('home_card_see_all')} →
                  </Link>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-600" />
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('home_card_verified')}</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('home_realtime')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats — reais */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-3 sm:p-4">
              <div className="inline-flex w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 items-center justify-center mb-2">
                <s.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{t('home_how_title')}</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{t('home_how_subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: Search, title: t('home_step1_title'), text: t('home_step1_text') },
            { icon: Smartphone, title: '2. Reserve e pague', text: 'Pague com M-Pesa ou e-Mola. A unidade fica guardada para si por 24h.' },
            { icon: QrCode, title: '3. Levante com o QR', text: 'Apresente o QR no balcão. Sem filas, sem deslocações em vão.' },
          ].map((step) => (
            <div key={step.title} className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 hover:border-brand-400 hover:shadow-xl transition group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-5 group-hover:scale-110 transition">
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 p-8 sm:p-10 md:p-14 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative">
            <h3 className="text-3xl md:text-4xl font-extrabold">{t('home_cta_title')}</h3>
            <p className="mt-3 text-brand-50 max-w-xl">{t('home_cta_text')}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link to="/pesquisa" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 shadow-lg transition">
                <Search className="w-4 h-4" /> Pesquisar medicamento
              </Link>
              <Link to="/mapa" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/15 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/25 transition">
                {t('home_cta_button')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pharmacy CTA */}
      {!isPharmacyStaff && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">É proprietário de uma farmácia?</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                Registe a sua farmácia na Vonamed e alcance mais clientes em Maputo. Gestão de stock em tempo real, reservas pagas antecipadamente e visibilidade no mapa.
              </p>
            </div>
            <Link
              to="/registar-farmacia"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl hover:scale-105 transition shadow-md shrink-0"
            >
              Registar farmácia <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
