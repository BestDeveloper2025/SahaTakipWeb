import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getEducationContentsByServiceId,
  getServiceById,
  getServiceEducationTypes,
  getServiceReportUrl,
  type EducationContentGroup,
  type EducationTypeRef,
  type ServiceDetail,
} from '../api/service'
import {
  getServiceAllExpenses,
  getServiceDailyLogs,
  getServiceDeliveryDetails,
  getServiceWorkReport,
  type ServiceDailyLogItem,
  type ServiceDeliveryDetails,
  type ServiceExpensesResponse,
  type ServiceWorkReport,
} from '../api/serviceDetailData'
import {
  ServiceStatusBadge,
  formatServiceDate,
} from '../components/ServiceStatusBadge'
import { ImageLightbox } from '../components/ImageLightbox'
import './ServiceDetailPage.css'

function normalizeLogDateKey(log: ServiceDailyLogItem): string {
  if (log.date && String(log.date).trim()) return String(log.date).trim()
  if (log.startTime) {
    const part = log.startTime.split(' ')[0]
    if (part) return part
  }
  return '—'
}

function formatLogDayHeading(key: string): string {
  if (key === '—') return 'Tarih belirtilmemiş'
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const [y, m, d] = key.split('-')
    return `${d}.${m}.${y}`
  }
  return key
}

function formatLogEnd(endTime: string | null | undefined): string {
  if (endTime == null) return 'Devam ediyor'
  const t = String(endTime).trim()
  if (!t) return 'Devam ediyor'
  return t
}

