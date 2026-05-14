import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActivePersonnel, type ActivePersonnelListItem } from '../api/personnel'
import { getInProgressServices, type ServiceListItem } from '../api/service'
import { formatServiceDate } from './ServiceStatusBadge'
import './HomeSummaryLists.css'

function personnelKey(p: { id?: string; _id?: string }, index: number): string {
  const raw = p.id ?? p._id
  return raw != null ? String(raw) : `p-${index}`
}

function serviceKey(s: ServiceListItem): string {
  return String(s.id)
}

type Props = {
  token: string
}

export function HomeSummaryLists({ token }: Props) {
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [personnel, setPersonnel] = useState<ActivePersonnelListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getInProgressServices(token).catch(() => [] as ServiceListItem[]),
      getActivePersonnel(token).catch(() => []),
    ])
      .then(([s, p]) => {
        if (!cancelled) {
          setServices(s)
          setPersonnel(p)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="home-summary">
      <div className="home-summary-grid">
        <section className="home-summary-card" aria-labelledby="home-sum-serv">
          <div className="home-summary-card-head">
            <h2 id="home-sum-serv" className="home-summary-title">
              Devam eden servisler
            </h2>
            <Link className="home-summary-link" to="/servisler?tab=active">
              Tümü →
            </Link>
          </div>
          {loading ? (
            <p className="home-summary-muted">Yükleniyor…</p>
          ) : services.length === 0 ? (
            <p className="home-summary-empty" role="status">
              Aktif servis yok.
            </p>
          ) : (
            <ul className="home-summary-list">
              {services.map((s) => (
                <li key={serviceKey(s)}>
                  <Link
                    className="home-summary-item"
                    to={`/servisler/${encodeURIComponent(serviceKey(s))}`}
                  >
                    <span className="home-summary-item-main">
                      <span className="home-summary-no">{s.serviceNumber}</span>
                      <span className="home-summary-machine">{s.machineName}</span>
                    </span>
                    {s.customer?.name ? (
                      <span className="home-summary-sub">{s.customer.name}</span>
                    ) : null}
                    <span className="home-summary-time">
                      {formatServiceDate(s.createdTime)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="home-summary-card"
          aria-labelledby="home-sum-per"
        >
          <div className="home-summary-card-head">
            <h2 id="home-sum-per" className="home-summary-title">
              Aktif personeller
            </h2>
          </div>
          {loading ? (
            <p className="home-summary-muted">Yükleniyor…</p>
          ) : personnel.length === 0 ? (
            <p className="home-summary-empty" role="status">
              Aktif personel yok.
            </p>
          ) : (
            <ul className="home-summary-list home-summary-list--plain">
              {personnel.map((p, i) => (
                <li key={personnelKey(p, i)}>
                  <div className="home-summary-person">
                    <span className="home-summary-person-name">{p.name}</span>
                    {p.userTc ? (
                      <span className="home-summary-person-tc">{p.userTc}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
