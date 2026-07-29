import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getRemoteServiceById,
  type RemoteServiceListItem,
} from '../api/remoteServices'
import { durationMinutes, minutesToText } from '../api/personnelRemoteService'
import { ImageLightbox } from '../components/ImageLightbox'
import './RemoteServiceDetailPage.css'

export function RemoteServiceDetailPage() {
  const { remoteServiceId } = useParams<{ remoteServiceId: string }>()
  const { token } = useAuth()
  const [item, setItem] = useState<RemoteServiceListItem | null | undefined>(
    undefined,
  )
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<{
    src: string
    alt: string
  } | null>(null)

  useEffect(() => {
    if (!token || !remoteServiceId) return
    let cancelled = false
    setError(null)
    setItem(undefined)
    getRemoteServiceById(token, decodeURIComponent(remoteServiceId))
      .then((row) => {
        if (!cancelled) setItem(row)
      })
      .catch((e) => {
        if (!cancelled) {
          setItem(null)
          setError(e instanceof Error ? e.message : 'Kayıt yüklenemedi')
        }
      })
    return () => {
      cancelled = true
    }
  }, [token, remoteServiceId])

  const duration =
    item != null
      ? minutesToText(durationMinutes(item.startTime, item.endTime))
      : null

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide remote-detail-page">
        <Link className="remote-detail-back" to="/uzaktan-servisler">
          ← Uzaktan servislere dön
        </Link>

        {item === undefined && !error ? (
          <p className="remote-detail-loading">Detay yükleniyor…</p>
        ) : null}

        {error ? (
          <div className="remote-detail-error" role="alert">
            {error}
          </div>
        ) : null}

        {item === null && !error ? (
          <p className="remote-detail-empty">Kayıt bulunamadı.</p>
        ) : null}

        {item ? (
          <>
            <header className="remote-detail-head">
              <h1 className="remote-detail-title">
                {item.machineName || 'Uzaktan Servis'}
              </h1>
              <p className="remote-detail-subtitle">
                {item.date} · {item.startTime}-{item.endTime}
                {duration ? ` · Süre ${duration}` : ''}
              </p>
            </header>

            <section className="remote-detail-card">
              <h2 className="remote-detail-section-title">Bilgiler</h2>
              <dl className="remote-detail-dl">
                <div>
                  <dt>Müşteri</dt>
                  <dd>
                    {item.customerID ? (
                      <Link
                        className="remote-detail-link"
                        to={`/musteriler/${encodeURIComponent(item.customerID)}`}
                      >
                        {item.customerName || '—'}
                      </Link>
                    ) : (
                      item.customerName || '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Personel</dt>
                  <dd>{item.personnelName || '—'}</dd>
                </div>
                <div>
                  <dt>Makine</dt>
                  <dd>{item.machineName || '—'}</dd>
                </div>
                <div>
                  <dt>Tarih</dt>
                  <dd>{item.date || '—'}</dd>
                </div>
                <div>
                  <dt>Saat</dt>
                  <dd>
                    {item.startTime || '—'} – {item.endTime || '—'}
                  </dd>
                </div>
                <div>
                  <dt>Süre</dt>
                  <dd>{duration || '—'}</dd>
                </div>
              </dl>
            </section>

            <section className="remote-detail-card">
              <h2 className="remote-detail-section-title">Açıklama</h2>
              <p className="remote-detail-desc">
                {item.serviceDescription?.trim()
                  ? item.serviceDescription
                  : 'Açıklama girilmemiş.'}
              </p>
            </section>

            <section className="remote-detail-card">
              <h2 className="remote-detail-section-title">
                Fotoğraflar ({item.photoUrls.length})
              </h2>
              {item.photoUrls.length === 0 ? (
                <p className="remote-detail-empty">Fotoğraf yok.</p>
              ) : (
                <ul className="remote-detail-photos">
                  {item.photoUrls.map((url, index) => (
                    <li key={`${item.id}-photo-${index}`}>
                      <button
                        type="button"
                        className="remote-detail-photo-btn"
                        onClick={() =>
                          setImagePreview({
                            src: url,
                            alt: `Uzaktan servis fotoğrafı ${index + 1}`,
                          })
                        }
                      >
                        <img src={url} alt={`Fotoğraf ${index + 1}`} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
      <ImageLightbox
        src={imagePreview?.src ?? null}
        alt={imagePreview?.alt}
        onClose={() => setImagePreview(null)}
      />
    </div>
  )
}
