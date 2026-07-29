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
  const musteriSection =
    pathname === '/musteriler' || pathname.startsWith('/musteriler/')
  const personelSection =
    pathname === '/personeller' || pathname.startsWith('/personeller/')
  const uzaktanSection =
    pathname === '/uzaktan-servisler' ||
    pathname.startsWith('/uzaktan-servisler/')

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
        <NavLink
          className={({ isActive }) =>
            ['app-subnav-link', isActive || uzaktanSection ? 'active' : '']
              .filter(Boolean)
              .join(' ')
          }
          to="/uzaktan-servisler"
          end
        >
          Uzaktan Servisler
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            ['app-subnav-link', isActive || musteriSection ? 'active' : '']
              .filter(Boolean)
              .join(' ')
          }
          to="/musteriler"
          end
        >
          Müşteriler
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            ['app-subnav-link', isActive || personelSection ? 'active' : '']
              .filter(Boolean)
              .join(' ')
          }
          to="/personeller"
          end
        >
          Personeller
        </NavLink>
      </nav>
      <Outlet />
    </>
  )
}
