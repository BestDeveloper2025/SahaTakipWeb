import { useHeaderActions } from '../layout/HeaderActionsContext'
import './SiteHeader.css'

const LOGO_SRC = '/fotograflar/best_logo.png'

export function SiteHeader() {
  const { headerEnd } = useHeaderActions()

  return (
    <header className="site-header">
      <img
        className="site-logo"
        src={LOGO_SRC}
        alt="Best Makina Sanayi ve Ticaret A.Ş."
        decoding="async"
      />
      <div className="site-header-end">{headerEnd}</div>
    </header>
  )
}
