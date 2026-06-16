import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getBillingHistory,
  getCustomerSummary,
  recordRemoteBilling,
  type CustomerSummary,
  type RemoteBillingRecord,
} from '../api/customers'
import { ServiceStatusBadge } from '../components/ServiceStatusBadge'
import './CustomerDetailPage.css'

export function CustomerDetailPage() {
  const { token } = useAuth()
  const { customerId } = useParams<{ customerId: string }>()
  const [summary, setSummary] = useState<CustomerSummary | null>(null)
  const [billingHistory, setBillingHistory] = useState<RemoteBillingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [recordingBilling, setRecordingBilling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!token || !customerId) return
    setError(null)
    setLoading(true)
    try {
      const [summaryData, history] = await Promise.all([
        getCustomerSummary(token, customerId),
        getBillingHistory(token, customerId),
      ])
      setSummary(summaryData)
      setBillingHistory(history)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Müşteri detayı yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [token, customerId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleRecordBilling() {
    if (!token || !customerId || !summary) return
    const unbilled = summary.remoteUsage.unbilledMinutes ?? 0
    if (unbilled <= 0) return

    const confirmed = window.confirm(
      `${summary.remoteUsage.unbilledText} süreyi faturalandırıldı olarak kaydetmek istiyor musunuz?`,
    )
    if (!confirmed) return

    setRecordingBilling(true)
    try {
      await recordRemoteBilling(token, customerId)
      await loadData()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Faturalandırma kaydedilemedi',
      )
    } finally {
      setRecordingBilling(false)
    }
  }

  const usage = summary?.remoteUsage

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide customer-detail-page">
        <Link className="customer-back" to="/musteriler">
          ← Müşteriler
        </Link>

        {loading ? <p className="customer-loading">Yükleniyor…</p> : null}
        {error ? (
          <div className="customer-error" role="alert">
            {error}
          </div>
        ) : null}

        {summary && usage ? (
          <>
            <header className="customer-head">
              <h1 className="customer-title">{summary.customerName}</h1>
              <span className="customer-order">#{summary.orderNumber}</span>
            </header>

            <section className="customer-cards">
              <div className="customer-card">
                <h2 className="customer-card-title">Harcanan Toplam Zaman</h2>
                <div className="customer-stat customer-stat--big">
                  {summary.totals.totalText}
                </div>
                <dl className="customer-breakdown">
                  <div>
                    <dt>Normal serviste</dt>
                    <dd>{summary.totals.normalServiceText}</dd>
                  </div>
                  <div>
                    <dt>Uzaktan serviste</dt>
                    <dd>{summary.totals.remoteServiceText}</dd>
                  </div>
                </dl>
              </div>

              <div
                className={`customer-card customer-card--quota${
                  usage.exceeded ? ' customer-card--exceeded' : ''
                }`}
              >
                <h2 className="customer-card-title">Uzaktan Servis Kotası</h2>
                <dl className="customer-breakdown">
                  <div>
                    <dt>Tanımlı kota</dt>
                    <dd>{usage.quotaHours} saat</dd>
                  </div>
                  <div>
                    <dt>Kullanılan</dt>
                    <dd>{usage.usedText}</dd>
                  </div>
                  {usage.exceeded ? (
                    <>
                      <div>
                        <dt>Kotayı aşan</dt>
                        <dd>{usage.excessText}</dd>
                      </div>
                      <div>
                        <dt>Faturalandırıldı</dt>
                        <dd>{usage.billedText}</dd>
                      </div>
                      <div>
                        <dt>Faturalandırılacak</dt>
                        <dd className="customer-unbilled">{usage.unbilledText}</dd>
                      </div>
                    </>
                  ) : null}
                </dl>
                {usage.exceeded ? (
                  usage.unbilledMinutes > 0 ? (
                    <>
                      <p className="customer-quota-note">
                        Kotayı aşan sürenin {usage.unbilledText} kadarı henüz
                        faturalandırılmadı.
                      </p>
                      <button
                        type="button"
                        className="customer-bill-btn"
                        onClick={() => void handleRecordBilling()}
                        disabled={recordingBilling}
                      >
                        {recordingBilling
                          ? 'Kaydediliyor…'
                          : `${usage.unbilledText} Faturalandır`}
                      </button>
                    </>
                  ) : (
                    <p className="customer-quota-note customer-quota-note--ok">
                      Tüm aşım süresi faturalandırıldı.
                    </p>
                  )
                ) : (
                  <p className="customer-quota-note">
                    Kalan: {minutesToText(usage.remainingMinutes)}
                  </p>
                )}
              </div>
            </section>

            {usage.exceeded ? (
              <section className="customer-section">
                <h2 className="customer-section-title">
                  Faturalandırma Geçmişi
                </h2>
                {billingHistory.length === 0 ? (
                  <p className="customer-empty">
                    Henüz faturalandırma kaydı yok.
                  </p>
                ) : (
                  <ul className="customer-list customer-list--billing">
                    {billingHistory.map((record) => (
                      <li key={record.id} className="customer-row">
                        <div className="customer-row-main">
                          <div className="customer-row-head">
                            <span className="customer-row-no">
                              {record.billedText}
                            </span>
                          </div>
                          <div className="customer-row-meta">
                            <span>{record.billedDate}</span>
                            {record.note ? <span>{record.note}</span> : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            <section className="customer-section">
              <h2 className="customer-section-title">
                Normal Servisler ({summary.normalServices.length})
                <span className="customer-section-total">
                  Toplam: {summary.totals.normalServiceText}
                </span>
              </h2>
              {summary.normalServices.length === 0 ? (
                <p className="customer-empty">
                  Bu müşteriye ait normal servis kaydı yok.
                </p>
              ) : (
                <ul className="customer-list">
                  {summary.normalServices.map((s) => (
                    <li key={s.id}>
                      <Link
                        className="customer-row customer-row--clickable"
                        to={`/servisler/${encodeURIComponent(s.id)}`}
                      >
                        <div className="customer-row-main">
                          <div className="customer-row-head">
                            <span className="customer-row-no">
                              No: {s.serviceNumber}
                            </span>
                            <ServiceStatusBadge status={s.status} />
                          </div>
                          <div className="customer-row-meta">
                            <span>{s.machineName || '—'}</span>
                            <span>{s.serviceType || '—'}</span>
                          </div>
                        </div>
                        <span className="customer-duration">{s.workedText}</span>
                        <span className="customer-row-cta">Detayı aç</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="customer-section">
              <h2 className="customer-section-title">
                Uzaktan Servisler ({summary.remoteServices.length})
                <span className="customer-section-total">
                  Toplam: {summary.totals.remoteServiceText}
                </span>
              </h2>
              {summary.remoteServices.length === 0 ? (
                <p className="customer-empty">
                  Bu müşteriye ait uzaktan servis kaydı yok.
                </p>
              ) : (
                <ul className="customer-list">
                  {summary.remoteServices.map((s) => (
                    <li key={s.id} className="customer-row">
                      <div className="customer-row-main">
                        <div className="customer-row-head">
                          <span className="customer-row-no">
                            {s.machineName || 'Uzaktan Servis'}
                          </span>
                        </div>
                        <div className="customer-row-meta">
                          <span>{s.personnelName}</span>
                          <span>
                            {s.date} {s.startTime}-{s.endTime}
                          </span>
                        </div>
                        {s.serviceDescription ? (
                          <p className="customer-row-desc">
                            {s.serviceDescription}
                          </p>
                        ) : null}
                      </div>
                      <span className="customer-duration">{s.durationText}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}

function minutesToText(totalMinutes: number): string {
  const safe = totalMinutes < 0 ? 0 : totalMinutes
  const hh = String(Math.floor(safe / 60)).padStart(2, '0')
  const mm = String(safe % 60).padStart(2, '0')
  return `${hh}:${mm}`
}
