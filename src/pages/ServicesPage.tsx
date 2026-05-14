import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getAllServices,
  getInProgressServices,
  type ServiceListItem,
} from '../api/service'
import { ServiceStatusBadge, formatServiceDate, serviceListKey } from '../components/ServiceStatusBadge'
import './ServicesPage.css'

export function ServicesPage() {
  const { token } = useAuth()
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab: 'all' | 'active' | 'completed' =
    tabParam === 'active'
      ? 'active'
      : tabParam === 'completed'
        ? 'completed'
        : 'all'

  const [list, setList] = useState<ServiceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const countLabel = useMemo(() => {
    if (tab === 'active') return `${list.length} devam eden`
    if (tab === 'completed') return `${list.length} tamamlanan`
    return `${list.length} kayıt`
  }, [list.length, tab])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setError(null)
    setLoading(true)

    const load = () => {
      if (tab === 'active') return getInProgressServices(token)
      if (tab === 'completed') {
        return getAllServices(token).then((rows) =>
          rows.filter((s) => s.status === 'COMPLETED'),
        )
      }
      return getAllServices(token)
    }

    load()
      .then((data) => {
        if (!cancelled) setList(data)
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
  }, [token, tab])

  function setTab(next: 'all' | 'active' | 'completed') {
    if (next === 'all') setParams({})
    else setParams({ tab: next })
  }

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 360)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide services-page" id="servisler-ust">
        <header className="services-intro">
          <h1 className="services-page-title">Servis kayıtları</h1>
          <ol className="services-hint" aria-label="Nasıl kullanılır">
            <li>Üstten filtre seçin (tümü / devam eden / tamamlanan).</li>
            <li>Aşağıdaki karttan bir servise dokunun veya tıklayın; detay sayfası açılır.</li>
          </ol>
        </header>

        <div className="services-toolbar">
          <div className="services-tabs" role="tablist" aria-label="Liste filtresi">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'all'}
              className={`services-tab${tab === 'all' ? ' services-tab--on' : ''}`}
              onClick={() => setTab('all')}
            >
              Tümü
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'active'}
              className={`services-tab${tab === 'active' ? ' services-tab--on' : ''}`}
              onClick={() => setTab('active')}
            >
              Devam eden
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'completed'}
              className={`services-tab${tab === 'completed' ? ' services-tab--on' : ''}`}
              onClick={() => setTab('completed')}
            >
              Tamamlanan
            </button>
          </div>
          <p className="services-count" aria-live="polite">
            {loading ? 'Liste yükleniyor…' : countLabel}
          </p>
        </div>

        {error ? (
          <div className="services-error" role="alert">
            {error}
          </div>
        ) : null}

        <section
          className="services-list-section"
          aria-labelledby="services-list-heading"
          id="servis-listesi"
        >
          <h2 id="services-list-heading" className="services-section-title">
            Servis listesi
          </h2>

          {!loading && !error && list.length === 0 ? (
            <p className="services-empty">
              {tab === 'active'
                ? 'Bu filtrede gösterilecek devam eden servis yok.'
                : tab === 'completed'
                  ? 'Tamamlanan servis kaydı yok.'
                  : 'Henüz servis kaydı yok.'}
            </p>
          ) : null}

          <ul className="services-grid">
            {list.map((s) => {
              const id = serviceListKey(s)
              return (
                <li key={id}>
                  <Link className="services-card" to={`/servisler/${encodeURIComponent(id)}`}>
                    <div className="services-card-top">
                      <span className="services-card-no">{s.serviceNumber}</span>
                      <ServiceStatusBadge status={s.status} />
                    </div>
                    <dl className="services-card-dl">
                      <div className="services-card-row">
                        <dt>Makine</dt>
                        <dd>{s.machineName || '—'}</dd>
                      </div>
                      <div className="services-card-row">
                        <dt>Servis türü</dt>
                        <dd>{s.serviceType || '—'}</dd>
                      </div>
                      {s.customer?.name ? (
                        <div className="services-card-row">
                          <dt>Müşteri</dt>
                          <dd>{s.customer.name}</dd>
                        </div>
                      ) : null}
                      <div className="services-card-row services-card-row--problem">
                        <dt>Açıklama</dt>
                        <dd title={s.problemDescription}>
                          {s.problemDescription || '—'}
                        </dd>
                      </div>
                      <div className="services-card-row services-card-row--meta">
                        <dt>Oluşturulma</dt>
                        <dd>{formatServiceDate(s.createdTime)}</dd>
                      </div>
                    </dl>
                    <span className="services-card-cta">Detayı aç</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {showScrollTop ? (
          <button
            type="button"
            className="services-scroll-top"
            onClick={scrollToTop}
            aria-label="Sayfanın başına dön"
          >
            ↑ Yukarı
          </button>
        ) : null}
      </main>
    </div>
  )
}
