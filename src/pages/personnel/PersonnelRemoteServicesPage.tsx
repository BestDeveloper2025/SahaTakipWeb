import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import {
  getAllRemoteServices,
  type RemoteServiceListItem,
} from '../../api/remoteServices'
import './PersonnelRemoteServicesPage.css'

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

export function PersonnelRemoteServicesPage() {
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
    <main className="personnel-remote-list shell-main shell-main--wide">
      <Link className="personnel-remote-list-back" to="/personel">
        ← Ana sayfa
      </Link>

      <header className="personnel-remote-list-head">
        <div className="personnel-remote-list-head-row">
          <div>
            <h1 className="personnel-remote-list-title">Uzaktan Servisler</h1>
            <p className="personnel-remote-list-hint">
              Geçmiş uzaktan servis kayıtları. Bir kayda tıklayarak müşteri,
              personel ve yapılan işlemlerin detayını görün.
            </p>
          </div>
          <Link
            className="personnel-remote-list-add"
            to="/personel/uzaktan-servis/yeni"
          >
            + Yeni Servis
          </Link>
        </div>
      </header>

      <div className="personnel-remote-list-toolbar">
        <label className="personnel-remote-list-search-label" htmlFor="personnel-remote-search">
          Ara
        </label>
        <input
          id="personnel-remote-search"
          className="personnel-remote-list-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Müşteri, personel, makine, açıklama…"
          disabled={loading}
        />
        <p className="personnel-remote-list-count" aria-live="polite">
          {loading
            ? 'Liste yükleniyor…'
            : query.trim()
              ? `${filtered.length} / ${list.length} kayıt`
              : `${list.length} kayıt`}
        </p>
      </div>

      {error ? (
        <div className="personnel-remote-list-error" role="alert">
          {error}
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="personnel-remote-list-empty">
          {list.length === 0
            ? 'Henüz uzaktan servis kaydı yok.'
            : 'Aramanızla eşleşen kayıt bulunamadı.'}
        </p>
      ) : null}

      <ul className="personnel-remote-list-grid">
        {filtered.map((s) => (
          <li key={s.id}>
            <Link
              className="personnel-remote-list-card"
              to={`/personel/uzaktan-servis/${encodeURIComponent(s.id)}`}
            >
              <div className="personnel-remote-list-card-top">
                <span className="personnel-remote-list-card-machine">
                  {s.machineName || 'Uzaktan Servis'}
                </span>
                <span className="personnel-remote-list-card-time">
                  {s.date} · {s.startTime}-{s.endTime}
                </span>
              </div>
              <dl className="personnel-remote-list-card-dl">
                <div className="personnel-remote-list-card-row">
                  <dt>Müşteri</dt>
                  <dd>{s.customerName || '—'}</dd>
                </div>
                <div className="personnel-remote-list-card-row">
                  <dt>Personel</dt>
                  <dd>{s.personnelName || '—'}</dd>
                </div>
                {s.serviceDescription ? (
                  <div className="personnel-remote-list-card-row personnel-remote-list-card-row--desc">
                    <dt>Açıklama</dt>
                    <dd title={s.serviceDescription}>{s.serviceDescription}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="personnel-remote-list-card-footer">
                {s.photoUrls.length > 0 ? (
                  <span className="personnel-remote-list-card-photos">
                    {s.photoUrls.length} fotoğraf
                  </span>
                ) : (
                  <span className="personnel-remote-list-card-photos personnel-remote-list-card-photos--none">
                    Fotoğraf yok
                  </span>
                )}
                <span className="personnel-remote-list-card-cta">Detayı aç</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
