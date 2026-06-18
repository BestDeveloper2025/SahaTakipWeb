import { useLayoutEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useHeaderActions } from './HeaderActionsContext'
import './DashboardFrame.css'
import './PersonnelFrame.css'

export function PersonnelFrame() {
  const { logout } = useAuth()
  const { setHeaderEnd } = useHeaderActions()
  const { pathname } = useLocation()
  const remoteSection = pathname.startsWith('/personel/uzaktan-servis')

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
      <nav className="app-subnav" aria-label="Personel menüsü">
        <NavLink className="app-subnav-link" to="/personel" end>
          Ana Sayfa
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            ['app-subnav-link', isActive || remoteSection ? 'active' : '']
              .filter(Boolean)
              .join(' ')
          }
          to="/personel/uzaktan-servis"
          end
        >
          Uzaktan Servis
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
