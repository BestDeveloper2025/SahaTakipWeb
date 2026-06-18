import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AuthHomeRedirect } from './components/AuthHomeRedirect'
import { ProtectedOutlet } from './components/ProtectedOutlet'
import { RequireAdmin } from './components/RequireAdmin'
import { RequirePersonnel } from './components/RequirePersonnel'
import { AppLayout } from './layout/AppLayout'
import { DashboardFrame } from './layout/DashboardFrame'
import { PersonnelFrame } from './layout/PersonnelFrame'
import { HeaderActionsProvider } from './layout/HeaderActionsContext'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { CustomersPage } from './pages/CustomersPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PersonnelHomePage } from './pages/PersonnelHomePage'
import { PersonnelRemoteServicePage } from './pages/personnel/PersonnelRemoteServicePage'
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
                <Route element={<RequireAdmin />}>
                  <Route element={<DashboardFrame />}>
                    <Route index element={<HomePage />} />
                    <Route path="servisler" element={<ServicesPage />} />
                    <Route
                      path="servisler/:serviceId"
                      element={<ServiceDetailPage />}
                    />
                    <Route path="musteriler" element={<CustomersPage />} />
                    <Route
                      path="musteriler/:customerId"
                      element={<CustomerDetailPage />}
                    />
                  </Route>
                </Route>
                <Route element={<RequirePersonnel />}>
                  <Route element={<PersonnelFrame />}>
                    <Route path="personel" element={<PersonnelHomePage />} />
                    <Route
                      path="personel/uzaktan-servis"
                      element={<PersonnelRemoteServicePage />}
                    />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<AuthHomeRedirect />} />
            </Route>
          </Routes>
        </HeaderActionsProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
