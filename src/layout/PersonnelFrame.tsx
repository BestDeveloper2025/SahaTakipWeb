import { useLayoutEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useHeaderActions } from './HeaderActionsContext'
import './PersonnelFrame.css'

export function PersonnelFrame() {
  const { logout } = useAuth()
  const { setHeaderEnd } = useHeaderActions()

  useLayoutEffect(() => {
    setHeaderEnd(
      <button type="button" className="shell-logout" onClick={() => logout()}>
        Çıkış
      </button>,
    )
    return () => setHeaderEnd(null)
  }, [logout, setHeaderEnd])

  return (
    <div className="personnel-shell">
      <Outlet />
    </div>
  )
}
