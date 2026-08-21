import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  addCustomer,
  getAllCustomers,
  getUnbilledCustomers,
  updateCustomer,
  type CustomerListItem,
  type UnbilledCustomer,
} from '../api/customers'
import { COUNTRIES } from '../constants/countries'
import './CustomersPage.css'

export function CustomersPage() {
  const { token } = useAuth()
  const [list, setList] = useState<CustomerListItem[]>([])
  const [unbilled, setUnbilled] = useState<UnbilledCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCountry, setNewCountry] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setError(null)
    setLoading(true)
    // Liste asıl kaynak; unbilled başarısız olsa bile müşteriler görünsün
    Promise.all([
      getAllCustomers(token),
      getUnbilledCustomers(token).catch(() => [] as UnbilledCustomer[]),
    ])
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

  function openAddForm() {
    setShowAddForm(true)
    setNewName('')
    setNewCountry('')
    setAddError(null)
    setAddSuccess(null)
    setEditingId(null)
  }

  function closeAddForm() {
    setShowAddForm(false)
    setNewName('')
    setNewCountry('')
    setAddError(null)
  }

  function startEdit(customer: CustomerListItem) {
    setShowAddForm(false)
    setEditingId(customer.id)
    setEditName(customer.name)
    setEditCountry(customer.country ?? '')
    setEditError(null)
    setAddSuccess(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditCountry('')
    setEditError(null)
  }

  async function handleAddSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    const name = newName.trim()
    if (!name) {
      setAddError('Müşteri adı gerekli')
      return
    }
    if (!newCountry) {
      setAddError('Ülke seçimi gerekli')
      return
    }
    setSubmitting(true)
    setAddError(null)
    setAddSuccess(null)
    try {
      const customer = await addCustomer(token, name, newCountry)
      setList((prev) => {
        if (prev.some((c) => c.id === customer.id)) return prev
        return [...prev, customer].sort(
          (a, b) => a.orderNumber - b.orderNumber,
        )
      })
      setAddSuccess(`"${customer.name}" eklendi`)
      setNewName('')
      setNewCountry('')
      setShowAddForm(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Müşteri eklenemedi')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSubmit(e: FormEvent, customerId: string) {
    e.preventDefault()
    if (!token) return
    const name = editName.trim()
    if (!name) {
      setEditError('Müşteri adı gerekli')
      return
    }
    if (!editCountry) {
      setEditError('Ülke seçimi gerekli')
      return
    }
    setSubmitting(true)
    setEditError(null)
    try {
      const updated = await updateCustomer(token, customerId, name, editCountry)
      setList((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, ...updated } : c)),
      )
      setAddSuccess(`"${updated.name}" güncellendi`)
      cancelEdit()
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Müşteri güncellenemedi',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide customers-page">
        <header className="customers-intro">
          <div className="customers-intro-row">
            <div>
              <h1 className="customers-page-title">Müşteriler</h1>
              <p className="customers-hint">
                Bir müşteriye tıklayın; verilen normal ve uzaktan servisler ile
                harcanan toplam zamanın detayı açılır.
              </p>
            </div>
            <button
              type="button"
              className="customers-add-btn"
              onClick={openAddForm}
              disabled={loading}
            >
              Müşteri ekle
            </button>
          </div>
        </header>

        {showAddForm ? (
          <form className="customers-add-form" onSubmit={handleAddSubmit}>
            <label className="customers-add-label" htmlFor="customer-name">
              Müşteri adı
            </label>
            <input
              id="customer-name"
              className="customers-add-input customers-add-input--full"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Örn. ABC Şirketi"
              autoFocus
              disabled={submitting}
              maxLength={200}
            />
            <label className="customers-add-label" htmlFor="customer-country">
              Ülke
            </label>
            <select
              id="customer-country"
              className="customers-add-select"
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              disabled={submitting}
              required
            >
              <option value="">Ülke seçin</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <div className="customers-add-row">
              <button
                type="submit"
                className="customers-add-submit"
                disabled={submitting}
              >
                {submitting ? 'Ekleniyor…' : 'Kaydet'}
              </button>
              <button
                type="button"
                className="customers-add-cancel"
                onClick={closeAddForm}
                disabled={submitting}
              >
                İptal
              </button>
            </div>
            {addError ? (
              <p className="customers-add-error" role="alert">
                {addError}
              </p>
            ) : null}
          </form>
        ) : null}

        {addSuccess ? (
          <p className="customers-add-success" role="status">
            {addSuccess}
          </p>
        ) : null}

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
            const isEditing = editingId === c.id
            return (
              <li key={c.id} className="customers-card-wrap">
                {isEditing ? (
                  <form
                    className="customers-card customers-card--edit"
                    onSubmit={(e) => void handleEditSubmit(e, c.id)}
                  >
                    <label className="customers-add-label" htmlFor={`edit-name-${c.id}`}>
                      Müşteri adı
                    </label>
                    <input
                      id={`edit-name-${c.id}`}
                      className="customers-add-input customers-add-input--full"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={submitting}
                      autoFocus
                      maxLength={200}
                    />
                    <label
                      className="customers-add-label"
                      htmlFor={`edit-country-${c.id}`}
                    >
                      Ülke
                    </label>
                    <select
                      id={`edit-country-${c.id}`}
                      className="customers-add-select"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      disabled={submitting}
                      required
                    >
                      <option value="">Ülke seçin</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {editError ? (
                      <p className="customers-add-error" role="alert">
                        {editError}
                      </p>
                    ) : null}
                    <div className="customers-card-actions">
                      <button
                        type="button"
                        className="customers-card-btn customers-card-btn--ghost"
                        onClick={cancelEdit}
                        disabled={submitting}
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="customers-card-btn customers-card-btn--primary"
                        disabled={submitting}
                      >
                        {submitting ? 'Kaydediliyor…' : 'Kaydet'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="customers-card">
                    <div className="customers-card-top">
                      <span className="customers-card-name">{c.name}</span>
                      <span className="customers-card-no">#{c.orderNumber}</span>
                    </div>
                    <span className="customers-card-country">
                      {c.country?.trim() ? c.country : 'Ülke belirtilmemiş'}
                    </span>
                    {pending ? (
                      <span className="customers-card-unbilled">
                        Faturalandırılacak: {pending.unbilledText}
                      </span>
                    ) : null}
                    <div className="customers-card-actions">
                      <button
                        type="button"
                        className="customers-card-btn customers-card-btn--ghost"
                        onClick={() => startEdit(c)}
                        disabled={submitting}
                      >
                        Düzenle
                      </button>
                      <Link
                        className="customers-card-btn customers-card-btn--primary"
                        to={`/musteriler/${encodeURIComponent(c.id)}`}
                      >
                        Detayı aç
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
