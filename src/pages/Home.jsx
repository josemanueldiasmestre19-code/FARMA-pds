import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, Shield, Clock, TrendingUp, Pill, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { pharmacies, medicines } from '../data/mockData.js'

export default function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/pesquisa?q=${encodeURIComponent(query)}`)
  }

  const stats = [
    { label: 'Farmácias parceiras', value: pharmacies.length + '+', icon: MapPin },
    { label: 'Medicamentos', value: medicines.length * 25 + '+', icon: Pill },
    { label: 'Tempo médio', value: '< 2min', icon: Clock },
    { label: 'Satisfação', value: '98%', icon: TrendingUp },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-emerald-50" />
        <div className="absolute top-20 -right-20 w-96 h-96 bg-brand-200 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur border border-brand-200 rounded-full text-xs font-semibold text-brand-700 mb-6 shadow-sm">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                Disponível agora em Maputo
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.05] tracking-tight">
                O seu medicamento, <br />
                <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">
                  a um clique de distância.
                </span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
                Verifique em tempo real quais farmácias de Maputo têm o medicamento que
                precisa — antes de sair de casa. Poupe tempo, poupe deslocações.
              </p>

              <form onSubmit={handleSearch} className="mt-8 bg-white rounded-2xl shadow-xl shadow-brand-500/10 border border-slate-200 p-2 flex items-center max-w-xl">
                <div className="pl-4 pr-2 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Ex: Paracetamol, Amoxicilina..."
                  className="flex-1 py-3 px-2 bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition flex items-center gap-2"
                >
                  Encontrar <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                {['Gratuito', 'Tempo real', 'Sem registo'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600" /> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual card */}
            <div className="relative animate-fade-in">
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-brand-500/20 border border-slate-200 p-6 rotate-1 hover:rotate-0 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Paracetamol 500mg</div>
                      <div className="text-xs text-slate-500">Pesquisado agora</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    Disponível
                  </span>
                </div>
                <div className="space-y-3">
                  {pharmacies.slice(0, 3).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {(1.2 + i * 0.8).toFixed(1)} km
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">85 MT</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Em stock</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/pesquisa" className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:text-brand-800">
                  Ver todos os resultados →
                </Link>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-200 hidden sm:block">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-600" />
                  <div>
                    <div className="text-xs text-slate-500">Verificado</div>
                    <div className="text-sm font-bold text-slate-800">Tempo real</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-4">
              <div className="inline-flex w-12 h-12 rounded-xl bg-brand-50 items-center justify-center mb-2">
                <s.icon className="w-5 h-5 text-brand-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Como funciona</h2>
          <p className="mt-3 text-slate-600">Três passos simples para encontrar o seu medicamento</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Search, title: '1. Pesquise', text: 'Digite o nome do medicamento que precisa.' },
            { icon: MapPin, title: '2. Descubra', text: 'Veja farmácias próximas com stock disponível.' },
            { icon: CheckCircle2, title: '3. Reserve', text: 'Reserve e levante. Sem filas, sem stress.' },
          ].map((step) => (
            <div key={step.title} className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-brand-400 hover:shadow-xl transition group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-5 group-hover:scale-110 transition">
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 p-10 md:p-14 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative">
            <h3 className="text-3xl md:text-4xl font-extrabold">Pronto para começar?</h3>
            <p className="mt-3 text-brand-50 max-w-xl">
              Explore o mapa interactivo e descubra todas as farmácias parceiras em Maputo.
            </p>
            <Link
              to="/mapa"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 shadow-lg transition"
            >
              Ver mapa interactivo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
