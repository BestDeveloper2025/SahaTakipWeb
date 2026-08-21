import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import {
  buildQuotaWarningMessage,
  createRemoteService,
  durationMinutes,
  formatDateToDDMMYYYY,
  getPersonnelCustomers,
  getRemoteUsage,
  getTodayIsoDate,
  QUOTA_EXCEEDED_SUCCESS_MESSAGE,
  type CreateRemoteServicePayload,
  type CustomerListItem,
} from '../../api/personnelRemoteService'
import { getAllMachines, type MachineListItem } from '../../api/machines'
import {
  getAllPersonnel,
  type PersonnelListItem,
} from '../../api/personnel'
import { MachineSearchSelect } from '../../components/MachineSearchSelect'
import './PersonnelRemoteServicePage.css'

const emptyForm = {
  customerId: '',
  machineId: '',
  date: getTodayIsoDate(),
  startTime: '',
  endTime: '',
  serviceDescription: '',
}

const MAX_PHOTOS = 5

type SelectedPhoto = {
  file: File
  previewUrl: string
}

export function PersonnelRemoteServicePage() {
  const { token, userId } = useAuth()
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [machines, setMachines] = useState<MachineListItem[]>([])
  const [personnel, setPersonnel] = useState<PersonnelListItem[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [machinesLoading, setMachinesLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [teamIds, setTeamIds] = useState<string[]>([])
  const [teamSearch, setTeamSearch] = useState('')
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null)
  const [pendingRequest, setPendingRequest] =
    useState<CreateRemoteServicePayload | null>(null)
  const [pendingQuotaExceeded, setPendingQuotaExceeded] = useState(false)

  const teammateOptions = useMemo(() => {
    const q = teamSearch.trim().toLocaleLowerCase('tr')
    return personnel.filter((p) => {
      if (!p.id || p.id === userId) return false
      if (!q) return true
      return p.name.toLocaleLowerCase('tr').includes(q)
    })
  }, [personnel, userId, teamSearch])

  const hasOtherPersonnel = useMemo(
    () => personnel.some((p) => p.id && p.id !== userId),
    [personnel, userId],
  )

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setCustomersLoading(true)
    setMachinesLoading(true)
    Promise.all([
      getPersonnelCustomers(token),
      getAllMachines(token).catch(() => [] as MachineListItem[]),
      getAllPersonnel(token).catch(() => [] as PersonnelListItem[]),
    ])
      .then(([customerRows, machineRows, personnelRows]) => {
        if (!cancelled) {
          setCustomers(customerRows)
          setMachines(machineRows)
          setPersonnel(personnelRows)
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : 'Müşteri listesi yüklenemedi',
          )
      })
      .finally(() => {
        if (!cancelled) {
          setCustomersLoading(false)
          setMachinesLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const clearForm = useCallback(() => {
    setForm({ ...emptyForm, date: getTodayIsoDate() })
    setTeamIds([])
    setTeamSearch('')
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      return []
    })
  }, [])

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
  }, [photos])

  function handlePhotoSelect(files: FileList | null) {
    if (!files) return
    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) {
      setError(`En fazla ${MAX_PHOTOS} fotoğraf ekleyebilirsiniz`)
      return
    }
    const next = Array.from(files)
      .slice(0, remaining)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    if (next.length === 0) return
    setPhotos((prev) => [...prev, ...next])
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const copy = [...prev]
      const removed = copy.splice(index, 1)[0]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return copy
    })
  }

  function toggleTeammate(id: string) {
    setTeamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const performCreate = useCallback(
    async (
      request: CreateRemoteServicePayload,
      options?: { quotaExceeded?: boolean },
    ) => {
      if (!token) return
      setQuotaWarning(null)
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      try {
        await createRemoteService(
          token,
          request,
          photos.map((p) => p.file),
        )
        setSuccess(
          options?.quotaExceeded
            ? QUOTA_EXCEEDED_SUCCESS_MESSAGE
            : 'Servis başarıyla kaydedildi',
        )
        clearForm()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Kayıt oluşturulamadı')
      } finally {
        setSubmitting(false)
        setPendingRequest(null)
        setPendingQuotaExceeded(false)
        setQuotaWarning(null)
      }
    },
    [token, clearForm, photos],
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!token || !userId) {
      setError('Kullanıcı bilgisi bulunamadı')
      return
    }
    if (!form.customerId) {
      setError('Müşteri seçmelisiniz')
      return
    }
    if (!form.machineId.trim()) {
      setError('Makina seçmelisiniz')
      return
    }
    if (!form.date) {
      setError('Tarih seçmelisiniz')
      return
    }
    if (!form.startTime) {
      setError('Başlangıç saati seçmelisiniz')
      return
    }
    if (!form.endTime) {
      setError('Bitiş saati seçmelisiniz')
      return
    }
    if (!form.serviceDescription.trim()) {
      setError('Servis açıklaması boş olamaz')
      return
    }

    const request: CreateRemoteServicePayload = {
      personnelID: userId,
      customerID: form.customerId,
      machineID: form.machineId,
      serviceDescription: form.serviceDescription.trim(),
      date: formatDateToDDMMYYYY(form.date),
      startTime: form.startTime,
      endTime: form.endTime,
      teamPersonnelIDs: teamIds,
    }

    const newEntryMinutes = durationMinutes(form.startTime, form.endTime)
    setSubmitting(true)

    try {
      const usage = await getRemoteUsage(token, form.customerId)
      const projectedMinutes = usage.usedMinutes + newEntryMinutes
      if (projectedMinutes > usage.quotaMinutes) {
        setPendingRequest(request)
        setPendingQuotaExceeded(true)
        setQuotaWarning(
          buildQuotaWarningMessage(
            usage.quotaHours,
            usage.usedMinutes,
            newEntryMinutes,
            projectedMinutes,
          ),
        )
        setSubmitting(false)
        return
      }
      await performCreate(request)
    } catch {
      await performCreate(request)
    }
  }

  function dismissQuotaWarning() {
    setQuotaWarning(null)
    setPendingRequest(null)
    setPendingQuotaExceeded(false)
    setSubmitting(false)
  }

  function confirmQuotaWarning() {
    if (pendingRequest)
      void performCreate(pendingRequest, {
        quotaExceeded: pendingQuotaExceeded,
      })
  }

  return (
    <main className="personnel-remote shell-main shell-main--wide">
      <Link className="personnel-remote-back" to="/personel/uzaktan-servis">
        ← Uzaktan servislere dön
      </Link>

      <header className="personnel-remote-head">
        <h1 className="personnel-remote-title">Yeni Uzaktan Servis</h1>
        <p className="personnel-remote-hint">
          Müşteri için uzaktan servis kaydı oluşturun. Birlikte çalıştığınız
          ekip arkadaşlarını da seçebilirsiniz. 20 saatlik kota aşımında uyarı
          gösterilir.
        </p>
      </header>

      {customersLoading ? (
        <p className="personnel-remote-loading">Yükleniyor…</p>
      ) : null}

      {error ? (
        <div className="personnel-remote-alert personnel-remote-alert--error" role="alert">
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className={
            success === QUOTA_EXCEEDED_SUCCESS_MESSAGE
              ? 'personnel-remote-alert personnel-remote-alert--warn'
              : 'personnel-remote-alert personnel-remote-alert--success'
          }
          role="status"
        >
          {success}
        </div>
      ) : null}

      {!customersLoading ? (
        <form className="personnel-remote-form" onSubmit={(e) => void handleSubmit(e)}>
          <section className="personnel-remote-section">
            <h2 className="personnel-remote-section-title">Müşteri Bilgileri</h2>
            <label className="personnel-remote-field">
              <span className="personnel-remote-label">Müşteri</span>
              <select
                className="personnel-remote-input"
                value={form.customerId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customerId: e.target.value }))
                }
              >
                <option value="">Müşteri seçin</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (#{c.orderNumber})
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="personnel-remote-section">
            <h2 className="personnel-remote-section-title">Makine Bilgileri</h2>
            <label className="personnel-remote-field">
              <span className="personnel-remote-label">Makina</span>
              <MachineSearchSelect
                machines={machines}
                value={form.machineId}
                onChange={(machineId) =>
                  setForm((prev) => ({ ...prev, machineId }))
                }
                disabled={submitting || customersLoading}
                loading={machinesLoading}
                placeholder="Makina ara veya seç…"
              />
            </label>
          </section>

          <section className="personnel-remote-section">
            <h2 className="personnel-remote-section-title">Ekip Arkadaşları</h2>
            <p className="personnel-remote-photo-hint">
              Opsiyonel — birlikte çalıştığınız kişileri seçin (birden fazla
              seçilebilir). Siz otomatik olarak kayda eklenirsiniz.
            </p>
            {!hasOtherPersonnel ? (
              <p className="personnel-remote-photo-hint">
                Seçilebilecek başka personel yok.
              </p>
            ) : (
              <>
                <label className="personnel-remote-field">
                  <span className="personnel-remote-label">Personel ara</span>
                  <input
                    className="personnel-remote-input"
                    type="search"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="İsim ile ara…"
                    disabled={submitting}
                  />
                </label>
                {teammateOptions.length === 0 ? (
                  <p className="personnel-remote-photo-hint">
                    Aramanızla eşleşen personel bulunamadı.
                  </p>
                ) : (
                  <ul className="personnel-remote-team-list">
                    {teammateOptions.map((p) => {
                      const checked = teamIds.includes(p.id)
                      return (
                        <li key={p.id}>
                          <label className="personnel-remote-team-item">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={submitting}
                              onChange={() => toggleTeammate(p.id)}
                            />
                            <span>{p.name}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}
          </section>

          <section className="personnel-remote-section">
            <h2 className="personnel-remote-section-title">Servis Zamanı</h2>
            <label className="personnel-remote-field">
              <span className="personnel-remote-label">Tarih</span>
              <input
                className="personnel-remote-input"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </label>
            <div className="personnel-remote-time-row">
              <label className="personnel-remote-field">
                <span className="personnel-remote-label">Başlangıç</span>
                <input
                  className="personnel-remote-input"
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </label>
              <label className="personnel-remote-field">
                <span className="personnel-remote-label">Bitiş</span>
                <input
                  className="personnel-remote-input"
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </label>
            </div>
          </section>

          <section className="personnel-remote-section">
            <h2 className="personnel-remote-section-title">Servis Detayları</h2>
            <label className="personnel-remote-field">
              <span className="personnel-remote-label">Servis Açıklaması</span>
              <textarea
                className="personnel-remote-textarea"
                value={form.serviceDescription}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    serviceDescription: e.target.value,
                  }))
                }
                placeholder="Yapılan işlemleri detaylı açıklayın"
                rows={5}
              />
            </label>
          </section>

          <section className="personnel-remote-section">
            <h2 className="personnel-remote-section-title">Fotoğraflar</h2>
            <p className="personnel-remote-photo-hint">
              Opsiyonel — en fazla {MAX_PHOTOS} fotoğraf (JPG, PNG).
            </p>
            <label className="personnel-remote-file-label">
              <span className="personnel-remote-label">Dosya seç</span>
              <input
                className="personnel-remote-file-input"
                type="file"
                accept="image/*"
                multiple
                disabled={photos.length >= MAX_PHOTOS || submitting}
                onChange={(e) => {
                  handlePhotoSelect(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
            {photos.length > 0 ? (
              <ul className="personnel-remote-photo-list">
                {photos.map((photo, index) => (
                  <li key={photo.previewUrl} className="personnel-remote-photo-item">
                    <img
                      src={photo.previewUrl}
                      alt={`Seçilen fotoğraf ${index + 1}`}
                      className="personnel-remote-photo-thumb"
                    />
                    <button
                      type="button"
                      className="personnel-remote-photo-remove"
                      onClick={() => removePhoto(index)}
                      disabled={submitting}
                    >
                      Kaldır
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <button
            type="submit"
            className="personnel-remote-submit"
            disabled={submitting}
          >
            {submitting ? 'Kaydediliyor…' : 'Servisi Kaydet'}
          </button>
        </form>
      ) : null}

      {quotaWarning ? (
        <div
          className="personnel-remote-modal-backdrop"
          role="presentation"
          onClick={dismissQuotaWarning}
        >
          <div
            className="personnel-remote-modal"
            role="dialog"
            aria-labelledby="quota-warning-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="quota-warning-title" className="personnel-remote-modal-title">
              Kota Aşımı Uyarısı
            </h2>
            <p className="personnel-remote-modal-text">{quotaWarning}</p>
            <div className="personnel-remote-modal-actions">
              <button
                type="button"
                className="personnel-remote-modal-btn personnel-remote-modal-btn--ghost"
                onClick={dismissQuotaWarning}
              >
                İptal
              </button>
              <button
                type="button"
                className="personnel-remote-modal-btn personnel-remote-modal-btn--primary"
                onClick={confirmQuotaWarning}
                disabled={submitting}
              >
                Yine de Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {submitting && !quotaWarning ? (
        <div className="personnel-remote-overlay" aria-hidden="true">
          <p>Kaydediliyor…</p>
        </div>
      ) : null}
    </main>
  )
}
