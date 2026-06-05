import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ADMIN_HOME } from '../auth/roleRoutes'

export function RequirePersonnel() {
  const { isPersonnel } = useAuth()
  const location = useLocation()

  if (!isPersonnel) {
    return <Navigate to={ADMIN_HOME} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
