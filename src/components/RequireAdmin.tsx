import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PERSONNEL_HOME } from '../auth/roleRoutes'

export function RequireAdmin() {
  const { isAdmin } = useAuth()
  const location = useLocation()

  if (!isAdmin) {
    return <Navigate to={PERSONNEL_HOME} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
