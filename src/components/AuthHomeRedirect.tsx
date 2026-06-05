import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { homePathForRole } from '../auth/roleRoutes'

/** Giriş yapmış kullanıcıyı rolüne göre ana sayfaya yönlendirir. */
export function AuthHomeRedirect() {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={homePathForRole(role)} replace />
}
