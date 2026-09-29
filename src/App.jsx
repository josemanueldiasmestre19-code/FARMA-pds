import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { WifiOff, RefreshCw } from 'lucide-react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Button from './components/ui/Button.jsx'
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
import PharmacyRegistration from './pages/PharmacyRegistration.jsx'
import PharmacyReservations from './pages/PharmacyReservations.jsx'
import PharmacyWallet from './pages/PharmacyWallet.jsx'
import AdminWallet from './pages/AdminWallet.jsx'
import ReservationCheck from './pages/ReservationCheck.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import PharmacyStaffRoute from './components/PharmacyStaffRoute.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ReservationsProvider } from './context/ReservationsContext.jsx'
import { DataProvider, useData } from './context/DataContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { I18nProvider } from './context/I18nContext.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'

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
        <Route path="/reserva/:id" element={<PageWrapper><ReservationCheck /></PageWrapper>} />
        <Route path="/dashboard" element={<PharmacyStaffRoute><PageWrapper><Dashboard /></PageWrapper></PharmacyStaffRoute>} />
        <Route path="/dashboard/reservas" element={<PharmacyStaffRoute><PageWrapper><PharmacyReservations /></PageWrapper></PharmacyStaffRoute>} />
        <Route path="/dashboard/carteira" element={<PharmacyStaffRoute><PageWrapper><PharmacyWallet /></PageWrapper></PharmacyStaffRoute>} />
        <Route path="/admin/financas" element={<AdminRoute><PageWrapper><AdminWallet /></PageWrapper></AdminRoute>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/registo" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/reservas" element={<ProtectedRoute><PageWrapper><MyReservations /></PageWrapper></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><PageWrapper><Admin /></PageWrapper></AdminRoute>} />
        <Route path="/registar-farmacia" element={<ProtectedRoute><PageWrapper><PharmacyRegistration /></PageWrapper></ProtectedRoute>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

function DataError({ message, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-4">
          <WifiOff className="w-8 h-8 text-rose-600" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Não foi possível carregar</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{message}</p>
        <Button className="mt-6" onClick={onRetry}><RefreshCw className="w-4 h-4" /> Tentar novamente</Button>
      </div>
    </div>
  )
}

function AppContent() {
  const { loading: authLoading } = useAuth()
  const { loading: dataLoading, error: dataError, refetch, pharmacies } = useData()

  if (authLoading || (dataLoading && pharmacies.length === 0)) return <LoadingScreen />
  if (dataError && pharmacies.length === 0) return <DataError message={dataError} onRetry={refetch} />

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <AnimatedRoutes />
        </ErrorBoundary>
      </main>
      <Footer />
      <InstallPrompt />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '12px', background: '#0f172a', color: '#fff', fontSize: '14px', fontWeight: 500 },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' }, duration: 5000 },
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <DataProvider>
              <ReservationsProvider>
                <NotificationsProvider>
                  <AppContent />
                </NotificationsProvider>
              </ReservationsProvider>
            </DataProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
