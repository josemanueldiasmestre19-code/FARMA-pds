import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Pill, Menu, X, User, LogOut, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links = [
    { to: '/', label: 'Início' },
    { to: '/pesquisa', label: 'Pesquisar' },
    { to: '/mapa', label: 'Mapa' },
    { to: '/dashboard', label: 'Dashboard' },
  ]

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    toast.success('Sessão terminada')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 leading-tight">Farmácia <span className="text-brand-600">Agora</span></div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Maputo • Moçambique</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}

          {user ? (
            <div className="relative ml-2">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 transition"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">{user.name}</span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 animate-fade-in"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs text-slate-500">Sessão iniciada como</div>
                    <div className="text-sm font-semibold text-slate-800 truncate">{user.email}</div>
                  </div>
                  <Link to="/reservas" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <ShoppingBag className="w-4 h-4" /> Minhas reservas
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut className="w-4 h-4" /> Terminar sessão
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5">
                <User className="w-4 h-4" /> Entrar
              </Link>
              <Link
                to="/registo"
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/20 transition"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div className="border-t border-slate-100 pt-2 mt-2">
            {user ? (
              <>
                <div className="px-3 py-2 text-xs text-slate-500">Olá, <span className="font-semibold text-slate-800">{user.name}</span></div>
                <Link to="/reservas" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700">
                  Minhas reservas
                </Link>
                <button onClick={() => { handleLogout(); setOpen(false) }} className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600">
                  Terminar sessão
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700">Entrar</Link>
                <Link to="/registo" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-semibold text-brand-700">Criar conta</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
