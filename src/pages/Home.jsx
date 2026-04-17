import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, Shield, Clock, TrendingUp, Pill, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'

export default function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { pharmacies, medicines } = useData()
  const { t } = useI18n()

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/pesquisa?q=${encodeURIComponent(query)}`)
  }

  const stats = [
    { label: t('home_stat_partners'), value: pharmacies.length + '+', icon: MapPin },
    { label: t('home_stat_medicines'), value: medicines.length * 25 + '+', icon: Pill },
    { label: t('home_stat_time'), value: '< 2min', icon: Clock },
    { label: t('home_stat_satisfaction'), value: '98%', icon: TrendingUp },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
        <div className="absolute top-20 -right-20 w-96 h-96 bg-brand-200 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur border border-brand-200 rounded-full text-xs font-semibold text-brand-700 mb-6 shadow-sm">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                {t('home_badge')}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                {t('home_title_1')} <br />
                <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">
                  {t('home_title_2')}
                </span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                {t('home_subtitle')}
              </p>

              <form onSubmit={handleSearch} className="mt-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-brand-500/10 border border-slate-200 dark:border-slate-800 p-2 flex items-center max-w-xl">
                <div className="pl-4 pr-2 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder={t('home_search_placeholder')}
                  className="flex-1 py-3 px-2 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition flex items-center gap-2"
                >
                  {t('home_find')} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                {[t('home_free'), t('home_realtime'), t('home_no_signup')].map((label) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600" /> {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual card */}
            <div className="relative animate-fade-in">
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-brand-500/20 border border-slate-200 dark:border-slate-800 p-6 rotate-1 hover:rotate-0 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Paracetamol 500mg</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t('home_card_searched')}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    {t('common_available')}
                  </span>
                </div>
                <div className="space-y-3">
                  {pharmacies.slice(0, 3).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {(1.2 + i * 0.8).toFixed(1)} km
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">85 {t('unit_mt')}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">{t('home_card_in_stock')}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/pesquisa" className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400">
                  {t('home_card_see_all')} →
                </Link>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 border border-slate-200 dark:border-slate-800 hidden sm:block">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-600" />
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('home_card_verified')}</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('home_realtime')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-4">
              <div className="inline-flex w-12 h-12 rounded-xl bg-brand-50 items-center justify-center mb-2">
                <s.icon className="w-5 h-5 text-brand-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">{t('home_how_title')}</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{t('home_how_subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Search, title: t('home_step1_title'), text: t('home_step1_text') },
            { icon: MapPin, title: t('home_step2_title'), text: t('home_step2_text') },
            { icon: CheckCircle2, title: t('home_step3_title'), text: t('home_step3_text') },
          ].map((step) => (
            <div key={step.title} className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 hover:border-brand-400 hover:shadow-xl transition group">
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
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 p-10 md:p-14 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative">
            <h3 className="text-3xl md:text-4xl font-extrabold">{t('home_cta_title')}</h3>
            <p className="mt-3 text-brand-50 max-w-xl">
              {t('home_cta_text')}
            </p>
            <Link
              to="/mapa"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 shadow-lg transition"
            >
              {t('home_cta_button')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
