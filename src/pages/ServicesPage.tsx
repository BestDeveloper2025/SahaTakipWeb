import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getAllCustomers, type CustomerListItem } from '../api/customers'
import { getAllMachines, type MachineListItem } from '../api/machines'
import {
  createService,
  getAllServices,
  getInProgressServices,
  getServiceCreatedTimeToday,
  SERVICE_LANGUAGE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  type ServiceListItem,
} from '../api/service'
import {
  ServiceStatusBadge,
  formatServiceDate,
  serviceListKey,
} from '../components/ServiceStatusBadge'
import { MachineSearchSelect } from '../components/MachineSearchSelect'
import './ServicesPage.css'

const emptyCreateForm = {
  serviceNumber: '',
  customerId: '',
  language: 'TR',
  serviceType: 'Bakım',
  machineId: '',
  problemDescription: '',
}

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

  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [machines, setMachines] = useState<MachineListItem[]>([])
  const [machinesLoading, setMachinesLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  const [listVersion, setListVersion] = useState(0)
  const [openingForm, setOpeningForm] = useState(false)

  const countLabel = useMemo(() => {
    if (tab === 'active') return `${list.length} devam eden`
    if (tab === 'completed') return `${list.length} tamamlanan`
    return `${list.length} kayıt`
  }, [list.length, tab])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getAllCustomers(token)
      .then((rows) => {
        if (!cancelled) setCustomers(rows)
      })
      .catch(() => {
        /* create form müşteri yükleyemezse submit zaten uyarır */
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token || !showAddForm) return
    let cancelled = false
    setMachinesLoading(true)
    getAllMachines(token)
      .then((rows) => {
        if (!cancelled) setMachines(rows)
      })
      .catch(() => {
        if (!cancelled) setMachines([])
      })
      .finally(() => {
        if (!cancelled) setMachinesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, showAddForm])

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
  }, [token, tab, listVersion])

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

  async function openAddForm() {
    if (!token) return
    setAddError(null)
    setAddSuccess(null)
    setOpeningForm(true)
    try {
      const all = await getAllServices(token)
      const nums = all
        .map((s) => Number.parseInt(String(s.serviceNumber).trim(), 10))
        .filter((n) => Number.isFinite(n))
      const next = (nums.length ? Math.max(...nums) : 0) + 1
      setCreateForm({ ...emptyCreateForm, serviceNumber: String(next) })
      setShowAddForm(true)
    } catch (e) {
      setAddError(
        e instanceof Error ? e.message : 'Sonraki servis numarası alınamadı',
      )
    } finally {
      setOpeningForm(false)
    }
  }

  function closeAddForm() {
    setShowAddForm(false)
    setCreateForm(emptyCreateForm)
    setAddError(null)
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return

    const serviceNumber = createForm.serviceNumber.trim()
    const machineId = createForm.machineId.trim()
    const problemDescription = createForm.problemDescription.trim()

    if (!serviceNumber) {
      setAddError('Servis numarası boş olamaz')
      return
    }
    if (!createForm.customerId) {
      setAddError('Müşteri seçmelisiniz')
      return
    }
    if (!createForm.language) {
      setAddError('Dil seçmelisiniz')
      return
    }
    if (!createForm.serviceType) {
      setAddError('Servis türü boş olamaz')
      return
    }
    if (!machineId) {
      setAddError('Makina seçmelisiniz')
      return
    }
    if (!problemDescription) {
      setAddError('Servis açıklaması boş olamaz')
      return
    }

    setSubmitting(true)
    setAddError(null)
    setAddSuccess(null)
    try {
      await createService(token, {
        serviceNumber,
        serviceType: createForm.serviceType,
        customerId: createForm.customerId,
        machineId,
        problemDescription,
        createdTime: getServiceCreatedTimeToday(),
        language: createForm.language,
      })
      setAddSuccess('Servis başarıyla eklendi')
      setShowAddForm(false)
      setCreateForm(emptyCreateForm)
      setListVersion((v) => v + 1)
      if (tab !== 'all') setParams({})
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Servis eklenemedi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shell">
      <main className="shell-main shell-main--wide services-page" id="servisler-ust">
        <header className="services-intro">
          <div className="services-intro-row">
            <div>
              <h1 className="services-page-title">Servis kayıtları</h1>
              <ol className="services-hint" aria-label="Nasıl kullanılır">
                <li>Üstten filtre seçin (tümü / devam eden / tamamlanan).</li>
                <li>
                  Karttan servise tıklayın; detayda personel atayabilirsiniz.
                </li>
              </ol>
            </div>
            <button
              type="button"
              className="services-add-btn"
              onClick={() => void openAddForm()}
              disabled={loading || openingForm}
            >
              {openingForm ? 'Hazırlanıyor…' : 'Servis ekle'}
            </button>
          </div>
        </header>

        {showAddForm ? (
          <form className="services-add-form" onSubmit={(e) => void handleCreateSubmit(e)}>
            <h2 className="services-add-title">Yeni Servis Ekle</h2>
            <div className="services-add-fields">
              <label className="services-add-field">
                <span>Servis numarası</span>
                <input
                  className="services-add-input services-add-input--readonly"
                  type="text"
                  value={createForm.serviceNumber}
                  readOnly
                  disabled={submitting}
                />
              </label>
              <label className="services-add-field">
                <span>Müşteri</span>
                <select
                  className="services-add-input"
                  value={createForm.customerId}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, customerId: e.target.value }))
                  }
                  disabled={submitting}
                  autoFocus
                >
                  <option value="">Müşteri seçin</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (#{c.orderNumber})
                    </option>
                  ))}
                </select>
              </label>
              <label className="services-add-field">
                <span>Dil</span>
                <select
                  className="services-add-input"
                  value={createForm.language}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, language: e.target.value }))
                  }
                  disabled={submitting}
                >
                  {SERVICE_LANGUAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="services-add-field">
                <span>Servis türü</span>
                <select
                  className="services-add-input"
                  value={createForm.serviceType}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      serviceType: e.target.value,
                    }))
                  }
                  disabled={submitting}
                >
                  {SERVICE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="services-add-field">
                <span>Makina</span>
                <MachineSearchSelect
                  machines={machines}
                  value={createForm.machineId}
                  onChange={(machineId) =>
                    setCreateForm((f) => ({ ...f, machineId }))
                  }
                  disabled={submitting}
                  loading={machinesLoading}
                />
              </label>
              <label className="services-add-field services-add-field--full">
                <span>Servis açıklaması</span>
                <textarea
                  className="services-add-textarea"
                  value={createForm.problemDescription}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      problemDescription: e.target.value,
                    }))
                  }
                  rows={4}
                  disabled={submitting}
                />
              </label>
            </div>
            <div className="services-add-actions">
              <button
                type="submit"
                className="services-add-submit"
                disabled={submitting}
              >
                {submitting ? 'Ekleniyor…' : 'Kaydet'}
              </button>
              <button
                type="button"
                className="services-add-cancel"
                onClick={closeAddForm}
                disabled={submitting}
              >
                İptal
              </button>
            </div>
            {addError ? (
              <p className="services-add-error" role="alert">
                {addError}
              </p>
            ) : null}
          </form>
        ) : null}

        {addSuccess ? (
          <p className="services-add-success" role="status">
            {addSuccess}
          </p>
        ) : null}

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
                  <Link
                    className="services-card"
                    to={`/servisler/${encodeURIComponent(id)}`}
                  >
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
