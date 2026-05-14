import { Outlet } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'

export function AppLayout() {
  return (
    <div className="app-layout">
      <SiteHeader />
      <div className="app-layout-body">
        <Outlet />
      </div>
    </div>
  )
}
