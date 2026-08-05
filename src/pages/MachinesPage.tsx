import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  addMachine,
  filterMachinesByQuery,
  getAllMachines,
  type MachineListItem,
} from '../api/machines'
import './MachinesPage.css'

export function MachinesPage() {
  const { token } = useAuth()
  const [list, setList] = useState<MachineListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setError(null)
    setLoading(true)
    getAllMachines(token)
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

  const filtered = useMemo(
    () => filterMachinesByQuery(list, query),
    [list, query],
  )

  function openAddForm() {
    setShowAddForm(true)
    setNewName('')
    setAddError(null)
    setAddSuccess(null)
  }

  function closeAddForm() {
    setShowAddForm(false)
    setNewName('')
    setAddError(null)
  }

  async function handleAddSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    const name = newName.trim()
    if (!name) {
      setAddError('Makina adı gerekli')
      return
    }
    setSubmitting(true)
    setAddError(null)
    setAddSuccess(null)
    try {
      const machine = await addMachine(token, name)
      setList((prev) => {
        if (prev.some((m) => m.id === machine.id)) return prev
        return [...prev, machine].sort((a, b) =>
          a.name.localeCompare(b.name, 'tr'),
        )
      })
      setAddSuccess(`"${machine.name}" eklendi`)
      setNewName('')
      setShowAddForm(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Makina eklenemedi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide machines-page">
        <header className="machines-intro">
          <div className="machines-intro-row">
            <div>
              <h1 className="machines-page-title">Makineler</h1>
              <p className="machines-hint">
                Servis ve uzaktan servis kayıtlarında seçilecek makineleri buradan
                yönetin. Personel makina adını manuel giremez.
              </p>
            </div>
            <button
              type="button"
              className="machines-add-btn"
              onClick={openAddForm}
              disabled={loading}
            >
              Makina ekle
            </button>
          </div>
        </header>

        {showAddForm ? (
          <form className="machines-add-form" onSubmit={handleAddSubmit}>
            <label className="machines-add-field">
              <span className="machines-add-label">Makina adı</span>
              <input
                className="machines-add-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn. CNC Torna X500"
                disabled={submitting}
                autoFocus
              />
            </label>
            {addError ? (
              <div className="machines-add-error" role="alert">
                {addError}
              </div>
            ) : null}
            <div className="machines-add-actions">
              <button
                type="button"
                className="machines-add-cancel"
                onClick={closeAddForm}
                disabled={submitting}
              >
                İptal
              </button>
              <button
                type="submit"
                className="machines-add-submit"
                disabled={submitting}
              >
                {submitting ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>
        ) : null}

        {addSuccess ? (
          <div className="machines-success" role="status">
            {addSuccess}
          </div>
        ) : null}

        <div className="machines-toolbar">
          <label className="machines-search-label" htmlFor="machines-search">
            Ara
          </label>
          <input
            id="machines-search"
            className="machines-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Makina adı ara…"
            disabled={loading}
          />
          <p className="machines-count" aria-live="polite">
            {loading
              ? 'Liste yükleniyor…'
              : query.trim()
                ? `${filtered.length} / ${list.length} makina`
                : `${list.length} makina`}
          </p>
        </div>

        {error ? (
          <div className="machines-error" role="alert">
            {error}
          </div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <p className="machines-empty">
            {list.length === 0
              ? 'Henüz makina kaydı yok. Yukarıdan ekleyebilirsiniz.'
              : 'Aramanızla eşleşen makina bulunamadı.'}
          </p>
        ) : null}

        <ul className="machines-grid">
          {filtered.map((machine) => (
            <li key={machine.id} className="machines-card">
              <span className="machines-card-name">{machine.name}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
