import { useLayoutEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useHeaderActions } from './HeaderActionsContext'
import './DashboardFrame.css'

export function DashboardFrame() {
  const { logout } = useAuth()
  const { setHeaderEnd } = useHeaderActions()
  const { pathname } = useLocation()
  const servisSection =
    pathname === '/servisler' || pathname.startsWith('/servisler/')

  useLayoutEffect(() => {
    setHeaderEnd(
      <button type="button" className="shell-logout" onClick={() => logout()}>
        Çıkış
      </button>,
    )
    return () => setHeaderEnd(null)
  }, [logout, setHeaderEnd])

  return (
    <>
      <nav className="app-subnav" aria-label="Panel menüsü">
        <NavLink className="app-subnav-link" to="/" end>
          Özet
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            [
              'app-subnav-link',
              isActive || servisSection ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')
          }
          to="/servisler"
          end
        >
          Servisler
        </NavLink>
      </nav>
      <Outlet />
    </>
  )
}
