import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getAllCustomers,
  getUnbilledCustomers,
  type CustomerListItem,
  type UnbilledCustomer,
} from '../api/customers'
import './CustomersPage.css'

export function CustomersPage() {
  const { token } = useAuth()
  const [list, setList] = useState<CustomerListItem[]>([])
  const [unbilled, setUnbilled] = useState<UnbilledCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setError(null)
    setLoading(true)
    Promise.all([getAllCustomers(token), getUnbilledCustomers(token)])
      .then(([customers, unbilledCustomers]) => {
        if (!cancelled) {
          setList(customers)
          setUnbilled(unbilledCustomers)
        }
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

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide customers-page">
        <header className="customers-intro">
          <h1 className="customers-page-title">Müşteriler</h1>
          <p className="customers-hint">
            Bir müşteriye tıklayın; verilen normal ve uzaktan servisler ile
            harcanan toplam zamanın detayı açılır.
          </p>
        </header>

        {!loading && unbilled.length > 0 ? (
          <section className="customers-unbilled">
            <h2 className="customers-unbilled-title">
              Faturalandırılacak Aşım Süresi ({unbilled.length})
            </h2>
            <ul className="customers-unbilled-list">
              {unbilled.map((c) => (
                <li key={c.customerId}>
                  <Link
                    className="customers-unbilled-row"
                    to={`/musteriler/${encodeURIComponent(c.customerId)}`}
                  >
                    <span className="customers-unbilled-name">{c.customerName}</span>
                    <span className="customers-unbilled-amount">
                      {c.unbilledText}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="customers-count" aria-live="polite">
          {loading ? 'Liste yükleniyor…' : `${list.length} müşteri`}
        </p>

        {error ? (
          <div className="customers-error" role="alert">
            {error}
          </div>
        ) : null}

        {!loading && !error && list.length === 0 ? (
          <p className="customers-empty">Henüz müşteri kaydı yok.</p>
        ) : null}

        <ul className="customers-grid">
          {list.map((c) => {
            const pending = unbilled.find((u) => u.customerId === c.id)
            return (
              <li key={c.id}>
                <Link
                  className="customers-card"
                  to={`/musteriler/${encodeURIComponent(c.id)}`}
                >
                  <div className="customers-card-top">
                    <span className="customers-card-name">{c.name}</span>
                    <span className="customers-card-no">#{c.orderNumber}</span>
                  </div>
                  {pending ? (
                    <span className="customers-card-unbilled">
                      Faturalandırılacak: {pending.unbilledText}
                    </span>
                  ) : null}
                  <span className="customers-card-cta">Detayı aç</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
