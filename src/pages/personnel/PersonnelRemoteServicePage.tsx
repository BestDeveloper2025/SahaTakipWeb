import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import {
  buildQuotaWarningMessage,
  createRemoteService,
  durationMinutes,
  getCurrentDateDDMMYYYY,
  getPersonnelCustomers,
  getRemoteUsage,
  type CreateRemoteServicePayload,
  type CustomerListItem,
} from '../../api/personnelRemoteService'
import './PersonnelRemoteServicePage.css'

const emptyForm = {
  customerId: '',
  machineName: '',
  startTime: '',
  endTime: '',
  serviceDescription: '',
}

export function PersonnelRemoteServicePage() {
  const { token, userId } = useAuth()
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null)
  const [pendingRequest, setPendingRequest] =
    useState<CreateRemoteServicePayload | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setCustomersLoading(true)
    getPersonnelCustomers(token)
      .then((data) => {
        if (!cancelled) setCustomers(data)
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : 'Müşteri listesi yüklenemedi',
          )
      })
      .finally(() => {
        if (!cancelled) setCustomersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const clearForm = useCallback(() => {
    setForm(emptyForm)
  }, [])

  const performCreate = useCallback(
    async (request: CreateRemoteServicePayload) => {
      if (!token) return
      setQuotaWarning(null)
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      try {
        await createRemoteService(token, request)
        setSuccess('Servis başarıyla kaydedildi')
        clearForm()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Kayıt oluşturulamadı')
      } finally {
        setSubmitting(false)
        setPendingRequest(null)
        setQuotaWarning(null)
      }
    },
    [token, clearForm],
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
    if (!form.machineName.trim()) {
      setError('Makine adı boş olamaz')
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
      machineName: form.machineName.trim(),
      serviceDescription: form.serviceDescription.trim(),
      date: getCurrentDateDDMMYYYY(),
      startTime: form.startTime,
      endTime: form.endTime,
    }

    const newEntryMinutes = durationMinutes(form.startTime, form.endTime)
    setSubmitting(true)

    try {
      const usage = await getRemoteUsage(token, form.customerId)
      const projectedMinutes = usage.usedMinutes + newEntryMinutes
      if (projectedMinutes > usage.quotaMinutes) {
        setPendingRequest(request)
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
      // Kota kontrolü başarısız olursa kaydı engelleme (mobil ile aynı).
      await performCreate(request)
    }
  }

  function dismissQuotaWarning() {
    setQuotaWarning(null)
    setPendingRequest(null)
    setSubmitting(false)
  }

  function confirmQuotaWarning() {
    if (pendingRequest) void performCreate(pendingRequest)
  }

  return (
    <main className="personnel-remote shell-main shell-main--wide">
      <Link className="personnel-remote-back" to="/personel">
        ← Ana sayfa
      </Link>

      <header className="personnel-remote-head">
        <h1 className="personnel-remote-title">Uzaktan Servis</h1>
        <p className="personnel-remote-hint">
          Müşteri için uzaktan servis kaydı oluşturun. Kota aşımında uyarı
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
        <div className="personnel-remote-alert personnel-remote-alert--success" role="status">
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
              <span className="personnel-remote-label">Makine Adı</span>
              <input
                className="personnel-remote-input"
                type="text"
                value={form.machineName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, machineName: e.target.value }))
                }
                placeholder="Makine adını girin"
              />
            </label>
          </section>

          <section className="personnel-remote-section">
            <h2 className="personnel-remote-section-title">Servis Zamanı</h2>
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
