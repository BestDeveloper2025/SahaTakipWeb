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
import { MachinesPage } from './pages/MachinesPage'
import { PersonnelHomePage } from './pages/PersonnelHomePage'
import { PersonnelPage } from './pages/PersonnelPage'
import { PersonnelRemoteServiceDetailPage } from './pages/personnel/PersonnelRemoteServiceDetailPage'
import { PersonnelRemoteServicePage } from './pages/personnel/PersonnelRemoteServicePage'
import { PersonnelRemoteServicesPage } from './pages/personnel/PersonnelRemoteServicesPage'
import { RemoteServiceDetailPage } from './pages/RemoteServiceDetailPage'
import { RemoteServicesPage } from './pages/RemoteServicesPage'
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
                    <Route
                      path="uzaktan-servisler"
                      element={<RemoteServicesPage />}
                    />
                    <Route
                      path="uzaktan-servisler/:remoteServiceId"
                      element={<RemoteServiceDetailPage />}
                    />
                    <Route path="musteriler" element={<CustomersPage />} />
                    <Route
                      path="musteriler/:customerId"
                      element={<CustomerDetailPage />}
                    />
                    <Route path="personeller" element={<PersonnelPage />} />
                    <Route path="makineler" element={<MachinesPage />} />
                  </Route>
                </Route>
                <Route element={<RequirePersonnel />}>
                  <Route element={<PersonnelFrame />}>
                    <Route path="personel" element={<PersonnelHomePage />} />
                    <Route
                      path="personel/uzaktan-servis"
                      element={<PersonnelRemoteServicesPage />}
                    />
                    <Route
                      path="personel/uzaktan-servis/yeni"
                      element={<PersonnelRemoteServicePage />}
                    />
                    <Route
                      path="personel/uzaktan-servis/:remoteServiceId"
                      element={<PersonnelRemoteServiceDetailPage />}
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
