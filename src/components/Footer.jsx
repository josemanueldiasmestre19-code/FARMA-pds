import { Link } from 'react-router-dom'
import { Pill, Heart, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 mt-16 border-t border-slate-800 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-white text-lg">Vonamed</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            A plataforma digital que liga os moçambicanos aos medicamentos disponíveis nas
            farmácias de Maputo, em tempo real.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Plataforma</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/pesquisa" className="hover:text-white transition">Pesquisa de medicamentos</Link></li>
            <li><Link to="/mapa" className="hover:text-white transition">Mapa de farmácias</Link></li>
            <li><Link to="/reservas" className="hover:text-white transition">Reservas online</Link></li>
            <li><Link to="/dashboard" className="hover:text-white transition">Dashboard para farmácias</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Conta</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white transition">Iniciar sessão</Link></li>
            <li><Link to="/registo" className="hover:text-white transition">Criar conta</Link></li>
            <li><Link to="/reservas" className="hover:text-white transition">Minhas reservas</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contacto</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>Maputo, Moçambique</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>contacto@vonamed.mz</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>+258 84 000 0000</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        Feito com <Heart className="inline w-3 h-3 text-brand-500" /> em Maputo — Projecto Académico © 2026
      </div>
    </footer>
  )
}
