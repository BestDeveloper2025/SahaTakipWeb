import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getAllRemoteServices,
  type RemoteServiceListItem,
} from '../api/remoteServices'
import './RemoteServicesPage.css'

function matchesQuery(item: RemoteServiceListItem, q: string): boolean {
  if (!q) return true
  const haystack = [
    item.machineName,
    item.customerName,
    item.personnelName,
    item.serviceDescription,
    item.startTime,
    item.endTime,
    item.date,
  ]
    .join(' ')
    .toLocaleLowerCase('tr')
  return haystack.includes(q)
}

export function RemoteServicesPage() {
  const { token } = useAuth()
  const [list, setList] = useState<RemoteServiceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setError(null)
    setLoading(true)
    getAllRemoteServices(token)
      .then((rows) => {
        if (!cancelled) setList(rows)
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Liste yüklenemedi')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    return list.filter((item) => matchesQuery(item, q))
  }, [list, query])

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide remote-services-page">
        <header className="remote-intro">
          <h1 className="remote-page-title">Uzaktan Servisler</h1>
          <p className="remote-hint">
            Personelin kaydettiği tüm uzaktan servisler. Bir kayda tıklayarak
            açıklama ve fotoğrafları detayda görün.
          </p>
        </header>

        <div className="remote-toolbar">
          <label className="remote-search-label" htmlFor="remote-search">
            Ara
          </label>
          <input
            id="remote-search"
            className="remote-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Müşteri, personel, makine, açıklama…"
            disabled={loading}
          />
          <p className="remote-count" aria-live="polite">
            {loading
              ? 'Liste yükleniyor…'
              : query.trim()
                ? `${filtered.length} / ${list.length} kayıt`
                : `${list.length} kayıt`}
          </p>
        </div>

        {error ? (
          <div className="remote-error" role="alert">
            {error}
          </div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <p className="remote-empty">
            {list.length === 0
              ? 'Henüz uzaktan servis kaydı yok.'
              : 'Aramanızla eşleşen kayıt bulunamadı.'}
          </p>
        ) : null}

        <ul className="remote-grid">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                className="remote-card"
                to={`/uzaktan-servisler/${encodeURIComponent(s.id)}`}
              >
                <div className="remote-card-top">
                  <span className="remote-card-machine">
                    {s.machineName || 'Uzaktan Servis'}
                  </span>
                  <span className="remote-card-time">
                    {s.date} · {s.startTime}-{s.endTime}
                  </span>
                </div>
                <dl className="remote-card-dl">
                  <div className="remote-card-row">
                    <dt>Müşteri</dt>
                    <dd>{s.customerName || '—'}</dd>
                  </div>
                  <div className="remote-card-row">
                    <dt>Personel</dt>
                    <dd>{s.personnelName || '—'}</dd>
                  </div>
                  {s.serviceDescription ? (
                    <div className="remote-card-row remote-card-row--desc">
                      <dt>Açıklama</dt>
                      <dd title={s.serviceDescription}>
                        {s.serviceDescription}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="remote-card-footer">
                  {s.photoUrls.length > 0 ? (
                    <span className="remote-card-photos-count">
                      {s.photoUrls.length} fotoğraf
                    </span>
                  ) : (
                    <span className="remote-card-photos-count remote-card-photos-count--none">
                      Fotoğraf yok
                    </span>
                  )}
                  <span className="remote-card-cta">Detayı aç</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