function groupAndSortLogs(
  logs: ServiceDailyLogItem[],
): [string, ServiceDailyLogItem[]][] {
  const sorted = [...logs].sort((a, b) => {
    const da = normalizeLogDateKey(a).localeCompare(normalizeLogDateKey(b))
    if (da !== 0) return da
    return (a.startTime ?? '').localeCompare(b.startTime ?? '')
  })
  const map = new Map<string, ServiceDailyLogItem[]>()
  for (const log of sorted) {
    const k = normalizeLogDateKey(log)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(log)
  }
  return Array.from(map.entries())
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency === 'TRY' ? 'TRY' : currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

/**
 * API'den gelen "Saat:Dakika" sürelerini (örn. 20:24) okunur Türkçe metne çevirir.
 */
function formatDurationHhMmTurkish(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '—'
  const s = String(value).trim()
  const m = /^(\d+):(\d{2})$/.exec(s)
  if (!m) return s
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (!Number.isFinite(h) || !Number.isFinite(min)) return s
  if (min >= 60) return s
  const parts: string[] = []
  if (h > 0) parts.push(`${h} saat`)
  if (min > 0) parts.push(`${min} dk`)
  if (parts.length === 0) return '0 dk'
  return parts.join(' ')
}

export function ServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [service, setService] = useState<ServiceDetail | null | undefined>(
    undefined,
  )
  const [educationTypes, setEducationTypes] = useState<EducationTypeRef[]>([])
  const [educationContents, setEducationContents] = useState<
    EducationContentGroup[]
  >([])
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [dailyLogs, setDailyLogs] = useState<ServiceDailyLogItem[]>([])
  const [workReport, setWorkReport] = useState<ServiceWorkReport | null>(null)
  const [expensesData, setExpensesData] =
    useState<ServiceExpensesResponse | null>(null)
  const [delivery, setDelivery] = useState<ServiceDeliveryDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<{
    src: string
    alt: string
  } | null>(null)

  const closeImagePreview = useCallback(() => setImagePreview(null), [])

  const id = serviceId ? decodeURIComponent(serviceId) : ''

  useEffect(() => {
    if (!token || !id) return
    let cancelled = false

    setError(null)
    setLoading(true)
    setService(undefined)
    setEducationTypes([])
    setEducationContents([])
    setReportUrl(null)
    setDailyLogs([])
    setWorkReport(null)
    setExpensesData(null)
    setDelivery(null)

    ;(async () => {
      try {
        const svc = await getServiceById(token, id)
        if (cancelled) return
        if (!svc) {
          setService(null)
          return
        }
        setService(svc)

        const [
          types,
          contents,
          report,
          logs,
          mesai,
          masraflar,
          teslim,
        ] = await Promise.all([
          getServiceEducationTypes(token, id).catch(() => [] as EducationTypeRef[]),
          getEducationContentsByServiceId(token, id).catch(
            () => [] as EducationContentGroup[],
          ),
          getServiceReportUrl(token, id),
          getServiceDailyLogs(token, id),
          getServiceWorkReport(token, id),
          getServiceAllExpenses(token, id),
          getServiceDeliveryDetails(token, id),
        ])

        if (cancelled) return
        setEducationTypes(types)
        setEducationContents(contents)
        setReportUrl(report)
        setDailyLogs(logs)
        setWorkReport(mesai)
        setExpensesData(masraflar)
        setDelivery(teslim)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Servis yüklenemedi')
          setService(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, id])

  const logGroups = useMemo(() => groupAndSortLogs(dailyLogs), [dailyLogs])

  if (!id) {
    return (
      <div className="shell">
        <main className="shell-main shell-main--wide">
          <p className="detail-error">Geçersiz servis bağlantısı.</p>
          <Link className="detail-back-link" to="/servisler">
            Servis listesine dön
          </Link>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="shell">
        <main className="shell-main shell-main--wide service-detail service-detail--loading">
          <div className="detail-loading-screen" role="status" aria-live="polite">
            <div className="detail-loading-spinner" aria-hidden />
            <p className="detail-loading-title">Servis yükleniyor</p>
            <p className="detail-loading-sub">
              Kayıt, günlükler, mesai, masraflar ve rapor bilgileri alınıyor…
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (error || service === null || service === undefined) {
    return (
      <div className="shell">
        <main className="shell-main shell-main--wide service-detail">
          {error ? (
            <div className="detail-error" role="alert">
              {error}
            </div>
          ) : (
            <p className="detail-error">Servis bulunamadı.</p>
          )}
          <button
            type="button"
            className="detail-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Geri
          </button>
          <Link className="detail-back-link" to="/servisler">
            Tüm servislere git
          </Link>
        </main>
      </div>
    )
  }

  const pdfUrl =
    (delivery?.reportUrl && delivery.reportUrl.trim()) || reportUrl || null

  /** Sayfa içinde bölüm atlaması (mobil dostu): id = section-{key} */
  const navItems = [
    { key: 'overview', label: 'Özet' },
    ...(service.detectedFault ||
    (service.isUnderWarranty !== null && service.isUnderWarranty !== undefined) ||
    service.warrantyNote
      ? [{ key: 'extras', label: 'Ek bilgiler' }]
      : []),
    { key: 'team', label: 'Personel' },
    { key: 'daily', label: 'Günlükler' },
    { key: 'work', label: 'Mesai' },
    { key: 'expenses', label: 'Masraf' },
    { key: 'delivery', label: 'Teslim / PDF' },
    ...(educationTypes.length > 0 || educationContents.length > 0
      ? [{ key: 'education', label: 'Eğitim' }]
      : []),
  ] as const

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide service-detail">
        <div className="detail-page-head">
          <nav className="detail-breadcrumb" aria-label="Sayfa yolu">
            <Link to="/servisler">Servisler</Link>
            <span aria-hidden> / </span>
            <span className="detail-breadcrumb-current">
              {service.serviceNumber}
            </span>
          </nav>

          <button
            type="button"
            className="detail-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Geri
          </button>
        </div>

        <nav
          className="detail-quick-nav"
          aria-label="Sayfa içi bölümler"
        >
          {navItems.map((item) => (
            <a
              key={item.key}
              href={`#section-${item.key}`}
              className="detail-quick-nav-link"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <section
          id="section-overview"
          className="detail-section detail-card detail-card--general-head"
          aria-labelledby="genel-bilgiler-heading"
        >
          <h2 id="genel-bilgiler-heading" className="detail-general-title">
            Genel bilgiler
          </h2>
          <p className="detail-section-lead">
            Servis özeti ve müşteri bilgisi. Aşağıdaki bağlantılarla doğrudan
            günlük kayıtlarına veya teslim bilgisine gidebilirsiniz.
          </p>
          <div className="detail-general-head-row">
            <div>
              <p className="detail-general-label">Servis numarası</p>
              <p className="detail-general-number">{service.serviceNumber}</p>
            </div>
            <ServiceStatusBadge status={service.status} />
          </div>
          <dl className="detail-dl detail-dl--general">
            <div>
              <dt>Servis türü</dt>
              <dd className="detail-general-emph">{service.serviceType}</dd>
            </div>
            <div>
              <dt>Makine</dt>
              <dd className="detail-general-emph">{service.machineName}</dd>
            </div>
            <div>
              <dt>Oluşturulma</dt>
              <dd className="detail-general-emph">
                {formatServiceDate(service.createdTime)}
              </dd>
            </div>
            <div className="detail-dl-full">
              <dt>Servis açıklaması</dt>
              <dd className="detail-general-emph">
                {service.problemDescription || '—'}
              </dd>
            </div>
          </dl>
          <div className="detail-general-customer">
            <h3 className="detail-general-subtitle">Müşteri</h3>
            {service.customer?.name ? (
              <dl className="detail-dl detail-dl--general">
                <div>
                  <dt>Ünvan</dt>
                  <dd className="detail-general-emph">{service.customer.name}</dd>
                </div>
                {service.customer.orderNumber != null ? (
                  <div>
                    <dt>Sipariş no</dt>
                    <dd className="detail-general-emph">
                      {service.customer.orderNumber}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="detail-muted">Müşteri kaydı yok.</p>
            )}
          </div>
        </section>

        {service.detectedFault ||
        (service.isUnderWarranty !== null &&
          service.isUnderWarranty !== undefined) ||
        service.warrantyNote ? (
          <section
            id="section-extras"
            className="detail-section detail-card detail-card--muted"
          >
            <h2 className="detail-h2">Ek bilgiler</h2>
            <p className="detail-section-lead detail-section-lead--tight">
              Arıza tespiti, garanti durumu ve notlar mobil / ofis süreçlerinden
              gelir.
            </p>
            <dl className="detail-dl">
              {service.detectedFault ? (
                <div className="detail-dl-full">
                  <dt>Tespit edilen arıza</dt>
                  <dd>{service.detectedFault}</dd>
                </div>
              ) : null}
              {(service.isUnderWarranty !== null &&
                service.isUnderWarranty !== undefined) ||
              service.warrantyNote ? (
                <div className="detail-dl-full">
                  <dt>Garanti</dt>
                  <dd>
                    {service.isUnderWarranty === null ||
                    service.isUnderWarranty === undefined
                      ? '—'
                      : service.isUnderWarranty
                        ? 'Garanti kapsamında'
                        : 'Garanti dışı'}
                    {service.warrantyNote ? (
                      <>
                        <br />
                        <span className="detail-muted">
                          {service.warrantyNote}
                        </span>
                      </>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        <section
          id="section-team"
          className="detail-section detail-card detail-card--group"
          aria-labelledby="staff-heading"
        >
          <div className="detail-section-stack">
            <h2 id="staff-heading" className="detail-h2">
              Bu serviste çalışanlar
            </h2>
            <p className="detail-section-lead detail-section-lead--tight">
              Sahada atanmış personel ve şu an bu servisle ilişkilendirilme
              durumu.
            </p>
          </div>
          {service.assignedPersonnel?.length ? (
            <ul className="detail-personnel">
              {service.assignedPersonnel.map((p) => (
                <li key={String(p.id)}>
                  <span className="detail-personnel-name">{p.name}</span>
                  <span className="detail-personnel-tc">
                    TC: <span className="detail-monospace">{p.userTc}</span>
                  </span>
                  {p.isActive ? (
                    <span className="detail-personnel-badge">Aktif</span>
                  ) : (
                    <span className="detail-personnel-badge detail-personnel-badge--off">
                      Pasif
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-muted">Henüz bu servise personel atanmamış.</p>
          )}
        </section>

        <section
          id="section-daily"
          className="detail-section detail-bundle"
          aria-labelledby="daily-heading"
        >
          <div className="detail-bundle-header">
            <h2 id="daily-heading" className="detail-bundle-title">
              Saha günlükleri
            </h2>
            <p className="detail-bundle-desc">
              Personelin günlük olarak işe giriş / çıkış saatleri, notları ve saha
              fotoğrafları burada listelenir. Her satır sahada oluşturulmuş kayıttır.
            </p>
          </div>
          <div className="detail-card detail-bundle-card">
          {dailyLogs.length === 0 ? (
            <p className="detail-muted">Bu servise ait günlük kaydı yok.</p>
          ) : (
            <div className="detail-log-timeline">
              {logGroups.map(([dayKey, items]) => (
                <div key={dayKey} className="detail-log-day">
                  <h3 className="detail-log-day-title">
                    {formatLogDayHeading(dayKey)}
                  </h3>
                  <ul className="detail-log-list">
                    {items.map((log, idx) => (
                      <li
                        key={`${log.personnelID}-${log.startTime}-${idx}`}
                        className="detail-log-item"
                      >
                        <div className="detail-log-item-head">
                          <span className="detail-log-person">
                            {log.personnelName ?? 'Personel'}
                          </span>
                          <span className="detail-log-time">
                            {log.startTime ?? '—'}
                            {' → '}
                            {formatLogEnd(log.endTime)}
                          </span>
                        </div>
                        {log.note && log.note.trim() ? (
                          <p className="detail-log-note">{log.note}</p>
                        ) : null}
                        {log.photoUrls && log.photoUrls.length > 0 ? (
                          <div className="detail-log-photos">
                            {log.photoUrls.map((url, pi) => (
                              <button
                                key={`${url}-${pi}`}
                                type="button"
                                className="detail-log-photo-thumb"
                                onClick={() =>
                                  setImagePreview({
                                    src: url,
                                    alt: 'Günlük işlem fotoğrafı',
                                  })
                                }
                                aria-label="Fotoğrafı büyüt"
                              >
                                <img
                                  src={url}
                                  alt=""
                                  loading="lazy"
                                  draggable={false}
                                />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          </div>
        </section>

        <section
          id="section-work"
          className="detail-section detail-bundle"
          aria-labelledby="work-heading"
        >
          <div className="detail-bundle-header">
            <h2 id="work-heading" className="detail-bundle-title">
              Mesai özeti
            </h2>
            <p className="detail-bundle-desc">
              Aşağıdaki tablo, günlük kayıtlarındaki giriş-çıkışlara göre
              otomatik hesaplanmış çalışma süresidir (kişi ve güne göre).
            </p>
          </div>
          <div className="detail-card detail-bundle-card">
          {!workReport || workReport.people.length === 0 ? (
            <p className="detail-muted">
              Hesap için yeterli günlük kaydı yok ya da süreler henüz
              çıkarılamadı.
            </p>
          ) : (
            <div className="detail-work-wrap">
              {workReport.people.map((person) => (
                <div key={person.personnelID} className="detail-work-person">
                  <div className="detail-work-person-head">
                    <strong>{person.personnelName}</strong>
                    <span className="detail-work-total">
                      Toplam: {formatDurationHhMmTurkish(person.totalText)}
                    </span>
                  </div>
                  <div className="detail-work-table-wrap">
                    <table className="detail-work-table">
                      <caption className="detail-visually-hidden">
                        {person.personnelName} günlük mesai satırları
                      </caption>
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th>Giriş</th>
                          <th>Çıkış</th>
                          <th>Çalışma</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {person.days.map((d) => (
                          <tr key={`${person.personnelID}-${d.date}-${d.start}`}>
                            <td>{d.date}</td>
                            <td>{d.start}</td>
                            <td>{d.end ?? '—'}</td>
                            <td>
                              {d.workedText != null && d.workedText !== ''
                                ? formatDurationHhMmTurkish(d.workedText)
                                : d.status === 'IN_PROGRESS'
                                  ? 'Devam ediyor'
                                  : '—'}
                            </td>
                            <td>
                              {d.status === 'COMPLETED'
                                ? 'Tamamlandı'
                                : 'Devam ediyor'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </section>

        <section
          id="section-expenses"
          className="detail-section detail-card"
          aria-labelledby="expense-heading"
        >
          <h2 id="expense-heading" className="detail-h2">
            Masraflar
          </h2>
          <p className="detail-section-lead detail-section-lead--tight">
            Personelin girdiği harcamalar ve para birimine göre toplamlar.
          </p>
          {!expensesData || expensesData.expenses.length === 0 ? (
            <p className="detail-muted">Kayıtlı masraf yok.</p>
          ) : (
            <>
              <div
                className="detail-expense-totals"
                role="status"
                aria-label="Masraf toplamları"
              >
                {expensesData.totals.TRY > 0 ? (
                  <span className="detail-expense-total-pill">
                    TRY: {formatMoney(expensesData.totals.TRY, 'TRY')}
                  </span>
                ) : null}
                {expensesData.totals.USD > 0 ? (
                  <span className="detail-expense-total-pill">
                    USD: {formatMoney(expensesData.totals.USD, 'USD')}
                  </span>
                ) : null}
                {expensesData.totals.EUR > 0 ? (
                  <span className="detail-expense-total-pill">
                    EUR: {formatMoney(expensesData.totals.EUR, 'EUR')}
                  </span>
                ) : null}
              </div>
              <ul className="detail-expense-list">
                {expensesData.expenses.map((ex) => (
                  <li key={ex.id} className="detail-expense-row">
                    <div className="detail-expense-main">
                      <span className="detail-expense-amount">
                        {formatMoney(ex.amount, ex.currency)}
                      </span>
                      <span className="detail-expense-desc">{ex.description}</span>
                    </div>
                    <div className="detail-expense-meta">
                      <span>{ex.personnelName || 'Personel'}</span>
                      {ex.photoUrl ? (
                        <button
                          type="button"
                          className="detail-expense-photo"
                          onClick={() =>
                            setImagePreview({
                              src: ex.photoUrl!,
                              alt: 'Masraf fişi veya fotoğraf',
                            })
                          }
                        >
                          Fiş / fotoğraf
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section
          id="section-delivery"
          className="detail-section detail-card detail-card--highlight"
          aria-labelledby="delivery-heading"
        >
          <h2 id="delivery-heading" className="detail-h2">
            Teslim ve PDF rapor
          </h2>
          <p className="detail-section-lead detail-section-lead--tight">
            Servis tamamlandığında mobil uygulamadan girilen teslim bilgisi ve
            sistemde üretilen servis raporu (PDF) burada yer alır.
          </p>
          {delivery ? (
            <dl className="detail-dl detail-delivery-dl">
              <div>
                <dt>Teslim tarihi</dt>
                <dd>{delivery.date ?? '—'}</dd>
              </div>
              <div>
                <dt>Teslim eden personel</dt>
                <dd>{delivery.personnelName ?? '—'}</dd>
              </div>
              <div className="detail-dl-full">
                <dt>Teslim notu</dt>
                <dd>{delivery.note?.trim() ? delivery.note : '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="detail-muted">
              Teslim henüz mobil uygulamada tamamlanmamış veya kayıt oluşmamış
              olabilir.
            </p>
          )}
          {pdfUrl ? (
            <div className="detail-delivery-report">
              <p className="detail-muted">
                PDF&apos;yi indirmek veya görüntülemek için düğmeye basın (yeni
                sekme).
              </p>
              <a
                className="detail-report-btn"
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Servis raporunu aç (PDF)
              </a>
            </div>
          ) : (
            <p className="detail-muted detail-delivery-nopdf">
              Henüz bir PDF rapor adresi yok; rapor oluşturulduğunda burada
              görünür.
            </p>
          )}
        </section>

        {(educationTypes.length > 0 || educationContents.length > 0) ? (
          <div
            id="section-education"
            className="detail-education-anchor detail-section"
          >
            {educationTypes.length > 0 ? (
              <section className="detail-section detail-card detail-card--muted">
                <h2 className="detail-h2">Atanan eğitim türleri</h2>
                <p className="detail-section-lead detail-section-lead--tight">
                  Bu servise bağlı eğitim başlıkları.
                </p>
                <ul className="detail-tags">
                  {educationTypes.map((t) => (
                    <li key={String(t.id)}>{t.name}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {educationContents.length > 0 ? (
              <section
                className={`detail-section detail-card detail-card--muted${educationTypes.length > 0 ? ' detail-card--edu-follow' : ''}`}
                aria-labelledby="edu-check-heading"
              >
                <h2 id="edu-check-heading" className="detail-h2">
                  Eğitim kontrol listesi
                </h2>
                <p className="detail-section-lead detail-section-lead--tight">
                  Türüne göre gruplanmış eğitim maddeleri.
                </p>
                <div className="detail-edu-groups">
                  {educationContents.map((g) => (
                    <div key={g.typeId} className="detail-edu-group">
                      <h3 className="detail-h3">{g.typeName}</h3>
                      <ul className="detail-edu-items">
                        {g.items?.map((item, i) => (
                          <li key={`${g.typeId}-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        <Link className="detail-all-link" to="/servisler">
          ← Servis listesine dön
        </Link>
      </main>
      <ImageLightbox
        src={imagePreview?.src ?? null}
        alt={imagePreview?.alt}
        onClose={closeImagePreview}
      />
    </div>
  )
}
