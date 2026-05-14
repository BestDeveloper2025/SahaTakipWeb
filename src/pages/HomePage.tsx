import { useAuth } from '../auth/AuthContext'
import { HomeSummaryLists } from '../components/HomeSummaryLists'
import { PersonnelMap } from '../components/PersonnelMap'

export function HomePage() {
  const { token } = useAuth()

  return (
    <div className="shell">
      {token ? (
        <div className="shell-map-section">
          <PersonnelMap token={token} />
          <HomeSummaryLists token={token} />
        </div>
      ) : null}
    </div>
  )
}
