import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  addMachine,
  deleteMachine,
  filterMachinesByQuery,
  getAllMachines,
  updateMachine,
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

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
    setEditingId(null)
  }

  function closeAddForm() {
    setShowAddForm(false)
    setNewName('')
    setAddError(null)
  }

  function startEdit(machine: MachineListItem) {
    setEditingId(machine.id)
    setEditName(machine.name)
    setEditError(null)
    setShowAddForm(false)
    setAddSuccess(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditError(null)
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

  async function handleEditSubmit(e: FormEvent, machineId: string) {
    e.preventDefault()
    if (!token) return
    const name = editName.trim()
    if (!name) {
      setEditError('Makina adı gerekli')
      return
    }
    setSubmitting(true)
    setEditError(null)
    try {
      await updateMachine(token, machineId, name)
      setList((prev) =>
        [...prev]
          .map((m) => (m.id === machineId ? { ...m, name } : m))
          .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
      )
      setAddSuccess(`Makina adı "${name}" olarak güncellendi`)
      cancelEdit()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Makina güncellenemedi')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(machine: MachineListItem) {
    if (!token) return
    const ok = window.confirm(
      `"${machine.name}" makinasını silmek istediğinize emin misiniz?`,
    )
    if (!ok) return
    setDeletingId(machine.id)
    setError(null)
    try {
      const rows = await deleteMachine(token, machine.id)
      setList(rows)
      setAddSuccess(`"${machine.name}" silindi`)
      if (editingId === machine.id) cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Makina silinemedi')
    } finally {
      setDeletingId(null)
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
                Servis ve uzaktan servis kayıtları makineye ID ile bağlanır.
                İsim güncellendiğinde geçmiş kayıtlarda da güncel ad görünür.
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
              {editingId === machine.id ? (
                <form
                  className="machines-edit-form"
                  onSubmit={(e) => void handleEditSubmit(e, machine.id)}
                >
                  <input
                    className="machines-edit-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={submitting}
                    autoFocus
                  />
                  {editError ? (
                    <div className="machines-add-error" role="alert">
                      {editError}
                    </div>
                  ) : null}
                  <div className="machines-card-actions">
                    <button
                      type="button"
                      className="machines-card-btn machines-card-btn--ghost"
                      onClick={cancelEdit}
                      disabled={submitting}
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="machines-card-btn machines-card-btn--primary"
                      disabled={submitting}
                    >
                      Kaydet
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <span className="machines-card-name">{machine.name}</span>
                  <div className="machines-card-actions">
                    <button
                      type="button"
                      className="machines-card-btn machines-card-btn--ghost"
                      onClick={() => startEdit(machine)}
                      disabled={submitting || deletingId === machine.id}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="machines-card-btn machines-card-btn--danger"
                      onClick={() => void handleDelete(machine)}
                      disabled={submitting || deletingId === machine.id}
                    >
                      {deletingId === machine.id ? 'Siliniyor…' : 'Sil'}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
