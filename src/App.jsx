import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import MapPage from './pages/MapPage.jsx'
import PharmacyDetail from './pages/PharmacyDetail.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pesquisa" element={<Search />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/farmacia/:id" element={<PharmacyDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
