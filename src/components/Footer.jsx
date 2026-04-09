import { Pill, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-white text-lg">Farmácia Agora</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            A plataforma digital que liga os moçambicanos aos medicamentos disponíveis nas
            farmácias de Maputo, em tempo real.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Plataforma</h4>
          <ul className="space-y-2 text-sm">
            <li>Pesquisa de medicamentos</li>
            <li>Mapa de farmácias</li>
            <li>Reservas online</li>
            <li>Dashboard para farmácias</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contacto</h4>
          <ul className="space-y-2 text-sm">
            <li>Maputo, Moçambique</li>
            <li>contacto@farmaciaagora.mz</li>
            <li>+258 84 000 0000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        Feito com <Heart className="inline w-3 h-3 text-brand-500" /> em Maputo — Projecto Académico © 2026
      </div>
    </footer>
  )
}
