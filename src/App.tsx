import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedOutlet } from './components/ProtectedOutlet'
import { AppLayout } from './layout/AppLayout'
import { DashboardFrame } from './layout/DashboardFrame'
import { HeaderActionsProvider } from './layout/HeaderActionsContext'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ServiceDetailPage } from './pages/ServiceDetailPage'
import { ServicesPage } from './pages/ServicesPage'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <HeaderActionsProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route element={<ProtectedOutlet />}>
                <Route element={<DashboardFrame />}>
                  <Route index element={<HomePage />} />
                  <Route path="servisler" element={<ServicesPage />} />
                  <Route
                    path="servisler/:serviceId"
                    element={<ServiceDetailPage />}
                  />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HeaderActionsProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
