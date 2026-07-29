import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  createPersonnel,
  getAllPersonnel,
  type PersonnelListItem,
} from '../api/personnel'
import './PersonnelPage.css'

function isValidTc(value: string): boolean {
  return /^\d{11}$/.test(value)
}

export function PersonnelPage() {
  const { token } = useAuth()
  const [list, setList] = useState<PersonnelListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [userTc, setUserTc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setError(null)
    setLoading(true)
    getAllPersonnel(token)
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

  async function refreshList() {
    if (!token) return
    const rows = await getAllPersonnel(token)
    setList(rows)
  }

  function openAddForm() {
    setShowAddForm(true)
    setName('')
    setUserTc('')
    setAddError(null)
    setAddSuccess(null)
  }

  function closeAddForm() {
    setShowAddForm(false)
    setName('')
    setUserTc('')
    setAddError(null)
  }

  async function handleAddSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    const trimmedName = name.trim()
    const tc = userTc.trim()
    if (!trimmedName) {
      setAddError('İsim gerekli')
      return
    }
    if (!isValidTc(tc)) {
      setAddError('TC Kimlik No 11 haneli rakam olmalı')
      return
    }
    setSubmitting(true)
    setAddError(null)
    setAddSuccess(null)
    try {
      await createPersonnel(token, { name: trimmedName, userTc: tc })
      setAddSuccess(`"${trimmedName}" eklendi`)
      setShowAddForm(false)
      setName('')
      setUserTc('')
      await refreshList()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Personel eklenemedi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide personnel-page">
        <header className="personnel-intro">
          <div className="personnel-intro-row">
            <div>
              <h1 className="personnel-page-title">Personeller</h1>
              <p className="personnel-hint">
                Tüm personelleri görüntüleyin. Yeni personel eklerken isim ve TC
                yeterlidir; varsayılan giriş şifresi 123456’dır.
              </p>
            </div>
            <button
              type="button"
              className="personnel-add-btn"
              onClick={openAddForm}
              disabled={loading}
            >
              Personel ekle
            </button>
          </div>
        </header>

        {showAddForm ? (
          <form className="personnel-add-form" onSubmit={handleAddSubmit}>
            <div className="personnel-add-fields">
              <div className="personnel-add-field">
                <label className="personnel-add-label" htmlFor="personnel-name">
                  İsim
                </label>
                <input
                  id="personnel-name"
                  className="personnel-add-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn. Ahmet Yılmaz"
                  autoFocus
                  disabled={submitting}
                  maxLength={120}
                />
              </div>
              <div className="personnel-add-field">
                <label className="personnel-add-label" htmlFor="personnel-tc">
                  TC Kimlik No
                </label>
                <input
                  id="personnel-tc"
                  className="personnel-add-input"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{11}"
                  value={userTc}
                  onChange={(e) =>
                    setUserTc(e.target.value.replace(/\D/g, '').slice(0, 11))
                  }
                  placeholder="11 haneli TC"
                  disabled={submitting}
                  maxLength={11}
                />
              </div>
            </div>
            <div className="personnel-add-actions">
              <button
                type="submit"
                className="personnel-add-submit"
                disabled={submitting}
              >
                {submitting ? 'Ekleniyor…' : 'Kaydet'}
              </button>
              <button
                type="button"
                className="personnel-add-cancel"
                onClick={closeAddForm}
                disabled={submitting}
              >
                İptal
              </button>
            </div>
            {addError ? (
              <p className="personnel-add-error" role="alert">
                {addError}
              </p>
            ) : null}
          </form>
        ) : null}

        {addSuccess ? (
          <p className="personnel-add-success" role="status">
            {addSuccess}
          </p>
        ) : null}

        <p className="personnel-count" aria-live="polite">
          {loading ? 'Liste yükleniyor…' : `${list.length} personel`}
        </p>

        {error ? (
          <div className="personnel-error" role="alert">
            {error}
          </div>
        ) : null}

        {!loading && !error && list.length === 0 ? (
          <p className="personnel-empty">Henüz personel kaydı yok.</p>
        ) : null}

        <ul className="personnel-grid">
          {list.map((p) => (
            <li key={p.id}>
              <article className="personnel-card">
                <div className="personnel-card-top">
                  <span className="personnel-card-name">{p.name}</span>
                  <span
                    className={
                      p.isActive
                        ? 'personnel-card-badge personnel-card-badge--active'
                        : 'personnel-card-badge'
                    }
                  >
                    {p.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <dl className="personnel-card-meta">
                  <div>
                    <dt>TC</dt>
                    <dd>{p.userTc || '—'}</dd>
                  </div>
                </dl>
              </article>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
