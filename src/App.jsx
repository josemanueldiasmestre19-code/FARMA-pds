import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import MapPage from './pages/MapPage.jsx'
import PharmacyDetail from './pages/PharmacyDetail.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MyReservations from './pages/MyReservations.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ReservationsProvider } from './context/ReservationsContext.jsx'
import { DataProvider, useData } from './context/DataContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { I18nProvider } from './context/I18nContext.jsx'

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
        <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/registo" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/reservas" element={<ProtectedRoute><PageWrapper><MyReservations /></PageWrapper></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><PageWrapper><Admin /></PageWrapper></AdminRoute>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

function AppContent() {
  const { loading: authLoading } = useAuth()
  const { loading: dataLoading } = useData()

  if (authLoading || dataLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <AnimatedRoutes />
      </main>
      <Footer />
      <InstallPrompt />
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
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <DataProvider>
            <ReservationsProvider>
              <AppContent />
            </ReservationsProvider>
          </DataProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
