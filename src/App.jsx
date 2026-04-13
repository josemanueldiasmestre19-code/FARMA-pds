import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import MapPage from './pages/MapPage.jsx'
import PharmacyDetail from './pages/PharmacyDetail.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MyReservations from './pages/MyReservations.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ReservationsProvider } from './context/ReservationsContext.jsx'
import { DataProvider } from './context/DataContext.jsx'

// Wrapper para animar transições entre páginas
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/pesquisa" element={<PageWrapper><Search /></PageWrapper>} />
        <Route path="/mapa" element={<PageWrapper><MapPage /></PageWrapper>} />
        <Route path="/farmacia/:id" element={<PageWrapper><PharmacyDetail /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/registo" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/reservas" element={<PageWrapper><MyReservations /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ReservationsProvider>
          <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <AnimatedRoutes />
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            }}
          />
        </div>
        </ReservationsProvider>
      </DataProvider>
    </AuthProvider>
  )
}
